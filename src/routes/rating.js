const express = require('express');
const router = express.Router();
const { Rating, User, Notifications } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { APILogger } = require('../utils/logger');

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

    // Получаем рейтинг пользователя
    const ratingData = await Rating.getUserRating(username);
    
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
        name: targetUser.name,
        avatar: targetUser.ava,
        vip_type: targetUser.viptype
      },
      rating: ratingData,
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
      total_rating: ratingData.total_rating,
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

    // Получаем топ пользователей
    const topUsers = await Rating.findAll({
      where: whereClause,
      attributes: [
        'to_user',
        [Rating.sequelize.fn('SUM', Rating.sequelize.col('value')), 'total_rating'],
        [Rating.sequelize.fn('COUNT', Rating.sequelize.col('value')), 'total_votes'],
        [Rating.sequelize.fn('SUM', Rating.sequelize.literal('CASE WHEN value = 1 THEN 1 ELSE 0 END')), 'positive_votes']
      ],
      include: [
        {
          model: User,
          as: 'rated',
          attributes: ['login', 'name', 'ava', 'city', 'viptype', 'status'],
          where: { status: { [Rating.sequelize.Sequelize.Op.ne]: 'BANNED' } }
        }
      ],
      group: ['to_user', 'rated.login', 'rated.name', 'rated.ava', 'rated.city', 'rated.viptype', 'rated.status'],
      having: Rating.sequelize.literal('COUNT(value) >= 3'), // Минимум 3 оценки
      order: [
        [Rating.sequelize.fn('SUM', Rating.sequelize.col('value')), 'DESC'],
        [Rating.sequelize.fn('COUNT', Rating.sequelize.col('value')), 'DESC']
      ],
      limit: parseInt(limit)
    });

    // Форматируем результат
    const formattedTop = topUsers.map((rating, index) => {
      const totalRating = parseInt(rating.get('total_rating')) || 0;
      const totalVotes = parseInt(rating.get('total_votes')) || 0;
      const positiveVotes = parseInt(rating.get('positive_votes')) || 0;
      
      return {
        position: index + 1,
        user: {
          login: rating.rated.login,
          name: rating.rated.name,
          avatar: rating.rated.ava,
          city: rating.rated.city,
          vip_type: rating.rated.viptype
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

// GET /api/rating/my/given - Получение оценок, поставленных текущим пользователем
router.get('/my/given', authenticateToken, async (req, res) => {
  const logger = new APILogger('RATING');
  
  try {
    logger.logRequest(req, 'GET /rating/my/given');
    
    const { page = 1, limit = 20 } = req.query;
    const currentUser = req.user.login;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    logger.logBusinessLogic(1, 'Получение поставленных оценок', {
      current_user: currentUser,
      page: parseInt(page),
      limit: parseInt(limit)
    }, req);

    // Получаем оценки, поставленные пользователем
    const givenRatings = await Rating.findAll({
      where: { from_user: currentUser },
      include: [
        {
          model: User,
          as: 'rated',
          attributes: ['login', 'name', 'ava', 'city', 'viptype']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Подсчитываем общее количество
    const totalCount = await Rating.count({
      where: { from_user: currentUser }
    });

    // Форматируем результат
    const formattedRatings = givenRatings.map(rating => ({
      id: rating.id,
      to_user: rating.to_user,
      user_info: rating.rated ? {
        login: rating.rated.login,
        name: rating.rated.name,
        avatar: rating.rated.ava,
        city: rating.rated.city,
        vip_type: rating.rated.viptype
      } : null,
      value: rating.value,
      date: rating.date,
      created_at: rating.created_at
    }));

    const responseData = {
      given_ratings: formattedRatings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };

    logger.logSuccess(req, 200, {
      ratings_count: formattedRatings.length,
      total_count: totalCount
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

// GET /api/rating/my/received - Получение полученных оценок
router.get('/my/received', authenticateToken, async (req, res) => {
  const logger = new APILogger('RATING');
  
  try {
    logger.logRequest(req, 'GET /rating/my/received');
    
    const { page = 1, limit = 20 } = req.query;
    const currentUser = req.user.login;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    logger.logBusinessLogic(1, 'Получение полученных оценок', {
      current_user: currentUser,
      page: parseInt(page),
      limit: parseInt(limit)
    }, req);

    // Получаем оценки, полученные пользователем
    const receivedRatings = await Rating.findAll({
      where: { to_user: currentUser },
      include: [
        {
          model: User,
          as: 'rater',
          attributes: ['login', 'name', 'ava', 'city', 'viptype']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Подсчитываем общее количество
    const totalCount = await Rating.count({
      where: { to_user: currentUser }
    });

    // Получаем общий рейтинг
    const overallRating = await Rating.getUserRating(currentUser);

    // Форматируем результат
    const formattedRatings = receivedRatings.map(rating => ({
      id: rating.id,
      from_user: rating.from_user,
      rater_info: rating.rater ? {
        login: rating.rater.login,
        name: rating.rater.name,
        avatar: rating.rater.ava,
        city: rating.rater.city,
        vip_type: rating.rater.viptype
      } : null,
      value: rating.value,
      date: rating.date,
      created_at: rating.created_at
    }));

    const responseData = {
      overall_rating: overallRating,
      received_ratings: formattedRatings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };

    logger.logSuccess(req, 200, {
      ratings_count: formattedRatings.length,
      total_count: totalCount,
      overall_rating: overallRating.total_rating
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

    // Получаем лидерборд
    const leaderboard = await Rating.findAll({
      where: whereClause,
      attributes: [
        'to_user',
        [Rating.sequelize.fn('SUM', Rating.sequelize.col('value')), 'rating_score'],
        [Rating.sequelize.fn('COUNT', Rating.sequelize.col('value')), 'total_votes'],
        [Rating.sequelize.fn('SUM', Rating.sequelize.literal('CASE WHEN value = 1 THEN 1 ELSE 0 END')), 'positive_votes']
      ],
      include: [
        {
          model: User,
          as: 'rated',
          attributes: ['login', 'name', 'ava', 'city', 'viptype', 'status'],
          where: userWhereClause
        }
      ],
      group: ['to_user', 'rated.login', 'rated.name', 'rated.ava', 'rated.city', 'rated.viptype', 'rated.status'],
      having: Rating.sequelize.literal('COUNT(value) >= 3'), // Минимум 3 оценки
      order: [
        [Rating.sequelize.fn('SUM', Rating.sequelize.col('value')), 'DESC'],
        [Rating.sequelize.fn('COUNT', Rating.sequelize.col('value')), 'DESC']
      ],
      limit: parseInt(limit)
    });

    // Форматируем результат
    const users = leaderboard.map((rating, index) => {
      const ratingScore = parseInt(rating.get('rating_score')) || 0;
      const totalVotes = parseInt(rating.get('total_votes')) || 0;
      const positiveVotes = parseInt(rating.get('positive_votes')) || 0;
      
      return {
        id: rating.rated.login,
        login: rating.rated.login,
        name: rating.rated.name,
        avatar: rating.rated.ava,
        city: rating.rated.city,
        vip_level: rating.rated.viptype,
        rating_score: ratingScore,
        total_votes: totalVotes,
        positive_votes: positiveVotes,
        negative_votes: totalVotes - positiveVotes,
        percentage_positive: totalVotes > 0 ? Math.round((positiveVotes / totalVotes) * 100) : 0,
        position: index + 1,
        profile_views: 0, // TODO: Добавить когда будет статистика
        likes_received: 0, // TODO: Добавить когда будет статистика
        rating_change: 0 // TODO: Добавить расчет изменений
      };
    });

    const responseData = {
      users,
      period,
      category,
      city: city || null,
      total_found: users.length
    };

    logger.logSuccess(req, 200, {
      period,
      category,
      users_count: users.length
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

// GET /api/rating/my/stats - Статистика рейтинга текущего пользователя
router.get('/my/stats', authenticateToken, async (req, res) => {
  const logger = new APILogger('RATING');
  
  try {
    logger.logRequest(req, 'GET /rating/my/stats');
    
    const currentUser = req.user.login;

    logger.logBusinessLogic(1, 'Получение статистики рейтинга пользователя', {
      current_user: currentUser
    }, req);

    // Получаем текущий рейтинг
    const currentRating = await Rating.getUserRating(currentUser);

    // Получаем позицию в общем рейтинге
    const higherRatedUsers = await Rating.findAll({
      attributes: [
        'to_user',
        [Rating.sequelize.fn('SUM', Rating.sequelize.col('value')), 'total_rating']
      ],
      include: [
        {
          model: User,
          as: 'rated',
          attributes: ['login'],
          where: {
            status: { [Rating.sequelize.Sequelize.Op.ne]: 'BANNED' }
          }
        }
      ],
      group: ['to_user', 'rated.login'],
      having: Rating.sequelize.literal(`SUM(value) > ${currentRating.total_rating} AND COUNT(value) >= 3`),
      raw: true
    });

    const currentPosition = higherRatedUsers.length + 1;

    // Получаем изменение за месяц
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const monthlyRatings = await Rating.findAll({
      where: {
        to_user: currentUser,
        created_at: {
          [Rating.sequelize.Sequelize.Op.gte]: monthAgo
        }
      },
      attributes: [
        [Rating.sequelize.fn('SUM', Rating.sequelize.col('value')), 'month_change']
      ],
      raw: true
    });

    const monthChange = parseInt(monthlyRatings[0]?.month_change) || 0;

    // Получаем историю изменений (последние 10 оценок)
    const ratingHistory = await Rating.findAll({
      where: { to_user: currentUser },
      include: [
        {
          model: User,
          as: 'rater',
          attributes: ['login', 'name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    const history = ratingHistory.map(rating => ({
      id: rating.id,
      change: rating.value,
      reason: `Оценка от ${rating.rater?.name || rating.from_user}`,
      created_at: rating.created_at,
      from_user: rating.from_user
    }));

    // Получаем максимальный рейтинг (исторический)
    const maxRating = Math.max(currentRating.total_rating, 0);

    const responseData = {
      current_rating: currentRating.total_rating,
      current_position: currentPosition,
      rating_change: monthChange,
      max_rating: maxRating,
      total_votes: currentRating.total_votes,
      positive_votes: currentRating.positive_votes,
      negative_votes: currentRating.negative_votes,
      percentage_positive: currentRating.percentage_positive,
      rating_history: history
    };

    logger.logSuccess(req, 200, {
      current_rating: currentRating.total_rating,
      current_position: currentPosition,
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

module.exports = router;