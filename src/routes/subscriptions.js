const express = require('express');
const router = express.Router();
const { Subscriptions, User, Notifications } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { APILogger } = require('../utils/logger');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const SubscriptionMetrics = require('../utils/metrics');
const AuditLog = require('../utils/auditLog');
const { validatePaginationParams, createPaginationResponse } = require('../utils/pagination');

// Rate limiting for expensive operations
const subscriptionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // maximum 5 subscription operations per 15 minutes
  message: 'Слишком много операций с подписками, попробуйте позже'
});

// Validation schemas
const subscriptionSchema = Joi.object({
  subscription_type: Joi.string().valid('VIP', 'PREMIUM').required(),
  duration_months: Joi.number().valid(1, 3, 12).default(1),
  payment_method: Joi.string().valid('balance', 'card', 'yandex_money', 'qiwi', 'paypal', 'crypto').default('balance'),
  promo_code: Joi.string().optional(),
  auto_renewal: Joi.boolean().default(true)
});

const changePlanSchema = Joi.object({
  new_plan_type: Joi.string().valid('VIP', 'PREMIUM').required(),
  duration_months: Joi.number().valid(1, 3, 12).default(1)
});

// GET /api/subscriptions/pricing - Получение тарифов
router.get('/pricing', authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTIONS');
  
  try {
    logger.logRequest(req, 'GET /subscriptions/pricing');
    
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Получение тарифов', {
      user_id: userId
    }, req);

    const pricing = await Subscriptions.getPricing();
    const features = await Subscriptions.getFeatures();

    // Получаем текущую подписку пользователя
    const activeSubscription = await Subscriptions.getUserActiveSubscription(userId);
    
    // Получаем баланс пользователя
    const user = await User.findOne({ 
      where: { login: userId },
      attributes: ['balance', 'viptype']
    });

    const responseData = {
      pricing,
      features,
      user_balance: user.balance,
      current_subscription: {
        type: user.viptype,
        expires_at: activeSubscription ? activeSubscription.end_date : null,
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
router.post('/create', subscriptionRateLimit, authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTIONS');
  
  try {
    logger.logRequest(req, 'POST /subscriptions/create');
    
    const userId = req.user.login;

    // Validate input data
    const { error, value } = subscriptionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'validation_error',
        message: error.details[0].message
      });
    }

    const {
      subscription_type,
      duration_months,
      payment_method,
      promo_code,
      auto_renewal
    } = value;

    // Логируем входящие данные для отладки
    logger.logBusinessLogic(1, 'Входящие данные для создания подписки', {
      subscription_type,
      duration_months,
      payment_method,
      promo_code,
      auto_renewal,
      user_id: userId
    }, req);

    if (!subscription_type || !['VIP', 'PREMIUM'].includes(subscription_type)) {
      return res.status(400).json({
        error: 'invalid_subscription_type',
        message: 'Укажите корректный тип подписки (VIP или PREMIUM)'
      });
    }

    if (![1, 3, 12].includes(parseInt(duration_months))) {
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
      // Проверяем баланс пользователя перед созданием подписки
      const user = await User.findOne({ 
        where: { login: userId }
      });
      
      if (!user) {
        return res.status(404).json({
          error: 'user_not_found',
          message: 'Пользователь не найден'
        });
      }
      
      // Создаем подписку
      const subscription = await Subscriptions.createSubscription({
        user_id: userId,
        subscription_type,
        duration_months: parseInt(duration_months),
        payment_method,
        promo_code,
        auto_renewal
      });
      
      // Логируем информацию о созданной подписке
      logger.logBusinessLogic(2, 'Подписка создана', {
        subscription_id: subscription.id,
        payment_amount: subscription.payment_amount,
        user_balance: user.balance
      }, req);

      // Проверяем баланс если оплата с баланса
      if (payment_method === 'balance') {
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

        await User.update(
          { balance: user.balance - subscription.payment_amount },
          { where: { login: userId } }
        );

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

        // Record metrics and audit
        SubscriptionMetrics.recordSubscriptionCreated(subscription_type, subscription.payment_amount);
        AuditLog.logFinancialOperation(userId, 'subscription_created', subscription.payment_amount, {
          subscription_id: subscription.id,
          type: subscription_type,
          duration: duration_months
        });

        // Синхронизируем viptype пользователя с новой подпиской
        await Subscriptions.syncUserVipType(userId);

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

        // Record metrics and audit
        SubscriptionMetrics.recordSubscriptionCreated(subscription_type, subscription.payment_amount);
        AuditLog.logFinancialOperation(userId, 'subscription_created', subscription.payment_amount, {
          subscription_id: subscription.id,
          type: subscription_type,
          duration: duration_months
        });

        // Синхронизируем viptype пользователя с новой подпиской
        await Subscriptions.syncUserVipType(userId);

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

    // Синхронизируем viptype пользователя с реальным статусом подписки
    await Subscriptions.syncUserVipType(userId);
    
    const userStatus = await Subscriptions.getUserCurrentStatus(userId);
    
    let responseData;

    if (userStatus.has_subscription) {
      // Получаем детали активной подписки
      const activeSubscription = await Subscriptions.getUserActiveSubscription(userId);
      
      responseData = {
        has_subscription: true,
        plan: userStatus.plan.toLowerCase(),
        expires_at: userStatus.end_date,
        auto_renew: activeSubscription.auto_renewal,
        days_remaining: activeSubscription.getDaysRemaining(),
        subscription: {
          id: activeSubscription.id,
          type: activeSubscription.subscription_type,
          status: activeSubscription.status,
          start_date: activeSubscription.start_date,
          end_date: activeSubscription.end_date,
          auto_renewal: activeSubscription.auto_renewal,
          payment_amount: activeSubscription.payment_amount,
          is_active: activeSubscription.isActive(),
          created_at: activeSubscription.created_at
        },
        features: (await Subscriptions.getFeatures())[userStatus.plan]
      };
    } else {
      responseData = {
        has_subscription: false,
        plan: 'free', // Всегда 'free' для базового плана
        expires_at: null,
        auto_renew: false,
        days_remaining: 0,
        subscription: null,
        features: null // У базового плана нет features
      };
    }

    logger.logSuccess(req, 200, {
      has_subscription: userStatus.has_subscription,
      subscription_type: userStatus.plan
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

    // Отменяем подписку (это также сбросит статус пользователя на FREE)
    await subscription.cancel();
    
    // Обновляем заметки с причиной отмены
    if (reason) {
      await subscription.update({ notes: reason });
    }
    
    // Принудительно обновляем статус пользователя на FREE
    await User.update(
      { viptype: 'FREE' },
      { where: { login: userId } }
    );
    
    // Синхронизируем viptype для уверенности
    await Subscriptions.syncUserVipType(userId);

    // Создаем уведомление
    try {
      await Notifications.createNotification({
        user_id: userId,
        type: 'system',
        title: 'Подписка отменена',
        message: `Ваша ${subscription.subscription_type} подписка была отменена.`,
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
      message: 'Подписка отменена. Статус сброшен на базовый план'
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

// POST /api/subscriptions/cancel - Отмена активной подписки пользователя
router.post('/cancel', authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTIONS');
  
  try {
    logger.logRequest(req, 'POST /subscriptions/cancel');
    
    const { reason } = req.body;
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Отмена активной подписки', {
      user_id: userId,
      reason
    }, req);

    // Находим активную подписку пользователя
    const subscription = await Subscriptions.findOne({
      where: {
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
      subscription_id: subscription.id,
      status: 'cancelled',
      notes: reason
    }, req);

    // Отменяем подписку (это также сбросит статус пользователя на FREE)
    await subscription.cancel();
    
    // Обновляем заметки с причиной отмены
    if (reason) {
      await subscription.update({ notes: reason });
    }
    
    // Принудительно обновляем статус пользователя на FREE
    await User.update(
      { viptype: 'FREE' },
      { where: { login: userId } }
    );
    
    // Синхронизируем viptype для уверенности
    await Subscriptions.syncUserVipType(userId);

    // Создаем уведомление
    try {
      await Notifications.createNotification({
        user_id: userId,
        type: 'system',
        title: 'Подписка отменена',
        message: `Ваша ${subscription.subscription_type} подписка была отменена.`,
        priority: 'normal',
        data: {
          subscription_id: subscription.id,
          end_date: subscription.end_date
        }
      });
    } catch (notificationError) {
      logger.logWarning('Ошибка создания уведомления', notificationError, req);
    }

    // Record metrics and audit
    SubscriptionMetrics.recordSubscriptionCancelled(subscription.subscription_type, reason);
    AuditLog.logSubscriptionChange(userId, 'active', 'cancelled', reason);

    logger.logResult('Отмена подписки', true, {
      subscription_id: subscription.id,
      reason
    }, req);

    const responseData = {
      success: true,
      message: 'Подписка успешно отменена',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        end_date: subscription.end_date
      }
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

// PUT /api/subscriptions/auto-renewal - Управление автопродлением активной подписки
router.put('/auto-renewal', authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTIONS');
  
  try {
    logger.logRequest(req, 'PUT /subscriptions/auto-renewal');
    
    const { auto_renewal } = req.body;
    const userId = req.user.login;

    if (typeof auto_renewal !== 'boolean') {
      return res.status(400).json({
        error: 'invalid_data',
        message: 'Параметр auto_renewal должен быть boolean'
      });
    }

    logger.logBusinessLogic(1, 'Управление автопродлением активной подписки', {
      user_id: userId,
      auto_renewal
    }, req);

    // Находим активную подписку пользователя
    const subscription = await Subscriptions.findOne({
      where: {
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
      subscription_id: subscription.id,
      auto_renewal
    }, req);

    // Обновляем автопродление
    await subscription.update({ auto_renewal });

    // Record metrics and audit
    SubscriptionMetrics.recordAutoRenewal(subscription.subscription_type, true);
    AuditLog.logAutoRenewalChange(userId, subscription.id, auto_renewal);

    logger.logResult('Изменение автопродления', true, {
      subscription_id: subscription.id,
      auto_renewal
    }, req);

    const responseData = {
      success: true,
      message: `Автопродление ${auto_renewal ? 'включено' : 'отключено'}`,
      subscription: {
        id: subscription.id,
        auto_renewal: subscription.auto_renewal
      }
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при изменении автопродления'
    });
  }
});

// GET /api/subscriptions/history - История подписок
router.get('/history', authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTIONS');
  
  try {
    logger.logRequest(req, 'GET /subscriptions/history');
    
    const {
      page,
      limit,
      status = null
    } = req.query;

    const userId = req.user.login;
    
    // Валидация параметров пагинации
    const { page: pageNum, limit: limitNum, offset } = validatePaginationParams(
      { page, limit },
      { defaultPage: 1, defaultLimit: 20, maxLimit: 100 }
    );

    logger.logBusinessLogic(1, 'Получение истории подписок', {
      user_id: userId,
      page: pageNum,
      limit: limitNum,
      status
    }, req);

    const subscriptions = await Subscriptions.getUserSubscriptionHistory(userId, {
      limit: limitNum,
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
      pagination: createPaginationResponse(pageNum, limitNum, totalCount),
      // ADD: payments array for frontend compatibility
      payments: subscriptions.map(sub => ({
        id: sub.id,
        plan: sub.subscription_type.toLowerCase(),
        amount: sub.payment_amount,
        created_at: sub.created_at,
        status: sub.status
      }))
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
    
    const { promo_code, subscription_type = 'VIP', duration_months = 1 } = req.body;
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
    const pricing = await Subscriptions.getPricing();
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

    // Record metrics and audit
    SubscriptionMetrics.recordPromoCodeUsed(promo_code, discountAmount, subscription_type);
    AuditLog.logPromoCodeUsage(userId, promo_code, discountAmount, subscription_type);

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

// POST /api/subscriptions/change-plan - Смена тарифного плана
router.post('/change-plan', subscriptionRateLimit, authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTIONS');
  
  try {
    logger.logRequest(req, 'POST /subscriptions/change-plan');
    
    const userId = req.user.login;

    // Validate input data
    const { error, value } = changePlanSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'validation_error',
        message: error.details[0].message
      });
    }

    const {
      new_plan_type,
      duration_months
    } = value;

    if (!new_plan_type || !['VIP', 'PREMIUM'].includes(new_plan_type)) {
      return res.status(400).json({
        error: 'invalid_plan_type',
        message: 'Укажите корректный тип тарифного плана (VIP или PREMIUM)'
      });
    }

    if (![1, 3, 12].includes(parseInt(duration_months))) {
      return res.status(400).json({
        error: 'invalid_duration',
        message: 'Поддерживаемые периоды: 1, 3 или 12 месяцев'
      });
    }

    logger.logBusinessLogic(1, 'Смена тарифного плана', {
      user_id: userId,
      new_plan_type,
      duration_months: parseInt(duration_months)
    }, req);

    try {
      // Импортируем SubscriptionManager
      const SubscriptionManager = require('../../services/SubscriptionManager');
      const subscriptionManager = new SubscriptionManager();
      
      // Выполняем смену тарифного плана
      const result = await subscriptionManager.changeSubscriptionPlan(
        userId, 
        new_plan_type, 
        parseInt(duration_months)
      );

      // Record metrics and audit
      SubscriptionMetrics.recordPlanChange('unknown', new_plan_type, result.new_subscription.payment_amount);
      AuditLog.logPlanChange(userId, 'unknown', new_plan_type, result.new_subscription.payment_amount);

      // Синхронизируем viptype пользователя с новым планом
      await Subscriptions.syncUserVipType(userId);

      logger.logResult('Смена тарифного плана', true, {
        new_plan: new_plan_type,
        subscription_id: result.new_subscription.id,
        new_balance: result.new_balance
      }, req);

      const responseData = {
        success: true,
        message: `Тарифный план успешно изменен на ${new_plan_type}`,
        new_subscription: {
          id: result.new_subscription.id,
          type: result.new_subscription.subscription_type,
          status: result.new_subscription.status,
          start_date: result.new_subscription.start_date,
          end_date: result.new_subscription.end_date,
          auto_renewal: result.new_subscription.auto_renewal
        },
        new_balance: result.new_balance
      };

      logger.logSuccess(req, 200, responseData);
      res.json(responseData);

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
      message: 'Ошибка при смене тарифного плана'
    });
  }
});

module.exports = router;