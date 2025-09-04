const express = require('express');
const { sequelize } = require('../config/database');
const { 
  Clubs, 
  ClubEvents, 
  EventParticipants, 
  Ads, 
  User,
  ClubApplications 
} = require('../models');
const { authenticateClub } = require('../middleware/clubAuth');
const router = express.Router();

// Общая аналитика клуба
router.get('/overview', authenticateClub, async (req, res) => {
  try {
    const clubId = req.club.id;
    const { period = 'week' } = req.query;

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

    const totalParticipants = await EventParticipants.count({
      include: [{
        model: ClubEvents,
        as: 'event',
        where: { club_id: clubId }
      }]
    });

    const confirmedParticipants = await EventParticipants.count({
      where: { status: 'confirmed' },
      include: [{
        model: ClubEvents,
        as: 'event',
        where: { club_id: clubId }
      }]
    });

    const totalAds = await Ads.count({
      where: {
        club_id: clubId,
        is_club_ad: true
      }
    });

    const approvedAds = await Ads.count({
      where: {
        club_id: clubId,
        is_club_ad: true,
        status: 'approved'
      }
    });

    const totalViews = await Ads.sum('views_count', {
      where: {
        club_id: clubId,
        is_club_ad: true
      }
    });

    // Статистика за период
    const eventsInPeriod = await ClubEvents.count({
      where: {
        club_id: clubId,
        created_at: {
          [sequelize.Sequelize.Op.gte]: startDate
        }
      }
    });

    const participantsInPeriod = await EventParticipants.count({
      include: [{
        model: ClubEvents,
        as: 'event',
        where: {
          club_id: clubId,
          created_at: {
            [sequelize.Sequelize.Op.gte]: startDate
          }
        }
      }]
    });

    const adsInPeriod = await Ads.count({
      where: {
        club_id: clubId,
        is_club_ad: true,
        created_at: {
          [sequelize.Sequelize.Op.gte]: startDate
        }
      }
    });

    const analytics = {
      overview: {
        total_events: totalEvents,
        upcoming_events: upcomingEvents,
        total_participants: totalParticipants,
        confirmed_participants: confirmedParticipants,
        total_ads: totalAds,
        approved_ads: approvedAds,
        total_views: totalViews || 0
      },
      period_stats: {
        period: period,
        events_created: eventsInPeriod,
        participants_joined: participantsInPeriod,
        ads_created: adsInPeriod
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
      include: [
        {
          model: EventParticipants,
          as: 'participants',
          attributes: []
        }
      ],
      attributes: [
        'id',
        'title',
        'date',
        'event_type',
        'max_participants',
        'current_participants',
        [sequelize.fn('COUNT', sequelize.col('participants.id')), 'participant_count']
      ],
      group: ['ClubEvents.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('participants.id')), 'DESC']],
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
        [sequelize.fn('DATE_FORMAT', sequelize.col('date'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'events_count'],
        [sequelize.fn('SUM', sequelize.col('current_participants')), 'total_participants']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('date'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('date'), '%Y-%m'), 'DESC']],
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

    // Статистика по статусам участников
    const participantStatusStats = await EventParticipants.findAll({
      include: [{
        model: ClubEvents,
        as: 'event',
        where: { club_id: clubId }
      }],
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('EventParticipants.id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Топ активных участников
    const topParticipants = await EventParticipants.findAll({
      include: [
        {
          model: ClubEvents,
          as: 'event',
          where: { club_id: clubId }
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'login', 'name', 'ava', 'age', 'city']
        }
      ],
      attributes: [
        'user_id',
        [sequelize.fn('COUNT', sequelize.col('EventParticipants.id')), 'events_attended'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN EventParticipants.status = "confirmed" THEN 1 END')), 'confirmed_events']
      ],
      group: ['user_id'],
      order: [[sequelize.fn('COUNT', sequelize.col('EventParticipants.id')), 'DESC']],
      limit: 10
    });

    // Демографическая статистика
    const demographicStats = await EventParticipants.findAll({
      include: [
        {
          model: ClubEvents,
          as: 'event',
          where: { club_id: clubId }
        },
        {
          model: User,
          as: 'user',
          attributes: ['age', 'city']
        }
      ],
      attributes: [
        [sequelize.fn('AVG', sequelize.col('user.age')), 'avg_age'],
        [sequelize.fn('MIN', sequelize.col('user.age')), 'min_age'],
        [sequelize.fn('MAX', sequelize.col('user.age')), 'max_age']
      ],
      raw: true
    });

    // Топ городов участников
    const topCities = await EventParticipants.findAll({
      include: [
        {
          model: ClubEvents,
          as: 'event',
          where: { club_id: clubId }
        },
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

// Аналитика объявлений
router.get('/ads', authenticateClub, async (req, res) => {
  try {
    const clubId = req.club.id;

    // Статистика по статусам объявлений
    const adStatusStats = await Ads.findAll({
      where: {
        club_id: clubId,
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

    // Топ объявлений по просмотрам
    const topAds = await Ads.findAll({
      where: {
        club_id: clubId,
        is_club_ad: true
      },
      attributes: [
        'id',
        'title',
        'type',
        'views_count',
        'status',
        'created_at'
      ],
      order: [['views_count', 'DESC']],
      limit: 10
    });

    // Статистика по типам объявлений
    const adTypeStats = await Ads.findAll({
      where: {
        club_id: clubId,
        is_club_ad: true
      },
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('views_count')), 'avg_views']
      ],
      group: ['type'],
      raw: true
    });

    // Статистика по месяцам
    const monthlyAdStats = await Ads.findAll({
      where: {
        club_id: clubId,
        is_club_ad: true
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'ads_count'],
        [sequelize.fn('SUM', sequelize.col('views_count')), 'total_views']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'DESC']],
      limit: 12,
      raw: true
    });

    res.json({
      status_stats: adStatusStats,
      top_ads: topAds,
      type_stats: adTypeStats,
      monthly_stats: monthlyAdStats
    });
  } catch (error) {
    console.error('Get ads analytics error:', error);
    res.status(500).json({ error: 'Ошибка при получении аналитики объявлений' });
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
        [sequelize.fn('DATE_FORMAT', sequelize.col('date'), '%Y-%m'), 'month'],
        [sequelize.fn('SUM', sequelize.col('price')), 'revenue']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('date'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('date'), '%Y-%m'), 'DESC']],
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
