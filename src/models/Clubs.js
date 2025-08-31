const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Clubs = sequelize.define('Clubs', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Основная информация
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
    
    // Аутентификация (ОТДЕЛЬНАЯ ОТ ПОЛЬЗОВАТЕЛЕЙ)
    login: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Логин клуба для входа'
    },
    
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Хеш пароля клуба'
    },
    
    // Тип и статус
    type: {
      type: DataTypes.ENUM('public', 'private', 'exclusive'),
      allowNull: false,
      defaultValue: 'public',
      comment: 'Тип клуба'
    },
    
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Активен ли клуб'
    },
    
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Верифицирован ли клуб'
    },
    
    // Местоположение
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
    
    // Участники
    max_members: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Максимальное количество участников'
    },
    
    current_members: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Текущее количество участников'
    },
    
    // Финансы
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Баланс клуба'
    },
    
    membership_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Вступительный взнос'
    },
    
    // Дополнительная информация
    age_restriction: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Возрастные ограничения'
    },
    
    contact_info: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Контактная информация'
    },
    
    social_links: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Ссылки на соцсети'
    },
    
    rules: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Правила клуба'
    },
    
    tags: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Теги клуба'
    },
    
    // Медиа
    avatar: {
      type: DataTypes.STRING(255),
      defaultValue: 'no_photo.jpg',
      comment: 'Аватар клуба'
    },
    
    cover_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Обложка клуба'
    },
    
    // Даты
    date_created: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Дата создания клуба'
    },
    
    verification_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Дата верификации'
    },
    
    verified_by: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Кто верифицировал клуб'
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
        fields: ['login']
      },
      {
        fields: ['type']
      },
      {
        fields: ['is_verified']
      },
      {
        fields: ['balance']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['country', 'city']
      },
      {
        fields: ['date_created']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Методы экземпляра
  Clubs.prototype.canJoin = function(userVipType = 'FREE') {
    if (!this.is_active) return false;
    
    // Проверяем возрастные ограничения
    if (this.age_restriction) {
      // Логика проверки возраста
    }
    
    // Проверяем место в клубе
    if (this.max_members && this.current_members >= this.max_members) {
      return false;
    }
    
    return true;
  };

  Clubs.prototype.isFull = function() {
    return this.max_members && this.current_members >= this.max_members;
  };

  Clubs.prototype.canCreateEvent = function() {
    // Клуб может создавать мероприятия если у него достаточно средств
    return this.balance >= 100;
  };

  Clubs.prototype.addMember = async function() {
    if (!this.isFull()) {
      this.current_members = parseInt(this.current_members) + 1;
      return await this.save();
    }
    throw new Error('Клуб переполнен');
  };

  Clubs.prototype.removeMember = async function() {
    if (this.current_members > 1) {
      this.current_members = parseInt(this.current_members) - 1;
      return await this.save();
    }
    throw new Error('Нельзя удалить последнего участника');
  };

  Clubs.prototype.updateBalance = async function(amount, operation = 'add') {
    const currentBalance = parseFloat(this.balance);
    let newBalance;
    
    if (operation === 'add') {
      newBalance = currentBalance + parseFloat(amount);
    } else if (operation === 'subtract') {
      newBalance = currentBalance - parseFloat(amount);
      if (newBalance < 0) {
        throw new Error('Недостаточно средств на балансе');
      }
    } else {
      throw new Error('Неверная операция');
    }
    
    this.balance = newBalance;
    return await this.save();
  };

  // Статические методы
  Clubs.getActiveClubs = async function(options = {}) {
    const {
      limit = 20,
      offset = 0,
      city = null,
      type = null,
      search = null,
      verified = null
    } = options;

    const whereClause = { is_active: true };
    
    if (city) {
      whereClause.city = {
        [sequelize.Sequelize.Op.iLike]: `%${city}%`
      };
    }
    
    if (type && type !== 'all') {
      whereClause.type = type;
    }
    
    if (verified !== null) {
      whereClause.is_verified = verified;
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
        },
        {
          tags: {
            [sequelize.Sequelize.Op.iLike]: `%${search}%`
          }
        }
      ];
    }

    try {
      const clubs = await this.findAll({
        where: whereClause,
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

  Clubs.getVerifiedClubs = async function(options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    try {
      return await this.findAll({
        where: { 
          is_active: true,
          is_verified: true
        },
        order: [['created_at', 'DESC']],
        limit,
        offset
      });
    } catch (error) {
      console.error('Error getting verified clubs:', error);
      throw error;
    }
  };

  Clubs.getPopularClubs = async function(limit = 10) {
    try {
      const clubs = await this.findAll({
        where: { is_active: true },
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

  Clubs.getClubsByType = async function(type, options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    try {
      return await this.findAll({
        where: { 
          type,
          is_active: true
        },
        order: [['created_at', 'DESC']],
        limit,
        offset
      });
    } catch (error) {
      console.error('Error getting clubs by type:', error);
      throw error;
    }
  };

  // Ассоциации
  Clubs.associate = function(models) {
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

    // Клуб имеет много участников мероприятий
    if (models.EventParticipants) {
      Clubs.hasMany(models.EventParticipants, {
        foreignKey: 'club_id',
        sourceKey: 'id',
        as: 'EventParticipants'
      });
    }
  };

  return Clubs;
};