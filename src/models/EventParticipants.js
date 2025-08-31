const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EventParticipants = sequelize.define('EventParticipants', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    },
    comment: 'ID мероприятия'
  },
  
  user_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'users',
      key: 'login'
    },
    comment: 'Логин пользователя'
  },
  
  club_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'clubs',
      key: 'id'
    },
    comment: 'ID клуба-организатора'
  },
  
  registration_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Дата регистрации'
  },
  
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Статус оплаты'
  },
  
  amount_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Сумма оплаты'
  },
  
  payment_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Дата оплаты'
  },
  
  status: {
    type: DataTypes.ENUM('registered', 'attended', 'cancelled', 'no_show'),
    allowNull: false,
    defaultValue: 'registered',
    comment: 'Статус участия'
  },
  
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Заметки организатора'
  },
  
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Дата создания записи'
  },
  
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Дата последнего обновления'
  }
}, {
  tableName: 'event_participants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['event_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['club_id']
    },
    {
      fields: ['payment_status']
    },
    {
      fields: ['status']
    },
    {
      fields: ['event_id', 'user_id'],
      unique: true,
      name: 'event_participants_unique'
    }
  ]
});

// Методы экземпляра
EventParticipants.prototype.markAsPaid = async function(amount) {
  this.payment_status = 'paid';
  this.amount_paid = parseFloat(amount);
  this.payment_date = new Date();
  return await this.save();
};

EventParticipants.prototype.markAsAttended = async function() {
  this.status = 'attended';
  return await this.save();
};

EventParticipants.prototype.cancelRegistration = async function() {
  this.status = 'cancelled';
  return await this.save();
};

EventParticipants.prototype.markAsNoShow = async function() {
  this.status = 'no_show';
  return await this.save();
};

// Статические методы
EventParticipants.getEventParticipants = async function(eventId, options = {}) {
  const { status = null, payment_status = null } = options;
  
  const whereClause = { event_id: eventId };
  
  if (status) {
    whereClause.status = status;
  }
  
  if (payment_status) {
    whereClause.payment_status = payment_status;
  }
  
  try {
    return await this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.User,
          as: 'User',
          attributes: ['login', 'ava', 'city', 'viptype']
        }
      ],
      order: [['registration_date', 'ASC']]
    });
  } catch (error) {
    console.error('Error getting event participants:', error);
    throw error;
  }
};

EventParticipants.getUserEvents = async function(userId, options = {}) {
  const { status = null, upcoming = null } = options;
  
  const whereClause = { user_id: userId };
  
  if (status) {
    whereClause.status = status;
  }
  
  try {
    const participants = await this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.Events,
          as: 'Event',
          attributes: ['id', 'title', 'event_date', 'location', 'city', 'price', 'status']
        },
        {
          model: sequelize.models.Clubs,
          as: 'Club',
          attributes: ['id', 'login', 'avatar']
        }
      ],
      order: [['registration_date', 'DESC']]
    });
    
    // Фильтруем по дате если нужно
    if (upcoming === true) {
      return participants.filter(p => new Date(p.Event.event_date) > new Date());
    } else if (upcoming === false) {
      return participants.filter(p => new Date(p.Event.event_date) <= new Date());
    }
    
    return participants;
  } catch (error) {
    console.error('Error getting user events:', error);
    throw error;
  }
};

EventParticipants.getClubEventStats = async function(clubId, eventId) {
  try {
    const participants = await this.findAll({
      where: { club_id: clubId, event_id: eventId }
    });
    
    const stats = {
      total: participants.length,
      registered: participants.filter(p => p.status === 'registered').length,
      attended: participants.filter(p => p.status === 'attended').length,
      cancelled: participants.filter(p => p.status === 'cancelled').length,
      no_show: participants.filter(p => p.status === 'no_show').length,
      paid: participants.filter(p => p.payment_status === 'paid').length,
      pending_payment: participants.filter(p => p.payment_status === 'pending').length,
      total_revenue: participants
        .filter(p => p.payment_status === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0)
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting club event stats:', error);
    throw error;
  }
};

// Ассоциации
EventParticipants.associate = function(models) {
  // Участник принадлежит мероприятию
  EventParticipants.belongsTo(models.Events, {
    foreignKey: 'event_id',
    targetKey: 'id',
    as: 'Event'
  });
  
  // Участник - это пользователь
  EventParticipants.belongsTo(models.User, {
    foreignKey: 'user_id',
    targetKey: 'login',
    as: 'User'
  });
  
  // Участник связан с клубом-организатором
  EventParticipants.belongsTo(models.Clubs, {
    foreignKey: 'club_id',
    targetKey: 'id',
    as: 'Club'
  });
};

module.exports = EventParticipants;
