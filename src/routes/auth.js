const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { generateId, generateToken, generateEmailCode } = require('../utils/helpers');
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
  try {
    const { login, password } = req.body;
    
    if (!login || !password) {
      return res.status(400).json({ 
        error: 'missing_data',
        message: 'Логин и пароль обязательны' 
      });
    }

    // Поиск пользователя по логину или email
    const user = await User.findByLoginOrEmail(login);
    
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ 
        error: 'invalid_credentials',
        message: 'Неверный логин или пароль' 
      });
    }

    // Генерация нового токена
    const token = generateToken(user);
    
    // Сохранение токена в БД
    await user.update({ 
      auth_token: token,
      online: new Date()
    });

    res.json({
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
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Внутренняя ошибка сервера' 
    });
  }
});

// POST /api/auth/send-code - Отправка кода на email
router.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        error: 'missing_email',
        message: 'Email обязателен' 
      });
    }

    // Проверка существования email при регистрации
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'email_exists',
        message: 'Этот email уже используется' 
      });
    }

    // Проверка таймаута отправки (120 секунд)
    const lastSent = emailTimeouts.get(email);
    if (lastSent && Date.now() - lastSent < 120000) {
      const remainingTime = Math.ceil((120000 - (Date.now() - lastSent)) / 1000);
      return res.status(429).json({ 
        error: 'timeout',
        message: `Код уже был отправлен. Попробуйте снова через ${remainingTime} секунд`,
        remaining_time: remainingTime
      });
    }

    // Генерация кода
    const code = generateEmailCode();
    
    // Сохранение кода (срок действия 10 минут)
    emailCodes.set(email, code);
    emailTimeouts.set(email, Date.now());
    
    setTimeout(() => {
      emailCodes.delete(email);
    }, 600000); // 10 минут

    // Отправка email
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

    res.json({
      success: true,
      message: 'Код успешно отправлен на email'
    });

  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка отправки email' 
    });
  }
});

// POST /api/auth/register - Регистрация
router.post('/register', async (req, res) => {
  try {
    const { 
      email, 
      mail_code, 
      login, 
      password, 
      about,
      individual 
    } = req.body;

    // Валидация обязательных полей
    if (!email || !mail_code || !login || !password || !about || !individual) {
      return res.status(400).json({ 
        error: 'missing_data',
        message: 'Все поля обязательны для заполнения' 
      });
    }

    // Проверка email кода
    const storedCode = emailCodes.get(email);
    if (!storedCode || storedCode !== mail_code) {
      return res.status(400).json({ 
        error: 'invalid_code',
        message: 'Неверный код подтверждения' 
      });
    }

    // Проверка уникальности логина и email
    const existingUser = await User.findOne({
      where: {
        [User.sequelize.Op.or]: [
          { login },
          { email }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.login === login) {
        return res.status(400).json({ 
          error: 'login_exists',
          message: 'Этот логин уже занят' 
        });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ 
          error: 'email_exists',
          message: 'Этот email уже используется' 
        });
      }
    }

    // Создание пользователя
    const userId = generateId();
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

    // Генерация токена
    const token = generateToken(user);
    await user.update({ auth_token: token });

    // Удаление использованного кода
    emailCodes.delete(email);
    emailTimeouts.delete(email);

    res.json({
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
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при регистрации' 
    });
  }
});

// POST /api/auth/reset-password - Сброс пароля
router.post('/reset-password', async (req, res) => {
  try {
    const { email, mail_code, password } = req.body;

    if (!email || !mail_code || !password) {
      return res.status(400).json({ 
        error: 'missing_data',
        message: 'Все поля обязательны' 
      });
    }

    // Проверка кода
    const storedCode = emailCodes.get(email);
    if (!storedCode || storedCode !== mail_code) {
      return res.status(400).json({ 
        error: 'invalid_code',
        message: 'Неверный код подтверждения' 
      });
    }

    // Поиск пользователя по email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ 
        error: 'user_not_found',
        message: 'Пользователь с таким email не найден' 
      });
    }

    // Обновление пароля (хеш будет создан автоматически в хуке)
    await user.update({ 
      password,
      auth_token: null // Сброс всех токенов
    });

    // Удаление кода
    emailCodes.delete(email);
    emailTimeouts.delete(email);

    res.json({
      success: true,
      message: 'Пароль успешно изменен'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при сбросе пароля' 
    });
  }
});

// POST /api/auth/logout - Выход
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Удаление токена из БД
    await User.update(
      { auth_token: null },
      { where: { id: req.user.id } }
    );

    res.json({
      success: true,
      message: 'Успешный выход'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при выходе' 
    });
  }
});

module.exports = router;