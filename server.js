require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Подключение к базе данных
const { sequelize, testConnection } = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Создаем HTTP сервер для Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://swingfox.ru', 'https://www.swingfox.ru']
      : true,
    credentials: true
  }
});

// Настройка безопасности
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://swingfox.ru', 'https://www.swingfox.ru']
    : true,
  credentials: true
}));

// Rate limiting
/*const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: 'Слишком много запросов с этого IP, попробуйте позже.'
});
app.use('/api/', limiter);*/

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Статические файлы (только для API)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Импорт роутов
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const swipeRoutes = require('./src/routes/swipe');
const catalogRoutes = require('./src/routes/catalog');
const chatRoutes = require('./src/routes/chat');
const adsRoutes = require('./src/routes/ads');
const adminRoutes = require('./src/routes/admin');
const geoRoutes = require('./src/routes/geo');
const uploadsRoutes = require('./src/routes/uploads');
const notificationsRoutes = require('./src/routes/notifications');
const giftsRoutes = require('./src/routes/gifts');
const clubsRoutes = require('./src/routes/clubs');
const subscriptionsRoutes = require('./src/routes/subscriptions');
const subscriptionPlansRoutes = require('./src/routes/subscription-plans');
const ratingRoutes = require('./src/routes/rating');
const profilesRoutes = require('./src/routes/profiles');
const photoCommentsRoutes = require('./src/routes/photo-comments');
const profileCommentsRoutes = require('./src/routes/profile-comments');
const reactionsRoutes = require('./src/routes/reactions');

// Импорт роутов клубной системы
const clubAuthRoutes = require('./src/routes/clubAuth');
const clubEventsRoutes = require('./src/routes/clubEvents');
const clubAnalyticsRoutes = require('./src/routes/clubAnalytics');
const clubUserEventsRoutes = require('./src/routes/clubUserEvents');
const clubChatsRoutes = require('./src/routes/clubChats');

// Импорт cron-задач для подписок
const SubscriptionCron = require('./src/cron/subscriptionCron');
// Импорт cron-задач для клубов
const ClubCron = require('./src/cron/clubCron');
// Импорт middleware для обновления активности
const updateUserActivity = require('./src/middleware/updateActivity');

// Подключение роутов
app.use('/api/auth', authRoutes);

// Middleware для обновления активности пользователя (только для аутентифицированных роутов)
app.use('/api/users', updateUserActivity, userRoutes);
app.use('/api/swipe', updateUserActivity, swipeRoutes);
app.use('/api/catalog', updateUserActivity, catalogRoutes);
app.use('/api/chat', updateUserActivity, chatRoutes);
app.use('/api/ads', updateUserActivity, adsRoutes);
app.use('/api/admin', updateUserActivity, adminRoutes);
app.use('/api/geo', updateUserActivity, geoRoutes);
app.use('/api/uploads', updateUserActivity, uploadsRoutes);
app.use('/api/notifications', updateUserActivity, notificationsRoutes);
app.use('/api/gifts', updateUserActivity, giftsRoutes);
app.use('/api/clubs', updateUserActivity, clubsRoutes);
app.use('/api/subscriptions', updateUserActivity, subscriptionsRoutes);
app.use('/api/subscription-plans', updateUserActivity, subscriptionPlansRoutes);
app.use('/api/rating', updateUserActivity, ratingRoutes);
app.use('/api/profiles', updateUserActivity, profilesRoutes);
app.use('/api/photo-comments', updateUserActivity, photoCommentsRoutes);
app.use('/api/profile-comments', updateUserActivity, profileCommentsRoutes);
app.use('/api/reactions', updateUserActivity, reactionsRoutes);

// Подключение роутов клубной системы
app.use('/api/club/auth', clubAuthRoutes);
app.use('/api/club/events', updateUserActivity, clubEventsRoutes);
app.use('/api/club/analytics', updateUserActivity, clubAnalyticsRoutes);
app.use('/api/club/user-events', updateUserActivity, clubUserEventsRoutes);
app.use('/api/club/chats', updateUserActivity, clubChatsRoutes);

// WebSocket обработчики
io.on('connection', (socket) => {
  console.log('WebSocket client connected:', socket.id);

  // Присоединение к комнате клубного чата
  socket.on('join-club-chat', (data) => {
    const { clubId, eventId, userId } = data;
    const roomName = `club-chat-${clubId}-${eventId}-${userId}`;
    socket.join(roomName);
    console.log(`Client ${socket.id} joined room: ${roomName}`);
  });

  // Присоединение к комнате обычного чата между пользователями
  socket.on('join-user-chat', (data) => {
    const { fromUser, toUser } = data;
    const roomName = `user-chat-${fromUser}-${toUser}`;
    socket.join(roomName);
    console.log(`Client ${socket.id} joined user chat room: ${roomName}`);
  });

  // Отправка сообщения в клубном чате
  socket.on('club-chat-message', (data) => {
    const { clubId, eventId, userId, message, senderType } = data;
    const roomName = `club-chat-${clubId}-${eventId}-${userId}`;
    
    // Отправляем сообщение всем участникам комнаты
    io.to(roomName).emit('club-chat-message', {
      ...data,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Message sent to room ${roomName}:`, message);
  });

  // Отправка сообщения в обычном чате между пользователями
  socket.on('user-chat-message', (data) => {
    const { fromUser, toUser, message, messageId } = data;
    const roomName = `user-chat-${fromUser}-${toUser}`;
    
    // Отправляем сообщение всем участникам комнаты
    io.to(roomName).emit('user-chat-message', {
      ...data,
      timestamp: new Date().toISOString()
    });
    
    console.log(`User message sent to room ${roomName}:`, message);
  });

  // Отключение
  socket.on('disconnect', () => {
    console.log('WebSocket client disconnected:', socket.id);
  });
});

// Делаем io доступным для роутов
app.set('io', io);

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
    
    // Запускаем cron-задачи для подписок
    console.log('🕐 Запуск cron-задач для автоматического управления подписками...');
    const subscriptionCron = new SubscriptionCron();
    subscriptionCron.start();
    console.log('✅ Cron-задачи для подписок запущены');
    
    // Запускаем cron-задачи для клубов
    console.log('🕐 Запуск cron-задач для автоматизации клубов...');
    const clubCron = new ClubCron();
    clubCron.start();
    console.log('✅ Cron-задачи для клубов запущены');
    
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
          const httpsServer = https.createServer(httpsOptions, app);
          const httpsIO = new Server(httpsServer, {
            cors: {
              origin: process.env.NODE_ENV === 'production' 
                ? ['https://swingfox.ru', 'https://www.swingfox.ru']
                : true,
              credentials: true
            }
          });
          
          // Копируем WebSocket обработчики для HTTPS
          httpsIO.on('connection', (socket) => {
            console.log('WebSocket client connected (HTTPS):', socket.id);
            
            socket.on('join-club-chat', (data) => {
              const { clubId, eventId, userId } = data;
              const roomName = `club-chat-${clubId}-${eventId}-${userId}`;
              socket.join(roomName);
              console.log(`Client ${socket.id} joined room: ${roomName}`);
            });

            socket.on('join-user-chat', (data) => {
              const { fromUser, toUser } = data;
              const roomName = `user-chat-${fromUser}-${toUser}`;
              socket.join(roomName);
              console.log(`Client ${socket.id} joined user chat room: ${roomName}`);
            });

            socket.on('club-chat-message', (data) => {
              const { clubId, eventId, userId, message, senderType } = data;
              const roomName = `club-chat-${clubId}-${eventId}-${userId}`;
              
              httpsIO.to(roomName).emit('club-chat-message', {
                ...data,
                timestamp: new Date().toISOString()
              });
              
              console.log(`Message sent to room ${roomName}:`, message);
            });

            socket.on('user-chat-message', (data) => {
              const { fromUser, toUser, message, messageId } = data;
              const roomName = `user-chat-${fromUser}-${toUser}`;
              
              httpsIO.to(roomName).emit('user-chat-message', {
                ...data,
                timestamp: new Date().toISOString()
              });
              
              console.log(`User message sent to room ${roomName}:`, message);
            });

            socket.on('disconnect', () => {
              console.log('WebSocket client disconnected (HTTPS):', socket.id);
            });
          });
          
          httpsServer.listen(PORT, '0.0.0.0', () => {
            console.log('🚀 SwingFox HTTPS сервер запущен на порту', PORT);
            console.log('📍 URL:', `https://localhost:${PORT}`);
            console.log('🔧 Режим:', process.env.NODE_ENV || 'development');
            console.log('📡 API доступно по адресу:', `https://localhost:${PORT}/api`);
            console.log('🔌 WebSocket доступен по адресу:', `wss://localhost:${PORT}`);
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
        httpServer.listen(PORT, '0.0.0.0', () => {
          console.log('🚀 SwingFox HTTP сервер запущен на порту', PORT);
          console.log('📍 URL:', `http://localhost:${PORT}`);
          console.log('🔧 Режим:', process.env.NODE_ENV || 'development');
          console.log('📡 API доступно по адресу:', `http://localhost:${PORT}/api`);
          console.log('🔌 WebSocket доступен по адресу:', `ws://localhost:${PORT}`);
        });
      }
    } else {
      // Production режим - используем HTTP (HTTPS должен настраиваться через reverse proxy)
      httpServer.listen(PORT, () => {
        console.log('🚀 SwingFox сервер запущен на порту', PORT);
        console.log('📍 URL:', `http://localhost:${PORT}`);
        console.log('🔧 Режим:', process.env.NODE_ENV || 'development');
        console.log('📡 API доступно по адресу:', `http://localhost:${PORT}/api`);
        console.log('🔌 WebSocket доступен по адресу:', `ws://localhost:${PORT}`);
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