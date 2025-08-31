const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Ads = sequelize.define('Ads', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    allowNull: false
    // Убираем autoIncrement, так как в базе данных это не настроено
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [5, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [20, 5000]
    }
  },
  author: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  contact_info: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      notEmpty: true
    }
  },
  approved_by: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  views_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  // Новое поле для связи с мероприятиями
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'events',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'ID связанного мероприятия (для объявлений типа "Мероприятия")'
  },
  
  // Связь с клубами
  club_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'clubs',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'ID клуба (если объявление от клуба)'
  },
  
  is_club_ad: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Флаг объявления клуба'
  },
  
  club_contact_info: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Контактная информация клуба'
  },

  // НОВЫЕ ПОЛЯ ДЛЯ ВИРУСНОГО МАРКЕТИНГА
  viral_share_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Можно ли делиться объявлением в социальных сетях'
  },
  
  referral_bonus: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Бонус за приглашение друга (в баллах или валюте)'
  },
  
  social_proof_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Количество репостов/лайков для социального доказательства'
  }
}, {
  tableName: 'ads',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['author']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['country']
    },
    {
      fields: ['city']
    },
    {
      fields: ['price']
    },
    {
      fields: ['is_featured']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['expires_at']
    },
    // Новый индекс для связи с мероприятиями
    {
      fields: ['event_id']
    },
    // Индексы для связи с клубами
    {
      fields: ['club_id']
    },
    {
      fields: ['is_club_ad']
    },
    {
      fields: ['club_id', 'is_club_ad']
    },
    // НОВЫЕ ИНДЕКСЫ ДЛЯ ВИРУСНОГО МАРКЕТИНГА
    {
      fields: ['viral_share_enabled']
    },
    {
      fields: ['referral_bonus']
    },
    {
      fields: ['social_proof_count']
    }
  ]
});

// Статические методы
Ads.getTypeLabels = () => ({
  'Встречи': 'Встречи',
  'Знакомства': 'Знакомства',
  'Вечеринки': 'Вечеринки',
  'Мероприятия': 'Мероприятия',
  'Общение': 'Общение',
  'Все': 'Все'
});

Ads.getStatusLabels = () => ({
  'pending': 'На модерации',
  'approved': 'Одобрено',
  'rejected': 'Отклонено'
});

// Методы экземпляра
Ads.prototype.approve = async function(adminLogin) {
  this.status = 'approved';
  this.approved_by = adminLogin;
  this.approved_at = new Date();
  
  // Устанавливаем срок действия (30 дней)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  this.expires_at = expiresAt;
  
  await this.save();
};

Ads.prototype.reject = async function(adminLogin) {
  this.status = 'rejected';
  this.approved_by = adminLogin;
  this.approved_at = new Date();
  await this.save();
};

Ads.prototype.incrementViews = async function() {
  this.views_count += 1;
  await this.save();
};

Ads.prototype.feature = async function() {
  this.is_featured = true;
  await this.save();
};

Ads.prototype.unfeature = async function() {
  this.is_featured = false;
  await this.save();
};

Ads.prototype.getTypeLabel = function() {
  const labels = Ads.getTypeLabels();
  return labels[this.type] || this.type;
};

Ads.prototype.getStatusLabel = function() {
  const labels = Ads.getStatusLabels();
  return labels[this.status] || this.status;
};

Ads.prototype.isExpired = function() {
  return this.expires_at && new Date(this.expires_at) < new Date();
};

Ads.prototype.canEdit = function(userLogin) {
  return this.author === userLogin && this.status === 'pending';
};

Ads.prototype.canView = function() {
  return this.status === 'approved' && !this.isExpired();
};

// Новый метод для проверки связи с мероприятием
Ads.prototype.isEventAd = function() {
  return this.type === 'Мероприятия' && this.event_id !== null;
};

// НОВЫЕ МЕТОДЫ ДЛЯ ВИРУСНОГО МАРКЕТИНГА
Ads.prototype.incrementSocialProof = async function() {
  this.social_proof_count += 1;
  await this.save();
};

Ads.prototype.canShare = function() {
  return this.viral_share_enabled && this.status === 'approved';
};

Ads.prototype.getReferralBonus = function() {
  return this.referral_bonus;
};

Ads.prototype.isClubAd = function() {
  return this.is_club_ad === true;
};

// Hooks
Ads.beforeCreate(async (ad) => {
  // Устанавливаем срок действия по умолчанию (30 дней)
  if (!ad.expires_at) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    ad.expires_at = expiresAt;
  }
});

Ads.beforeUpdate(async (ad) => {
  // Сбрасываем срок действия при изменении статуса на "отклонено"
  if (ad.status === 'rejected') {
    ad.expires_at = null;
  }
});

// Ассоциации
Ads.associate = function(models) {
  // Объявление может быть связано с мероприятием
  if (models.Events) {
    Ads.belongsTo(models.Events, {
      foreignKey: 'event_id',
      targetKey: 'id',
      as: 'Event'
    });
  }

  // Объявление может быть связано с клубом
  if (models.Clubs) {
    Ads.belongsTo(models.Clubs, {
      foreignKey: 'club_id',
      targetKey: 'id',
      as: 'Club'
    });
  }
};

module.exports = Ads;