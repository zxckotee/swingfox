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
    admins: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Администраторы через &&'
    },
    links: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Ссылки на соцсети и сайты'
    },

    country: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Страна клуба'
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Город клуба'
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Адрес клуба'
    },
    avatar: {
      type: DataTypes.STRING(255),
      defaultValue: 'no_photo.jpg',
      comment: 'Аватар клуба'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Активен ли клуб'
    },
    date_created: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Дата создания клуба'
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
        fields: ['country', 'city']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['date_created']
      },
      {
        fields: ['created_at']
      }
    ]
  });



  Clubs.prototype.canJoin = function(userVipType = 'FREE') {
    if (!this.is_active) return false;
    return true;
  };

  // Статические методы
  Clubs.getActiveClubs = async function(options = {}) {
    const {
      limit = 20,
      offset = 0,
      city = null,
      search = null
    } = options;

    const whereClause = { is_active: true };
    
    if (city) {
      whereClause.city = {
        [sequelize.Sequelize.Op.iLike]: `%${city}%`
      };
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