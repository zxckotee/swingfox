const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testCitiesAPI() {
  console.log('🧪 Тестирование API городов...\n');
  
  try {
    // Тест 1: Получение списка стран
    console.log('1️⃣ Тестирую получение списка стран...');
    const countriesResponse = await axios.get(`${BASE_URL}/geo/countries`);
    console.log('✅ Страны получены:', countriesResponse.data.count, 'стран');
    
    // Ищем Австралию
    const australia = countriesResponse.data.data.find(c => c.country === 'Австралия');
    if (australia) {
      console.log('✅ Австралия найдена в списке стран');
    } else {
      console.log('❌ Австралия НЕ найдена в списке стран');
      console.log('Доступные страны:', countriesResponse.data.data.map(c => c.country).slice(0, 10));
    }
    
    // Тест 2: Получение городов для Австралии
    console.log('\n2️⃣ Тестирую получение городов для Австралии...');
    const citiesResponse = await axios.get(`${BASE_URL}/geo/cities/Австралия?limit=10`);
    console.log('✅ Города получены:', citiesResponse.data.count, 'городов');
    
    if (citiesResponse.data.data.length > 0) {
      console.log('Первые города:', citiesResponse.data.data.slice(0, 5));
    } else {
      console.log('❌ Города для Австралии не найдены');
    }
    
    // Тест 3: Поиск городов по названию
    console.log('\n3️⃣ Тестирую поиск городов по названию...');
    const searchResponse = await axios.get(`${BASE_URL}/geo/cities/Австралия?search=Сидней&limit=5`);
    console.log('✅ Поиск выполнен:', searchResponse.data.count, 'результатов');
    
    if (searchResponse.data.data.length > 0) {
      console.log('Результаты поиска:', searchResponse.data.data);
    } else {
      console.log('❌ Поиск не дал результатов');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании API:', error.message);
    if (error.response) {
      console.error('Статус:', error.response.status);
      console.error('Данные:', error.response.data);
    }
  }
}

// Запуск теста
testCitiesAPI();
