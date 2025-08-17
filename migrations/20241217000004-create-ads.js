'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ads', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false
      },
      login: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Тип объявления: Встречи, Все и т.д.'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      country: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      city: {
        type: Sequelize.TEXT,
        allowNull: false
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

    // Индексы для поиска объявлений
    await queryInterface.addIndex('ads', ['login']);
    await queryInterface.addIndex('ads', ['type']);
    await queryInterface.addIndex('ads', ['country', 'city']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ads');
  }
};