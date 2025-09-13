const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { User, Ads, Clubs } = require('../models');
const { authenticateToken, requireVip } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');
const { sequelize } = require('../config/database');

// Настройка multer для загрузки изображений объявлений
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
    cb(null, `ad_${uniqueId}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый тип файла. Разрешены: JPEG, PNG, WebP'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 // Одно изображение для объявления
  }
});

// Функция проверки прав на создание мероприятий
const validateEventCreationRights = async (userLogin, adType) => {
  if (adType === 'Мероприятия') {
    const userClub = await Clubs.findOne({
      where: {
        owner: userLogin,
        is_active: true
      }
    });
    
    if (!userClub) {
      throw new Error('Только владельцы активных клубов могут создавать мероприятия');
    }
    
    return userClub;
  }
  return null;
};

// GET /api/ads - Получение объявлений с фильтрацией
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/ads - Запрос получен');
    console.log('Headers:', req.headers);
    console.log('User:', req.user);
    console.log('Query params:', req.query);
    
    const { 
      type, 
      country, 
      city, 
      limit = 20, 
      offset = 0,
      author 
    } = req.query;

    let whereClause = {};

    // Фильтры
    if (type && type !== 'Все') {
      whereClause.type = type;
    }
    if (country) {
      whereClause.country = country;
    }
    if (city) {
      whereClause.city = city;
    }
    if (author) {
      whereClause.author = author;
    }

    // Показываем все объявления (убираем фильтр по статусу)
    // whereClause.status = 'approved';

    console.log('Where clause:', whereClause);

    const ads = await Ads.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('Найдено объявлений:', ads.length);

    // Получаем информацию об авторах объявлений
    const authorLogins = [...new Set(ads.map(ad => ad.author))];
    const authors = await User.findAll({
      where: { login: authorLogins },
      attributes: ['login', 'ava', 'status', 'city', 'viptype', 'online']
    });

    console.log('Найдено авторов:', authors.length);

    // Формируем ответ с дополнительной информацией
    const adsWithAuthors = ads.map(ad => {
      const author = authors.find(u => u.login === ad.author);
      return {
        id: ad.id,
        title: ad.title || ad.description, // Используем title если есть, иначе description
        type: ad.type,
        description: ad.description,
        country: ad.country,
        city: ad.city,
        contact_info: ad.contact_info,
        image: ad.image,
        status: ad.status,
        created_at: ad.created_at,
        expires_at: ad.expires_at,
        views_count: ad.views_count,
        is_featured: ad.is_featured,
        author: {
          login: ad.author,
          ava: author?.ava || 'no_photo.jpg',
          status: author?.status || 'Пользователь',
          city: author?.city || ad.city,
          viptype: author?.viptype || 'FREE',
          online: author?.online
        }
      };
    });

    // Получаем общее количество
    const totalCount = await Ads.count({ where: whereClause });

    console.log('Отправляем ответ:', { total: totalCount, ads_count: adsWithAuthors.length });

    res.json({
      success: true,
      ads: adsWithAuthors,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: totalCount > parseInt(offset) + parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении объявлений' 
    });
  }
});

// GET /api/ads/types - Получение доступных типов объявлений
router.get('/types', (req, res) => {
  console.log('GET /api/ads/types - Запрос получен');
  console.log('Headers:', req.headers);
  console.log('User:', req.user);
  
  const adTypes = [
    'Все',
    'Встречи',
    'Знакомства',
    'Вечеринки',
    'Мероприятия',
    'Общение'
  ];

  console.log('Отправляем типы объявлений:', adTypes);

  res.json({
    success: true,
    types: adTypes
  });
});

// POST /api/ads/create - Создание объявления с изображением
router.post('/create', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    console.log('POST /api/ads/create - Запрос получен');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    const { title, type, description, country, city, contact_info } = req.body;
    const userLogin = req.user.login;
    const imageFile = req.file;

    console.log('User login:', userLogin);
    console.log('Data:', { title, type, description, country, city, price, contact_info });

    if (!title || !type || !description || !country || !city) {
      console.log('Ошибка валидации: недостающие поля');
      return res.status(400).json({ 
        error: 'missing_data',
        message: 'Заголовок, тип, описание, страна и город обязательны' 
      });
    }

    if (title.length < 5) {
      return res.status(400).json({ 
        error: 'title_too_short',
        message: 'Заголовок должен содержать минимум 5 символов' 
      });
    }

    if (title.length > 200) {
      return res.status(400).json({ 
        error: 'title_too_long',
        message: 'Заголовок не должен превышать 200 символов' 
      });
    }

    if (description.length < 20) {
      return res.status(400).json({ 
        error: 'description_too_short',
        message: 'Описание должно содержать минимум 20 символов' 
      });
    }

    if (description.length > 5000) {
      return res.status(400).json({ 
        error: 'description_too_long',
        message: 'Описание не должно превышать 5000 символов' 
      });
    }

    // Получаем данные пользователя
    const user = await User.findOne({ where: { login: userLogin } });
    if (!user) {
      return res.status(404).json({ 
        error: 'user_not_found',
        message: 'Пользователь не найден' 
      });
    }

    // Проверяем лимиты объявлений в зависимости от VIP статуса
    const existingAds = await Ads.findAll({ 
      where: { 
        author: userLogin,
        status: ['pending', 'approved']
      } 
    });

    let adLimit = 0;
    let limitMessage = '';

    switch (user.viptype) {
      case 'FREE':
        adLimit = 1;
        limitMessage = 'Бесплатные пользователи могут создать только одно объявление. Для снятия ограничений нужен VIP или PREMIUM статус';
        break;
      case 'VIP':
        adLimit = 3;
        limitMessage = 'VIP пользователи могут создать до 3 объявлений';
        break;
      case 'PREMIUM':
        adLimit = 7;
        limitMessage = 'PREMIUM пользователи могут создать до 7 объявлений';
        break;
      default:
        adLimit = 1;
        limitMessage = 'Неизвестный статус пользователя';
    }

    if (existingAds.length >= adLimit) {
      return res.status(403).json({ 
        error: 'ad_limit_reached',
        message: limitMessage,
        current_count: existingAds.length,
        limit: adLimit
      });
    }

    // Проверка прав на создание мероприятий
    try {
      const club = await validateEventCreationRights(userLogin, type);
      console.log('Club validation passed:', club?.name || 'not a club');
    } catch (error) {
      return res.status(403).json({
        error: 'club_required',
        message: error.message
      });
    }

    // Создаем объявление
    const adId = generateId();
    console.log('Создаем объявление с ID:', adId);
    
    const newAd = await Ads.create({
      id: adId,
      title,
      description,
      author: userLogin,
      type,
      country,
      city,
      contact_info: contact_info || null,
      image: imageFile ? imageFile.filename : null,
      status: 'pending'
    });

    console.log('Объявление создано:', newAd.id);

    res.json({
      success: true,
      message: 'Объявление успешно создано',
      ad: {
        id: newAd.id,
        title: newAd.title,
        type: newAd.type,
        description: newAd.description,
        country: newAd.country,
        city: newAd.city,
        price: newAd.price,
        contact_info: newAd.contact_info,
        image: newAd.image,
        status: newAd.status,
        created_at: newAd.created_at,
        author: {
          login: user.login,
          ava: user.ava,
          status: user.status,
          city: user.city,
          viptype: user.viptype
        }
      }
    });

  } catch (error) {
    console.error('Create ad error:', error);
    
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
      message: 'Ошибка при создании объявления' 
    });
  }
});

// PUT /api/ads/:id - Редактирование объявления с возможностью обновления изображения
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, description, country, city, contact_info } = req.body;
    const userLogin = req.user.login;
    const imageFile = req.file;

    if (!title || !type || !description || !country || !city) {
      return res.status(400).json({ 
        error: 'missing_data',
        message: 'Заголовок, тип, описание, страна и город обязательны' 
      });
    }

    const ad = await Ads.findOne({ where: { id } });
    if (!ad) {
      return res.status(404).json({ 
        error: 'ad_not_found',
        message: 'Объявление не найдено' 
      });
    }

    // Проверяем права на редактирование
    if (ad.author !== userLogin) {
      return res.status(403).json({ 
        error: 'no_permission',
        message: 'Вы можете редактировать только свои объявления' 
      });
    }

    // Разрешаем редактировать объявления в любом статусе
    // Пользователь может редактировать свои объявления всегда

    // Проверка при смене типа на "Мероприятия"
    if (type === 'Мероприятия' && ad.type !== 'Мероприятия') {
      try {
        await validateEventCreationRights(userLogin, type);
      } catch (error) {
        return res.status(403).json({
          error: 'club_required',
          message: error.message
        });
      }
    }

    // Удаляем старое изображение если загружается новое
    let oldImagePath = null;
    if (imageFile && ad.image) {
      oldImagePath = path.join(__dirname, '../../public/uploads', ad.image);
    }

    // Обновляем объявление
    const updateData = {
      title,
      type,
      description,
      country,
      city,
      contact_info: contact_info || null,
      updated_at: new Date()
    };

    // Добавляем новое изображение если оно загружено
    if (imageFile) {
      updateData.image = imageFile.filename;
    }

    await ad.update(updateData);

    // Удаляем старое изображение
    if (oldImagePath) {
      try {
        await fs.unlink(oldImagePath);
      } catch (unlinkError) {
        console.error('Error deleting old image:', unlinkError);
      }
    }

    res.json({
      success: true,
      message: 'Объявление успешно обновлено',
      ad: {
        id: ad.id,
        title: ad.title,
        type: ad.type,
        description: ad.description,
        country: ad.country,
        city: ad.city,
        contact_info: ad.contact_info,
        image: ad.image,
        status: ad.status,
        created_at: ad.created_at,
        updated_at: ad.updated_at
      }
    });

  } catch (error) {
    console.error('Update ad error:', error);
    
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
      message: 'Ошибка при обновлении объявления' 
    });
  }
});

// DELETE /api/ads/:id - Удаление объявления
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userLogin = req.user.login;

    const ad = await Ads.findOne({ where: { id } });
    if (!ad) {
      return res.status(404).json({ 
        error: 'ad_not_found',
        message: 'Объявление не найдено' 
      });
    }

    // Проверяем права на удаление
    if (ad.author !== userLogin) {
      return res.status(403).json({ 
        error: 'no_permission',
        message: 'Вы можете удалять только свои объявления' 
      });
    }

    // Разрешаем удалять объявления в любом статусе
    // Пользователь может удалять свои объявления всегда

    await ad.destroy();

    res.json({
      success: true,
      message: 'Объявление успешно удалено'
    });

  } catch (error) {
    console.error('Delete ad error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при удалении объявления' 
    });
  }
});

// GET /api/ads/my - Получение объявлений текущего пользователя
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userLogin = req.user.login;
    const { limit = 10, offset = 0 } = req.query;

    const myAds = await Ads.findAll({
      where: { 
        author: userLogin,
        status: ['pending', 'approved', 'rejected']
      },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalCount = await Ads.count({ 
      where: { 
        author: userLogin,
        status: ['pending', 'approved', 'rejected']
      } 
    });

    res.json({
      success: true,
      ads: myAds,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: totalCount > parseInt(offset) + parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get my ads error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении ваших объявлений' 
    });
  }
});

// POST /api/ads/:id/respond - Ответ на объявление (отправка сообщения автору)
router.post('/:id/respond', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userLogin = req.user.login;

    if (!message) {
      return res.status(400).json({ 
        error: 'missing_message',
        message: 'Сообщение не может быть пустым' 
      });
    }

    const ad = await Ads.findOne({ where: { id } });
    if (!ad) {
      return res.status(404).json({ 
        error: 'ad_not_found',
        message: 'Объявление не найдено' 
      });
    }

    // Нельзя отвечать на свое объявление
    if (ad.author === userLogin) {
      return res.status(400).json({ 
        error: 'self_response',
        message: 'Нельзя отвечать на собственное объявление' 
      });
    }

    // Импортируем модель Chat для создания сообщения
    const { Chat } = require('../models');
    
    const messageId = generateId();
    const responseMessage = `Ответ на объявление "${ad.type}": ${message}`;

    await Chat.create({
      id: messageId,
      by_user: userLogin,
      to_user: ad.author,
      message: responseMessage,
      images: null,
      date: new Date(),
      is_read: false
    });

    res.json({
      success: true,
      message: 'Ответ отправлен автору объявления'
    });

  } catch (error) {
    console.error('Respond to ad error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при отправке ответа' 
    });
  }
});

// GET /api/ads/stats - Статистика объявлений (для админов)
router.get('/stats', authenticateToken, requireVip, async (req, res) => {
  try {
    const totalAds = await Ads.count();
    
    const adsByType = await Ads.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });

    const adsByCity = await Ads.findAll({
      attributes: [
        'city',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['city'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      stats: {
        total_ads: totalAds,
        by_type: adsByType,
        by_city: adsByCity
      }
    });

  } catch (error) {
    console.error('Get ads stats error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении статистики' 
    });
  }
});

module.exports = router;