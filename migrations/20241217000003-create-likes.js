'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('likes', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      like_from: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Кто лайкнул'
      },
      like_to: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Кого лайкнули'
      },
      reciprocal: {
        type: Sequelize.STRING(20),
        defaultValue: 'empty',
        comment: 'empty, yes, no - состояние взаимности'
      },
      super_message: {
        type: Sequelize.TEXT,
        defaultValue: '0',
        comment: 'Текст суперлайка или 0'
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
    await queryInterface.addIndex('likes', ['like_from', 'like_to']);
    await queryInterface.addIndex('likes', ['like_to', 'reciprocal']);
    await queryInterface.addIndex('likes', ['date', 'like_from']);
    await queryInterface.addIndex('likes', ['super_message']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('likes');
  }
};