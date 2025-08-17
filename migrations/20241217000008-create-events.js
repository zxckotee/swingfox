'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('events', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      organizer: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'users',
          key: 'login'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      event_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      location: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      max_participants: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
      },
      type: {
        type: Sequelize.ENUM('party', 'meeting', 'club_event', 'private', 'other'),
        allowNull: false,
        defaultValue: 'party'
      },
      status: {
        type: Sequelize.ENUM('planned', 'active', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'planned'
      },
      is_private: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      requirements: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      dress_code: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      contact_info: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      image: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      approved: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      approved_by: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'users',
          key: 'login'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    // Индексы
    await queryInterface.addIndex('events', ['organizer']);
    await queryInterface.addIndex('events', ['city']);
    await queryInterface.addIndex('events', ['event_date']);
    await queryInterface.addIndex('events', ['type']);
    await queryInterface.addIndex('events', ['status']);
    await queryInterface.addIndex('events', ['approved']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('events');
  }
};