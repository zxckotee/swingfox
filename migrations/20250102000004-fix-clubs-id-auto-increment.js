'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔧 Исправляем поле id в таблице clubs...');
    
    try {
      // Проверяем текущую структуру поля id
      const [results] = await queryInterface.sequelize.query(`
        SELECT column_default, is_nullable, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'clubs' AND column_name = 'id'
      `);
      
      if (results.length > 0) {
        const columnInfo = results[0];
        console.log('📋 Текущая структура поля id:', columnInfo);
        
        // Если поле не автоинкрементное, исправляем его
        if (!columnInfo.column_default || !columnInfo.column_default.includes('nextval')) {
          console.log('⚠️  Поле id не автоинкрементное, исправляем...');
          
          // Создаем последовательность для автоинкремента
          await queryInterface.sequelize.query(`
            CREATE SEQUENCE IF NOT EXISTS clubs_id_seq;
          `);
          
          // Устанавливаем последовательность как значение по умолчанию
          await queryInterface.sequelize.query(`
            ALTER TABLE clubs ALTER COLUMN id SET DEFAULT nextval('clubs_id_seq');
          `);
          
          // Устанавливаем текущее значение последовательности
          await queryInterface.sequelize.query(`
            SELECT setval('clubs_id_seq', COALESCE((SELECT MAX(id) FROM clubs), 1));
          `);
          
          // Устанавливаем последовательность как владельца поля
          await queryInterface.sequelize.query(`
            ALTER SEQUENCE clubs_id_seq OWNED BY clubs.id;
          `);
          
          console.log('✅ Поле id успешно исправлено на автоинкрементное');
        } else {
          console.log('✅ Поле id уже автоинкрементное');
        }
      } else {
        console.log('❌ Поле id не найдено в таблице clubs');
      }
      
    } catch (error) {
      console.error('❌ Ошибка при исправлении поля id:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Откатываем изменения поля id...');
    
    try {
      // Удаляем значение по умолчанию
      await queryInterface.sequelize.query(`
        ALTER TABLE clubs ALTER COLUMN id DROP DEFAULT;
      `);
      
      // Удаляем последовательность
      await queryInterface.sequelize.query(`
        DROP SEQUENCE IF EXISTS clubs_id_seq;
      `);
      
      console.log('✅ Откат завершен');
    } catch (error) {
      console.error('❌ Ошибка при откате:', error.message);
      throw error;
    }
  }
};
