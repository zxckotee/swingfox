const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware для проверки JWT токена
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'no_token',
        message: 'Токен доступа не предоставлен' 
      });
    }

    // Проверяем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Проверяем, что пользователь существует и токен актуален
    const user = await User.findOne({
      where: { 
        id: decoded.userId,
        auth_token: token 
      }
    });

    if (!user) {
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

    next();
  } catch (error) {
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
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      where: { 
        id: decoded.userId,
        auth_token: token 
      }
    });

    req.user = user ? {
      id: user.id,
      login: user.login,
      email: user.email,
      viptype: user.viptype
    } : null;

    next();
  } catch (error) {
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