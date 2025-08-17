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
  geo: {
    type: DataTypes.TEXT,
    allowNull: true
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
    allowNull: true
  },
  search_status: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  search_age: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  mobile: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  height: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  weight: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  smoking: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  alko: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date: {
    type: DataTypes.TEXT,
    allowNull: true
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

module.exports = User;