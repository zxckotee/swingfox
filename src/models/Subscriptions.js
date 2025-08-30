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
      defaultValue: false,
      comment: 'Автопродление'
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
    
    // Обновляем статус пользователя на FREE если подписка истекла
    if (new Date() > this.end_date) {
      const user = await sequelize.models.User.findOne({ 
        where: { login: this.user_id } 
      });
      
              if (user && user.viptype === this.subscription_type) {
          await sequelize.models.User.update(
            { viptype: 'FREE' },
            { where: { login: this.user_id } }
          );
        }
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
  Subscriptions.getPricing = () => {
    return {
      VIP: {
        monthly: 299,
        quarterly: 799, // Скидка 11%
        yearly: 2999    // Скидка 16%
      },
      PREMIUM: {
        monthly: 499,
        quarterly: 1399, // Скидка 6%
        yearly: 4999     // Скидка 17%
      }
    };
  };

  Subscriptions.getFeatures = () => {
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
      // Получаем цены
      const pricing = this.getPricing();
      let basePrice;
      
      switch (duration_months) {
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
          status: 'active',
          end_date: {
            [sequelize.Sequelize.Op.gt]: new Date()
          }
        },
        order: [['end_date', 'DESC']]
      });

      return subscription;
    } catch (error) {
      console.error('Error getting active subscription:', error);
      throw error;
    }
  };

  Subscriptions.getUserSubscriptionHistory = async function(userId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      status = null
    } = options;

    const whereClause = { user_id: userId };
    
    if (status) {
      whereClause.status = status;
    }

    try {
      const subscriptions = await this.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit,
        offset
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
  };

  return Subscriptions;
};