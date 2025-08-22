'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      login: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Пользователь, который поставил реакцию'
      },
      target_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Тип объекта: image, post, profile'
      },
      target_id: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'ID или имя файла объекта'
      },
      reaction_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    await queryInterface.addIndex('reactions', ['login']);
    await queryInterface.addIndex('reactions', ['target_type']);
    await queryInterface.addIndex('reactions', ['target_id']);
    await queryInterface.addIndex('reactions', ['reaction_value']);
    
    // Уникальный индекс: один пользователь может поставить только одну реакцию на объект
    await queryInterface.addIndex('reactions', ['login', 'target_type', 'target_id'], {
      unique: true,
      name: 'unique_user_reaction'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reactions');
  }
};