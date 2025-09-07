const express = require('express');
const { sequelize } = require('../config/database');
const { 
  Clubs, 
  ClubEvents, 
  EventParticipants, 
  User
} = require('../models');
const { authenticateClub } = require('../middleware/clubAuth');
const router = express.Router();

// Общая аналитика клуба
router.get('/overview', authenticateClub, async (req, res) => {
  try {
    const clubId = req.club.id;
    const { period = 'week' } = req.query;
    console.log('Analytics overview - clubId:', clubId, 'period:', period);

    // Определяем период для анализа
    let startDate;
    const now = new Date();
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Общая статистика
    const totalEvents = await ClubEvents.count({
      where: { club_id: clubId }
    });

    const upcomingEvents = await ClubEvents.count({
      where: {
        club_id: clubId,
        date: {
          [sequelize.Sequelize.Op.gte]: now
        }
      }
    });

    // Получаем ID мероприятий клуба для подсчета участников
    const clubEventIds = await ClubEvents.findAll({
      where: { club_id: clubId },
      attributes: ['id']
    });
    
    const eventIds = clubEventIds.map(event => event.id);
    
    const totalParticipants = eventIds.length > 0 ? await EventParticipants.count({
      where: {
        event_id: {
          [sequelize.Sequelize.Op.in]: eventIds
        }
      }
    }) : 0;

    const confirmedParticipants = eventIds.length > 0 ? await EventParticipants.count({
      where: {
        event_id: {
          [sequelize.Sequelize.Op.in]: eventIds
        },
        status: 'confirmed'
      }
    }) : 0;


    // Статистика за период
    const eventsInPeriod = await ClubEvents.count({
      where: {
        club_id: clubId,
        created_at: {
          [sequelize.Sequelize.Op.gte]: startDate
        }
      }
    });

    // Получаем ID мероприятий за период
    const periodEventIds = await ClubEvents.findAll({
      where: {
        club_id: clubId,
        created_at: {
          [sequelize.Sequelize.Op.gte]: startDate
        }
      },
      attributes: ['id']
    });
    
    const periodEventIdsList = periodEventIds.map(event => event.id);
    
    const participantsInPeriod = periodEventIdsList.length > 0 ? await EventParticipants.count({
      where: {
        event_id: {
          [sequelize.Sequelize.Op.in]: periodEventIdsList
        }
      }
    }) : 0;


    const analytics = {
      overview: {
        total_events: totalEvents,
        upcoming_events: upcomingEvents,
        total_participants: totalParticipants,
        confirmed_participants: confirmedParticipants,
      },
      period_stats: {
        period: period,
        events_created: eventsInPeriod,
        participants_joined: participantsInPeriod,
      }
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Get club analytics error:', error);
    res.status(500).json({ error: 'Ошибка при получении аналитики' });
  }
});

// Аналитика мероприятий
router.get('/events', authenticateClub, async (req, res) => {
  try {
    const clubId = req.club.id;
    const { limit = 10 } = req.query;

    // Топ мероприятий по участникам
    const topEvents = await ClubEvents.findAll({
      where: { club_id: clubId },
      attributes: [
        'id',
        'title',
        'date',
        'event_type',
        'max_participants',
        'current_participants'
      ],
      order: [['current_participants', 'DESC']],
      limit: parseInt(limit)
    });

    // Статистика по типам мероприятий
    const eventTypeStats = await ClubEvents.findAll({
      where: { club_id: clubId },
      attributes: [
        'event_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('current_participants')), 'avg_participants']
      ],
      group: ['event_type'],
      raw: true
    });

    // Статистика по месяцам
    const monthlyStats = await ClubEvents.findAll({
      where: { club_id: clubId },
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('date')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'events_count'],
        [sequelize.fn('SUM', sequelize.col('current_participants')), 'total_participants']
      ],
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('date'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('date')), 'DESC']],
      limit: 12,
      raw: true
    });

    res.json({
      top_events: topEvents,
      event_type_stats: eventTypeStats,
      monthly_stats: monthlyStats
    });
  } catch (error) {
    console.error('Get events analytics error:', error);
    res.status(500).json({ error: 'Ошибка при получении аналитики мероприятий' });
  }
});

// Аналитика участников
router.get('/participants', authenticateClub, async (req, res) => {
  try {
    const clubId = req.club.id;
    console.log('Analytics participants - clubId:', clubId);

    // Получаем ID мероприятий клуба
    const clubEvents = await ClubEvents.findAll({
      where: { club_id: clubId },
      attributes: ['id']
    });
    
    console.log('Club events found:', clubEvents.length);
    const eventIds = clubEvents.map(event => event.id);
    console.log('Event IDs:', eventIds);
    
    if (eventIds.length === 0) {
      return res.json({
        status_stats: [],
        top_participants: [],
        demographic_stats: {},
        top_cities: []
      });
    }

    // Статистика по статусам участников
    const participantStatusStats = await EventParticipants.findAll({
      where: {
        event_id: {
          [sequelize.Sequelize.Op.in]: eventIds
        }
      },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Топ активных участников
    const topParticipants = await EventParticipants.findAll({
      where: {
        event_id: {
          [sequelize.Sequelize.Op.in]: eventIds
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'login', 'ava', 'city']
        }
      ],
      attributes: [
        'user_id',
        [sequelize.fn('COUNT', sequelize.col('EventParticipants.id')), 'events_attended']
      ],
      group: ['user_id', 'user.id', 'user.login', 'user.ava', 'user.city'],
      order: [[sequelize.fn('COUNT', sequelize.col('EventParticipants.id')), 'DESC']],
      limit: 10
    });

    // Демографическая статистика
    const demographicStats = await EventParticipants.findAll({
      where: {
        event_id: {
          [sequelize.Sequelize.Op.in]: eventIds
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: []
        }
      ],
      attributes: [
        [sequelize.fn('ROUND', sequelize.fn('AVG', sequelize.literal(`
          CASE 
            WHEN "user"."date" LIKE '%_%' THEN 
              EXTRACT(YEAR FROM NOW()) - EXTRACT(YEAR FROM SPLIT_PART("user"."date", '_', 1)::DATE)
            ELSE 
              EXTRACT(YEAR FROM NOW()) - EXTRACT(YEAR FROM "user"."date"::DATE)
          END
        `))), 'avg_age'],
        [sequelize.fn('MIN', sequelize.literal(`
          CASE 
            WHEN "user"."date" LIKE '%_%' THEN 
              EXTRACT(YEAR FROM NOW()) - EXTRACT(YEAR FROM SPLIT_PART("user"."date", '_', 1)::DATE)
            ELSE 
              EXTRACT(YEAR FROM NOW()) - EXTRACT(YEAR FROM "user"."date"::DATE)
          END
        `)), 'min_age'],
        [sequelize.fn('MAX', sequelize.literal(`
          CASE 
            WHEN "user"."date" LIKE '%_%' THEN 
              EXTRACT(YEAR FROM NOW()) - EXTRACT(YEAR FROM SPLIT_PART("user"."date", '_', 1)::DATE)
            ELSE 
              EXTRACT(YEAR FROM NOW()) - EXTRACT(YEAR FROM "user"."date"::DATE)
          END
        `)), 'max_age']
      ],
      raw: true
    });

    // Топ городов участников
    const topCities = await EventParticipants.findAll({
      where: {
        event_id: {
          [sequelize.Sequelize.Op.in]: eventIds
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['city']
        }
      ],
      attributes: [
        'user.city',
        [sequelize.fn('COUNT', sequelize.col('EventParticipants.id')), 'participants_count']
      ],
      group: ['user.city'],
      order: [[sequelize.fn('COUNT', sequelize.col('EventParticipants.id')), 'DESC']],
      limit: 10,
      raw: true
    });

    res.json({
      status_stats: participantStatusStats,
      top_participants: topParticipants,
      demographic_stats: demographicStats[0] || {},
      top_cities: topCities
    });
  } catch (error) {
    console.error('Get participants analytics error:', error);
    res.status(500).json({ error: 'Ошибка при получении аналитики участников' });
  }
});


// Финансовая аналитика
router.get('/financial', authenticateClub, async (req, res) => {
  try {
    const clubId = req.club.id;

    // Общая выручка от мероприятий
    const totalRevenue = await ClubEvents.sum('price', {
      where: { club_id: clubId }
    });

    // Выручка по месяцам
    const monthlyRevenue = await ClubEvents.findAll({
      where: { club_id: clubId },
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('date')), 'month'],
        [sequelize.fn('SUM', sequelize.col('price')), 'revenue']
      ],
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('date'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('date')), 'DESC']],
      limit: 12,
      raw: true
    });

    // Средняя стоимость мероприятий
    const avgEventPrice = await ClubEvents.findOne({
      where: { club_id: clubId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('price')), 'avg_price'],
        [sequelize.fn('MIN', sequelize.col('price')), 'min_price'],
        [sequelize.fn('MAX', sequelize.col('price')), 'max_price']
      ],
      raw: true
    });

    // Статистика по типам мероприятий
    const eventTypeRevenue = await ClubEvents.findAll({
      where: { club_id: clubId },
      attributes: [
        'event_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'events_count'],
        [sequelize.fn('SUM', sequelize.col('price')), 'total_revenue'],
        [sequelize.fn('AVG', sequelize.col('price')), 'avg_price']
      ],
      group: ['event_type'],
      raw: true
    });

    res.json({
      total_revenue: totalRevenue || 0,
      monthly_revenue: monthlyRevenue,
      price_stats: avgEventPrice,
      event_type_revenue: eventTypeRevenue
    });
  } catch (error) {
    console.error('Get financial analytics error:', error);
    res.status(500).json({ error: 'Ошибка при получении финансовой аналитики' });
  }
});

module.exports = router;
