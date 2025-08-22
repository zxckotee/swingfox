'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('club_applications', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Дата подачи заявки'
      },
      info: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Информация о клубе через &&'
      },
      status: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '0 - на рассмотрении, 1 - одобрено, 2 - отклонено'
      },
      applicant: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Логин подавшего заявку'
      },
      reviewed_by: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Логин модератора, рассмотревшего заявку'
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Дата рассмотрения заявки'
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Причина отклонения заявки'
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

    // Индексы для оптимизации поиска
    await queryInterface.addIndex('club_applications', ['applicant']);
    await queryInterface.addIndex('club_applications', ['status']);
    await queryInterface.addIndex('club_applications', ['date']);
    await queryInterface.addIndex('club_applications', ['reviewed_by']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('club_applications');
  }
};