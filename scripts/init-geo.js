#!/usr/bin/env node

const { sequelize } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

// Цвета для консоли
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Проверка существования таблицы geo
const checkGeoTable = async () => {
  try {
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'geo'
      );
    `);
    return results[0].exists;
  } catch (error) {
    log('red', `Ошибка проверки таблицы geo: ${error.message}`);
    return false;
  }
};

// Создание таблицы geo если она не существует
const createGeoTable = async () => {
  try {
    log('blue', '📋 Создание таблицы geo...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS geo (
        id SERIAL PRIMARY KEY,
        country VARCHAR(100) NOT NULL,
        region VARCHAR(100),
        city VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Создание индексов
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_geo_country ON geo(country);
      CREATE INDEX IF NOT EXISTS idx_geo_city ON geo(city);
      CREATE INDEX IF NOT EXISTS idx_geo_search ON geo(country, city);
    `);
    
    log('green', '✅ Таблица geo создана успешно');
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      log('yellow', '⚠️  Таблица geo уже существует');
      return true;
    }
    log('red', `❌ Ошибка создания таблицы geo: ${error.message}`);
    return false;
  }
};

// Проверка количества записей в таблице geo
const checkGeoData = async () => {
  try {
    const [results] = await sequelize.query('SELECT COUNT(*) as count FROM geo');
    return parseInt(results[0].count);
  } catch (error) {
    log('red', `Ошибка проверки данных geo: ${error.message}`);
    return 0;
  }
};

// Импорт базовых данных
const importBasicData = async () => {
  try {
    log('blue', '🌱 Импорт базовых географических данных...');
    
    const basicData = [
      { country: 'Россия', region: 'Москва', city: 'Москва' },
      { country: 'Россия', region: 'Санкт-Петербург', city: 'Санкт-Петербург' },
      { country: 'Россия', region: 'Московская область', city: 'Подольск' },
      { country: 'Россия', region: 'Московская область', city: 'Мытищи' },
      { country: 'Россия', region: 'Ленинградская область', city: 'Гатчина' },
      { country: 'Украина', region: 'Киев', city: 'Киев' },
      { country: 'Украина', region: 'Харьков', city: 'Харьков' },
      { country: 'Беларусь', region: 'Минск', city: 'Минск' },
      { country: 'Казахстан', region: 'Алматы', city: 'Алматы' }
    ];
    
    for (const item of basicData) {
      await sequelize.query(`
        INSERT INTO geo (country, region, city, created_at, updated_at)
        VALUES (:country, :region, :city, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, {
        replacements: item
      });
    }
    
    log('green', '✅ Базовые данные импортированы');
    return true;
  } catch (error) {
    log('red', `❌ Ошибка импорта базовых данных: ${error.message}`);
    return false;
  }
};

// Импорт данных из SQL файла
const importFromSQLFile = async () => {
  try {
    // Проверяем несколько возможных путей к файлу
    const possiblePaths = [
      path.join(__dirname, '..', 'kolomigs_swing.sql'),
      path.join(__dirname, '..', 'swingfox_kolomigs.sql')
    ];
    
    let sqlFilePath = null;
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        sqlFilePath = filePath;
        break;
      }
    }
    
    if (!sqlFilePath) {
      log('yellow', '⚠️  SQL файл не найден по путям:');
      possiblePaths.forEach(p => log('yellow', `   - ${p}`));
      return false;
    }
    
    log('blue', `📂 Найден SQL файл: ${sqlFilePath}`);
    
    log('blue', '📂 Импорт данных из SQL файла...');
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    // Попробуем разные варианты поиска geo данных
    let geoInserts = sqlContent.match(/INSERT INTO `geo`[^;]+;/g);
    if (!geoInserts) {
      geoInserts = sqlContent.match(/INSERT INTO geo[^;]+;/g);
    }
    if (!geoInserts) {
      // Попробуем найти все INSERT'ы и отфильтровать по geo
      const allInserts = sqlContent.match(/INSERT INTO[^;]+;/g) || [];
      geoInserts = allInserts.filter(insert =>
        insert.toLowerCase().includes('geo') ||
        insert.toLowerCase().includes('country') ||
        insert.toLowerCase().includes('city')
      );
    }
    
    log('blue', `📊 Найдено ${geoInserts ? geoInserts.length : 0} потенциальных geo записей`);
    
    if (!geoInserts || geoInserts.length === 0) {
      log('yellow', '⚠️  Geo данные не найдены в SQL файле');
      return false;
    }
    
    let importedCount = 0;
    
    for (const insert of geoInserts) {
      try {
        // Находим все VALUES в одном INSERT (многострочные)
        const valuesMatch = insert.match(/VALUES\s*([\s\S]*);/i);
        if (!valuesMatch) {
          continue;
        }
        
        const valuesBlock = valuesMatch[1];
        // Разбиваем на отдельные записи: ('...', '...', '...')
        const valueRows = valuesBlock.match(/\([^)]+\)/g);
        
        if (!valueRows) {
          continue;
        }
        
        for (const row of valueRows) {
          try {
            // Убираем скобки и разбиваем по запятым
            const cleanRow = row.slice(1, -1); // убираем ( и )
            const values = cleanRow.split(',').map(v =>
              v.trim().replace(/^'|'$/g, '').replace(/'/g, "")
            );
            
            if (values.length >= 3) {
              const [country, region, city] = values;
              
              // Создаем PostgreSQL запрос с created_at и updated_at
              await sequelize.query(`
                INSERT INTO geo (country, region, city, created_at, updated_at)
                VALUES (:country, :region, :city, NOW(), NOW())
                ON CONFLICT DO NOTHING
              `, {
                replacements: { country, region, city }
              });
              
              importedCount++;
              
              if (importedCount % 1000 === 0) {
                log('blue', `   📊 Импортировано ${importedCount} записей...`);
              }
            }
          } catch (rowError) {
            // Игнорируем ошибки отдельных строк
            if (!rowError.message.includes('duplicate') && !rowError.message.includes('unique')) {
              log('yellow', `⚠️  Ошибка импорта строки: ${rowError.message}`);
            }
          }
        }
      } catch (error) {
        log('yellow', `⚠️  Ошибка обработки INSERT: ${error.message}`);
      }
    }
    
    log('green', `✅ Импортировано ${importedCount} записей из SQL файла`);
    return true;
  } catch (error) {
    log('red', `❌ Ошибка импорта из SQL файла: ${error.message}`);
    return false;
  }
};

// Основная функция
const main = async () => {
  try {
    log('blue', '🌍 Инициализация географических данных...');
    
    // Подключение к базе данных
    await sequelize.authenticate();
    log('green', '✅ Подключение к базе данных установлено');
    
    // Проверка таблицы geo
    const tableExists = await checkGeoTable();
    if (!tableExists) {
      const created = await createGeoTable();
      if (!created) {
        process.exit(1);
      }
    }
    
    // Проверка существующих данных
    const existingCount = await checkGeoData();
    log('blue', `📊 Текущее количество записей в geo: ${existingCount}`);
    
    if (existingCount > 100) {
      log('green', '✅ Географические данные уже загружены');
      process.exit(0);
    }
    
    // Сначала очищаем таблицу для чистого импорта
    log('blue', '🗑️  Очистка существующих данных...');
    await sequelize.query('DELETE FROM geo');
    
    // Импорт данных ТОЛЬКО из SQL файла
    log('blue', '🔄 Принудительный импорт из SQL файла...');
    await importFromSQLFile();
    
    // Финальная проверка
    const finalCount = await checkGeoData();
    log('green', `🎉 Итого записей в geo: ${finalCount}`);
    
    process.exit(0);
    
  } catch (error) {
    log('red', `❌ Критическая ошибка: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

// Запуск
main();