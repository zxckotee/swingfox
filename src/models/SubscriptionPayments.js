const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SubscriptionPayments = sequelize.define('SubscriptionPayments', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    subscription_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID подписки'
    },
    user_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'ID пользователя'
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Сумма в фоксиках'
    },
    payment_method: {
      type: DataTypes.ENUM('balance', 'card', 'yandex_money', 'qiwi', 'paypal', 'crypto'),
      allowNull: false,
      comment: 'Способ оплаты'
    },
    payment_type: {
      type: DataTypes.ENUM('initial', 'renewal', 'upgrade', 'auto_renewal'),
      allowNull: false,
      comment: 'Тип платежа'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending',
      comment: 'Статус платежа'
    },
    transaction_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'ID транзакции во внешней системе'
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
    tableName: 'subscription_payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Ассоциации
  SubscriptionPayments.associate = function(models) {
    SubscriptionPayments.belongsTo(models.Subscriptions, {
      foreignKey: 'subscription_id',
      as: 'Subscription'
    });
    
    SubscriptionPayments.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'login',
      as: 'User'
    });
  };

  return SubscriptionPayments;
};
