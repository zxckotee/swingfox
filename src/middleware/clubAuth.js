const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Clubs } = require('../models');

/**
 * Middleware для аутентификации клубов
 * Проверяет JWT токен клуба и добавляет club в req
 */
const authenticateClub = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        error: 'club_token_required',
        message: 'Требуется токен клуба' 
      });
    }
    
    // Проверяем JWT токен клуба
    const decoded = jwt.verify(token, process.env.CLUB_JWT_SECRET || 'club_secret_key');
    const club = await Clubs.findOne({
      where: { 
        id: decoded.clubId,
        is_active: true 
      }
    });
    
    if (!club) {
      return res.status(401).json({ 
        error: 'invalid_club_token',
        message: 'Недействительный токен клуба' 
      });
    }
    
    // Добавляем клуб в request
    req.club = club;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'invalid_token',
        message: 'Недействительный токен' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'token_expired',
        message: 'Токен истек' 
      });
    }
    
    console.error('Club authentication error:', error);
    res.status(500).json({ 
      error: 'auth_error',
      message: 'Ошибка аутентификации' 
    });
  }
};

/**
 * Middleware для проверки верификации клуба
 * Требует аутентификации клуба
 */
const requireVerifiedClub = async (req, res, next) => {
  try {
    if (!req.club) {
      return res.status(401).json({ 
        error: 'club_auth_required',
        message: 'Требуется аутентификация клуба' 
      });
    }
    
    if (!req.club.is_verified) {
      return res.status(403).json({ 
        error: 'club_not_verified',
        message: 'Клуб не верифицирован' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Club verification check error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка проверки верификации' 
    });
  }
};

/**
 * Middleware для проверки баланса клуба
 * Требует аутентификации клуба
 */
const requireClubBalance = (minAmount = 100) => {
  return async (req, res, next) => {
    try {
      if (!req.club) {
        return res.status(401).json({ 
          error: 'club_auth_required',
          message: 'Требуется аутентификация клуба' 
        });
      }
      
      if (parseFloat(req.club.balance) < minAmount) {
        return res.status(403).json({ 
          error: 'insufficient_balance',
          message: `Недостаточно средств на балансе. Требуется минимум ${minAmount} 🦊` 
        });
      }
      
      next();
    } catch (error) {
      console.error('Club balance check error:', error);
      res.status(500).json({ 
        error: 'server_error',
        message: 'Ошибка проверки баланса' 
      });
    }
  };
};

/**
 * Генерация JWT токена для клуба
 */
const generateClubToken = (clubId) => {
  return jwt.sign(
    { 
      clubId, 
      type: 'club',
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.CLUB_JWT_SECRET || 'club_secret_key',
    { expiresIn: '7d' }
  );
};

/**
 * Хеширование пароля клуба
 */
const hashClubPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Проверка пароля клуба
 */
const verifyClubPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Middleware для логирования действий клубов
 */
const logClubAction = (action) => {
  return (req, res, next) => {
    if (req.club) {
      console.log(`[CLUB_ACTION] ${action} - Club: ${req.club.name} (ID: ${req.club.id})`);
    }
    next();
  };
};

module.exports = {
  authenticateClub,
  requireVerifiedClub,
  requireClubBalance,
  generateClubToken,
  hashClubPassword,
  verifyClubPassword,
  logClubAction
};
