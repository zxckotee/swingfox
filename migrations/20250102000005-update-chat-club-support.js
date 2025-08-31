'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем поля для поддержки клубов
    await queryInterface.addColumn('chat', 'club_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'ID клуба (если чат с клубом)',
      references: {
        model: 'clubs',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('chat', 'is_bot_message', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Сообщение от бота'
    });

    await queryInterface.addColumn('chat', 'event_context', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Контекст мероприятия',
      references: {
        model: 'events',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('chat', 'message_type', {
      type: Sequelize.ENUM('user', 'bot', 'club', 'system'),
      allowNull: false,
      defaultValue: 'user',
      comment: 'Тип сообщения'
    });

    // НОВЫЕ ПОЛЯ ДЛЯ ГРУППОВЫХ ЧАТОВ И ЭМОЦИОНАЛЬНОЙ НАСТРОЙКИ
    await queryInterface.addColumn('chat', 'group_chat_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'ID группового чата мероприятия'
    });

    await queryInterface.addColumn('chat', 'message_category', {
      type: Sequelize.ENUM('general', 'ice_breaker', 'event_info', 'referral'),
      allowNull: false,
      defaultValue: 'general',
      comment: 'Категория сообщения'
    });

    await queryInterface.addColumn('chat', 'emotional_tone', {
      type: Sequelize.ENUM('friendly', 'professional', 'casual', 'flirty'),
      allowNull: false,
      defaultValue: 'friendly',
      comment: 'Эмоциональный тон сообщения'
    });

    // Создаем индексы для оптимизации
    await queryInterface.addIndex('chat', ['club_id']);
    await queryInterface.addIndex('chat', ['is_bot_message']);
    await queryInterface.addIndex('chat', ['event_context']);
    await queryInterface.addIndex('chat', ['message_type']);
    await queryInterface.addIndex('chat', ['club_id', 'by_user']);
    await queryInterface.addIndex('chat', ['club_id', 'to_user']);
    await queryInterface.addIndex('chat', ['group_chat_id']);
    await queryInterface.addIndex('chat', ['message_category']);
    await queryInterface.addIndex('chat', ['emotional_tone']);
  },

  async down(queryInterface, Sequelize) {
    // Удаляем добавленные поля
    await queryInterface.removeColumn('chat', 'club_id');
    await queryInterface.removeColumn('chat', 'is_bot_message');
    await queryInterface.removeColumn('chat', 'event_context');
    await queryInterface.removeColumn('chat', 'message_type');
    await queryInterface.removeColumn('chat', 'group_chat_id');
    await queryInterface.removeColumn('chat', 'message_category');
    await queryInterface.removeColumn('chat', 'emotional_tone');
  }
};
