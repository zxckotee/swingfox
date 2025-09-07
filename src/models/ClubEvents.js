const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClubEvents = sequelize.define('ClubEvents', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    club_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'clubs',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterToday(value) {
          if (new Date(value) <= new Date()) {
            throw new Error('Дата мероприятия должна быть в будущем');
          }
        }
      }
    },
    time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    max_participants: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    },
    current_participants: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    event_type: {
      type: DataTypes.ENUM('party', 'dinner', 'meeting', 'other'),
      allowNull: true
    },
    is_premium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    auto_invite_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Аватарка мероприятия'
    },
    images: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON массив с путями к изображениям мероприятия',
      get() {
        const value = this.getDataValue('images');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('images', value ? JSON.stringify(value) : null);
      }
    },
    duration_hours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 2,
      comment: 'Длительность мероприятия в часах'
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Дата и время окончания мероприятия'
    }
  }, {
    tableName: 'club_events',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Методы экземпляра
  ClubEvents.prototype.isFull = function() {
    return this.max_participants && this.current_participants >= this.max_participants;
  };

  ClubEvents.prototype.canJoin = function() {
    return !this.isFull() && new Date(this.date) > new Date();
  };

  ClubEvents.prototype.getEndDate = function() {
    if (this.end_date) {
      return new Date(this.end_date);
    }
    
    if (this.duration_hours) {
      const startDate = new Date(`${this.date} ${this.time || '00:00:00'}`);
      return new Date(startDate.getTime() + (this.duration_hours * 60 * 60 * 1000));
    }
    
    // По умолчанию 2 часа, если ничего не указано
    const startDate = new Date(`${this.date} ${this.time || '00:00:00'}`);
    return new Date(startDate.getTime() + (2 * 60 * 60 * 1000));
  };

  ClubEvents.prototype.isUpcoming = function() {
    const startDate = new Date(`${this.date} ${this.time || '00:00:00'}`);
    return startDate > new Date();
  };

  ClubEvents.prototype.isOngoing = function() {
    const now = new Date();
    const startDate = new Date(`${this.date} ${this.time || '00:00:00'}`);
    const endDate = this.getEndDate();
    
    return now >= startDate && now <= endDate;
  };

  ClubEvents.prototype.isCompleted = function() {
    const now = new Date();
    const endDate = this.getEndDate();
    
    return now > endDate;
  };

  ClubEvents.prototype.getParticipantCount = function() {
    return this.current_participants || 0;
  };

  ClubEvents.prototype.getImages = function() {
    return this.images || [];
  };

  ClubEvents.prototype.addImage = function(imagePath) {
    const images = this.getImages();
    images.push(imagePath);
    this.images = images;
    return this;
  };

  ClubEvents.prototype.removeImage = function(imagePath) {
    const images = this.getImages();
    const filteredImages = images.filter(img => img !== imagePath);
    this.images = filteredImages;
    return this;
  };

  // Статические методы
  ClubEvents.getUpcomingEvents = async function(limit = 10) {
    return await this.findAll({
      where: {
        date: {
          [sequelize.Sequelize.Op.gte]: new Date()
        }
      },
      include: [
        {
          model: sequelize.models.Clubs || sequelize.model('Clubs'),
          as: 'club',
          attributes: ['id', 'name', 'location', 'type']
        }
      ],
      order: [['date', 'ASC']],
      limit
    });
  };

  ClubEvents.getClubEvents = async function(clubId, options = {}) {
    const { limit = 20, offset = 0, status = 'all' } = options;
    
    const whereClause = { club_id: clubId };
    
    if (status === 'upcoming') {
      whereClause.date = {
        [sequelize.Sequelize.Op.gte]: new Date()
      };
    } else if (status === 'past') {
      whereClause.date = {
        [sequelize.Sequelize.Op.lt]: new Date()
      };
    }

    return await this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.EventParticipants || sequelize.model('EventParticipants'),
          as: 'participants',
          attributes: ['id', 'user_id', 'status'],
          required: false
        }
      ],
      order: [['date', 'DESC']],
      limit,
      offset
    });
  };

  // Ассоциации
  ClubEvents.associate = (models) => {
    ClubEvents.belongsTo(models.Clubs, {
      foreignKey: 'club_id',
      as: 'club'
    });

    ClubEvents.hasMany(models.EventParticipants, {
      foreignKey: 'event_id',
      as: 'participants'
    });

    ClubEvents.hasMany(models.Ads, {
      foreignKey: 'event_id',
      as: 'ads'
    });
  };

  return ClubEvents;
};
