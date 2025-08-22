'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('moderators', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false
      },
      login: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'Логин модератора'
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Пароль модератора (хеширован)'
      },
      role: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'moderator',
        comment: 'Роль: moderator, admin, super_admin'
      },
      permissions: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON с разрешениями модератора'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Активен ли модератор'
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Последний вход в систему'
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

    // Индексы для оптимизации поиска
    await queryInterface.addIndex('moderators', ['login']);
    await queryInterface.addIndex('moderators', ['role']);
    await queryInterface.addIndex('moderators', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('moderators');
  }
};