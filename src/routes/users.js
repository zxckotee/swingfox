const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { User } = require('../models');
const { authenticateToken, requireVip } = require('../middleware/auth');
const { generateId, calculateDistance, formatAge, parseGeo, formatOnlineTime } = require('../utils/helpers');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/uploads');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${generateId()}.${file.mimetype.split('/')[1]}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Можно загружать только изображения'));
    }
  }
});

// GET /api/users/profile/:login - Получение профиля пользователя
router.get('/profile/:login', async (req, res) => {
  try {
    const { login } = req.params;
    const requesterId = req.headers.authorization ? 
      req.user?.login : null;

    const user = await User.findOne({ where: { login } });
    if (!user) {
      return res.status(404).json({ 
        error: 'user_not_found',
        message: 'Пользователь не найден' 
      });
    }

    // Регистрируем посещение (если не свой профиль)
    if (requesterId && requesterId !== login) {
      // TODO: Добавить логику посещений
    }

    // Вычисляем расстояние если есть геолокация
    let distance = 0;
    if (requesterId) {
      const requester = await User.findOne({ where: { login: requesterId } });
      if (requester) {
        const requesterGeo = parseGeo(requester.geo);
        const userGeo = parseGeo(user.geo);
        
        if (requesterGeo && userGeo) {
          distance = Math.round(calculateDistance(
            requesterGeo.lat, requesterGeo.lng,
            userGeo.lat, userGeo.lng
          ));
        }
      }
    }

    // Форматируем данные профиля
    const profileData = {
      id: user.id,
      login: user.login,
      ava: user.ava,
      status: user.status,
      country: user.country,
      city: user.city,
      info: user.info,
      age: formatAge(user.date),
      height: user.height,
      weight: user.weight,
      smoking: user.smoking,
      alko: user.alko,
      images: user.images ? user.images.split('&&').filter(Boolean) : [],
      locked_images: user.locked_images ? user.locked_images.split('&&').filter(Boolean) : [],
      registration: user.registration,
      online: formatOnlineTime(user.online),
      viptype: user.viptype,
      distance,
      mobile: user.mobile
    };

    res.json(profileData);

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении профиля' 
    });
  }
});

// PUT /api/users/profile - Обновление профиля
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.login;
    const {
      country, city, status, search_status, search_age,
      location, mobile, info, date, height, weight,
      smoking, alko
    } = req.body;

    // Проверка обязательных полей
    if (!country || !city || !status) {
      return res.status(400).json({ 
        error: 'missing_required_fields',
        message: 'Страна, город и статус обязательны' 
      });
    }

    const user = await User.findOne({ where: { login: userId } });
    if (!user) {
      return res.status(404).json({ 
        error: 'user_not_found',
        message: 'Пользователь не найден' 
      });
    }

    // Обновляем данные
    await user.update({
      country,
      city,
      status,
      search_status: Array.isArray(search_status) ? search_status.join('&&') : search_status,
      search_age,
      location: Array.isArray(location) ? location.join('&&') : location,
      mobile,
      info,
      date,
      height,
      weight,
      smoking: Array.isArray(smoking) ? smoking.join('&&') : smoking,
      alko: Array.isArray(alko) ? alko.join('&&') : alko,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Профиль успешно обновлен',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при обновлении профиля' 
    });
  }
});

// POST /api/users/upload-avatar - Загрузка и обрезка аватара
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'no_file',
        message: 'Файл не был загружен' 
      });
    }

    const { x = 0, y = 0, width = 200, height = 200 } = req.body;
    const userId = req.user.login;

    // Обработка изображения с помощью Sharp
    const processedFileName = `avatar_${generateId()}.png`;
    const outputPath = path.join(__dirname, '../../public/uploads', processedFileName);

    await sharp(req.file.path)
      .extract({ 
        left: parseInt(x), 
        top: parseInt(y), 
        width: parseInt(width), 
        height: parseInt(height) 
      })
      .resize(200, 200)
      .png()
      .toFile(outputPath);

    // Удаляем временный файл
    await fs.unlink(req.file.path);

    // Обновляем аватар пользователя
    const user = await User.findOne({ where: { login: userId } });
    if (user) {
      // Удаляем старый аватар (если не стандартный)
      if (user.ava !== 'no_photo.jpg') {
        const oldAvatarPath = path.join(__dirname, '../../public/uploads', user.ava);
        try {
          await fs.unlink(oldAvatarPath);
        } catch (err) {
          console.log('Не удалось удалить старый аватар:', err.message);
        }
      }

      await user.update({ ava: processedFileName });
    }

    res.json({
      success: true,
      message: 'Аватар успешно загружен',
      filename: processedFileName,
      url: `/uploads/${processedFileName}`
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    
    // Удаляем загруженный файл при ошибке
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }

    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при загрузке аватара' 
    });
  }
});

// POST /api/users/upload-images - Загрузка дополнительных фото
router.post('/upload-images', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: 'no_files',
        message: 'Файлы не были загружены' 
      });
    }

    const { type = 'images' } = req.body; // 'images' или 'locked_images'
    const userId = req.user.login;

    const user = await User.findOne({ where: { login: userId } });
    if (!user) {
      return res.status(404).json({ 
        error: 'user_not_found',
        message: 'Пользователь не найден' 
      });
    }

    // Проверка прав для скрытых изображений
    if (type === 'locked_images' && user.viptype === 'FREE') {
      // Удаляем загруженные файлы
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
      
      return res.status(403).json({ 
        error: 'no_permission',
        message: 'Скрытые галереи доступны только VIP пользователям' 
      });
    }

    // Обработка изображений
    const processedFiles = [];
    for (const file of req.files) {
      const processedFileName = `img_${generateId()}.jpg`;
      const outputPath = path.join(__dirname, '../../public/uploads', processedFileName);

      await sharp(file.path)
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(outputPath);

      // Удаляем временный файл
      await fs.unlink(file.path);
      
      processedFiles.push(processedFileName);
    }

    // Обновляем список изображений пользователя
    const currentImages = user[type] ? user[type].split('&&').filter(Boolean) : [];
    const updatedImages = [...currentImages, ...processedFiles];
    
    await user.update({ 
      [type]: updatedImages.join('&&'),
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Изображения успешно загружены',
      uploaded_files: processedFiles,
      urls: processedFiles.map(file => `/uploads/${file}`)
    });

  } catch (error) {
    console.error('Upload images error:', error);
    
    // Удаляем загруженные файлы при ошибке
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }
    }

    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при загрузке изображений' 
    });
  }
});

// DELETE /api/users/images/:filename - Удаление изображения
router.delete('/images/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const { type = 'images' } = req.query; // 'images' или 'locked_images'
    const userId = req.user.login;

    const user = await User.findOne({ where: { login: userId } });
    if (!user) {
      return res.status(404).json({ 
        error: 'user_not_found',
        message: 'Пользователь не найден' 
      });
    }

    const currentImages = user[type] ? user[type].split('&&').filter(Boolean) : [];
    const updatedImages = currentImages.filter(img => img !== filename);

    if (currentImages.length === updatedImages.length) {
      return res.status(404).json({ 
        error: 'image_not_found',
        message: 'Изображение не найдено' 
      });
    }

    // Удаляем файл с диска
    const filePath = path.join(__dirname, '../../public/uploads', filename);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.log('Файл уже удален или не существует:', err.message);
    }

    // Обновляем список изображений
    await user.update({ 
      [type]: updatedImages.join('&&'),
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Изображение успешно удалено'
    });

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при удалении изображения' 
    });
  }
});

// POST /api/users/set-locked-password - Установка пароля для скрытых фото
router.post('/set-locked-password', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.login;

    if (!password || password.length < 4) {
      return res.status(400).json({ 
        error: 'invalid_password',
        message: 'Пароль должен содержать минимум 4 символа' 
      });
    }

    const user = await User.findOne({ where: { login: userId } });
    if (!user) {
      return res.status(404).json({ 
        error: 'user_not_found',
        message: 'Пользователь не найден' 
      });
    }

    await user.update({ 
      images_password: password,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Пароль для скрытых фото установлен'
    });

  } catch (error) {
    console.error('Set locked password error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при установке пароля' 
    });
  }
});

// POST /api/users/unlock-images - Разблокировка скрытых фото пользователя
router.post('/unlock-images', authenticateToken, async (req, res) => {
  try {
    const { target_user, password } = req.body;

    if (!target_user || !password) {
      return res.status(400).json({ 
        error: 'missing_data',
        message: 'Укажите пользователя и пароль' 
      });
    }

    // Проверка VIP статуса
    const currentUser = await User.findOne({ where: { login: req.user.login } });
    if (currentUser.viptype === 'FREE') {
      return res.status(403).json({ 
        error: 'no_permission',
        message: 'Просмотр скрытых фото доступен только VIP пользователям' 
      });
    }

    const targetUser = await User.findOne({ where: { login: target_user } });
    if (!targetUser) {
      return res.status(404).json({ 
        error: 'user_not_found',
        message: 'Пользователь не найден' 
      });
    }

    if (targetUser.images_password !== password) {
      return res.status(401).json({ 
        error: 'wrong_password',
        message: 'Неверный пароль' 
      });
    }

    const lockedImages = targetUser.locked_images ? 
      targetUser.locked_images.split('&&').filter(Boolean) : [];

    res.json({
      success: true,
      images: lockedImages,
      urls: lockedImages.map(img => `/uploads/${img}`)
    });

  } catch (error) {
    console.error('Unlock images error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при разблокировке изображений' 
    });
  }
});

module.exports = router;