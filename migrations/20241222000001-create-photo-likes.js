'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('photo_likes', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.BIGINT
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
      to_user: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'users',
          key: 'login'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      photo_index: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Добавляем индексы
    await queryInterface.addIndex('photo_likes', {
      fields: ['from_user', 'to_user', 'photo_index'],
      unique: true,
      name: 'photo_likes_unique_like'
    });

    await queryInterface.addIndex('photo_likes', {
      fields: ['to_user', 'photo_index'],
      name: 'photo_likes_target_photo'
    });

    await queryInterface.addIndex('photo_likes', {
      fields: ['created_at'],
      name: 'photo_likes_created_at'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('photo_likes');
  }
};