'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем недостающие поля для совместимости с PHP версией
    await queryInterface.addColumn('events', 'country', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Страна проведения события'
    });

    await queryInterface.addColumn('events', 'applications', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Список заявок через &&'
    });

    await queryInterface.addColumn('events', 'owner_club_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      comment: 'ID клуба-организатора (если событие создано клубом)'
    });

    // Добавляем индексы для новых полей
    await queryInterface.addIndex('events', ['country']);
    await queryInterface.addIndex('events', ['owner_club_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('events', 'country');
    await queryInterface.removeColumn('events', 'applications');
    await queryInterface.removeColumn('events', 'owner_club_id');
  }
};