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
  viral_share_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  referral_bonus: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  social_proof_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
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
      fields: ['city']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['expires_at']
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

Ads.prototype.isClubAd = function() {
  return this.is_club_ad === true;
};

Ads.prototype.getClubContactInfo = function() {
  return this.club_contact_info || this.contact_info;
};

Ads.prototype.incrementSocialProof = async function() {
  this.social_proof_count += 1;
  await this.save();
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

module.exports = Ads;