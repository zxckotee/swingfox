#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки настроек приватности
 * Проверяет сохранение и загрузку настроек из базы данных
 */

const axios = require('axios');

const API_BASE_URL = 'https://88.218.121.216:3001/api';
const TEST_USER = {
  login: 'alex_maria_couple',
  password: 'test123' // Замените на реальный пароль
};

async function testPrivacySettings() {
  try {
    console.log('🔐 Тестирование настроек приватности...\n');

    // 1. Авторизация
    console.log('1. Авторизация пользователя...');
    const authResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: TEST_USER.login,
      password: TEST_USER.password
    });

    const token = authResponse.data.token;
    console.log('✅ Авторизация успешна\n');

    // 2. Получение текущих настроек
    console.log('2. Получение текущих настроек...');
    const getSettingsResponse = await axios.get(`${API_BASE_URL}/users/privacy-settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const currentSettings = getSettingsResponse.data;
    console.log('📋 Текущие настройки:', JSON.stringify(currentSettings, null, 2));
    console.log('✅ Настройки получены\n');

    // 3. Изменение настроек
    console.log('3. Изменение настроек...');
    const newSettings = {
      privacy: {
        anonymous_visits: true,
        show_online_status: false,
        show_last_seen: true,
        allow_messages: true,
        allow_gifts: false,
        allow_ratings: true,
        allow_comments: false
      },
      notifications: {
        new_matches: false,
        messages: true,
        likes: false,
        gifts: true,
        profile_visits: false
      }
    };

    console.log('📝 Новые настройки:', JSON.stringify(newSettings, null, 2));

    const updateResponse = await axios.put(`${API_BASE_URL}/users/privacy-settings`, newSettings, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Настройки обновлены:', updateResponse.data);
    console.log('');

    // 4. Повторное получение настроек для проверки
    console.log('4. Проверка сохраненных настроек...');
    const verifyResponse = await axios.get(`${API_BASE_URL}/users/privacy-settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const savedSettings = verifyResponse.data;
    console.log('📋 Сохраненные настройки:', JSON.stringify(savedSettings, null, 2));

    // 5. Сравнение настроек
    console.log('5. Сравнение настроек...');
    const settingsMatch = JSON.stringify(newSettings) === JSON.stringify(savedSettings.privacy_settings);
    
    if (settingsMatch) {
      console.log('✅ Настройки сохранены корректно!');
    } else {
      console.log('❌ Настройки не совпадают!');
      console.log('Ожидалось:', JSON.stringify(newSettings, null, 2));
      console.log('Получено:', JSON.stringify(savedSettings.privacy_settings, null, 2));
    }

    // 6. Восстановление исходных настроек
    console.log('\n6. Восстановление исходных настроек...');
    await axios.put(`${API_BASE_URL}/users/privacy-settings`, {
      privacy: currentSettings.privacy_settings.privacy,
      notifications: currentSettings.privacy_settings.notifications
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Исходные настройки восстановлены');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
  }
}

// Запуск теста
if (require.main === module) {
  testPrivacySettings();
}

module.exports = { testPrivacySettings };