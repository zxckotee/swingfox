# 🦊 SwingFox - Современная платформа для знакомств

**SwingFox** - это полнофункциональная платформа для знакомств с продвинутой системой клубов, мероприятий и социальных функций. Проект представляет собой полную миграцию с устаревшего PHP-стэка на современный Node.js + React + PostgreSQL стек.

## 🚀 Быстрый старт с Docker

### Предварительные требования

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Git** для клонирования репозитория

### 1. Клонирование проекта

```bash
git clone <repository-url>
cd swingfox
```

### 2. Запуск через Docker Compose

```bash
# Запуск всех сервисов
docker-compose up -d

# Или с пересборкой образов
docker-compose up -d --build
```

### 3. Проверка статуса сервисов

```bash
# Статус всех контейнеров
docker-compose ps

# Логи backend сервиса
docker-compose logs -f backend

# Логи frontend сервиса
docker-compose logs -f frontend
```

### 4. Доступ к приложению

После успешного запуска приложение будет доступно по адресам:

- **🌐 Frontend (React)**: https://localhost:443
- **🔧 Backend API**: https://localhost:3001
- **📧 MailHog (Email тестирование)**: http://localhost:8025
- **🗄️ PostgreSQL**: localhost:5432

### 5. Остановка сервисов

```bash
# Остановка всех сервисов
docker-compose down

# Остановка с удалением volumes
docker-compose down -v
```

## 🏗️ Архитектура проекта

### Технологический стек

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: Sequelize 6+
- **База данных**: PostgreSQL 15
- **Авторизация**: JWT токены
- **Валидация**: Joi
- **Безопасность**: Helmet, CORS, Rate Limiting

#### Frontend
- **Framework**: React 18
- **Bundler**: Webpack 5
- **Styling**: Styled Components + SCSS
- **State Management**: React Query + Context API
- **Routing**: React Router DOM 6
- **UI Components**: Framer Motion, React Hook Form

#### DevOps
- **Контейнеризация**: Docker + Docker Compose
- **SSL**: Самоподписанные сертификаты для разработки
- **Process Manager**: PM2 (для продакшена)
- **Monitoring**: Health checks + logging

### Структура проекта

```
swingfox/
├── 📁 client/                 # React frontend
│   ├── src/
│   │   ├── components/        # React компоненты
│   │   ├── pages/            # Страницы приложения
│   │   ├── contexts/         # React Context
│   │   ├── services/         # API клиенты
│   │   └── styles/           # Стили и CSS
│   ├── webpack.config.js     # Webpack конфигурация
│   └── package.json
├── 📁 src/                    # Backend source code
│   ├── config/               # Конфигурация БД
│   ├── models/               # Sequelize модели
│   ├── routes/               # API роуты
│   ├── middleware/           # Express middleware
│   ├── services/             # Бизнес-логика
│   ├── utils/                # Утилиты
│   └── cron/                 # Cron задачи
├── 📁 migrations/            # Миграции БД
├── 📁 seeders/               # Сидеры данных
├── 📁 docker/                # Docker конфигурация
├── 📁 public_html/           # Старый PHP код (архив)
├── docker-compose.yml        # Docker Compose конфигурация
└── server.js                 # Точка входа backend
```

## 🔄 Миграция с PHP на Node.js

### Что было (Legacy PHP Stack)

```
PHP 7.4 + MySQL + HTML/CSS + jQuery
├── Монолитная архитектура
├── Смешанный HTML/PHP код
├── Устаревшие библиотеки
├── Отсутствие API
├── Проблемы с безопасностью
└── Сложность масштабирования
```

### Что стало (Modern Node.js Stack)

```
Node.js + PostgreSQL + React + Modern JS
├── Микросервисная архитектура
├── RESTful API
├── Современный frontend
├── Type-safe ORM
├── JWT авторизация
└── Docker контейнеризация
```

### Ключевые улучшения

#### 🗄️ База данных
- **MySQL → PostgreSQL**: Лучшая производительность, JSON поддержка
- **Ручные запросы → Sequelize ORM**: Type-safe, миграции, сидеры
- **Структура**: Нормализация, индексы, constraints

#### 🔐 Безопасность
- **PHP сессии → JWT токены**: Stateless, масштабируемость
- **Хеширование**: bcrypt для паролей
- **Валидация**: Joi schema validation
- **Rate Limiting**: Защита от DDoS

#### 📱 Frontend
- **jQuery → React**: Компонентная архитектура
- **Vanilla JS → Modern ES6+**: Async/await, деструктуризация
- **CSS → Styled Components**: CSS-in-JS, темизация

## 🚀 Запуск в режиме разработки

### 1. Локальная разработка (без Docker)

```bash
# Backend
npm install
npm run dev:backend

# Frontend (в отдельном терминале)
cd client
npm install
npm start
```

### 2. Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# База данных
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=root
DB_NAME=swingfox
DB_PORT=5432

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Email (для разработки используйте MailHog)
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=info@swingfox.ru

# Сервер
PORT=3001
NODE_ENV=development
```

### 3. Настройка базы данных

```bash
# Создание БД
createdb swingfox

# Запуск миграций
npm run migrate

# Заполнение тестовыми данными
npm run seed
```

## 📊 Основные функции системы

### 👥 Пользовательская система
- Регистрация/авторизация с JWT
- Профили с фото и настройками
- Система рейтингов и отзывов
- Геолокация и поиск по расстоянию

### 💬 Коммуникация
- Чаты между пользователями
- Система лайков и суперлайков
- Комментарии к фото и профилям
- Уведомления в реальном времени

### 🎯 Система свайпов
- Tinder-подобный интерфейс
- Алгоритм совместимости
- Фильтры по возрасту, расстоянию
- Система матчей

### 🏢 Клубная система
- Создание и управление клубами
- Организация мероприятий
- Система заявок и модерации
- Аналитика и отчеты
- Автоматизация через ботов

### 💰 Подписки и платежи
- Планы подписок
- Автопродление
- Система подарков
- Баланс и пополнение

### 📱 Административная панель
- Модерация пользователей
- Управление контентом
- Статистика и аналитика
- Система жалоб

## 🔧 API Endpoints

### Основные группы API

- **`/api/auth`** - Авторизация пользователей
- **`/api/users`** - Управление профилями
- **`/api/swipe`** - Система свайпов
- **`/api/chat`** - Чаты и сообщения
- **`/api/clubs`** - Клубная система
- **`/api/subscriptions`** - Подписки
- **`/api/admin`** - Административные функции

### Клубная система API

- **`/api/club/auth`** - Авторизация клубов
- **`/api/club/events`** - Управление мероприятиями
- **`/api/club/analytics`** - Аналитика клубов
- **`/api/club/bots`** - Автоматизация

## 🧪 Тестирование

### Запуск тестов

```bash
# Backend тесты
npm test

# Frontend тесты
cd client
npm test

# E2E тесты (если настроены)
npm run test:e2e
```

### Тестовые данные

```bash
# Заполнение тестовыми данными
npm run seed

# Специфичные сидеры
npm run seed:clubs
npm run seed:users
```

## 📦 Развертывание

### Продакшен сборка

```bash
# Frontend
cd client
npm run build

# Backend
npm run build
```

### Docker продакшен

```bash
# Продакшен образы
docker-compose -f docker-compose.prod.yml up -d
```

### Переменные окружения для продакшена

```env
NODE_ENV=production
DB_HOST=production-db-host
JWT_SECRET=strong-production-secret
EMAIL_HOST=smtp.provider.com
EMAIL_USER=production-email
EMAIL_PASSWORD=production-password
```

## 🐛 Отладка и логирование

### Логи в Docker

```bash
# Логи backend
docker-compose logs -f backend

# Логи frontend
docker-compose logs -f frontend

# Логи базы данных
docker-compose logs -f postgres
```

### Отладка Node.js

```bash
# Запуск с отладкой
docker-compose exec backend node --inspect=0.0.0.0:9229 server.js

# Подключение через Chrome DevTools
# chrome://inspect
```

## 📚 Документация

### Основные документы

- **`docs/CLUB_SYSTEM_IMPLEMENTATION_REPORT.md`** - Отчет о клубной системе
- **`docs/CLUB_API_DOCUMENTATION.md`** - API документация клубов
- **`docs/API_MIGRATION_GUIDE.md`** - Руководство по миграции
- **`docs/DEPLOYMENT_GUIDE.md`** - Руководство по развертыванию

### API документация

После запуска сервера API документация доступна по адресу:
- **Swagger UI**: https://localhost:3001/api-docs (если настроен)
- **Postman Collection**: Экспорт из Swagger

## 🤝 Участие в разработке

### Установка зависимостей для разработки

```bash
# Backend dev dependencies
npm install

# Frontend dev dependencies
cd client
npm install
```

### Стиль кода

- **Backend**: ESLint + Prettier
- **Frontend**: React ESLint + Prettier
- **Git**: Conventional Commits

### Команды для разработки

```bash
# Запуск в режиме разработки
npm run dev

# Только backend
npm run dev:backend

# Только frontend
npm run dev:frontend

# Миграции
npm run migrate
npm run migrate:undo

# Сидеры
npm run seed
npm run seed:undo
```

## 📞 Поддержка

### Полезные команды Docker

```bash
# Перезапуск сервиса
docker-compose restart backend

# Пересборка образа
docker-compose build --no-cache backend

# Очистка неиспользуемых ресурсов
docker system prune -a

# Просмотр использования ресурсов
docker stats
```

### Частые проблемы

1. **Порт 443 занят**: Измените порт в `docker-compose.yml`
2. **SSL ошибки**: Используйте `--insecure` в curl или настройте сертификаты
3. **Проблемы с БД**: Проверьте `docker-compose logs postgres`

## 🎯 Дорожная карта

### Завершенные этапы ✅

- [x] Базовая миграция с PHP на Node.js
- [x] Система пользователей и авторизации
- [x] Система свайпов и матчей
- [x] Клубная система
- [x] Система подписок
- [x] Чат и уведомления

### Планируемые улучшения 🚧

- [ ] PWA функциональность
- [ ] Push уведомления
- [ ] Видео чаты
- [ ] AI рекомендации
- [ ] Мобильные приложения
- [ ] Интеграция с социальными сетями

---

**SwingFox** - современная платформа для знакомств, построенная на лучших практиках веб-разработки.

**Версия**: 2.0.0  
**Статус**: 🟢 Продакшен готов  
**Последнее обновление**: 2024-01-02
