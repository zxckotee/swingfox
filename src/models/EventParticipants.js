const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EventParticipants = sequelize.define('EventParticipants', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    event_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'club_events',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('invited', 'confirmed', 'declined', 'maybe'),
      defaultValue: 'invited',
      validate: {
        isIn: [['invited', 'confirmed', 'declined', 'maybe']]
      }
    },
    invited_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'event_participants',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['event_id', 'user_id']
      }
    ]
  });

  // Методы экземпляра
  EventParticipants.prototype.isConfirmed = function() {
    return this.status === 'confirmed';
  };

  EventParticipants.prototype.isInvited = function() {
    return this.status === 'invited';
  };

  EventParticipants.prototype.isDeclined = function() {
    return this.status === 'declined';
  };

  EventParticipants.prototype.isMaybe = function() {
    return this.status === 'maybe';
  };

  // Статические методы
  EventParticipants.getEventParticipants = async function(eventId, options = {}) {
    const { status = null, limit = 50, offset = 0 } = options;
    
    const whereClause = { event_id: eventId };
    if (status) {
      whereClause.status = status;
    }

    return await this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.User || sequelize.model('User'),
          as: 'user',
          attributes: ['id', 'login', 'ava', 'city']
        },
        {
          model: sequelize.models.User || sequelize.model('User'),
          as: 'inviter',
          attributes: ['id', 'login'],
          foreignKey: 'invited_by'
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
  };

  EventParticipants.getUserEvents = async function(userId, options = {}) {
    const { status = null, limit = 20, offset = 0 } = options;
    
    const whereClause = { user_id: userId };
    if (status) {
      whereClause.status = status;
    }

    return await this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.ClubEvents || sequelize.model('ClubEvents'),
          as: 'event',
          include: [
            {
              model: sequelize.models.Clubs || sequelize.model('Clubs'),
              as: 'club',
              attributes: ['id', 'name', 'location', 'type']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
  };

  EventParticipants.getConfirmedCount = async function(eventId) {
    return await this.count({
      where: {
        event_id: eventId,
        status: 'confirmed'
      }
    });
  };

  // Ассоциации
  EventParticipants.associate = (models) => {
    EventParticipants.belongsTo(models.ClubEvents, {
      foreignKey: 'event_id',
      as: 'event'
    });

    EventParticipants.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    EventParticipants.belongsTo(models.User, {
      foreignKey: 'invited_by',
      as: 'inviter'
    });
  };

  return EventParticipants;
};
