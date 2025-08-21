'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('geo', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Название страны'
      },
      region: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Регион/область/штат'
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Название города'
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

    // Создаем индексы для оптимизации поиска
    await queryInterface.addIndex('geo', ['country']);
    await queryInterface.addIndex('geo', ['country', 'region']);
    await queryInterface.addIndex('geo', ['country', 'city']);
    await queryInterface.addIndex('geo', ['city']);
    
    // Составной уникальный индекс для предотвращения дублирования
    await queryInterface.addIndex('geo', ['country', 'region', 'city'], {
      unique: true,
      name: 'geo_unique_location'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('geo');
  }
};