require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
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

// Статические файлы (только для API)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Импорт роутов
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const swipeRoutes = require('./src/routes/swipe');
const chatRoutes = require('./src/routes/chat');
const adsRoutes = require('./src/routes/ads');
const adminRoutes = require('./src/routes/admin');
const geoRoutes = require('./src/routes/geo');

// Подключение роутов
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/swipe', swipeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/geo', geoRoutes);

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

// 404 для всех остальных запросов (это API-only сервер)
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint не найден. Это API сервер, фронтенд доступен на порту 443.'
  });
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
    
    // Настройка HTTPS для разработки
    if (process.env.NODE_ENV === 'development') {
      try {
        // Пути к SSL сертификатам
        const sslKeyPath = fs.existsSync('./ssl/localhost.key')
          ? './ssl/localhost.key'
          : '/app/ssl/localhost.key';
        const sslCertPath = fs.existsSync('./ssl/localhost.crt')
          ? './ssl/localhost.crt'
          : '/app/ssl/localhost.crt';

        // Проверяем наличие SSL файлов
        if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
          const httpsOptions = {
            key: fs.readFileSync(sslKeyPath),
            cert: fs.readFileSync(sslCertPath)
          };
          
          // Запускаем HTTPS сервер
          https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
            console.log('🚀 SwingFox HTTPS сервер запущен на порту', PORT);
            console.log('📍 URL:', `https://localhost:${PORT}`);
            console.log('🔧 Режим:', process.env.NODE_ENV || 'development');
            console.log('📡 API доступно по адресу:', `https://localhost:${PORT}/api`);
            console.log('🔒 SSL сертификаты загружены успешно');
          });
        } else {
          console.warn('⚠️  SSL сертификаты не найдены, запускаем HTTP сервер');
          console.warn('💡 Для HTTPS выполните: cd docker/ssl && ./generate-certs.sh');
          
          // Fallback на HTTP
          app.listen(PORT, '0.0.0.0', () => {
            console.log('🚀 SwingFox HTTP сервер запущен на порту', PORT);
            console.log('📍 URL:', `http://localhost:${PORT}`);
            console.log('🔧 Режим:', process.env.NODE_ENV || 'development');
            console.log('📡 API доступно по адресу:', `http://localhost:${PORT}/api`);
          });
        }
      } catch (sslError) {
        console.error('❌ Ошибка настройки SSL:', sslError.message);
        console.log('🔄 Запускаем HTTP сервер в качестве fallback...');
        
        // Fallback на HTTP
        app.listen(PORT, '0.0.0.0', () => {
          console.log('🚀 SwingFox HTTP сервер запущен на порту', PORT);
          console.log('📍 URL:', `http://localhost:${PORT}`);
          console.log('🔧 Режим:', process.env.NODE_ENV || 'development');
          console.log('📡 API доступно по адресу:', `http://localhost:${PORT}/api`);
        });
      }
    } else {
      // Production режим - используем HTTP (HTTPS должен настраиваться через reverse proxy)
      app.listen(PORT, () => {
        console.log('🚀 SwingFox сервер запущен на порту', PORT);
        console.log('📍 URL:', `http://localhost:${PORT}`);
        console.log('🔧 Режим:', process.env.NODE_ENV || 'development');
        console.log('📡 API доступно по адресу:', `http://localhost:${PORT}/api`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

// Запуск сервера
startServer();

module.exports = app;