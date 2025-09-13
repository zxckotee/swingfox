const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
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
  club_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'clubs',
      key: 'id'
    }
  },
  is_club_chat: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  chat_type: {
    type: DataTypes.ENUM('user', 'club', 'event'),
    defaultValue: 'user'
  },
  event_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'club_events',
      key: 'id'
    }
  }
}, {
  tableName: 'chat',
  timestamps: true,
  underscored: true
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


Chat.isClubChat = function() {
  return this.chat_type === 'club' || this.is_club_chat === true;
};

Chat.isEventChat = function() {
  return this.chat_type === 'event';
};

// Создание чата с клубом по мероприятию
Chat.createClubEventChat = async function(userLogin, clubId, eventId, message) {
  const clubLogin = `club_${clubId}`;
  
  // Получаем максимальный ID и увеличиваем на 1
  const maxId = await this.max('id');
  const newId = (maxId || 0) + 1;
  
  return await this.create({
    id: newId,
    by_user: userLogin,
    to_user: clubLogin,
    message: message,
    date: new Date(),
    is_read: false,
    club_id: clubId,
    is_club_chat: true,
    chat_type: 'event',
    event_id: eventId
  });
};

// Получение чата с клубом
Chat.getClubChat = function(userLogin, clubId, eventId = null) {
  const clubLogin = `club_${clubId}`;
  
  const whereClause = {
    [sequelize.Sequelize.Op.or]: [
      // Основные комбинации: пользователь <-> клуб
      { by_user: userLogin, to_user: clubLogin },
      { by_user: clubLogin, to_user: userLogin },
      // Бот сообщения
      { by_user: 'bot', to_user: userLogin },
      { by_user: 'bot', to_user: clubLogin },
      // Дополнительные комбинации для совместимости
      { by_user: userLogin, to_user: clubId.toString() },
      { by_user: clubId.toString(), to_user: userLogin },
      { by_user: 'bot', to_user: clubId.toString() }
    ],
    club_id: clubId,
    is_club_chat: true
  };
  
  if (eventId) {
    whereClause.event_id = eventId;
  }
  
  return this.findAll({
    where: whereClause,
    order: [['date', 'DESC']],
    limit: 50
  });
};

module.exports = Chat;