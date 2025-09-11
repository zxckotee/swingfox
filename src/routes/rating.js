const express = require('express');
const router = express.Router();
const { Rating, User, Notifications } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { APILogger } = require('../utils/logger');
const { sequelize } = require('../config/database');

// GET /api/rating/leaderboard - Лидерборд рейтинга
router.get('/leaderboard', authenticateToken, async (req, res) => {
  const logger = new APILogger('RATING');
  
  try {
    logger.logRequest(req, 'GET /rating/leaderboard');
    
    const { period = 'month', category = 'overall', city = '', limit = 20 } = req.query;
    const currentUser = req.user.login;

    logger.logBusinessLogic(1, 'Получение лидерборда рейтинга', {
      current_user: currentUser,
      period,
      category,
      city,
      limit: parseInt(limit)
    }, req);

    // Формируем условие для периода
    let whereClause = {};
    
    if (period !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      whereClause.created_at = {
        [Rating.sequelize.Sequelize.Op.gte]: startDate
      };
    }

    // Условие для города, если указан
    let userWhereClause = {};
    if (city) {
      userWhereClause.city = {
        [Rating.sequelize.Sequelize.Op.like]: `%${city}%`
      };
    }
    userWhereClause.status = { [Rating.sequelize.Sequelize.Op.ne]: 'BANNED' };

    // Получаем всех пользователей для комплексного расчета рейтинга
    const allUsers = await User.findAll({
      where: {
        ...userWhereClause
      },
      attributes: ['login', 'ava', 'city', 'viptype', 'status'],
      limit: parseInt(limit) * 3 // Берем больше пользователей для сортировки
    });

    // Рассчитываем комплексный рейтинг для каждого пользователя
    const usersWithRating = await Promise.all(
      allUsers.map(async (user) => {
        try {
          const comprehensiveRating = await Rating.getComprehensiveRating(user.login);
          return {
            user,
            rating: comprehensiveRating
          };
        } catch (error) {
          console.error(`Error calculating rating for ${user.login}:`, error);
          return {
            user,
            rating: {
              comprehensive_score: 0,
              total_activity: 0,
              direct_rating: { score: 0, votes: 0, positive_votes: 0, negative_votes: 0, percentage_positive: 0 },
              photo_reactions: { score: 0, count: 0 },
              profile_reactions: { score: 0, count: 0 },
              comments: { profile_comments: 0, photo_comments: 0, total_comments: 0 },
              photo_likes: 0
            }
          };
        }
      })
    );

    // Фильтруем пользователей с минимальной активностью и сортируем
    const leaderboard = usersWithRating
      .filter(item => item.rating.total_activity >= 3) // Минимум 3 активности
      .sort((a, b) => {
        // Сортируем по комплексному рейтингу, затем по общей активности
        if (b.rating.comprehensive_score !== a.rating.comprehensive_score) {
          return b.rating.comprehensive_score - a.rating.comprehensive_score;
        }
        return b.rating.total_activity - a.rating.total_activity;
      })
      .slice(0, parseInt(limit));

    // Форматируем результат
    const formattedUsers = leaderboard.map((item, index) => {
      const user = item.user;
      const rating = item.rating;
      
      return {
        id: user.login,
        login: user.login,
        name: user.login, // Using login instead of name since User model doesn't have name
        avatar: user.ava,
        city: user.city,
        vip_level: user.viptype,
        rating_score: rating.comprehensive_score,
        total_votes: rating.direct_rating.votes,
        positive_votes: rating.direct_rating.positive_votes,
        negative_votes: rating.direct_rating.negative_votes,
        percentage_positive: rating.direct_rating.percentage_positive,
        position: index + 1,
        
        // Детальная активность
        activity: {
          total: rating.total_activity,
          direct_rating: rating.direct_rating.votes,
          photo_reactions: rating.photo_reactions.count,
          profile_reactions: rating.profile_reactions.count,
          comments: rating.comments.total_comments,
          photo_likes: rating.photo_likes
        },
        
        // Детальные оценки
        scores: {
          direct_rating: rating.direct_rating.score,
          photo_reactions: rating.photo_reactions.score,
          profile_reactions: rating.profile_reactions.score,
          comments: rating.comments.total_comments,
          photo_likes: rating.photo_likes
        },
        
        rating_change: 0 // TODO: Добавить расчет изменений
      };
    });

    const responseData = {
      users: formattedUsers,
      period,
      category,
      city: city || null,
      total_found: formattedUsers.length
    };

    logger.logSuccess(req, 200, {
      period,
      category,
      users_count: formattedUsers.length
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении лидерборда'
    });
  }
});

// GET /api/rating/top/users - Топ пользователей по рейтингу
router.get('/top/users', authenticateToken, async (req, res) => {
  const logger = new APILogger('RATING');
  
  try {
    logger.logRequest(req, 'GET /rating/top/users');
    
    const { limit = 20, period = 'all' } = req.query;
    const currentUser = req.user.login;

    logger.logBusinessLogic(1, 'Получение топа пользователей по рейтингу', {
      current_user: currentUser,
      limit: parseInt(limit),
      period
    }, req);

    // Формируем условие для периода
    let whereClause = {};
    
    if (period !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      whereClause.created_at = {
        [Rating.sequelize.Sequelize.Op.gte]: startDate
      };
    }

    // Получаем топ пользователей - используем подзапрос для избежания проблем с GROUP BY
    const topUsersQuery = `
      SELECT 
        r.to_user,
        SUM(r.value) as total_rating,
        COUNT(r.value) as total_votes,
        SUM(CASE WHEN r.value = 1 THEN 1 ELSE 0 END) as positive_votes
      FROM rating r
      WHERE r.created_at >= :startDate
      GROUP BY r.to_user
      HAVING COUNT(r.value) >= 3
      ORDER BY SUM(r.value) DESC, COUNT(r.value) DESC
      LIMIT :limit
    `;

    const topUsers = await Rating.sequelize.query(topUsersQuery, {
      replacements: {
        startDate: whereClause.created_at ? whereClause.created_at[Rating.sequelize.Sequelize.Op.gte] : new Date(0),
        limit: parseInt(limit)
      },
      type: Rating.sequelize.QueryTypes.SELECT
    });

    // Получаем информацию о пользователях для топа
    const userIds = topUsers.map(item => item.to_user);
    const userData = await User.findAll({
      where: {
        login: { [Rating.sequelize.Sequelize.Op.in]: userIds },
        status: { [Rating.sequelize.Sequelize.Op.ne]: 'BANNED' }
      },
      attributes: ['login', 'ava', 'city', 'viptype', 'status']
    });

    // Создаем мапу пользователей для быстрого доступа
    const userMap = {};
    userData.forEach(user => {
      userMap[user.login] = user;
    });

    // Форматируем результат
    const formattedTop = topUsers.map((rating, index) => {
      const totalRating = parseInt(rating.total_rating) || 0;
      const totalVotes = parseInt(rating.total_votes) || 0;
      const positiveVotes = parseInt(rating.positive_votes) || 0;
      const user = userMap[rating.to_user];
      
      return {
        position: index + 1,
        user: {
          login: rating.to_user,
          name: rating.to_user, // Using login instead of name since User model doesn't have name
          avatar: user ? user.ava : null,
          city: user ? user.city : null,
          vip_type: user ? user.viptype : null
        },
        rating: {
          total_rating: totalRating,
          total_votes: totalVotes,
          positive_votes: positiveVotes,
          negative_votes: totalVotes - positiveVotes,
          average_rating: totalVotes > 0 ? (totalRating / totalVotes).toFixed(1) : 0,
          percentage_positive: totalVotes > 0 ? Math.round((positiveVotes / totalVotes) * 100) : 0
        }
      };
    });

    const responseData = {
      period,
      top_users: formattedTop,
      total_found: formattedTop.length
    };

    logger.logSuccess(req, 200, {
      period,
      users_count: formattedTop.length
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении топа пользователей'
    });
  }
});

// GET /api/rating/my/given - Получение оценок, которые поставил текущий пользователь
router.get('/my/given', authenticateToken, async (req, res) => {
  const logger = new APILogger('RATING');
  
  try {
    logger.logRequest(req, 'GET /rating/my/given');
    
    const { limit = 20, offset = 0 } = req.query;
    const currentUser = req.user.login;

    logger.logBusinessLogic(1, 'Получение оценок, поставленных пользователем', {
      current_user: currentUser,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }, req);

    // Получаем оценки, поставленные текущим пользователем
    const givenRatings = await Rating.findAll({
      where: { from_user: currentUser },
      include: [
        {
          model: User,
          as: 'rated',
          attributes: ['login', 'ava', 'city', 'viptype', 'status']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Форматируем результат
    const formattedRatings = givenRatings.map(rating => ({
      id: rating.id,
      to_user: rating.to_user,
      value: rating.value,
      created_at: rating.created_at,
      rated_user: {
        login: rating.rated.login,
        name: rating.rated.login, // Using login instead of name since User model doesn't have name
        avatar: rating.rated.ava,
        city: rating.rated.city,
        vip_type: rating.rated.viptype
      }
    }));

    const responseData = {
      ratings: formattedRatings,
      total_found: formattedRatings.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    logger.logSuccess(req, 200, {
      ratings_count: formattedRatings.length
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении поставленных оценок'
    });
  }
});

// GET /api/rating/my/received - Получение оценок, полученных текущим пользователем
router.get('/my/received', authenticateToken, async (req, res) => {
  const logger = new APILogger('RATING');
  
  try {
    logger.logRequest(req, 'GET /rating/my/received');
    
    const { limit = 20, offset = 0 } = req.query;
    const currentUser = req.user.login;

    logger.logBusinessLogic(1, 'Получение оценок, полученных пользователем', {
      current_user: currentUser,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }, req);

    // Получаем оценки, полученные текущим пользователем
    const receivedRatings = await Rating.findAll({
      where: { to_user: currentUser },
      include: [
        {
          model: User,
          as: 'rater',
          attributes: ['login', 'ava', 'city', 'viptype', 'status']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Форматируем результат
    const formattedRatings = receivedRatings.map(rating => ({
      id: rating.id,
      from_user: rating.from_user,
      value: rating.value,
      created_at: rating.created_at,
      rater_user: {
        login: rating.rater.login,
        name: rating.rater.login, // Using login instead of name since User model doesn't have name
        avatar: rating.rater.ava,
        city: rating.rater.city,
        vip_type: rating.rater.viptype
      }
    }));

    const responseData = {
      ratings: formattedRatings,
      total_found: formattedRatings.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    logger.logSuccess(req, 200, {
      ratings_count: formattedRatings.length
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении полученных оценок'
    });
  }
});

// GET /api/rating/my/stats - Статистика рейтинга текущего пользователя
router.get('/my/stats', authenticateToken, async (req, res) => {
  const logger = new APILogger('RATING');
  
  try {
    logger.logRequest(req, 'GET /rating/my/stats');
    
    const currentUser = req.user.login;

    logger.logBusinessLogic(1, 'Получение статистики рейтинга пользователя', {
      current_user: currentUser
    }, req);

    // Получаем текущий комплексный рейтинг
    const currentRating = await Rating.getComprehensiveRating(currentUser);

    // Получаем позицию в общем рейтинге на основе комплексного рейтинга
    const allUsers = await User.findAll({
      where: {
        status: { [Rating.sequelize.Sequelize.Op.ne]: 'BANNED' }
      },
      attributes: ['login'],
      limit: 100 // Берем больше пользователей для точного расчета позиции
    });

    // Рассчитываем комплексный рейтинг для всех пользователей
    const usersWithRating = await Promise.all(
      allUsers.map(async (user) => {
        try {
          const rating = await Rating.getComprehensiveRating(user.login);
          return {
            login: user.login,
            score: rating.comprehensive_score,
            activity: rating.total_activity
          };
        } catch (error) {
          return {
            login: user.login,
            score: 0,
            activity: 0
          };
        }
      })
    );

    // Сортируем пользователей по комплексному рейтингу
    const sortedUsers = usersWithRating
      .filter(user => user.activity >= 3) // Минимум 3 активности
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.activity - a.activity;
      });

    // Находим позицию текущего пользователя
    const currentPosition = sortedUsers.findIndex(user => user.login === currentUser) + 1;

    // Получаем изменение за месяц (комплексное)
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Рассчитываем рейтинг месяц назад (упрощенно)
    // В реальной системе нужно было бы хранить историю рейтингов
    // Здесь мы используем приблизительный расчет на основе активности за месяц
    
    const { Reactions, ProfileComments, PhotoComments } = Rating.sequelize.models;
    
    // Прямые оценки за месяц
    const monthlyDirectRatings = await Rating.findAll({
      where: {
        to_user: currentUser,
        created_at: {
          [sequelize.Sequelize.Op.gte]: monthAgo
        }
      },
      attributes: [
        [Rating.sequelize.fn('SUM', Rating.sequelize.col('value')), 'month_change']
      ],
      raw: true
    });

    const monthlyDirectChange = parseInt(monthlyDirectRatings[0]?.month_change) || 0;

    // Реакции на профиль за месяц
    const monthlyProfileReactions = await Reactions.findAll({
      where: {
        object_type: 'profile',
        object_id: currentUser,
        created_at: {
          [sequelize.Sequelize.Op.gte]: monthAgo
        }
      },
      attributes: [
        [Rating.sequelize.fn('SUM', Rating.sequelize.col('value')), 'month_reactions']
      ],
      raw: true
    });

    const monthlyProfileReactionChange = parseInt(monthlyProfileReactions[0]?.month_reactions) || 0;

    // Реакции на фото за месяц
    const monthlyPhotoReactions = await Reactions.findAll({
      where: {
        object_type: 'image',
        object_id: { [Rating.sequelize.Sequelize.Op.like]: `%${currentUser}%` },
        created_at: {
          [sequelize.Sequelize.Op.gte]: monthAgo
        }
      },
      attributes: [
        [Rating.sequelize.fn('SUM', Rating.sequelize.col('value')), 'month_reactions']
      ],
      raw: true
    });

    const monthlyPhotoReactionChange = parseInt(monthlyPhotoReactions[0]?.month_reactions) || 0;

    // Комментарии к профилю за месяц
    const monthlyProfileComments = await ProfileComments.count({
      where: {
        to_user: currentUser,
        is_deleted: false,
        created_at: {
          [sequelize.Sequelize.Op.gte]: monthAgo
        }
      }
    });

    // Комментарии к фото за месяц
    const monthlyPhotoComments = await PhotoComments.count({
      where: {
        image_filename: { [Rating.sequelize.Sequelize.Op.like]: `%${currentUser}%` },
        is_deleted: false,
        created_at: {
          [sequelize.Sequelize.Op.gte]: monthAgo
        }
      }
    });

    // Рассчитываем комплексное изменение за месяц с теми же весами
    const weights = {
      directRating: 3.0,
      photoReactions: 2.0,
      profileReactions: 1.5,
      profileComments: 1.0,
      photoComments: 0.8,
      photoLikes: 0.5
    };

    const monthChange = 
      (monthlyDirectChange * weights.directRating) +
      (monthlyPhotoReactionChange * weights.photoReactions) +
      (monthlyProfileReactionChange * weights.profileReactions) +
      (monthlyProfileComments * weights.profileComments) +
      (monthlyPhotoComments * weights.photoComments);

    // Получаем историю изменений (последние 10 оценок)
    const ratingHistory = await Rating.findAll({
      where: { to_user: currentUser },
      include: [
        {
          model: User,
          as: 'rater',
          attributes: ['login']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    const history = ratingHistory.map(rating => ({
      id: rating.id,
      change: rating.value,
      reason: `Оценка от ${rating.rater?.login || rating.from_user}`,
      created_at: rating.created_at,
      from_user: rating.from_user
    }));

    // Получаем максимальный рейтинг (исторический)
    const maxRating = Math.max(currentRating.comprehensive_score, 0);

    const responseData = {
      current_rating: currentRating.comprehensive_score,
      current_position: currentPosition || 999, // Если позиция не найдена, показываем высокий номер
      rating_change: monthChange,
      max_rating: maxRating,
      total_votes: currentRating.direct_rating?.votes || 0,
      positive_votes: currentRating.direct_rating?.positive_votes || 0,
      negative_votes: currentRating.direct_rating?.negative_votes || 0,
      percentage_positive: currentRating.direct_rating?.percentage_positive || 0,
      total_activity: currentRating.total_activity || 0,
      
      // Детальная статистика
      detailed_stats: {
        direct_rating: currentRating.direct_rating,
        photo_reactions: currentRating.photo_reactions,
        profile_reactions: currentRating.profile_reactions,
        comments: currentRating.comments,
        photo_likes: currentRating.photo_likes
      },
      
      rating_history: history
    };

    logger.logSuccess(req, 200, {
      current_rating: currentRating.comprehensive_score,
      current_position: currentPosition,
      total_activity: currentRating.total_activity,
      history_count: history.length
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении статистики рейтинга'
    });
  }
});

// GET /api/rating/:username - Получение рейтинга пользователя
router.get('/:username', authenticateToken, async (req, res) => {
  const logger = new APILogger('RATING');
  
  try {
    logger.logRequest(req, 'GET /rating/:username');
    
    const { username } = req.params;
    const currentUser = req.user.login;

    logger.logBusinessLogic(1, 'Получение рейтинга пользователя', {
      current_user: currentUser,
      target_user: username
    }, req);

    // Проверяем существование пользователя
    const targetUser = await User.findOne({ where: { login: username } });
    if (!targetUser) {
      return res.status(404).json({
        error: 'user_not_found',
        message: 'Пользователь не найден'
      });
    }

    // Получаем комплексный рейтинг пользователя
    const comprehensiveRating = await Rating.getComprehensiveRating(username);
    
    // Проверяем, оценивал ли текущий пользователь целевого
    const userRating = await Rating.findOne({
      where: {
        from_user: currentUser,
        to_user: username
      }
    });

    // Получаем историю рейтинга (последние 10 оценок)
    const ratingHistory = await Rating.getUserRatingHistory(username, 10);

    const responseData = {
      user: {
        login: targetUser.login,
        name: targetUser.login, // Using login instead of name since User model doesn't have name
        avatar: targetUser.ava,
        vip_type: targetUser.viptype
      },
      rating: comprehensiveRating,
      user_vote: userRating ? userRating.value : null,
      can_vote: currentUser !== username, // Нельзя голосовать за себя
      recent_ratings: ratingHistory.map(rating => ({
        from_user: rating.from_user,
        rater_info: rating.rater ? {
          login: rating.rater.login,
          avatar: rating.rater.ava
        } : null,
        value: rating.value,
        date: rating.date,
        created_at: rating.created_at
      }))
    };

    logger.logSuccess(req, 200, {
      target_user: username,
      comprehensive_score: comprehensiveRating.comprehensive_score,
      user_has_voted: !!userRating
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении рейтинга'
    });
  }
});

// POST /api/rating/:username - Оценка пользователя
router.post('/:username', authenticateToken, async (req, res) => {
  const logger = new APILogger('RATING');
  
  try {
    logger.logRequest(req, 'POST /rating/:username');
    
    const { username } = req.params;
    const { value } = req.body;
    const currentUser = req.user.login;

    if (!value || (value !== 1 && value !== -1)) {
      return res.status(400).json({
        error: 'invalid_value',
        message: 'Значение должно быть 1 (плюс) или -1 (минус)'
      });
    }

    logger.logBusinessLogic(1, 'Оценка пользователя', {
      from_user: currentUser,
      to_user: username,
      value
    }, req);

    // Проверяем существование пользователя
    const targetUser = await User.findOne({ where: { login: username } });
    if (!targetUser) {
      return res.status(404).json({
        error: 'user_not_found',
        message: 'Пользователь не найден'
      });
    }

    try {
      // Устанавливаем рейтинг
      const result = await Rating.setUserRating(currentUser, username, value);
      
      logger.logDatabase('INSERT/UPDATE', 'rating', {
        from_user: currentUser,
        to_user: username,
        value,
        action: result.action
      }, req);

      // Получаем обновленный рейтинг
      const updatedRating = await Rating.getUserRating(username);

      // Создаем уведомление получателю оценки
      try {
        const notificationMessage = value === 1 
          ? 'Ваш профиль получил положительную оценку!'
          : 'Ваш профиль получил отрицательную оценку';
          
        await Notifications.createNotification({
          user_id: username,
          type: 'rating',
          title: 'Новая оценка',
          message: notificationMessage,
          from_user: currentUser,
          priority: 'normal',
          data: {
            rating_value: value,
            new_total_rating: updatedRating.total_rating
          }
        });
      } catch (notifError) {
        logger.logWarning('Ошибка создания уведомления об оценке', notifError, req);
      }

      logger.logResult('Оценка пользователя', true, {
        action: result.action,
        new_total_rating: updatedRating.total_rating
      }, req);

      const responseData = {
        success: true,
        action: result.action,
        rating: {
          value,
          updated_rating: updatedRating
        },
        message: result.action === 'created' ? 'Оценка добавлена' : 'Оценка обновлена'
      };

      logger.logSuccess(req, 200, responseData);
      res.json(responseData);

    } catch (ratingError) {
      logger.logWarning('Ошибка при установке рейтинга', ratingError, req);
      
      return res.status(400).json({
        error: 'rating_error',
        message: ratingError.message
      });
    }

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при оценке пользователя'
    });
  }
});

// DELETE /api/rating/:username - Удаление оценки
router.delete('/:username', authenticateToken, async (req, res) => {
  const logger = new APILogger('RATING');
  
  try {
    logger.logRequest(req, 'DELETE /rating/:username');
    
    const { username } = req.params;
    const currentUser = req.user.login;

    logger.logBusinessLogic(1, 'Удаление оценки пользователя', {
      from_user: currentUser,
      to_user: username
    }, req);

    // Находим существующую оценку
    const existingRating = await Rating.findOne({
      where: {
        from_user: currentUser,
        to_user: username
      }
    });

    if (!existingRating) {
      return res.status(404).json({
        error: 'rating_not_found',
        message: 'Вы не оценивали этого пользователя'
      });
    }

    logger.logDatabase('DELETE', 'rating', {
      from_user: currentUser,
      to_user: username,
      old_value: existingRating.value
    }, req);

    // Удаляем оценку
    await existingRating.destroy();

    // Получаем обновленный рейтинг
    const updatedRating = await Rating.getUserRating(username);

    logger.logResult('Удаление оценки', true, {
      new_total_rating: updatedRating.total_rating
    }, req);

    const responseData = {
      success: true,
      updated_rating: updatedRating,
      message: 'Оценка удалена'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при удалении оценки'
    });
  }
});

module.exports = router;