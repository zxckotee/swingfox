'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mails', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Email получателя'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Содержимое письма и код через &&'
      },
      subject: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Тема письма'
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Время отправки'
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
    await queryInterface.addIndex('mails', ['email']);
    await queryInterface.addIndex('mails', ['sent_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('mails');
  }
};