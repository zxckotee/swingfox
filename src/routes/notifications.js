const express = require('express');
const router = express.Router();
const { Notifications, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { APILogger } = require('../utils/logger');

// GET /api/notifications - Получение уведомлений пользователя
router.get('/', authenticateToken, async (req, res) => {
  const logger = new APILogger('NOTIFICATIONS');
  
  try {
    logger.logRequest(req, 'GET /notifications');
    
    const userId = req.user.login;
    const { 
      page = 1, 
      limit = 20, 
      unread_only = false, 
      type = null 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    logger.logBusinessLogic(1, 'Получение уведомлений', {
      user_id: userId,
      page: parseInt(page),
      limit: parseInt(limit),
      unread_only,
      type
    }, req);

    const notifications = await Notifications.getUserNotifications(userId, {
      limit: parseInt(limit),
      offset,
      unreadOnly: unread_only === 'true',
      type: type || null,
      includeExpired: false
    });

    // Получаем общее количество для пагинации
    const totalCount = await Notifications.count({
      where: {
        user_id: userId,
        ...(unread_only === 'true' ? { is_read: false } : {}),
        ...(type ? { type } : {})
      }
    });

    const responseData = {
      notifications: notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        from_user: notification.from_user,
        from_user_data: notification.FromUser ? {
          login: notification.FromUser.login,
          avatar: notification.FromUser.ava
        } : null,
        target_id: notification.target_id,
        target_type: notification.target_type,
        data: notification.data,
        is_read: notification.is_read,
        priority: notification.priority,
        created_at: notification.created_at,
        expires_at: notification.expires_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };

    logger.logSuccess(req, 200, {
      notifications_count: notifications.length,
      total_count: totalCount
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении уведомлений'
    });
  }
});

// GET /api/notifications/count - Получение количества непрочитанных уведомлений
router.get('/count', authenticateToken, async (req, res) => {
  const logger = new APILogger('NOTIFICATIONS');
  
  try {
    logger.logRequest(req, 'GET /notifications/count');
    
    const userId = req.user.login;
    const { type = null } = req.query;

    logger.logBusinessLogic(1, 'Подсчет непрочитанных уведомлений', {
      user_id: userId,
      type
    }, req);

    const unreadCount = await Notifications.getUnreadCount(userId, type);

    // Получаем детализацию по типам
    const typeCounts = {};
    const notificationTypes = [
      'like', 'superlike', 'match', 'message', 'gift', 
      'profile_visit', 'image_like', 'rating', 'event_invite', 
      'system', 'warning'
    ];

    for (const notificationType of notificationTypes) {
      typeCounts[notificationType] = await Notifications.getUnreadCount(userId, notificationType);
    }

    const responseData = {
      total_unread: unreadCount,
      by_type: typeCounts
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при подсчете уведомлений'
    });
  }
});

// GET /api/notifications/unread-count - Алиас для /count (для совместимости с фронтендом)
router.get('/unread-count', authenticateToken, async (req, res) => {
  const logger = new APILogger('NOTIFICATIONS');
  
  try {
    logger.logRequest(req, 'GET /notifications/unread-count');
    
    const userId = req.user.login;
    const { type = null } = req.query;

    logger.logBusinessLogic(1, 'Подсчет непрочитанных уведомлений (unread-count)', {
      user_id: userId,
      type
    }, req);

    const unreadCount = await Notifications.getUnreadCount(userId, type);

    // Получаем детализацию по типам
    const typeCounts = {};
    const notificationTypes = [
      'like', 'superlike', 'match', 'message', 'gift', 
      'profile_visit', 'image_like', 'rating', 'event_invite', 
      'system', 'warning'
    ];

    for (const notificationType of notificationTypes) {
      typeCounts[notificationType] = await Notifications.getUnreadCount(userId, notificationType);
    }

    const responseData = {
      total_unread: unreadCount,
      by_type: typeCounts
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при подсчете уведомлений'
    });
  }
});

// PUT /api/notifications/:id/read - Пометка уведомления как прочитанного
router.put('/:id/read', authenticateToken, async (req, res) => {
  const logger = new APILogger('NOTIFICATIONS');
  
  try {
    logger.logRequest(req, 'PUT /notifications/:id/read');
    
    const { id } = req.params;
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Пометка уведомления как прочитанного', {
      user_id: userId,
      notification_id: id
    }, req);

    const notification = await Notifications.findOne({
      where: {
        id: parseInt(id),
        user_id: userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        error: 'notification_not_found',
        message: 'Уведомление не найдено'
      });
    }

    if (notification.is_read) {
      return res.json({
        success: true,
        message: 'Уведомление уже прочитано'
      });
    }

    await notification.markAsRead();
    
    logger.logResult('Пометка как прочитанное', true, {
      notification_id: id
    }, req);

    const responseData = {
      success: true,
      message: 'Уведомление помечено как прочитанное'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при обновлении уведомления'
    });
  }
});

// PUT /api/notifications/read-all - Пометка всех уведомлений как прочитанных
router.put('/read-all', authenticateToken, async (req, res) => {
  const logger = new APILogger('NOTIFICATIONS');
  
  try {
    logger.logRequest(req, 'PUT /notifications/read-all');
    
    const userId = req.user.login;
    const { type = null } = req.body;

    logger.logBusinessLogic(1, 'Пометка всех уведомлений как прочитанных', {
      user_id: userId,
      type
    }, req);

    const affectedCount = await Notifications.markAllAsRead(userId, type);
    
    logger.logResult('Пометка всех как прочитанные', true, {
      affected_count: affectedCount
    }, req);

    const responseData = {
      success: true,
      affected_count: affectedCount,
      message: `Помечено как прочитанные: ${affectedCount} уведомлений`
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при обновлении уведомлений'
    });
  }
});

// DELETE /api/notifications/:id - Удаление уведомления
router.delete('/:id', authenticateToken, async (req, res) => {
  const logger = new APILogger('NOTIFICATIONS');
  
  try {
    logger.logRequest(req, 'DELETE /notifications/:id');
    
    const { id } = req.params;
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Удаление уведомления', {
      user_id: userId,
      notification_id: id
    }, req);

    const notification = await Notifications.findOne({
      where: {
        id: parseInt(id),
        user_id: userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        error: 'notification_not_found',
        message: 'Уведомление не найдено'
      });
    }

    logger.logDatabase('DELETE', 'notifications', {
      notification_id: id,
      user_id: userId
    }, req);

    await notification.destroy();
    
    logger.logResult('Удаление уведомления', true, {
      notification_id: id
    }, req);

    const responseData = {
      success: true,
      message: 'Уведомление удалено'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при удалении уведомления'
    });
  }
});

// POST /api/notifications/system - Создание системного уведомления (только для админов)
router.post('/system', authenticateToken, async (req, res) => {
  const logger = new APILogger('NOTIFICATIONS');
  
  try {
    logger.logRequest(req, 'POST /notifications/system');
    
    const userId = req.user.login;
    const {
      target_users,  // array of user IDs or 'all'
      title,
      message,
      type = 'system',
      priority = 'normal',
      expires_at = null,
      data = null
    } = req.body;

    // Проверяем права администратора
    const user = await User.findOne({ where: { login: userId } });
    if (!user || user.status !== 'ADMIN') {
      return res.status(403).json({
        error: 'access_denied',
        message: 'Нет прав для создания системных уведомлений'
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        error: 'missing_data',
        message: 'Укажите заголовок и текст уведомления'
      });
    }

    logger.logBusinessLogic(1, 'Создание системного уведомления', {
      admin_id: userId,
      target_users,
      type,
      priority
    }, req);

    let targetUserIds = [];
    
    if (target_users === 'all') {
      // Отправить всем пользователям
      const allUsers = await User.findAll({
        attributes: ['login'],
        where: { status: ['ACTIVE', 'VIP', 'PREMIUM'] }
      });
      targetUserIds = allUsers.map(u => u.login);
    } else if (Array.isArray(target_users)) {
      targetUserIds = target_users;
    } else {
      return res.status(400).json({
        error: 'invalid_targets',
        message: 'Некорректный список получателей'
      });
    }

    // Создаем уведомления
    const notifications = [];
    for (const targetUserId of targetUserIds) {
      try {
        const notification = await Notifications.createNotification({
          user_id: targetUserId,
          type,
          title,
          message,
          from_user: userId,
          priority,
          expires_at: expires_at ? new Date(expires_at) : null,
          data
        });
        notifications.push(notification);
      } catch (error) {
        logger.logWarning(`Ошибка создания уведомления для пользователя ${targetUserId}`, error, req);
      }
    }

    logger.logResult('Создание системных уведомлений', true, {
      created_count: notifications.length,
      target_count: targetUserIds.length
    }, req);

    const responseData = {
      success: true,
      created_count: notifications.length,
      target_count: targetUserIds.length,
      message: `Создано ${notifications.length} уведомлений`
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при создании системных уведомлений'
    });
  }
});

// GET /api/notifications/cleanup - Очистка истекших уведомлений (админская функция)
router.post('/cleanup', authenticateToken, async (req, res) => {
  const logger = new APILogger('NOTIFICATIONS');
  
  try {
    logger.logRequest(req, 'POST /notifications/cleanup');
    
    const userId = req.user.login;

    // Проверяем права администратора
    const user = await User.findOne({ where: { login: userId } });
    if (!user || user.status !== 'ADMIN') {
      return res.status(403).json({
        error: 'access_denied',
        message: 'Нет прав для очистки уведомлений'
      });
    }

    logger.logBusinessLogic(1, 'Очистка истекших уведомлений', {
      admin_id: userId
    }, req);

    const deletedCount = await Notifications.cleanupExpired();
    
    logger.logResult('Очистка истекших уведомлений', true, {
      deleted_count: deletedCount
    }, req);

    const responseData = {
      success: true,
      deleted_count: deletedCount,
      message: `Удалено ${deletedCount} истекших уведомлений`
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при очистке уведомлений'
    });
  }
});

module.exports = router;