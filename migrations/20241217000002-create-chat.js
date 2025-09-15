'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chat', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      by_user: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Отправитель сообщения'
      },
      to_user: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Получатель сообщения'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      images: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Формат: img1.jpg&&img2.jpg или null'
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    // Индексы для оптимизации поиска чатов
    await queryInterface.addIndex('chat', ['by_user', 'to_user']);
    await queryInterface.addIndex('chat', ['to_user', 'is_read']);
    await queryInterface.addIndex('chat', ['date']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('chat');
  }
};