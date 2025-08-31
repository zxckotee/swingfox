const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware для проверки JWT токена
const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔍 authenticateToken middleware - проверяем токен');
    console.log('🔍 URL:', req.url);
    console.log('🔍 Method:', req.method);
    console.log('🔍 Headers:', Object.keys(req.headers));
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('🔍 Auth header:', authHeader);
    console.log('🔍 Token:', token ? 'present' : 'missing');

    if (!token) {
      console.log('Ошибка: токен не предоставлен');
      return res.status(401).json({ 
        error: 'no_token',
        message: 'Токен доступа не предоставлен' 
      });
    }

    // Сначала пытаемся проверить как токен пользователя
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('🔍 Token decoded as user:', { userId: decoded.userId });
      
      // Проверяем, что пользователь существует и токен актуален
      const user = await User.findOne({
        where: { 
          id: decoded.userId,
          auth_token: token 
        }
      });

      console.log('🔍 User found:', user ? 'yes' : 'no');

      if (user) {
        // Добавляем информацию о пользователе в req
        req.user = {
          id: user.id,
          login: user.login,
          email: user.email,
          viptype: user.viptype
        };

        console.log('🔍 User authenticated:', req.user.login);
        return next();
      }
    } catch (userTokenError) {
      console.log('🔍 Token is not a valid user token, trying club token...');
    }

    // Если токен не пользовательский, пытаемся проверить как токен клуба
    try {
      const decoded = jwt.verify(token, process.env.CLUB_JWT_SECRET || 'club_secret_key');
      console.log('🔍 Token decoded as club:', { clubId: decoded.clubId });
      
      // Проверяем, что клуб существует и активен
      const { Clubs } = require('../models');
      const club = await Clubs.findOne({
        where: { 
          id: decoded.clubId,
          is_active: true 
        }
      });

      console.log('🔍 Club found:', club ? 'yes' : 'no');

      if (club) {
        // Добавляем информацию о клубе в req
        req.club = {
          id: club.id,
          name: club.name,
          login: club.login,
          type: club.type
        };

        console.log('🔍 Club authenticated:', req.club.name);
        return next();
      }
    } catch (clubTokenError) {
      console.log('🔍 Token is not a valid club token either');
    }

    // Если токен не подходит ни для пользователя, ни для клуба
    console.log('🔍 Ошибка: токен недействителен ни для пользователя, ни для клуба');
    return res.status(403).json({ 
      error: 'invalid_token',
      message: 'Недействительный токен' 
    });
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

    // Сначала пытаемся проверить как токен пользователя
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('🔍 Token decoded as user:', { userId: decoded.userId });
      
      const user = await User.findOne({
        where: { 
          id: decoded.userId,
          auth_token: token 
        }
      });

      console.log('🔍 User found:', user ? 'yes' : 'no');

      if (user) {
        req.user = {
          id: user.id,
          login: user.login,
          email: user.email,
          viptype: user.viptype
        };
        console.log('🔍 User authenticated:', req.user.login);
        return next();
      }
    } catch (userTokenError) {
      console.log('🔍 Token is not a valid user token, trying club token...');
    }

    // Если токен не пользовательский, пытаемся проверить как токен клуба
    try {
      const decoded = jwt.verify(token, process.env.CLUB_JWT_SECRET || 'club_secret_key');
      console.log('🔍 Token decoded as club:', { clubId: decoded.clubId });
      
      const { Clubs } = require('../models');
      const club = await Clubs.findOne({
        where: { 
          id: decoded.clubId,
          is_active: true 
        }
      });

      console.log('🔍 Club found:', club ? 'yes' : 'no');

      if (club) {
        req.club = {
          id: club.id,
          name: club.name,
          login: club.login,
          type: club.type
        };
        console.log('🔍 Club authenticated:', req.club.name);
        return next();
      }
    } catch (clubTokenError) {
      console.log('🔍 Token is not a valid club token either');
    }

    // Если токен не подходит ни для пользователя, ни для клуба
    req.user = null;
    req.club = null;
    console.log('🔍 Ни пользователь, ни клуб не аутентифицированы');

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