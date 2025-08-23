/**
 * Тест для проверки новых функций helpers.js
 */

const { parseGeo, formatAge, formatOnlineTime } = require('./src/utils/helpers');

console.log('=== Тестирование функций helpers.js ===\n');

// Тест parseGeo
console.log('1. Тест parseGeo:');
console.log('parseGeo("55.7558&&37.6176"):', parseGeo("55.7558&&37.6176"));
console.log('parseGeo("invalid"):', parseGeo("invalid"));
console.log('parseGeo(null):', parseGeo(null));
console.log('parseGeo(""):', parseGeo(""));

// Тест formatAge
console.log('\n2. Тест formatAge:');
console.log('formatAge("1990"):', formatAge("1990"));
console.log('formatAge("1995-05-15"):', formatAge("1995-05-15"));
console.log('formatAge("2000-12-31"):', formatAge("2000-12-31"));
console.log('formatAge(null):', formatAge(null));
console.log('formatAge("invalid"):', formatAge("invalid"));

// Тест formatOnlineTime
console.log('\n3. Тест formatOnlineTime:');
const now = new Date();
const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

console.log('formatOnlineTime(now):', formatOnlineTime(now));
console.log('formatOnlineTime(fiveMinutesAgo):', formatOnlineTime(fiveMinutesAgo));
console.log('formatOnlineTime(oneHourAgo):', formatOnlineTime(oneHourAgo));
console.log('formatOnlineTime(oneDayAgo):', formatOnlineTime(oneDayAgo));
console.log('formatOnlineTime(oneWeekAgo):', formatOnlineTime(oneWeekAgo));
console.log('formatOnlineTime(null):', formatOnlineTime(null));

console.log('\n=== Тест завершен ===');