'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subscription_plans', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('FREE', 'VIP', 'PREMIUM'),
        allowNull: false
      },
      monthly_price: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      quarterly_price: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      yearly_price: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      features: {
        type: Sequelize.JSON,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Создаем индексы
    await queryInterface.addIndex('subscription_plans', ['type']);
    await queryInterface.addIndex('subscription_plans', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('subscription_plans');
  }
};
