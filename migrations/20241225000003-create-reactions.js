'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reactions', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      from_user: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Пользователь, который поставил реакцию'
      },
      object_type: {
        type: Sequelize.ENUM('image', 'post', 'profile', 'comment'),
        allowNull: false,
        comment: 'Тип объекта: image, post, profile, comment'
      },
      object_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'ID или имя файла объекта'
      },
      reaction_type: {
        type: Sequelize.ENUM('like', 'love', 'laugh', 'wow', 'sad', 'angry'),
        allowNull: false,
        defaultValue: 'like',
        comment: 'Тип реакции: like, love, laugh, wow, sad, angry'
      },
      value: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Значение реакции: 1 (позитивная), -1 (негативная), 0 (нейтральная)'
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
    await queryInterface.addIndex('reactions', ['from_user', 'object_type', 'object_id'], {
      unique: true,
      name: 'unique_user_object_reaction'
    });
    
    await queryInterface.addIndex('reactions', ['object_type', 'object_id'], {
      name: 'idx_reactions_object'
    });
    
    await queryInterface.addIndex('reactions', ['from_user', 'created_at'], {
      name: 'idx_reactions_user_date'
    });
    
    await queryInterface.addIndex('reactions', ['reaction_type', 'value'], {
      name: 'idx_reactions_type_value'
    });

    // Внешний ключ на пользователя
    await queryInterface.addConstraint('reactions', {
      fields: ['from_user'],
      type: 'foreign key',
      name: 'fk_reactions_from_user',
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
    await queryInterface.removeConstraint('reactions', 'fk_reactions_from_user');
    
    // Удаляем индексы
    await queryInterface.removeIndex('reactions', 'unique_user_object_reaction');
    await queryInterface.removeIndex('reactions', 'idx_reactions_object');
    await queryInterface.removeIndex('reactions', 'idx_reactions_user_date');
    await queryInterface.removeIndex('reactions', 'idx_reactions_type_value');
    
    // Удаляем таблицу
    await queryInterface.dropTable('reactions');
  }
};
