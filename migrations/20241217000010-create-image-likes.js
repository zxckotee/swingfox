'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('image_likes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      from_user: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Пользователь, который лайкнул'
      },
      image_filename: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Имя файла изображения'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
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
    await queryInterface.addIndex('image_likes', ['from_user']);
    await queryInterface.addIndex('image_likes', ['image_filename']);
    await queryInterface.addIndex('image_likes', ['date']);
    
    // Уникальный индекс: один пользователь может лайкнуть изображение только один раз
    await queryInterface.addIndex('image_likes', ['from_user', 'image_filename'], {
      unique: true,
      name: 'unique_user_image_like'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('image_likes');
  }
};