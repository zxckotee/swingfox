'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
  }
};