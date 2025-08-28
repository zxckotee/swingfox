const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClubApplications = sequelize.define('ClubApplications', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Дата подачи заявки'
    },
    info: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Информация о клубе через &&'
    },
    applicant: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Пользователь, подающий заявку'
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '0 - на рассмотрении, 1 - одобрено, 2 - отклонено'
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Причина отклонения заявки'
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
        fields: ['applicant']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['date']
      },

    ]
  });

  // Методы модели
  ClubApplications.prototype.approve = async function(reviewerId, response = null) {
    this.status = 1; // 1 - одобрено
    this.reviewed_by = reviewerId;
    this.reviewed_at = new Date();
    
    await this.save();
    
    return this;
  };

  ClubApplications.prototype.reject = async function(reviewerId, reason = null) {
    this.status = 2; // 2 - отклонено
    this.reviewed_by = reviewerId;
    this.reviewed_at = new Date();
    this.rejection_reason = reason;
    
    return await this.save();
  };

  ClubApplications.prototype.withdraw = async function() {
    this.status = 3; // 3 - отозвано
    this.reviewed_at = new Date();
    
    return await this.save();
  };



  // Статические методы
  ClubApplications.getPendingApplications = async function() {
    try {
      const applications = await this.findAll({
        where: {
          status: 0 // 0 - на рассмотрении
        },
        include: [
          {
            model: sequelize.models.User,
            as: 'ApplicantUser',
            attributes: ['login', 'name', 'ava', 'city', 'viptype']
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
    
    if (status !== null) {
      whereClause.status = status;
    }

    try {
      const applications = await this.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']]
      });

      return applications;
    } catch (error) {
      console.error('Error getting user applications:', error);
      throw error;
    }
  };

  ClubApplications.createApplication = async function(clubInfo, applicantId) {
    try {
      // Проверяем, нет ли уже заявки
      const existingApplication = await this.findOne({
        where: {
          applicant: applicantId,
          status: [0, 1] // 0 - на рассмотрении, 1 - одобрено
        }
      });

      if (existingApplication) {
        throw new Error('Заявка уже существует или пользователь уже в клубе');
      }

      // Получаем данные пользователя
      const user = await sequelize.models.User.findOne({ 
        where: { login: applicantId } 
      });
      
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      const application = await this.create({
        date: new Date(),
        info: clubInfo,
        applicant: applicantId
      });

      return application;
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  };



  ClubApplications.getApplicationStats = async function() {
    try {
      const stats = await this.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      const result = {
        pending: 0,    // status = 0
        approved: 0,   // status = 1
        rejected: 0,   // status = 2
        withdrawn: 0   // status = 3
      };

      stats.forEach(stat => {
        switch(stat.status) {
          case 0: result.pending = parseInt(stat.count); break;
          case 1: result.approved = parseInt(stat.count); break;
          case 2: result.rejected = parseInt(stat.count); break;
          case 3: result.withdrawn = parseInt(stat.count); break;
        }
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

    // Заявка рассмотрена пользователем
    ClubApplications.belongsTo(models.User, {
      foreignKey: 'reviewed_by',
      targetKey: 'login',
      as: 'ReviewerUser'
    });
  };

  return ClubApplications;
};