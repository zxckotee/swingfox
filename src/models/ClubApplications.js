const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClubApplications = sequelize.define('ClubApplications', {
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
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'approved', 'rejected']]
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'club_applications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  // Методы экземпляра
  ClubApplications.prototype.approve = async function() {
    this.status = 'approved';
    return await this.save();
  };

  ClubApplications.prototype.reject = async function() {
    this.status = 'rejected';
    return await this.save();
  };

  ClubApplications.prototype.isPending = function() {
    return this.status === 'pending';
  };

  ClubApplications.prototype.isApproved = function() {
    return this.status === 'approved';
  };

  ClubApplications.prototype.isRejected = function() {
    return this.status === 'rejected';
  };



  // Статические методы
  ClubApplications.getPendingApplications = async function(clubId) {
    return await this.findAll({
      where: {
        club_id: clubId,
        status: 'pending'
      },
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'login', 'ava', 'city']
        }
      ],
      order: [['created_at', 'ASC']]
    });
  };

  ClubApplications.getUserApplications = async function(userId) {
    return await this.findAll({
      where: { user_id: userId },
      include: [
        {
          model: sequelize.models.Clubs,
          as: 'club',
          attributes: ['id', 'name', 'location', 'type']
        }
      ],
      order: [['created_at', 'DESC']]
    });
  };

  ClubApplications.createApplication = async function(clubId, userId, message = null) {
    // Проверяем, нет ли уже заявки
    const existingApplication = await this.findOne({
      where: {
        club_id: clubId,
        user_id: userId,
        status: ['pending', 'approved']
      }
    });

    if (existingApplication) {
      throw new Error('Заявка уже существует или пользователь уже в клубе');
    }

    return await this.create({
      club_id: clubId,
      user_id: userId,
      message: message
    });
  };

  ClubApplications.getApplicationStats = async function(clubId) {
    const stats = await this.findAll({
      where: { club_id: clubId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const result = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    stats.forEach(stat => {
      const count = parseInt(stat.count);
      result[stat.status] = count;
      result.total += count;
    });

    return result;
  };

  // Ассоциации
  ClubApplications.associate = (models) => {
    ClubApplications.belongsTo(models.Clubs, {
      foreignKey: 'club_id',
      as: 'club'
    });

    ClubApplications.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return ClubApplications;
};