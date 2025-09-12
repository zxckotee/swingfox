'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('chat', 'event_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'club_events',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('chat', 'event_id');
  }
};
