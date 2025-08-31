const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SubscriptionPlans = sequelize.define('SubscriptionPlans', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Название плана'
    },
    type: {
      type: DataTypes.ENUM('FREE', 'VIP', 'PREMIUM'),
      allowNull: false,
      comment: 'Тип плана'
    },
    monthly_price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Цена за месяц в фоксиках'
    },
    quarterly_price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Цена за квартал в фоксиках'
    },
    yearly_price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Цена за год в фоксиках'
    },
    features: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'JSON с описанием возможностей'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Активен ли план'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'subscription_plans',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Статические методы
  SubscriptionPlans.getDefaultPlans = () => {
    return [
      {
        name: 'Бесплатный',
        type: 'FREE',
        monthly_price: 0,
        quarterly_price: 0,
        yearly_price: 0,
        features: {
          superlikes_daily: 1,
          attention_weekly: 0,
          hide_online: false,
          private_photos: false,
          see_likes: false,
          carousel: false,
          see_visits: false,
          unlimited_likes: false,
          priority_support: false,
          exclusive_events: false
        }
      },
      {
        name: 'VIP',
        type: 'VIP',
        monthly_price: 299,
        quarterly_price: 799,
        yearly_price: 2999,
        features: {
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
        }
      },
      {
        name: 'PREMIUM',
        type: 'PREMIUM',
        monthly_price: 499,
        quarterly_price: 1399,
        yearly_price: 4999,
        features: {
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
      }
    ];
  };

  return SubscriptionPlans;
};
