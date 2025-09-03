# Руководство по использованию улучшенного каталога

## Обзор

Каталог анкет был значительно улучшен с применением той же логики подбора, что и в системе свайпа. Теперь он использует SQL-запросы с расчетом совместимости прямо в базе данных для повышения производительности и качества рекомендаций.

## Основные endpoints

### 1. Основной каталог с фильтрами

**GET** `/api/catalog`

#### Параметры:
- `status` - массив статусов для фильтрации (например: `['Женщина', 'Семейная пара(М+Ж)']`)
- `country` - страна для фильтрации
- `city` - город для фильтрации (только если указана страна)
- `limit` - количество профилей на странице (по умолчанию: 14)
- `offset` - смещение для пагинации (по умолчанию: 0)

#### Пример запроса:
```javascript
const response = await fetch('/api/catalog?status[]=Женщина&country=Россия&city=Москва&limit=10&offset=0', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### Ответ:
```json
{
  "users": [
    {
      "id": 123,
      "login": "user123",
      "ava": "avatar.jpg",
      "status": "Женщина",
      "country": "Россия",
      "city": "Москва",
      "age": 25,
      "distance": 5,
      "compatibility": {
        "score": 0.85,
        "percentage": 85,
        "scores": {
          "mutualStatus": 1.0,
          "age": 0.8,
          "distance": 1.0,
          "location": 0.8,
          "lifestyle": 0.7
        },
        "recommendations": ["Отличная совместимость!"]
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### 2. Расширенные рекомендации

**GET** `/api/catalog/recommendations`

#### Параметры:
- `count` - количество рекомендаций (по умолчанию: 10)

#### Особенности:
- Возвращает только VIP профили
- Сортировка по совместимости
- Рандомизация для разнообразия
- Использует улучшенный алгоритм подбора

#### Пример запроса:
```javascript
const response = await fetch('/api/catalog/recommendations?count=15', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### Ответ:
```json
{
  "recommendations": [...],
  "total": 45,
  "requested": 15,
  "algorithm": "enhanced_compatibility_sql"
}
```

## Алгоритм совместимости

### Веса критериев:

1. **Взаимный поиск статусов** (25%) - самый важный критерий
   - Полная совместимость: 1.0 (оба ищут друг друга)
   - Частичная совместимость: 0.5 (один ищет другого)
   - Нет совместимости: 0.0

2. **Возрастная совместимость** (20%)
   - Разница до 5 лет: 1.0
   - Разница 6-10 лет: 0.8
   - Разница 11-20 лет: 0.6
   - Разница более 20 лет: 0.4

3. **Географическая близость** (15%)
   - До 10 км: 1.0
   - До 50 км: 0.8
   - До 100 км: 0.6
   - Более 100 км: 0.4

4. **Места встреч** (15%)
   - Полное совпадение: 1.0
   - Частичное совпадение: 0.8
   - Нет совпадений: 0.3

5. **Образ жизни** (10%)
   - Курение, алкоголь, другие привычки

6. **Физические параметры** (10%)
   - Рост, вес

7. **Активность** (5%)
   - Онлайн статус, дата регистрации

## Рекомендации по использованию

### Для главной страницы:
```javascript
// Получаем топ рекомендации
const recommendations = await fetch('/api/catalog/recommendations?count=20');
```

### Для поиска с фильтрами:
```javascript
// Поиск женщин в Москве
const searchResults = await fetch('/api/catalog?status[]=Женщина&city=Москва&limit=20');
```

### Для пагинации:
```javascript
// Загрузка следующей страницы
const nextPage = await fetch('/api/catalog?limit=20&offset=20');
```

## Отображение совместимости

### Простой индикатор:
```javascript
function getCompatibilityColor(score) {
  if (score >= 0.8) return '#4CAF50'; // Зеленый
  if (score >= 0.6) return '#FF9800'; // Оранжевый
  if (score >= 0.4) return '#FFC107'; // Желтый
  return '#F44336'; // Красный
}

function getCompatibilityText(score) {
  if (score >= 0.8) return 'Отличная совместимость!';
  if (score >= 0.6) return 'Хорошая совместимость';
  if (score >= 0.4) return 'Умеренная совместимость';
  return 'Низкая совместимость';
}
```

### Детальная информация:
```javascript
function renderCompatibilityDetails(compatibility) {
  return `
    <div class="compatibility-card">
      <div class="score">${compatibility.percentage}%</div>
      <div class="details">
        <div>Статус: ${Math.round(compatibility.scores.mutualStatus * 100)}%</div>
        <div>Возраст: ${Math.round(compatibility.scores.age * 100)}%</div>
        <div>Расстояние: ${Math.round(compatibility.scores.distance * 100)}%</div>
      </div>
      <div class="recommendations">
        ${compatibility.recommendations.map(rec => `<div>• ${rec}</div>`).join('')}
      </div>
    </div>
  `;
}
```

## Обработка ошибок

### Основные ошибки:
```javascript
try {
  const response = await fetch('/api/catalog');
  const data = await response.json();
  
  if (response.ok) {
    // Успешный ответ
    return data;
  } else {
    // Обработка ошибок API
    switch (data.error) {
      case 'user_not_found':
        console.error('Пользователь не найден');
        break;
      case 'no_profiles':
        console.error('Нет доступных профилей');
        break;
      default:
        console.error('Ошибка сервера:', data.message);
    }
  }
} catch (error) {
  console.error('Ошибка сети:', error);
}
```

## Производительность

### Кэширование:
```javascript
// Кэшируем результаты на 5 минут
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function getCachedCatalog(params) {
  const cacheKey = JSON.stringify(params);
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetchCatalog(params);
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  return data;
}
```

### Оптимизация запросов:
```javascript
// Используем debounce для поиска
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedSearch = debounce(async (query) => {
  const results = await searchCatalog(query);
  updateResults(results);
}, 300);
```

## Заключение

Улучшенный каталог предоставляет:

1. **Высокую производительность** - SQL-запросы с расчетом совместимости
2. **Качественные рекомендации** - тот же алгоритм, что и в свайпе
3. **Гибкую фильтрацию** - по статусу, стране, городу
4. **Детальную информацию** - о совместимости по каждому критерию
5. **Пагинацию** - для работы с большими объемами данных

Используйте эти возможности для создания лучшего пользовательского опыта в вашем приложении!
