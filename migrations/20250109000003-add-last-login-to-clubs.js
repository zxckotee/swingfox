'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем поле last_login в таблицу clubs
    try {
      await queryInterface.addColumn('clubs', 'last_login', {
        type: Sequelize.DATE,
        allowNull: true
      });
      console.log('Added column last_login to clubs table');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Column last_login already exists, skipping');
      } else {
        throw error;
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Удаляем поле last_login
    try {
      await queryInterface.removeColumn('clubs', 'last_login');
      console.log('Removed column last_login from clubs table');
    } catch (error) {
      console.log('Could not remove column last_login:', error.message);
    }
  }
};
