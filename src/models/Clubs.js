const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Clubs = sequelize.define('Clubs', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Название клуба'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Описание клуба'
    },
    owner: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Владелец клуба'
    },
    type: {
      type: DataTypes.ENUM('public', 'private', 'invite_only'),
      defaultValue: 'public',
      comment: 'Тип клуба'
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Местоположение клуба'
    },
    geo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Координаты клуба (lat&&lng)'
    },
    max_members: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      comment: 'Максимальное количество участников'
    },
    current_members: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Текущее количество участников'
    },
    rules: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Правила клуба'
    },
    tags: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Теги клуба (разделенные запятыми)'
    },
    avatar: {
      type: DataTypes.STRING(255),
      defaultValue: 'default_club.jpg',
      comment: 'Аватар клуба'
    },
    cover_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Обложка клуба'
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Верифицирован ли клуб'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Активен ли клуб'
    },
    membership_fee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      comment: 'Взнос за членство'
    },
    age_restriction: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Ограничения по возрасту'
    },
    contact_info: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Контактная информация'
    },
    social_links: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Ссылки на социальные сети'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Дата создания'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Дата последнего обновления'
    }
  }, {
    tableName: 'clubs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['owner']
      },
      {
        fields: ['type']
      },
      {
        fields: ['location']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Методы модели
  Clubs.prototype.addMember = async function() {
    this.current_members = parseInt(this.current_members) + 1;
    return await this.save();
  };

  Clubs.prototype.removeMember = async function() {
    if (this.current_members > 1) {
      this.current_members = parseInt(this.current_members) - 1;
      return await this.save();
    }
    return this;
  };

  Clubs.prototype.isFull = function() {
    return parseInt(this.current_members) >= parseInt(this.max_members);
  };

  Clubs.prototype.canJoin = function(userVipType = 'FREE') {
    if (!this.is_active) return false;
    if (this.isFull()) return false;
    if (this.type === 'private' && userVipType === 'FREE') return false;
    return true;
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
      whereClause.location = {
        [sequelize.Sequelize.Op.iLike]: `%${location}%`
      };
    }
    
    if (type && type !== 'all') {
      whereClause.type = type;
    }
    
    if (search) {
      whereClause[sequelize.Sequelize.Op.or] = [
        {
          name: {
            [sequelize.Sequelize.Op.iLike]: `%${search}%`
          }
        },
        {
          description: {
            [sequelize.Sequelize.Op.iLike]: `%${search}%`
          }
        }
      ];
    }

    try {
      const clubs = await this.findAll({
        where: whereClause,
        include: [
          {
            model: sequelize.models.User,
            as: 'OwnerUser',
            attributes: ['login', 'name', 'ava']
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

  Clubs.getUserClubs = async function(userId, role = 'all') {
    const whereClause = { is_active: true };
    
    if (role === 'owner') {
      whereClause.owner = userId;
    }

    try {
      const clubs = await this.findAll({
        where: whereClause,
        include: [
          {
            model: sequelize.models.User,
            as: 'OwnerUser',
            attributes: ['login', 'name', 'ava']
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

  Clubs.getPopularClubs = async function(limit = 10) {
    try {
      const clubs = await this.findAll({
        where: { is_active: true },
        include: [
          {
            model: sequelize.models.User,
            as: 'OwnerUser',
            attributes: ['login', 'name', 'ava']
          }
        ],
        order: [
          ['current_members', 'DESC'],
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

  // Ассоциации
  Clubs.associate = function(models) {
    // Клуб принадлежит владельцу
    Clubs.belongsTo(models.User, {
      foreignKey: 'owner',
      targetKey: 'login',
      as: 'OwnerUser'
    });

    // Клуб имеет много заявок
    Clubs.hasMany(models.ClubApplications, {
      foreignKey: 'club_id',
      sourceKey: 'id',
      as: 'Applications'
    });

    // Клуб имеет много событий
    Clubs.hasMany(models.Events, {
      foreignKey: 'club_id',
      sourceKey: 'id',
      as: 'Events'
    });
  };

  return Clubs;
};