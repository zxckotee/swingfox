const express = require('express');
const router = express.Router();
const { Clubs, Events, User, Notifications } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');
const { APILogger } = require('../utils/logger');

// GET /api/clubs - Получение списка клубов (публичный)
router.get('/', async (req, res) => {
  const logger = new APILogger('CLUBS');
  
  try {
    logger.logRequest(req, 'GET /clubs');
    
    const {
      page = 1,
      limit = 20,
      location = null,
      type = null,
      search = null,
      popular = false
    } = req.query;

    const userId = req.user?.login || null; // Пользователь может быть не аутентифицирован
    const offset = (parseInt(page) - 1) * parseInt(limit);

    logger.logBusinessLogic(1, 'Получение списка клубов', {
      user_id: userId,
      page: parseInt(page),
      limit: parseInt(limit),
      location,
      type,
      search,
      popular
    }, req);

    let clubs;
    if (popular === 'true') {
      clubs = await Clubs.getPopularClubs(parseInt(limit));
    } else {
      clubs = await Clubs.getActiveClubs({
        limit: parseInt(limit),
        offset,
        location,
        type,
        search
      });
    }

    // Подсчитываем общее количество
    const totalCount = await Clubs.count({
      where: { is_active: true }
    });

    // Форматируем клубы
    const formattedClubs = clubs.map(club => ({
      id: club.id,
      name: club.name,
      description: club.description,
      location: club.location,
      country: club.country,
      city: club.city,
      address: club.address,
      avatar: club.avatar,
      website: club.website,
      links: club.links,
      owner: club.owner,
      owner_info: club.OwnerUser ? {
        login: club.OwnerUser.login,
        avatar: club.OwnerUser.ava,
        date: club.OwnerUser.date,
        status: club.OwnerUser.status
      } : null,
      date_created: club.date_created,
      created_at: club.created_at
    }));

    const responseData = {
      clubs: formattedClubs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };

    logger.logSuccess(req, 200, {
      clubs_count: clubs.length,
      total_count: totalCount
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении списка клубов'
    });
  }
});

// POST /api/clubs - Создание клуба
router.post('/', authenticateToken, async (req, res) => {
  const logger = new APILogger('CLUBS');
  
  try {
    logger.logRequest(req, 'POST /clubs');
    
    const {
      name,
      description,
      country,
      city,
      address,
      location,
      website,
      links
    } = req.body;

    const userId = req.user.login;

    if (!name || !country || !city || !address) {
      return res.status(400).json({
        error: 'missing_data',
        message: 'Укажите название, страну, город и адрес клуба'
      });
    }

    logger.logBusinessLogic(1, 'Создание клуба', {
      user_id: userId,
      name,
      country,
      city,
      address
    }, req);

    // Создаем клуб
    logger.logDatabase('INSERT', 'clubs', {
      name,
      owner: userId,
      country,
      city,
      address
    }, req);

    const club = await Clubs.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      owner: userId,
      country: country.trim(),
      city: city.trim(),
      address: address.trim(),
      location: location ? location.trim() : null,
      website: website ? website.trim() : null,
      links: links ? links.trim() : null,
      date_created: new Date().toISOString().split('T')[0]
    });


    logger.logResult('Создание клуба', true, {
      club_id: club.id,
      name: club.name
    }, req);

    const responseData = {
      success: true,
      club: {
        id: club.id,
        name: club.name,
        description: club.description,
        country: club.country,
        city: club.city,
        address: club.address,
        location: club.location,
        website: club.website,
        links: club.links,
        owner: club.owner,
        date_created: club.date_created,
        created_at: club.created_at
      },
      message: 'Клуб успешно создан'
    };

    logger.logSuccess(req, 201, responseData);
    res.status(201).json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при создании клуба'
    });
  }
});

// GET /api/clubs/:id - Получение конкретного клуба (публичный)
router.get('/:id', async (req, res) => {
  const logger = new APILogger('CLUBS');
  
  try {
    logger.logRequest(req, 'GET /clubs/:id');
    
    const { id } = req.params;
    const userId = req.user?.login || null; // Пользователь может быть не аутентифицирован

    logger.logBusinessLogic(1, 'Получение информации о клубе', {
      user_id: userId,
      club_id: id
    }, req);

    const club = await Clubs.findOne({
      where: {
        id: id, // Используем ID как есть, без parseInt
        is_active: true
      },
      include: [
        {
          model: User,
          as: 'OwnerUser',
          attributes: ['login', 'ava']
        }
      ]
    });

    if (!club) {
      return res.status(404).json({
        error: 'club_not_found',
        message: 'Клуб не найден'
      });
    }


    // Получаем последние события клуба из таблицы club_events
    const { ClubEvents } = require('../models');
    const recentEvents = await ClubEvents.findAll({
      where: {
        club_id: id,
        date: {
          [require('sequelize').Op.gte]: new Date()
        }
      },
      order: [['date', 'ASC']],
      limit: 5
    });

    const responseData = {
      success: true,
      club: {
        id: club.id,
        name: club.name,
        description: club.description,
        type: club.type,
        location: club.location,
        city: club.city,
        country: club.country,
        address: club.address,
        website: club.website,
        email: club.email,
        geo: club.geo,
        current_members: club.current_members,
        max_members: club.max_members,
        member_count: club.member_count || 0,
        rules: club.rules,
        tags: club.tags ? club.tags.split(',').map(tag => tag.trim()) : [],
        avatar: club.avatar,
        cover_image: club.cover_image,
        is_verified: club.is_verified,
        membership_fee: club.membership_fee,
        age_restriction: club.age_restriction,
        contact_info: club.contact_info,
        social_links: club.social_links,
        links: club.links,
        owner: club.owner,
        owner_info: club.OwnerUser ? {
          login: club.OwnerUser.login,
          avatar: club.OwnerUser.ava,
          date: club.OwnerUser.date,
          status: club.OwnerUser.status
        } : null,
        created_at: club.created_at,
        date_created: club.date_created,
        recent_events: recentEvents.map(event => ({
          id: event.id,
          title: event.title,
          event_date: event.event_date,
          location: event.location,
          current_participants: event.current_participants,
          max_participants: event.max_participants
        })),
        is_owner: club.owner === userId,
        can_join: club.canJoin ? club.canJoin() : false
      }
    };

    logger.logSuccess(req, 200, {
      club_id: club.id,
      club_name: club.name
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении информации о клубе'
    });
  }
});




// GET /api/clubs/my - Получение клубов пользователя
router.get('/my/list', authenticateToken, async (req, res) => {
  const logger = new APILogger('CLUBS');
  
  try {
    logger.logRequest(req, 'GET /clubs/my/list');
    
    const { role = 'all' } = req.query;
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Получение клубов пользователя', {
      user_id: userId,
      role
    }, req);

    const clubs = await Clubs.getUserClubs(userId, role);

    const responseData = {
      clubs: clubs.map(club => ({
        id: club.id,
        name: club.name,
        description: club.description,
        type: club.type,
        location: club.location,
        current_members: club.current_members,
        max_members: club.max_members,
        avatar: club.avatar,
        is_verified: club.is_verified,
        owner: club.owner,
        is_owner: club.owner === userId,
        created_at: club.created_at
      }))
    };

    logger.logSuccess(req, 200, {
      clubs_count: clubs.length
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении клубов пользователя'
    });
  }
});

// GET /api/clubs/my/ownership - Проверка владения активным клубом
router.get('/my/ownership', authenticateToken, async (req, res) => {
  const logger = new APILogger('CLUBS');
  
  try {
    logger.logRequest(req, 'GET /clubs/my/ownership');
    
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Проверка владения активным клубом', {
      user_id: userId
    }, req);
    
    const club = await Clubs.findOne({
      where: {
        owner: userId,
        is_active: true
      }
    });
    
    const responseData = {
      hasActiveClub: !!club,
      club: club ? {
        id: club.id,
        name: club.name,
        is_verified: club.is_verified
      } : null
    };

    logger.logSuccess(req, 200, {
      has_active_club: !!club,
      club_id: club?.id
    });
    
    res.json(responseData);
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при проверке владения клубом'
    });
  }
});

// GET /api/clubs/:id/events - Получение мероприятий клуба (публичный)
router.get('/:id/events', async (req, res) => {
  const logger = new APILogger('CLUBS');
  
  try {
    logger.logRequest(req, 'GET /clubs/:id/events');
    
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    logger.logBusinessLogic(1, 'Получение мероприятий клуба', {
      club_id: id,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }, req);

    // Проверяем существование клуба
    const club = await Clubs.findByPk(id);
    if (!club) {
      return res.status(404).json({
        error: 'club_not_found',
        message: 'Клуб не найден'
      });
    }

    // Получаем мероприятия клуба
    const { ClubEvents } = require('../models');
    const events = await ClubEvents.findAll({
      where: {
        club_id: id,
        date: {
          [require('sequelize').Op.gte]: new Date()
        }
      },
      order: [['date', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const responseData = {
      success: true,
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        price: event.price,
        max_participants: event.max_participants,
        current_participants: event.current_participants,
        event_type: event.event_type,
        is_premium: event.is_premium,
        avatar: event.avatar,
        images: event.images
      })),
      club: {
        id: club.id,
        name: club.name,
        type: club.type,
        location: club.location,
        avatar: club.avatar,
        member_count: club.member_count || 0
      }
    };

    logger.logSuccess(req, 200, {
      club_id: id,
      events_count: events.length
    });
    
    res.json(responseData);
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении мероприятий клуба'
    });
  }
});

module.exports = router;