'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('visits', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false
      },
      who: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Кто посетил профиль'
      },
      whom: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Чей профиль посетили'
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Дата и время посещения'
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
    await queryInterface.addIndex('visits', ['who']);
    await queryInterface.addIndex('visits', ['whom']);
    await queryInterface.addIndex('visits', ['date']);
    await queryInterface.addIndex('visits', ['whom', 'date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('visits');
  }
};