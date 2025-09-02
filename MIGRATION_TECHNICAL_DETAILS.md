# 🔄 Технические детали миграции PHP → Node.js

## 📊 Обзор миграции

### Старый стек (Legacy)
- **Backend**: PHP 7.4 + Apache
- **База данных**: MySQL 5.7
- **Frontend**: HTML + CSS + jQuery
- **Архитектура**: Монолитная, смешанный код
- **Безопасность**: Базовая, PHP сессии

### Новый стек (Modern)
- **Backend**: Node.js 18+ + Express
- **База данных**: PostgreSQL 15 + Sequelize ORM
- **Frontend**: React 18 + Webpack 5
- **Архитектура**: API-first, компонентная
- **Безопасность**: JWT, bcrypt, Helmet

## 🗄️ Миграция базы данных

### MySQL → PostgreSQL

#### Ключевые изменения
```sql
-- Было (MySQL)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Стало (PostgreSQL)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    login VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Преимущества PostgreSQL
- **JSON поддержка**: Нативные JSON поля
- **Производительность**: Лучшие индексы, оптимизация
- **Типы данных**: UUID, ENUM, ARRAY
- **Транзакции**: ACID compliance

### Sequelize ORM

#### Модели
```javascript
// Было (PHP PDO)
$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$id]);
$user = $stmt->fetch();

// Стало (Sequelize)
const user = await User.findByPk(id);
```

#### Миграции
```javascript
// Автоматическое создание таблиц
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      login: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      }
    });
  }
};
```

## 🔐 Система авторизации

### PHP сессии → JWT токены

#### Было (PHP)
```php
<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}
$user_id = $_SESSION['user_id'];
?>
```

#### Стало (Node.js)
```javascript
// Middleware проверки JWT
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token required' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
```

#### Преимущества JWT
- **Stateless**: Нет необходимости хранить сессии на сервере
- **Масштабируемость**: Легко масштабировать на несколько серверов
- **Безопасность**: Подписанные токены, защита от подделки
- **Кроссплатформенность**: Работает с мобильными приложениями

## 📱 Frontend миграция

### jQuery → React

#### Было (jQuery)
```javascript
// Обработка формы
$('#loginForm').submit(function(e) {
    e.preventDefault();
    var login = $('#login').val();
    var password = $('#password').val();
    
    $.ajax({
        url: '/login.php',
        method: 'POST',
        data: { login: login, password: password },
        success: function(response) {
            if (response.success) {
                window.location.href = '/dashboard.php';
            }
        }
    });
});
```

#### Стало (React)
```javascript
// React компонент с хуками
const LoginForm = () => {
    const [formData, setFormData] = useState({
        login: '',
        password: ''
    });
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('token', data.token);
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <input
                value={formData.login}
                onChange={(e) => setFormData({...formData, login: e.target.value})}
            />
            <button type="submit">Войти</button>
        </form>
    );
};
```

#### Преимущества React
- **Компонентность**: Переиспользуемые компоненты
- **State Management**: Централизованное управление состоянием
- **Virtual DOM**: Оптимизация рендеринга
- **TypeScript**: Возможность типизации

## 🔄 API архитектура

### RESTful API

#### Структура эндпоинтов
```javascript
// Было (PHP файлы)
/login.php
/register.php
/profile.php
/chat.php

// Стало (Express роуты)
/api/auth/login
/api/auth/register
/api/users/profile
/api/chat/messages
```

#### Обработка запросов
```javascript
// Express роутер
router.post('/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        
        // Валидация
        const { error } = loginSchema.validate({ login, password });
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        
        // Бизнес-логика
        const user = await User.findOne({ where: { login } });
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // JWT токен
        const token = jwt.sign(
            { id: user.id, login: user.login },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
```

## 🐳 Docker контейнеризация

### Конфигурация сервисов

#### Backend контейнер
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

#### Frontend контейнер
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 443
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
services:
  backend:
    build: ./docker/backend
    ports:
      - "3001:3001"
    environment:
      - DB_HOST=postgres
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
  
  frontend:
    build: ./docker/frontend
    ports:
      - "443:443"
    depends_on:
      - backend
```

## 📊 Производительность

### Оптимизации

#### База данных
```javascript
// Индексы для быстрого поиска
await queryInterface.addIndex('users', ['login']);
await queryInterface.addIndex('users', ['email']);
await queryInterface.addIndex('users', ['location']);

// Пагинация
const users = await User.findAndCountAll({
    limit: 20,
    offset: (page - 1) * 20,
    include: ['profile', 'photos']
});
```

#### Кэширование
```javascript
// Redis кэширование (опционально)
const cacheKey = `user:${userId}`;
let user = await redis.get(cacheKey);

if (!user) {
    user = await User.findByPk(userId);
    await redis.setex(cacheKey, 3600, JSON.stringify(user));
}
```

#### Сжатие
```javascript
// Gzip сжатие
app.use(compression());

// Статические файлы
app.use('/uploads', express.static('public/uploads', {
    maxAge: '1d',
    etag: true
}));
```

## 🔒 Безопасность

### Меры защиты

#### Валидация данных
```javascript
// Joi схемы валидации
const userSchema = Joi.object({
    login: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(new RegExp('^[a-zA-Z0-9]{8,30}$')).required()
});
```

#### Rate Limiting
```javascript
// Ограничение запросов
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум 100 запросов
    message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

#### Helmet защита
```javascript
// Базовые заголовки безопасности
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"]
        }
    }
}));
```

## 📈 Мониторинг и логирование

### Логирование
```javascript
// Winston логгер
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});
```

### Health Checks
```javascript
// Проверка здоровья сервиса
app.get('/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({ status: 'healthy', timestamp: new Date() });
    } catch (error) {
        res.status(503).json({ status: 'unhealthy', error: error.message });
    }
});
```

## 🧪 Тестирование

### Unit тесты
```javascript
// Jest тесты
describe('User Model', () => {
    test('should create user with valid data', async () => {
        const userData = {
            login: 'testuser',
            email: 'test@example.com',
            password: 'password123'
        };
        
        const user = await User.create(userData);
        expect(user.login).toBe(userData.login);
        expect(user.email).toBe(userData.email);
    });
});
```

### API тесты
```javascript
// Supertest для API тестов
describe('Auth API', () => {
    test('POST /api/auth/login should authenticate user', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                login: 'testuser',
                password: 'password123'
            });
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
    });
});
```

## 📋 Чек-лист миграции

### Backend
- [x] Настройка Node.js окружения
- [x] Создание Express сервера
- [x] Настройка Sequelize ORM
- [x] Миграция моделей БД
- [x] Создание API роутов
- [x] JWT авторизация
- [x] Валидация данных
- [x] Middleware безопасности
- [x] Обработка ошибок
- [x] Логирование

### Frontend
- [x] Настройка React приложения
- [x] Webpack конфигурация
- [x] Компонентная архитектура
- [x] Роутинг
- [x] State management
- [x] API интеграция
- [x] Стилизация
- [x] Responsive дизайн

### DevOps
- [x] Docker контейнеризация
- [x] Docker Compose
- [x] SSL сертификаты
- [x] Health checks
- [x] Переменные окружения
- [x] Логирование
- [x] Мониторинг

---

**Статус миграции**: ✅ 100% завершено  
**Время выполнения**: ~3 месяца  
**Качество кода**: Высокое  
**Готовность к продакшену**: 🟢 Готово
