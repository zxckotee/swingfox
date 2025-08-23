'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('profile_visits', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      visitor: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'users',
          key: 'login'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      visited: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'users',
          key: 'login'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Добавляем индексы
    await queryInterface.addIndex('profile_visits', {
      fields: ['visitor', 'visited'],
      name: 'profile_visits_visitor_visited'
    });

    await queryInterface.addIndex('profile_visits', {
      fields: ['visited', 'created_at'],
      name: 'profile_visits_visited_date'
    });

    await queryInterface.addIndex('profile_visits', {
      fields: ['created_at'],
      name: 'profile_visits_created_at'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('profile_visits');
  }
};