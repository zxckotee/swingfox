'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Проверяем существование таблицы
    const tableExists = await queryInterface.showAllTables()
      .then(tables => tables.includes('event_participants'));
    
    if (tableExists) {
      console.log('Таблица event_participants уже существует, пропускаем создание');
      return;
    }

    await queryInterface.createTable('event_participants', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('invited', 'confirmed', 'attended', 'cancelled'),
        defaultValue: 'invited'
      },
      joined_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      participation_level: {
        type: Sequelize.ENUM('newbie', 'active', 'leader', 'vip'),
        defaultValue: 'newbie'
      },
      compatibility_score: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 0.00
      },
      referral_source: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      feedback_rating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5
        }
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Добавляем индексы для оптимизации запросов
    try {
      await queryInterface.addIndex('event_participants', ['event_id']);
    } catch (error) {
      console.log('Индекс для event_id уже существует');
    }
    
    try {
      await queryInterface.addIndex('event_participants', ['user_id']);
    } catch (error) {
      console.log('Индекс для user_id уже существует');
    }
    
    try {
      await queryInterface.addIndex('event_participants', ['status']);
    } catch (error) {
      console.log('Индекс для status уже существует');
    }
    
    try {
      await queryInterface.addIndex('event_participants', ['participation_level']);
    } catch (error) {
      console.log('Индекс для participation_level уже существует');
    }
    
    try {
      await queryInterface.addIndex('event_participants', ['compatibility_score']);
    } catch (error) {
      console.log('Индекс для compatibility_score уже существует');
    }
    
    // Уникальный индекс для предотвращения дублирования участников
    try {
      await queryInterface.addIndex('event_participants', ['event_id', 'user_id'], {
        unique: true,
        name: 'event_participants_event_user_unique'
      });
    } catch (error) {
      console.log('Уникальный индекс для event_id + user_id уже существует');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('event_participants');
  }
};
