const express = require('express');
const router = express.Router();
const { authenticateClub } = require('../middleware/clubAuth');
const APILogger = require('../utils/logger');

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

    // Получаем все чаты клуба с участниками мероприятий
    const chats = await Chat.findAll({
      where: {
        club_id: clubId,
        chat_type: 'event'
      },
      order: [['created_at', 'DESC']]
    });

    console.log(`Found ${chats.length} chats for club ${clubId}`);

    // Получаем информацию о мероприятиях и статусах участия
    const chatsWithDetails = await Promise.all(chats.map(async (chat) => {
      const event = await ClubEvents.findByPk(chat.event_id);
      const participation = await EventParticipants.findOne({
        where: {
          event_id: chat.event_id,
          user_id: chat.by_user
        }
      });
      
      const user = await User.findOne({
        where: { login: chat.by_user }
      });

      return {
        id: chat.id,
        event_id: chat.event_id,
        user_id: chat.by_user,
        user_login: chat.by_user,
        user_avatar: user?.ava || null,
        event_title: event?.title || 'Мероприятие удалено',
        participation_status: participation?.status || 'unknown',
        last_message: chat.message,
        last_message_time: chat.created_at,
        unread_count: 0 // TODO: реализовать подсчет непрочитанных сообщений
      };
    }));

    logger.logSuccess(req, 200, {
      club_id: clubId,
      chats_count: chatsWithDetails.length
    });
    
    res.json({
      success: true,
      chats: chatsWithDetails
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

// GET /api/club/chats/:chatId/messages - Получение сообщений чата
router.get('/:chatId/messages', authenticateClub, async (req, res) => {
  const logger = new APILogger('CLUB_CHAT_MESSAGES');
  
  try {
    logger.logRequest(req, 'GET /club/chats/:chatId/messages');
    
    const { Chat, User } = require('../models');
    const { chatId } = req.params;
    
    // Получаем сообщения чата
    const messages = await Chat.findAll({
      where: { id: chatId },
      order: [['created_at', 'ASC']]
    });

    // Получаем информацию о пользователе
    const user = await User.findOne({
      where: { login: messages[0]?.by_user }
    });

    logger.logSuccess(req, 200, {
      chat_id: chatId,
      messages_count: messages.length
    });
    
    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg.id,
        message: msg.message,
        by_user: msg.by_user,
        user_avatar: user?.ava || null,
        created_at: msg.created_at
      }))
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

// POST /api/club/chats/:chatId/messages - Отправка сообщения в чат
router.post('/:chatId/messages', authenticateClub, async (req, res) => {
  const logger = new APILogger('CLUB_CHAT_SEND');
  
  try {
    logger.logRequest(req, 'POST /club/chats/:chatId/messages');
    
    const { Chat } = require('../models');
    const { chatId } = req.params;
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Сообщение не может быть пустым'
      });
    }

    // Создаем новое сообщение от клуба
    const newMessage = await Chat.create({
      by_user: `club_${req.club.id}`,
      to_user: req.body.to_user || 'system',
      message: message.trim(),
      club_id: req.club.id,
      chat_type: 'event',
      event_id: req.body.event_id || null
    });

    logger.logSuccess(req, 201, {
      chat_id: chatId,
      message_id: newMessage.id
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
