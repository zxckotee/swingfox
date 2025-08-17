const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { authenticateToken, requireVip } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');
const { sequelize } = require('../config/database');

// Создаем модель Ads динамически
const { DataTypes } = require('sequelize');

const Ads = sequelize.define('Ads', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    allowNull: false
  },
  login: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  country: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  city: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'ads',
  timestamps: true,
  underscored: true
});

// GET /api/ads - Получение объявлений с фильтрацией
router.get('/', async (req, res) => {
  try {
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
      whereClause.login = author;
    }

    const ads = await Ads.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Получаем информацию об авторах объявлений
    const authorLogins = [...new Set(ads.map(ad => ad.login))];
    const authors = await User.findAll({
      where: { login: authorLogins },
      attributes: ['login', 'ava', 'status', 'city', 'viptype', 'online']
    });

    // Формируем ответ с дополнительной информацией
    const adsWithAuthors = ads.map(ad => {
      const author = authors.find(u => u.login === ad.login);
      return {
        id: ad.id,
        type: ad.type,
        description: ad.description,
        country: ad.country,
        city: ad.city,
        created_at: ad.created_at,
        author: {
          login: ad.login,
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
  const adTypes = [
    'Все',
    'Встречи',
    'Знакомства',
    'Вечеринки',
    'Мероприятия',
    'Общение'
  ];

  res.json({
    success: true,
    types: adTypes
  });
});

// POST /api/ads/create - Создание объявления
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { type, description } = req.body;
    const userLogin = req.user.login;

    if (!type || !description) {
      return res.status(400).json({ 
        error: 'missing_data',
        message: 'Тип и описание объявления обязательны' 
      });
    }

    if (description.length < 10) {
      return res.status(400).json({ 
        error: 'description_too_short',
        message: 'Описание должно содержать минимум 10 символов' 
      });
    }

    if (description.length > 1000) {
      return res.status(400).json({ 
        error: 'description_too_long',
        message: 'Описание не должно превышать 1000 символов' 
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

    // Проверяем лимиты для бесплатных пользователей
    if (user.viptype === 'FREE') {
      const existingAds = await Ads.findAll({ where: { login: userLogin } });
      if (existingAds.length >= 1) {
        return res.status(403).json({ 
          error: 'ad_limit_reached',
          message: 'Бесплатные пользователи могут создать только одно объявление. Для снятия ограничений нужен VIP или PREMIUM статус' 
        });
      }
    }

    // Создаем объявление
    const adId = generateId();
    const newAd = await Ads.create({
      id: adId,
      login: userLogin,
      type,
      description,
      country: user.country,
      city: user.city
    });

    res.json({
      success: true,
      message: 'Объявление успешно создано',
      ad: {
        id: newAd.id,
        type: newAd.type,
        description: newAd.description,
        country: newAd.country,
        city: newAd.city,
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
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при создании объявления' 
    });
  }
});

// PUT /api/ads/:id - Редактирование объявления
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, description } = req.body;
    const userLogin = req.user.login;

    if (!type || !description) {
      return res.status(400).json({ 
        error: 'missing_data',
        message: 'Тип и описание объявления обязательны' 
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
    if (ad.login !== userLogin) {
      return res.status(403).json({ 
        error: 'no_permission',
        message: 'Вы можете редактировать только свои объявления' 
      });
    }

    // Обновляем объявление
    await ad.update({
      type,
      description,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Объявление успешно обновлено',
      ad: {
        id: ad.id,
        type: ad.type,
        description: ad.description,
        country: ad.country,
        city: ad.city,
        created_at: ad.created_at,
        updated_at: ad.updated_at
      }
    });

  } catch (error) {
    console.error('Update ad error:', error);
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
    if (ad.login !== userLogin) {
      return res.status(403).json({ 
        error: 'no_permission',
        message: 'Вы можете удалять только свои объявления' 
      });
    }

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
      where: { login: userLogin },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalCount = await Ads.count({ where: { login: userLogin } });

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
    if (ad.login === userLogin) {
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
      to_user: ad.login,
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