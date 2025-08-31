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
    
    // Email система
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Email клуба для подтверждения'
    },
    
    email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Подтвержден ли email клуба'
    },
    
    email_verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Токен для подтверждения email'
    },
    
    email_verification_expires: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Срок действия токена подтверждения'
    },
    
    verification_sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Когда отправлено подтверждение email'
    },
    
    // НОВЫЕ МАРКЕТИНГОВЫЕ ПОЛЯ
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Категория клуба (вечеринки, ужины, активность)'
    },
    
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Рейтинг клуба'
    },
    
    member_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Количество участников клуба'
    },
    
    is_premium: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Является ли клуб премиум'
    },
    
    referral_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Реферальный код клуба'
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
      },
      {
        fields: ['email']
      },
      {
        fields: ['email_verified']
      },
      {
        fields: ['email_verification_token']
      },
      // НОВЫЕ ИНДЕКСЫ ДЛЯ МАРКЕТИНГОВЫХ ПОЛЕЙ
      {
        fields: ['category']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['is_premium']
      },
      {
        fields: ['referral_code']
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
      this.member_count = parseInt(this.member_count) + 1;
      return await this.save();
    }
    throw new Error('Клуб переполнен');
  };

  Clubs.prototype.removeMember = async function() {
    if (this.current_members > 1) {
      this.current_members = parseInt(this.current_members) - 1;
      this.member_count = parseInt(this.member_count) - 1;
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

  // Email методы
  Clubs.prototype.generateVerificationToken = function() {
    const crypto = require('crypto');
    this.email_verification_token = crypto.randomBytes(32).toString('hex');
    this.email_verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа
    this.verification_sent_at = new Date();
    return this.email_verification_token;
  };

  Clubs.prototype.verifyEmail = function(token) {
    if (this.email_verification_token === token && 
        this.email_verification_expires > new Date()) {
      this.email_verified = true;
      this.email_verification_token = null;
      this.email_verification_expires = null;
      return true;
    }
    return false;
  };

  Clubs.prototype.isEmailVerified = function() {
    return this.email_verified === true;
  };

  Clubs.prototype.canSendVerification = function() {
    if (!this.verification_sent_at) return true;
    const hoursSinceLastSent = (Date.now() - this.verification_sent_at.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastSent >= 1; // Можно отправлять раз в час
  };

  // НОВЫЕ МАРКЕТИНГОВЫЕ МЕТОДЫ
  Clubs.prototype.generateReferralCode = function() {
    const crypto = require('crypto');
    this.referral_code = crypto.randomBytes(16).toString('hex').substring(0, 8).toUpperCase();
    return this.referral_code;
  };

  Clubs.prototype.upgradeToPremium = async function() {
    this.is_premium = true;
    return await this.save();
  };

  Clubs.prototype.updateRating = async function(newRating) {
    if (newRating >= 0 && newRating <= 5) {
      this.rating = newRating;
      return await this.save();
    }
    throw new Error('Рейтинг должен быть от 0 до 5');
  };

  // Статические методы
  Clubs.getActiveClubs = async function(options = {}) {
    const {
      limit = 20,
      offset = 0,
      city = null,
      type = null,
      search = null,
      verified = null,
      category = null,
      premium = null
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

    if (category) {
      whereClause.category = category;
    }

    if (premium !== null) {
      whereClause.is_premium = premium;
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
        order: [['rating', 'DESC'], ['member_count', 'DESC'], ['created_at', 'DESC']],
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
        order: [['rating', 'DESC'], ['created_at', 'DESC']],
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
          ['member_count', 'DESC'],
          ['rating', 'DESC'],
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
        order: [['rating', 'DESC'], ['created_at', 'DESC']],
        limit,
        offset
      });
    } catch (error) {
      console.error('Error getting clubs by type:', error);
      throw error;
    }
  };

  // НОВЫЕ СТАТИЧЕСКИЕ МЕТОДЫ
  Clubs.getTopRatedClubs = async function(limit = 10) {
    try {
      return await this.findAll({
        where: { is_active: true },
        order: [['rating', 'DESC'], ['member_count', 'DESC']],
        limit
      });
    } catch (error) {
      console.error('Error getting top rated clubs:', error);
      throw error;
    }
  };

  Clubs.getClubsByCategory = async function(category, options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    try {
      return await this.findAll({
        where: { 
          category,
          is_active: true
        },
        order: [['rating', 'DESC'], ['member_count', 'DESC']],
        limit,
        offset
      });
    } catch (error) {
      console.error('Error getting clubs by category:', error);
      throw error;
    }
  };

  Clubs.getPremiumClubs = async function(options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    try {
      return await this.findAll({
        where: { 
          is_premium: true,
          is_active: true
        },
        order: [['rating', 'DESC'], ['member_count', 'DESC']],
        limit,
        offset
      });
    } catch (error) {
      console.error('Error getting premium clubs:', error);
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

    // Клуб имеет бота
    if (models.ClubBot) {
      Clubs.hasOne(models.ClubBot, {
        foreignKey: 'club_id',
        sourceKey: 'id',
        as: 'Bot'
      });
    }
  };

  return Clubs;
};