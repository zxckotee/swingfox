const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClubApplications = sequelize.define('ClubApplications', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    club_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID клуба'
    },
    applicant: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Пользователь, подающий заявку'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'withdrawn'),
      defaultValue: 'pending',
      comment: 'Статус заявки'
    },
    application_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Сообщение к заявке'
    },
    admin_response: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Ответ администратора'
    },
    reviewed_by: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Кто рассмотрел заявку'
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Дата рассмотрения'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Дата истечения заявки'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Дата создания заявки'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Дата последнего обновления'
    }
  }, {
    tableName: 'club_applications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['club_id']
      },
      {
        fields: ['applicant']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      },
      {
        unique: true,
        fields: ['club_id', 'applicant'],
        name: 'unique_club_applicant'
      }
    ]
  });

  // Методы модели
  ClubApplications.prototype.approve = async function(reviewerId, response = null) {
    this.status = 'approved';
    this.reviewed_by = reviewerId;
    this.reviewed_at = new Date();
    this.admin_response = response;
    
    await this.save();
    
    // Увеличиваем количество участников клуба
    const club = await sequelize.models.Clubs.findByPk(this.club_id);
    if (club) {
      await club.addMember();
    }
    
    return this;
  };

  ClubApplications.prototype.reject = async function(reviewerId, response = null) {
    this.status = 'rejected';
    this.reviewed_by = reviewerId;
    this.reviewed_at = new Date();
    this.admin_response = response;
    
    return await this.save();
  };

  ClubApplications.prototype.withdraw = async function() {
    this.status = 'withdrawn';
    this.reviewed_at = new Date();
    
    return await this.save();
  };

  ClubApplications.prototype.isExpired = function() {
    return this.expires_at && new Date() > this.expires_at;
  };

  // Статические методы
  ClubApplications.getPendingApplications = async function(clubId) {
    try {
      const applications = await this.findAll({
        where: {
          club_id: clubId,
          status: 'pending'
        },
        include: [
          {
            model: sequelize.models.User,
            as: 'ApplicantUser',
            attributes: ['login', 'name', 'ava', 'city', 'viptype']
          },
          {
            model: sequelize.models.Clubs,
            as: 'Club',
            attributes: ['id', 'name', 'type', 'owner']
          }
        ],
        order: [['created_at', 'ASC']]
      });

      return applications;
    } catch (error) {
      console.error('Error getting pending applications:', error);
      throw error;
    }
  };

  ClubApplications.getUserApplications = async function(userId, status = null) {
    const whereClause = { applicant: userId };
    
    if (status) {
      whereClause.status = status;
    }

    try {
      const applications = await this.findAll({
        where: whereClause,
        include: [
          {
            model: sequelize.models.Clubs,
            as: 'Club',
            attributes: ['id', 'name', 'type', 'owner', 'avatar', 'current_members', 'max_members']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return applications;
    } catch (error) {
      console.error('Error getting user applications:', error);
      throw error;
    }
  };

  ClubApplications.createApplication = async function(clubId, applicantId, message = null) {
    try {
      // Проверяем, нет ли уже заявки
      const existingApplication = await this.findOne({
        where: {
          club_id: clubId,
          applicant: applicantId,
          status: ['pending', 'approved']
        }
      });

      if (existingApplication) {
        throw new Error('Заявка уже существует или пользователь уже в клубе');
      }

      // Проверяем клуб
      const club = await sequelize.models.Clubs.findByPk(clubId);
      if (!club || !club.is_active) {
        throw new Error('Клуб не найден или неактивен');
      }

      if (club.isFull()) {
        throw new Error('Клуб заполнен');
      }

      // Получаем данные пользователя
      const user = await sequelize.models.User.findOne({ 
        where: { login: applicantId } 
      });
      
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      // Проверяем возможность вступления
      if (!club.canJoin(user.viptype)) {
        throw new Error('Нет доступа к данному клубу');
      }

      // Устанавливаем срок истечения заявки (30 дней)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const application = await this.create({
        club_id: clubId,
        applicant: applicantId,
        application_message: message,
        expires_at: expiresAt
      });

      return application;
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  };

  ClubApplications.cleanupExpired = async function() {
    try {
      const expiredCount = await this.update(
        { status: 'expired' },
        {
          where: {
            status: 'pending',
            expires_at: {
              [sequelize.Sequelize.Op.lt]: new Date()
            }
          }
        }
      );
      
      return expiredCount[0];
    } catch (error) {
      console.error('Error cleaning up expired applications:', error);
      throw error;
    }
  };

  ClubApplications.getApplicationStats = async function(clubId) {
    try {
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
        withdrawn: 0,
        expired: 0
      };

      stats.forEach(stat => {
        result[stat.status] = parseInt(stat.count);
      });

      return result;
    } catch (error) {
      console.error('Error getting application stats:', error);
      throw error;
    }
  };

  // Ассоциации
  ClubApplications.associate = function(models) {
    // Заявка принадлежит пользователю
    ClubApplications.belongsTo(models.User, {
      foreignKey: 'applicant',
      targetKey: 'login',
      as: 'ApplicantUser'
    });

    // Заявка принадлежит клубу
    ClubApplications.belongsTo(models.Clubs, {
      foreignKey: 'club_id',
      targetKey: 'id',
      as: 'Club'
    });

    // Заявка рассмотрена пользователем
    ClubApplications.belongsTo(models.User, {
      foreignKey: 'reviewed_by',
      targetKey: 'login',
      as: 'ReviewerUser'
    });
  };

  return ClubApplications;
};