const express = require('express');
const router = express.Router();
const { Clubs, Events, EventParticipants, Chat, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { APILogger } = require('../utils/logger');

// GET /api/analytics/club/:id - Аналитика клуба
router.get('/club/:id', authenticateToken, async (req, res) => {
  const logger = new APILogger('ANALYTICS');
  
  try {
    logger.logRequest(req, 'GET /analytics/club/:id');
    
    const { id } = req.params;
    const { period = '30d' } = req.query;
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Получение аналитики клуба', {
      user_id: userId,
      club_id: id,
      period
    }, req);

    // Проверяем права доступа
    const club = await Clubs.findOne({
      where: {
        id: parseInt(id),
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

    // Рассчитываем период
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Получаем мероприятия за период
    const events = await Events.findAll({
      where: {
        club_id: parseInt(id),
        created_at: {
          [require('sequelize').Op.gte]: startDate
        }
      },
      include: [
        {
          model: EventParticipants,
          as: 'Participants',
          attributes: ['status', 'participation_level', 'compatibility_score', 'feedback_rating']
        }
      ]
    });

    // Получаем чаты за период
    const chats = await Chat.findAll({
      where: {
        club_id: parseInt(id),
        date: {
          [require('sequelize').Op.gte]: startDate
        }
      }
    });

    // Рассчитываем статистику мероприятий
    const eventStats = {
      total: events.length,
      by_type: {},
      by_status: {},
      participants: {
        total: 0,
        confirmed: 0,
        attended: 0,
        cancelled: 0
      },
      ratings: {
        total: 0,
        average: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    };

    events.forEach(event => {
      // Статистика по типам
      const eventType = event.event_type || 'other';
      eventStats.by_type[eventType] = (eventStats.by_type[eventType] || 0) + 1;

      // Статистика по статусам
      eventStats.by_status[event.status] = (eventStats.by_status[event.status] || 0) + 1;

      // Статистика участников
      if (event.Participants) {
        event.Participants.forEach(participant => {
          eventStats.participants.total++;
          
          switch (participant.status) {
            case 'confirmed':
              eventStats.participants.confirmed++;
              break;
            case 'attended':
              eventStats.participants.attended++;
              break;
            case 'cancelled':
              eventStats.participants.cancelled++;
              break;
          }

          // Статистика рейтингов
          if (participant.feedback_rating) {
            eventStats.ratings.total++;
            eventStats.ratings.distribution[participant.feedback_rating]++;
          }
        });
      }
    });

    // Рассчитываем средний рейтинг
    if (eventStats.ratings.total > 0) {
      const totalRating = Object.entries(eventStats.ratings.distribution)
        .reduce((sum, [rating, count]) => sum + (parseInt(rating) * count), 0);
      eventStats.ratings.average = (totalRating / eventStats.ratings.total).toFixed(2);
    }

    // Статистика чатов
    const chatStats = {
      total: chats.length,
      by_type: {},
      by_category: {},
      by_tone: {},
      bot_messages: 0,
      user_messages: 0
    };

    chats.forEach(chat => {
      // Статистика по типам сообщений
      chatStats.by_type[chat.message_type] = (chatStats.by_type[chat.message_type] || 0) + 1;

      // Статистика по категориям
      chatStats.by_category[chat.message_category] = (chatStats.by_category[chat.message_category] || 0) + 1;

      // Статистика по тонам
      chatStats.by_tone[chat.emotional_tone] = (chatStats.by_tone[chat.emotional_tone] || 0) + 1;

      // Статистика бота
      if (chat.is_bot_message) {
        chatStats.bot_messages++;
      } else {
        chatStats.user_messages++;
      }
    });

    // Статистика участников
    const participantStats = {
      total: club.member_count,
      by_level: {},
      average_compatibility: 0,
      new_members: 0
    };

    // Получаем участников мероприятий для анализа
    const allParticipants = await EventParticipants.findAll({
      where: {
        event_id: {
          [require('sequelize').Op.in]: events.map(e => e.id)
        }
      },
      attributes: ['participation_level', 'compatibility_score', 'joined_at']
    });

    allParticipants.forEach(participant => {
      // Статистика по уровням участия
      participantStats.by_level[participant.participation_level] = 
        (participantStats.by_level[participant.participation_level] || 0) + 1;

      // Новые участники (за последний месяц)
      if (participant.joined_at >= startDate) {
        participantStats.new_members++;
      }
    });

    // Рассчитываем среднюю совместимость
    const compatibilityScores = allParticipants
      .filter(p => p.compatibility_score > 0)
      .map(p => p.compatibility_score);
    
    if (compatibilityScores.length > 0) {
      participantStats.average_compatibility = 
        (compatibilityScores.reduce((sum, score) => sum + score, 0) / compatibilityScores.length).toFixed(2);
    }

    // Общая статистика
    const overallStats = {
      period,
      start_date: startDate,
      end_date: now,
      club_rating: club.rating,
      club_member_count: club.member_count,
      club_is_premium: club.is_premium
    };

    const responseData = {
      club: {
        id: club.id,
        name: club.name,
        category: club.category
      },
      overall_stats: overallStats,
      event_stats: eventStats,
      chat_stats: chatStats,
      participant_stats: participantStats
    };

    logger.logSuccess(req, 200, {
      club_id: id,
      events_count: events.length,
      chats_count: chats.length
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении аналитики клуба'
    });
  }
});

// GET /api/analytics/events/:eventId - Аналитика конкретного мероприятия
router.get('/events/:eventId', authenticateToken, async (req, res) => {
  const logger = new APILogger('ANALYTICS');
  
  try {
    logger.logRequest(req, 'GET /analytics/events/:eventId');
    
    const { eventId } = req.params;
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Получение аналитики мероприятия', {
      user_id: userId,
      event_id: eventId
    }, req);

    // Получаем мероприятие
    const event = await Events.findOne({
      where: { id: parseInt(eventId) },
      include: [
        {
          model: Clubs,
          as: 'Club',
          attributes: ['id', 'name', 'owner']
        },
        {
          model: EventParticipants,
          as: 'Participants',
          include: [
            {
              model: User,
              as: 'User',
              attributes: ['login', 'name', 'ava', 'city', 'age']
            }
          ]
        }
      ]
    });

    if (!event) {
      return res.status(404).json({
        error: 'event_not_found',
        message: 'Мероприятие не найдено'
      });
    }

    // Проверяем права доступа
    if (event.Club.owner !== userId) {
      return res.status(403).json({
        error: 'access_denied',
        message: 'Нет доступа к аналитике этого мероприятия'
      });
    }

    // Статистика участников
    const participantStats = await EventParticipants.getEventStats(parseInt(eventId));

    // Статистика по уровням участия
    const levelStats = {};
    const statusStats = {};
    
    if (event.Participants) {
      event.Participants.forEach(participant => {
        // По уровням
        levelStats[participant.participation_level] = 
          (levelStats[participant.participation_level] || 0) + 1;
        
        // По статусам
        statusStats[participant.status] = 
          (statusStats[participant.status] || 0) + 1;
      });
    }

    // Демографическая статистика
    const demographicStats = {
      age_groups: { '18-25': 0, '26-35': 0, '36-45': 0, '46+': 0 },
      cities: {},
      gender_distribution: { male: 0, female: 0 }
    };

    if (event.Participants) {
      event.Participants.forEach(participant => {
        if (participant.User) {
          // Возрастные группы
          if (participant.User.age) {
            if (participant.User.age <= 25) demographicStats.age_groups['18-25']++;
            else if (participant.User.age <= 35) demographicStats.age_groups['26-35']++;
            else if (participant.User.age <= 45) demographicStats.age_groups['36-45']++;
            else demographicStats.age_groups['46+']++;
          }

          // Города
          if (participant.User.city) {
            demographicStats.cities[participant.User.city] = 
              (demographicStats.cities[participant.User.city] || 0) + 1;
          }
        }
      });
    }

    // Статистика совместимости
    const compatibilityStats = {
      average_score: 0,
      distribution: { '0-1': 0, '1-2': 0, '2-3': 0, '3-4': 0, '4-5': 0 },
      top_matches: []
    };

    const compatibilityScores = event.Participants
      ?.filter(p => p.compatibility_score > 0)
      .map(p => p.compatibility_score) || [];

    if (compatibilityScores.length > 0) {
      compatibilityStats.average_score = 
        (compatibilityScores.reduce((sum, score) => sum + score, 0) / compatibilityScores.length).toFixed(2);

      // Распределение по диапазонам
      compatibilityScores.forEach(score => {
        if (score <= 1) compatibilityStats.distribution['0-1']++;
        else if (score <= 2) compatibilityStats.distribution['1-2']++;
        else if (score <= 3) compatibilityStats.distribution['2-3']++;
        else if (score <= 4) compatibilityStats.distribution['3-4']++;
        else compatibilityStats.distribution['4-5']++;
      });

      // Топ совместимости
      compatibilityStats.top_matches = event.Participants
        ?.filter(p => p.compatibility_score >= 4)
        .sort((a, b) => b.compatibility_score - a.compatibility_score)
        .slice(0, 5)
        .map(p => ({
          user: p.User ? {
            login: p.User.login,
            name: p.User.name,
            avatar: p.User.ava
          } : null,
          score: p.compatibility_score,
          level: p.participation_level
        })) || [];
    }

    const responseData = {
      event: {
        id: event.id,
        title: event.title,
        event_date: event.event_date,
        location: event.location,
        type: event.type,
        event_type: event.event_type,
        is_premium: event.is_premium
      },
      club: {
        id: event.Club.id,
        name: event.Club.name
      },
      participant_stats: {
        total: event.Participants?.length || 0,
        by_level: levelStats,
        by_status: statusStats,
        detailed: participantStats
      },
      demographic_stats: demographicStats,
      compatibility_stats: compatibilityStats
    };

    logger.logSuccess(req, 200, {
      event_id: eventId,
      participants_count: event.Participants?.length || 0
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении аналитики мероприятия'
    });
  }
});

// GET /api/analytics/performance - Общая производительность клубов пользователя
router.get('/performance', authenticateToken, async (req, res) => {
  const logger = new APILogger('ANALYTICS');
  
  try {
    logger.logRequest(req, 'GET /analytics/performance');
    
    const { period = '30d' } = req.query;
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Получение общей производительности', {
      user_id: userId,
      period
    }, req);

    // Рассчитываем период
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Получаем клубы пользователя
    const userClubs = await Clubs.findAll({
      where: {
        owner: userId,
        is_active: true
      },
      include: [
        {
          model: Events,
          as: 'Events',
          where: {
            created_at: {
              [require('sequelize').Op.gte]: startDate
            }
          },
          required: false
        }
      ]
    });

    // Анализируем производительность каждого клуба
    const clubPerformance = await Promise.all(
      userClubs.map(async (club) => {
        // Статистика мероприятий
        const eventsCount = club.Events?.length || 0;
        const totalParticipants = await EventParticipants.count({
          where: {
            event_id: {
              [require('sequelize').Op.in]: club.Events?.map(e => e.id) || []
            }
          }
        });

        // Статистика чатов
        const chatCount = await Chat.count({
          where: {
            club_id: club.id,
            date: {
              [require('sequelize').Op.gte]: startDate
            }
          }
        });

        // Рассчитываем метрики
        const avgParticipantsPerEvent = eventsCount > 0 ? (totalParticipants / eventsCount).toFixed(2) : 0;
        const engagementRate = club.member_count > 0 ? ((totalParticipants / club.member_count) * 100).toFixed(2) : 0;

        return {
          club_id: club.id,
          club_name: club.name,
          category: club.category,
          rating: club.rating,
          member_count: club.member_count,
          is_premium: club.is_premium,
          metrics: {
            events_count: eventsCount,
            total_participants: totalParticipants,
            avg_participants_per_event: avgParticipantsPerEvent,
            chat_count: chatCount,
            engagement_rate: engagementRate
          }
        };
      })
    );

    // Общая статистика
    const overallPerformance = {
      total_clubs: userClubs.length,
      total_events: clubPerformance.reduce((sum, club) => sum + club.metrics.events_count, 0),
      total_participants: clubPerformance.reduce((sum, club) => sum + club.metrics.total_participants, 0),
      total_chats: clubPerformance.reduce((sum, club) => sum + club.metrics.chat_count, 0),
      average_rating: userClubs.length > 0 ? 
        (userClubs.reduce((sum, club) => sum + club.rating, 0) / userClubs.length).toFixed(2) : 0,
      premium_clubs: userClubs.filter(club => club.is_premium).length
    };

    const responseData = {
      period,
      start_date: startDate,
      end_date: now,
      overall_performance: overallPerformance,
      club_performance: clubPerformance
    };

    logger.logSuccess(req, 200, {
      clubs_count: userClubs.length,
      total_events: overallPerformance.total_events
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении производительности'
    });
  }
});

module.exports = router;
