const express = require('express');
const router = express.Router();
const { Subscriptions, User, Notifications } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { APILogger } = require('../utils/logger');

// GET /api/subscriptions/pricing - Получение тарифов
router.get('/pricing', authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTIONS');
  
  try {
    logger.logRequest(req, 'GET /subscriptions/pricing');
    
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Получение тарифов', {
      user_id: userId
    }, req);

    const pricing = Subscriptions.getPricing();
    const features = Subscriptions.getFeatures();

    // Получаем текущую подписку пользователя
    const activeSubscription = await Subscriptions.getUserActiveSubscription(userId);
    
    // Получаем баланс пользователя
    const user = await User.findOne({ 
      where: { login: userId },
      attributes: ['balance', 'viptype', 'vip_expires_at']
    });

    const responseData = {
      pricing,
      features,
      user_balance: user.balance,
      current_subscription: {
        type: user.viptype,
        expires_at: user.vip_expires_at,
        is_active: activeSubscription ? activeSubscription.isActive() : false,
        days_remaining: activeSubscription ? activeSubscription.getDaysRemaining() : 0
      },
      available_payment_methods: [
        { id: 'balance', name: 'Баланс аккаунта', icon: '💳' },
        { id: 'card', name: 'Банковская карта', icon: '💳' },
        { id: 'yandex_money', name: 'ЮMoney', icon: '🟡' },
        { id: 'qiwi', name: 'QIWI', icon: '🥝' },
        { id: 'paypal', name: 'PayPal', icon: '🅿️' },
        { id: 'crypto', name: 'Криптовалюта', icon: '₿' }
      ]
    };

    logger.logSuccess(req, 200, {
      current_subscription_type: user.viptype
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении тарифов'
    });
  }
});

// POST /api/subscriptions/create - Создание подписки
router.post('/create', authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTIONS');
  
  try {
    logger.logRequest(req, 'POST /subscriptions/create');
    
    const {
      subscription_type,
      duration_months = 1,
      payment_method = 'balance',
      promo_code = null,
      auto_renewal = false
    } = req.body;

    const userId = req.user.login;

    if (!subscription_type || !['VIP', 'PREMIUM'].includes(subscription_type)) {
      return res.status(400).json({
        error: 'invalid_subscription_type',
        message: 'Укажите корректный тип подписки (VIP или PREMIUM)'
      });
    }

    if (!![1, 3, 12].includes(parseInt(duration_months))) {
      return res.status(400).json({
        error: 'invalid_duration',
        message: 'Поддерживаемые периоды: 1, 3 или 12 месяцев'
      });
    }

    logger.logBusinessLogic(1, 'Создание подписки', {
      user_id: userId,
      subscription_type,
      duration_months: parseInt(duration_months),
      payment_method,
      promo_code,
      auto_renewal
    }, req);

    try {
      // Создаем подписку
      const subscription = await Subscriptions.createSubscription({
        user_id: userId,
        subscription_type,
        duration_months: parseInt(duration_months),
        payment_method,
        promo_code,
        auto_renewal
      });

      // Проверяем баланс если оплата с баланса
      if (payment_method === 'balance') {
        const user = await User.findOne({ where: { login: userId } });
        
        if (user.balance < subscription.payment_amount) {
          // Удаляем созданную подписку
          await subscription.destroy();
          
          return res.status(400).json({
            error: 'insufficient_balance',
            message: 'Недостаточно средств на балансе',
            required: subscription.payment_amount,
            available: user.balance
          });
        }

        // Списываем средства и активируем подписку
        logger.logDatabase('UPDATE', 'users', {
          user_id: userId,
          balance_change: -subscription.payment_amount
        }, req);

        await user.update({
          balance: user.balance - subscription.payment_amount
        });

        logger.logDatabase('UPDATE', 'subscriptions', {
          subscription_id: subscription.id,
          status: 'active'
        }, req);

        await subscription.activate();

        // Создаем уведомление об активации
        try {
          await Notifications.createNotification({
            user_id: userId,
            type: 'premium',
            title: 'Подписка активирована!',
            message: `Ваша ${subscription_type} подписка активирована до ${subscription.end_date.toLocaleDateString('ru-RU')}`,
            priority: 'high',
            data: {
              subscription_id: subscription.id,
              subscription_type,
              end_date: subscription.end_date
            }
          });
        } catch (notifError) {
          logger.logWarning('Ошибка создания уведомления', notifError, req);
        }

        logger.logResult('Активация подписки', true, {
          subscription_id: subscription.id,
          subscription_type,
          end_date: subscription.end_date
        }, req);

        const responseData = {
          success: true,
          subscription: {
            id: subscription.id,
            type: subscription.subscription_type,
            status: subscription.status,
            start_date: subscription.start_date,
            end_date: subscription.end_date,
            payment_amount: subscription.payment_amount,
            auto_renewal: subscription.auto_renewal
          },
          remaining_balance: user.balance - subscription.payment_amount,
          message: 'Подписка успешно активирована'
        };

        logger.logSuccess(req, 201, responseData);
        res.status(201).json(responseData);

      } else {
        // Для других способов оплаты возвращаем информацию для оплаты
        const responseData = {
          success: true,
          subscription: {
            id: subscription.id,
            type: subscription.subscription_type,
            status: subscription.status,
            payment_amount: subscription.payment_amount,
            payment_method: subscription.payment_method
          },
          payment_info: {
            amount: subscription.payment_amount,
            currency: subscription.currency,
            description: `${subscription_type} подписка на ${duration_months} мес.`
          },
          message: 'Подписка создана, ожидает оплаты'
        };

        logger.logSuccess(req, 201, responseData);
        res.status(201).json(responseData);
      }

    } catch (subscriptionError) {
      logger.logError(req, subscriptionError);
      
      return res.status(400).json({
        error: 'subscription_error',
        message: subscriptionError.message
      });
    }

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при создании подписки'
    });
  }
});

// GET /api/subscriptions/current - Получение текущей подписки
router.get('/current', authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTIONS');
  
  try {
    logger.logRequest(req, 'GET /subscriptions/current');
    
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Получение текущей подписки', {
      user_id: userId
    }, req);

    const activeSubscription = await Subscriptions.getUserActiveSubscription(userId);
    const user = await User.findOne({ 
      where: { login: userId },
      attributes: ['viptype', 'vip_expires_at']
    });

    let responseData;

    if (activeSubscription) {
      responseData = {
        has_subscription: true,
        subscription: {
          id: activeSubscription.id,
          type: activeSubscription.subscription_type,
          status: activeSubscription.status,
          start_date: activeSubscription.start_date,
          end_date: activeSubscription.end_date,
          auto_renewal: activeSubscription.auto_renewal,
          payment_amount: activeSubscription.payment_amount,
          days_remaining: activeSubscription.getDaysRemaining(),
          is_active: activeSubscription.isActive(),
          created_at: activeSubscription.created_at
        },
        features: Subscriptions.getFeatures()[activeSubscription.subscription_type]
      };
    } else {
      responseData = {
        has_subscription: false,
        user_type: user.viptype,
        expires_at: user.vip_expires_at,
        features: user.viptype !== 'FREE' ? Subscriptions.getFeatures()[user.viptype] : null
      };
    }

    logger.logSuccess(req, 200, {
      has_subscription: !!activeSubscription,
      subscription_type: activeSubscription ? activeSubscription.subscription_type : user.viptype
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении подписки'
    });
  }
});

// POST /api/subscriptions/:id/cancel - Отмена подписки
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTIONS');
  
  try {
    logger.logRequest(req, 'POST /subscriptions/:id/cancel');
    
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Отмена подписки', {
      user_id: userId,
      subscription_id: id,
      reason
    }, req);

    const subscription = await Subscriptions.findOne({
      where: {
        id: parseInt(id),
        user_id: userId,
        status: 'active'
      }
    });

    if (!subscription) {
      return res.status(404).json({
        error: 'subscription_not_found',
        message: 'Активная подписка не найдена'
      });
    }

    logger.logDatabase('UPDATE', 'subscriptions', {
      subscription_id: id,
      status: 'cancelled',
      notes: reason
    }, req);

    // Отменяем подписку
    await subscription.cancel();
    
    // Обновляем заметки с причиной отмены
    if (reason) {
      await subscription.update({ notes: reason });
    }

    // Создаем уведомление
    try {
      await Notifications.createNotification({
        user_id: userId,
        type: 'system',
        title: 'Подписка отменена',
        message: `Ваша ${subscription.subscription_type} подписка была отменена. Доступ сохранится до ${subscription.end_date.toLocaleDateString('ru-RU')}`,
        priority: 'normal',
        data: {
          subscription_id: subscription.id,
          end_date: subscription.end_date
        }
      });
    } catch (notifError) {
      logger.logWarning('Ошибка создания уведомления', notifError, req);
    }

    logger.logResult('Отмена подписки', true, {
      subscription_id: id,
      end_date: subscription.end_date
    }, req);

    const responseData = {
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        end_date: subscription.end_date,
        auto_renewal: subscription.auto_renewal
      },
      message: 'Подписка отменена. Доступ сохранится до окончания оплаченного периода'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при отмене подписки'
    });
  }
});

// PUT /api/subscriptions/:id/auto-renewal - Управление автопродлением
router.put('/:id/auto-renewal', authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTIONS');
  
  try {
    logger.logRequest(req, 'PUT /subscriptions/:id/auto-renewal');
    
    const { id } = req.params;
    const { enabled } = req.body;
    const userId = req.user.login;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        error: 'invalid_data',
        message: 'Параметр enabled должен быть boolean'
      });
    }

    logger.logBusinessLogic(1, 'Управление автопродлением', {
      user_id: userId,
      subscription_id: id,
      enabled
    }, req);

    const subscription = await Subscriptions.findOne({
      where: {
        id: parseInt(id),
        user_id: userId,
        status: ['active', 'pending']
      }
    });

    if (!subscription) {
      return res.status(404).json({
        error: 'subscription_not_found',
        message: 'Подписка не найдена'
      });
    }

    logger.logDatabase('UPDATE', 'subscriptions', {
      subscription_id: id,
      auto_renewal: enabled
    }, req);

    await subscription.update({ auto_renewal: enabled });

    logger.logResult('Изменение автопродления', true, {
      subscription_id: id,
      auto_renewal: enabled
    }, req);

    const responseData = {
      success: true,
      subscription: {
        id: subscription.id,
        auto_renewal: subscription.auto_renewal
      },
      message: enabled ? 'Автопродление включено' : 'Автопродление отключено'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при изменении настроек автопродления'
    });
  }
});

// GET /api/subscriptions/history - История подписок
router.get('/history', authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTIONS');
  
  try {
    logger.logRequest(req, 'GET /subscriptions/history');
    
    const {
      page = 1,
      limit = 20,
      status = null
    } = req.query;

    const userId = req.user.login;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    logger.logBusinessLogic(1, 'Получение истории подписок', {
      user_id: userId,
      page: parseInt(page),
      limit: parseInt(limit),
      status
    }, req);

    const subscriptions = await Subscriptions.getUserSubscriptionHistory(userId, {
      limit: parseInt(limit),
      offset,
      status
    });

    // Подсчитываем общее количество
    const totalCount = await Subscriptions.count({
      where: { user_id: userId }
    });

    const responseData = {
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        type: sub.subscription_type,
        status: sub.status,
        start_date: sub.start_date,
        end_date: sub.end_date,
        payment_amount: sub.payment_amount,
        payment_method: sub.payment_method,
        auto_renewal: sub.auto_renewal,
        promo_code: sub.promo_code,
        discount_amount: sub.discount_amount,
        created_at: sub.created_at,
        days_remaining: sub.getDaysRemaining(),
        is_active: sub.isActive(),
        is_expired: sub.isExpired()
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };

    logger.logSuccess(req, 200, {
      subscriptions_count: subscriptions.length,
      total_count: totalCount
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении истории подписок'
    });
  }
});

// POST /api/subscriptions/validate-promo - Проверка промокода
router.post('/validate-promo', authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTIONS');
  
  try {
    logger.logRequest(req, 'POST /subscriptions/validate-promo');
    
    const { promo_code, subscription_type, duration_months } = req.body;
    const userId = req.user.login;

    if (!promo_code) {
      return res.status(400).json({
        error: 'missing_promo_code',
        message: 'Укажите промокод'
      });
    }

    logger.logBusinessLogic(1, 'Проверка промокода', {
      user_id: userId,
      promo_code,
      subscription_type,
      duration_months
    }, req);

    // Упрощенная система промокодов
    const promoCodes = {
      'WELCOME10': { discount: 0.1, description: 'Скидка 10% для новых пользователей' },
      'SAVE20': { discount: 0.2, description: 'Скидка 20%' },
      'PREMIUM30': { discount: 0.3, description: 'Скидка 30% на Premium', types: ['PREMIUM'] },
      'STUDENT15': { discount: 0.15, description: 'Скидка 15% для студентов' }
    };

    const promoData = promoCodes[promo_code.toUpperCase()];

    if (!promoData) {
      return res.status(404).json({
        error: 'invalid_promo_code',
        message: 'Промокод не найден или недействителен'
      });
    }

    // Проверяем ограничения промокода
    if (promoData.types && !promoData.types.includes(subscription_type)) {
      return res.status(400).json({
        error: 'promo_code_restriction',
        message: `Этот промокод действует только для ${promoData.types.join(', ')} подписки`
      });
    }

    // Рассчитываем скидку
    const pricing = Subscriptions.getPricing();
    let basePrice;
    
    switch (parseInt(duration_months)) {
      case 1:
        basePrice = pricing[subscription_type].monthly;
        break;
      case 3:
        basePrice = pricing[subscription_type].quarterly;
        break;
      case 12:
        basePrice = pricing[subscription_type].yearly;
        break;
      default:
        basePrice = pricing[subscription_type].monthly;
    }

    const discountAmount = Math.round(basePrice * promoData.discount);
    const finalPrice = basePrice - discountAmount;

    logger.logResult('Проверка промокода', true, {
      promo_code,
      discount_amount: discountAmount,
      final_price: finalPrice
    }, req);

    const responseData = {
      valid: true,
      promo_code,
      description: promoData.description,
      discount_percent: Math.round(promoData.discount * 100),
      original_price: basePrice,
      discount_amount: discountAmount,
      final_price: finalPrice,
      savings: discountAmount
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при проверке промокода'
    });
  }
});

module.exports = router;