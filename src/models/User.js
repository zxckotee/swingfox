const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
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
  auth_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ava: {
    type: DataTypes.STRING(255),
    defaultValue: 'no_photo.jpg'
  },
  status: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Русские статусы: "Семейная пара(М+Ж)", "Несемейная пара(М+Ж)", "Мужчина", "Женщина"'
  },
  country: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  city: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  geo: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Формат: lat&&lng'
  },
  registration: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  info: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  online: {
    type: DataTypes.DATE,
    allowNull: true
  },
  viptype: {
    type: DataTypes.STRING(50),
    defaultValue: 'FREE'
  },
  images: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Формат: img1.jpg&&img2.jpg'
  },
  search_status: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Формат: "Семейная пара(М+Ж)&&Несемейная пара(М+Ж)&&Мужчина&&Женщина"'
  },
  search_age: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Формат: "У себя дома&&У вас дома&&В свинг-клубе&&В сауне&&В гостинице"'
  },
  mobile: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  height: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Формат: 180 или 180_165 для пар (муж_женщина)'
  },
  weight: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Формат: 70 или 70_60 для пар (муж_женщина)'
  },
  smoking: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Формат: "Не курю" или "Не курю&&Не курю" для пар (муж_женщина)'
  },
  alko: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Формат: "Не употребляю" или "Не употребляю&&Не употребляю" для пар (муж_женщина)'
  },
  date: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Формат: 1990-01-01 или 1990-01-01_1992-05-15 для пар (муж_женщина)'
  },
  balance: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  locked_images: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  images_password: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  privacy_settings: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON с настройками приватности',
    get() {
      try {
        const value = this.getDataValue('privacy_settings');
        if (!value) return this.getDefaultPrivacySettings();
        return JSON.parse(value);
      } catch (error) {
        console.warn('Ошибка парсинга privacy_settings:', error);
        return this.getDefaultPrivacySettings();
      }
    },
    set(value) {
      try {
        this.setDataValue('privacy_settings', JSON.stringify(value));
      } catch (error) {
        console.warn('Ошибка сохранения privacy_settings:', error);
        this.setDataValue('privacy_settings', JSON.stringify(this.getDefaultPrivacySettings()));
      }
    }
  },
  geo_updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Время последнего обновления геоданных'
  },
  notification_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'FCM токен для push-уведомлений'
  },
  premium_features: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON с доступными премиум функциями',
    get() {
      try {
        const value = this.getDataValue('premium_features');
        if (!value) return this.getDefaultPremiumFeatures();
        return JSON.parse(value);
      } catch (error) {
        console.warn('Ошибка парсинга premium_features:', error);
        return this.getDefaultPremiumFeatures();
      }
    },
    set(value) {
      try {
        this.setDataValue('premium_features', JSON.stringify(value));
      } catch (error) {
        console.warn('Ошибка сохранения premium_features:', error);
        this.setDataValue('premium_features', JSON.stringify(this.getDefaultPremiumFeatures()));
      }
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

// Методы экземпляра
User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.auth_token;
  return values;
};

// Метод для проверки, является ли пользователь парой
User.prototype.isCouple = function() {
  return this.status === 'Семейная пара(М+Ж)' || this.status === 'Несемейная пара(М+Ж)';
};

// Метод для получения данных партнера
User.prototype.getPartnerData = function() {
  if (!this.isCouple()) return null;
  
  const data = {};
  if (this.date && this.date.includes('_')) {
    const [manDate, womanDate] = this.date.split('_');
    data.manDate = manDate;
    data.womanDate = womanDate;
  }
  if (this.height && this.height.includes('_')) {
    const [manHeight, womanHeight] = this.height.split('_');
    data.manHeight = manHeight;
    data.womanHeight = womanHeight;
  }
  if (this.weight && this.weight.includes('_')) {
    const [manWeight, womanWeight] = this.weight.split('_');
    data.manWeight = manWeight;
    data.womanWeight = womanWeight;
  }
  if (this.smoking && this.smoking.includes('_')) {
    const [manSmoking, womanSmoking] = this.smoking.split('_');
    data.manSmoking = manSmoking;
    data.womanSmoking = womanSmoking;
  }
  if (this.alko && this.alko.includes('_')) {
    const [manAlko, womanAlko] = this.alko.split('_');
    data.manAlko = manAlko;
    data.womanAlko = womanAlko;
  }
  
  return data;
};

// Статические методы
User.findByLoginOrEmail = function(loginOrEmail) {
  return this.findOne({
    where: {
      [sequelize.Sequelize.Op.or]: [
        { login: loginOrEmail },
        { email: loginOrEmail }
      ]
    }
  });
};

// Методы для получения настроек по умолчанию
User.prototype.getDefaultPrivacySettings = function() {
  return {
    privacy: {
      anonymous_visits: false,
      show_online_status: true,
      show_last_seen: true,
      allow_messages: true,
      allow_gifts: true,
      allow_ratings: true,
      allow_comments: true
    },
    notifications: {
      new_matches: true,
      messages: true,
      likes: true,
      gifts: true,
      profile_visits: true
    }
  };
};

User.prototype.getDefaultPremiumFeatures = function() {
  return {
    can_view_guests: this.viptype !== 'FREE',
    can_anonymous_visits: this.viptype !== 'FREE',
    can_see_who_liked: this.viptype !== 'FREE',
    can_rewind_last_swipe: this.viptype !== 'FREE',
    can_send_superlikes: this.viptype !== 'FREE',
    can_see_read_receipts: this.viptype === 'PREMIUM',
    can_see_online_status: this.viptype === 'PREMIUM'
  };
};

// Метод для проверки VIP статуса
User.prototype.isVip = function() {
  return this.viptype && this.viptype !== 'FREE';
};

// Метод для проверки Premium статуса
User.prototype.isPremium = function() {
  return this.viptype === 'PREMIUM';
};

module.exports = User;