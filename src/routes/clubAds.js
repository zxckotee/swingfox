const express = require('express');
const { sequelize } = require('../config/database');
const { Ads, ClubEvents } = require('../models');
const { authenticateClub } = require('../middleware/clubAuth');
const router = express.Router();

// Получение объявлений клуба
router.get('/', authenticateClub, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    
    const whereClause = {
      club_id: req.club.id,
      is_club_ad: true
    };

    if (status) {
      whereClause.status = status;
    }

    const ads = await Ads.findAll({
      where: whereClause,
      include: [
        {
          model: ClubEvents,
          as: 'event',
          attributes: ['id', 'title', 'date', 'event_type']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ ads });
  } catch (error) {
    console.error('Get club ads error:', error);
    res.status(500).json({ error: 'Ошибка при получении объявлений' });
  }
});

// Создание объявления клуба
router.post('/', authenticateClub, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      country,
      city,
      price,
      contact_info,
      image,
      event_id,
      viral_share_enabled,
      referral_bonus,
      club_contact_info
    } = req.body;

    // Валидация
    if (!title || !description || !type || !country || !city) {
      return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
    }

    // Проверка существования мероприятия, если указано
    if (event_id) {
      const event = await ClubEvents.findOne({
        where: { id: event_id, club_id: req.club.id }
      });
      
      if (!event) {
        return res.status(400).json({ error: 'Мероприятие не найдено' });
      }
    }

    const ad = await Ads.create({
      title,
      description,
      author: req.club.login, // Используем логин клуба как автора
      type,
      country,
      city,
      price: price ? parseFloat(price) : 0,
      contact_info,
      image,
      status: 'pending',
      club_id: req.club.id,
      is_club_ad: true,
      club_contact_info: club_contact_info || contact_info,
      viral_share_enabled: viral_share_enabled !== false,
      referral_bonus: referral_bonus ? parseFloat(referral_bonus) : 0,
      event_id: event_id || null
    });

    res.status(201).json({
      message: 'Объявление создано',
      ad: ad.toJSON()
    });

  } catch (error) {
    console.error('Create club ad error:', error);
    res.status(500).json({ error: 'Ошибка при создании объявления' });
  }
});

// Получение конкретного объявления клуба
router.get('/:adId', authenticateClub, async (req, res) => {
  try {
    const { adId } = req.params;

    const ad = await Ads.findOne({
      where: {
        id: adId,
        club_id: req.club.id,
        is_club_ad: true
      },
      include: [
        {
          model: ClubEvents,
          as: 'event',
          attributes: ['id', 'title', 'date', 'event_type', 'location']
        }
      ]
    });

    if (!ad) {
      return res.status(404).json({ error: 'Объявление не найдено' });
    }

    res.json({ ad: ad.toJSON() });
  } catch (error) {
    console.error('Get club ad error:', error);
    res.status(500).json({ error: 'Ошибка при получении объявления' });
  }
});

// Обновление объявления клуба
router.put('/:adId', authenticateClub, async (req, res) => {
  try {
    const { adId } = req.params;
    const {
      title,
      description,
      type,
      country,
      city,
      price,
      contact_info,
      image,
      event_id,
      viral_share_enabled,
      referral_bonus,
      club_contact_info
    } = req.body;

    const ad = await Ads.findOne({
      where: {
        id: adId,
        club_id: req.club.id,
        is_club_ad: true
      }
    });

    if (!ad) {
      return res.status(404).json({ error: 'Объявление не найдено' });
    }

    // Проверяем, можно ли редактировать объявление
    if (!ad.canEdit(req.club.login)) {
      return res.status(403).json({ error: 'Нельзя редактировать это объявление' });
    }

    // Проверка существования мероприятия, если указано
    if (event_id) {
      const event = await ClubEvents.findOne({
        where: { id: event_id, club_id: req.club.id }
      });
      
      if (!event) {
        return res.status(400).json({ error: 'Мероприятие не найдено' });
      }
    }

    // Обновление полей
    if (title) ad.title = title;
    if (description) ad.description = description;
    if (type) ad.type = type;
    if (country) ad.country = country;
    if (city) ad.city = city;
    if (price !== undefined) ad.price = parseFloat(price) || 0;
    if (contact_info !== undefined) ad.contact_info = contact_info;
    if (image !== undefined) ad.image = image;
    if (event_id !== undefined) ad.event_id = event_id;
    if (viral_share_enabled !== undefined) ad.viral_share_enabled = viral_share_enabled;
    if (referral_bonus !== undefined) ad.referral_bonus = parseFloat(referral_bonus) || 0;
    if (club_contact_info !== undefined) ad.club_contact_info = club_contact_info;

    await ad.save();

    res.json({
      message: 'Объявление обновлено',
      ad: ad.toJSON()
    });

  } catch (error) {
    console.error('Update club ad error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении объявления' });
  }
});

// Удаление объявления клуба
router.delete('/:adId', authenticateClub, async (req, res) => {
  try {
    const { adId } = req.params;

    const ad = await Ads.findOne({
      where: {
        id: adId,
        club_id: req.club.id,
        is_club_ad: true
      }
    });

    if (!ad) {
      return res.status(404).json({ error: 'Объявление не найдено' });
    }

    // Проверяем, можно ли удалить объявление
    if (ad.status !== 'pending') {
      return res.status(403).json({ error: 'Можно удалить только объявления на модерации' });
    }

    await ad.destroy();

    res.json({ message: 'Объявление удалено' });
  } catch (error) {
    console.error('Delete club ad error:', error);
    res.status(500).json({ error: 'Ошибка при удалении объявления' });
  }
});

// Статистика объявлений клуба
router.get('/stats/overview', authenticateClub, async (req, res) => {
  try {
    const stats = await Ads.findAll({
      where: {
        club_id: req.club.id,
        is_club_ad: true
      },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('views_count')), 'total_views']
      ],
      group: ['status'],
      raw: true
    });

    const result = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total_views: 0,
      total_ads: 0
    };

    stats.forEach(stat => {
      result[stat.status] = parseInt(stat.count);
      result.total_views += parseInt(stat.total_views || 0);
      result.total_ads += parseInt(stat.count);
    });

    res.json({ stats: result });
  } catch (error) {
    console.error('Get club ads stats error:', error);
    res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
});

// Публичные объявления клубов (для пользователей)
router.get('/public/club-ads', async (req, res) => {
  try {
    const { limit = 10, city, type } = req.query;
    
    const whereClause = {
      is_club_ad: true,
      status: 'approved'
    };

    if (city) {
      whereClause.city = {
        [sequelize.Sequelize.Op.iLike]: `%${city}%`
      };
    }

    if (type) {
      whereClause.type = type;
    }

    const ads = await Ads.findAll({
      where: whereClause,
      include: [
        {
          model: ClubEvents,
          as: 'event',
          attributes: ['id', 'title', 'date', 'event_type', 'location']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({ ads });
  } catch (error) {
    console.error('Get public club ads error:', error);
    res.status(500).json({ error: 'Ошибка при получении объявлений' });
  }
});

module.exports = router;
