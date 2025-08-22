'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clubs', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Название клуба'
      },
      country: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Страна'
      },
      city: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Город'
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Адрес клуба'
      },
      owner: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Владелец клуба'
      },
      admins: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Администраторы через &&'
      },
      links: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ссылки на соцсети и сайты'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Описание клуба'
      },
      avatar: {
        type: Sequelize.STRING(255),
        defaultValue: 'no_photo.jpg',
        comment: 'Аватар клуба'
      },
      date_created: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Дата создания клуба'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Активность клуба'
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
    await queryInterface.addIndex('clubs', ['owner']);
    await queryInterface.addIndex('clubs', ['country', 'city']);
    await queryInterface.addIndex('clubs', ['date_created']);
    await queryInterface.addIndex('clubs', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('clubs');
  }
};