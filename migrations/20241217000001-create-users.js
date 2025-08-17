'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false
      },
      login: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      auth_token: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ava: {
        type: Sequelize.STRING(255),
        defaultValue: 'no_photo.jpg'
      },
      status: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      country: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      city: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      geo: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Формат: lat&&lng'
      },
      registration: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      info: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      online: {
        type: Sequelize.DATE,
        allowNull: true
      },
      viptype: {
        type: Sequelize.STRING(50),
        defaultValue: 'FREE'
      },
      images: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Формат: img1.jpg&&img2.jpg'
      },
      search_status: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      search_age: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      location: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      mobile: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      height: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Формат: 180 или 180_165 для пар'
      },
      weight: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Формат: 70 или 70_60 для пар'
      },
      smoking: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      alko: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      date: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Формат: 1990-01-01 или 1990-01-01_1992-05-15 для пар'
      },
      balance: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      locked_images: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      images_password: {
        type: Sequelize.STRING(255),
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

    // Создаем индексы для оптимизации поиска
    await queryInterface.addIndex('users', ['login']);
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['auth_token']);
    await queryInterface.addIndex('users', ['viptype']);
    await queryInterface.addIndex('users', ['country', 'city']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};