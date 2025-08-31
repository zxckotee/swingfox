const express = require('express');
const router = express.Router();
const { Clubs } = require('../models');
const { 
  generateClubToken, 
  hashClubPassword, 
  verifyClubPassword,
  authenticateClub
} = require('../middleware/clubAuth');
const { generateId } = require('../utils/helpers');
const { APILogger } = require('../utils/logger');

/**
 * Регистрация нового клуба
 * POST /api/club/auth/register
 */
router.post('/register', async (req, res) => {
  const logger = new APILogger('CLUB_AUTH');
  
  try {
    logger.logRequest(req, 'POST /club/auth/register');
    
    const {
      name,
      description,
      login,
      password,
      type = 'public',
      country,
      city,
      address,
      contact_info,
      social_links,
      rules,
      tags,
      max_members,
      membership_fee,
      age_restriction
    } = req.body;
    
    // Валидация обязательных полей
    if (!name || !description || !login || !password || !country || !city || !address) {
      return res.status(400).json({
        error: 'missing_required_fields',
        message: 'Заполните все обязательные поля: название, описание, логин, пароль, страна, город, адрес'
      });
    }
    
    // Валидация пароля
    if (password.length < 6) {
      return res.status(400).json({
        error: 'weak_password',
        message: 'Пароль должен содержать минимум 6 символов'
      });
    }
    
    // Проверяем уникальность логина
    const existingClub = await Clubs.findOne({ where: { login: login.trim() } });
    if (existingClub) {
      return res.status(400).json({
        error: 'login_exists',
        message: 'Клуб с таким логином уже существует'
      });
    }
    
    // Проверяем уникальность названия
    const existingName = await Clubs.findOne({ where: { name: name.trim() } });
    if (existingName) {
      return res.status(400).json({
        error: 'name_exists',
        message: 'Клуб с таким названием уже существует'
      });
    }
    
    logger.logBusinessLogic(1, 'Регистрация клуба', {
      name: name.trim(),
      login: login.trim(),
      type,
      city: city.trim()
    }, req);
    
    // Хешируем пароль
    const hashedPassword = await hashClubPassword(password);
    
    // Создаем клуб
    const club = await Clubs.create({
      name: name.trim(),
      description: description.trim(),
      login: login.trim(),
      password: hashedPassword,
      type: type || 'public',
      country: country.trim(),
      city: city.trim(),
      address: address.trim(),
      contact_info: contact_info?.trim(),
      social_links: social_links?.trim(),
      rules: rules?.trim(),
      tags: tags?.trim(),
      max_members: max_members ? parseInt(max_members) : null,
      membership_fee: membership_fee ? parseFloat(membership_fee) : 0,
      age_restriction: age_restriction?.trim(),
      date_created: new Date(),
      balance: 0,
      current_members: 1,
      is_active: true,
      is_verified: false
    });
    
    // Генерируем токен
    const token = generateClubToken(club.id);
    
    logger.logResult('Регистрация клуба', true, {
      club_id: club.id,
      name: club.name,
      login: club.login
    }, req);
    
    const responseData = {
      success: true,
      message: 'Клуб успешно зарегистрирован! Ожидайте верификации администратором.',
      club: {
        id: club.id,
        name: club.name,
        login: club.login,
        type: club.type,
        city: club.city,
        is_verified: club.is_verified,
        balance: club.balance
      },
      token
    };
    
    logger.logSuccess(req, 201, responseData);
    res.status(201).json(responseData);
    
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при регистрации клуба'
    });
  }
});

/**
 * Вход клуба в систему
 * POST /api/club/auth/login
 */
router.post('/login', async (req, res) => {
  const logger = new APILogger('CLUB_AUTH');
  
  try {
    logger.logRequest(req, 'POST /club/auth/login');
    
    const { login, password } = req.body;
    
    // Валидация входных данных
    if (!login || !password) {
      return res.status(400).json({
        error: 'missing_credentials',
        message: 'Укажите логин и пароль'
      });
    }
    
    logger.logBusinessLogic(1, 'Вход клуба', {
      login: login.trim()
    }, req);
    
    // Ищем клуб
    const club = await Clubs.findOne({ 
      where: { 
        login: login.trim(),
        is_active: true 
      } 
    });
    
    if (!club) {
      return res.status(401).json({
        error: 'invalid_credentials',
        message: 'Неверный логин или пароль'
      });
    }
    
    // Проверяем пароль
    const isValidPassword = await verifyClubPassword(password, club.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'invalid_credentials',
        message: 'Неверный логин или пароль'
      });
    }
    
    // Генерируем токен
    const token = generateClubToken(club.id);
    
    logger.logResult('Вход клуба', true, {
      club_id: club.id,
      name: club.name,
      login: club.login
    }, req);
    
    const responseData = {
      success: true,
      message: 'Вход выполнен успешно',
      club: {
        id: club.id,
        name: club.name,
        login: club.login,
        type: club.type,
        city: club.city,
        is_verified: club.is_verified,
        balance: club.balance,
        current_members: club.current_members,
        max_members: club.max_members
      },
      token
    };
    
    logger.logSuccess(req, 200, responseData);
    res.json(responseData);
    
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при входе'
    });
  }
});

/**
 * Проверка токена клуба
 * GET /api/club/auth/verify
 */
router.get('/verify', authenticateClub, async (req, res) => {
  try {
    // Клуб уже проверен middleware authenticateClub
    const club = req.club;
    
    res.json({
      valid: true,
      club: {
        id: club.id,
        name: club.name,
        login: club.login,
        type: club.type,
        is_verified: club.is_verified,
        balance: club.balance
      }
    });
    
  } catch (error) {
    console.error('Error in club verify endpoint:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка проверки токена'
    });
  }
});

/**
 * Выход клуба из системы
 * POST /api/club/auth/logout
 */
router.post('/logout', async (req, res) => {
  try {
    // В JWT системе выход происходит на клиенте путем удаления токена
    // Но можно добавить логику для blacklist токенов если нужно
    
    res.json({
      success: true,
      message: 'Выход выполнен успешно'
    });
  } catch (error) {
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при выходе'
    });
  }
});

module.exports = router;
