'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем поля длительности в таблицу events
    await queryInterface.addColumn('events', 'duration_hours', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 2,
      comment: 'Длительность мероприятия в часах'
    });

    await queryInterface.addColumn('events', 'end_date', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Дата и время окончания мероприятия'
    });

    // Добавляем поля длительности в таблицу club_events
    await queryInterface.addColumn('club_events', 'duration_hours', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 2,
      comment: 'Длительность мероприятия в часах'
    });

    await queryInterface.addColumn('club_events', 'end_date', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Дата и время окончания мероприятия'
    });

    // Добавляем индексы для новых полей
    await queryInterface.addIndex('events', ['end_date'], {
      name: 'idx_events_end_date'
    });

    await queryInterface.addIndex('club_events', ['end_date'], {
      name: 'idx_club_events_end_date'
    });
  },

  async down(queryInterface, Sequelize) {
    // Удаляем индексы
    await queryInterface.removeIndex('events', 'idx_events_end_date');
    await queryInterface.removeIndex('club_events', 'idx_club_events_end_date');

    // Удаляем колонки из events
    await queryInterface.removeColumn('events', 'duration_hours');
    await queryInterface.removeColumn('events', 'end_date');

    // Удаляем колонки из club_events
    await queryInterface.removeColumn('club_events', 'duration_hours');
    await queryInterface.removeColumn('club_events', 'end_date');
  }
};
