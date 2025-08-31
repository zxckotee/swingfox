const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Events = sequelize.define('Events', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  organizer: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  event_date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isAfter: new Date().toISOString()
    }
  },
  location: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [5, 500]
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
  max_participants: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 2,
      max: 500
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
  type: {
    type: DataTypes.ENUM('party', 'meeting', 'club_event', 'private', 'other'),
    allowNull: false,
    defaultValue: 'party'
  },
  status: {
    type: DataTypes.ENUM('planned', 'active', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'planned'
  },
  is_private: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dress_code: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  contact_info: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  approved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  approved_by: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  club_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID клуба (если событие клубное)'
  }
}, {
  tableName: 'events',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['organizer']
    },
    {
      fields: ['city']
    },
    {
      fields: ['event_date']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['approved']
    }
  ]
});

// Статические методы
Events.getTypeLabels = () => ({
  party: 'Вечеринка',
  meeting: 'Встреча',
  club_event: 'Клубное мероприятие',
  private: 'Частное мероприятие',
  other: 'Другое'
});

Events.getStatusLabels = () => ({
  planned: 'Запланировано',
  active: 'Активно',
  completed: 'Завершено',
  cancelled: 'Отменено'
});

// Методы экземпляра
Events.prototype.approve = async function(adminLogin) {
  this.approved = true;
  this.approved_by = adminLogin;
  await this.save();
};

Events.prototype.cancel = async function() {
  this.status = 'cancelled';
  await this.save();
};

Events.prototype.complete = async function() {
  this.status = 'completed';
  await this.save();
};

Events.prototype.activate = async function() {
  this.status = 'active';
  await this.save();
};

Events.prototype.getTypeLabel = function() {
  const labels = Events.getTypeLabels();
  return labels[this.type] || this.type;
};

Events.prototype.getStatusLabel = function() {
  const labels = Events.getStatusLabels();
  return labels[this.status] || this.status;
};

Events.prototype.isUpcoming = function() {
  return new Date(this.event_date) > new Date();
};

Events.prototype.isPast = function() {
  return new Date(this.event_date) < new Date();
};

Events.prototype.canEdit = function(userLogin) {
  return this.organizer === userLogin && this.status === 'planned';
};

Events.prototype.canJoin = function() {
  return this.approved && this.status === 'planned' && this.isUpcoming();
};

// Hooks
Events.beforeCreate(async (event) => {
  // Проверяем дату события
  if (new Date(event.event_date) <= new Date()) {
    throw new Error('Дата события должна быть в будущем');
  }
});

Events.beforeUpdate(async (event) => {
  // Обновляем статус если событие в прошлом
  if (event.isPast() && event.status === 'planned') {
    event.status = 'completed';
  }
});

// Дополнительные методы
Events.prototype.addParticipant = async function() {
  this.current_participants = parseInt(this.current_participants) + 1;
  return await this.save();
};

Events.prototype.removeParticipant = async function() {
  if (this.current_participants > 0) {
    this.current_participants = parseInt(this.current_participants) - 1;
    return await this.save();
  }
  return this;
};

Events.prototype.isFull = function() {
  return this.max_participants && parseInt(this.current_participants) >= parseInt(this.max_participants);
};

Events.prototype.isClubEvent = function() {
  return this.club_id !== null;
};

// Статические методы для работы с клубными событиями
Events.getClubEvents = async function(clubId, options = {}) {
  const {
    limit = 20,
    offset = 0,
    status = null,
    upcoming = null
  } = options;

  const whereClause = { club_id: clubId };
  
  if (status) {
    whereClause.status = status;
  }
  
  if (upcoming === true) {
    whereClause.event_date = {
      [sequelize.Sequelize.Op.gt]: new Date()
    };
  } else if (upcoming === false) {
    whereClause.event_date = {
      [sequelize.Sequelize.Op.lt]: new Date()
    };
  }

  try {
    const events = await this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.User,
          as: 'OrganizerUser',
          attributes: ['login', 'name', 'ava']
        }
      ],
      order: [['event_date', 'ASC']],
      limit,
      offset
    });

    return events;
  } catch (error) {
    console.error('Error getting club events:', error);
    throw error;
  }
};

Events.getUpcomingEvents = async function(options = {}) {
  const {
    limit = 20,
    offset = 0,
    city = null,
    type = null
  } = options;

  const whereClause = {
    approved: true,
    status: 'planned',
    event_date: {
      [sequelize.Sequelize.Op.gt]: new Date()
    }
  };
  
  if (city) {
    whereClause.city = {
      [sequelize.Sequelize.Op.iLike]: `%${city}%`
    };
  }
  
  if (type && type !== 'all') {
    whereClause.type = type;
  }

  try {
    const events = await this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.User,
          as: 'OrganizerUser',
          attributes: ['login', 'name', 'ava']
        },
        {
          model: sequelize.models.Clubs,
          as: 'Club',
          attributes: ['id', 'name', 'type', 'avatar'],
          required: false
        }
      ],
      order: [['event_date', 'ASC']],
      limit,
      offset
    });

    return events;
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    throw error;
  }
};

// Ассоциации
Events.associate = function(models) {
  // Событие принадлежит организатору
  Events.belongsTo(models.User, {
    foreignKey: 'organizer',
    targetKey: 'login',
    as: 'OrganizerUser'
  });

  // Событие утверждается администратором
  Events.belongsTo(models.User, {
    foreignKey: 'approved_by',
    targetKey: 'login',
    as: 'ApproverUser'
  });

  // Событие может принадлежать клубу
  Events.belongsTo(models.Clubs, {
    foreignKey: 'club_id',
    targetKey: 'id',
    as: 'Club'
  });

  // Событие имеет много участников
  if (models.EventParticipants) {
    Events.hasMany(models.EventParticipants, {
      foreignKey: 'event_id',
      sourceKey: 'id',
      as: 'Participants'
    });
  }

  // Событие может быть связано с объявлением
  if (models.Ads) {
    Events.hasOne(models.Ads, {
      foreignKey: 'event_id',
      sourceKey: 'id',
      as: 'Ad'
    });
  }
};

module.exports = Events;