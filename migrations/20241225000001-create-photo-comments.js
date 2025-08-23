'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('photo_comments', {
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
      image_filename: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Имя файла изображения'
      },
      comment_text: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Текст комментария'
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
    await queryInterface.addIndex('photo_comments', ['image_filename', 'created_at'], {
      name: 'idx_photo_comments_image_date'
    });
    
    await queryInterface.addIndex('photo_comments', ['from_user', 'created_at'], {
      name: 'idx_photo_comments_user_date'
    });
    
    await queryInterface.addIndex('photo_comments', ['is_deleted'], {
      name: 'idx_photo_comments_deleted'
    });

    // Внешний ключ на пользователя
    await queryInterface.addConstraint('photo_comments', {
      fields: ['from_user'],
      type: 'foreign key',
      name: 'fk_photo_comments_from_user',
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
    await queryInterface.removeConstraint('photo_comments', 'fk_photo_comments_from_user');
    
    // Удаляем индексы
    await queryInterface.removeIndex('photo_comments', 'idx_photo_comments_image_date');
    await queryInterface.removeIndex('photo_comments', 'idx_photo_comments_user_date');
    await queryInterface.removeIndex('photo_comments', 'idx_photo_comments_deleted');
    
    // Удаляем таблицу
    await queryInterface.dropTable('photo_comments');
  }
};
