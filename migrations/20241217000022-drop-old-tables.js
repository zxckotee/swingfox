'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Удаляем старые таблицы с неправильной структурой
    // Эта миграция должна выполниться до создания новых правильных таблиц
    
    try {
      // Проверяем и удаляем таблицу subscriptions если она существует
      const subscriptionsTableExists = await queryInterface.showAllTables()
        .then(tables => tables.includes('subscriptions'));
      
      if (subscriptionsTableExists) {
        console.log('Удаляем старую таблицу subscriptions...');
        await queryInterface.dropTable('subscriptions');
      }
    } catch (error) {
      console.log('Таблица subscriptions не найдена или уже удалена');
    }

    try {
      // Проверяем и удаляем таблицу notifications если она существует
      const notificationsTableExists = await queryInterface.showAllTables()
        .then(tables => tables.includes('notifications'));
      
      if (notificationsTableExists) {
        console.log('Удаляем старую таблицу notifications...');
        await queryInterface.dropTable('notifications');
      }
    } catch (error) {
      console.log('Таблица notifications не найдена или уже удалена');
    }
  },

  async down(queryInterface, Sequelize) {
    // В down методе восстанавливаем старые таблицы с их оригинальной структурой
    
    // Восстанавливаем старую таблицу subscriptions
    await queryInterface.createTable('subscriptions', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false
      },
      login: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      viptype: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'VIP, PREMIUM'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Дата окончания подписки'
      },
      auto_renewal: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Автопродление'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('subscriptions', ['login']);
    await queryInterface.addIndex('subscriptions', ['date']);

    // Восстанавливаем старую таблицу notifications
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false
      },
      by_user: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Кто отправил уведомление'
      },
      to_user: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Кому адресовано'
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'like, superlike, gift, visit'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Дополнительное сообщение'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('notifications', ['to_user', 'is_read']);
    await queryInterface.addIndex('notifications', ['type']);
    await queryInterface.addIndex('notifications', ['created_at']);
  }
};