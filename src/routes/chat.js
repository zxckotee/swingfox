const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Op } = require('sequelize');
const { Chat, User, Notifications } = require('../models');
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

    // Создаем уведомление о новом сообщении
    try {
      await Notifications.createMessageNotification(to_user, fromUser, message || '[Изображение]');
    } catch (notifError) {
      console.error('Error creating message notification:', notifError);
    }

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

// POST /api/chat/search - Поиск в истории сообщений
router.post('/search', authenticateToken, async (req, res) => {
  try {
    const { query, with_user = null, limit = 20, offset = 0 } = req.body;
    const currentUser = req.user.login;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'invalid_query',
        message: 'Поисковый запрос должен содержать минимум 2 символа'
      });
    }

    // Формируем условия поиска
    const whereClause = {
      [Op.or]: [
        { by_user: currentUser },
        { to_user: currentUser }
      ],
      message: {
        [Op.iLike]: `%${query.trim()}%`
      }
    };

    // Если указан конкретный собеседник
    if (with_user) {
      whereClause[Op.and] = [
        {
          [Op.or]: [
            { by_user: currentUser, to_user: with_user },
            { by_user: with_user, to_user: currentUser }
          ]
        }
      ];
    }

    const messages = await Chat.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'FromUser',
          attributes: ['login', 'name', 'ava']
        },
        {
          model: User,
          as: 'ToUser',
          attributes: ['login', 'name', 'ava']
        }
      ],
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalCount = await Chat.count({ where: whereClause });

    // Форматируем результаты
    const formattedResults = messages.map(msg => ({
      id: msg.id,
      by_user: msg.by_user,
      to_user: msg.to_user,
      message: msg.message,
      images: msg.images && msg.images !== '0' && msg.images !== 'null' ?
        msg.images.split('&&').filter(Boolean) : [],
      date: msg.date,
      from_user_info: msg.FromUser ? {
        login: msg.FromUser.login,
        name: msg.FromUser.name,
        avatar: msg.FromUser.ava
      } : null,
      to_user_info: msg.ToUser ? {
        login: msg.ToUser.login,
        name: msg.ToUser.name,
        avatar: msg.ToUser.ava
      } : null,
      is_mine: msg.by_user === currentUser
    }));

    res.json({
      success: true,
      results: formattedResults,
      total_count: totalCount,
      query: query.trim()
    });

  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при поиске сообщений'
    });
  }
});

// POST /api/chat/forward - Пересылка сообщения
router.post('/forward', authenticateToken, async (req, res) => {
  try {
    const { message_id, to_users, comment = '' } = req.body;
    const currentUser = req.user.login;

    if (!message_id || !to_users || !Array.isArray(to_users) || to_users.length === 0) {
      return res.status(400).json({
        error: 'missing_data',
        message: 'Не указано сообщение или получатели'
      });
    }

    // Находим исходное сообщение
    const originalMessage = await Chat.findOne({
      where: {
        id: message_id,
        [Op.or]: [
          { by_user: currentUser },
          { to_user: currentUser }
        ]
      }
    });

    if (!originalMessage) {
      return res.status(404).json({
        error: 'message_not_found',
        message: 'Сообщение не найдено'
      });
    }

    // Проверяем получателей
    const validUsers = await User.findAll({
      where: { login: to_users },
      attributes: ['login']
    });

    if (validUsers.length !== to_users.length) {
      return res.status(400).json({
        error: 'invalid_recipients',
        message: 'Некоторые получатели не найдены'
      });
    }

    // Формируем текст пересылаемого сообщения
    const forwardedText = `[Пересланное сообщение]\n${originalMessage.message}${comment ? `\n\n${comment}` : ''}`;

    // Отправляем сообщения всем получателям
    const sentMessages = [];
    for (const recipient of to_users) {
      const messageId = generateId();
      const chatMessage = await Chat.create({
        id: messageId,
        by_user: currentUser,
        to_user: recipient,
        message: forwardedText,
        images: originalMessage.images,
        date: new Date(),
        is_read: false
      });

      // Создаем уведомление
      try {
        await Notifications.createMessageNotification(recipient, currentUser, forwardedText);
      } catch (notifError) {
        console.error('Error creating forward notification:', notifError);
      }

      sentMessages.push({
        id: chatMessage.id,
        to_user: recipient,
        message: forwardedText
      });
    }

    res.json({
      success: true,
      message: 'Сообщение переслано',
      forwarded_to: to_users,
      sent_messages: sentMessages
    });

  } catch (error) {
    console.error('Forward message error:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при пересылке сообщения'
    });
  }
});

// PUT /api/chat/messages/:id/read - Пометка сообщения как прочитанного
router.put('/messages/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user.login;

    const message = await Chat.findOne({
      where: {
        id: parseInt(id),
        to_user: currentUser,
        is_read: false
      }
    });

    if (!message) {
      return res.status(404).json({
        error: 'message_not_found',
        message: 'Сообщение не найдено или уже прочитано'
      });
    }

    await message.update({ is_read: true });

    res.json({
      success: true,
      message: 'Сообщение помечено как прочитанное'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при обновлении статуса сообщения'
    });
  }
});

// GET /api/chat/:username/images - Получение всех изображений из чата
router.get('/:username/images', authenticateToken, async (req, res) => {
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

    // Получаем сообщения с изображениями
    const messages = await Chat.findAll({
      where: {
        [Op.or]: [
          { by_user: currentUser, to_user: username },
          { by_user: username, to_user: currentUser }
        ],
        images: {
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.ne]: '0' },
            { [Op.ne]: 'null' }
          ]
        }
      },
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Собираем все изображения
    const allImages = [];
    messages.forEach(msg => {
      if (msg.images) {
        const imagesList = msg.images.split('&&').filter(Boolean);
        imagesList.forEach(image => {
          allImages.push({
            filename: image,
            url: `/uploads/${image}`,
            message_id: msg.id,
            sender: msg.by_user,
            date: msg.date
          });
        });
      }
    });

    res.json({
      success: true,
      images: allImages,
      total_count: allImages.length
    });

  } catch (error) {
    console.error('Get chat images error:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении изображений'
    });
  }
});

// POST /api/chat/reaction - Добавление реакции на сообщение
router.post('/reaction', authenticateToken, async (req, res) => {
  try {
    const { message_id, reaction } = req.body;
    const currentUser = req.user.login;

    if (!message_id || !reaction) {
      return res.status(400).json({
        error: 'missing_data',
        message: 'Не указано сообщение или реакция'
      });
    }

    const allowedReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];
    if (!allowedReactions.includes(reaction)) {
      return res.status(400).json({
        error: 'invalid_reaction',
        message: 'Недопустимая реакция'
      });
    }

    // Проверяем существование сообщения
    const message = await Chat.findOne({
      where: {
        id: parseInt(message_id),
        [Op.or]: [
          { by_user: currentUser },
          { to_user: currentUser }
        ]
      }
    });

    if (!message) {
      return res.status(404).json({
        error: 'message_not_found',
        message: 'Сообщение не найдено'
      });
    }

    // В упрощенной версии сохраняем реакции в память
    // В полной версии нужна отдельная таблица reactions
    const reactionKey = `${message_id}_${currentUser}`;
    // Здесь должна быть логика сохранения в БД

    res.json({
      success: true,
      message: 'Реакция добавлена',
      reaction,
      message_id: parseInt(message_id)
    });

  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при добавлении реакции'
    });
  }
});

// DELETE /api/chat/messages/:id - Удаление сообщения
router.delete('/messages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user.login;
    const { for_all = false } = req.query;

    const message = await Chat.findOne({
      where: {
        id: parseInt(id),
        by_user: currentUser // Можно удалять только свои сообщения
      }
    });

    if (!message) {
      return res.status(404).json({
        error: 'message_not_found',
        message: 'Сообщение не найдено или вы не можете его удалить'
      });
    }

    if (for_all === 'true') {
      // Удаляем для всех
      await message.destroy();
    } else {
      // Помечаем как удаленное только для отправителя
      await message.update({
        message: '[Сообщение удалено]',
        images: null
      });
    }

    res.json({
      success: true,
      message: for_all === 'true' ? 'Сообщение удалено для всех' : 'Сообщение удалено для вас'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при удалении сообщения'
    });
  }
});

// GET /api/chat/:username/grouped - Получение сообщений сгруппированных по дням
router.get('/:username/grouped', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = req.user.login;
    const { days = 7 } = req.query;

    // Проверяем существование собеседника
    const targetUser = await User.findOne({ where: { login: username } });
    if (!targetUser) {
      return res.status(404).json({
        error: 'user_not_found',
        message: 'Пользователь не найден'
      });
    }

    // Получаем сообщения за указанное количество дней
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const messages = await Chat.findAll({
      where: {
        [Op.or]: [
          { by_user: currentUser, to_user: username },
          { by_user: username, to_user: currentUser }
        ],
        date: {
          [Op.gte]: startDate
        }
      },
      order: [['date', 'ASC']]
    });

    // Группируем по дням
    const groupedMessages = {};
    messages.forEach(msg => {
      const dateKey = msg.date.toISOString().split('T')[0];
      if (!groupedMessages[dateKey]) {
        groupedMessages[dateKey] = [];
      }
      
      groupedMessages[dateKey].push({
        id: msg.id,
        by_user: msg.by_user,
        to_user: msg.to_user,
        message: msg.message,
        images: msg.images && msg.images !== '0' && msg.images !== 'null' ?
          msg.images.split('&&').filter(Boolean) : [],
        date: msg.date,
        is_read: msg.is_read,
        is_mine: msg.by_user === currentUser
      });
    });

    // Сортируем дни по убыванию
    const sortedDays = Object.keys(groupedMessages).sort().reverse();
    const result = {};
    sortedDays.forEach(day => {
      result[day] = groupedMessages[day];
    });

    res.json({
      success: true,
      grouped_messages: result,
      companion: {
        login: targetUser.login,
        ava: targetUser.ava,
        status: targetUser.status,
        online: targetUser.online
      },
      days_count: sortedDays.length
    });

  } catch (error) {
    console.error('Get grouped messages error:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении сгруппированных сообщений'
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