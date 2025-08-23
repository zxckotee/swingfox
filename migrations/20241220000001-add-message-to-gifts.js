'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('gifts', 'message', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Сообщение к подарку'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('gifts', 'message');
  }
};