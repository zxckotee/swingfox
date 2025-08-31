'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subscription_payments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      subscription_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      user_id: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      payment_method: {
        type: Sequelize.ENUM('balance', 'card', 'yandex_money', 'qiwi', 'paypal', 'crypto'),
        allowNull: false
      },
      payment_type: {
        type: Sequelize.ENUM('initial', 'renewal', 'upgrade', 'auto_renewal'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
      },
      transaction_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Создаем индексы
    await queryInterface.addIndex('subscription_payments', ['subscription_id']);
    await queryInterface.addIndex('subscription_payments', ['user_id']);
    await queryInterface.addIndex('subscription_payments', ['status']);
    await queryInterface.addIndex('subscription_payments', ['created_at']);

    // Создаем внешние ключи
    await queryInterface.addConstraint('subscription_payments', {
      fields: ['subscription_id'],
      type: 'foreign key',
      name: 'fk_subscription_payments_subscription_id',
      references: {
        table: 'subscriptions',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('subscription_payments', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_subscription_payments_user_id',
      references: {
        table: 'users',
        field: 'login'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('subscription_payments', 'fk_subscription_payments_user_id');
    await queryInterface.removeConstraint('subscription_payments', 'fk_subscription_payments_subscription_id');
    await queryInterface.dropTable('subscription_payments');
  }
};
