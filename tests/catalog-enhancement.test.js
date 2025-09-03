/**
 * Тест улучшенного подбора анкет в каталоге
 * Проверяет работу новых SQL-запросов с расчетом совместимости
 */

const request = require('supertest');
const app = require('../server'); // Предполагаем, что у нас есть экспорт app
const { User } = require('../src/models');

describe('Catalog Enhancement Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Создаем тестового пользователя
    testUser = await User.create({
      login: 'test_catalog_user',
      ava: 'test_avatar.jpg',
      status: 'Мужчина',
      search_status: 'Женщина&&Семейная пара(М+Ж)',
      date: '1990-01-01',
      geo: '55.7558&&37.6176', // Москва
      location: 'Кафе&&Ресторан',
      smoking: 'Не курю',
      alko: 'Умеренно',
      viptype: 'VIP'
    });

    // Получаем токен авторизации
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        login: 'test_catalog_user',
        password: 'test_password'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Очищаем тестовые данные
    if (testUser) {
      await testUser.destroy();
    }
  });

  describe('GET /api/catalog', () => {
    test('should return profiles with compatibility scores', async () => {
      const response = await request(app)
        .get('/api/catalog')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.users).toBeDefined();
      expect(response.body.users.length).toBeGreaterThan(0);

      // Проверяем наличие информации о совместимости
      const firstUser = response.body.users[0];
      expect(firstUser.compatibility).toBeDefined();
      expect(firstUser.compatibility.score).toBeDefined();
      expect(firstUser.compatibility.percentage).toBeDefined();
      expect(firstUser.compatibility.scores).toBeDefined();
      expect(firstUser.compatibility.recommendations).toBeDefined();

      // Проверяем структуру scores
      expect(firstUser.compatibility.scores.mutualStatus).toBeDefined();
      expect(firstUser.compatibility.scores.age).toBeDefined();
      expect(firstUser.compatibility.scores.distance).toBeDefined();
      expect(firstUser.compatibility.scores.location).toBeDefined();
      expect(firstUser.compatibility.scores.lifestyle).toBeDefined();
    });

    test('should filter by status correctly', async () => {
      const response = await request(app)
        .get('/api/catalog')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          status: ['Женщина'],
          limit: 3 
        });

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBeLessThanOrEqual(3);

      // Проверяем, что все профили имеют статус "Женщина"
      response.body.users.forEach(user => {
        expect(user.status).toBe('Женщина');
      });
    });

    test('should filter by country and city', async () => {
      const response = await request(app)
        .get('/api/catalog')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          country: 'Россия',
          city: 'Москва',
          limit: 3 
        });

      expect(response.status).toBe(200);
      
      // Проверяем, что все профили из указанной страны и города
      response.body.users.forEach(user => {
        expect(user.country).toBe('Россия');
        expect(user.city).toBe('Москва');
      });
    });

    test('should handle pagination correctly', async () => {
      const response1 = await request(app)
        .get('/api/catalog')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 3, offset: 0 });

      const response2 = await request(app)
        .get('/api/catalog')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 3, offset: 3 });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.users.length).toBeLessThanOrEqual(3);
      expect(response2.body.users.length).toBeLessThanOrEqual(3);

      // Проверяем, что профили не повторяются
      const ids1 = response1.body.users.map(u => u.id);
      const ids2 = response2.body.users.map(u => u.id);
      const intersection = ids1.filter(id => ids2.includes(id));
      expect(intersection.length).toBe(0);
    });
  });

  describe('GET /api/catalog/recommendations', () => {
    test('should return enhanced recommendations', async () => {
      const response = await request(app)
        .get('/api/catalog/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ count: 5 });

      expect(response.status).toBe(200);
      expect(response.body.recommendations).toBeDefined();
      expect(response.body.total).toBeDefined();
      expect(response.body.requested).toBe(5);
      expect(response.body.algorithm).toBe('enhanced_compatibility_sql');

      // Проверяем, что все профили VIP
      response.body.recommendations.forEach(profile => {
        expect(profile.viptype).not.toBe('FREE');
      });

      // Проверяем наличие детальной информации о совместимости
      const firstProfile = response.body.recommendations[0];
      expect(firstProfile.compatibility.totalScore).toBeDefined();
      expect(firstProfile.compatibility.scores).toBeDefined();
      expect(firstProfile.compatibility.weights).toBeDefined();
      expect(firstProfile.compatibility.recommendations).toBeDefined();
    });

    test('should return profiles sorted by compatibility', async () => {
      const response = await request(app)
        .get('/api/catalog/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ count: 10 });

      expect(response.status).toBe(200);
      expect(response.body.recommendations.length).toBeGreaterThan(1);

      // Проверяем, что профили отсортированы по убыванию совместимости
      for (let i = 1; i < response.body.recommendations.length; i++) {
        const prevScore = response.body.recommendations[i - 1].compatibility.totalScore;
        const currentScore = response.body.recommendations[i].compatibility.totalScore;
        expect(prevScore).toBeGreaterThanOrEqual(currentScore);
      }
    });

    test('should handle empty results gracefully', async () => {
      // Создаем пользователя с очень специфичными критериями
      const specificUser = await User.create({
        login: 'specific_test_user',
        ava: 'test_avatar.jpg',
        status: 'Мужчина',
        search_status: 'Очень специфичный статус',
        date: '1990-01-01',
        geo: '90.0000&&180.0000', // Северный полюс
        viptype: 'VIP'
      });

      try {
        const response = await request(app)
          .get('/api/catalog/recommendations')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ count: 5 });

        // Должен вернуть пустой результат, но не ошибку
        expect(response.status).toBe(404);
        expect(response.body.error).toBe('no_profiles');
      } finally {
        // Очищаем тестового пользователя
        await specificUser.destroy();
      }
    });
  });

  describe('Compatibility Calculation', () => {
    test('should calculate mutual status compatibility correctly', async () => {
      const response = await request(app)
        .get('/api/catalog')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 1 });

      expect(response.status).toBe(200);
      const user = response.body.users[0];

      // Проверяем, что mutualStatus рассчитывается корректно
      if (user.compatibility.scores.mutualStatus > 0.5) {
        // Высокая совместимость по статусу
        expect(user.status).toBe('Женщина');
        expect(user.search_status).toContain('Мужчина');
      }
    });

    test('should calculate age compatibility correctly', async () => {
      const response = await request(app)
        .get('/api/catalog')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 1 });

      expect(response.status).toBe(200);
      const user = response.body.users[0];

      // Проверяем наличие расчета возрастной совместимости
      expect(user.compatibility.scores.age).toBeDefined();
      expect(user.compatibility.scores.age).toBeGreaterThanOrEqual(0);
      expect(user.compatibility.scores.age).toBeLessThanOrEqual(1);
    });

    test('should calculate distance compatibility correctly', async () => {
      const response = await request(app)
        .get('/api/catalog')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 1 });

      expect(response.status).toBe(200);
      const user = response.body.users[0];

      // Проверяем наличие расчета совместимости по расстоянию
      expect(user.compatibility.scores.distance).toBeDefined();
      expect(user.compatibility.scores.distance).toBeGreaterThanOrEqual(0);
      expect(user.compatibility.scores.distance).toBeLessThanOrEqual(1);

      // Если есть геоданные, проверяем расстояние
      if (user.distance !== null) {
        expect(user.distance).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid user gracefully', async () => {
      const response = await request(app)
        .get('/api/catalog')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
    });

    test('should handle invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/catalog')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 'invalid', offset: 'invalid' });

      // Должен обработать некорректные параметры
      expect(response.status).toBe(200);
      expect(response.body.users).toBeDefined();
    });
  });
});

// Вспомогательные функции для тестов
function createTestProfile(overrides = {}) {
  return {
    login: `test_${Date.now()}`,
    ava: 'test_avatar.jpg',
    status: 'Женщина',
    search_status: 'Мужчина',
    date: '1995-01-01',
    geo: '55.7558&&37.6176',
    location: 'Кафе',
    smoking: 'Не курю',
    alko: 'Умеренно',
    viptype: 'VIP',
    ...overrides
  };
}
