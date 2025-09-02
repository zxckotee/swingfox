'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем колонку location в таблицу clubs
    await queryInterface.addColumn('clubs', 'location', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Удаляем колонку location
    await queryInterface.removeColumn('clubs', 'location');
  }
};

