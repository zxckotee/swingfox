'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем только недостающие поля для маркетинга и социальной динамики
    
    // Проверяем существование поля bot_settings перед добавлением
    try {
      await queryInterface.addColumn('events', 'bot_settings', {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Настройки бота для мероприятия'
      });
    } catch (error) {
      console.log('Поле bot_settings уже существует или не может быть добавлено');
    }

    try {
      await queryInterface.addColumn('events', 'auto_invite_enabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Включить автоматические приглашения'
      });
    } catch (error) {
      console.log('Поле auto_invite_enabled уже существует или не может быть добавлено');
    }

    // Добавляем новые поля для социальной динамики
    try {
      await queryInterface.addColumn('events', 'compatibility_rules', {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Правила совместимости участников'
      });
    } catch (error) {
      console.log('Поле compatibility_rules уже существует или не может быть добавлено');
    }

    try {
      await queryInterface.addColumn('events', 'ice_breaker_topics', {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Темы для начала разговора'
      });
    } catch (error) {
      console.log('Поле ice_breaker_topics уже существует или не может быть добавлено');
    }

    try {
      await queryInterface.addColumn('events', 'is_premium', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Является ли мероприятие премиум'
      });
    } catch (error) {
      console.log('Поле is_premium уже существует или не может быть добавлено');
    }

    // Создаем индексы для оптимизации (только для новых полей)
    try {
      await queryInterface.addIndex('events', ['auto_invite_enabled']);
    } catch (error) {
      console.log('Индекс для auto_invite_enabled уже существует');
    }

    try {
      await queryInterface.addIndex('events', ['is_premium']);
    } catch (error) {
      console.log('Индекс для is_premium уже существует');
    }
  },

  async down(queryInterface, Sequelize) {
    // Удаляем только добавленные поля
    try {
      await queryInterface.removeColumn('events', 'bot_settings');
    } catch (error) {
      console.log('Поле bot_settings не может быть удалено');
    }

    try {
      await queryInterface.removeColumn('events', 'auto_invite_enabled');
    } catch (error) {
      console.log('Поле auto_invite_enabled не может быть удалено');
    }

    try {
      await queryInterface.removeColumn('events', 'compatibility_rules');
    } catch (error) {
      console.log('Поле compatibility_rules не может быть удалено');
    }

    try {
      await queryInterface.removeColumn('events', 'ice_breaker_topics');
    } catch (error) {
      console.log('Поле ice_breaker_topics не может быть удалено');
    }

    try {
      await queryInterface.removeColumn('events', 'is_premium');
    } catch (error) {
      console.log('Поле is_premium не может быть удалено');
    }
  }
};
