'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Сначала удаляем старое поле status с ENUM
    await queryInterface.removeColumn('ads', 'status');
    
    // Добавляем новое поле status как STRING
    await queryInterface.addColumn('ads', 'status', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'pending'
    });
    
    // Обновляем существующие записи, устанавливая статус по умолчанию
    await queryInterface.sequelize.query(`
      UPDATE ads 
      SET status = 'pending'
      WHERE status IS NULL
    `);
  },

  async down(queryInterface, Sequelize) {
    // Удаляем поле status
    await queryInterface.removeColumn('ads', 'status');
    
    // Восстанавливаем старое поле status с ENUM
    await queryInterface.addColumn('ads', 'status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    });
  }
};
