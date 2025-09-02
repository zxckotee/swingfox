'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('event_participants', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      event_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'club_events',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('invited', 'confirmed', 'declined', 'maybe'),
        defaultValue: 'invited'
      },
      invited_by: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Добавляем индексы
    await queryInterface.addIndex('event_participants', ['event_id']);
    await queryInterface.addIndex('event_participants', ['user_id']);
    await queryInterface.addIndex('event_participants', ['status']);
    await queryInterface.addIndex('event_participants', ['invited_by']);
    
    // Уникальный индекс для предотвращения дублирования
    await queryInterface.addIndex('event_participants', ['event_id', 'user_id'], {
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('event_participants');
  }
};
