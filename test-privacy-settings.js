#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки настроек приватности
 * Запуск: node test-privacy-settings.js
 */

const axios = require('axios');

// Конфигурация
const BASE_URL = 'http://localhost:3001/api';
const TEST_USER = {
  login: 'testuser',
  password: 'testpass123'
};

// Функция для логирования
const log = (message, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
};

// Функция для тестирования API
const testAPI = async (endpoint, method = 'GET', data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
};

// Основная функция тестирования
const runTests = async () => {
  log('🚀 Начинаем тестирование настроек приватности...');
  
  let authToken = null;
  
  // Тест 1: Регистрация/авторизация тестового пользователя
  log('Тест 1: Авторизация пользователя');
  const authResult = await testAPI('/auth/login', 'POST', {
    login: TEST_USER.login,
    password: TEST_USER.password
  });
  
  if (authResult.success) {
    authToken = authResult.data.token;
    log('✅ Авторизация успешна', 'SUCCESS');
  } else {
    log('❌ Авторизация не удалась, попробуем зарегистрировать пользователя', 'WARN');
    
    const regResult = await testAPI('/auth/register', 'POST', {
      login: TEST_USER.login,
      email: 'test@example.com',
      password: TEST_USER.password,
      status: 'Мужчина',
      country: 'Россия',
      city: 'Москва'
    });
    
    if (regResult.success) {
      log('✅ Регистрация успешна', 'SUCCESS');
      
      // Повторная попытка авторизации
      const authResult2 = await testAPI('/auth/login', 'POST', {
        login: TEST_USER.login,
        password: TEST_USER.password
      });
      
      if (authResult2.success) {
        authToken = authResult2.data.token;
        log('✅ Авторизация после регистрации успешна', 'SUCCESS');
      } else {
        log('❌ Авторизация после регистрации не удалась', 'ERROR');
        return;
      }
    } else {
      log('❌ Регистрация не удалась', 'ERROR');
      return;
    }
  }
  
  // Тест 2: Получение текущих настроек приватности
  log('Тест 2: Получение настроек приватности');
  const privacyResult = await testAPI('/users/privacy-settings', 'GET', null, authToken);
  
  if (privacyResult.success) {
    log('✅ Настройки приватности получены', 'SUCCESS');
    log(`📋 Текущие настройки: ${JSON.stringify(privacyResult.data, null, 2)}`, 'INFO');
  } else {
    log('❌ Не удалось получить настройки приватности', 'ERROR');
  }
  
  // Тест 3: Обновление настроек приватности
  log('Тест 3: Обновление настроек приватности');
  const newSettings = {
    privacy: {
      anonymous_visits: true,
      show_online_status: false,
      show_last_seen: false,
      allow_messages: false,
      allow_gifts: false,
      allow_ratings: false,
      allow_comments: false
    },
    notifications: {
      new_matches: true,
      messages: false,
      likes: true,
      gifts: false,
      profile_visits: true
    }
  };
  
  const updateResult = await testAPI('/users/privacy-settings', 'PUT', newSettings, authToken);
  
  if (updateResult.success) {
    log('✅ Настройки приватности обновлены', 'SUCCESS');
  } else {
    log('❌ Не удалось обновить настройки приватности', 'ERROR');
  }
  
  // Тест 4: Проверка обновленных настроек
  log('Тест 4: Проверка обновленных настроек');
  const privacyResult2 = await testAPI('/users/privacy-settings', 'GET', null, authToken);
  
  if (privacyResult2.success) {
    log('✅ Обновленные настройки получены', 'SUCCESS');
    log(`📋 Обновленные настройки: ${JSON.stringify(privacyResult2.data, null, 2)}`, 'INFO');
  } else {
    log('❌ Не удалось получить обновленные настройки', 'ERROR');
  }
  
  // Тест 5: Проверка API профиля с настройками приватности
  log('Тест 5: Проверка API профиля с настройками приватности');
  const profileResult = await testAPI(`/profiles/${TEST_USER.login}`, 'GET', null, authToken);
  
  if (profileResult.success) {
    log('✅ Профиль получен', 'SUCCESS');
    log(`👤 Статус онлайн: ${profileResult.data.profile.online}`, 'INFO');
  } else {
    log('❌ Не удалось получить профиль', 'ERROR');
  }
  
  // Тест 6: Проверка API гостей (требует VIP)
  log('Тест 6: Проверка API гостей');
  const guestsResult = await testAPI('/notifications/guests', 'GET', null, authToken);
  
  if (guestsResult.success) {
    log('✅ Гости получены', 'SUCCESS');
    log(`👥 Количество гостей: ${guestsResult.data.guests.length}`, 'INFO');
  } else {
    log(`⚠️ API гостей недоступен: ${guestsResult.error?.message || 'Неизвестная ошибка'}`, 'WARN');
  }
  
  log('🎉 Тестирование завершено!', 'SUCCESS');
};

// Запуск тестов
if (require.main === module) {
  runTests().catch(error => {
    log(`❌ Критическая ошибка: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = { runTests };
