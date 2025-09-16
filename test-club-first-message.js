const request = require('supertest');
const app = require('./server');

// Тест для проверки исправления логики первого сообщения клуба
async function testClubFirstMessage() {
  console.log('🧪 Тестирование исправления логики первого сообщения клуба...\n');

  try {
    // Тест 1: Клуб отправляет первое сообщение пользователю БЕЗ event_id (должна быть ошибка)
    console.log('Тест 1: Клуб отправляет первое сообщение БЕЗ event_id...');
    const response1 = await request(app)
      .post('/api/chat/send')
      .set('Authorization', 'Bearer club_token_here') // Заглушка токена клуба
      .send({
        to_user: 'testuser',
        message: 'Привет от клуба!',
        // event_id отсутствует
      });

    console.log('Статус ответа:', response1.status);
    console.log('Тело ответа:', response1.body);
    
    if (response1.status === 400 && response1.body.error === 'missing_event_id') {
      console.log('✅ Тест 1 ПРОЙДЕН: Система корректно требует event_id для первого сообщения клуба\n');
    } else {
      console.log('❌ Тест 1 НЕ ПРОЙДЕН: Система не требует event_id для первого сообщения клуба\n');
    }

    // Тест 2: Клуб отправляет первое сообщение пользователю С event_id (должно работать)
    console.log('Тест 2: Клуб отправляет первое сообщение С event_id...');
    const response2 = await request(app)
      .post('/api/chat/send')
      .set('Authorization', 'Bearer club_token_here') // Заглушка токена клуба
      .send({
        to_user: 'testuser',
        message: 'Привет от клуба!',
        event_id: 123
      });

    console.log('Статус ответа:', response2.status);
    console.log('Тело ответа:', response2.body);
    
    if (response2.status === 201 || response2.status === 200) {
      console.log('✅ Тест 2 ПРОЙДЕН: Система принимает первое сообщение клуба с event_id\n');
    } else {
      console.log('❌ Тест 2 НЕ ПРОЙДЕН: Система не принимает первое сообщение клуба с event_id\n');
    }

    // Тест 3: Пользователь отправляет первое сообщение клубу БЕЗ event_id (должна быть ошибка)
    console.log('Тест 3: Пользователь отправляет первое сообщение клубу БЕЗ event_id...');
    const response3 = await request(app)
      .post('/api/chat/send')
      .set('Authorization', 'Bearer user_token_here') // Заглушка токена пользователя
      .send({
        to_user: 'club_123',
        message: 'Привет клубу!',
        // event_id отсутствует
      });

    console.log('Статус ответа:', response3.status);
    console.log('Тело ответа:', response3.body);
    
    if (response3.status === 400 && response3.body.error === 'missing_event_id') {
      console.log('✅ Тест 3 ПРОЙДЕН: Система корректно требует event_id для первого сообщения пользователя к клубу\n');
    } else {
      console.log('❌ Тест 3 НЕ ПРОЙДЕН: Система не требует event_id для первого сообщения пользователя к клубу\n');
    }

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
  }
}

// Запуск теста
testClubFirstMessage();
