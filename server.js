require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Подключение к базе данных
const { sequelize, testConnection } = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Настройка безопасности
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://swingfox.ru', 'https://www.swingfox.ru']
    : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: 'Слишком много запросов с этого IP, попробуйте позже.'
});
app.use('/api/', limiter);

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Статические файлы
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/img', express.static(path.join(__dirname, 'public_html/img')));
app.use(express.static(path.join(__dirname, 'public_html')));

// Импорт роутов
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const swipeRoutes = require('./src/routes/swipe');
const chatRoutes = require('./src/routes/chat');
const adsRoutes = require('./src/routes/ads');
const adminRoutes = require('./src/routes/admin');

// Подключение роутов
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/swipe', swipeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/admin', adminRoutes);

// Проверка статуса API
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SwingFox API работает',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Внутренняя ошибка сервера' 
      : err.message 
  });
});

// 404 для API
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint не найден' });
});

// Отдача фронтенда для всех остальных запросов
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public_html', 'index.php'));
});

// Инициализация сервера
const startServer = async () => {
  try {
    // Тестируем подключение к БД
    await testConnection();
    
    // Синхронизируем модели (только в разработке)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Синхронизация моделей с базой данных...');
      await sequelize.sync({ force: false });
      console.log('✅ Модели синхронизированы');
    }
    
    // Запускаем сервер
    app.listen(PORT, () => {
      console.log('🚀 SwingFox сервер запущен на порту', PORT);
      console.log('📍 URL:', `http://localhost:${PORT}`);
      console.log('🔧 Режим:', process.env.NODE_ENV || 'development');
      console.log('📡 API доступно по адресу:', `http://localhost:${PORT}/api`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

// Запуск сервера
startServer();

module.exports = app;