'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем новые колонки
    await queryInterface.addColumn('ads', 'title', {
      type: Sequelize.STRING(200),
      allowNull: false,
      defaultValue: 'Объявление' // Временное значение для существующих записей
    });

    await queryInterface.addColumn('ads', 'price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    });

    await queryInterface.addColumn('ads', 'contact_info', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('ads', 'image', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('ads', 'status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    });

    await queryInterface.addColumn('ads', 'approved_by', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    await queryInterface.addColumn('ads', 'approved_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('ads', 'expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('ads', 'views_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('ads', 'is_featured', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    // Переименовываем колонку login в author
    await queryInterface.renameColumn('ads', 'login', 'author');

    // Обновляем существующие записи, устанавливая title на основе description
    await queryInterface.sequelize.query(`
      UPDATE ads 
      SET title = CASE 
        WHEN LENGTH(description) > 200 THEN LEFT(description, 197) || '...'
        ELSE description
      END,
      expires_at = created_at + INTERVAL '30 days'
    `);

    // Удаляем старые индексы
    await queryInterface.removeIndex('ads', ['author']);
    await queryInterface.removeIndex('ads', ['type']);
    await queryInterface.removeIndex('ads', ['country', 'city']);

    // Создаем новые индексы
    await queryInterface.addIndex('ads', ['author']);
    await queryInterface.addIndex('ads', ['type']);
    await queryInterface.addIndex('ads', ['city']);
    await queryInterface.addIndex('ads', ['status']);
    await queryInterface.addIndex('ads', ['created_at']);
    await queryInterface.addIndex('ads', ['expires_at']);
  },

  async down(queryInterface, Sequelize) {
    // Удаляем новые колонки
    await queryInterface.removeColumn('ads', 'title');
    await queryInterface.removeColumn('ads', 'price');
    await queryInterface.removeColumn('ads', 'contact_info');
    await queryInterface.removeColumn('ads', 'image');
    await queryInterface.removeColumn('ads', 'status');
    await queryInterface.removeColumn('ads', 'approved_by');
    await queryInterface.removeColumn('ads', 'approved_at');
    await queryInterface.removeColumn('ads', 'expires_at');
    await queryInterface.removeColumn('ads', 'views_count');
    await queryInterface.removeColumn('ads', 'is_featured');

    // Переименовываем обратно author в login
    await queryInterface.renameColumn('ads', 'author', 'login');

    // Удаляем новые индексы
    await queryInterface.removeIndex('ads', ['author']);
    await queryInterface.removeIndex('ads', ['type']);
    await queryInterface.removeIndex('ads', ['city']);
    await queryInterface.removeIndex('ads', ['status']);
    await queryInterface.removeIndex('ads', ['created_at']);
    await queryInterface.removeIndex('ads', ['expires_at']);

    // Восстанавливаем старые индексы
    await queryInterface.addIndex('ads', ['login']);
    await queryInterface.addIndex('ads', ['type']);
    await queryInterface.addIndex('ads', ['country', 'city']);
  }
};
