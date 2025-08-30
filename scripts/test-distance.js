#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки расчета расстояний
 * Запуск: node scripts/test-distance.js
 */

const { calculateDistance, parseGeo } = require('../src/utils/helpers');

function testDistanceCalculation() {
  console.log('🧮 Тестирование расчета расстояний');
  console.log('==================================\n');
  
  // Тест 1: Базовые расчеты расстояний
  console.log('1️⃣ Базовые расчеты расстояний:');
  
  const testCases = [
    {
      name: 'Москва → Санкт-Петербург',
      lat1: 55.7558, lon1: 37.6176,  // Москва
      lat2: 59.9311, lon2: 30.3609   // Санкт-Петербург
    },
    {
      name: 'Москва → Екатеринбург',
      lat1: 55.7558, lon1: 37.6176,  // Москва
      lat2: 56.8519, lon2: 60.6122   // Екатеринбург
    },
    {
      name: 'Москва → Новосибирск',
      lat1: 55.7558, lon1: 37.6176,  // Москва
      lat2: 55.0084, lon2: 82.9357   // Новосибирск
    },
    {
      name: 'Москва → Сочи',
      lat1: 55.7558, lon1: 37.6176,  // Москва
      lat2: 43.6028, lon2: 39.7342   // Сочи
    },
    {
      name: 'Москва → Калининград',
      lat1: 55.7558, lon1: 37.6176,  // Москва
      lat2: 54.7065, lon2: 20.5111   // Калининград
    }
  ];
  
  testCases.forEach(testCase => {
    const distance = calculateDistance(
      testCase.lat1, testCase.lon1,
      testCase.lat2, testCase.lon2
    );
    
    console.log(`   ${testCase.name}: ${distance.toFixed(1)} км`);
  });
  
  // Тест 2: Парсинг геолокации
  console.log('\n2️⃣ Тест парсинга геолокации:');
  
  const geoStrings = [
    '55.7558&&37.6176',    // Москва
    '59.9311&&30.3609',    // Санкт-Петербург
    '56.8519&&60.6122',    // Екатеринбург
    'invalid&&format',     // Неверный формат
    '55.7558',             // Неполные данные
    '',                     // Пустая строка
    null                    // Null
  ];
  
  geoStrings.forEach(geoString => {
    const parsed = parseGeo(geoString);
    if (parsed) {
      console.log(`   "${geoString}" → lat: ${parsed.lat}, lng: ${parsed.lng}`);
    } else {
      console.log(`   "${geoString}" → ❌ Не удалось распарсить`);
    }
  });
  
  // Тест 3: Расчет расстояния через парсинг
  console.log('\n3️⃣ Расчет расстояния через парсинг:');
  
  const user1Geo = '55.7558&&37.6176';  // Москва
  const user2Geo = '59.9311&&30.3609';  // Санкт-Петербург
  
  const geo1 = parseGeo(user1Geo);
  const geo2 = parseGeo(user2Geo);
  
  if (geo1 && geo2) {
    const distance = calculateDistance(geo1.lat, geo1.lng, geo2.lat, geo2.lng);
    console.log(`   Москва → Санкт-Петербург: ${distance.toFixed(1)} км`);
  } else {
    console.log('   ❌ Ошибка парсинга координат');
  }
  
  // Тест 4: Точность расчетов
  console.log('\n4️⃣ Проверка точности расчетов:');
  
  // Тест с известными расстояниями (примерные)
  const moscowSpbDistance = calculateDistance(55.7558, 37.6176, 59.9311, 30.3609);
  const expectedDistance = 635; // Примерное расстояние Москва-СПб
  
  const accuracy = Math.abs(moscowSpbDistance - expectedDistance) / expectedDistance * 100;
  console.log(`   Москва → СПб: ${moscowSpbDistance.toFixed(1)} км (ожидалось ~${expectedDistance} км)`);
  console.log(`   Точность: ${(100 - accuracy).toFixed(1)}%`);
  
  // Тест 5: Крайние случаи
  console.log('\n5️⃣ Крайние случаи:');
  
  // Одинаковые координаты
  const samePointDistance = calculateDistance(55.7558, 37.6176, 55.7558, 37.6176);
  console.log(`   Одинаковые координаты: ${samePointDistance.toFixed(3)} км`);
  
  // Очень близкие координаты
  const closeDistance = calculateDistance(55.7558, 37.6176, 55.7559, 37.6177);
  console.log(`   Очень близкие координаты: ${closeDistance.toFixed(3)} км`);
  
  // Очень далекие координаты
  const farDistance = calculateDistance(55.7558, 37.6176, -33.8688, 151.2093); // Москва → Сидней
  console.log(`   Москва → Сидней: ${farDistance.toFixed(1)} км`);
  
  console.log('\n✨ Тестирование завершено!');
}

// Запуск тестов
if (require.main === module) {
  testDistanceCalculation();
}

module.exports = {
  testDistanceCalculation
};
