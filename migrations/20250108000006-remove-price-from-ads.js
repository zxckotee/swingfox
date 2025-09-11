'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Удаляем колонку price из таблицы ads
    await queryInterface.removeColumn('ads', 'price');
  },

  async down(queryInterface, Sequelize) {
    // Восстанавливаем колонку price (если нужно будет откатить)
    await queryInterface.addColumn('ads', 'price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    });
  }
};
