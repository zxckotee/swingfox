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

module.exports = Chat;