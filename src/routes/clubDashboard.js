const express = require('express');
const router = express.Router();
const { authenticateClub, requireVerifiedClub, requireClubBalance, logClubAction } = require('../middleware/clubAuth');
const { Clubs, Events, User, EventParticipants } = require('../models');
const { generateId } = require('../utils/helpers');
const { APILogger } = require('../utils/logger');

// Все роуты требуют аутентификации клуба
router.use(authenticateClub);

/**
 * Дашборд клуба
 * GET /api/club/dashboard
 */
router.get('/dashboard', logClubAction('Dashboard Access'), async (req, res) => {
  const logger = new APILogger('CLUB_DASHBOARD');
  
  try {
    const club = req.club;
    
    logger.logRequest(req, 'GET /club/dashboard');
    
    // Отладочная информация
    console.log('Club ID:', club.id);
    console.log('Events table structure:', Object.keys(Events.rawAttributes));
    
    // Статистика клуба
    const [
      totalEvents,
      activeEvents,
      totalParticipants,
      totalRevenue
    ] = await Promise.all([
      Events.count({ where: { club_id: club.id } }),
      Events.count({ 
        where: { 
          club_id: club.id, 
          status: 'planned' 
        } 
      }),
      EventParticipants.count({
        where: { club_id: club.id }
      }),
      EventParticipants.sum('amount_paid', {
        where: { 
          club_id: club.id,
          payment_status: 'paid'
        }
      })
    ]);
    
    const stats = {
      total_events: totalEvents,
      active_events: activeEvents,
      total_participants: totalParticipants,
      total_revenue: totalRevenue || 0,
      balance: club.balance,
      current_members: club.current_members,
      max_members: club.max_members,
      is_verified: club.is_verified
    };
    
    // Последние мероприятия
    const recentEvents = await Events.findAll({
      where: { club_id: club.id },
      order: [['created_at', 'DESC']],
      limit: 5
    });
    
    // Последние участники
    const recentParticipants = await EventParticipants.findAll({
      where: { club_id: club.id },
      include: [
        {
          model: Events,
          as: 'Event',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'User',
          attributes: ['login', 'ava']
        }
      ],
      order: [['registration_date', 'DESC']],
      limit: 5
    });
    
    const responseData = {
      stats,
      recent_events: recentEvents.map(event => ({
        id: event.id,
        title: event.title,
        event_date: event.event_date,
        status: event.status,
        max_participants: event.max_participants
      })),
      recent_participants: recentParticipants.map(participant => ({
        id: participant.id,
        event: participant.Event,
        user: participant.User,
        registration_date: participant.registration_date,
        payment_status: participant.payment_status,
        status: participant.status
      }))
    };
    
    logger.logSuccess(req, 200, { club_id: club.id });
    res.json(responseData);
    
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении данных дашборда' 
    });
  }
});

/**
 * Создание мероприятия
 * POST /api/club/dashboard/events
 */
router.post('/events', 
  requireVerifiedClub, 
  requireClubBalance(100), 
  logClubAction('Create Event'),
  async (req, res) => {
    const logger = new APILogger('CLUB_DASHBOARD');
    
    try {
      const club = req.club;
      const { 
        title, 
        description, 
        event_date, 
        price, 
        max_participants,
        location,
        city,
        requirements,
        dress_code,
        contact_info,
        tags
      } = req.body;
      
      logger.logRequest(req, 'POST /club/dashboard/events');
      
      // Валидация обязательных полей
      if (!title || !description || !event_date) {
        return res.status(400).json({
          error: 'missing_required_fields',
          message: 'Заполните все обязательные поля: название, описание, дата'
        });
      }
      
      // Проверяем дату (должна быть в будущем)
      const eventDate = new Date(event_date);
      if (eventDate <= new Date()) {
        return res.status(400).json({
          error: 'invalid_date',
          message: 'Дата мероприятия должна быть в будущем'
        });
      }
      
      logger.logBusinessLogic(1, 'Создание мероприятия', {
        club_id: club.id,
        title,
        event_date: eventDate,
        price: price || 0
      }, req);
      
      // Создаем мероприятие
      const event = await Events.create({
        title: title.trim(),
        description: description.trim(),
        club_id: club.id,
        event_date: eventDate,
        price: parseFloat(price) || 0,
        max_participants: max_participants ? parseInt(max_participants) : null,
        location: location || `${club.city}, ${club.country}`,
        city: city || club.city,
        requirements: requirements?.trim(),
        dress_code: dress_code?.trim(),
        contact_info: contact_info?.trim(),
        tags: tags?.trim(),
        type: 'club_event',
        status: 'planned',
        registration_required: true,
        approved: true, // Клубы создают уже одобренные мероприятия
        approved_by: 'club_system'
      });
      
      // Списываем средства с баланса клуба (стоимость создания мероприятия)
      const eventCreationCost = 100;
      await club.updateBalance(eventCreationCost, 'subtract');
      
      logger.logResult('Создание мероприятия', true, {
        event_id: event.id,
        club_id: club.id,
        cost: eventCreationCost
      }, req);
      
      const responseData = {
        success: true,
        message: 'Мероприятие успешно создано',
        event: {
          id: event.id,
          title: event.title,
          event_date: event.event_date,
          price: event.price,
          status: event.status,
          max_participants: event.max_participants
        },
        club_balance: club.balance
      };
      
      logger.logSuccess(req, 201, responseData);
      res.status(201).json(responseData);
      
    } catch (error) {
      logger.logError(req, error);
      res.status(500).json({ 
        error: 'server_error',
        message: 'Ошибка при создании мероприятия' 
      });
    }
  }
);

/**
 * Управление мероприятиями клуба
 * GET /api/club/dashboard/events
 */
router.get('/events', logClubAction('Get Events'), async (req, res) => {
  const logger = new APILogger('CLUB_DASHBOARD');
  
  try {
    const club = req.club;
    const { status, upcoming, limit = 20, offset = 0 } = req.query;
    
    logger.logRequest(req, 'GET /club/dashboard/events');
    
    const events = await Events.getClubEvents(club.id, {
      status,
      upcoming: upcoming === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Получаем статистику по каждому мероприятию
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const stats = await EventParticipants.getClubEventStats(club.id, event.id);
        return {
          ...event.toJSON(),
          stats
        };
      })
    );
    
    const responseData = {
      events: eventsWithStats,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: events.length
      }
    };
    
    logger.logSuccess(req, 200, { 
      club_id: club.id,
      events_count: events.length 
    });
    res.json(responseData);
    
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении мероприятий' 
    });
  }
});

/**
 * Получение конкретного мероприятия клуба
 * GET /api/club/dashboard/events/:id
 */
router.get('/events/:id', logClubAction('Get Event Details'), async (req, res) => {
  const logger = new APILogger('CLUB_DASHBOARD');
  
  try {
    const club = req.club;
    const { id } = req.params;
    
    logger.logRequest(req, `GET /club/dashboard/events/${id}`);
    
    const event = await Events.findOne({
      where: { 
        id: parseInt(id),
        club_id: club.id 
      }
    });
    
    if (!event) {
      return res.status(404).json({
        error: 'event_not_found',
        message: 'Мероприятие не найдено'
      });
    }
    
    // Получаем участников
    const participants = await EventParticipants.getEventParticipants(parseInt(id));
    
    // Получаем статистику
    const stats = await EventParticipants.getClubEventStats(club.id, parseInt(id));
    
    const responseData = {
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        event_date: event.event_date,
        location: event.location,
        city: event.city,
        price: event.price,
        max_participants: event.max_participants,
        status: event.status,
        requirements: event.requirements,
        dress_code: event.dress_code,
        contact_info: event.contact_info,
        created_at: event.created_at
      },
      participants,
      stats
    };
    
    logger.logSuccess(req, 200, { 
      club_id: club.id,
      event_id: event.id 
    });
    res.json(responseData);
    
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении мероприятия' 
    });
  }
});

/**
 * Редактирование мероприятия
 * PUT /api/club/dashboard/events/:id
 */
router.put('/events/:id', 
  requireVerifiedClub, 
  logClubAction('Edit Event'),
  async (req, res) => {
    const logger = new APILogger('CLUB_DASHBOARD');
    
    try {
      const club = req.club;
      const { id } = req.params;
      const updateData = req.body;
      
      logger.logRequest(req, `PUT /club/dashboard/events/${id}`);
      
      const event = await Events.findOne({
        where: { 
          id: parseInt(id),
          club_id: club.id 
        }
      });
      
      if (!event) {
        return res.status(404).json({
          error: 'event_not_found',
          message: 'Мероприятие не найдено'
        });
      }
      
      // Проверяем, можно ли редактировать
      if (event.status !== 'planned') {
        return res.status(403).json({
          error: 'cannot_edit',
          message: 'Можно редактировать только запланированные мероприятия'
        });
      }
      
      // Обновляем мероприятие
      await event.update(updateData);
      
      logger.logResult('Редактирование мероприятия', true, {
        event_id: event.id,
        club_id: club.id
      }, req);
      
      const responseData = {
        success: true,
        message: 'Мероприятие обновлено',
        event: {
          id: event.id,
          title: event.title,
          event_date: event.event_date,
          status: event.status
        }
      };
      
      logger.logSuccess(req, 200, responseData);
      res.json(responseData);
      
    } catch (error) {
      logger.logError(req, error);
      res.status(500).json({ 
        error: 'server_error',
        message: 'Ошибка при обновлении мероприятия' 
      });
    }
  }
);

/**
 * Отмена мероприятия
 * POST /api/club/dashboard/events/:id/cancel
 */
router.post('/events/:id/cancel', 
  requireVerifiedClub, 
  logClubAction('Cancel Event'),
  async (req, res) => {
    const logger = new APILogger('CLUB_DASHBOARD');
    
    try {
      const club = req.club;
      const { id } = req.params;
      const { reason } = req.body;
      
      logger.logRequest(req, `POST /club/dashboard/events/${id}/cancel`);
      
      const event = await Events.findOne({
        where: { 
          id: parseInt(id),
          club_id: club.id 
        }
      });
      
      if (!event) {
        return res.status(404).json({
          error: 'event_not_found',
          message: 'Мероприятие не найдено'
        });
      }
      
      // Проверяем, можно ли отменить
      if (event.status !== 'planned') {
        return res.status(403).json({
          error: 'cannot_cancel',
          message: 'Можно отменить только запланированные мероприятия'
        });
      }
      
      // Отменяем мероприятие
      await event.update({ 
        status: 'cancelled',
        requirements: reason ? `ОТМЕНЕНО: ${reason}` : 'ОТМЕНЕНО'
      });
      
      // Возвращаем средства участникам если мероприятие было платным
      if (event.price > 0) {
        const participants = await EventParticipants.findAll({
          where: { 
            event_id: parseInt(id),
            payment_status: 'paid'
          }
        });
        
        for (const participant of participants) {
          // Возвращаем средства пользователю
          const user = await User.findOne({ where: { login: participant.user_id } });
          if (user) {
            await user.update({
              balance: parseFloat(user.balance) + parseFloat(event.price)
            });
          }
          
          // Обновляем статус участника
          await participant.update({ 
            status: 'cancelled',
            payment_status: 'cancelled'
          });
        }
      }
      
      logger.logResult('Отмена мероприятия', true, {
        event_id: event.id,
        club_id: club.id,
        reason
      }, req);
      
      const responseData = {
        success: true,
        message: 'Мероприятие отменено',
        event: {
          id: event.id,
          title: event.title,
          status: event.status
        }
      };
      
      logger.logSuccess(req, 200, responseData);
      res.json(responseData);
      
    } catch (error) {
      logger.logError(req, error);
      res.status(500).json({ 
        error: 'server_error',
        message: 'Ошибка при отмене мероприятия' 
      });
    }
  }
);

/**
 * Управление участниками мероприятия
 * GET /api/club/dashboard/events/:id/participants
 */
router.get('/events/:id/participants', logClubAction('Get Event Participants'), async (req, res) => {
  const logger = new APILogger('CLUB_DASHBOARD');
  
  try {
    const club = req.club;
    const { id } = req.params;
    const { status, payment_status } = req.query;
    
    logger.logRequest(req, `GET /club/dashboard/events/${id}/participants`);
    
    const participants = await EventParticipants.getEventParticipants(parseInt(id), {
      status,
      payment_status
    });
    
    const responseData = {
      participants: participants.map(participant => ({
        id: participant.id,
        user: participant.User,
        registration_date: participant.registration_date,
        payment_status: participant.payment_status,
        amount_paid: participant.amount_paid,
        payment_date: participant.payment_date,
        status: participant.status,
        notes: participant.notes
      }))
    };
    
    logger.logSuccess(req, 200, { 
      club_id: club.id,
      event_id: id,
      participants_count: participants.length 
    });
    res.json(responseData);
    
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении участников' 
    });
  }
});

/**
 * Обновление статуса участника
 * PUT /api/club/dashboard/events/:id/participants/:participantId
 */
router.put('/events/:id/participants/:participantId', 
  requireVerifiedClub, 
  logClubAction('Update Participant Status'),
  async (req, res) => {
    const logger = new APILogger('CLUB_DASHBOARD');
    
    try {
      const club = req.club;
      const { id, participantId } = req.params;
      const { status, notes } = req.body;
      
      logger.logRequest(req, `PUT /club/dashboard/events/${id}/participants/${participantId}`);
      
      const participant = await EventParticipants.findOne({
        where: { 
          id: parseInt(participantId),
          event_id: parseInt(id),
          club_id: club.id
        }
      });
      
      if (!participant) {
        return res.status(404).json({
          error: 'participant_not_found',
          message: 'Участник не найден'
        });
      }
      
      // Обновляем статус
      await participant.update({ 
        status,
        notes: notes || participant.notes
      });
      
      logger.logResult('Обновление статуса участника', true, {
        participant_id: participantId,
        event_id: id,
        club_id: club.id,
        new_status: status
      }, req);
      
      const responseData = {
        success: true,
        message: 'Статус участника обновлен',
        participant: {
          id: participant.id,
          status: participant.status,
          notes: participant.notes
        }
      };
      
      logger.logSuccess(req, 200, responseData);
      res.json(responseData);
      
    } catch (error) {
      logger.logError(req, error);
      res.status(500).json({ 
        error: 'server_error',
        message: 'Ошибка при обновлении статуса участника' 
      });
    }
  }
);

module.exports = router;
