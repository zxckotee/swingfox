const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { Chat, User, Notifications, EventParticipants } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');
const MatchChecker = require('../utils/matchChecker');
const { APILogger } = require('../utils/logger');
const Likes = require('../models/Likes');

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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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

// Feature flag для системы мэтчей (можно отключить для отладки)
const ENABLE_MATCH_CHECKING = process.env.ENABLE_MATCH_CHECKING !== 'false';

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
    
    console.log('Conversations for user:', currentUser, 'found:', conversations.length);
    console.log('Sample conversations:', conversations.slice(0, 5).map(c => ({
      id: c.id,
      by_user: c.by_user,
      to_user: c.to_user,
      message: c.message?.substring(0, 30),
      is_club_chat: c.is_club_chat,
      club_id: c.club_id
    })));

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

// GET /api/chat/status/:username - Получение статуса пользователя
router.get('/status/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = req.user.login;

    // Получаем статус собеседника через модель Status
    const { Status } = require('../models');
    const companionStatus = await Status.getUserStatus(username, 300); // 5 минут

    res.json({
      username,
      status: companionStatus.message,
      last_seen: companionStatus.last_seen,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении статуса' 
    });
  }
});

// GET /api/chat/debug/online-status - Отладочный endpoint для проверки онлайн статуса
router.get('/debug/online-status', authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user.login;
    const { Status } = require('../models');
    
    // Получаем свой статус
    const myStatus = await Status.getUserStatus(currentUser, 300);
    
    // Получаем список онлайн пользователей
    const onlineUsers = await Status.getOnlineUsers(300);
    
    res.json({
      current_user: currentUser,
      my_status: myStatus,
      online_users: onlineUsers,
      total_online: onlineUsers.length,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Debug online status error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении отладочной информации' 
    });
  }
});

// GET /api/chat/:username - Получение истории чата
router.get('/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = req.user.login;
    const { limit = 50, offset = 0 } = req.query;

    // Проверяем, является ли это чатом с клубом
    const isClubChatParam = username.startsWith('club_');
    
    let targetUser = null;
    if (isClubChatParam) {
      // Для клубных чатов создаем фиктивный объект пользователя
      const clubId = username.replace('club_', '');
      targetUser = { 
        login: username, 
        ava: null, 
        status: 'Клуб', 
        online: null, 
        viptype: 'CLUB' 
      };
    } else {
      // Для обычных пользователей ищем в базе данных
      targetUser = await User.findOne({ where: { login: username } });
      if (!targetUser) {
        return res.status(404).json({
          error: 'user_not_found',
          message: 'Пользователь не найден'
        });
      }
    }

    // Проверяем разрешение на просмотр чата (с fallback'ом)
    let matchStatus = null;

    // Проверяем, является ли это чатом с клубом
    const isClubChat = username.startsWith('club_');
    
    let messages;
    if (isClubChat) {
      // Для чата с клубом получаем сообщения между пользователем и клубом
      const clubId = username.replace('club_', '');
      console.log('Getting club chat messages for:', { currentUser, clubId, username });
      
      // Ищем сообщения между пользователем и клубом
      // Используем тот же подход, что и в клубном API
      messages = await Chat.findAll({
        where: {
          club_id: clubId,
          chat_type: 'event',
          [Op.or]: [
            // Основные комбинации: пользователь <-> клуб
            { by_user: currentUser, to_user: username },
            { by_user: username, to_user: currentUser },
            // Дополнительные комбинации для совместимости
            { by_user: currentUser, to_user: clubId },
            { by_user: clubId, to_user: currentUser },
            // Сообщения от бота
            { by_user: 'bot', to_user: currentUser }
          ]
        },
        order: [['date', 'DESC']],
        limit: 100
      });
      
      console.log('Club chat messages found:', messages.length);
      console.log('Sample messages:', messages.slice(0, 5).map(m => ({
        id: m.id,
        by_user: m.by_user,
        to_user: m.to_user,
        message: m.message?.substring(0, 30)
      })));
    } else {
      // Для обычного чата между пользователями
      messages = await Chat.findAll({
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
    }

    // Отмечаем входящие сообщения как прочитанные
    if (isClubChat) {
      // Для чата с клубом отмечаем сообщения от клуба и бота
      const clubId = username.replace('club_', '');
      await Chat.update(
        { is_read: true },
        {
          where: {
            club_id: clubId,
            chat_type: 'event',
            [Op.or]: [
              { by_user: username, to_user: currentUser, is_read: false },
              { by_user: clubId, to_user: currentUser, is_read: false },
              { by_user: 'bot', to_user: currentUser, is_read: false }
            ]
          }
        }
      );
    } else {
      // Для обычного чата между пользователями
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
    }

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
      is_mine: msg.by_user === currentUser,
      is_from_bot: msg.by_user === 'bot',
      is_from_club: msg.by_user.startsWith('club_'),
      is_from_user: !msg.by_user.startsWith('club_') && msg.by_user !== 'bot'
    }));

    // Проверяем матч только если нет существующих сообщений и это не клубный чат
    if (ENABLE_MATCH_CHECKING && !isClubChat && formattedMessages.length === 0) {
      try {
        const viewPermission = await MatchChecker.canViewChat(currentUser, username);
        matchStatus = await MatchChecker.getMatchStatus(currentUser, username);
        
        console.log('Chat view permission checked:', {
          currentUser,
          chatPartner: username,
          allowed: viewPermission.allowed,
          hasMatch: viewPermission.hasMatch,
          canReply: viewPermission.canReply
        });
      } catch (error) {
        console.error('Match checking failed in chat view:', {
          currentUser,
          chatPartner: username,
          error: error.message
        });
        // Продолжаем без проверки мэтча
      }
    }

    // Получаем информацию о собеседнике с правильным онлайн статусом
    const { Status } = require('../models');
    const userStatus = await Status.getUserStatus(targetUser.login, 300); // 5 минут
    
    const companionInfo = {
      login: targetUser.login,
      ava: targetUser.ava,
      status: targetUser.status,
      online: userStatus.status === 'online' ? userStatus.last_seen : null,
      viptype: targetUser.viptype
    };

    res.json({
      success: true,
      messages: formattedMessages.reverse(), // Возвращаем в хронологическом порядке
      companion: companionInfo,
      total_count: messages.length,
      match_status: matchStatus, // Информация о мэтче для UI
      match_checking_enabled: ENABLE_MATCH_CHECKING
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
    const { to_user, message, source } = req.body;
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

    // Проверяем, является ли это чатом с клубом
    const isClubChat = to_user.startsWith('club_') || fromUser.startsWith('club_');
    let eventId = null;
    
    if (isClubChat) {
      // Для чата с клубом проверяем, есть ли уже существующий чат
      const clubId = (to_user.startsWith('club_') ? to_user : fromUser).replace('club_', '');
      const existingChat = await Chat.findOne({
        where: {
          [Op.or]: [
            { by_user: fromUser, to_user: to_user },
            { by_user: to_user, to_user: fromUser }
          ],
          [Op.or]: [
            { is_club_chat: true },
            { club_id: clubId, chat_type: 'event' }
          ]
        },
        order: [['date', 'DESC']]
      });
      
      if (existingChat) {
        // Если чат уже существует, используем event_id из существующего чата
        eventId = existingChat.event_id;
      } else {
        // Если это первый чат с клубом, event_id обязателен
        const { event_id } = req.body;
        if (!event_id) {
          return res.status(400).json({
            error: 'missing_event_id',
            message: 'Для первого сообщения в клубном чате необходимо указать event_id'
          });
        }
        eventId = event_id;
      }
    }

    // Проверяем существование получателя
    let recipient = null;
    
    if (isClubChat) {
      // Для клубных чатов проверяем существование клуба
      const { Clubs } = require('../models');
      const clubId = (to_user.startsWith('club_') ? to_user : fromUser).replace('club_', '');
      const club = await Clubs.findByPk(clubId);
      if (!club) {
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
          message: 'Клуб не найден'
        });
      }
      // Создаем фиктивный объект получателя для клуба
      recipient = { login: to_user.startsWith('club_') ? to_user : fromUser, privacy_settings: { privacy: { allow_messages: true } } };
    } else {
      // Для обычных пользователей ищем в таблице User
      recipient = await User.findOne({ where: { login: to_user } });
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
    }

    // Проверяем настройки приватности получателя
    if (recipient.privacy_settings?.privacy?.allow_messages === false) {
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
      
      return res.status(403).json({
        error: 'messages_not_allowed',
        message: 'Получатель не разрешает отправку сообщений'
      });
    }

    // Проверяем разрешение на отправку сообщения (с fallback'ом)
    let sendAllowed = true;
    let matchWarning = null;
    
    // Для общения по объявлениям и клубных чатов не проверяем матч
    if (ENABLE_MATCH_CHECKING && source !== 'ad' && !isClubChat) {
      try {
        // Сначала проверяем, существует ли уже диалог между пользователями
        const existingChat = await Chat.findOne({
          where: {
            [Op.or]: [
              { by_user: fromUser, to_user: to_user },
              { by_user: to_user, to_user: fromUser }
            ]
          },
          order: [['date', 'DESC']]
        });
        
        // Если диалог уже существует, разрешаем отправку без проверки мэтча
        if (existingChat) {
          console.log('Message sending allowed - existing conversation:', {
            fromUser,
            toUser: to_user,
            reason: 'existing_conversation',
            lastMessageDate: existingChat.date
          });
        } else {
          // Если диалога нет, проверяем мэтч
          const permission = await MatchChecker.canSendMessage(fromUser, to_user);
          
          if (!permission.allowed) {
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
            
            console.warn('Message sending blocked due to no match:', {
              fromUser,
              toUser: to_user,
              reason: permission.reason
            });
            
            return res.status(403).json({
              error: permission.reason,
              message: permission.message,
              match_data: permission.matchData
            });
          }
          
          // Записываем в лог успешную проверку
          console.log('Message sending allowed:', {
            fromUser,
            toUser: to_user,
            reason: permission.reason,
            hasMatch: permission.matchData?.hasMatch
          });
          
          if (permission.reason === 'fallback_allow') {
            matchWarning = 'Отправлено без проверки мэтча (технические неполадки)';
          }
        }
        
      } catch (error) {
        console.error('Match checking failed in send message:', {
          fromUser,
          toUser: to_user,
          error: error.message
        });
        // Продолжаем отправку в случае ошибки
        matchWarning = 'Проверка мэтча недоступна';
      }
    } else if (source === 'ad') {
      console.log('Message sending allowed for ad conversation:', {
        fromUser,
        toUser: to_user,
        source: 'ad'
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
      is_read: false,
      ...(isClubChat && {
        is_club_chat: true,
        club_id: (to_user.startsWith('club_') ? to_user : fromUser).replace('club_', ''),
        chat_type: 'event',
        event_id: eventId
      })
    });

    // Создаем уведомление о новом сообщении
    try {
      await Notifications.createMessageNotification(to_user, fromUser, message || '[Изображение]');
    } catch (notifError) {
      console.error('Error creating message notification:', notifError);
    }

    // Отправляем сообщение через WebSocket
    const io = req.app.get('io');
    if (io) {
      if (isClubChat) {
        // Для клубного чата
        const clubId = to_user.replace('club_', '');
        const roomName = `club-chat-${clubId}-${eventId}-${fromUser}`;
        io.to(roomName).emit('club-chat-message', {
          id: messageId,
          message: message || '[Изображение]',
          by_user: fromUser,
          to_user: to_user,
          created_at: chatMessage.created_at,
          senderType: 'user',
          clubId: clubId,
          eventId: eventId,
          userId: fromUser,
          images: imagesList
        });
      } else {
        // Для обычного чата между пользователями
        const roomName = `user-chat-${fromUser}-${to_user}`;
        io.to(roomName).emit('user-chat-message', {
          id: messageId,
          message: message || '[Изображение]',
          by_user: fromUser,
          to_user: to_user,
          created_at: chatMessage.created_at,
          images: imagesList
        });
      }
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
      data: responseMessage,
      match_warning: matchWarning,
      match_checking_enabled: ENABLE_MATCH_CHECKING
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

    // Обрабатываем ошибки multer
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'too_many_files',
        message: 'Можно прикрепить максимум 5 файлов за раз'
      });
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'file_too_large',
        message: 'Размер файла не должен превышать 10MB'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'unexpected_file',
        message: 'Недопустимый тип файла. Можно загружать только изображения'
      });
    }

    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при отправке сообщения' 
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

// GET /api/chat/match-status/:username - Получение статуса мэтча с пользователем
router.get('/match-status/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = req.user.login;

    // Проверяем существование пользователя
    const targetUser = await User.findOne({ where: { login: username } });
    if (!targetUser) {
      return res.status(404).json({
        error: 'user_not_found',
        message: 'Пользователь не найден'
      });
    }

    // Проверяем взаимные лайки
    const myLike = await Likes.findOne({
      where: {
        like_from: currentUser,
        like_to: username
      }
    });

    const theirLike = await Likes.findOne({
      where: {
        like_from: username,
        like_to: currentUser
      }
    });

    const hasMatch = myLike && theirLike;
    
    // Проверяем наличие сообщений между пользователями
    const hasMessages = await Chat.findOne({
      where: {
        [Op.or]: [
          { by_user: currentUser, to_user: username },
          { by_user: username, to_user: currentUser }
        ]
      }
    });

    // Можно писать в чат если есть мэтч ИЛИ есть сообщения
    const canChat = hasMatch || hasMessages;

    let status = 'no_match';
    let message = 'Нет взаимной симпатии';
    let icon = '💔';

    if (hasMatch) {
      status = 'match';
      message = 'Взаимная симпатия! Можно общаться';
      icon = '💕';
    } else if (hasMessages) {
      status = 'has_messages';
      message = 'Есть история сообщений, можно общаться';
      icon = '💬';
    } else if (myLike && !theirLike) {
      status = 'liked';
      message = 'Вы поставили лайк, ждем ответа';
      icon = '❤️';
    } else if (!myLike && theirLike) {
      status = 'liked_by';
      message = 'Вам поставили лайк, поставьте в ответ';
      icon = '💝';
    }

    res.json({
      success: true,
      status,
      message,
      icon,
      hasMatch: !!hasMatch,
      hasMessages: !!hasMessages,
      canChat: !!canChat,
      matchData: {
        hasMatch: !!hasMatch,
        hasMessages: !!hasMessages,
        myLike: !!myLike,
        theirLike: !!theirLike
      }
    });

  } catch (error) {
    console.error('Get match status error:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении статуса мэтча'
    });
  }
});

// GET /api/chat/event-participation-status/:clubId/:eventId - Получение статуса участия в мероприятии
router.get('/event-participation-status/:clubId/:eventId', authenticateToken, async (req, res) => {
  try {
    const { clubId, eventId } = req.params;
    const currentUser = req.user.login;

    // Получаем ID пользователя по логину
    const user = await User.findOne({
      where: { login: currentUser },
      attributes: ['id']
    });

    if (!user) {
      return res.status(404).json({
        error: 'user_not_found',
        message: 'Пользователь не найден'
      });
    }

    // Проверяем участие в мероприятии
    const participation = await EventParticipants.findOne({
      where: {
        event_id: eventId,
        user_id: user.id
      }
    });

    let status = 'not_participant';
    let message = 'Вы не участвуете в этом мероприятии';
    let icon = '❌';
    let canChat = false;

    if (participation) {
      switch (participation.status) {
        case 'confirmed':
          status = 'confirmed';
          message = 'Вы участвуете в мероприятии! Можете общаться с клубом';
          icon = '✅';
          canChat = true;
          break;
        case 'invited':
          status = 'invited';
          message = 'Вас пригласили на мероприятие. Подтвердите участие';
          icon = '📨';
          canChat = false;
          break;
        case 'declined':
          status = 'declined';
          message = 'Вы отказались от участия в мероприятии';
          icon = '❌';
          canChat = false;
          break;
        case 'maybe':
          status = 'maybe';
          message = 'Вы рассматриваете участие в мероприятии';
          icon = '🤔';
          canChat = true;
          break;
      }
    }

    res.json({
      success: true,
      status,
      message,
      icon,
      canChat,
      participationData: {
        isParticipant: !!participation,
        status: participation?.status || null,
        eventId: parseInt(eventId),
        clubId: parseInt(clubId)
      }
    });

  } catch (error) {
    console.error('Get event participation status error:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении статуса участия в мероприятии'
    });
  }
});

// GET /api/chat/can-message/:username - Проверка разрешения на отправку сообщений
router.get('/can-message/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = req.user.login;

    // Проверяем существование пользователя
    const targetUser = await User.findOne({ where: { login: username } });
    if (!targetUser) {
      return res.status(404).json({
        error: 'user_not_found',
        message: 'Пользователь не найден'
      });
    }

    // Проверяем взаимные лайки
    const myLike = await Likes.findOne({
      where: {
        like_from: currentUser,
        like_to: username
      }
    });

    const theirLike = await Likes.findOne({
      where: {
        like_from: username,
        like_to: currentUser
      }
    });

    const hasMatch = myLike && theirLike;
    const canMessage = hasMatch;

    res.json({
      success: true,
      canMessage,
      hasMatch,
      reason: hasMatch ? 'match' : 'no_match',
      message: hasMatch ? 'Можно отправлять сообщения' : 'Нужна взаимная симпатия',
      matchData: {
        hasMatch,
        myLike: !!myLike,
        theirLike: !!theirLike
      }
    });

  } catch (error) {
    console.error('Check message permission error:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при проверке разрешения на отправку сообщений'
    });
  }
});

// POST /api/chat/club-event - Создание чата с клубом по мероприятию
router.post('/club-event', authenticateToken, async (req, res) => {
  try {
    const { club_id, event_id, message } = req.body;
    const fromUser = req.user.login;

    if (!club_id || !event_id || !message) {
      return res.status(400).json({
        error: 'missing_data',
        message: 'Не указаны обязательные параметры'
      });
    }

    // Получаем ID пользователя по логину
    const user = await User.findOne({
      where: { login: fromUser },
      attributes: ['id']
    });

    if (!user) {
      return res.status(404).json({
        error: 'user_not_found',
        message: 'Пользователь не найден'
      });
    }

    // Проверяем, что пользователь участвует в мероприятии
    const participation = await EventParticipants.findOne({
      where: {
        event_id: event_id,
        user_id: user.id,
        status: 'confirmed'
      }
    });

    if (!participation) {
      return res.status(403).json({
        error: 'not_participant',
        message: 'Вы не участвуете в этом мероприятии'
      });
    }

    // Создаем чат с клубом
    const chatMessage = await Chat.createClubEventChat(fromUser, club_id, event_id, message);

    res.json({
      success: true,
      message: 'Сообщение отправлено клубу',
      data: {
        id: chatMessage.id,
        by_user: chatMessage.by_user,
        to_user: chatMessage.to_user,
        message: chatMessage.message,
        date: chatMessage.date,
        club_id: club_id,
        event_id: event_id
      }
    });

  } catch (error) {
    console.error('Create club event chat error:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при создании чата с клубом'
    });
  }
});

// GET /api/chat/club/:clubId - Получение чата с клубом
router.get('/club/:clubId', authenticateToken, async (req, res) => {
  try {
    const { clubId } = req.params;
    const { event_id } = req.query;
    const currentUser = req.user.login;

    console.log('Getting club chat:', { clubId, event_id, currentUser });
    
    // Сначала проверим все сообщения с этим club_id
    const allClubMessages = await Chat.findAll({
      where: {
        club_id: clubId,
        is_club_chat: true
      },
      order: [['date', 'DESC']],
      limit: 100
    });
    console.log('All club messages:', allClubMessages.length, allClubMessages.map(m => ({ 
      id: m.id, 
      by_user: m.by_user, 
      to_user: m.to_user, 
      message: m.message?.substring(0, 50),
      event_id: m.event_id,
      is_club_chat: m.is_club_chat,
      chat_type: m.chat_type
    })));
    
    // Проверим, есть ли сообщения от клуба к этому пользователю
    const clubToUserMessages = allClubMessages.filter(m => 
      m.by_user === `club_${clubId}` && m.to_user === currentUser
    );
    console.log('Messages from club to user:', clubToUserMessages.length, clubToUserMessages.map(m => ({
      id: m.id,
      by_user: m.by_user,
      to_user: m.to_user,
      message: m.message?.substring(0, 50)
    })));
    
    // Получаем все сообщения чата с клубом
    let messages;
    if (event_id) {
      messages = await Chat.getClubChat(currentUser, clubId, event_id);
    } else {
      // Упрощенный запрос - получаем все сообщения где пользователь участвует в чате с клубом
      const clubLogin = `club_${clubId}`;
      messages = await Chat.findAll({
        where: {
          [sequelize.Sequelize.Op.and]: [
            {
              [sequelize.Sequelize.Op.or]: [
                // Пользователь отправлял сообщения клубу
                { by_user: currentUser, to_user: clubLogin },
                // Клуб отправлял сообщения пользователю
                { by_user: clubLogin, to_user: currentUser },
                // Бот отправлял сообщения пользователю
                { by_user: 'bot', to_user: currentUser }
              ]
            },
            {
              club_id: clubId,
              is_club_chat: true
            }
          ]
        },
        order: [['date', 'DESC']],
        limit: 50
      });
    }
    
    console.log('Found messages:', messages.length, messages.map(m => ({ id: m.id, by_user: m.by_user, to_user: m.to_user, message: m.message?.substring(0, 50) })));

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
      is_mine: msg.by_user === currentUser,
      club_id: msg.club_id,
      event_id: msg.event_id,
      is_from_bot: msg.by_user === 'bot',
      is_from_club: msg.by_user.startsWith('club_'),
      is_from_user: !msg.by_user.startsWith('club_') && msg.by_user !== 'bot'
    }));

    res.json({
      success: true,
      messages: formattedMessages.reverse(),
      club_id: clubId,
      event_id: event_id
    });

  } catch (error) {
    console.error('Get club chat error:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении чата с клубом'
    });
  }
});

module.exports = router;