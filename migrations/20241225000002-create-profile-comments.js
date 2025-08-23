'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('profile_comments', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      from_user: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Пользователь, который оставил комментарий'
      },
      to_user: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Пользователь, к профилю которого оставлен комментарий'
      },
      comment_text: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Текст комментария'
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Виден ли комментарий всем или только получателю'
      },
      is_edited: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Был ли комментарий отредактирован'
      },
      edited_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Дата последнего редактирования'
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Удален ли комментарий'
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Дата удаления'
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
    await queryInterface.addIndex('profile_comments', ['to_user', 'created_at'], {
      name: 'idx_profile_comments_to_user_date'
    });
    
    await queryInterface.addIndex('profile_comments', ['from_user', 'created_at'], {
      name: 'idx_profile_comments_from_user_date'
    });
    
    await queryInterface.addIndex('profile_comments', ['is_public', 'is_deleted'], {
      name: 'idx_profile_comments_visibility'
    });

    // Внешние ключи на пользователей
    await queryInterface.addConstraint('profile_comments', {
      fields: ['from_user'],
      type: 'foreign key',
      name: 'fk_profile_comments_from_user',
      references: {
        table: 'users',
        field: 'login'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('profile_comments', {
      fields: ['to_user'],
      type: 'foreign key',
      name: 'fk_profile_comments_to_user',
      references: {
        table: 'users',
        field: 'login'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Удаляем внешние ключи
    await queryInterface.removeConstraint('profile_comments', 'fk_profile_comments_from_user');
    await queryInterface.removeConstraint('profile_comments', 'fk_profile_comments_to_user');
    
    // Удаляем индексы
    await queryInterface.removeIndex('profile_comments', 'idx_profile_comments_to_user_date');
    await queryInterface.removeIndex('profile_comments', 'idx_profile_comments_from_user_date');
    await queryInterface.removeIndex('profile_comments', 'idx_profile_comments_visibility');
    
    // Удаляем таблицу
    await queryInterface.dropTable('profile_comments');
  }
};
