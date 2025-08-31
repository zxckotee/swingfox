const express = require('express');
const router = express.Router();
const { Clubs, ClubApplications, Events, User, Notifications } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');
const { APILogger } = require('../utils/logger');
const { Op } = require('sequelize');

// Вспомогательная функция для получения ID пользователя или клуба
const getUserId = (req) => {
  if (req.user) return req.user.login;
  if (req.club) return req.club.id;
  return 'anonymous';
};

// Вспомогательная функция для получения типа пользователя
const getUserType = (req) => {
  if (req.user) return 'user';
  if (req.club) return 'club';
  return 'anonymous';
};

// Вспомогательные функции для форматирования
const formatAge = (dateString) => {
  if (!dateString) return null;
  const birthDate = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const formatOnlineTime = (onlineTime) => {
  if (!onlineTime) return null;
  const now = new Date();
  const online = new Date(onlineTime);
  const diffMs = now - online;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ч назад`;
  return `${Math.floor(diffMins / 1440)} дн назад`;
};

// GET /api/clubs - Получение списка клубов
router.get('/', authenticateToken, async (req, res) => {
  const logger = new APILogger('CLUBS');
  
  try {
    logger.logRequest(req, 'GET /clubs');
    
    const {
      page = 1,
      limit = 20,
      location = null,
      type = null,
      search = null,
      popular = false,
      category = null,
      premium = null,
      min_rating = null
    } = req.query;

    // Определяем тип пользователя и получаем соответствующий ID
    const userId = getUserId(req);
    const userType = getUserType(req);
    const offset = (parseInt(page) - 1) * parseInt(limit);

    logger.logBusinessLogic(1, 'Получение списка клубов', {
      user_id: userId,
      user_type: userType,
      page: parseInt(page),
      limit: parseInt(limit),
      location,
      type,
      search,
      popular,
      category,
      premium,
      min_rating
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
        search,
        category,
        premium: premium === 'true' ? true : premium === 'false' ? false : null
      });
    }

    // Фильтруем по рейтингу если указан
    if (min_rating) {
      clubs = clubs.filter(club => club.rating >= parseFloat(min_rating));
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
      type: club.type,
      location: club.location,
      current_members: club.current_members,
      max_members: club.max_members,
      avatar: club.avatar,
      cover_image: club.cover_image,
      tags: club.tags ? club.tags.split(',').map(tag => tag.trim()) : [],
      is_verified: club.is_verified,
      membership_fee: club.membership_fee,
      age_restriction: club.age_restriction,
      owner: club.owner,
      owner_info: club.OwnerUser ? {
        login: club.OwnerUser.login,
        name: club.OwnerUser.name,
        avatar: club.OwnerUser.ava
      } : null,
      // НОВЫЕ МАРКЕТИНГОВЫЕ ПОЛЯ
      category: club.category,
      rating: club.rating,
      member_count: club.member_count,
      is_premium: club.is_premium,
      referral_code: club.referral_code,
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
      type = 'public',
      location,
      geo,
      max_members = 100,
      rules,
      tags,
      membership_fee = 0,
      age_restriction,
      contact_info,
      social_links,
      // НОВЫЕ МАРКЕТИНГОВЫЕ ПОЛЯ
      category,
      email
    } = req.body;

    const userId = getUserId(req);

    if (!name || !description || !location) {
      return res.status(400).json({
        error: 'missing_data',
        message: 'Укажите название, описание и местоположение клуба'
      });
    }

    logger.logBusinessLogic(1, 'Создание клуба', {
      user_id: userId,
      name,
      type,
      location,
      max_members,
      category,
      email
    }, req);

    // Проверяем VIP статус для приватных клубов
    const user = await User.findOne({ where: { login: userId } });
    if (type === 'private' && user.viptype === 'FREE') {
      return res.status(403).json({
        error: 'no_permission',
        message: 'Приватные клубы доступны только VIP и PREMIUM пользователям'
      });
    }

    // Создаем клуб
    logger.logDatabase('INSERT', 'clubs', {
      name,
      owner: userId,
      type,
      location,
      category,
      email
    }, req);

    const club = await Clubs.create({
      name: name.trim(),
      description: description.trim(),
      owner: userId,
      type,
      location: location.trim(),
      geo,
      max_members: parseInt(max_members),
      rules: rules ? rules.trim() : null,
      tags: tags ? tags.trim() : null,
      membership_fee: parseFloat(membership_fee) || 0,
      age_restriction,
      contact_info,
      social_links,
      current_members: 1, // Владелец автоматически становится участником
      // НОВЫЕ МАРКЕТИНГОВЫЕ ПОЛЯ
      category: category || null,
      email: email || null,
      rating: 0.00,
      member_count: 1,
      is_premium: false
    });

    // Генерируем реферальный код
    if (club) {
      await club.generateReferralCode();
    }

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
        type: club.type,
        location: club.location,
        current_members: club.current_members,
        max_members: club.max_members,
        owner: club.owner,
        // НОВЫЕ МАРКЕТИНГОВЫЕ ПОЛЯ
        category: club.category,
        rating: club.rating,
        member_count: club.member_count,
        is_premium: club.is_premium,
        referral_code: club.referral_code,
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

// GET /api/clubs/:id - Получение конкретного клуба
router.get('/:id', authenticateToken, async (req, res) => {
  const logger = new APILogger('CLUBS');
  
  try {
    logger.logRequest(req, 'GET /clubs/:id');
    
    const { id } = req.params;
    const userId = getUserId(req);

    logger.logBusinessLogic(1, 'Получение информации о клубе', {
      user_id: userId,
      club_id: id
    }, req);

    const club = await Clubs.findOne({
      where: {
        id: parseInt(id),
        is_active: true
      },
      include: [
        {
          model: User,
          as: 'OwnerUser',
          attributes: ['login', 'name', 'ava']
        }
      ]
    });

    if (!club) {
      return res.status(404).json({
        error: 'club_not_found',
        message: 'Клуб не найден'
      });
    }

    // Проверяем заявку пользователя
    const userApplication = await ClubApplications.findOne({
      where: {
        club_id: parseInt(id),
        applicant: userId
      }
    });

    // Получаем последние события клуба
    const recentEvents = await Events.getClubEvents(parseInt(id), {
      limit: 5,
      upcoming: true
    });

    const responseData = {
      id: club.id,
      name: club.name,
      description: club.description,
      type: club.type,
      location: club.location,
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
        name: club.OwnerUser.name,
        avatar: club.OwnerUser.ava
      } : null,
      // НОВЫЕ МАРКЕТИНГОВЫЕ ПОЛЯ
      category: club.category,
      rating: club.rating,
      member_count: club.member_count,
      is_premium: club.is_premium,
      referral_code: club.referral_code,
      created_at: club.created_at,
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
    const userId = getUserId(req);

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
    const userId = getUserId(req);

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
    const userId = getUserId(req);

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
    const userId = getUserId(req);

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
        // НОВЫЕ МАРКЕТИНГОВЫЕ ПОЛЯ
        category: club.category,
        rating: club.rating,
        member_count: club.member_count,
        is_premium: club.is_premium,
        referral_code: club.referral_code,
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
  try {
    const userId = getUserId(req);
    
    const club = await Clubs.findOne({
      where: {
        owner: userId,
        is_active: true
      }
    });
    
    res.json({
      hasActiveClub: !!club,
      club: club ? {
        id: club.id,
        name: club.name,
        is_verified: club.is_verified,
        // НОВЫЕ МАРКЕТИНГОВЫЕ ПОЛЯ
        category: club.category,
        rating: club.rating,
        member_count: club.member_count,
        is_premium: club.is_premium,
        referral_code: club.referral_code
      } : null
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при проверке владения клубом'
    });
  }
});

// НОВЫЕ МАРКЕТИНГОВЫЕ ENDPOINTS

// GET /api/clubs/categories - Получение списка категорий клубов
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = [
      'вечеринки',
      'ужины', 
      'активность',
      'нетворкинг',
      'спорт',
      'культура',
      'путешествия',
      'бизнес'
    ];
    
    res.json({
      categories,
      count: categories.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении категорий'
    });
  }
});

// GET /api/clubs/top-rated - Получение топ рейтинговых клубов
router.get('/top-rated', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const topClubs = await Clubs.getTopRatedClubs(parseInt(limit));
    
    const responseData = {
      clubs: topClubs.map(club => ({
        id: club.id,
        name: club.name,
        description: club.description,
        category: club.category,
        rating: club.rating,
        member_count: club.member_count,
        is_premium: club.is_premium,
        avatar: club.avatar,
        location: club.location
      }))
    };
    
    res.json(responseData);
  } catch (error) {
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении топ клубов'
    });
  }
});

// GET /api/clubs/category/:category - Получение клубов по категории
router.get('/category/:category', authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const clubs = await Clubs.getClubsByCategory(category, {
      limit: parseInt(limit),
      offset
    });
    
    const totalCount = await Clubs.count({
      where: { 
        category,
        is_active: true
      }
    });
    
    const responseData = {
      category,
      clubs: clubs.map(club => ({
        id: club.id,
        name: club.name,
        description: club.description,
        rating: club.rating,
        member_count: club.member_count,
        is_premium: club.is_premium,
        avatar: club.avatar,
        location: club.location
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };
    
    res.json(responseData);
  } catch (error) {
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении клубов по категории'
    });
  }
});

// GET /api/clubs/premium - Получение премиум клубов
router.get('/premium', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const clubs = await Clubs.getPremiumClubs({
      limit: parseInt(limit),
      offset
    });
    
    const totalCount = await Clubs.count({
      where: { 
        is_premium: true,
        is_active: true
      }
    });
    
    const responseData = {
      clubs: clubs.map(club => ({
        id: club.id,
        name: club.name,
        description: club.description,
        category: club.category,
        rating: club.rating,
        member_count: club.member_count,
        avatar: club.avatar,
        location: club.location,
        membership_fee: club.membership_fee
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };
    
    res.json(responseData);
  } catch (error) {
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении премиум клубов'
    });
  }
});

// POST /api/clubs/:id/upgrade-premium - Апгрейд до премиума
router.post('/:id/upgrade-premium', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    
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
    
    if (club.is_premium) {
      return res.status(400).json({
        error: 'already_premium',
        message: 'Клуб уже является премиум'
      });
    }
    
    // Апгрейд до премиума
    await club.upgradeToPremium();
    
    res.json({
      success: true,
      message: 'Клуб успешно обновлен до премиум статуса',
      club: {
        id: club.id,
        name: club.name,
        is_premium: club.is_premium
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при обновлении статуса клуба'
    });
  }
});

// POST /api/clubs/:id/update-rating - Обновление рейтинга клуба
router.post('/:id/update-rating', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const userId = getUserId(req);
    
    if (!rating || rating < 0 || rating > 5) {
      return res.status(400).json({
        error: 'invalid_rating',
        message: 'Рейтинг должен быть от 0 до 5'
      });
    }
    
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
    
    // Обновляем рейтинг
    await club.updateRating(parseFloat(rating));
    
    res.json({
      success: true,
      message: 'Рейтинг клуба обновлен',
      club: {
        id: club.id,
        name: club.name,
        rating: club.rating
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при обновлении рейтинга'
    });
  }
});

// POST /api/clubs/:id/generate-referral - Генерация нового реферального кода
router.post('/:id/generate-referral', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    
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
    
    // Генерируем новый реферальный код
    const newReferralCode = await club.generateReferralCode();
    
    res.json({
      success: true,
      message: 'Новый реферальный код сгенерирован',
      referral_code: newReferralCode
    });
  } catch (error) {
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при генерации реферального кода'
    });
  }
});

// GET /api/clubs/profiles/batch - Массовая загрузка профилей для клубов
router.get('/profiles/batch', authenticateToken, async (req, res) => {
  try {
    const { count = 10 } = req.query;
    
    // Проверяем, авторизован ли клуб
    if (!req.club) {
      return res.status(401).json({ 
        error: 'club_auth_required',
        message: 'Требуется аутентификация клуба' 
      });
    }

    const clubId = req.club.id;
    const profiles = [];

    // Получаем данные клуба
    const currentClub = await Clubs.findOne({ where: { id: clubId } });
    if (!currentClub) {
      return res.status(404).json({ 
        error: 'club_not_found',
        message: 'Клуб не найден' 
      });
    }

    // Загружаем профили пользователей для клуба
    const allCandidates = await User.findAll({
      where: {
        status: { [Op.ne]: 'BANNED' },
        viptype: { [Op.ne]: 'FREE' }
      },
      attributes: [
        'id', 'login', 'ava', 'status', 'city', 'country', 'date', 'info', 
        'registration', 'online', 'viptype', 'geo', 'search_status', 'search_age',
        'height', 'weight', 'smoking', 'alko', 'location'
      ],
      order: User.sequelize.random() // Случайный порядок
    });

    if (allCandidates.length === 0) {
      return res.status(404).json({ 
        error: 'no_profiles',
        message: 'Нет доступных VIP профилей' 
      });
    }

    // Выбираем случайные анкеты
    let selectedUsers = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * allCandidates.length);
      selectedUsers.push(allCandidates[randomIndex]);
    }

    // Формируем ответ для каждого профиля
    for (const targetUser of selectedUsers) {
      // Проверяем, что у нас есть все необходимые поля
      if (!targetUser || !targetUser.login || !targetUser.ava) {
        continue;
      }
      
      // Форматируем возраст
      const age = targetUser.date ? formatAge(targetUser.date) : null;

      // Форматируем время онлайн
      const onlineTime = targetUser.online ? formatOnlineTime(targetUser.online) : null;

      // Проверяем, является ли пара
      const isCouple = targetUser.status === 'Семейная пара(М+Ж)' || targetUser.status === 'Несемейная пара(М+Ж)';
      let partnerData = null;
      
      if (isCouple && targetUser.info) {
        try {
          const infoData = JSON.parse(targetUser.info);
          if (infoData.manDate && infoData.womanDate) {
            partnerData = {
              manDate: infoData.manDate,
              womanDate: infoData.womanDate
            };
          }
        } catch (e) {
          // Игнорируем ошибки парсинга
        }
      }

      profiles.push({
        id: targetUser.id,
        login: targetUser.login,
        ava: targetUser.ava,
        status: targetUser.status,
        city: targetUser.city,
        country: targetUser.country,
        age: age,
        info: targetUser.info,
        registration: targetUser.registration,
        online: targetUser.online,
        onlineTime: onlineTime,
        viptype: targetUser.viptype,
        search_status: targetUser.search_status,
        search_age: targetUser.search_age,
        height: targetUser.height,
        weight: targetUser.weight,
        smoking: targetUser.smoking,
        alko: targetUser.alko,
        location: targetUser.location,
        isCouple: isCouple,
        partnerData: partnerData,
        // Для клубов добавляем специальные поля
        club_view: true,
        club_id: clubId,
        club_name: currentClub.name
      });
    }

    res.json({
      success: true,
      profiles: profiles,
      total: profiles.length,
      club_info: {
        id: currentClub.id,
        name: currentClub.name,
        type: currentClub.type
      }
    });

  } catch (error) {
    console.error('Club profiles batch error:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при загрузке профилей'
    });
  }
});

module.exports = router;