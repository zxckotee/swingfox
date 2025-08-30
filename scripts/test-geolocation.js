#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки работы геолокации
 * Запуск: node scripts/test-geolocation.js
 */

const { getGeoByIP, getGeoWithFallback, isValidIP } = require('../src/utils/geoLocation');

async function testGeolocation() {
  console.log('🧪 Тестирование геолокации');
  console.log('============================\n');
  
  // Тест 1: Валидация IP адресов
  console.log('1️⃣ Тест валидации IP адресов:');
  const testIPs = [
    '8.8.8.8',           // Google DNS
    '1.1.1.1',           // Cloudflare DNS
    '127.0.0.1',         // Localhost
    '192.168.1.1',       // Локальная сеть
    '256.256.256.256',   // Невалидный IP
    'invalid-ip',        // Невалидный формат
    ''                    // Пустая строка
  ];
  
  testIPs.forEach(ip => {
    const isValid = isValidIP(ip);
    console.log(`   ${ip}: ${isValid ? '✅' : '❌'}`);
  });
  
  console.log('\n2️⃣ Тест получения геолокации по IP:');
  
  // Тест 2: Получение геолокации для валидных IP
  const validIPs = ['8.8.8.8', '1.1.1.1'];
  
  for (const ip of validIPs) {
    console.log(`\n   Тестируем IP: ${ip}`);
    try {
      const geo = await getGeoByIP(ip);
      if (geo) {
        console.log(`   ✅ Получены координаты: ${geo}`);
      } else {
        console.log(`   ❌ Не удалось получить координаты`);
      }
    } catch (error) {
      console.log(`   ❌ Ошибка: ${error.message}`);
    }
  }
  
  console.log('\n3️⃣ Тест fallback геолокации:');
  
  // Тест 3: Fallback геолокация
  const fallbackTests = [
    '127.0.0.1',         // Localhost (должен использовать fallback)
    'invalid-ip',        // Невалидный IP (должен использовать fallback)
    '8.8.8.8'           // Валидный IP (должен получить реальные координаты)
  ];
  
  for (const ip of fallbackTests) {
    console.log(`\n   Тестируем IP: ${ip}`);
    try {
      const geo = await getGeoWithFallback(ip);
      console.log(`   📍 Результат: ${geo}`);
    } catch (error) {
      console.log(`   ❌ Ошибка: ${error.message}`);
    }
  }
  
  console.log('\n4️⃣ Тест производительности:');
  
  // Тест 4: Производительность
  const startTime = Date.now();
  const testCount = 3;
  
  for (let i = 0; i < testCount; i++) {
    const start = Date.now();
    await getGeoWithFallback('8.8.8.8');
    const duration = Date.now() - start;
    console.log(`   Запрос ${i + 1}: ${duration}ms`);
  }
  
  const totalTime = Date.now() - startTime;
  const avgTime = totalTime / testCount;
  
  console.log(`   📊 Среднее время: ${avgTime.toFixed(0)}ms`);
  console.log(`   📊 Общее время: ${totalTime}ms`);
  
  console.log('\n✨ Тестирование завершено!');
}

// Запуск тестов
if (require.main === module) {
  testGeolocation().catch(error => {
    console.error('💥 Ошибка тестирования:', error);
    process.exit(1);
  });
}

module.exports = {
  testGeolocation
};
