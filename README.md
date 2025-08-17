# SwingFox Server - Node.js Migration

Миграция backend сервера SwingFox с PHP на Node.js + Express + PostgreSQL.

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 16+ 
- PostgreSQL 12+
- npm или yarn

### Установка

1. **Клонирование и установка зависимостей:**
```bash
npm install
```

2. **Настройка базы данных PostgreSQL:**
```sql
CREATE DATABASE swingfox;
CREATE USER postgres WITH PASSWORD 'root';
GRANT ALL PRIVILEGES ON DATABASE swingfox TO postgres;
```

3. **Настройка переменных окружения:**
Отредактируйте файл `.env`:
```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=root
DB_NAME=swingfox
JWT_SECRET=your-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

4. **Выполнение миграций:**
```bash
npm run migrate
```

5. **Запуск сервера (порт 3001):**
```bash
# В режиме разработки
npm run dev

# В продакшене
npm start
```

6. **Запуск фронтенда (порт 443):**
```bash
cd client
npm start
```

## 🌐 Архитектура портов

- **API сервер:** http://localhost:3001
- **React фронтенд:** http://localhost:443
- **MailHog (для email):** http://localhost:8025

## 📚 API Endpoints

### Авторизация (`/api/auth`)
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/send-code` - Отправка email кода
- `POST /api/auth/reset-password` - Сброс пароля
- `POST /api/auth/logout` - Выход

### Свайпинг (`/api/swipe`)
- `GET /api/swipe/profiles` - Получение профилей
- `POST /api/swipe/like` - Лайк профиля
- `POST /api/swipe/dislike` - Дизлайк профиля  
- `POST /api/swipe/superlike` - Суперлайк
- `GET /api/swipe/superlike-count` - Количество суперлайков

### Пользователи (`/api/users`) 
- `GET /api/users/profile/:login` - Профиль пользователя
- `PUT /api/users/profile` - Обновление профиля
- `POST /api/users/upload-avatar` - Загрузка аватара

## 🔧 Технологический стек

- **Backend:** Node.js + Express
- **База данных:** PostgreSQL + Sequelize ORM
- **Авторизация:** JWT токены
- **Email:** Nodemailer
- **Безопасность:** Helmet, CORS, Rate Limiting

## 📋 План миграции

- [x] Настройка окружения Node.js
- [x] Создание миграций PostgreSQL
- [x] Создание моделей Sequelize  
- [x] Настройка JWT авторизации
- [x] Базовая структура Express сервера
- [x] Роуты авторизации
- [x] Роуты свайпинга
- [ ] Роуты чатов
- [ ] Роуты объявлений
- [ ] Административные роуты
- [ ] Замена AJAX на fetch
- [ ] Тестирование
- [ ] Подготовка к React

## 🔄 Замена PHP роутов на Node.js

### Было (PHP):
```php
if (isset($_POST['login'])) {
    // Логика авторизации
}
```

### Стало (Node.js):
```javascript
router.post('/login', async (req, res) => {
    // Логика авторизации
});
```

### Авторизация с JWT токенами

Вместо PHP сессий используются JWT токены:

```javascript
// Клиентский код
const token = localStorage.getItem('token');
fetch('/api/swipe/profiles', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
```

## 📝 Примеры использования

### Авторизация:
```javascript
const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: 'user', password: 'pass' })
});

const data = await response.json();
if (data.success) {
    localStorage.setItem('token', data.token);
}
```

### Получение профилей:
```javascript
const response = await fetch('/api/swipe/profiles', {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
});

const profile = await response.json();
```

## 🛠️ Разработка

Структура проекта:
```
├── src/
│   ├── config/         # Конфигурация БД
│   ├── middleware/     # Middleware (авторизация)
│   ├── models/         # Модели Sequelize
│   ├── routes/         # API роуты
│   └── utils/          # Утилиты
├── migrations/         # Миграции БД
├── public_html/        # Статические файлы
└── server.js          # Основной файл сервера
```

## 🔒 Безопасность

- JWT токены для авторизации
- Хеширование паролей bcrypt
- Rate limiting для API
- CORS настройки
- Helmet для базовой защиты
- Валидация входных данных

---

**Статус проекта:** В разработке  
**Версия:** 1.0.0

docker run -d -p 1025:1025 -p 8025:8025 --name mailhog mailhog/mailhog - запуска почтового сервера
