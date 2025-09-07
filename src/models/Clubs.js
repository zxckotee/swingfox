const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const Clubs = sequelize.define('Clubs', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    login: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    country: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    city: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    owner: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    admins: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    links: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: 'no_photo.jpg'
    },
    date_created: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    contact_info: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('nightclub', 'restaurant', 'event_space', 'other'),
      allowNull: true,
      defaultValue: 'other'
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'clubs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (club) => {
        if (club.password) {
          club.password = await bcrypt.hash(club.password, 10);
        }
      },
      beforeUpdate: async (club) => {
        if (club.changed('password')) {
          club.password = await bcrypt.hash(club.password, 10);
        }
      }
    }
  });

  // Методы экземпляра
  Clubs.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password; // Не возвращаем пароль в JSON
    return values;
  };

  Clubs.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  // Статические методы
  Clubs.getActiveClubs = async function(options = {}) {
    const {
      limit = 20,
      offset = 0,
      location = null,
      type = null,
      search = null
    } = options;

    const whereClause = { is_active: true };
    
    if (location) {
      whereClause[sequelize.Sequelize.Op.or] = [
        { location: { [sequelize.Sequelize.Op.iLike]: `%${location}%` } },
        { city: { [sequelize.Sequelize.Op.iLike]: `%${location}%` } },
        { country: { [sequelize.Sequelize.Op.iLike]: `%${location}%` } }
      ];
    }
    
    if (search) {
      const searchCondition = [
        { name: { [sequelize.Sequelize.Op.iLike]: `%${search}%` } },
        { description: { [sequelize.Sequelize.Op.iLike]: `%${search}%` } }
      ];
      
      if (whereClause[sequelize.Sequelize.Op.or]) {
        whereClause[sequelize.Sequelize.Op.and] = [
          { [sequelize.Sequelize.Op.or]: whereClause[sequelize.Sequelize.Op.or] },
          { [sequelize.Sequelize.Op.or]: searchCondition }
        ];
        delete whereClause[sequelize.Sequelize.Op.or];
      } else {
        whereClause[sequelize.Sequelize.Op.or] = searchCondition;
      }
    }

    try {
      const clubs = await this.findAll({
        where: whereClause,
        include: [
          {
            model: sequelize.models.User,
            as: 'OwnerUser',
            attributes: ['login', 'ava', 'date', 'status']
          }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      return clubs;
    } catch (error) {
      console.error('Error getting active clubs:', error);
      throw error;
    }
  };

  Clubs.getPopularClubs = async function(limit = 20) {
    try {
      const clubs = await this.findAll({
        where: { is_active: true },
        include: [
          {
            model: sequelize.models.User,
            as: 'OwnerUser',
            attributes: ['login', 'ava', 'date', 'status']
          }
        ],
        order: [
          ['created_at', 'DESC']
        ],
        limit
      });

      return clubs;
    } catch (error) {
      console.error('Error getting popular clubs:', error);
      throw error;
    }
  };

  Clubs.getUserClubs = async function(userId, role = 'all') {
    try {
      let whereClause = { is_active: true };
      
      if (role === 'owner') {
        whereClause.owner = userId;
      } else if (role === 'member') {
        // Для участников нужно будет добавить связь с заявками
        // Пока возвращаем пустой массив
        return [];
      }
      // Если role === 'all', показываем все активные клубы

      const clubs = await this.findAll({
        where: whereClause,
        include: [
          {
            model: sequelize.models.User,
            as: 'OwnerUser',
            attributes: ['login', 'ava', 'date', 'status']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return clubs;
    } catch (error) {
      console.error('Error getting user clubs:', error);
      throw error;
    }
  };

  // Методы экземпляра
  Clubs.prototype.canJoin = function() {
    // Поскольку у нас нет полей current_members и max_members,
    // всегда возвращаем true для возможности вступления
    return true;
  };

  Clubs.prototype.isFull = function() {
    // Поскольку у нас нет полей current_members и max_members,
    // всегда возвращаем false
    return false;
  };

  // Ассоциации
  Clubs.associate = (models) => {
    Clubs.hasMany(models.ClubEvents, {
      foreignKey: 'club_id',
      as: 'events'
    });

    Clubs.hasMany(models.ClubBots, {
      foreignKey: 'club_id',
      as: 'bots'
    });


    Clubs.hasMany(models.Ads, {
      foreignKey: 'club_id',
      as: 'ads'
    });

    Clubs.hasMany(models.Chat, {
      foreignKey: 'club_id',
      as: 'chats'
    });

    // Ассоциация с владельцем клуба
    Clubs.belongsTo(models.User, {
      foreignKey: 'owner',
      targetKey: 'login',
      as: 'OwnerUser'
    });
  };

  return Clubs;
};