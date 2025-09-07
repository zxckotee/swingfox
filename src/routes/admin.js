const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  User, Chat, Likes, Ads, Reports, Events, Notifications,
  Gifts, Clubs, Subscriptions
} = require('../models');
const { APILogger } = require('../utils/logger');

// Middleware для проверки прав администратора
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { login: req.user.login } });
    if (!user || user.status !== 'ADMIN') {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    req.user.isAdmin = true;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Ошибка проверки прав доступа' });
  }
};

// Применяем middleware ко всем роутам
router.use(authenticateToken);
router.use(adminMiddleware);

// Получение статистики
router.get('/stats', async (req, res) => {
  const logger = new APILogger('ADMIN');
  
  try {
    logger.logRequest(req, 'GET /admin/stats');
    
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    
    const [
      totalUsers,
      activeUsers,
      vipUsers,
      premiumUsers,
      totalAds,
      pendingReports,
      totalEvents,
      totalClubs,
      totalSubscriptions,
      activeSubscriptions,
      totalGifts,
      unreadNotifications,
      todayRegistrations,
      todayMessages,
      todaySubscriptions,
      todayGifts
    ] = await Promise.all([
      User.count(),
      User.count({ where: { status: { [Op.ne]: 'BANNED' } } }),
      User.count({ where: { viptype: 'VIP' } }),
      User.count({ where: { viptype: 'PREMIUM' } }),
      Ads.count(),
      Reports.count({ where: { status: 'pending' } }),
      Events.count(),
      Clubs.count({ where: { is_active: true } }),
      Subscriptions.count(),
      Subscriptions.count({ where: { status: 'active' } }),
      Gifts.count({ where: { is_valid: true } }),
      Notifications.count({ where: { is_read: false } }),
      User.count({
        where: {
          created_at: { [Op.gte]: todayStart }
        }
      }),
      Chat.count({
        where: {
          date: { [Op.gte]: todayStart }
        }
      }),
      Subscriptions.count({
        where: {
          created_at: { [Op.gte]: todayStart }
        }
      }),
      Gifts.count({
        where: {
          created_at: { [Op.gte]: todayStart }
        }
      })
    ]);

    // Статистика по подпискам
    const subscriptionStats = await Subscriptions.getSubscriptionStats();
    
    // Последняя активность
    const recentActivity = await User.findAll({
      attributes: ['login', 'online', 'created_at', 'viptype'],
      order: [['online', 'DESC NULLS LAST'], ['created_at', 'DESC']],
      limit: 10
    });

    const activityFormatted = recentActivity.map(user => ({
      user: user.login,
      timestamp: user.online || user.created_at,
      action: user.online ? 'Последняя активность' : 'Регистрация',
      vip_type: user.viptype
    }));

    // Популярные клубы
    const popularClubs = await Clubs.getPopularClubs(5);
    
    // Последние события
    const recentEvents = await Events.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'title', 'event_date', 'organizer', 'approved', 'current_participants']
    });

    const responseData = {
      overview: {
        total_users: totalUsers,
        active_users: activeUsers,
        vip_users: vipUsers,
        premium_users: premiumUsers,
        total_ads: totalAds,
        pending_reports: pendingReports,
        total_events: totalEvents,
        total_clubs: totalClubs,
        total_subscriptions: totalSubscriptions,
        active_subscriptions: activeSubscriptions,
        total_gifts: totalGifts,
        unread_notifications: unreadNotifications
      },
      today_stats: {
        registrations: todayRegistrations,
        messages: todayMessages,
        subscriptions: todaySubscriptions,
        gifts: todayGifts
      },
      subscription_stats: subscriptionStats,
      recent_activity: activityFormatted,
      popular_clubs: popularClubs.map(club => ({
        id: club.id,
        name: club.name,
        members: club.current_members,
        type: club.type
      })),
      recent_events: recentEvents.map(event => ({
        id: event.id,
        title: event.title,
        date: event.event_date,
        organizer: event.organizer,
        approved: event.approved,
        participants: event.current_participants
      }))
    };

    logger.logSuccess(req, 200, {
      total_users: totalUsers,
      active_subscriptions: activeSubscriptions
    });
    
    res.json(responseData);
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение списка пользователей
router.get('/users', async (req, res) => {
  try {
    const { search = '', status = '', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { login: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status === 'banned') {
      whereClause.banned = true;
    } else if (status === 'active') {
      whereClause.banned = false;
    } else if (status === 'verified') {
      whereClause.verified = true;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: [
        'id', 'login', 'email', 'name', 'created_at', 'online',
        'status', 'viptype', 'city', 'balance'
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalCount = await User.count({ where: whereClause });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Действия с пользователями
router.post('/users/:userId/action', async (req, res) => {
  const logger = new APILogger('ADMIN');
  
  try {
    logger.logRequest(req, 'POST /admin/users/:userId/action');
    
    const { userId } = req.params;
    const { action, reason } = req.body;

    const user = await User.findOne({ where: { login: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Нельзя действовать с другими администраторами
    if (user.status === 'ADMIN' && user.login !== req.user.login) {
      return res.status(403).json({ error: 'Нельзя выполнить действие с администратором' });
    }

    logger.logBusinessLogic(1, 'Административное действие с пользователем', {
      admin: req.user.login,
      target_user: userId,
      action,
      reason
    }, req);

    switch (action) {
      case 'ban':
        await User.update(
          { status: 'BANNED' },
          { where: { login: userId } }
        );
        
        // Создаем уведомление
        await Notifications.createNotification({
          user_id: userId,
          type: 'ban',
          title: 'Аккаунт заблокирован',
          message: reason ? `Ваш аккаунт заблокирован. Причина: ${reason}` : 'Ваш аккаунт заблокирован',
          from_user: req.user.login,
          priority: 'urgent'
        });
        break;
      
      case 'unban':
        await User.update(
          { status: 'ACTIVE' },
          { where: { login: userId } }
        );
        
        await Notifications.createNotification({
          user_id: userId,
          type: 'unban',
          title: 'Аккаунт разблокирован',
          message: 'Ваш аккаунт был разблокирован',
          from_user: req.user.login,
          priority: 'high'
        });
        break;
      
      case 'set_vip':
        await User.update(
          { viptype: 'VIP' },
          { where: { login: userId } }
        );
        
        await Notifications.createNotification({
          user_id: userId,
          type: 'premium',
          title: 'VIP статус присвоен',
          message: 'Вам присвоен VIP статус на 30 дней',
          from_user: req.user.login,
          priority: 'high'
        });
        break;
      
      case 'set_premium':
        await User.update(
          { viptype: 'PREMIUM' },
          { where: { login: userId } }
        );
        
        await Notifications.createNotification({
          user_id: userId,
          type: 'premium',
          title: 'Premium статус присвоен',
          message: 'Вам присвоен Premium статус на 30 дней',
          from_user: req.user.login,
          priority: 'high'
        });
        break;
      
      case 'remove_vip':
        await User.update(
          { viptype: 'FREE' },
          { where: { login: userId } }
        );
        break;
      
      case 'add_balance':
        const amount = parseFloat(req.body.amount) || 0;
        if (amount > 0) {
          await User.update(
            { balance: parseFloat(user.balance) + amount },
            { where: { login: userId } }
          );
          
          await Notifications.createNotification({
            user_id: userId,
            type: 'system',
            title: 'Баланс пополнен',
            message: `Ваш баланс пополнен на ${amount} руб.`,
            from_user: req.user.login,
            priority: 'normal'
          });
        }
        break;
      
      case 'delete':
        // Удаляем связанные данные
        await Promise.all([
          Chat.destroy({ where: {
            [Op.or]: [
              { by_user: user.login },
              { to_user: user.login }
            ]
          }}),
          Likes.destroy({ where: {
            [Op.or]: [
              { like_from: user.login },
              { like_to: user.login }
            ]
          }}),
          Ads.destroy({ where: { author: user.login } }),
          Gifts.destroy({ where: {
            [Op.or]: [
              { owner: user.login },
              { from_user: user.login }
            ]
          }}),
          Notifications.destroy({ where: {
            [Op.or]: [
              { user_id: user.login },
              { from_user: user.login }
            ]
          }}),
          Subscriptions.destroy({ where: { user_id: user.login } })
        ]);
        
        await user.destroy();
        break;
      
      default:
        return res.status(400).json({ error: 'Неизвестное действие' });
    }

    logger.logResult('Административное действие', true, {
      action,
      target_user: userId
    }, req);

    res.json({ message: 'Действие выполнено успешно' });
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение объявлений для модерации
router.get('/ads', async (req, res) => {
  try {
    const { search = '', status = '', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { author: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const ads = await Ads.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(ads);
  } catch (error) {
    console.error('Ошибка получения объявлений:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Действия с объявлениями
router.post('/ads/:adId/action', async (req, res) => {
  try {
    const { adId } = req.params;
    const { action } = req.body;

    const ad = await Ads.findByPk(adId);
    if (!ad) {
      return res.status(404).json({ error: 'Объявление не найдено' });
    }

    switch (action) {
      case 'approve':
        await ad.update({ status: 'approved' });
        break;
      
      case 'reject':
        await ad.update({ status: 'rejected' });
        break;
      
      case 'delete':
        await ad.destroy();
        break;
      
      default:
        return res.status(400).json({ error: 'Неизвестное действие' });
    }

    res.json({ message: 'Действие выполнено успешно' });
  } catch (error) {
    console.error('Ошибка выполнения действия:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение жалоб
router.get('/reports', async (req, res) => {
  try {
    const { status = '', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const reports = await Reports.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'ReporterUser',
          attributes: ['login', 'email']
        },
        {
          model: User,
          as: 'ReportedUser',
          attributes: ['login', 'email']
        },
        {
          model: User,
          as: 'ResolverUser',
          attributes: ['login'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(reports);
  } catch (error) {
    console.error('Ошибка получения жалоб:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Действия с жалобами
router.post('/reports/:reportId/action', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, notes } = req.body;

    const report = await Reports.findByPk(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Жалоба не найдена' });
    }

    switch (action) {
      case 'resolve':
        await report.resolve(req.user.login, notes);
        break;
      
      case 'dismiss':
        await report.dismiss(req.user.login, notes);
        break;
      
      default:
        return res.status(400).json({ error: 'Неизвестное действие' });
    }

    res.json({ message: 'Жалоба обработана' });
  } catch (error) {
    console.error('Ошибка обработки жалобы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление настроек сайта
router.post('/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    
    // TODO: Реализовать модель Settings для хранения настроек сайта
    
    res.json({ message: 'Настройки обновлены' });
  } catch (error) {
    console.error('Ошибка обновления настроек:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение логов активности
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    // TODO: Реализовать модель Logs для хранения логов
    
    res.json([]);
  } catch (error) {
    console.error('Ошибка получения логов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Массовые действия
router.post('/bulk-action', async (req, res) => {
  try {
    const { action, type, ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Не выбраны элементы для действия' });
    }

    let affectedCount = 0;

    switch (type) {
      case 'users':
        switch (action) {
          case 'ban':
            affectedCount = await User.update(
              { banned: true },
              { where: { id: ids, is_admin: false } }
            );
            break;
          case 'unban':
            affectedCount = await User.update(
              { banned: false },
              { where: { id: ids } }
            );
            break;
          case 'delete':
            // Удаляем только не-администраторов
            const usersToDelete = await User.findAll({
              where: { id: ids, is_admin: false },
              attributes: ['login']
            });
            
            for (const user of usersToDelete) {
              await Chat.destroy({ where: { 
                [Op.or]: [
                  { from_user: user.login },
                  { to_user: user.login }
                ]
              }});
              await Likes.destroy({ where: {
                [Op.or]: [
                  { from_user: user.login },
                  { target_user: user.login }
                ]
              }});
              await Ads.destroy({ where: { author: user.login } });
            }
            
            affectedCount = await User.destroy({
              where: { id: ids, is_admin: false }
            });
            break;
        }
        break;

      case 'ads':
        switch (action) {
          case 'approve':
            affectedCount = await Ads.update(
              { status: 'approved' },
              { where: { id: ids } }
            );
            break;
          case 'reject':
            affectedCount = await Ads.update(
              { status: 'rejected' },
              { where: { id: ids } }
            );
            break;
          case 'delete':
            affectedCount = await Ads.destroy({
              where: { id: ids }
            });
            break;
        }
        break;

      default:
        return res.status(400).json({ error: 'Неизвестный тип элементов' });
    }

    res.json({ 
      message: `Действие выполнено для ${affectedCount} элементов`,
      affected_count: affectedCount 
    });
  } catch (error) {
    console.error('Ошибка массового действия:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Управление событиями
router.get('/events', async (req, res) => {
  const logger = new APILogger('ADMIN');
  
  try {
    logger.logRequest(req, 'GET /admin/events');
    
    const { search = '', status = '', approved = '', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { organizer: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status) {
      whereClause.status = status;
    }
    
    if (approved === 'true') {
      whereClause.approved = true;
    } else if (approved === 'false') {
      whereClause.approved = false;
    }

    const events = await Events.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'OrganizerUser',
          attributes: ['login', 'name', 'viptype']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalCount = await Events.count({ where: whereClause });

    logger.logSuccess(req, 200, {
      events_count: events.length,
      total_count: totalCount
    });

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отправка системных уведомлений
router.post('/notifications/broadcast', async (req, res) => {
  const logger = new APILogger('ADMIN');
  
  try {
    logger.logRequest(req, 'POST /admin/notifications/broadcast');
    
    const {
      target_users = 'all',
      title,
      message,
      type = 'system',
      priority = 'normal'
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        error: 'missing_data',
        message: 'Укажите заголовок и текст уведомления'
      });
    }

    logger.logBusinessLogic(1, 'Массовая рассылка уведомлений', {
      admin: req.user.login,
      target_users,
      type,
      priority
    }, req);

    // Отправляем всем или выбранным пользователям
    let targetUserIds = [];
    
    if (target_users === 'all') {
      const allUsers = await User.findAll({
        attributes: ['login'],
        where: { status: ['ACTIVE', 'VIP', 'PREMIUM'] }
      });
      targetUserIds = allUsers.map(u => u.login);
    } else if (Array.isArray(target_users)) {
      targetUserIds = target_users;
    }

    // Создаем уведомления для каждого пользователя
    const notifications = [];
    for (const userId of targetUserIds) {
      try {
        const notification = await Notifications.createNotification({
          user_id: userId,
          type,
          title,
          message,
          from_user: req.user.login,
          priority
        });
        notifications.push(notification);
      } catch (error) {
        console.error(`Ошибка создания уведомления для ${userId}:`, error);
      }
    }

    logger.logResult('Массовая рассылка', true, {
      sent_count: notifications.length,
      target_count: targetUserIds.length
    }, req);

    res.json({
      success: true,
      sent_count: notifications.length,
      target_count: targetUserIds.length,
      message: `Отправлено ${notifications.length} уведомлений`
    });
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Управление подписками
router.get('/subscriptions', async (req, res) => {
  const logger = new APILogger('ADMIN');
  
  try {
    logger.logRequest(req, 'GET /admin/subscriptions');
    
    const { search = '', status = '', type = '', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (search) {
      whereClause.user_id = { [Op.iLike]: `%${search}%` };
    }

    if (status) {
      whereClause.status = status;
    }
    
    if (type) {
      whereClause.subscription_type = type;
    }

    const subscriptions = await Subscriptions.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['login', 'name', 'email', 'viptype']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalCount = await Subscriptions.count({ where: whereClause });

    logger.logSuccess(req, 200, {
      subscriptions_count: subscriptions.length,
      total_count: totalCount
    });

    res.json({
      subscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;