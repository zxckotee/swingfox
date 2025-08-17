const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Likes = sequelize.define('Likes', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  like_from: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  like_to: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  reciprocal: {
    type: DataTypes.STRING(20),
    defaultValue: 'empty'
  },
  super_message: {
    type: DataTypes.TEXT,
    defaultValue: '0'
  }
}, {
  tableName: 'likes',
  timestamps: true,
  underscored: true
});

// Статические методы
Likes.checkMutualLike = async function(user1, user2) {
  const like = await this.findOne({
    where: {
      like_from: user2,
      like_to: user1,
      reciprocal: 'empty'
    }
  });
  return like;
};

Likes.getTodayLikesCount = function(user, date = new Date()) {
  const today = date.toISOString().split('T')[0];
  return this.count({
    where: {
      like_from: user,
      date: today
    }
  });
};

Likes.getTodaySuperlikes = function(user, date = new Date()) {
  const today = date.toISOString().split('T')[0];
  return this.findAll({
    where: {
      like_from: user,
      date: today,
      super_message: {
        [sequelize.Sequelize.Op.ne]: '0'
      }
    }
  });
};

module.exports = Likes;