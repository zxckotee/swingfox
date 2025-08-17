'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subscriptions', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false
      },
      login: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      viptype: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'VIP, PREMIUM'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Дата окончания подписки'
      },
      auto_renewal: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Автопродление'
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

    await queryInterface.addIndex('subscriptions', ['login']);
    await queryInterface.addIndex('subscriptions', ['date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('subscriptions');
  }
};