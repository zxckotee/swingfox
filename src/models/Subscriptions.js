const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscriptions = sequelize.define('Subscriptions', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Пользователь'
    },
    subscription_type: {
      type: DataTypes.ENUM('VIP', 'PREMIUM'),
      allowNull: false,
      comment: 'Тип подписки'
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'cancelled', 'pending'),
      defaultValue: 'pending',
      comment: 'Статус подписки'
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Дата начала подписки'
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Дата окончания подписки'
    },
    auto_renewal: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Автопродление (всегда включено по умолчанию)'
    },
    payment_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Сумма платежа'
    },
    payment_method: {
      type: DataTypes.ENUM('balance', 'card', 'yandex_money', 'qiwi', 'paypal', 'crypto'),
      defaultValue: 'balance',
      comment: 'Способ оплаты'
    },
    payment_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'ID платежа во внешней системе'
    },
    promo_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Промокод'
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      comment: 'Размер скидки'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'RUB',
      comment: 'Валюта'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Заметки'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Дата создания'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Дата обновления'
    }
  }, {
    tableName: 'subscriptions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['subscription_type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['end_date']
      },
      {
        fields: ['auto_renewal']
      }
    ]
  });

  // Методы модели
  Subscriptions.prototype.activate = async function() {
    this.status = 'active';
    
    // Обновляем статус пользователя
    const user = await sequelize.models.User.findOne({ 
      where: { login: this.user_id } 
    });
    
    if (user) {
      await sequelize.models.User.update(
        { viptype: this.subscription_type },
        { where: { login: this.user_id } }
      );
    }
    
    await this.save();
    return this;
  };

  Subscriptions.prototype.cancel = async function() {
    this.status = 'cancelled';
    this.auto_renewal = false;
    
    // Сразу сбрасываем статус пользователя на FREE при отмене
    const user = await sequelize.models.User.findOne({ 
      where: { login: this.user_id } 
    });
    
    if (user && user.viptype === this.subscription_type) {
      await sequelize.models.User.update(
        { viptype: 'FREE' },
        { where: { login: this.user_id } }
      );
    }
    
    await this.save();
    return this;
  };

  Subscriptions.prototype.expire = async function() {
    this.status = 'expired';
    
    // Проверяем, есть ли более новые активные подписки
    const newerSubscription = await Subscriptions.findOne({
      where: {
        user_id: this.user_id,
        status: 'active',
        start_date: {
          [sequelize.Sequelize.Op.gte]: this.end_date
        }
      }
    });

    // Если нет новых подписок, сбрасываем статус пользователя
    if (!newerSubscription) {
      const user = await sequelize.models.User.findOne({ 
        where: { login: this.user_id } 
      });
      
      if (user) {
        await sequelize.models.User.update(
          { viptype: 'FREE' },
          { where: { login: this.user_id } }
        );
      }
    }
    
    await this.save();
    return this;
  };

  Subscriptions.prototype.isActive = function() {
    return this.status === 'active' && new Date() <= this.end_date;
  };

  Subscriptions.prototype.isExpired = function() {
    return new Date() > this.end_date;
  };

  Subscriptions.prototype.getDaysRemaining = function() {
    if (this.isExpired()) return 0;
    const diff = this.end_date.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Статические методы
  Subscriptions.getPricing = async function() {
    try {
      const plans = await sequelize.models.SubscriptionPlans.findAll({
        where: { is_active: true },
        attributes: ['type', 'monthly_price', 'quarterly_price', 'yearly_price']
      });
      
      const pricing = {};
      plans.forEach(plan => {
        pricing[plan.type] = {
          monthly: plan.monthly_price,
          quarterly: plan.quarterly_price,
          yearly: plan.yearly_price
        };
      });
      
      return pricing;
    } catch (error) {
      console.error('Error getting pricing from plans:', error);
      // Fallback к статическим данным
      return {
        VIP: {
          monthly: 299,
          quarterly: 799,
          yearly: 2999
        },
        PREMIUM: {
          monthly: 499,
          quarterly: 1399,
          yearly: 4999
        }
      };
    }
  };

  Subscriptions.getFeatures = async function() {
    try {
      const plans = await sequelize.models.SubscriptionPlans.findAll({
        where: { is_active: true },
        attributes: ['type', 'features']
      });
      
      const features = {};
      plans.forEach(plan => {
        features[plan.type] = plan.features;
      });
      
      return features;
    } catch (error) {
      console.error('Error getting features from plans:', error);
      // Fallback к статическим данным
      return {
        VIP: {
          superlikes_daily: 5,
          attention_weekly: 1,
          hide_online: true,
          private_photos: true,
          see_likes: true,
          carousel: true,
          see_visits: true,
          unlimited_likes: true,
          priority_support: false,
          exclusive_events: false
        },
        PREMIUM: {
          superlikes_daily: 10,
          attention_weekly: 3,
          hide_online: true,
          private_photos: true,
          see_likes: true,
          carousel: true,
          see_visits: true,
          unlimited_likes: true,
          priority_support: true,
          exclusive_events: true,
          custom_badges: true,
          boost_profile: true
        }
      };
    }
  };

  Subscriptions.createSubscription = async function(subscriptionData) {
    const {
      user_id,
      subscription_type,
      duration_months = 1,
      payment_method = 'balance',
      promo_code = null,
      auto_renewal = false
    } = subscriptionData;

    try {
      // Получаем план подписки из новой системы
      const plan = await sequelize.models.SubscriptionPlans.findOne({
        where: { type: subscription_type, is_active: true }
      });

      if (!plan) {
        throw new Error(`План подписки ${subscription_type} не найден`);
      }

      let basePrice;
      switch (duration_months) {
        case 1:
          basePrice = plan.monthly_price;
          break;
        case 3:
          basePrice = plan.quarterly_price;
          break;
        case 12:
          basePrice = plan.yearly_price;
          break;
        default:
          throw new Error('Неподдерживаемая длительность подписки');
      }

      // Применяем промокод (упрощенная версия)
      let discount = 0;
      if (promo_code) {
        // Здесь должна быть логика проверки промокода
        // Для примера дадим скидку 10%
        if (promo_code === 'WELCOME10') {
          discount = basePrice * 0.1;
        }
      }

      const finalPrice = basePrice - discount;

      // Рассчитываем даты
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + duration_months);

      // Создаем подписку
      const subscription = await this.create({
        user_id,
        subscription_type,
        start_date: startDate,
        end_date: endDate,
        auto_renewal,
        payment_amount: finalPrice,
        payment_method,
        promo_code,
        discount_amount: discount,
        status: 'pending'
      });

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  };

  Subscriptions.getUserActiveSubscription = async function(userId) {
    try {
      const subscription = await this.findOne({
        where: {
          user_id: userId,
          status: 'active', // Только активные подписки
          end_date: {
            [sequelize.Sequelize.Op.gt]: new Date() // Только не истекшие
          }
        },
        order: [['end_date', 'DESC']]
      });

      // Если подписка найдена, но статус пользователя не соответствует, исправляем
      if (subscription) {
        const user = await sequelize.models.User.findOne({ 
          where: { login: userId },
          attributes: ['viptype']
        });
        
        if (user && user.viptype !== subscription.subscription_type) {
          await sequelize.models.User.update(
            { viptype: subscription.subscription_type },
            { where: { login: userId } }
          );
        }
      }

      return subscription;
    } catch (error) {
      console.error('Error getting active subscription:', error);
      throw error;
    }
  };

  // Получаем текущий статус пользователя (с учетом отмененных подписок)
  Subscriptions.getUserCurrentStatus = async function(userId) {
    try {
      // Сначала ищем активную подписку
      const activeSubscription = await this.getUserActiveSubscription(userId);
      
      if (activeSubscription) {
        return {
          has_subscription: true,
          plan: activeSubscription.subscription_type,
          status: 'active',
          end_date: activeSubscription.end_date
        };
      }
      
      // Если активной подписки нет, всегда возвращаем FREE план
      return {
        has_subscription: false,
        plan: 'FREE',
        status: 'free',
        end_date: null
      };
    } catch (error) {
      console.error('Error getting user current status:', error);
      throw error;
    }
  };

  // Синхронизируем viptype пользователя с реальным статусом подписки
  Subscriptions.syncUserVipType = async function(userId) {
    try {
      // Получаем активную подписку
      const activeSubscription = await this.getUserActiveSubscription(userId);
      
      // Получаем пользователя
      const user = await sequelize.models.User.findOne({ 
        where: { login: userId },
        attributes: ['viptype']
      });
      
      if (!user) {
        throw new Error('Пользователь не найден');
      }
      
      let newVipType = 'FREE';
      
      if (activeSubscription) {
        // Если есть активная подписка, устанавливаем её тип
        newVipType = activeSubscription.subscription_type;
      }
      
      // Обновляем viptype только если он отличается
      if (user.viptype !== newVipType) {
        await sequelize.models.User.update(
          { viptype: newVipType },
          { where: { login: userId } }
        );
        
        console.log(`🔄 [SUBSCRIPTIONS] Синхронизирован viptype для пользователя ${userId}: ${user.viptype} → ${newVipType}`);
      }
      
      return newVipType;
    } catch (error) {
      console.error(`❌ [SUBSCRIPTIONS] Ошибка синхронизации viptype для пользователя ${userId}:`, error);
      throw error;
    }
  };

  Subscriptions.getUserSubscriptionHistory = async function(userId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      status = null
    } = options;

    // Дополнительная валидация параметров
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const safeOffset = Math.max(0, parseInt(offset) || 0);

    const whereClause = { user_id: userId };
    
    if (status) {
      whereClause.status = status;
    }

    try {
      const subscriptions = await this.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit: safeLimit,
        offset: safeOffset
      });

      return subscriptions;
    } catch (error) {
      console.error('Error getting subscription history:', error);
      throw error;
    }
  };

  Subscriptions.renewSubscription = async function(subscriptionId) {
    try {
      const subscription = await this.findByPk(subscriptionId);
      
      if (!subscription) {
        throw new Error('Подписка не найдена');
      }

      if (!subscription.auto_renewal) {
        throw new Error('Автопродление отключено');
      }

      // Создаем новую подписку
      const newSubscription = await this.createSubscription({
        user_id: subscription.user_id,
        subscription_type: subscription.subscription_type,
        duration_months: 1, // По умолчанию на месяц
        payment_method: subscription.payment_method,
        auto_renewal: subscription.auto_renewal
      });

      return newSubscription;
    } catch (error) {
      console.error('Error renewing subscription:', error);
      throw error;
    }
  };

  Subscriptions.checkExpiredSubscriptions = async function() {
    try {
      const expiredSubscriptions = await this.findAll({
        where: {
          status: 'active',
          end_date: {
            [sequelize.Sequelize.Op.lt]: new Date()
          }
        }
      });

      for (const subscription of expiredSubscriptions) {
        await subscription.expire();
        
        // Пытаемся продлить если включено автопродление
        if (subscription.auto_renewal) {
          try {
            await this.renewSubscription(subscription.id);
          } catch (renewError) {
            console.error('Failed to renew subscription:', renewError);
          }
        }
      }

      return expiredSubscriptions.length;
    } catch (error) {
      console.error('Error checking expired subscriptions:', error);
      throw error;
    }
  };

  Subscriptions.getSubscriptionStats = async function(options = {}) {
    const {
      startDate = null,
      endDate = null
    } = options;

    const whereClause = {};
    
    if (startDate && endDate) {
      whereClause.created_at = {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      };
    }

    try {
      const stats = await this.findAll({
        where: whereClause,
        attributes: [
          'subscription_type',
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('payment_amount')), 'total_revenue']
        ],
        group: ['subscription_type', 'status'],
        raw: true
      });

      return stats;
    } catch (error) {
      console.error('Error getting subscription stats:', error);
      throw error;
    }
  };

  // Ассоциации
  Subscriptions.associate = function(models) {
    Subscriptions.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'login',
      as: 'User'
    });
    
    Subscriptions.belongsTo(models.SubscriptionPlans, {
      foreignKey: 'subscription_type',
      targetKey: 'type',
      as: 'Plan'
    });
  };

  // Новые методы для автоматического управления подписками
  Subscriptions.processAutoRenewal = async function() {
    try {
      // Находим все активные подписки с включенным автопродлением
      const autoRenewalSubscriptions = await this.findAll({
        where: {
          status: 'active',
          auto_renewal: true,
          end_date: {
            [sequelize.Sequelize.Op.lte]: new Date()
          }
        },
        include: [{
          model: sequelize.models.User,
          as: 'User',
          attributes: ['login', 'balance', 'viptype']
        }]
      });

      console.log(`📊 [SUBSCRIPTIONS] Найдено ${autoRenewalSubscriptions.length} подписок для автопродления`);

      for (const subscription of autoRenewalSubscriptions) {
        try {
          await this.processSingleAutoRenewal(subscription);
        } catch (error) {
          console.error(`❌ [SUBSCRIPTIONS] Ошибка автопродления подписки ${subscription.id}:`, error);
        }
      }

      return autoRenewalSubscriptions.length;
    } catch (error) {
      console.error('Error processing auto renewal:', error);
      throw error;
    }
  };

  Subscriptions.processSingleAutoRenewal = async function(subscription) {
    const user = subscription.User;
    
    try {
      // Получаем план подписки
      const plan = await sequelize.models.SubscriptionPlans.findOne({
        where: { type: subscription.subscription_type, is_active: true }
      });

      if (!plan) {
        throw new Error(`План ${subscription.subscription_type} не найден`);
      }

      const monthlyPrice = plan.monthly_price;

      // Проверяем баланс пользователя
      if (user.balance < monthlyPrice) {
        // Недостаточно средств - отключаем автопродление и сбрасываем статус
        subscription.auto_renewal = false;
        subscription.status = 'expired';
        await subscription.save();

        // Сбрасываем статус пользователя на FREE
        await sequelize.models.User.update(
          { viptype: 'FREE' },
          { where: { login: user.login } }
        );

        // Отправляем уведомление
        await sequelize.models.Notifications.create({
          user_id: user.login,
          type: 'subscription_expired',
          title: 'Подписка истекла',
          message: `Ваша подписка ${subscription.subscription_type} истекла из-за недостатка средств. Автопродление отключено.`,
          data: {
            subscription_id: subscription.id,
            subscription_type: subscription.subscription_type,
            balance_required: monthlyPrice,
            current_balance: user.balance
          }
        });

        console.log(`⚠️ [SUBSCRIPTIONS] Подписка ${subscription.id} истекла из-за недостатка средств`);
        return false;
      }

      // Списываем средства
      const newBalance = user.balance - monthlyPrice;
      await sequelize.models.User.update(
        { balance: newBalance },
        { where: { login: user.login } }
      );

      // Продлеваем подписку на месяц
      const newEndDate = new Date();
      newEndDate.setMonth(newEndDate.getMonth() + 1);
      
      subscription.end_date = newEndDate;
      await subscription.save();

      // Создаем запись о платеже
      await sequelize.models.SubscriptionPayments.create({
        subscription_id: subscription.id,
        user_id: user.login,
        amount: monthlyPrice,
        payment_method: 'balance',
        payment_type: 'auto_renewal',
        status: 'completed'
      });

      // Отправляем уведомление об успешном продлении
      await sequelize.models.Notifications.create({
        user_id: user.login,
        type: 'subscription_renewed',
        title: 'Подписка продлена',
        message: `Ваша подписка ${subscription.subscription_type} автоматически продлена на месяц. Списано ${monthlyPrice} фоксиков.`,
        data: {
          subscription_id: subscription.id,
          subscription_type: subscription.subscription_type,
          amount_charged: monthlyPrice,
          new_balance: newBalance,
          new_expiry: newEndDate
        }
      });

      console.log(`✅ [SUBSCRIPTIONS] Подписка ${subscription.id} успешно продлена`);
      return true;

    } catch (error) {
      console.error(`❌ [SUBSCRIPTIONS] Ошибка при автопродлении подписки ${subscription.id}:`, error);
      throw error;
    }
  };

  return Subscriptions;
};