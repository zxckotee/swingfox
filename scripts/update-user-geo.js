#!/usr/bin/env node

/**
 * Скрипт для обновления геолокации существующих пользователей
 * Запуск: node scripts/update-user-geo.js
 */

const axios = require('axios');
const { User } = require('../src/models');
const { getGeoWithFallback } = require('../src/utils/geoLocation');

/**
 * Получение геолокации по IP адресу (для скрипта)
 */
async function getGeoByIP(ip) {
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      timeout: 5000
    });
    
    if (response.data && response.data.status === 'success' && response.data.lat && response.data.lon) {
      return `${response.data.lat}&&${response.data.lon}`;
    }
    
    return null;
  } catch (error) {
    console.error(`Ошибка получения геолокации для IP ${ip}:`, error.message);
    return null;
  }
}

/**
 * Обновление геолокации для пользователя
 */
async function updateUserGeo(user) {
  try {
    // Если у пользователя уже есть геолокация, пропускаем
    if (user.geo) {
      console.log(`Пользователь ${user.login} уже имеет геолокацию: ${user.geo}`);
      return false;
    }
    
    // Используем fallback геолокацию для существующих пользователей
    // В реальном проекте можно попытаться определить IP по другим данным
    const geo = await getGeoWithFallback('8.8.8.8'); // Google DNS как пример
    
    if (geo) {
      await user.update({ geo });
      console.log(`✅ Обновлена геолокация для пользователя ${user.login}: ${geo}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Ошибка обновления для ${user.login}:`, error.message);
    return false;
  }
}

/**
 * Основная функция обновления
 */
async function updateAllUsersGeo() {
  try {
    console.log('🚀 Начинаем обновление геолокации пользователей...');
    
    // Получаем всех пользователей без геолокации
    const users = await User.findAll({
      where: {
        geo: null
      }
    });
    
    if (users.length === 0) {
      console.log('✅ Все пользователи уже имеют геолокацию!');
      return;
    }
    
    console.log(`📊 Найдено ${users.length} пользователей без геолокации`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Обновляем пользователей по одному, чтобы избежать перегрузки API
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n🔄 Обработка ${i + 1}/${users.length}: ${user.login}`);
      
      const updated = await updateUserGeo(user);
      if (updated) {
        updatedCount++;
      } else {
        errorCount++;
      }
      
      // Небольшая задержка между запросами к API геолокации
      if (i < users.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('\n📈 Результаты обновления:');
    console.log(`✅ Успешно обновлено: ${updatedCount}`);
    console.log(`❌ Ошибок: ${errorCount}`);
    console.log(`📊 Всего обработано: ${users.length}`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 Геолокация успешно обновлена для существующих пользователей!');
    }
    
  } catch (error) {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  }
}

/**
 * Проверка подключения к базе данных
 */
async function checkDatabaseConnection() {
  try {
    await User.findOne({ limit: 1 });
    console.log('✅ Подключение к базе данных успешно');
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error.message);
    return false;
  }
}

/**
 * Главная функция
 */
async function main() {
  console.log('🔧 Скрипт обновления геолокации пользователей');
  console.log('===============================================\n');
  
  // Проверяем подключение к БД
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    console.log('❌ Не удалось подключиться к базе данных. Проверьте настройки.');
    process.exit(1);
  }
  
  // Запускаем обновление
  await updateAllUsersGeo();
  
  console.log('\n✨ Скрипт завершен');
  process.exit(0);
}

// Запуск скрипта
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Неожиданная ошибка:', error);
    process.exit(1);
  });
}

module.exports = {
  updateAllUsersGeo,
  updateUserGeo
};
