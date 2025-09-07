'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('club_events', 'avatar', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Аватарка мероприятия'
    });

    await queryInterface.addColumn('club_events', 'images', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON массив с путями к изображениям мероприятия'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('club_events', 'avatar');
    await queryInterface.removeColumn('club_events', 'images');
  }
};

