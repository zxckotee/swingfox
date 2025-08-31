const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    allowNull: false
  },
  by_user: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  to_user: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  images: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // Поддержка клубов
  club_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clubs',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'ID клуба (если чат с клубом)'
  },
  
  is_bot_message: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Сообщение от бота'
  },
  
  event_context: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'events',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'Контекст мероприятия'
  },
  
  message_type: {
    type: DataTypes.ENUM('user', 'bot', 'club', 'system'),
    allowNull: false,
    defaultValue: 'user',
    comment: 'Тип сообщения'
  },

  // НОВЫЕ ПОЛЯ ДЛЯ ГРУППОВЫХ ЧАТОВ И ЭМОЦИОНАЛЬНОЙ НАСТРОЙКИ
  group_chat_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID группового чата мероприятия'
  },
  
  message_category: {
    type: DataTypes.ENUM('general', 'ice_breaker', 'event_info', 'referral'),
    allowNull: false,
    defaultValue: 'general',
    comment: 'Категория сообщения'
  },
  
  emotional_tone: {
    type: DataTypes.ENUM('friendly', 'professional', 'casual', 'flirty'),
    allowNull: false,
    defaultValue: 'friendly',
    comment: 'Эмоциональный тон сообщения'
  }
}, {
  tableName: 'chat',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['by_user']
    },
    {
      fields: ['to_user']
    },
    {
      fields: ['date']
    },
    {
      fields: ['is_read']
    },
    {
      fields: ['club_id']
    },
    {
      fields: ['is_bot_message']
    },
    {
      fields: ['event_context']
    },
    {
      fields: ['message_type']
    },
    {
      fields: ['club_id', 'by_user']
    },
    {
      fields: ['club_id', 'to_user']
    },
    // НОВЫЕ ИНДЕКСЫ ДЛЯ ГРУППОВЫХ ЧАТОВ И ЭМОЦИОНАЛЬНОЙ НАСТРОЙКИ
    {
      fields: ['group_chat_id']
    },
    {
      fields: ['message_category']
    },
    {
      fields: ['emotional_tone']
    }
  ]
});

// Статические методы
Chat.getConversation = function(user1, user2, limit = 50) {
  return this.findAll({
    where: {
      [sequelize.Sequelize.Op.or]: [
        { by_user: user1, to_user: user2 },
        { by_user: user2, to_user: user1 }
      ]
    },
    order: [['date', 'DESC']],
    limit
  });
};

Chat.markAsRead = function(fromUser, toUser) {
  return this.update(
    { is_read: true },
    {
      where: {
        by_user: fromUser,
        to_user: toUser,
        is_read: false
      }
    }
  );
};

Chat.getUnreadCount = function(user) {
  return this.count({
    where: {
      to_user: user,
      is_read: false
    }
  });
};

// Методы для работы с клубами
Chat.getClubConversation = function(clubId, userId, limit = 50) {
  return this.findAll({
    where: {
      club_id: clubId,
      [sequelize.Sequelize.Op.or]: [
        { by_user: userId },
        { to_user: userId }
      ]
    },
    order: [['date', 'ASC']],
    limit
  });
};

Chat.getClubChats = function(clubId, limit = 100) {
  return this.findAll({
    where: { club_id: clubId },
    order: [['date', 'DESC']],
    limit,
    group: ['by_user', 'to_user']
  });
};

Chat.createBotMessage = async function(clubId, toUser, message, eventContext = null) {
  return await this.create({
    by_user: 'BOT',
    to_user: toUser,
    message: message,
    date: new Date(),
    club_id: clubId,
    is_bot_message: true,
    event_context: eventContext,
    message_type: 'bot',
    is_read: false
  });
};

Chat.createClubMessage = async function(clubId, fromUser, toUser, message, eventContext = null) {
  return await this.create({
    by_user: fromUser,
    to_user: toUser,
    message: message,
    date: new Date(),
    club_id: clubId,
    is_bot_message: false,
    event_context: eventContext,
    message_type: 'club',
    is_read: false
  });
};

// НОВЫЕ МЕТОДЫ ДЛЯ ГРУППОВЫХ ЧАТОВ
Chat.getGroupChat = function(groupChatId, limit = 100) {
  return this.findAll({
    where: { group_chat_id: groupChatId },
    order: [['date', 'ASC']],
    limit
  });
};

Chat.createGroupMessage = async function(groupChatId, fromUser, message, options = {}) {
  const {
    messageCategory = 'general',
    emotionalTone = 'friendly',
    eventContext = null,
    clubId = null
  } = options;

  return await this.create({
    by_user: fromUser,
    to_user: 'GROUP',
    message: message,
    date: new Date(),
    group_chat_id: groupChatId,
    event_context: eventContext,
    club_id: clubId,
    message_category: messageCategory,
    emotional_tone: emotionalTone,
    is_bot_message: false,
    message_type: 'user',
    is_read: false
  });
};

Chat.createIceBreakerMessage = async function(groupChatId, fromUser, topic, options = {}) {
  const {
    emotionalTone = 'casual',
    eventContext = null,
    clubId = null
  } = options;

  return await this.create({
    by_user: fromUser,
    to_user: 'GROUP',
    message: topic,
    date: new Date(),
    group_chat_id: groupChatId,
    event_context: eventContext,
    club_id: clubId,
    message_category: 'ice_breaker',
    emotional_tone: emotionalTone,
    is_bot_message: false,
    message_type: 'user',
    is_read: false
  });
};

Chat.createEventInfoMessage = async function(groupChatId, fromUser, eventInfo, options = {}) {
  const {
    emotionalTone = 'professional',
    clubId = null
  } = options;

  return await this.create({
    by_user: fromUser,
    to_user: 'GROUP',
    message: eventInfo,
    date: new Date(),
    group_chat_id: groupChatId,
    club_id: clubId,
    message_category: 'event_info',
    emotional_tone: emotionalTone,
    is_bot_message: false,
    message_type: 'user',
    is_read: false
  });
};

Chat.createReferralMessage = async function(groupChatId, fromUser, referralMessage, options = {}) {
  const {
    emotionalTone = 'friendly',
    clubId = null
  } = options;

  return await this.create({
    by_user: fromUser,
    to_user: 'GROUP',
    message: referralMessage,
    date: new Date(),
    group_chat_id: groupChatId,
    club_id: clubId,
    message_category: 'referral',
    emotional_tone: emotionalTone,
    is_bot_message: false,
    message_type: 'user',
    is_read: false
  });
};

// Методы для работы с эмоциональными тонами
Chat.getMessagesByTone = function(emotionalTone, options = {}) {
  const {
    limit = 50,
    offset = 0,
    clubId = null,
    eventContext = null
  } = options;

  const whereClause = { emotional_tone: emotionalTone };
  
  if (clubId) {
    whereClause.club_id = clubId;
  }
  
  if (eventContext) {
    whereClause.event_context = eventContext;
  }

  return this.findAll({
    where: whereClause,
    order: [['date', 'DESC']],
    limit,
    offset
  });
};

Chat.getMessagesByCategory = function(messageCategory, options = {}) {
  const {
    limit = 50,
    offset = 0,
    clubId = null,
    eventContext = null
  } = options;

  const whereClause = { message_category: messageCategory };
  
  if (clubId) {
    whereClause.club_id = clubId;
  }
  
  if (eventContext) {
    whereClause.event_context = eventContext;
  }

  return this.findAll({
    where: whereClause,
    order: [['date', 'DESC']],
    limit,
    offset
  });
};

// Методы для аналитики чатов
Chat.getChatAnalytics = async function(clubId, options = {}) {
  const {
    startDate = null,
    endDate = null,
    eventContext = null
  } = options;

  const whereClause = { club_id: clubId };
  
  if (startDate && endDate) {
    whereClause.date = {
      [sequelize.Sequelize.Op.between]: [startDate, endDate]
    };
  }
  
  if (eventContext) {
    whereClause.event_context = eventContext;
  }

  try {
    const analytics = await this.findAll({
      where: whereClause,
      attributes: [
        'message_category',
        'emotional_tone',
        'is_bot_message',
        [sequelize.fn('COUNT', sequelize.col('id')), 'message_count'],
        [sequelize.fn('AVG', sequelize.fn('LENGTH', sequelize.col('message'))), 'avg_message_length']
      ],
      group: ['message_category', 'emotional_tone', 'is_bot_message']
    });

    return analytics;
  } catch (error) {
    console.error('Error getting chat analytics:', error);
    throw error;
  }
};

module.exports = Chat;