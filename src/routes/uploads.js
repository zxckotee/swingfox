const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { User, ImageLikes } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');
const { APILogger } = require('../utils/logger');

// Настройка хранилища для загрузки файлов
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
    const uniqueId = generateId();
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueId}${extension}`);
  }
});

// Фильтр файлов - только изображения
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый тип файла. Разрешены: JPEG, PNG, WebP'), false);
  }
};

// Настройка multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Максимум 5 файлов за раз
  }
});

// POST /api/uploads/avatar - Загрузка аватарки
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  const logger = new APILogger('UPLOADS');
  
  try {
    logger.logRequest(req, 'POST /avatar');
    
    if (!req.file) {
      const errorData = { error: 'no_file', message: 'Файл не загружен' };
      logger.logError(req, new Error('No file uploaded'), 400);
      return res.status(400).json(errorData);
    }

    const userId = req.user.login;
    const { x = 0, y = 0, width, height } = req.body;

    logger.logBusinessLogic(1, 'Обработка аватарки', {
      user_id: userId,
      filename: req.file.filename,
      crop_params: { x, y, width, height }
    }, req);

    // Путь к загруженному файлу
    const inputPath = req.file.path;
    const outputFilename = `avatar_${generateId()}.png`;
    const outputPath = path.join(path.dirname(inputPath), outputFilename);

    try {
      let sharpImage = sharp(inputPath);
      
      // Автоповорот на основе EXIF данных
      sharpImage = sharpImage.rotate();

      // Если указаны параметры обрезки
      if (width && height) {
        const cropX = parseInt(x) || 0;
        const cropY = parseInt(y) || 0;
        const cropWidth = parseInt(width);
        const cropHeight = parseInt(height);

        sharpImage = sharpImage.extract({
          left: cropX,
          top: cropY,
          width: cropWidth,
          height: cropHeight
        });
      }

      // Изменяем размер до 400x400 и сохраняем как PNG
      await sharpImage
        .resize(400, 400, { fit: 'cover', position: 'center' })
        .png({ quality: 90 })
        .toFile(outputPath);

      logger.logResult('Обработка изображения', true, {
        output_filename: outputFilename,
        size: '400x400'
      }, req);

      // Удаляем исходный файл
      await fs.unlink(inputPath);

      // Удаляем старый аватар если он есть
      const user = await User.findOne({ where: { login: userId } });
      if (user.ava && user.ava !== 'no_photo.jpg') {
        const oldAvatarPath = path.join(path.dirname(inputPath), user.ava);
        try {
          await fs.unlink(oldAvatarPath);
        } catch (error) {
          // Игнорируем ошибку если старый файл не найден
        }
      }

      // Обновляем аватар в БД
      logger.logDatabase('UPDATE', 'users', {
        user_id: userId,
        ava: outputFilename
      }, req);
      
      await user.update({ ava: outputFilename });

      const responseData = {
        success: true,
        filename: outputFilename,
        url: `/uploads/${outputFilename}`,
        message: 'Аватар успешно обновлен'
      };

      logger.logSuccess(req, 200, responseData);
      res.json(responseData);

    } catch (imageError) {
      logger.logError(req, imageError, 500);
      // Удаляем файл при ошибке обработки
      try {
        await fs.unlink(inputPath);
      } catch (unlinkError) {
        // Игнорируем ошибку удаления
      }
      
      res.status(500).json({
        error: 'image_processing_error',
        message: 'Ошибка обработки изображения'
      });
    }

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// POST /api/uploads/images - Загрузка обычных изображений
router.post('/images', authenticateToken, upload.array('images', 5), async (req, res) => {
  const logger = new APILogger('UPLOADS');
  
  try {
    logger.logRequest(req, 'POST /images');
    
    if (!req.files || req.files.length === 0) {
      const errorData = { error: 'no_files', message: 'Файлы не загружены' };
      logger.logError(req, new Error('No files uploaded'), 400);
      return res.status(400).json(errorData);
    }

    const userId = req.user.login;
    const { type = 'images' } = req.body; // 'images' или 'locked_images'

    logger.logBusinessLogic(1, 'Загрузка изображений', {
      user_id: userId,
      files_count: req.files.length,
      type
    }, req);

    // Проверяем права для приватных изображений
    if (type === 'locked_images') {
      const user = await User.findOne({ where: { login: userId } });
      if (user.viptype === 'FREE') {
        return res.status(403).json({
          error: 'no_permission',
          message: 'Приватные изображения доступны только VIP и PREMIUM пользователям'
        });
      }
    }

    const processedFiles = [];
    const errors = [];

    // Обрабатываем каждый файл
    for (const file of req.files) {
      try {
        const inputPath = file.path;
        const outputFilename = `img_${generateId()}.png`;
        const outputPath = path.join(path.dirname(inputPath), outputFilename);

        // Обрабатываем изображение
        await sharp(inputPath)
          .rotate() // Автоповорот
          .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
          .png({ quality: 85 })
          .toFile(outputPath);

        // Удаляем исходный файл
        await fs.unlink(inputPath);

        processedFiles.push({
          filename: outputFilename,
          url: `/uploads/${outputFilename}`,
          original_name: file.originalname
        });

      } catch (fileError) {
        logger.logError(req, fileError);
        errors.push({
          filename: file.originalname,
          error: 'Ошибка обработки файла'
        });
        
        // Удаляем файл при ошибке
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          // Игнорируем ошибку удаления
        }
      }
    }

    // Обновляем список изображений пользователя
    if (processedFiles.length > 0) {
      const user = await User.findOne({ where: { login: userId } });
      const currentImages = user[type] ? user[type].split('&&').filter(img => img) : [];
      const newImages = processedFiles.map(file => file.filename);
      const updatedImages = [...currentImages, ...newImages];

      logger.logDatabase('UPDATE', 'users', {
        user_id: userId,
        [type]: updatedImages.join('&&')
      }, req);

      await user.update({
        [type]: updatedImages.join('&&')
      });
    }

    const responseData = {
      success: true,
      uploaded_files: processedFiles,
      errors: errors.length > 0 ? errors : undefined,
      message: `Загружено ${processedFiles.length} изображений`
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

// DELETE /api/uploads/images/:filename - Удаление изображения
router.delete('/images/:filename', authenticateToken, async (req, res) => {
  const logger = new APILogger('UPLOADS');
  
  try {
    logger.logRequest(req, 'DELETE /images/:filename');
    
    const { filename } = req.params;
    const { type = 'images' } = req.query;
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Удаление изображения', {
      user_id: userId,
      filename,
      type
    }, req);

    // Получаем пользователя
    const user = await User.findOne({ where: { login: userId } });
    const currentImages = user[type] ? user[type].split('&&').filter(img => img) : [];

    // Проверяем, принадлежит ли файл пользователю
    if (!currentImages.includes(filename)) {
      return res.status(404).json({
        error: 'file_not_found',
        message: 'Файл не найден или не принадлежит пользователю'
      });
    }

    // Удаляем файл из списка
    const updatedImages = currentImages.filter(img => img !== filename);
    
    logger.logDatabase('UPDATE', 'users', {
      user_id: userId,
      [type]: updatedImages.join('&&')
    }, req);

    await user.update({
      [type]: updatedImages.join('&&')
    });

    // Удаляем физический файл
    const filePath = path.join(__dirname, '../../public/uploads', filename);
    try {
      await fs.unlink(filePath);
      logger.logResult('Удаление файла', true, { filename }, req);
    } catch (unlinkError) {
      logger.logWarning('Файл не найден на диске', { filename }, req);
    }

    const responseData = {
      success: true,
      message: 'Изображение удалено'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при удалении изображения'
    });
  }
});

// POST /api/uploads/images/:filename/like - Лайк изображения
router.post('/images/:filename/like', authenticateToken, async (req, res) => {
  const logger = new APILogger('UPLOADS');
  
  try {
    logger.logRequest(req, 'POST /images/:filename/like');
    
    const { filename } = req.params;
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Лайк изображения', {
      user_id: userId,
      filename
    }, req);

    // Переключаем лайк
    const result = await ImageLikes.toggleLike(userId, filename);
    
    logger.logResult('Переключение лайка', true, {
      action: result.action,
      liked: result.liked
    }, req);

    // Получаем обновленную информацию о лайках
    const likesInfo = await ImageLikes.getImageLikes(filename);

    const responseData = {
      success: true,
      action: result.action,
      liked: result.liked,
      total_likes: likesInfo.total,
      message: result.liked ? 'Лайк добавлен' : 'Лайк удален'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при обработке лайка'
    });
  }
});

// GET /api/uploads/images/:filename/likes - Получение лайков изображения
router.get('/images/:filename/likes', authenticateToken, async (req, res) => {
  const logger = new APILogger('UPLOADS');
  
  try {
    logger.logRequest(req, 'GET /images/:filename/likes');
    
    const { filename } = req.params;
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Получение лайков изображения', {
      user_id: userId,
      filename
    }, req);

    // Получаем информацию о лайках
    const likesInfo = await ImageLikes.getImageLikes(filename);
    const userLike = await ImageLikes.getUserImageLike(userId, filename);

    const responseData = {
      total_likes: likesInfo.total,
      user_liked: !!userLike,
      likes: likesInfo.likes
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении лайков'
    });
  }
});

// POST /api/uploads/set-locked-password - Установка пароля для приватных изображений
router.post('/set-locked-password', authenticateToken, async (req, res) => {
  const logger = new APILogger('UPLOADS');
  
  try {
    logger.logRequest(req, 'POST /set-locked-password');
    
    const { password } = req.body;
    const userId = req.user.login;

    if (!password || password.length < 4) {
      return res.status(400).json({
        error: 'invalid_password',
        message: 'Пароль должен содержать минимум 4 символа'
      });
    }

    logger.logBusinessLogic(1, 'Установка пароля для приватных изображений', {
      user_id: userId,
      password_length: password.length
    }, req);

    // Обновляем пароль
    const user = await User.findOne({ where: { login: userId } });
    
    logger.logDatabase('UPDATE', 'users', {
      user_id: userId,
      images_password: '[HIDDEN]'
    }, req);
    
    await user.update({ images_password: password });

    const responseData = {
      success: true,
      message: 'Пароль для приватных изображений установлен'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при установке пароля'
    });
  }
});

// POST /api/uploads/unlock-images - Разблокировка приватных изображений
router.post('/unlock-images', authenticateToken, async (req, res) => {
  const logger = new APILogger('UPLOADS');
  
  try {
    logger.logRequest(req, 'POST /unlock-images');
    
    const { target_user, password } = req.body;
    const userId = req.user.login;

    if (!target_user || !password) {
      return res.status(400).json({
        error: 'missing_data',
        message: 'Укажите пользователя и пароль'
      });
    }

    logger.logBusinessLogic(1, 'Разблокировка приватных изображений', {
      user_id: userId,
      target_user
    }, req);

    // Проверяем VIP статус
    const currentUser = await User.findOne({ where: { login: userId } });
    if (currentUser.viptype === 'FREE') {
      return res.status(403).json({
        error: 'no_permission',
        message: 'Просмотр приватных изображений доступен только VIP и PREMIUM пользователям'
      });
    }

    // Проверяем пароль
    const targetUserData = await User.findOne({ where: { login: target_user } });
    if (!targetUserData || targetUserData.images_password !== password) {
      logger.logWarning('Неверный пароль для приватных изображений', {
        user_id: userId,
        target_user
      }, req);
      
      return res.status(401).json({
        error: 'invalid_password',
        message: 'Неверный пароль'
      });
    }

    logger.logResult('Разблокировка изображений', true, {
      user_id: userId,
      target_user
    }, req);

    // Возвращаем приватные изображения
    const lockedImages = targetUserData.locked_images ? 
      targetUserData.locked_images.split('&&').filter(img => img) : [];

    const responseData = {
      success: true,
      images: lockedImages.map(img => ({
        filename: img,
        url: `/uploads/${img}`
      })),
      message: 'Приватные изображения разблокированы'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при разблокировке изображений'
    });
  }
});

module.exports = router;