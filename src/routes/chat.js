const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Op } = require('sequelize');
const { Chat, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');

// Настройка multer для загрузки изображений в чат
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/uploads');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `chat_${generateId()}.${file.mimetype.split('/')[1]}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Можно загружать только изображения'));
    }
  }
});

// Хранилище для статусов пользователей (в продакшене использовать Redis)
const userStatuses = new Map();

// GET /api/chat/:username - Получение истории чата
router.get('/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = req.user.login;
    const { limit = 50, offset = 0 } = req.query;

    // Проверяем существование собеседника
    const targetUser = await User.findOne({ where: { login: username } });
    if (!targetUser) {
      return res.status(404).json({ 
        error: 'user_not_found',
        message: 'Пользователь не найден' 
      });
    }

    // Получаем сообщения
    const messages = await Chat.findAll({
      where: {
        [Op.or]: [
          { by_user: currentUser, to_user: username },
          { by_user: username, to_user: currentUser }
        ]
      },
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Отмечаем входящие сообщения как прочитанные
    await Chat.update(
      { is_read: true },
      {
        where: {
          by_user: username,
          to_user: currentUser,
          is_read: false
        }
      }
    );

    // Форматируем сообщения
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      by_user: msg.by_user,
      to_user: msg.to_user,
      message: msg.message,
      images: msg.images && msg.images !== '0' && msg.images !== 'null' ? 
        msg.images.split('&&').filter(Boolean) : [],
      date: msg.date,
      is_read: msg.is_read,
      is_mine: msg.by_user === currentUser
    }));

    // Получаем информацию о собеседнике
    const companionInfo = {
      login: targetUser.login,
      ava: targetUser.ava,
      status: targetUser.status,
      online: targetUser.online,
      viptype: targetUser.viptype
    };

    res.json({
      success: true,
      messages: formattedMessages.reverse(), // Возвращаем в хронологическом порядке
      companion: companionInfo,
      total_count: messages.length
    });

  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении сообщений' 
    });
  }
});

// POST /api/chat/send - Отправка сообщения
router.post('/send', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const { to_user, message } = req.body;
    const fromUser = req.user.login;

    if (!to_user) {
      return res.status(400).json({ 
        error: 'missing_recipient',
        message: 'Не указан получатель' 
      });
    }

    if (!message && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ 
        error: 'empty_message',
        message: 'Сообщение не может быть пустым' 
      });
    }

    // Проверяем существование получателя
    const recipient = await User.findOne({ where: { login: to_user } });
    if (!recipient) {
      // Удаляем загруженные файлы
      if (req.files) {
        for (const file of req.files) {
          try {
            await fs.unlink(file.path);
          } catch (err) {
            console.error('Error deleting file:', err);
          }
        }
      }
      
      return res.status(404).json({ 
        error: 'recipient_not_found',
        message: 'Получатель не найден' 
      });
    }

    // Обрабатываем загруженные изображения
    let imagesList = [];
    if (req.files && req.files.length > 0) {
      imagesList = req.files.map(file => file.filename);
    }

    // Создаем сообщение
    const messageId = generateId();
    const chatMessage = await Chat.create({
      id: messageId,
      by_user: fromUser,
      to_user: to_user,
      message: message || '',
      images: imagesList.length > 0 ? imagesList.join('&&') : null,
      date: new Date(),
      is_read: false
    });

    // Форматируем ответ
    const responseMessage = {
      id: chatMessage.id,
      by_user: chatMessage.by_user,
      to_user: chatMessage.to_user,
      message: chatMessage.message,
      images: imagesList,
      date: chatMessage.date,
      is_read: chatMessage.is_read
    };

    res.json({
      success: true,
      message: 'Сообщение отправлено',
      data: responseMessage
    });

  } catch (error) {
    console.error('Send message error:', error);
    
    // Удаляем загруженные файлы при ошибке
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }
    }

    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при отправке сообщения' 
    });
  }
});

// GET /api/chat/status/:username - Получение статуса пользователя
router.get('/status/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = req.user.login;

    // Обновляем свой статус как "онлайн"
    userStatuses.set(currentUser, {
      status: 'online',
      timestamp: Date.now()
    });

    // Получаем статус собеседника
    const companionStatus = userStatuses.get(username);
    const now = Date.now();

    let status = 'offline';
    
    if (companionStatus) {
      const timeDiff = now - companionStatus.timestamp;
      
      if (timeDiff <= 2000) { // 2 секунды
        if (companionStatus.status === 'typing') {
          status = 'печатает...';
        } else {
          status = 'онлайн';
        }
      } else if (timeDiff <= 300000) { // 5 минут
        status = 'онлайн';
      } else {
        // Получаем последнее время активности из базы
        const user = await User.findOne({ where: { login: username } });
        if (user && user.online) {
          const lastOnline = new Date(user.online);
          status = `был ${lastOnline.toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}`;
        }
      }
    }

    res.json({
      username,
      status,
      timestamp: now
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении статуса' 
    });
  }
});

// POST /api/chat/typing - Уведомление о печати
router.post('/typing', authenticateToken, async (req, res) => {
  try {
    const { to_user, is_typing } = req.body;
    const currentUser = req.user.login;

    if (!to_user) {
      return res.status(400).json({ 
        error: 'missing_recipient',
        message: 'Не указан получатель' 
      });
    }

    // Обновляем статус
    userStatuses.set(currentUser, {
      status: is_typing ? 'typing' : 'online',
      timestamp: Date.now(),
      to: to_user
    });

    res.json({
      success: true,
      message: 'Статус обновлен'
    });

  } catch (error) {
    console.error('Typing status error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при обновлении статуса печати' 
    });
  }
});

// GET /api/chat/unread-count - Получение количества непрочитанных сообщений
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user.login;

    const unreadCount = await Chat.count({
      where: {
        to_user: currentUser,
        is_read: false
      }
    });

    res.json({
      success: true,
      unread_count: unreadCount
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении количества непрочитанных сообщений' 
    });
  }
});

// GET /api/chat/conversations - Получение списка всех чатов
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user.login;
    const { limit = 20, offset = 0 } = req.query;

    // Получаем список уникальных собеседников с последними сообщениями
    const conversations = await Chat.findAll({
      where: {
        [Op.or]: [
          { by_user: currentUser },
          { to_user: currentUser }
        ]
      },
      order: [['date', 'DESC']],
      limit: parseInt(limit) * 10, // Берем больше для фильтрации
    });

    // Группируем по собеседникам
    const conversationMap = new Map();
    
    for (const msg of conversations) {
      const companion = msg.by_user === currentUser ? msg.to_user : msg.by_user;
      
      if (!conversationMap.has(companion)) {
        // Получаем количество непрочитанных от этого собеседника
        const unreadCount = await Chat.count({
          where: {
            by_user: companion,
            to_user: currentUser,
            is_read: false
          }
        });

        conversationMap.set(companion, {
          companion,
          last_message: msg.message,
          last_message_date: msg.date,
          last_message_by: msg.by_user,
          unread_count: unreadCount,
          has_images: msg.images && msg.images !== '0' && msg.images !== 'null'
        });
      }
    }

    // Получаем информацию о собеседниках
    const companionLogins = Array.from(conversationMap.keys());
    const companionUsers = await User.findAll({
      where: { login: companionLogins },
      attributes: ['login', 'ava', 'status', 'online', 'viptype']
    });

    // Формируем финальный список
    const conversationsList = Array.from(conversationMap.values())
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
      .map(conv => {
        const companionInfo = companionUsers.find(u => u.login === conv.companion);
        return {
          ...conv,
          companion_info: companionInfo || {
            login: conv.companion,
            ava: 'no_photo.jpg',
            status: 'Неизвестно',
            online: null,
            viptype: 'FREE'
          }
        };
      });

    res.json({
      success: true,
      conversations: conversationsList,
      total_count: conversationMap.size
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении списка чатов' 
    });
  }
});

// DELETE /api/chat/:username - Удаление всей истории чата
router.delete('/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = req.user.login;

    // Удаляем все сообщения между пользователями
    const deletedCount = await Chat.destroy({
      where: {
        [Op.or]: [
          { by_user: currentUser, to_user: username },
          { by_user: username, to_user: currentUser }
        ]
      }
    });

    res.json({
      success: true,
      message: 'История чата удалена',
      deleted_messages: deletedCount
    });

  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при удалении чата' 
    });
  }
});

// Очистка старых статусов каждые 30 секунд
setInterval(() => {
  const now = Date.now();
  for (const [user, status] of userStatuses.entries()) {
    if (now - status.timestamp > 300000) { // 5 минут
      userStatuses.delete(user);
    }
  }
}, 30000);

module.exports = router;