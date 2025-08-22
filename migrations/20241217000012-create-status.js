'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('status', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      timestamp: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'Unix timestamp активности'
      },
      login: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Логин пользователя'
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Тип активности: online, typing, offline'
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

    // Индексы для оптимизации поиска
    await queryInterface.addIndex('status', ['login']);
    await queryInterface.addIndex('status', ['timestamp']);
    await queryInterface.addIndex('status', ['type']);
    await queryInterface.addIndex('status', ['login', 'timestamp']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('status');
  }
};