const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { sequelize } = require('../config/database');
const { Clubs, ClubBots } = require('../models');
const { generateClubToken, authenticateClub } = require('../middleware/clubAuth');
const { generateId } = require('../utils/helpers');
const router = express.Router();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `club_avatar_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Только изображения разрешены'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Регистрация клуба
router.post('/register', async (req, res) => {
  try {
    const { name, login, email, password, description, location, contact_info, website, type } = req.body;

    // Валидация
    if (!name || !login || !email || !password) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
    }

    // Проверка уникальности логина и email
    const existingClub = await Clubs.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { login: login },
          { email: email }
        ]
      }
    });

    if (existingClub) {
      return res.status(400).json({ error: 'Клуб с таким логином или email уже существует' });
    }

    // Генерируем уникальный ID для клуба
    const clubId = Date.now() + Math.floor(Math.random() * 1000);
    
    // Создание клуба
    const club = await Clubs.create({
      id: clubId,
      name,
      login,
      email,
      password,
      description,
      location,
      contact_info,
      website,
      type: type || 'other',
      country: 'Россия', // Заглушка
      city: 'Москва', // Заглушка
      address: location || 'Не указан', // Используем location как адрес
      owner: login, // Используем login как owner (временно)
      date_created: new Date().toISOString().split('T')[0], // Текущая дата
      email_verified: true // Считаем email подтвержденным после ввода кода
    });

    // Создание дефолтных ботов для клуба
    await ClubBots.createDefaultBots(club.id);

    // Генерация токена
    const token = generateClubToken(club);

    res.status(201).json({
      message: 'Клуб успешно зарегистрирован',
      token,
      club: club.toJSON()
    });

  } catch (error) {
    console.error('Club registration error:', error);
    res.status(500).json({ error: 'Ошибка при регистрации клуба' });
  }
});

// Логин клуба
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    // Поиск клуба по логину или email
    const club = await Clubs.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { login: login },
          { email: login }
        ],
        is_active: true
      }
    });

    if (!club) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Проверка пароля
    const isValidPassword = await club.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Генерация токена
    const token = generateClubToken(club);

    res.json({
      message: 'Успешный вход',
      token,
      club: club.toJSON()
    });

  } catch (error) {
    console.error('Club login error:', error);
    res.status(500).json({ error: 'Ошибка при входе' });
  }
});

// Логаут клуба
router.post('/logout', authenticateClub, async (req, res) => {
  try {
    // В реальном приложении здесь можно добавить токен в черный список
    res.json({ message: 'Успешный выход' });
  } catch (error) {
    console.error('Club logout error:', error);
    res.status(500).json({ error: 'Ошибка при выходе' });
  }
});

// Получение профиля клуба
router.get('/profile', authenticateClub, async (req, res) => {
  try {
    const club = await Clubs.findByPk(req.club.id, {
      include: [
        {
          model: ClubBots,
          as: 'bots',
          where: { is_active: true },
          required: false
        }
      ]
    });

    if (!club) {
      return res.status(404).json({ error: 'Клуб не найден' });
    }

    res.json({ club: club.toJSON() });
  } catch (error) {
    console.error('Get club profile error:', error);
    res.status(500).json({ error: 'Ошибка при получении профиля' });
  }
});

// Обновление профиля клуба
router.put('/profile', authenticateClub, async (req, res) => {
  try {
    const { name, description, location, contact_info, website, type } = req.body;
    const club = await Clubs.findByPk(req.club.id);

    if (!club) {
      return res.status(404).json({ error: 'Клуб не найден' });
    }

    // Обновление полей
    if (name) club.name = name;
    if (description !== undefined) club.description = description;
    if (location !== undefined) club.location = location;
    if (contact_info !== undefined) club.contact_info = contact_info;
    if (website !== undefined) club.website = website;
    if (type) club.type = type;

    await club.save();

    res.json({
      message: 'Профиль обновлен',
      club: club.toJSON()
    });

  } catch (error) {
    console.error('Update club profile error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении профиля' });
  }
});

// Изменение пароля
router.put('/password', authenticateClub, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Текущий и новый пароль обязательны' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Новый пароль должен содержать минимум 6 символов' });
    }

    const club = await Clubs.findByPk(req.club.id);

    if (!club) {
      return res.status(404).json({ error: 'Клуб не найден' });
    }

    // Проверка текущего пароля
    const isValidPassword = await club.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный текущий пароль' });
    }

    // Обновление пароля
    club.password = newPassword;
    await club.save();

    res.json({ message: 'Пароль успешно изменен' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Ошибка при изменении пароля' });
  }
});

// Загрузка аватарки клуба
router.post('/profile/avatar', authenticateClub, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не был загружен' });
    }

    const { x = 0, y = 0, width, height } = req.body;
    const clubId = req.club.id;

    // Обработка изображения с помощью Sharp
    const processedFileName = `club_avatar_${generateId()}.jpg`;
    const outputPath = path.join(__dirname, '../../public/uploads', processedFileName);

    try {
      let sharpImage = sharp(req.file.path);
      
      // Автоповорот на основе EXIF данных
      sharpImage = sharpImage.rotate();

      // Если указаны параметры обрезки
      if (width && height) {
        const cropX = parseInt(x) || 0;
        const cropY = parseInt(y) || 0;
        const cropWidth = parseInt(width);
        const cropHeight = parseInt(height);

        // Проверяем, что параметры обрезки корректны
        if (cropWidth > 0 && cropHeight > 0 && cropX >= 0 && cropY >= 0) {
          sharpImage = sharpImage.extract({
            left: cropX,
            top: cropY,
            width: cropWidth,
            height: cropHeight
          });
        }
      }

      // Изменяем размер до 590x160 и сохраняем как JPEG
      await sharpImage
        .resize(590, 160, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 90 })
        .toFile(outputPath);

    } catch (sharpError) {
      console.error('Sharp processing error:', sharpError);
      // Если ошибка Sharp, пробуем просто изменить размер без обрезки
      await sharp(req.file.path)
        .rotate()
        .resize(590, 160, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 90 })
        .toFile(outputPath);
    }

    // Удаляем временный файл
    await fs.unlink(req.file.path);

    // Обновляем аватар клуба
    const club = await Clubs.findByPk(clubId);
    
    if (club) {
      // Удаляем старый аватар (если не стандартный)
      if (club.avatar && club.avatar !== 'no_photo.jpg') {
        const oldAvatarPath = path.join(__dirname, '../../public/uploads', club.avatar);
        try {
          await fs.unlink(oldAvatarPath);
        } catch (err) {
          console.warn('Не удалось удалить старый аватар:', err.message);
        }
      }

      await club.update({ avatar: processedFileName });
    }

    res.json({
      success: true,
      message: 'Аватар клуба успешно загружен',
      filename: processedFileName,
      url: `/uploads/${processedFileName}`
    });

  } catch (error) {
    console.error('Upload club avatar error:', error);
    res.status(500).json({ error: 'Ошибка при загрузке аватара' });
  }
});

module.exports = router;
