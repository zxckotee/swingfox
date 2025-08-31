'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Создаем таблицу club_bots
    await queryInterface.createTable('club_bots', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      club_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clubs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'ID клуба'
      },
      welcome_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Приветственное сообщение для новых пользователей'
      },
      invitation_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Сообщение с предложением вступления в клуб'
      },
      thanks_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Благодарность за вступление в клуб'
      },
      event_info_template: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Шаблон информации о мероприятии'
      },
      auto_responses: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Автоматические ответы на ключевые слова'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Активен ли бот'
      },
      // НОВЫЕ ПОЛЯ ДЛЯ ЭМОЦИОНАЛЬНЫХ ТРИГГЕРОВ И ПЕРСОНАЛИЗАЦИИ
      personality_traits: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Настройки "характера" бота (дружелюбный, профессиональный, игривый)'
      },
      event_scenarios: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Сценарии для разных типов мероприятий'
      },
      ice_breakers: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Темы для начала разговора и "ледоколы"'
      },
      compatibility_algorithms: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Алгоритмы подбора участников по совместимости'
      },
      emotional_triggers: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Эмоциональные триггеры для вовлечения пользователей'
      },
      referral_messages: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Сообщения для реферальной системы'
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

    // Создаем индексы для оптимизации
    await queryInterface.addIndex('club_bots', ['club_id']);
    await queryInterface.addIndex('club_bots', ['is_active']);
    await queryInterface.addIndex('club_bots', ['club_id', 'is_active']);

    // Добавляем уникальный индекс для club_id (один бот на клуб)
    await queryInterface.addIndex('club_bots', ['club_id'], {
      unique: true,
      name: 'club_bots_club_id_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    // Удаляем таблицу club_bots
    await queryInterface.dropTable('club_bots');
  }
};
