const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware для проверки JWT токена
const authenticateToken = async (req, res, next) => {
  try {
    console.log('authenticateToken middleware - проверяем токен');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('Auth header:', authHeader);
    console.log('Token:', token ? 'present' : 'missing');

    if (!token) {
      console.log('Ошибка: токен не предоставлен');
      return res.status(401).json({ 
        error: 'no_token',
        message: 'Токен доступа не предоставлен' 
      });
    }

    // Проверяем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', { userId: decoded.userId });
    
    // Проверяем, что пользователь существует и токен актуален
    const user = await User.findOne({
      where: { 
        id: decoded.userId,
        auth_token: token 
      }
    });

    console.log('User found:', user ? 'yes' : 'no');

    if (!user) {
      console.log('Ошибка: пользователь не найден');
      return res.status(403).json({ 
        error: 'invalid_token',
        message: 'Недействительный токен' 
      });
    }

    // Добавляем информацию о пользователе в req
    req.user = {
      id: user.id,
      login: user.login,
      email: user.email,
      viptype: user.viptype
    };

    console.log('User authenticated:', req.user.login);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        error: 'token_expired',
        message: 'Токен истек' 
      });
    }
    
    return res.status(403).json({ 
      error: 'invalid_token',
      message: 'Недействительный токен' 
    });
  }
};

// Middleware для опциональной авторизации (некоторые роуты работают и без токена)
const optionalAuth = async (req, res, next) => {
  try {
    console.log('optionalAuth middleware - проверяем токен (опционально)');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Auth header:', authHeader);
    console.log('Token:', token ? 'present' : 'missing');

    if (!token) {
      console.log('Токен не предоставлен, продолжаем без аутентификации');
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', { userId: decoded.userId });
    
    const user = await User.findOne({
      where: { 
        id: decoded.userId,
        auth_token: token 
      }
    });

    console.log('User found:', user ? 'yes' : 'no');

    req.user = user ? {
      id: user.id,
      login: user.login,
      email: user.email,
      viptype: user.viptype
    } : null;

    if (req.user) {
      console.log('User authenticated:', req.user.login);
    } else {
      console.log('Пользователь не аутентифицирован');
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

// Middleware для проверки VIP статуса
const requireVip = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'no_session',
      message: 'Требуется авторизация' 
    });
  }

  if (req.user.viptype === 'FREE') {
    return res.status(403).json({ 
      error: 'no_root',
      message: 'Требуется VIP или PREMIUM подписка' 
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireVip
};