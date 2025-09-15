'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Создаем последовательность для автогенерации ID в таблице chat
    await queryInterface.sequelize.query(`
      CREATE SEQUENCE IF NOT EXISTS chat_id_seq;
    `);
    
    // Устанавливаем значение по умолчанию для поля id
    await queryInterface.sequelize.query(`
      ALTER TABLE chat ALTER COLUMN id SET DEFAULT nextval('chat_id_seq');
    `);
    
    // Связываем последовательность с полем id
    await queryInterface.sequelize.query(`
      ALTER SEQUENCE chat_id_seq OWNED BY chat.id;
    `);
    
    // Устанавливаем текущее значение последовательности на максимальный существующий ID
    await queryInterface.sequelize.query(`
      SELECT setval('chat_id_seq', COALESCE((SELECT MAX(id) FROM chat), 1));
    `);
  },

  async down (queryInterface, Sequelize) {
    // Удаляем значение по умолчанию для поля id
    await queryInterface.sequelize.query(`
      ALTER TABLE chat ALTER COLUMN id DROP DEFAULT;
    `);
    
    // Удаляем последовательность
    await queryInterface.sequelize.query(`
      DROP SEQUENCE IF EXISTS chat_id_seq;
    `);
  }
};
