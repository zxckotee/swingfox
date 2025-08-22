'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('gifts', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false
      },
      owner: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Получатель подарка'
      },
      from_user: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Отправитель подарка'
      },
      gift_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Тип подарка (1-10 или стоимость)'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      is_valid: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Действительность подарка'
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
    await queryInterface.addIndex('gifts', ['owner']);
    await queryInterface.addIndex('gifts', ['from_user']);
    await queryInterface.addIndex('gifts', ['date']);
    await queryInterface.addIndex('gifts', ['gift_type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('gifts');
  }
};