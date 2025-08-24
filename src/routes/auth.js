const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { generateId, generateToken, generateEmailCode } = require('../utils/helpers');
const { APILogger } = require('../utils/logger');
const nodemailer = require('nodemailer');

// Хранилище для email кодов (в продакшене использовать Redis)
const emailCodes = new Map();
const emailTimeouts = new Map();

// Настройка email транспорта
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'localhost',
  port: process.env.EMAIL_PORT || 1025,
  secure: false,
  ignoreTLS: true,
  auth: false
});

// POST /api/auth/login - Авторизация
router.post('/login', async (req, res) => {
  const logger = new APILogger('AUTH');
  
  try {
    logger.logRequest(req, 'POST /login');
    
    const { login, password } = req.body;
    
    logger.logBusinessLogic(1, 'Валидация входных данных', {
      login_provided: !!login,
      password_provided: !!password
    }, req);
    
    if (!login || !password) {
      const errorData = { error: 'missing_data', message: 'Логин и пароль обязательны' };
      logger.logError(req, new Error('Missing login or password'), 400);
      return res.status(400).json(errorData);
    }

    // Поиск пользователя по логину или email
    logger.logProcess('Поиск пользователя по логину или email', { search_term: login }, req);
    logger.logDatabase('SEARCH', 'users', { condition: 'login OR email', value: login }, req);
    
    const user = await User.findByLoginOrEmail(login);
    
    logger.logResult('Поиск пользователя', !!user, {
      user_found: !!user,
      user_id: user?.id,
      user_login: user?.login
    }, req);
    
    if (!user) {
      logger.logWarning('Пользователь не найден', { search_term: login }, req);
      const errorData = { error: 'invalid_credentials', message: 'Неверный логин или пароль' };
      logger.logError(req, new Error('User not found'), 401);
      return res.status(401).json(errorData);
    }

    // Проверка пароля
    logger.logProcess('Валидация пароля', { user_id: user.id }, req);
    const passwordValid = await user.validatePassword(password);
    logger.logComparison('Проверка пароля', '[HIDDEN]', '[HIDDEN]', passwordValid, req);
    
    if (!passwordValid) {
      logger.logWarning('Неверный пароль', { user_id: user.id, login: user.login }, req);
      const errorData = { error: 'invalid_credentials', message: 'Неверный логин или пароль' };
      logger.logError(req, new Error('Invalid password'), 401);
      return res.status(401).json(errorData);
    }

    // Генерация нового токена
    logger.logBusinessLogic(2, 'Генерация JWT токена', { user_id: user.id }, req);
    const token = generateToken(user);
    logger.logResult('Генерация токена', true, { token_generated: !!token }, req);
    
    // Сохранение токена в БД
    logger.logBusinessLogic(3, 'Обновление токена и времени онлайн в БД', { user_id: user.id }, req);
    logger.logDatabase('UPDATE', 'users', {
      user_id: user.id,
      auth_token: '[HIDDEN]',
      online: new Date()
    }, req);
    
    await user.update({
      auth_token: token,
      online: new Date()
    });

    const responseData = {
      success: true,
      token,
      user: {
        id: user.id,
        login: user.login,
        email: user.email,
        ava: user.ava,
        viptype: user.viptype,
        status: user.status,
        city: user.city,
        country: user.country
      }
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// POST /api/auth/send-code - Отправка кода на email
router.post('/send-code', async (req, res) => {
  const logger = new APILogger('AUTH');
  
  try {
    logger.logRequest(req, 'POST /send-code');
    
    const { email } = req.body;
    
    logger.logBusinessLogic(1, 'Валидация email', { email_provided: !!email }, req);
    
    if (!email) {
      const errorData = { error: 'missing_email', message: 'Email обязателен' };
      logger.logError(req, new Error('Missing email'), 400);
      return res.status(400).json(errorData);
    }

    // Проверка существования email при регистрации
    logger.logProcess('Проверка существования email в БД', { email }, req);
    logger.logDatabase('SEARCH', 'users', { condition: 'email', value: email }, req);
    
    const existingUser = await User.findOne({ where: { email } });
    
    logger.logResult('Проверка существования email', !!existingUser, {
      email_exists: !!existingUser,
      user_id: existingUser?.id
    }, req);
    
    if (existingUser) {
      logger.logWarning('Email уже используется', { email, user_id: existingUser.id }, req);
      const errorData = { error: 'email_exists', message: 'Этот email уже используется' };
      logger.logError(req, new Error('Email already exists'), 400);
      return res.status(400).json(errorData);
    }

    // Проверка таймаута отправки (120 секунд)
    logger.logProcess('Проверка таймаута отправки кода', { email }, req);
    const lastSent = emailTimeouts.get(email);
    const now = Date.now();
    const timeDiff = lastSent ? now - lastSent : null;
    
    logger.logComparison('Проверка таймаута', '120000ms', timeDiff, timeDiff < 120000, req);
    
    if (lastSent && timeDiff < 120000) {
      const remainingTime = Math.ceil((120000 - timeDiff) / 1000);
      logger.logWarning('Таймаут отправки не истек', {
        email,
        remaining_seconds: remainingTime,
        last_sent: new Date(lastSent)
      }, req);
      const errorData = {
        error: 'timeout',
        message: `Код уже был отправлен. Попробуйте снова через ${remainingTime} секунд`,
        remaining_time: remainingTime
      };
      return res.status(429).json(errorData);
    }

    // Генерация кода
    logger.logBusinessLogic(2, 'Генерация email кода', { email }, req);
    const code = generateEmailCode();
    logger.logResult('Генерация кода', true, { code_generated: !!code, code_length: code.length }, req);
    
    // Сохранение кода (срок действия 10 минут)
    logger.logProcess('Сохранение кода в памяти', {
      email,
      code: '[HIDDEN]',
      expires_in: '10 minutes'
    }, req);
    
    emailCodes.set(email, code);
    emailTimeouts.set(email, now);
    
    setTimeout(() => {
      emailCodes.delete(email);
      logger.logProcess('Код удален по истечении времени', { email }, req);
    }, 600000); // 10 минут

    // Отправка email
    logger.logBusinessLogic(3, 'Подготовка и отправка email', {
      email,
      smtp_host: process.env.EMAIL_HOST || 'localhost',
      smtp_port: process.env.EMAIL_PORT || 1025
    }, req);
    
    const mailOptions = {
      from: `SwingFox <${process.env.EMAIL_FROM || 'info@swingfox.ru'}>`,
      to: email,
      subject: 'Подтверждение кода из письма - SwingFox',
      html: `
        <h2>Команда swingfox.ru</h2>
        <p>Кто-то пытается использовать вашу почту на сайте swingfox.ru.</p>
        <p>Код необходим для подтверждения почты на сайте.</p>
        <p>Никому не сообщайте код из письма!</p>
        <p><strong>Ваш код: ${code}</strong></p>
        <br>
        <p>С наилучшими пожеланиями,<br><strong>Команда сайта swingfox.ru</strong></p>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    
    logger.logResult('Отправка email', true, {
      email_sent: true,
      recipient: email,
      subject: mailOptions.subject
    }, req);

    const responseData = {
      success: true,
      message: 'Код успешно отправлен на email'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка отправки email'
    });
  }
});

// POST /api/auth/register - Регистрация
router.post('/register', async (req, res) => {
  const logger = new APILogger('AUTH');
  
  try {
    logger.logRequest(req, 'POST /register');
    
    const {
      email,
      mail_code,
      login,
      password,
      about,
      individual
    } = req.body;

    // Валидация обязательных полей
    logger.logBusinessLogic(1, 'Валидация обязательных полей', {
      email_provided: !!email,
      mail_code_provided: !!mail_code,
      login_provided: !!login,
      password_provided: !!password,
      about_provided: !!about,
      individual_provided: !!individual
    }, req);
    
    if (!email || !mail_code || !login || !password || !about || !individual) {
      const errorData = { error: 'missing_data', message: 'Все поля обязательны для заполнения' };
      logger.logError(req, new Error('Missing required fields'), 400);
      return res.status(400).json(errorData);
    }

    // Проверка email кода
    logger.logProcess('Проверка email кода', { email }, req);
    const storedCode = emailCodes.get(email);
    logger.logComparison('Проверка email кода', '[HIDDEN]', '[HIDDEN]', storedCode === mail_code, req);
    
    if (!storedCode || storedCode !== mail_code) {
      logger.logWarning('Неверный код подтверждения', {
        email,
        code_exists: !!storedCode,
        codes_match: storedCode === mail_code
      }, req);
      const errorData = { error: 'invalid_code', message: 'Неверный код подтверждения' };
      logger.logError(req, new Error('Invalid email code'), 400);
      return res.status(400).json(errorData);
    }

    // Проверка уникальности логина и email
    logger.logProcess('Проверка уникальности логина и email', { login, email }, req);
    logger.logDatabase('SEARCH', 'users', {
      condition: 'login OR email',
      login_value: login,
      email_value: email
    }, req);
    
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { login },
          { email }
        ]
      }
    });

    logger.logResult('Проверка уникальности', !existingUser, {
      user_exists: !!existingUser,
      existing_login: existingUser?.login,
      existing_email: existingUser?.email
    }, req);

    if (existingUser) {
      if (existingUser.login === login) {
        logger.logWarning('Логин уже занят', { login, existing_user_id: existingUser.id }, req);
        const errorData = { error: 'login_exists', message: 'Этот логин уже занят' };
        logger.logError(req, new Error('Login already exists'), 400);
        return res.status(400).json(errorData);
      }
      if (existingUser.email === email) {
        logger.logWarning('Email уже используется', { email, existing_user_id: existingUser.id }, req);
        const errorData = { error: 'email_exists', message: 'Этот email уже используется' };
        logger.logError(req, new Error('Email already exists'), 400);
        return res.status(400).json(errorData);
      }
    }

    // Создание пользователя
    logger.logBusinessLogic(2, 'Создание нового пользователя', { login, email, status: about.status }, req);
    const userId = generateId();
    logger.logResult('Генерация ID пользователя', true, { user_id: userId }, req);
    
    // Валидация статуса
    const validStatuses = ['Семейная пара(М+Ж)', 'Несемейная пара(М+Ж)', 'Мужчина', 'Женщина'];
    if (!validStatuses.includes(about.status)) {
      logger.logWarning('Неверный статус', { status: about.status }, req);
      const errorData = { error: 'invalid_status', message: 'Неверный статус пользователя' };
      logger.logError(req, new Error('Invalid status'), 400);
      return res.status(400).json(errorData);
    }
    
    logger.logDatabase('CREATE', 'users', {
      id: userId,
      login,
      email,
      status: about.status,
      country: about.country,
      city: about.city,
      viptype: 'FREE'
    }, req);
    
    const user = await User.create({
      id: userId,
      login,
      email,
      password,
      status: about.status,
      country: about.country,
      city: about.city,
      search_status: about.search_status,
      search_age: about.search_age,
      location: about.location,
      mobile: about.mobile,
      info: about.info,
      date: individual.date,
      height: individual.height,
      weight: individual.weight,
      smoking: individual.smoking,
      alko: individual.alko,
      registration: new Date().toISOString().split('T')[0],
      online: new Date(),
      viptype: 'FREE'
    });

    logger.logResult('Создание пользователя', true, {
      user_id: user.id,
      login: user.login,
      email: user.email
    }, req);

    // Генерация токена
    logger.logBusinessLogic(3, 'Генерация JWT токена', { user_id: user.id }, req);
    const token = generateToken(user);
    logger.logResult('Генерация токена', true, { token_generated: !!token }, req);
    
    logger.logDatabase('UPDATE', 'users', { user_id: user.id, auth_token: '[HIDDEN]' }, req);
    await user.update({ auth_token: token });

    // Удаление использованного кода
    logger.logProcess('Очистка использованного кода', { email }, req);
    emailCodes.delete(email);
    emailTimeouts.delete(email);

    const responseData = {
      success: true,
      token,
      user: {
        id: user.id,
        login: user.login,
        email: user.email,
        ava: user.ava,
        viptype: user.viptype,
        status: user.status,
        city: user.city,
        country: user.country
      }
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при регистрации'
    });
  }
});

// POST /api/auth/reset-password - Сброс пароля
router.post('/reset-password', async (req, res) => {
  const logger = new APILogger('AUTH');
  
  try {
    logger.logRequest(req, 'POST /reset-password');
    
    const { email, mail_code, password } = req.body;

    logger.logBusinessLogic(1, 'Валидация входных данных', {
      email_provided: !!email,
      mail_code_provided: !!mail_code,
      password_provided: !!password
    }, req);

    if (!email || !mail_code || !password) {
      const errorData = { error: 'missing_data', message: 'Все поля обязательны' };
      logger.logError(req, new Error('Missing required fields'), 400);
      return res.status(400).json(errorData);
    }

    // Проверка кода
    logger.logProcess('Проверка email кода для сброса пароля', { email }, req);
    const storedCode = emailCodes.get(email);
    logger.logComparison('Проверка кода сброса', '[HIDDEN]', '[HIDDEN]', storedCode === mail_code, req);
    
    if (!storedCode || storedCode !== mail_code) {
      logger.logWarning('Неверный код для сброса пароля', {
        email,
        code_exists: !!storedCode,
        codes_match: storedCode === mail_code
      }, req);
      const errorData = { error: 'invalid_code', message: 'Неверный код подтверждения' };
      logger.logError(req, new Error('Invalid reset code'), 400);
      return res.status(400).json(errorData);
    }

    // Поиск пользователя по email
    logger.logProcess('Поиск пользователя по email', { email }, req);
    logger.logDatabase('SEARCH', 'users', { condition: 'email', value: email }, req);
    
    const user = await User.findOne({ where: { email } });
    
    logger.logResult('Поиск пользователя', !!user, {
      user_found: !!user,
      user_id: user?.id,
      user_login: user?.login
    }, req);
    
    if (!user) {
      logger.logWarning('Пользователь не найден для сброса пароля', { email }, req);
      const errorData = { error: 'user_not_found', message: 'Пользователь с таким email не найден' };
      logger.logError(req, new Error('User not found for password reset'), 404);
      return res.status(404).json(errorData);
    }

    // Обновление пароля (хеш будет создан автоматически в хуке)
    logger.logBusinessLogic(2, 'Обновление пароля и сброс токенов', { user_id: user.id }, req);
    logger.logDatabase('UPDATE', 'users', {
      user_id: user.id,
      password: '[HIDDEN]',
      auth_token: null
    }, req);
    
    await user.update({
      password,
      auth_token: null // Сброс всех токенов
    });

    logger.logResult('Обновление пароля', true, { user_id: user.id, tokens_reset: true }, req);

    // Удаление кода
    logger.logProcess('Очистка использованного кода сброса', { email }, req);
    emailCodes.delete(email);
    emailTimeouts.delete(email);

    const responseData = {
      success: true,
      message: 'Пароль успешно изменен'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при сбросе пароля'
    });
  }
});

// POST /api/auth/logout - Выход
router.post('/logout', authenticateToken, async (req, res) => {
  const logger = new APILogger('AUTH');
  
  try {
    logger.logRequest(req, 'POST /logout');
    
    logger.logBusinessLogic(1, 'Выход пользователя из системы', {
      user_id: req.user.id,
      user_login: req.user.login
    }, req);

    // Удаление токена из БД
    logger.logProcess('Удаление токена авторизации', { user_id: req.user.id }, req);
    logger.logDatabase('UPDATE', 'users', {
      user_id: req.user.id,
      auth_token: null
    }, req);
    
    await User.update(
      { auth_token: null },
      { where: { id: req.user.id } }
    );

    logger.logResult('Удаление токена', true, { user_id: req.user.id }, req);

    const responseData = {
      success: true,
      message: 'Успешный выход'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при выходе'
    });
  }
});

module.exports = router;