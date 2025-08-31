const express = require('express');
const router = express.Router();
const { Clubs, User, Notifications } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { APILogger } = require('../utils/logger');

// POST /api/referrals/generate - Сгенерировать реферальный код
router.post('/generate', authenticateToken, async (req, res) => {
  const logger = new APILogger('REFERRALS');
  
  try {
    logger.logRequest(req, 'POST /referrals/generate');
    
    const { club_id } = req.body;
    const userId = req.user.login;

    if (!club_id) {
      return res.status(400).json({
        error: 'missing_data',
        message: 'Укажите ID клуба'
      });
    }

    logger.logBusinessLogic(1, 'Генерация реферального кода', {
      user_id: userId,
      club_id
    }, req);

    // Проверяем права доступа
    const club = await Clubs.findOne({
      where: {
        id: parseInt(club_id),
        owner: userId,
        is_active: true
      }
    });

    if (!club) {
      return res.status(403).json({
        error: 'access_denied',
        message: 'Нет доступа к управлению этим клубом'
      });
    }

    // Генерируем новый реферальный код
    const referralCode = await club.generateReferralCode();

    logger.logResult('Генерация реферального кода', true, {
      club_id,
      referral_code: referralCode
    }, req);

    const responseData = {
      success: true,
      referral_code: referralCode,
      club: {
        id: club.id,
        name: club.name
      },
      message: 'Реферальный код сгенерирован'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при генерации реферального кода'
    });
  }
});

// POST /api/referrals/use/:code - Использовать реферальный код
router.post('/use/:code', authenticateToken, async (req, res) => {
  const logger = new APILogger('REFERRALS');
  
  try {
    logger.logRequest(req, 'POST /referrals/use/:code');
    
    const { code } = req.params;
    const userId = req.user.login;

    if (!code) {
      return res.status(400).json({
        error: 'missing_data',
        message: 'Укажите реферальный код'
      });
    }

    logger.logBusinessLogic(1, 'Использование реферального кода', {
      user_id: userId,
      referral_code: code
    }, req);

    // Находим клуб по реферальному коду
    const club = await Clubs.findOne({
      where: {
        referral_code: code.toUpperCase(),
        is_active: true
      }
    });

    if (!club) {
      return res.status(404).json({
        error: 'invalid_code',
        message: 'Неверный реферальный код'
      });
    }

    // Проверяем, не использовал ли пользователь уже этот код
    const existingReferral = await User.findOne({
      where: {
        login: userId,
        referral_source: code
      }
    });

    if (existingReferral) {
      return res.status(400).json({
        error: 'already_used',
        message: 'Вы уже использовали этот реферальный код'
      });
    }

    // Обновляем профиль пользователя
    await User.update(
      { referral_source: code },
      { where: { login: userId } }
    );

    // Создаем уведомление владельцу клуба
    try {
      await Notifications.createNotification({
        user_id: club.owner,
        type: 'referral_used',
        title: 'Реферальный код использован!',
        message: `Пользователь ${req.user.name || userId} использовал ваш реферальный код для клуба "${club.name}"`,
        from_user: userId,
        target_id: club.id.toString(),
        target_type: 'club',
        priority: 'normal',
        data: {
          club_id: club.id,
          referral_code: code,
          referred_user: userId
        }
      });
    } catch (notifError) {
      logger.logWarning('Ошибка создания уведомления', notifError, req);
    }

    // Создаем уведомление пользователю
    try {
      await Notifications.createNotification({
        user_id: userId,
        type: 'referral_success',
        title: 'Реферальный код применен!',
        message: `Вы успешно использовали реферальный код для клуба "${club.name}"`,
        from_user: club.owner,
        target_id: club.id.toString(),
        target_type: 'club',
        priority: 'normal',
        data: {
          club_id: club.id,
          referral_code: code
        }
      });
    } catch (notifError) {
      logger.logWarning('Ошибка создания уведомления пользователю', notifError, req);
    }

    logger.logResult('Использование реферального кода', true, {
      user_id: userId,
      club_id: club.id,
      referral_code: code
    }, req);

    const responseData = {
      success: true,
      club: {
        id: club.id,
        name: club.name,
        description: club.description,
        category: club.category,
        rating: club.rating,
        member_count: club.member_count,
        is_premium: club.is_premium
      },
      referral_code: code,
      message: 'Реферальный код успешно применен'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при использовании реферального кода'
    });
  }
});

// GET /api/referrals/stats - Получение статистики рефералов
router.get('/stats', authenticateToken, async (req, res) => {
  const logger = new APILogger('REFERRALS');
  
  try {
    logger.logRequest(req, 'GET /referrals/stats');
    
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Получение статистики рефералов', {
      user_id: userId
    }, req);

    // Получаем клубы пользователя
    const userClubs = await Clubs.findAll({
      where: {
        owner: userId,
        is_active: true
      },
      attributes: ['id', 'name', 'referral_code', 'member_count']
    });

    // Получаем статистику по каждому клубу
    const referralStats = await Promise.all(
      userClubs.map(async (club) => {
        const referredUsers = await User.count({
          where: {
            referral_source: club.referral_code
          }
        });

        return {
          club_id: club.id,
          club_name: club.name,
          referral_code: club.referral_code,
          total_members: club.member_count,
          referred_users: referredUsers,
          conversion_rate: club.member_count > 0 ? 
            ((referredUsers / club.member_count) * 100).toFixed(2) : 0
        };
      })
    );

    // Общая статистика
    const totalStats = {
      total_clubs: userClubs.length,
      total_referred_users: referralStats.reduce((sum, stat) => sum + stat.referred_users, 0),
      total_members: referralStats.reduce((sum, stat) => sum + stat.total_members, 0),
      average_conversion_rate: referralStats.length > 0 ? 
        (referralStats.reduce((sum, stat) => sum + parseFloat(stat.conversion_rate), 0) / referralStats.length).toFixed(2) : 0
    };

    const responseData = {
      club_stats: referralStats,
      total_stats: totalStats
    };

    logger.logSuccess(req, 200, {
      clubs_count: userClubs.length,
      total_referred_users: totalStats.total_referred_users
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении статистики рефералов'
    });
  }
});

// GET /api/referrals/club/:clubId - Получение рефералов конкретного клуба
router.get('/club/:clubId', authenticateToken, async (req, res) => {
  const logger = new APILogger('REFERRALS');
  
  try {
    logger.logRequest(req, 'GET /referrals/club/:clubId');
    
    const { clubId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.login;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    logger.logBusinessLogic(1, 'Получение рефералов клуба', {
      user_id: userId,
      club_id: clubId,
      page: parseInt(page),
      limit: parseInt(limit)
    }, req);

    // Проверяем права доступа
    const club = await Clubs.findOne({
      where: {
        id: parseInt(clubId),
        owner: userId,
        is_active: true
      }
    });

    if (!club) {
      return res.status(403).json({
        error: 'access_denied',
        message: 'Нет доступа к этому клубу'
      });
    }

    // Получаем пользователей, использовавших реферальный код
    const referredUsers = await User.findAndCountAll({
      where: {
        referral_source: club.referral_code
      },
      attributes: ['id', 'login', 'name', 'ava', 'city', 'viptype', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    const responseData = {
      club: {
        id: club.id,
        name: club.name,
        referral_code: club.referral_code
      },
      referred_users: referredUsers.rows.map(user => ({
        id: user.id,
        login: user.login,
        name: user.name,
        avatar: user.ava,
        city: user.city,
        vip_type: user.viptype,
        joined_at: user.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: referredUsers.count,
        pages: Math.ceil(referredUsers.count / parseInt(limit))
      }
    };

    logger.logSuccess(req, 200, {
      club_id: clubId,
      referred_users_count: referredUsers.rows.length,
      total_count: referredUsers.count
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении рефералов клуба'
    });
  }
});

// POST /api/referrals/share - Поделиться реферальным кодом
router.post('/share', authenticateToken, async (req, res) => {
  const logger = new APILogger('REFERRALS');
  
  try {
    logger.logRequest(req, 'POST /referrals/share');
    
    const { club_id, share_type, message } = req.body;
    const userId = req.user.login;

    if (!club_id || !share_type) {
      return res.status(400).json({
        error: 'missing_data',
        message: 'Укажите ID клуба и тип распространения'
      });
    }

    logger.logBusinessLogic(1, 'Распространение реферального кода', {
      user_id: userId,
      club_id,
      share_type
    }, req);

    // Проверяем права доступа
    const club = await Clubs.findOne({
      where: {
        id: parseInt(club_id),
        owner: userId,
        is_active: true
      }
    });

    if (!club) {
      return res.status(403).json({
        error: 'access_denied',
        message: 'Нет доступа к этому клубу'
      });
    }

    if (!club.referral_code) {
      return res.status(400).json({
        error: 'no_referral_code',
        message: 'У клуба нет реферального кода'
      });
    }

    // Формируем сообщение для распространения
    const shareMessage = message || 
      `Присоединяйся к клубу "${club.name}"! Используй мой реферальный код: ${club.referral_code}`;

    const responseData = {
      success: true,
      share_data: {
        club_name: club.name,
        referral_code: club.referral_code,
        message: shareMessage,
        share_type
      },
      share_urls: {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(shareMessage)}`,
        vk: `https://vk.com/share.php?url=${encodeURIComponent(window.location.origin)}&title=${encodeURIComponent(club.name)}&description=${encodeURIComponent(shareMessage)}`
      },
      message: 'Реферальный код готов к распространению'
    };

    logger.logSuccess(req, 200, {
      club_id,
      share_type
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при распространении реферального кода'
    });
  }
});

module.exports = router;
