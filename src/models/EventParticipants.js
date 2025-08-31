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
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'ID мероприятия'
  },
  
  user_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'users',
      key: 'login'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: 'ID пользователя (логин)'
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
  
  registration_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Дата регистрации'
  },
  
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'cancelled', 'refunded'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Статус платежа'
  },
  
  amount_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Сумма оплаты'
  },
  
  payment_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Дата платежа'
  },
  
  status: {
    type: DataTypes.ENUM('registered', 'confirmed', 'attended', 'cancelled'),
    allowNull: false,
    defaultValue: 'registered',
    comment: 'Статус участия'
  },
  
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Заметки'
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
      fields: ['status']
    },
    {
      fields: ['payment_status']
    },
    {
      fields: ['event_id', 'user_id'],
      unique: true,
      name: 'event_participants_unique'
    }
  ]
});

// Методы экземпляра
EventParticipants.prototype.confirm = async function() {
  this.status = 'confirmed';
  return await this.save();
};

EventParticipants.prototype.attend = async function() {
  this.status = 'attended';
  return await this.save();
};

EventParticipants.prototype.cancel = async function() {
  this.status = 'cancelled';
  return await this.save();
};

EventParticipants.prototype.markAsPaid = async function(amount, paymentDate = new Date()) {
  this.payment_status = 'paid';
  this.amount_paid = amount;
  this.payment_date = paymentDate;
  return await this.save();
};

EventParticipants.prototype.getStatusLabel = function() {
  const labels = {
    'registered': 'Зарегистрирован',
    'confirmed': 'Подтвержден',
    'attended': 'Присутствовал',
    'cancelled': 'Отменен'
  };
  return labels[this.status] || this.status;
};

EventParticipants.prototype.getPaymentStatusLabel = function() {
  const labels = {
    'pending': 'Ожидает оплаты',
    'paid': 'Оплачено',
    'cancelled': 'Отменено',
    'refunded': 'Возвращено'
  };
  return labels[this.payment_status] || this.payment_status;
};

// Статические методы
EventParticipants.getByEvent = async function(eventId, options = {}) {
  const {
    status = null,
    payment_status = null,
    limit = 100,
    offset = 0
  } = options;

  const whereClause = { event_id: eventId };
  
  if (status) {
    whereClause.status = status;
  }
  
  if (payment_status) {
    whereClause.payment_status = payment_status;
  }

  try {
    const participants = await this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.User,
          as: 'User',
          attributes: ['login', 'name', 'ava']
        },
        {
          model: sequelize.models.Clubs,
          as: 'Club',
          attributes: ['id', 'name', 'type', 'avatar']
        }
      ],
      order: [['registration_date', 'ASC']],
      limit,
      offset
    });

    return participants;
  } catch (error) {
    console.error('Error getting event participants:', error);
    throw error;
  }
};

EventParticipants.getByUser = async function(userId, options = {}) {
  const {
    status = null,
    limit = 50,
    offset = 0
  } = options;

  const whereClause = { user_id: userId };
  
  if (status) {
    whereClause.status = status;
  }

  try {
    const participations = await this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.Events,
          as: 'Event',
          attributes: ['id', 'title', 'event_date', 'city', 'location']
        },
        {
          model: sequelize.models.Clubs,
          as: 'Club',
          attributes: ['id', 'name', 'type', 'avatar']
        }
      ],
      order: [['registration_date', 'DESC']],
      limit,
      offset
    });

    return participations;
  } catch (error) {
    console.error('Error getting user participations:', error);
    throw error;
  }
};

EventParticipants.getEventStats = async function(eventId) {
  try {
    const stats = await this.findAll({
      where: { event_id: eventId },
      attributes: [
        'status',
        'payment_status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status', 'payment_status']
    });

    const result = {
      total: 0,
      by_status: {},
      by_payment: {},
      confirmed: 0,
      paid: 0
    };

    stats.forEach(stat => {
      const count = parseInt(stat.getDataValue('count'));
      const status = stat.status;
      const paymentStatus = stat.payment_status;
      
      result.total += count;
      result.by_status[status] = (result.by_status[status] || 0) + count;
      result.by_payment[paymentStatus] = (result.by_payment[paymentStatus] || 0) + count;
      
      if (status === 'confirmed') {
        result.confirmed += count;
      }
      
      if (paymentStatus === 'paid') {
        result.paid += count;
      }
    });

    return result;
  } catch (error) {
    console.error('Error getting event stats:', error);
    throw error;
  }
};

// Ассоциации
EventParticipants.associate = function(models) {
  // Участник принадлежит пользователю
  EventParticipants.belongsTo(models.User, {
    foreignKey: 'user_id',
    targetKey: 'login',
    as: 'User'
  });

  // Участник принадлежит клубу
  EventParticipants.belongsTo(models.Clubs, {
    foreignKey: 'club_id',
    targetKey: 'id',
    as: 'Club'
  });

  // Участник принадлежит мероприятию
  EventParticipants.belongsTo(models.Events, {
    foreignKey: 'event_id',
    targetKey: 'id',
    as: 'Event'
  });
};

module.exports = EventParticipants;
