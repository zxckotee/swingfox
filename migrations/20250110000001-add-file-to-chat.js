'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('chat', 'file', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Имя файла для сообщений с изображениями'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('chat', 'file');
  }
};
