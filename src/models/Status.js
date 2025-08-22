const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Status = sequelize.define('Status', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    timestamp: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'Unix timestamp активности'
    },
    login: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Логин пользователя'
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Тип активности: online, typing, offline'
    }
  }, {
    tableName: 'status',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Ассоциации
  Status.associate = (models) => {
    Status.belongsTo(models.User, {
      foreignKey: 'login',
      targetKey: 'login',
      as: 'user'
    });
  };

  // Статические методы
  Status.updateUserStatus = async (login, statusType) => {
    const timestamp = Math.floor(Date.now() / 1000);
    
    return await Status.create({
      timestamp,
      login,
      type: statusType
    });
  };

  Status.getUserStatus = async (login, timeframe = 300) => {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    // Ищем активность за последние timeframe секунд (по умолчанию 5 минут)
    const recentActivity = await Status.findOne({
      where: {
        login,
        timestamp: {
          [sequelize.Sequelize.Op.gte]: currentTimestamp - timeframe
        }
      },
      order: [['timestamp', 'DESC']]
    });

    if (recentActivity) {
      if (recentActivity.type === 'typing' && (currentTimestamp - recentActivity.timestamp) <= 2) {
        return {
          status: 'typing',
          message: 'печатает...',
          last_seen: new Date(recentActivity.timestamp * 1000)
        };
      } else {
        return {
          status: 'online',
          message: 'онлайн',
          last_seen: new Date(recentActivity.timestamp * 1000)
        };
      }
    } else {
      // Ищем последнюю активность
      const lastActivity = await Status.findOne({
        where: { login },
        order: [['timestamp', 'DESC']]
      });

      if (lastActivity) {
        return {
          status: 'offline',
          message: `был ${new Date(lastActivity.timestamp * 1000).toLocaleString('ru-RU')}`,
          last_seen: new Date(lastActivity.timestamp * 1000)
        };
      } else {
        return {
          status: 'unknown',
          message: 'статус неизвестен',
          last_seen: null
        };
      }
    }
  };

  Status.getOnlineUsers = async (timeframe = 300) => {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    const onlineStatuses = await Status.findAll({
      where: {
        timestamp: {
          [sequelize.Sequelize.Op.gte]: currentTimestamp - timeframe
        }
      },
      attributes: ['login'],
      group: ['login'],
      raw: true
    });

    return onlineStatuses.map(status => status.login);
  };

  Status.cleanOldStatuses = async (daysToKeep = 7) => {
    const cutoffTimestamp = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 60 * 60);
    
    return await Status.destroy({
      where: {
        timestamp: {
          [sequelize.Sequelize.Op.lt]: cutoffTimestamp
        }
      }
    });
  };

  return Status;
};