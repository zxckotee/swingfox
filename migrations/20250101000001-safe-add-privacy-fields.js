'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Проверяем существование поля privacy_settings
      const tableDescription = await queryInterface.describeTable('users');
      
      if (!tableDescription.privacy_settings) {
        await queryInterface.addColumn('users', 'privacy_settings', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'JSON с настройками приватности'
        });
        console.log('✅ Добавлено поле privacy_settings');
      } else {
        console.log('ℹ️ Поле privacy_settings уже существует');
      }

      if (!tableDescription.geo_updated_at) {
        await queryInterface.addColumn('users', 'geo_updated_at', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Время последнего обновления геоданных'
        });
        console.log('✅ Добавлено поле geo_updated_at');
      } else {
        console.log('ℹ️ Поле geo_updated_at уже существует');
      }

      if (!tableDescription.notification_token) {
        await queryInterface.addColumn('users', 'notification_token', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'FCM токен для push-уведомлений'
        });
        console.log('✅ Добавлено поле notification_token');
      } else {
        console.log('ℹ️ Поле notification_token уже существует');
      }

      if (!tableDescription.premium_features) {
        await queryInterface.addColumn('users', 'premium_features', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'JSON с доступными премиум функциями'
        });
        console.log('✅ Добавлено поле premium_features');
      } else {
        console.log('ℹ️ Поле premium_features уже существует');
      }

      // Добавляем индексы
      try {
        await queryInterface.addIndex('users', ['geo_updated_at']);
        console.log('✅ Добавлен индекс для geo_updated_at');
      } catch (error) {
        console.log('ℹ️ Индекс для geo_updated_at уже существует');
      }

      try {
        await queryInterface.addIndex('users', ['notification_token']);
        console.log('✅ Добавлен индекс для notification_token');
      } catch (error) {
        console.log('ℹ️ Индекс для notification_token уже существует');
      }

    } catch (error) {
      console.error('❌ Ошибка в миграции:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Безопасное удаление полей
      await queryInterface.removeColumn('users', 'privacy_settings');
      await queryInterface.removeColumn('users', 'geo_updated_at');
      await queryInterface.removeColumn('users', 'notification_token');
      await queryInterface.removeColumn('users', 'premium_features');
      
      console.log('✅ Поля успешно удалены');
    } catch (error) {
      console.warn('⚠️ Ошибка при откате миграции:', error);
    }
  }
};
