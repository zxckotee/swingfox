const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const Clubs = sequelize.define('Clubs', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    login: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 255],
        is: /^[a-zA-Z0-9_]+$/
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    contact_info: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    social_links: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    type: {
      type: DataTypes.ENUM('swing', 'bdsm', 'fetish', 'lgbt', 'general', 'other'),
      allowNull: true
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
    admins: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    links: {
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
    is_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    max_members: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    current_members: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    membership_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    age_restriction: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    rules: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tags: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    cover_image: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    verification_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    verified_by: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    email_verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    email_verification_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    verification_sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0
    },
    member_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    is_premium: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    referral_code: {
      type: DataTypes.STRING(50),
      allowNull: true
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
  Clubs.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  Clubs.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
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

    Clubs.hasMany(models.ClubApplications, {
      foreignKey: 'club_id',
      as: 'applications'
    });

    Clubs.hasMany(models.Ads, {
      foreignKey: 'club_id',
      as: 'ads'
    });

    Clubs.hasMany(models.Chat, {
      foreignKey: 'club_id',
      as: 'chats'
    });
  };

  return Clubs;
};