const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ClubBot = sequelize.define('ClubBot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  club_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'clubs',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'ID клуба'
  },
  
  welcome_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Приветственное сообщение для новых пользователей'
  },
  
  invitation_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Сообщение с предложением вступления в клуб'
  },
  
  thanks_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Благодарность за вступление в клуб'
  },
  
  event_info_template: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Шаблон информации о мероприятии'
  },
  
  auto_responses: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Автоматические ответы на ключевые слова'
  },
  
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Активен ли бот'
  },
  
  // НОВЫЕ ПОЛЯ ДЛЯ ЭМОЦИОНАЛЬНЫХ ТРИГГЕРОВ И ПЕРСОНАЛИЗАЦИИ
  personality_traits: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Настройки "характера" бота (дружелюбный, профессиональный, игривый)'
  },
  
  event_scenarios: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Сценарии для разных типов мероприятий'
  },
  
  ice_breakers: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Темы для начала разговора и "ледоколы"'
  },
  
  compatibility_algorithms: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Алгоритмы подбора участников по совместимости'
  },
  
  emotional_triggers: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Эмоциональные триггеры для вовлечения пользователей'
  },
  
  referral_messages: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Сообщения для реферальной системы'
  },
  
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Дата создания'
  },
  
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Дата последнего обновления'
  }
}, {
  tableName: 'club_bots',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['club_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['club_id', 'is_active']
    }
  ]
});

// Методы экземпляра
ClubBot.prototype.isActive = function() {
  return this.is_active === true;
};

ClubBot.prototype.getWelcomeMessage = function(userName = '') {
  if (!this.welcome_message) {
    return `Привет! Добро пожаловать в наш клуб! 🎉`;
  }
  
  return this.welcome_message.replace('{userName}', userName);
};

ClubBot.prototype.getInvitationMessage = function(eventTitle = '') {
  if (!this.invitation_message) {
    return `Присоединяйся к нашему клубу! У нас много интересных мероприятий! 🚀`;
  }
  
  return this.invitation_message.replace('{eventTitle}', eventTitle);
};

ClubBot.prototype.getThanksMessage = function() {
  return this.thanks_message || 'Спасибо за вступление в клуб! Мы рады тебя видеть! 🎊';
};

ClubBot.prototype.getEventInfoTemplate = function(eventData = {}) {
  if (!this.event_info_template) {
    return `📅 {title}\n📍 {location}\n🕐 {date}\n💰 {price}`;
  }
  
  let template = this.event_info_template;
  Object.keys(eventData).forEach(key => {
    template = template.replace(`{${key}}`, eventData[key] || '');
  });
  
  return template;
};

ClubBot.prototype.getAutoResponse = function(keyword) {
  if (!this.auto_responses || !this.auto_responses[keyword]) {
    return null;
  }
  
  return this.auto_responses[keyword];
};

// НОВЫЕ МЕТОДЫ ДЛЯ ЭМОЦИОНАЛЬНЫХ ТРИГГЕРОВ
ClubBot.prototype.getPersonalityTrait = function(trait) {
  if (!this.personality_traits || !this.personality_traits[trait]) {
    return 'friendly'; // По умолчанию дружелюбный
  }
  
  return this.personality_traits[trait];
};

ClubBot.prototype.getEventScenario = function(eventType) {
  if (!this.event_scenarios || !this.event_scenarios[eventType]) {
    return null;
  }
  
  return this.event_scenarios[eventType];
};

ClubBot.prototype.getIceBreakerTopic = function(category = 'general') {
  if (!this.ice_breakers || !this.ice_breakers[category]) {
    return 'Расскажи немного о себе! 😊';
  }
  
  const topics = this.ice_breakers[category];
  if (Array.isArray(topics)) {
    return topics[Math.floor(Math.random() * topics.length)];
  }
  
  return topics;
};

ClubBot.prototype.getCompatibilityAlgorithm = function(algorithmName) {
  if (!this.compatibility_algorithms || !this.compatibility_algorithms[algorithmName]) {
    return null;
  }
  
  return this.compatibility_algorithms[algorithmName];
};

ClubBot.prototype.getEmotionalTrigger = function(triggerType) {
  if (!this.emotional_triggers || !this.emotional_triggers[triggerType]) {
    return null;
  }
  
  return this.emotional_triggers[triggerType];
};

ClubBot.prototype.getReferralMessage = function(messageType) {
  if (!this.referral_messages || !this.referral_messages[messageType]) {
    return 'Пригласи друга и получи бонус! 🎁';
  }
  
  return this.referral_messages[messageType];
};

// Методы для настройки бота
ClubBot.prototype.setPersonality = function(traits) {
  this.personality_traits = { ...this.personality_traits, ...traits };
  return this.save();
};

ClubBot.prototype.addEventScenario = function(eventType, scenario) {
  if (!this.event_scenarios) {
    this.event_scenarios = {};
  }
  
  this.event_scenarios[eventType] = scenario;
  return this.save();
};

ClubBot.prototype.addIceBreaker = function(category, topics) {
  if (!this.ice_breakers) {
    this.ice_breakers = {};
  }
  
  if (Array.isArray(topics)) {
    this.ice_breakers[category] = topics;
  } else {
    if (!this.ice_breakers[category]) {
      this.ice_breakers[category] = [];
    }
    this.ice_breakers[category].push(topics);
  }
  
  return this.save();
};

ClubBot.prototype.setCompatibilityAlgorithm = function(name, algorithm) {
  if (!this.compatibility_algorithms) {
    this.compatibility_algorithms = {};
  }
  
  this.compatibility_algorithms[name] = algorithm;
  return this.save();
};

ClubBot.prototype.addEmotionalTrigger = function(triggerType, trigger) {
  if (!this.emotional_triggers) {
    this.emotional_triggers = {};
  }
  
  this.emotional_triggers[triggerType] = trigger;
  return this.save();
};

ClubBot.prototype.setReferralMessage = function(messageType, message) {
  if (!this.referral_messages) {
    this.referral_messages = {};
  }
  
  this.referral_messages[messageType] = message;
  return this.save();
};

// Статические методы
ClubBot.getActiveBots = async function(options = {}) {
  const {
    limit = 20,
    offset = 0,
    club_id = null
  } = options;

  const whereClause = { is_active: true };
  
  if (club_id) {
    whereClause.club_id = club_id;
  }

  try {
    const bots = await this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.Clubs,
          as: 'Club',
          attributes: ['id', 'name', 'type', 'avatar']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return bots;
  } catch (error) {
    console.error('Error getting active bots:', error);
    throw error;
  }
};

ClubBot.getBotByClub = async function(clubId) {
  try {
    return await this.findOne({
      where: { club_id: clubId },
      include: [
        {
          model: sequelize.models.Clubs,
          as: 'Club',
          attributes: ['id', 'name', 'type', 'avatar']
        }
      ]
    });
  } catch (error) {
    console.error('Error getting bot by club:', error);
    throw error;
  }
};

// Hooks
ClubBot.beforeCreate(async (bot) => {
  // Устанавливаем значения по умолчанию для новых полей
  if (!bot.personality_traits) {
    bot.personality_traits = {
      tone: 'friendly',
      formality: 'casual',
      humor: 'light'
    };
  }
  
  if (!bot.event_scenarios) {
    bot.event_scenarios = {
      party: 'Вечеринка в разгаре! 🎉',
      dinner: 'Уютный ужин в приятной компании 🍽️',
      activity: 'Активное времяпрепровождение! 🏃‍♂️',
      networking: 'Отличная возможность для нетворкинга! 🤝'
    };
  }
  
  if (!bot.ice_breakers) {
    bot.ice_breakers = {
      general: [
        'Расскажи немного о себе! 😊',
        'Что тебя привело в наш клуб? 🤔',
        'Какие у тебя планы на вечер? 🌙'
      ]
    };
  }
  
  if (!bot.emotional_triggers) {
    bot.emotional_triggers = {
      excitement: '🔥',
      curiosity: '🤔',
      joy: '😊',
      surprise: '😲'
    };
  }
  
  if (!bot.referral_messages) {
    bot.referral_messages = {
      invitation: 'Пригласи друга и получи бонус! 🎁',
      success: 'Отлично! Твой друг присоединился! 🎉',
      reminder: 'Не забудь пригласить друзей! 👥'
    };
  }
});

// Ассоциации
ClubBot.associate = function(models) {
  // Бот принадлежит клубу
  ClubBot.belongsTo(models.Clubs, {
    foreignKey: 'club_id',
    targetKey: 'id',
    as: 'Club'
  });
};

module.exports = ClubBot;
