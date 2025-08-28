'use strict';

const fs = require('fs');
const path = require('path');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🌍 Начинаем импорт географических данных...');
    
    try {
      // Проверяем, есть ли уже данные в таблице geo
      const existingCount = await queryInterface.sequelize.query(
        'SELECT COUNT(*) as count FROM geo',
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      if (existingCount[0].count > 0) {
        console.log(`📊 В таблице geo уже есть ${existingCount[0].count} записей. Пропускаем импорт.`);
        return;
      }

      // Путь к SQL файлу
      const sqlFilePath = '../kolomigs_swing.sql';
      
      if (!fs.existsSync(sqlFilePath)) {
        console.warn(`⚠️  SQL файл не найден: ${sqlFilePath}`);
        console.log('💡 Создаем базовые географические данные для России...');
        
        // Создаем базовые данные для России если SQL файл не найден
        const basicGeoData = [
          { country: 'Россия', region: null, city: 'Москва' },
          { country: 'Россия', region: null, city: 'Санкт-Петербург' },
          { country: 'Россия', region: null, city: 'Новосибирск' },
          { country: 'Россия', region: null, city: 'Екатеринбург' },
          { country: 'Россия', region: null, city: 'Казань' },
          { country: 'Россия', region: null, city: 'Нижний Новгород' },
          { country: 'Россия', region: null, city: 'Челябинск' },
          { country: 'Россия', region: null, city: 'Самара' },
          { country: 'Россия', region: null, city: 'Омск' },
          { country: 'Россия', region: null, city: 'Ростов-на-Дону' },
          { country: 'Украина', region: null, city: 'Киев' },
          { country: 'Украина', region: null, city: 'Харьков' },
          { country: 'Украина', region: null, city: 'Одесса' },
          { country: 'Беларусь', region: null, city: 'Минск' },
          { country: 'Казахстан', region: null, city: 'Алматы' },
          { country: 'Казахстан', region: null, city: 'Астана' }
        ];
        
        await queryInterface.bulkInsert('geo', basicGeoData.map(item => ({
          ...item,
          created_at: new Date(),
          updated_at: new Date()
        })));
        
        console.log(`✅ Добавлено ${basicGeoData.length} базовых географических записей`);
        return;
      }

      console.log('📖 Чтение SQL файла...');
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      
      // Поиск секции с данными geo таблицы
      console.log('🔍 Поиск данных geo таблицы...');
      
      // Регулярное выражение для поиска INSERT запросов geo таблицы
      const geoInsertRegex = /INSERT INTO `geo` VALUES\s*\((.*?)\);/g;
      
      // Регулярное выражение для извлечения отдельных значений
      const valuesRegex = /\('([^']*?)','([^']*?)','([^']*?)'\)/g;
      
      let matches;
      const geoData = [];
      let totalMatches = 0;
      
      // Поиск всех INSERT запросов для geo таблицы
      while ((matches = geoInsertRegex.exec(sqlContent)) !== null) {
        const insertValues = matches[1];
        let valueMatch;
        
        // Извлечение отдельных записей из одного INSERT запроса
        while ((valueMatch = valuesRegex.exec(insertValues)) !== null) {
          const [, country, region, city] = valueMatch;
          
          // Пропускаем записи с пустыми значениями
          if (country && city) {
            geoData.push({
              country: country.trim(),
              region: region.trim() || null,
              city: city.trim(),
              created_at: new Date(),
              updated_at: new Date()
            });
            totalMatches++;
          }
        }
      }
      
      console.log(`📊 Найдено ${totalMatches} географических записей`);
      
      if (geoData.length === 0) {
        throw new Error('❌ Не найдено данных для импорта');
      }

      // Показать примеры данных
      console.log('📋 Примеры найденных данных:');
      geoData.slice(0, 5).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.country} -> ${item.region || 'N/A'} -> ${item.city}`);
      });
      
      if (geoData.length > 5) {
        console.log(`   ... и еще ${geoData.length - 5} записей`);
      }

      // Импорт данных batch'ами для лучшей производительности
      const BATCH_SIZE = 1000;
      let importedCount = 0;
      
      console.log(`📦 Импорт данных батчами по ${BATCH_SIZE} записей...`);
      
      for (let i = 0; i < geoData.length; i += BATCH_SIZE) {
        const batch = geoData.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(geoData.length / BATCH_SIZE);
        
        console.log(`   📦 Обработка батча ${batchNumber}/${totalBatches} (${batch.length} записей)...`);
        
        try {
          await queryInterface.bulkInsert('geo', batch, {
            ignoreDuplicates: true
          });
          
          importedCount += batch.length;
          
          // Показываем прогресс
          const progress = ((i + batch.length) / geoData.length * 100).toFixed(1);
          console.log(`   ✅ Батч обработан. Прогресс: ${progress}%`);
          
        } catch (batchError) {
          console.error(`   ❌ Ошибка в батче ${batchNumber}:`, batchError.message);
          throw batchError;
        }
      }

      // Финальная статистика
      console.log('\n📊 Результаты импорта:');
      console.log(`   ✅ Обработано записей: ${geoData.length}`);
      console.log(`   📥 Импортировано: ${importedCount}`);
      
      // Проверка результатов
      const finalCount = await queryInterface.sequelize.query(
        'SELECT COUNT(*) as count FROM geo',
        { type: Sequelize.QueryTypes.SELECT }
      );
      console.log(`   📈 Итого записей в таблице: ${finalCount[0].count}`);
      
      // Показать статистику по странам
      const countryStats = await queryInterface.sequelize.query(
        `SELECT country, COUNT(*) as cities_count 
         FROM geo 
         GROUP BY country 
         ORDER BY cities_count DESC 
         LIMIT 10`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      console.log('\n🌍 Топ-10 стран по количеству городов:');
      countryStats.forEach((stat, index) => {
        console.log(`   ${index + 1}. ${stat.country}: ${stat.cities_count} городов`);
      });
      
      console.log('\n🎉 Импорт географических данных завершен успешно!');
      
    } catch (error) {
      console.error('❌ Ошибка импорта географических данных:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🗑️  Удаление географических данных...');
    
    try {
      await queryInterface.bulkDelete('geo', null, {});
      console.log('✅ Все географические данные удалены');
    } catch (error) {
      console.error('❌ Ошибка удаления географических данных:', error);
      throw error;
    }
  }
};