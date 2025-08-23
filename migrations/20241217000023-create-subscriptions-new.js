'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subscriptions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Пользователь'
      },
      subscription_type: {
        type: Sequelize.ENUM('VIP', 'PREMIUM'),
        allowNull: false,
        comment: 'Тип подписки'
      },
      status: {
        type: Sequelize.ENUM('active', 'expired', 'cancelled', 'pending'),
        defaultValue: 'pending',
        comment: 'Статус подписки'
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Дата начала подписки'
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Дата окончания подписки'
      },
      auto_renewal: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Автопродление'
      },
      payment_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Сумма платежа'
      },
      payment_method: {
        type: Sequelize.ENUM('balance', 'card', 'yandex_money', 'qiwi', 'paypal', 'crypto'),
        defaultValue: 'balance',
        comment: 'Способ оплаты'
      },
      payment_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'ID платежа во внешней системе'
      },
      promo_code: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Промокод'
      },
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00,
        comment: 'Размер скидки'
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'RUB',
        comment: 'Валюта'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Заметки'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
        comment: 'Дата создания'
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
        comment: 'Дата обновления'
      }
    });

    // Создание индексов для производительности
    await queryInterface.addIndex('subscriptions', ['user_id'], {
      name: 'idx_subscriptions_user_id'
    });

    await queryInterface.addIndex('subscriptions', ['subscription_type'], {
      name: 'idx_subscriptions_type'
    });

    await queryInterface.addIndex('subscriptions', ['status'], {
      name: 'idx_subscriptions_status'
    });

    await queryInterface.addIndex('subscriptions', ['end_date'], {
      name: 'idx_subscriptions_end_date'
    });

    await queryInterface.addIndex('subscriptions', ['auto_renewal'], {
      name: 'idx_subscriptions_auto_renewal'
    });

    // Создание внешнего ключа
    await queryInterface.addConstraint('subscriptions', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_subscriptions_user_id',
      references: {
        table: 'users',
        field: 'login'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Удаление внешнего ключа
    await queryInterface.removeConstraint('subscriptions', 'fk_subscriptions_user_id');

    // Удаление индексов
    await queryInterface.removeIndex('subscriptions', 'idx_subscriptions_auto_renewal');
    await queryInterface.removeIndex('subscriptions', 'idx_subscriptions_end_date');
    await queryInterface.removeIndex('subscriptions', 'idx_subscriptions_status');
    await queryInterface.removeIndex('subscriptions', 'idx_subscriptions_type');
    await queryInterface.removeIndex('subscriptions', 'idx_subscriptions_user_id');

    // Удаление таблицы
    await queryInterface.dropTable('subscriptions');
  }
};