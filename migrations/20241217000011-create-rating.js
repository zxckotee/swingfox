'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rating', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      from_user: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Пользователь, который оценил'
      },
      to_user: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Пользователь, которого оценили'
      },
      value: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Значение рейтинга: 1 (плюс) или -1 (минус)'
      },
      date: {
        type: Sequelize.DATEONLY,
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

    // Индексы для оптимизации поиска
    await queryInterface.addIndex('rating', ['from_user']);
    await queryInterface.addIndex('rating', ['to_user']);
    await queryInterface.addIndex('rating', ['date']);
    await queryInterface.addIndex('rating', ['value']);
    
    // Уникальный индекс: один пользователь может оценить другого только один раз
    await queryInterface.addIndex('rating', ['from_user', 'to_user'], {
      unique: true,
      name: 'unique_user_rating'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rating');
  }
};