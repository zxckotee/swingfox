const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClubBots = sequelize.define('ClubBots', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    club_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'clubs',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'club_bots',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  // Методы экземпляра
  ClubBots.prototype.getSetting = function(key, defaultValue = null) {
    return this.settings && this.settings[key] !== undefined 
      ? this.settings[key] 
      : defaultValue;
  };

  ClubBots.prototype.setSetting = function(key, value) {
    if (!this.settings) {
      this.settings = {};
    }
    this.settings[key] = value;
    return this.save();
  };

  ClubBots.prototype.isEnabled = function() {
    return this.is_active;
  };

  // Статические методы
  ClubBots.getActiveBots = async function(clubId) {
    return await this.findAll({
      where: {
        club_id: clubId,
        is_active: true
      },
      order: [['created_at', 'ASC']]
    });
  };

  ClubBots.createDefaultBots = async function(clubId) {
    const defaultBots = [
      {
        name: 'Приветственный бот',
        description: 'Приветствует пользователей при регистрации на мероприятие',
        settings: {
          enabled: true,
          welcome_message: 'Добро пожаловать на мероприятие! Если у вас есть вопросы, обращайтесь к организаторам.',
          trigger_type: 'registration'
        }
      },
      {
        name: 'Рекомендательный бот',
        description: 'Предлагает ближайшие мероприятия при первом сообщении',
        settings: {
          enabled: true,
          recommendation_message: 'Кстати, у нас есть другие интересные мероприятия! Посмотрите:',
          trigger_type: 'first_message'
        }
      }
    ];

    const bots = [];
    for (const botData of defaultBots) {
      const bot = await this.create({
        club_id: clubId,
        ...botData
      });
      bots.push(bot);
    }

    return bots;
  };

  // Ассоциации
  ClubBots.associate = (models) => {
    ClubBots.belongsTo(models.Clubs, {
      foreignKey: 'club_id',
      as: 'club'
    });
  };

  return ClubBots;
};
