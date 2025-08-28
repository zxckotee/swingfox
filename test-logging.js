const { APILogger, log, LOG_LEVELS } = require('./src/utils/logger');

console.log('🧪 Тестирование системы логирования\n');

// Тест 1: Базовое логирование
console.log('📝 Тест 1: Базовое логирование');
log('INFO', 'Это информационное сообщение');
log('DEBUG', 'Это отладочное сообщение');
log('ERROR', 'Это сообщение об ошибке');

// Тест 2: Логирование с данными
console.log('\n📝 Тест 2: Логирование с данными');
const testData = {
  user: 'testuser',
  action: 'login',
  timestamp: new Date().toISOString()
};
log('INFO', 'Пользователь выполнил действие', testData);

// Тест 3: Логирование с большими массивами
console.log('\n📝 Тест 3: Логирование с большими массивами');
const largeData = {
  success: true,
  count: 500,
  data: Array.from({ length: 500 }, (_, i) => ({
    id: i + 1,
    city: `Город${i + 1}`,
    region: `Регион${i + 1}`
  }))
};
log('INFO', 'Получены географические данные', largeData);

// Тест 4: API Logger
console.log('\n📝 Тест 4: API Logger');
const mockReq = {
  method: 'GET',
  originalUrl: '/api/geo/regions/Россия',
  user: { login: 'testuser' },
  ip: '127.0.0.1'
};

const logger = new APILogger('GEO');
logger.logRequest(mockReq, 'GET /regions/:country');
logger.logProcess('Получение регионов', { country: 'Россия' }, mockReq);
logger.logResult('Получение регионов', true, {
  country: 'Россия',
  regions_count: 500,
  first_region: 'Алтайский край',
  last_region: 'Ярославская обл.'
}, mockReq);

// Тест 5: Разные уровни логирования
console.log('\n📝 Тест 5: Разные уровни логирования');
console.log('Текущий уровень логирования:', Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === require('./src/utils/logger').CURRENT_LOG_LEVEL));

console.log('\n✅ Тестирование завершено!');


