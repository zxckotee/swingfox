const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { User, Rating } = require('../models');
const { authenticateToken, requireVip } = require('../middleware/auth');
const { generateId, calculateDistance, formatAge, parseGeo, formatOnlineTime } = require('../utils/helpers');
const { APILogger } = require('../utils/logger');

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
  const logger = new APILogger('USERS');
  
  try {
    logger.logRequest(req, 'GET /profile/:login');
    
    const { login } = req.params;
    const requesterId = req.headers.authorization ?
      req.user?.login : null;

    logger.logBusinessLogic(1, 'Определение запрашивающего пользователя', {
      target_login: login,
      requester_id: requesterId,
      is_authenticated: !!requesterId
    }, req);

    logger.logProcess('Поиск целевого пользователя', { login }, req);
    logger.logDatabase('SEARCH', 'users', { condition: 'login', value: login }, req);
    
    const user = await User.findOne({ where: { login } });
    
    logger.logResult('Поиск пользователя', !!user, {
      user_found: !!user,
      user_id: user?.id,
      user_login: user?.login
    }, req);
    
    if (!user) {
      logger.logWarning('Пользователь не найден', { login }, req);
      const errorData = { error: 'user_not_found', message: 'Пользователь не найден' };
      logger.logError(req, new Error('User not found'), 404);
      return res.status(404).json(errorData);
    }

    // Регистрируем посещение (если не свой профиль)
    logger.logComparison('Проверка собственного профиля', requesterId, login, requesterId === login, req);
    if (requesterId && requesterId !== login) {
      logger.logProcess('Регистрация посещения профиля', {
        visitor: requesterId,
        visited: login
      }, req);
      // TODO: Добавить логику посещений
    }

    // Вычисляем расстояние если есть геолокация
    let distance = 0;
    let requester = null;
    
    if (requesterId) {
      logger.logProcess('Поиск данных запрашивающего для расчета расстояния', { requester_id: requesterId }, req);
      logger.logDatabase('SEARCH', 'users', { condition: 'login', value: requesterId }, req);
      
      requester = await User.findOne({ where: { login: requesterId } });
      
      if (requester) {
        logger.logProcess('Парсинг геолокации пользователей', {
          requester_geo: requester.geo,
          target_geo: user.geo
        }, req);
        
        const requesterGeo = parseGeo(requester.geo);
        const userGeo = parseGeo(user.geo);
        
        logger.logResult('Парсинг координат', !!(requesterGeo && userGeo), {
          requester_has_geo: !!requesterGeo,
          target_has_geo: !!userGeo
        }, req);
        
        if (requesterGeo && userGeo) {
          logger.logBusinessLogic(2, 'Расчет расстояния между пользователями', {
            requester_coords: requesterGeo,
            target_coords: userGeo
          }, req);
          
          distance = Math.round(calculateDistance(
            requesterGeo.lat, requesterGeo.lng,
            userGeo.lat, userGeo.lng
          ));
          
          logger.logResult('Расчет расстояния', true, { distance_km: distance }, req);
        }
      }
    }

    // Получаем рейтинг пользователя
    logger.logBusinessLogic(3, 'Получение рейтинга пользователя', {
      target_user: login
    }, req);
    
    let userRating = null;
    let currentUserRating = null;
    
    try {
      userRating = await Rating.getUserRating(login);
      
      // Если есть авторизованный пользователь, проверяем его оценку
      if (requesterId) {
        const existingRating = await Rating.findOne({
          where: {
            from_user: requesterId,
            to_user: login
          }
        });
        currentUserRating = existingRating ? existingRating.value : null;
      }
      
      logger.logResult('Получение рейтинга', true, {
        total_rating: userRating.total_rating,
        total_votes: userRating.total_votes,
        user_has_voted: !!currentUserRating
      }, req);
    } catch (ratingError) {
      logger.logWarning('Ошибка получения рейтинга', ratingError, req);
      userRating = {
        total_rating: 0,
        total_votes: 0,
        positive_votes: 0,
        negative_votes: 0,
        average_rating: 0,
        percentage_positive: 0
      };
    }

    // Форматируем данные профиля
    logger.logBusinessLogic(4, 'Форматирование данных профиля', {
      user_id: user.id,
      has_images: !!user.images,
      has_locked_images: !!user.locked_images,
      distance_calculated: distance > 0,
      rating_included: !!userRating
    }, req);
    
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
      mobile: user.mobile,
      // Интеграция рейтинговой системы
      rating: userRating,
      user_vote: currentUserRating,
      can_vote: requesterId && requesterId !== login // Можно голосовать только за других
    };

    logger.logSuccess(req, 200, profileData);
    res.json(profileData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении профиля'
    });
  }
});

// PUT /api/users/profile - Обновление профиля
router.put('/profile', authenticateToken, async (req, res) => {
  const logger = new APILogger('USERS');
  
  try {
    logger.logRequest(req, 'PUT /profile');
    
    const userId = req.user.login;
    const {
      country, city, status, search_status, search_age,
      location, mobile, info, date, height, weight,
      smoking, alko
    } = req.body;

    logger.logBusinessLogic(1, 'Валидация обновляемых данных', {
      user_id: userId,
      fields_provided: {
        country: !!country,
        city: !!city,
        status: !!status,
        search_status: !!search_status,
        search_age: !!search_age,
        location: !!location,
        mobile: !!mobile,
        info: !!info,
        date: !!date,
        height: !!height,
        weight: !!weight,
        smoking: !!smoking,
        alko: !!alko
      }
    }, req);

    // Проверка обязательных полей
    logger.logValidation('required_fields', { country, city, status },
      'country && city && status', !!(country && city && status), req);
    
    if (!country || !city || !status) {
      const errorData = {
        error: 'missing_required_fields',
        message: 'Страна, город и статус обязательны'
      };
      logger.logError(req, new Error('Missing required fields'), 400);
      return res.status(400).json(errorData);
    }

    logger.logProcess('Поиск пользователя для обновления', { user_id: userId }, req);
    logger.logDatabase('SEARCH', 'users', { condition: 'login', value: userId }, req);
    
    const user = await User.findOne({ where: { login: userId } });
    
    logger.logResult('Поиск пользователя', !!user, {
      user_found: !!user,
      user_id: user?.id
    }, req);
    
    if (!user) {
      logger.logWarning('Пользователь не найден для обновления', { user_id: userId }, req);
      const errorData = { error: 'user_not_found', message: 'Пользователь не найден' };
      logger.logError(req, new Error('User not found'), 404);
      return res.status(404).json(errorData);
    }

    // Обновляем данные
    logger.logBusinessLogic(2, 'Подготовка данных для обновления', {
      user_id: user.id,
      search_status_is_array: Array.isArray(search_status),
      location_is_array: Array.isArray(location),
      smoking_is_array: Array.isArray(smoking),
      alko_is_array: Array.isArray(alko)
    }, req);
    
    const updateData = {
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
    };
    
    logger.logDatabase('UPDATE', 'users', {
      user_id: user.id,
      update_fields: Object.keys(updateData),
      ...updateData
    }, req);
    
    await user.update(updateData);

    logger.logResult('Обновление профиля', true, { user_id: user.id }, req);

    const responseData = {
      success: true,
      message: 'Профиль успешно обновлен',
      user: user.toJSON()
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при обновлении профиля'
    });
  }
});

// POST /api/users/upload-avatar - Загрузка и обрезка аватара
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  const logger = new APILogger('USERS');
  
  try {
    logger.logRequest(req, 'POST /upload-avatar');
    
    logger.logBusinessLogic(1, 'Проверка загруженного файла', {
      file_uploaded: !!req.file,
      file_name: req.file?.filename,
      file_size: req.file?.size,
      file_mimetype: req.file?.mimetype
    }, req);
    
    if (!req.file) {
      const errorData = { error: 'no_file', message: 'Файл не был загружен' };
      logger.logError(req, new Error('No file uploaded'), 400);
      return res.status(400).json(errorData);
    }

    const { x = 0, y = 0, width = 200, height = 200 } = req.body;
    const userId = req.user.login;

    logger.logBusinessLogic(2, 'Параметры обрезки изображения', {
      user_id: userId,
      crop_params: { x: parseInt(x), y: parseInt(y), width: parseInt(width), height: parseInt(height) },
      source_file: req.file.path
    }, req);

    // Обработка изображения с помощью Sharp
    const processedFileName = `avatar_${generateId()}.png`;
    const outputPath = path.join(__dirname, '../../public/uploads', processedFileName);

    logger.logProcess('Обработка изображения с Sharp', {
      source_path: req.file.path,
      output_path: outputPath,
      operations: ['extract', 'resize', 'png']
    }, req);

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

    logger.logResult('Обработка изображения', true, {
      processed_file: processedFileName,
      output_size: '200x200'
    }, req);

    // Удаляем временный файл
    logger.logProcess('Удаление временного файла', { temp_file: req.file.path }, req);
    await fs.unlink(req.file.path);

    // Обновляем аватар пользователя
    logger.logProcess('Поиск пользователя для обновления аватара', { user_id: userId }, req);
    logger.logDatabase('SEARCH', 'users', { condition: 'login', value: userId }, req);
    
    const user = await User.findOne({ where: { login: userId } });
    
    if (user) {
      logger.logProcess('Удаление старого аватара', {
        old_avatar: user.ava,
        is_default: user.ava === 'no_photo.jpg'
      }, req);
      
      // Удаляем старый аватар (если не стандартный)
      if (user.ava !== 'no_photo.jpg') {
        const oldAvatarPath = path.join(__dirname, '../../public/uploads', user.ava);
        try {
          await fs.unlink(oldAvatarPath);
          logger.logResult('Удаление старого аватара', true, { deleted_file: user.ava }, req);
        } catch (err) {
          logger.logWarning('Не удалось удалить старый аватар', {
            error: err.message,
            file: user.ava
          }, req);
        }
      }

      logger.logDatabase('UPDATE', 'users', {
        user_id: user.id,
        new_avatar: processedFileName
      }, req);
      
      await user.update({ ava: processedFileName });
      
      logger.logResult('Обновление аватара', true, {
        user_id: user.id,
        new_avatar: processedFileName
      }, req);
    }

    const responseData = {
      success: true,
      message: 'Аватар успешно загружен',
      filename: processedFileName,
      url: `/uploads/${processedFileName}`
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    
    // Удаляем загруженный файл при ошибке
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
        logger.logProcess('Очистка временного файла после ошибки', {
          temp_file: req.file.path
        }, req);
      } catch (unlinkError) {
        logger.logWarning('Ошибка удаления временного файла', {
          error: unlinkError.message
        }, req);
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