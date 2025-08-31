const express = require('express');
const router = express.Router();
const { Events, Clubs, User, EventParticipants } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');
const { APILogger } = require('../utils/logger');

/**
 * Получение списка мероприятий
 * GET /api/events
 */
router.get('/', async (req, res) => {
  const logger = new APILogger('EVENTS');
  
  try {
    logger.logRequest(req, 'GET /events');
    
    const {
      type = null,
      city = null,
      upcoming = 'true',
      limit = 20,
      offset = 0,
      search = null,
      price_min = null,
      price_max = null
    } = req.query;

    const whereClause = {
      approved: true,
      status: 'planned'
    };
    
    // Фильтр по типу
    if (type && type !== 'all') {
      whereClause.type = type;
    }
    
    // Фильтр по городу
    if (city) {
      whereClause.city = {
        [require('sequelize').Op.iLike]: `%${city}%`
      };
    }
    
    // Фильтр по дате
    if (upcoming === 'true') {
      whereClause.event_date = {
        [require('sequelize').Op.gt]: new Date()
      };
    }
    
    // Фильтр по цене
    if (price_min !== null || price_max !== null) {
      whereClause.price = {};
      if (price_min !== null) {
        whereClause.price[require('sequelize').Op.gte] = parseFloat(price_min);
      }
      if (price_max !== null) {
        whereClause.price[require('sequelize').Op.lte] = parseFloat(price_max);
      }
    }
    
    // Поиск по названию и описанию
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        {
          title: {
            [require('sequelize').Op.iLike]: `%${search}%`
          }
        },
        {
          description: {
            [require('sequelize').Op.iLike]: `%${search}%`
          }
        },
        {
          tags: {
            [require('sequelize').Op.iLike]: `%${search}%`
          }
        }
      ];
    }

    const events = await Events.findAll({
      where: whereClause,
      include: [
        {
          model: Clubs,
          as: 'Club',
          attributes: ['id', 'name', 'avatar', 'is_verified'],
          where: { is_active: true }
        }
      ],
      order: [['event_date', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Подсчитываем общее количество
    const totalCount = await Events.count({
      where: whereClause,
      include: [
        {
          model: Clubs,
          as: 'Club',
          attributes: ['id'],
          where: { is_active: true }
        }
      ]
    });

    const responseData = {
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        event_date: event.event_date,
        location: event.location,
        city: event.city,
        price: event.price,
        max_participants: event.max_participants,
        current_participants: event.current_participants,
        type: event.type,
        requirements: event.requirements,
        dress_code: event.dress_code,
        contact_info: event.contact_info,
        tags: event.tags ? event.tags.split(',').map(tag => tag.trim()) : [],
        club: event.Club ? {
          id: event.Club.id,
          name: event.Club.name,
          avatar: event.Club.avatar,
          is_verified: event.Club.is_verified
        } : null,
        can_join: event.canJoin(),
        is_full: event.isFull(),
        created_at: event.created_at
      })),
      pagination: {
        page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };

    logger.logSuccess(req, 200, {
      events_count: events.length,
      total_count: totalCount
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении списка мероприятий'
    });
  }
});

/**
 * Получение конкретного мероприятия
 * GET /api/events/:id
 */
router.get('/:id', async (req, res) => {
  const logger = new APILogger('EVENTS');
  
  try {
    logger.logRequest(req, `GET /events/${req.params.id}`);
    
    const { id } = req.params;
    const event = await Events.findOne({
      where: { 
        id: parseInt(id),
        approved: true
      },
      include: [
        {
          model: Clubs,
          as: 'Club',
          attributes: ['id', 'name', 'description', 'avatar', 'is_verified', 'contact_info']
        }
      ]
    });

    if (!event) {
      return res.status(404).json({
        error: 'event_not_found',
        message: 'Мероприятие не найдено'
      });
    }

    // Получаем количество участников
    const participantsCount = await EventParticipants.count({
      where: { 
        event_id: parseInt(id),
        status: 'registered'
      }
    });

    const responseData = {
      id: event.id,
      title: event.title,
      description: event.description,
      event_date: event.event_date,
      location: event.location,
      city: event.city,
      price: event.price,
      max_participants: event.max_participants,
      current_participants: participantsCount,
      type: event.type,
      requirements: event.requirements,
      dress_code: event.dress_code,
      contact_info: event.contact_info,
      tags: event.tags ? event.tags.split(',').map(tag => tag.trim()) : [],
      club: event.Club ? {
        id: event.Club.id,
        name: event.Club.name,
        description: event.Club.description,
        avatar: event.Club.avatar,
        is_verified: event.Club.is_verified,
        contact_info: event.Club.contact_info
      } : null,
      can_join: event.canJoin() && participantsCount < (event.max_participants || Infinity),
      is_full: event.max_participants && participantsCount >= event.max_participants,
      created_at: event.created_at
    };

    logger.logSuccess(req, 200, {
      event_id: event.id,
      event_title: event.title
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
 * Регистрация на мероприятие
 * POST /api/events/:id/join
 */
router.post('/:id/join', authenticateToken, async (req, res) => {
  const logger = new APILogger('EVENTS');
  
  try {
    const { id } = req.params;
    const userId = req.user.login;
    
    logger.logRequest(req, `POST /events/${id}/join`);
    
    const event = await Events.findOne({
      where: { 
        id: parseInt(id),
        approved: true,
        status: 'planned'
      },
      include: [
        {
          model: Clubs,
          as: 'Club',
          attributes: ['id', 'name', 'is_active']
        }
      ]
    });
    
    if (!event) {
      return res.status(404).json({
        error: 'event_not_found',
        message: 'Мероприятие не найдено или недоступно'
      });
    }
    
    // Проверяем, что клуб активен
    if (!event.Club || !event.Club.is_active) {
      return res.status(400).json({
        error: 'club_inactive',
        message: 'Клуб-организатор неактивен'
      });
    }
    
    // Проверяем, есть ли место
    if (event.isFull()) {
      return res.status(400).json({
        error: 'event_full',
        message: 'Мероприятие переполнено'
      });
    }
    
    // Проверяем, не зарегистрирован ли уже пользователь
    const existingRegistration = await EventParticipants.findOne({
      where: {
        event_id: parseInt(id),
        user_id: userId
      }
    });
    
    if (existingRegistration) {
      return res.status(400).json({
        error: 'already_registered',
        message: 'Вы уже зарегистрированы на это мероприятие'
      });
    }
    
    // Если мероприятие платное
    if (event.price > 0) {
      const user = await User.findOne({ where: { login: userId } });
      
      if (parseFloat(user.balance) < parseFloat(event.price)) {
        return res.status(403).json({
          error: 'insufficient_balance',
          message: 'Недостаточно средств на балансе для регистрации на мероприятие'
        });
      }
      
      // Списываем с пользователя
      await user.update({
        balance: parseFloat(user.balance) - parseFloat(event.price)
      });
      
      // Переводим клубу (с учетом комиссии платформы)
      const platformFee = parseFloat(event.price) * 0.1; // 10% комиссия
      const clubAmount = parseFloat(event.price) - platformFee;
      
      await event.Club.update({
        balance: parseFloat(event.Club.balance) + clubAmount
      });
      
      logger.logBusinessLogic(1, 'Платная регистрация на мероприятие', {
        user_id: userId,
        event_id: event.id,
        price: event.price,
        platform_fee: platformFee,
        club_amount: clubAmount
      }, req);
    }
    
    // Создаем регистрацию
    const participant = await EventParticipants.create({
      event_id: parseInt(id),
      user_id: userId,
      club_id: event.Club.id,
      registration_date: new Date(),
      payment_status: event.price > 0 ? 'paid' : 'pending',
      amount_paid: event.price > 0 ? event.price : null,
      payment_date: event.price > 0 ? new Date() : null,
      status: 'registered'
    });
    
    // Увеличиваем счетчик участников
    await event.update({
      current_participants: parseInt(event.current_participants) + 1
    });
    
    logger.logResult('Регистрация на мероприятие', true, {
      participant_id: participant.id,
      user_id: userId,
      event_id: event.id,
      price: event.price
    }, req);
    
    const responseData = {
      success: true,
      message: event.price > 0 
        ? 'Вы успешно зарегистрировались на платное мероприятие!'
        : 'Вы успешно зарегистрировались на мероприятие!',
      participant: {
        id: participant.id,
        event_id: event.id,
        payment_status: participant.payment_status,
        amount_paid: participant.amount_paid,
        status: participant.status
      },
      event: {
        id: event.id,
        title: event.title,
        event_date: event.event_date,
        current_participants: event.current_participants
      }
    };
    
    logger.logSuccess(req, 201, responseData);
    res.status(201).json(responseData);
    
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при регистрации на мероприятие'
    });
  }
});

/**
 * Отмена регистрации на мероприятие
 * POST /api/events/:id/leave
 */
router.post('/:id/leave', authenticateToken, async (req, res) => {
  const logger = new APILogger('EVENTS');
  
  try {
    const { id } = req.params;
    const userId = req.user.login;
    
    logger.logRequest(req, `POST /events/${id}/leave`);
    
    const participant = await EventParticipants.findOne({
      where: {
        event_id: parseInt(id),
        user_id: userId,
        status: 'registered'
      },
      include: [
        {
          model: Events,
          as: 'Event',
          attributes: ['id', 'title', 'price', 'event_date']
        }
      ]
    });
    
    if (!participant) {
      return res.status(404).json({
        error: 'registration_not_found',
        message: 'Регистрация на мероприятие не найдена'
      });
    }
    
    // Проверяем, можно ли отменить (не позже чем за 24 часа до мероприятия)
    const eventDate = new Date(participant.Event.event_date);
    const now = new Date();
    const hoursUntilEvent = (eventDate - now) / (1000 * 60 * 60);
    
    if (hoursUntilEvent < 24) {
      return res.status(400).json({
        error: 'too_late_to_cancel',
        message: 'Отменить регистрацию можно не позже чем за 24 часа до мероприятия'
      });
    }
    
    // Возвращаем средства если мероприятие было платным
    if (participant.payment_status === 'paid' && participant.amount_paid > 0) {
      const user = await User.findOne({ where: { login: userId } });
      
      // Возвращаем 80% от уплаченной суммы (20% комиссия за отмену)
      const refundAmount = parseFloat(participant.amount_paid) * 0.8;
      
      await user.update({
        balance: parseFloat(user.balance) + refundAmount
      });
      
      logger.logBusinessLogic(1, 'Возврат средств при отмене регистрации', {
        user_id: userId,
        event_id: participant.Event.id,
        original_amount: participant.amount_paid,
        refund_amount: refundAmount
      }, req);
    }
    
    // Отменяем регистрацию
    await participant.update({
      status: 'cancelled',
      payment_status: 'cancelled'
    });
    
    // Уменьшаем счетчик участников
    const event = await Events.findByPk(parseInt(id));
    if (event) {
      await event.update({
        current_participants: Math.max(0, parseInt(event.current_participants) - 1)
      });
    }
    
    logger.logResult('Отмена регистрации на мероприятие', true, {
      participant_id: participant.id,
      user_id: userId,
      event_id: participant.Event.id
    }, req);
    
    const responseData = {
      success: true,
      message: 'Регистрация на мероприятие отменена',
      refund_amount: participant.payment_status === 'paid' ? parseFloat(participant.amount_paid) * 0.8 : 0
    };
    
    logger.logSuccess(req, 200, responseData);
    res.json(responseData);
    
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при отмене регистрации'
    });
  }
});

/**
 * Получение мероприятий пользователя
 * GET /api/events/my
 */
router.get('/my/events', authenticateToken, async (req, res) => {
  const logger = new APILogger('EVENTS');
  
  try {
    const userId = req.user.login;
    const { status = null, upcoming = null } = req.query;
    
    logger.logRequest(req, 'GET /events/my/events');
    
    const participants = await EventParticipants.getUserEvents(userId, {
      status,
      upcoming: upcoming === 'true'
    });
    
    const responseData = {
      events: participants.map(participant => ({
        id: participant.Event.id,
        title: participant.Event.title,
        event_date: participant.Event.event_date,
        location: participant.Event.location,
        city: participant.Event.city,
        price: participant.Event.price,
        status: participant.Event.status,
        club: participant.Club ? {
          id: participant.Club.id,
          name: participant.Club.name,
          avatar: participant.Club.avatar
        } : null,
        registration: {
          id: participant.id,
          registration_date: participant.registration_date,
          payment_status: participant.payment_status,
          amount_paid: participant.amount_paid,
          status: participant.status
        }
      }))
    };
    
    logger.logSuccess(req, 200, {
      user_id: userId,
      events_count: participants.length
    });
    
    res.json(responseData);
    
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении мероприятий пользователя'
    });
  }
});

module.exports = router;
