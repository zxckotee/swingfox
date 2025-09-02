# 📚 Документация API Клубной Системы

## 🎯 Обзор

Клубная система SwingFox предоставляет полный набор API для управления клубами, мероприятиями, объявлениями и автоматизацией. Система полностью изолирована от пользовательского интерфейса через префикс `/api/club/`.

## 🔐 Аутентификация

### JWT токены для клубов

Клубы используют отдельную систему JWT токенов с секретом `CLUB_JWT_SECRET`.

**Заголовок авторизации:**
```
Authorization: Bearer <club_jwt_token>
```

## 📋 API Endpoints

### 🔑 Авторизация клубов (`/api/club/auth`)

#### Регистрация клуба
```http
POST /api/club/auth/register
```

**Тело запроса:**
```json
{
  "name": "Название клуба",
  "login": "unique_login",
  "email": "club@example.com",
  "password": "password123",
  "description": "Описание клуба",
  "location": "Москва, ул. Тверская, 15",
  "contact_info": "Телефон: +7 (495) 123-45-67",
  "website": "https://club.ru",
  "type": "nightclub"
}
```

**Ответ:**
```json
{
  "message": "Клуб успешно зарегистрирован",
  "token": "club_jwt_token",
  "club": {
    "id": 1,
    "name": "Название клуба",
    "login": "unique_login",
    "email": "club@example.com",
    "type": "nightclub"
  }
}
```

#### Вход клуба
```http
POST /api/club/auth/login
```

**Тело запроса:**
```json
{
  "login": "unique_login",
  "password": "password123"
}
```

#### Получение профиля
```http
GET /api/club/auth/profile
Authorization: Bearer <club_jwt_token>
```

#### Обновление профиля
```http
PUT /api/club/auth/profile
Authorization: Bearer <club_jwt_token>
```

### 📅 Управление мероприятиями (`/api/club/events`)

#### Создание мероприятия
```http
POST /api/club/events
Authorization: Bearer <club_jwt_token>
```

**Тело запроса:**
```json
{
  "title": "Вечеринка 80-х",
  "description": "Описание мероприятия",
  "date": "2024-02-15",
  "time": "22:00:00",
  "location": "Клуб",
  "max_participants": 150,
  "price": 2000.00,
  "event_type": "party",
  "is_premium": true,
  "auto_invite_enabled": true
}
```

#### Получение списка мероприятий
```http
GET /api/club/events?status=upcoming&limit=20&offset=0
Authorization: Bearer <club_jwt_token>
```

#### Обновление мероприятия
```http
PUT /api/club/events/:eventId
Authorization: Bearer <club_jwt_token>
```

#### Удаление мероприятия
```http
DELETE /api/club/events/:eventId
Authorization: Bearer <club_jwt_token>
```

#### Приглашение участников
```http
POST /api/club/events/:eventId/invite
Authorization: Bearer <club_jwt_token>
```

**Тело запроса:**
```json
{
  "userIds": [1, 2, 3, 4, 5]
}
```

### 📢 Управление объявлениями (`/api/club/ads`)

#### Создание объявления
```http
POST /api/club/ads
Authorization: Bearer <club_jwt_token>
```

**Тело запроса:**
```json
{
  "title": "Заголовок объявления",
  "description": "Описание объявления",
  "type": "Вечеринки",
  "country": "Россия",
  "city": "Москва",
  "price": 2000.00,
  "contact_info": "Контактная информация",
  "event_id": 1,
  "viral_share_enabled": true,
  "referral_bonus": 200.00
}
```

#### Получение объявлений клуба
```http
GET /api/club/ads?status=approved&limit=20&offset=0
Authorization: Bearer <club_jwt_token>
```

### 📊 Аналитика (`/api/club/analytics`)

#### Общая аналитика
```http
GET /api/club/analytics/overview?period=week
Authorization: Bearer <club_jwt_token>
```

#### Аналитика мероприятий
```http
GET /api/club/analytics/events?limit=10
Authorization: Bearer <club_jwt_token>
```

#### Аналитика участников
```http
GET /api/club/analytics/participants
Authorization: Bearer <club_jwt_token>
```

#### Аналитика объявлений
```http
GET /api/club/analytics/ads
Authorization: Bearer <club_jwt_token>
```

#### Финансовая аналитика
```http
GET /api/club/analytics/financial
Authorization: Bearer <club_jwt_token>
```

### 📝 Управление заявками (`/api/club/applications`)

#### Получение заявок
```http
GET /api/club/applications?status=pending&limit=20&offset=0
Authorization: Bearer <club_jwt_token>
```

#### Одобрение заявки
```http
PUT /api/club/applications/:applicationId/approve
Authorization: Bearer <club_jwt_token>
```

#### Отклонение заявки
```http
PUT /api/club/applications/:applicationId/reject
Authorization: Bearer <club_jwt_token>
```

#### Массовое одобрение
```http
POST /api/club/applications/bulk-approve
Authorization: Bearer <club_jwt_token>
```

**Тело запроса:**
```json
{
  "applicationIds": [1, 2, 3, 4, 5]
}
```

### 🤖 Управление ботами (`/api/club/bots`)

#### Получение ботов
```http
GET /api/club/bots
Authorization: Bearer <club_jwt_token>
```

#### Обновление настроек бота
```http
PUT /api/club/bots/:botId/settings
Authorization: Bearer <club_jwt_token>
```

**Тело запроса:**
```json
{
  "settings": {
    "autoInvite": true,
    "maxInvitesPerEvent": 50,
    "reminderHours": [24, 2]
  }
}
```

#### Активация/деактивация бота
```http
PUT /api/club/bots/:botId/toggle
Authorization: Bearer <club_jwt_token>
```

#### Ручной запуск авто-приглашений
```http
POST /api/club/bots/auto-invites/:eventId
Authorization: Bearer <club_jwt_token>
```

#### Генерация рекомендаций
```http
POST /api/club/bots/recommendations
Authorization: Bearer <club_jwt_token>
```

### 👥 Пользовательские API (`/api/club/user-events`)

#### Публичные мероприятия
```http
GET /api/club/user-events/public/events?limit=10&type=party&city=Москва
```

#### Присоединение к мероприятию
```http
POST /api/club/user-events/events/:eventId/join
Authorization: Bearer <user_jwt_token>
```

#### Отмена участия
```http
DELETE /api/club/user-events/events/:eventId/leave
Authorization: Bearer <user_jwt_token>
```

#### Мероприятия пользователя
```http
GET /api/club/user-events/user/events?status=confirmed
Authorization: Bearer <user_jwt_token>
```

#### Рекомендации мероприятий
```http
GET /api/club/user-events/recommendations?limit=10
Authorization: Bearer <user_jwt_token>
```

## 📊 Типы данных

### Типы клубов
- `nightclub` - Ночной клуб
- `restaurant` - Ресторан
- `event_space` - Event Space
- `other` - Другое

### Типы мероприятий
- `party` - Вечеринка
- `dinner` - Ужин
- `meeting` - Встреча
- `other` - Другое

### Статусы участников
- `invited` - Приглашен
- `confirmed` - Подтвержден
- `declined` - Отклонен
- `maybe` - Возможно

### Статусы заявок
- `pending` - На рассмотрении
- `approved` - Одобрена
- `rejected` - Отклонена

## 🔧 Настройки ботов

### Бот "Авто-приглашения"
```json
{
  "autoInvite": true,
  "maxInvitesPerEvent": 50,
  "userPreferences": ["age", "location", "interests"]
}
```

### Бот "Напоминания"
```json
{
  "reminderHours": [24, 2],
  "reminderTypes": ["push", "email"]
}
```

### Бот "Аналитика"
```json
{
  "trackMetrics": true,
  "generateReports": true,
  "reportFrequency": "weekly"
}
```

## ⚡ Cron-задачи

Система автоматически выполняет следующие задачи:

- **Каждый час**: Отправка напоминаний о мероприятиях
- **Каждые 6 часов**: Автоматические приглашения на новые мероприятия
- **Каждый день в 2:00**: Обновление статистики клубов
- **Каждые 3 дня в 3:00**: Генерация рекомендаций
- **Каждую неделю в воскресенье в 4:00**: Очистка старых данных

## 🚀 Примеры использования

### Создание клуба и мероприятия

```javascript
// 1. Регистрация клуба
const clubResponse = await fetch('/api/club/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Мой клуб',
    login: 'my_club',
    email: 'club@example.com',
    password: 'password123',
    type: 'nightclub'
  })
});

const { token, club } = await clubResponse.json();

// 2. Создание мероприятия
const eventResponse = await fetch('/api/club/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Вечеринка',
    description: 'Описание',
    date: '2024-02-15',
    time: '22:00:00',
    event_type: 'party'
  })
});
```

### Получение аналитики

```javascript
const analyticsResponse = await fetch('/api/club/analytics/overview?period=week', {
  headers: {
    'Authorization': `Bearer ${clubToken}`
  }
});

const analytics = await analyticsResponse.json();
console.log('Аналитика:', analytics);
```

## 🔒 Безопасность

- Все API эндпоинты клубов требуют JWT авторизации
- Проверка прав доступа к ресурсам клуба
- Валидация входных данных
- Rate limiting для предотвращения злоупотреблений

## 📝 Логирование

Все действия клубов логируются для аудита:
- Создание/обновление мероприятий
- Управление участниками
- Финансовые операции
- Действия ботов

## 🆘 Поддержка

При возникновении проблем с API клубной системы:

1. Проверьте правильность JWT токена
2. Убедитесь в корректности формата данных
3. Проверьте логи сервера
4. Обратитесь к документации по ошибкам

---

**Версия API:** 1.0.0  
**Последнее обновление:** 2024-01-02
