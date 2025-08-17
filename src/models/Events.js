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

module.exports = Events;