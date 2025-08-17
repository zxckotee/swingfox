'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reports', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      from_user: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'users',
          key: 'login'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      target_user: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'users',
          key: 'login'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('spam', 'harassment', 'fake_profile', 'inappropriate_content', 'other'),
        allowNull: false,
        defaultValue: 'other'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'resolved', 'dismissed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      admin_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      resolved_by: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'users',
          key: 'login'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Индексы для оптимизации
    await queryInterface.addIndex('reports', ['from_user']);
    await queryInterface.addIndex('reports', ['target_user']);
    await queryInterface.addIndex('reports', ['status']);
    await queryInterface.addIndex('reports', ['created_at']);
    
    // Составной индекс для предотвращения дублирующих жалоб
    await queryInterface.addIndex('reports', ['from_user', 'target_user', 'type'], {
      name: 'idx_reports_unique_complaint'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reports');
  }
};