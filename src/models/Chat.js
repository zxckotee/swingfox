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

Chat.getClubChat = function(clubId, limit = 50) {
  return this.findAll({
    where: {
      club_id: clubId,
      is_club_chat: true
    },
    order: [['date', 'DESC']],
    limit
  });
};

Chat.isClubChat = function() {
  return this.is_club_chat === true;
};

Chat.isEventChat = function() {
  return this.chat_type === 'event';
};

module.exports = Chat;