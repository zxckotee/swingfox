const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { User, Chat, Likes, Ads, Reports } = require('../models');

// Middleware для проверки прав администратора
const adminMiddleware = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }
  next();
};

// Применяем middleware ко всем роутам
router.use(authenticateToken);
router.use(adminMiddleware);

// Получение статистики
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalAds,
      pendingReports,
      todayRegistrations,
      todayMessages
    ] = await Promise.all([
      User.count(),
      User.count({ where: { banned: false } }),
      Ads.count(),
      Reports.count({ where: { status: 'pending' } }),
      User.count({
        where: {
          created_at: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      Chat.count({
        where: {
          timestamp: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    // Последняя активность
    const recentActivity = await User.findAll({
      attributes: ['login', 'last_seen', 'created_at'],
      order: [['last_seen', 'DESC']],
      limit: 10
    });

    const activityFormatted = recentActivity.map(user => ({
      user: user.login,
      timestamp: user.last_seen || user.created_at,
      action: user.last_seen ? 'Вход в систему' : 'Регистрация'
    }));

    res.json({
      total_users: totalUsers,
      active_users: activeUsers,
      total_ads: totalAds,
      pending_reports: pendingReports,
      today_registrations: todayRegistrations,
      today_messages: todayMessages,
      recent_activity: activityFormatted
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
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
        'id', 'login', 'email', 'created_at', 'last_seen', 
        'banned', 'verified', 'is_admin', 'city', 'status'
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json(users);
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Действия с пользователями
router.post('/users/:userId/action', async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Нельзя действовать с другими администраторами
    if (user.is_admin && user.id !== req.user.id) {
      return res.status(403).json({ error: 'Нельзя выполнить действие с администратором' });
    }

    switch (action) {
      case 'ban':
        await user.update({ banned: true });
        break;
      
      case 'unban':
        await user.update({ banned: false });
        break;
      
      case 'verify':
        await user.update({ verified: true });
        break;
      
      case 'delete':
        // Удаляем связанные данные
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
        await user.destroy();
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

module.exports = router;