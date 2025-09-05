const express = require('express');
const router = express.Router();
const { Clubs, ClubApplications, Events, User, Notifications } = require('../models');
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

    // Проверяем заявку пользователя (только если пользователь аутентифицирован)
    let userApplication = null;
    if (userId) {
      userApplication = await ClubApplications.findOne({
        where: {
          club_id: id,
          applicant: userId
        }
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
      rules: club.rules,
      tags: club.tags ? club.tags.split(',').map(tag => tag.trim()) : [],
      avatar: club.avatar,
      cover_image: club.cover_image,
      is_verified: club.is_verified,
      membership_fee: club.membership_fee,
      age_restriction: club.age_restriction,
      contact_info: club.contact_info,
      social_links: club.social_links,
      owner: club.owner,
      owner_info: club.OwnerUser ? {
        login: club.OwnerUser.login,
        avatar: club.OwnerUser.ava,
        date: club.OwnerUser.date,
        status: club.OwnerUser.status
      } : null,
      created_at: club.created_at,
      date_created: club.date_created,
      user_application: userApplication ? {
        status: userApplication.status,
        created_at: userApplication.created_at,
        reviewed_at: userApplication.reviewed_at
      } : null,
      recent_events: recentEvents.map(event => ({
        id: event.id,
        title: event.title,
        event_date: event.event_date,
        location: event.location,
        current_participants: event.current_participants,
        max_participants: event.max_participants
      })),
      is_owner: club.owner === userId,
      can_join: club.canJoin()
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

// POST /api/clubs/:id/join - Подача заявки на вступление
router.post('/:id/join', authenticateToken, async (req, res) => {
  const logger = new APILogger('CLUBS');
  
  try {
    logger.logRequest(req, 'POST /clubs/:id/join');
    
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Подача заявки на вступление в клуб', {
      user_id: userId,
      club_id: id,
      has_message: !!message
    }, req);

    try {
      const application = await ClubApplications.createApplication(
        parseInt(id),
        userId,
        message
      );

      // Получаем информацию о клубе для уведомления
      const club = await Clubs.findByPk(parseInt(id), {
        include: [
          {
            model: User,
            as: 'OwnerUser',
            attributes: ['login', 'name']
          }
        ]
      });

      // Создаем уведомление владельцу клуба
      try {
        await Notifications.createNotification({
          user_id: club.owner,
          type: 'club_request',
          title: 'Новая заявка в клуб',
          message: `${req.user.name || userId} подал заявку на вступление в клуб "${club.name}"`,
          from_user: userId,
          target_id: club.id.toString(),
          target_type: 'club',
          priority: 'normal',
          data: {
            club_id: club.id,
            application_id: application.id
          }
        });
      } catch (notifError) {
        logger.logWarning('Ошибка создания уведомления', notifError, req);
      }

      logger.logResult('Подача заявки', true, {
        application_id: application.id,
        club_id: id
      }, req);

      const responseData = {
        success: true,
        application: {
          id: application.id,
          status: application.status,
          created_at: application.created_at,
          expires_at: application.expires_at
        },
        message: 'Заявка на вступление подана'
      };

      logger.logSuccess(req, 201, responseData);
      res.status(201).json(responseData);

    } catch (applicationError) {
      logger.logWarning('Ошибка при подаче заявки', applicationError, req);
      
      return res.status(400).json({
        error: 'application_error',
        message: applicationError.message
      });
    }

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при подаче заявки'
    });
  }
});

// GET /api/clubs/:id/applications - Получение заявок (для владельца)
router.get('/:id/applications', authenticateToken, async (req, res) => {
  const logger = new APILogger('CLUBS');
  
  try {
    logger.logRequest(req, 'GET /clubs/:id/applications');
    
    const { id } = req.params;
    const { status = null } = req.query;
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Получение заявок клуба', {
      user_id: userId,
      club_id: id,
      status
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
        message: 'Нет доступа к заявкам этого клуба'
      });
    }

    const applications = status 
      ? await ClubApplications.findAll({
          where: {
            club_id: parseInt(id),
            status
          },
          include: [
            {
              model: User,
              as: 'ApplicantUser',
              attributes: ['login', 'name', 'ava', 'city', 'viptype']
            }
          ],
          order: [['created_at', 'DESC']]
        })
      : await ClubApplications.getPendingApplications(parseInt(id));

    // Получаем статистику заявок
    const stats = await ClubApplications.getApplicationStats(parseInt(id));

    const responseData = {
      applications: applications.map(app => ({
        id: app.id,
        applicant: app.applicant,
        applicant_info: app.ApplicantUser ? {
          login: app.ApplicantUser.login,
          name: app.ApplicantUser.name,
          avatar: app.ApplicantUser.ava,
          city: app.ApplicantUser.city,
          vip_type: app.ApplicantUser.viptype
        } : null,
        status: app.status,
        application_message: app.application_message,
        admin_response: app.admin_response,
        reviewed_by: app.reviewed_by,
        reviewed_at: app.reviewed_at,
        created_at: app.created_at,
        expires_at: app.expires_at,
        is_expired: app.isExpired()
      })),
      stats,
      club: {
        id: club.id,
        name: club.name,
        current_members: club.current_members,
        max_members: club.max_members
      }
    };

    logger.logSuccess(req, 200, {
      applications_count: applications.length,
      stats
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении заявок'
    });
  }
});

// PUT /api/clubs/:id/applications/:applicationId - Одобрение/отклонение заявки
router.put('/:id/applications/:applicationId', authenticateToken, async (req, res) => {
  const logger = new APILogger('CLUBS');
  
  try {
    logger.logRequest(req, 'PUT /clubs/:id/applications/:applicationId');
    
    const { id, applicationId } = req.params;
    const { action, response } = req.body;
    const userId = req.user.login;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        error: 'invalid_action',
        message: 'Действие должно быть approve или reject'
      });
    }

    logger.logBusinessLogic(1, 'Рассмотрение заявки', {
      user_id: userId,
      club_id: id,
      application_id: applicationId,
      action
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
        message: 'Нет доступа к управлению этим клубом'
      });
    }

    // Получаем заявку
    const application = await ClubApplications.findOne({
      where: {
        id: parseInt(applicationId),
        club_id: parseInt(id),
        status: 'pending'
      },
      include: [
        {
          model: User,
          as: 'ApplicantUser',
          attributes: ['login', 'name']
        }
      ]
    });

    if (!application) {
      return res.status(404).json({
        error: 'application_not_found',
        message: 'Заявка не найдена или уже рассмотрена'
      });
    }

    // Проверяем место в клубе при одобрении
    if (action === 'approve' && club.isFull()) {
      return res.status(400).json({
        error: 'club_full',
        message: 'В клубе нет свободных мест'
      });
    }

    logger.logDatabase('UPDATE', 'club_applications', {
      application_id: applicationId,
      action,
      reviewer: userId
    }, req);

    // Рассматриваем заявку
    if (action === 'approve') {
      await application.approve(userId, response);
    } else {
      await application.reject(userId, response);
    }

    // Создаем уведомление заявителю
    try {
      const notificationType = action === 'approve' ? 'club_invite' : 'system';
      const title = action === 'approve' ? 'Заявка одобрена!' : 'Заявка отклонена';
      const message = action === 'approve' 
        ? `Ваша заявка на вступление в клуб "${club.name}" одобрена!`
        : `Ваша заявка на вступление в клуб "${club.name}" отклонена.`;

      await Notifications.createNotification({
        user_id: application.applicant,
        type: notificationType,
        title,
        message: response ? `${message}\n\nКомментарий: ${response}` : message,
        from_user: userId,
        target_id: club.id.toString(),
        target_type: 'club',
        priority: action === 'approve' ? 'high' : 'normal',
        data: {
          club_id: club.id,
          application_id: application.id,
          action
        }
      });
    } catch (notifError) {
      logger.logWarning('Ошибка создания уведомления', notifError, req);
    }

    logger.logResult('Рассмотрение заявки', true, {
      application_id: applicationId,
      action,
      club_members_count: action === 'approve' ? club.current_members + 1 : club.current_members
    }, req);

    const responseData = {
      success: true,
      application: {
        id: application.id,
        status: application.status,
        reviewed_at: application.reviewed_at,
        admin_response: application.admin_response
      },
      message: action === 'approve' ? 'Заявка одобрена' : 'Заявка отклонена'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при рассмотрении заявки'
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

module.exports = router;