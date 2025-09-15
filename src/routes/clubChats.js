const express = require('express');
const router = express.Router();
const { authenticateClub } = require('../middleware/clubAuth');
const { APILogger } = require('../utils/logger');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

// GET /api/club/chats - Получение чатов клуба с участниками мероприятий
router.get('/', authenticateClub, async (req, res) => {
  const logger = new APILogger('CLUB_CHATS');
  
  try {
    logger.logRequest(req, 'GET /club/chats');
    
    const { Chat, EventParticipants, ClubEvents, User } = require('../models');
    
    // Получаем ID клуба из аутентификации клуба
    const clubId = req.club.id;
    
    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: 'ID клуба не указан'
      });
    }

    // Получаем уникальные комбинации пользователь + мероприятие
    const uniqueChats = await Chat.findAll({
      where: {
        club_id: clubId,
        chat_type: 'event'
      },
      attributes: [
        'event_id',
        'by_user',
        [sequelize.fn('MAX', sequelize.col('created_at')), 'last_message_time'],
        [sequelize.fn('MAX', sequelize.col('id')), 'last_chat_id']
      ],
      group: ['event_id', 'by_user'],
      order: [[sequelize.fn('MAX', sequelize.col('created_at')), 'DESC']]
    });

    console.log(`Found ${uniqueChats.length} unique chats for club ${clubId}`);

    // Получаем информацию о мероприятиях и статусах участия
    const chatsWithDetails = await Promise.all(uniqueChats.map(async (chatGroup) => {
      const event = await ClubEvents.findByPk(chatGroup.event_id);
      
      // Получаем последнее сообщение для этой комбинации пользователь + мероприятие
      // Ищем сообщения где пользователь участвует в диалоге (как отправитель или получатель)
      const lastMessage = await Chat.findOne({
        where: {
          event_id: chatGroup.event_id,
          club_id: clubId,
          chat_type: 'event',
          [Op.or]: [
            { by_user: chatGroup.by_user },
            { to_user: chatGroup.by_user }
          ]
        },
        order: [['created_at', 'DESC']]
      });
      
      // Сначала получаем пользователя по логину
      const user = await User.findOne({
        where: { login: chatGroup.by_user }
      });
      
      // Пропускаем чаты с несуществующими пользователями
      if (!user) {
        console.log(`Skipping chat for non-existent user: ${chatGroup.by_user}`);
        return null;
      }
      
      // Затем ищем участие в мероприятии по user_id (числовой ID)
      let participation = null;
      participation = await EventParticipants.findOne({
        where: {
          event_id: chatGroup.event_id,
          user_id: user.id
        }
      });

      return {
        id: chatGroup.last_chat_id || `temp_${chatGroup.event_id}_${chatGroup.by_user}`,
        event_id: chatGroup.event_id,
        user_id: user.id,
        user: {
          login: chatGroup.by_user,
          ava: user?.ava || null,
          email: user?.email || null
        },
        event_title: event?.title || 'Мероприятие удалено',
        event_date: event?.event_date || event?.created_at,
        participation_status: participation?.status || 'unknown',
        last_message: lastMessage?.message || '',
        last_message_at: lastMessage?.created_at || chatGroup.last_message_time,
        unread_count: 0 // TODO: реализовать подсчет непрочитанных сообщений
      };
    }));

    // Фильтруем null значения (чаты с несуществующими пользователями)
    const validChats = chatsWithDetails.filter(chat => chat !== null);

    logger.logSuccess(req, 200, {
      club_id: clubId,
      chats_count: validChats.length
    });
    
    res.json({
      success: true,
      chats: validChats
    });
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении чатов клуба',
      error: error.message
    });
  }
});

// GET /api/club/chats/messages - Получение сообщений между клубом и пользователем
router.get('/messages', authenticateClub, async (req, res) => {
  const logger = new APILogger('CLUB_CHAT_MESSAGES');
  
  try {
    logger.logRequest(req, 'GET /club/chats/messages');
    
    const { Chat, User } = require('../models');
    const { event_id, user_id } = req.query;
    
    // Валидация параметров
    if (!event_id || !user_id) {
      return res.status(400).json({
        success: false,
        message: 'Не указаны event_id или user_id'
      });
    }
    
    console.log('Getting messages for:', { event_id, user_id, club_id: req.club.id });
    
    // Получаем логин пользователя по ID
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    // Получаем все сообщения между клубом и пользователем по мероприятию
    const clubLogin = `club_${req.club.id}`;
    const userLogin = user.login;
    
    const messages = await Chat.findAll({
      where: { 
        event_id: parseInt(event_id),
        club_id: req.club.id,
        chat_type: 'event',
        [Op.or]: [
          // Основные комбинации: пользователь <-> клуб
          { by_user: userLogin, to_user: clubLogin },
          { by_user: clubLogin, to_user: userLogin },
          // Дополнительные комбинации для совместимости
          { by_user: userLogin, to_user: user.id.toString() },
          { by_user: clubLogin, to_user: user.id.toString() },
          // Также ищем сообщения где пользователь может быть в by_user или to_user
          { by_user: user.id.toString(), to_user: clubLogin },
          { by_user: user.id.toString(), to_user: userLogin },
          { by_user: userLogin, to_user: user.id.toString() },
          { by_user: clubLogin, to_user: user.id.toString() }
        ]
      },
      order: [['created_at', 'ASC']]
    });

    console.log('Found messages:', messages.map(m => ({ id: m.id, by_user: m.by_user, to_user: m.to_user, message: m.message.substring(0, 50) })));

    logger.logSuccess(req, 200, {
      event_id: event_id,
      user_id: user_id,
      messages_count: messages.length
    });
    
    res.json({
      success: true,
      data: {
        messages: messages.map(msg => ({
          id: msg.id,
          message: msg.message,
          by_user: msg.by_user,
          to_user: msg.to_user,
          created_at: msg.created_at,
          user_avatar: user?.ava || null,
          is_from_club: msg.by_user.startsWith('club_'),
          is_from_user: !msg.by_user.startsWith('club_')
        })),
        user: {
          login: user.login,
          ava: user.ava || null,
          email: user.email || null
        }
      }
    });
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении сообщений чата',
      error: error.message
    });
  }
});

// POST /api/club/chats/messages - Отправка сообщения от клуба пользователю
router.post('/messages', authenticateClub, async (req, res) => {
  const logger = new APILogger('CLUB_CHAT_SEND');
  
  try {
    logger.logRequest(req, 'POST /club/chats/messages');
    
    const { Chat } = require('../models');
    const { message, to_user, event_id } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Сообщение не может быть пустым'
      });
    }

    if (!to_user || !event_id) {
      return res.status(400).json({
        success: false,
        message: 'Не указаны получатель или мероприятие'
      });
    }

    // Получаем логин пользователя по ID
    const { User } = require('../models');
    const user = await User.findByPk(to_user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Создаем новое сообщение от клуба пользователю
    const newMessage = await Chat.create({
      by_user: `club_${req.club.id}`,
      to_user: user.login, // Используем логин вместо ID
      message: message.trim(),
      date: new Date(),
      club_id: req.club.id,
      chat_type: 'event',
      event_id: parseInt(event_id)
    });

    logger.logSuccess(req, 201, {
      message_id: newMessage.id,
      to_user: to_user,
      event_id: event_id
    });
    
    res.status(201).json({
      success: true,
      message: 'Сообщение отправлено',
      data: {
        id: newMessage.id,
        message: newMessage.message,
        created_at: newMessage.created_at
      }
    });
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при отправке сообщения',
      error: error.message
    });
  }
});

// POST /api/club/chats/:chatId/read - Отметить чат как прочитанный
router.post('/:chatId/read', authenticateClub, async (req, res) => {
  const logger = new APILogger('CLUB_CHAT_READ');
  
  try {
    logger.logRequest(req, 'POST /club/chats/:chatId/read');
    
    const { Chat } = require('../models');
    const { chatId } = req.params;
    
    // Валидация chatId (может быть временным ID типа temp_eventId_userId)
    if (!chatId || chatId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID чата'
      });
    }
    
    // TODO: реализовать логику отметки как прочитанного
    // Пока просто возвращаем успех
    
    logger.logSuccess(req, 200, {
      chat_id: chatId
    });
    
    res.json({
      success: true,
      message: 'Чат отмечен как прочитанный'
    });
  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при отметке чата как прочитанного',
      error: error.message
    });
  }
});


module.exports = router;
