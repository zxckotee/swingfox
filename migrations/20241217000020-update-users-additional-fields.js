'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем поля для отслеживания обновления геоданных
    await queryInterface.addColumn('users', 'geo_updated_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Время последнего обновления геоданных'
    });

    // Добавляем поле для токенов уведомлений (для push-уведомлений)
    await queryInterface.addColumn('users', 'notification_token', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'FCM токен для push-уведомлений'
    });

    // Добавляем поле для настроек приватности
    await queryInterface.addColumn('users', 'privacy_settings', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON с настройками приватности'
    });

    // Добавляем поле для премиум функций
    await queryInterface.addColumn('users', 'premium_features', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON с доступными премиум функциями'
    });

    // Добавляем индексы
    await queryInterface.addIndex('users', ['geo_updated_at']);
    await queryInterface.addIndex('users', ['notification_token']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'geo_updated_at');
    await queryInterface.removeColumn('users', 'notification_token');
    await queryInterface.removeColumn('users', 'privacy_settings');
    await queryInterface.removeColumn('users', 'premium_features');
  }
};