const fs = require('fs');
const path = require('path');
const { sequelize, Geo } = require('../src/models');

/**
 * Скрипт импорта географических данных из PHP версии в новую базу данных
 */

async function importGeoData() {
  console.log('🚀 Начинаем импорт географических данных из PHP версии...');
  
  try {
    // Подключение к базе данных
    console.log('📡 Подключение к базе данных...');
    await sequelize.authenticate();
    console.log('✅ Подключение к БД установлено');

    // Путь к SQL файлу PHP версии
    const sqlFilePath = path.join(__dirname, '../kolomigs_swing.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`❌ SQL файл не найден: ${sqlFilePath}`);
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

    // Проверка существующих данных
    console.log('🔍 Проверка существующих данных в geo таблице...');
    const existingCount = await Geo.count();
    
    if (existingCount > 0) {
      console.log(`⚠️  В таблице уже есть ${existingCount} записей`);
      console.log('🤔 Продолжить импорт? (дубликаты будут пропущены)');
    }

    // Создание таблицы если её нет
    console.log('🔧 Синхронизация модели Geo с базой данных...');
    await Geo.sync();
    
    // Импорт данных batch'ами для лучшей производительности
    const BATCH_SIZE = 1000;
    let importedCount = 0;
    let skippedCount = 0;
    
    console.log(`📦 Импорт данных батчами по ${BATCH_SIZE} записей...`);
    
    for (let i = 0; i < geoData.length; i += BATCH_SIZE) {
      const batch = geoData.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(geoData.length / BATCH_SIZE);
      
      console.log(`   📦 Обработка батча ${batchNumber}/${totalBatches} (${batch.length} записей)...`);
      
      try {
        // Используем ignoreDuplicates для пропуска существующих записей
        const result = await Geo.bulkCreate(batch, {
          ignoreDuplicates: true,
          validate: true,
          returning: false // Не возвращаем созданные записи для экономии памяти
        });
        
        // В Postgres bulkCreate с ignoreDuplicates не возвращает точное количество
        // поэтому просто считаем как успешно обработанные
        importedCount += batch.length;
        
        // Показываем прогресс
        const progress = ((i + batch.length) / geoData.length * 100).toFixed(1);
        console.log(`   ✅ Батч обработан. Прогресс: ${progress}%`);
        
      } catch (batchError) {
        console.error(`   ❌ Ошибка в батче ${batchNumber}:`, batchError.message);
        
        // Пробуем импортировать записи по одной для выявления проблемных
        console.log(`   🔄 Попытка индивидуального импорта записей из батча ${batchNumber}...`);
        
        for (const record of batch) {
          try {
            await Geo.create(record);
            importedCount++;
          } catch (recordError) {
            skippedCount++;
            if (recordError.name !== 'SequelizeUniqueConstraintError') {
              console.warn(`   ⚠️  Пропущена запись ${record.country}-${record.city}:`, recordError.message);
            }
          }
        }
      }
    }

    // Финальная статистика
    console.log('\n📊 Результаты импорта:');
    console.log(`   ✅ Обработано записей: ${geoData.length}`);
    console.log(`   📥 Импортировано: ${importedCount}`);
    console.log(`   ⏭️  Пропущено: ${skippedCount}`);
    
    // Проверка результатов
    const finalCount = await Geo.count();
    console.log(`   📈 Итого записей в таблице: ${finalCount}`);
    
    // Показать статистику по странам
    const countryStats = await Geo.findAll({
      attributes: [
        'country',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cities_count']
      ],
      group: ['country'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10
    });
    
    console.log('\n🌍 Топ-10 стран по количеству городов:');
    countryStats.forEach((stat, index) => {
      console.log(`   ${index + 1}. ${stat.country}: ${stat.dataValues.cities_count} городов`);
    });
    
    console.log('\n🎉 Импорт географических данных завершен успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка импорта географических данных:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('📡 Подключение к БД закрыто');
  }
}

// Проверка аргументов командной строки
const args = process.argv.slice(2);
const forceImport = args.includes('--force');

if (forceImport) {
  console.log('🚀 Запуск принудительного импорта...');
  importGeoData()
    .then(() => {
      console.log('✅ Импорт завершен');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Ошибка:', error.message);
      process.exit(1);
    });
} else {
  console.log('📖 Скрипт импорта географических данных');
  console.log('💡 Использование: node scripts/import-geo-data.js --force');
  console.log('⚠️  Убедитесь, что:');
  console.log('   1. SQL файл находится в kolomigs_swing.sql');
  console.log('   2. База данных настроена и доступна');
  console.log('   3. Выполнены все миграции');
  console.log('\n🚀 Для запуска импорта добавьте флаг --force');
}

module.exports = importGeoData;