const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notifications = sequelize.define('Notifications', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Пользователь, которому отправлено уведомление'
    },
    type: {
      type: DataTypes.ENUM(
        'like',          // Лайк профиля
        'superlike',     // Суперлайк
        'match',         // Взаимный лайк (совпадение)
        'message',       // Новое сообщение
        'gift',          // Подарок
        'profile_visit', // Посещение профиля
        'image_like',    // Лайк изображения
        'rating',        // Оценка профиля
        'event_invite',  // Приглашение на мероприятие
        'event_update',  // Обновление мероприятия
        'system',        // Системное уведомление
        'warning',       // Предупреждение
        'ban',           // Блокировка
        'unban',         // Разблокировка
        'premium',       // Изменение статуса премиум
        'club_invite',   // Приглашение в клуб
        'club_request'   // Заявка на вступление в клуб
      ),
      allowNull: false,
      comment: 'Тип уведомления'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Заголовок уведомления'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Текст уведомления'
    },
    from_user: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Пользователь, от которого пришло уведомление (если применимо)'
    },
    target_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'ID цели уведомления (профиль, сообщение, событие и т.д.)'
    },
    target_type: {
      type: DataTypes.ENUM('user', 'message', 'event', 'image', 'club', 'gift', 'rating'),
      allowNull: true,
      comment: 'Тип цели уведомления'
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Дополнительные данные уведомления в JSON формате'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Прочитано ли уведомление'
    },
    is_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Отправлено ли уведомление (для push/email)'
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal',
      comment: 'Приоритет уведомления'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Дата истечения актуальности уведомления'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Дата создания'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Дата последнего обновления'
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['user_id', 'is_read']
      },
      {
        fields: ['type']
      },
      {
        fields: ['from_user']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['expires_at']
      }
    ]
  });

  // Методы модели
  Notifications.prototype.markAsRead = async function() {
    this.is_read = true;
    this.updated_at = new Date();
    return await this.save();
  };

  Notifications.prototype.markAsSent = async function() {
    this.is_sent = true;
    this.updated_at = new Date();
    return await this.save();
  };

  // Статические методы
  Notifications.createNotification = async function(notificationData) {
    const {
      user_id,
      type,
      title,
      message,
      from_user = null,
      target_id = null,
      target_type = null,
      data = null,
      priority = 'normal',
      expires_at = null
    } = notificationData;

    try {
      const notification = await this.create({
        user_id,
        type,
        title,
        message,
        from_user,
        target_id,
        target_type,
        data,
        priority,
        expires_at
      });

      return notification;
    } catch (error) {
      console.error('Ошибка создания уведомления:', error);
      throw error;
    }
  };

  Notifications.getUserNotifications = async function(userId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      unreadOnly = false,
      type = null,
      includeExpired = false
    } = options;

    const whereClause = { user_id: userId };
    
    if (unreadOnly) {
      whereClause.is_read = false;
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    if (!includeExpired) {
      whereClause[sequelize.Sequelize.Op.or] = [
        { expires_at: null },
        { expires_at: { [sequelize.Sequelize.Op.gt]: new Date() } }
      ];
    }

    try {
      const notifications = await this.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: sequelize.models.User,
            as: 'FromUser',
            attributes: ['login', 'ava'],
            required: false
          }
        ]
      });

      return notifications;
    } catch (error) {
      console.error('Ошибка получения уведомлений:', error);
      throw error;
    }
  };

  Notifications.markAllAsRead = async function(userId, type = null) {
    const whereClause = { 
      user_id: userId,
      is_read: false
    };
    
    if (type) {
      whereClause.type = type;
    }

    try {
      const [affectedCount] = await this.update(
        { 
          is_read: true,
          updated_at: new Date()
        },
        { where: whereClause }
      );

      return affectedCount;
    } catch (error) {
      console.error('Ошибка пометки уведомлений как прочитанные:', error);
      throw error;
    }
  };

  Notifications.getUnreadCount = async function(userId, type = null) {
    const whereClause = { 
      user_id: userId,
      is_read: false
    };
    
    if (type) {
      whereClause.type = type;
    }
    
    // Исключаем истекшие уведомления
    whereClause[sequelize.Sequelize.Op.or] = [
      { expires_at: null },
      { expires_at: { [sequelize.Sequelize.Op.gt]: new Date() } }
    ];

    try {
      const count = await this.count({ where: whereClause });
      return count;
    } catch (error) {
      console.error('Ошибка подсчета непрочитанных уведомлений:', error);
      throw error;
    }
  };

  Notifications.cleanupExpired = async function() {
    try {
      const deletedCount = await this.destroy({
        where: {
          expires_at: {
            [sequelize.Sequelize.Op.lt]: new Date()
          }
        }
      });
      
      return deletedCount;
    } catch (error) {
      console.error('Ошибка очистки истекших уведомлений:', error);
      throw error;
    }
  };

  // Фабричные методы для различных типов уведомлений
  Notifications.createLikeNotification = async function(targetUserId, fromUserId, isSuper = false) {
    const User = sequelize.models.User;
    const fromUser = await User.findOne({ where: { login: fromUserId } });
    
    if (!fromUser) return null;

    const type = isSuper ? 'superlike' : 'like';
    const title = isSuper ? 'Суперлайк!' : 'Новый лайк!';
    const message = isSuper
      ? `${fromUser.login} отправил(а) вам суперлайк!`
      : `${fromUser.login} лайкнул(а) ваш профиль!`;

    return await this.createNotification({
      user_id: targetUserId,
      type,
      title,
      message,
      from_user: fromUserId,
      target_id: fromUserId,
      target_type: 'user',
      priority: isSuper ? 'high' : 'normal',
      data: { is_super: isSuper }
    });
  };

  Notifications.createMatchNotification = async function(userId1, userId2) {
    const User = sequelize.models.User;
    const user1 = await User.findOne({ where: { login: userId1 } });
    const user2 = await User.findOne({ where: { login: userId2 } });
    
    if (!user1 || !user2) return null;

    // Создаем уведомления для обоих пользователей
    const notifications = await Promise.all([
      this.createNotification({
        user_id: userId1,
        type: 'match',
        title: 'Взаимная симпатия!',
        message: `У вас взаимная симпатия с ${user2.login}! Теперь вы можете общаться.`,
        from_user: userId2,
        target_id: userId2,
        target_type: 'user',
        priority: 'high',
        data: { match_user: userId2 }
      }),
      this.createNotification({
        user_id: userId2,
        type: 'match',
        title: 'Взаимная симпатия!',
        message: `У вас взаимная симпатия с ${user1.login}! Теперь вы можете общаться.`,
        from_user: userId1,
        target_id: userId1,
        target_type: 'user',
        priority: 'high',
        data: { match_user: userId1 }
      })
    ]);

    return notifications;
  };

  Notifications.createMessageNotification = async function(toUserId, fromUserId, messageText) {
    const User = sequelize.models.User;
    const fromUser = await User.findOne({ where: { login: fromUserId } });
    
    if (!fromUser) return null;

    const truncatedMessage = messageText.length > 50 
      ? messageText.substring(0, 50) + '...'
      : messageText;

    return await this.createNotification({
      user_id: toUserId,
      type: 'message',
      title: 'Новое сообщение',
      message: `${fromUser.login}: ${truncatedMessage}`,
      from_user: fromUserId,
      target_id: fromUserId,
      target_type: 'user',
      priority: 'normal',
      data: { message_preview: truncatedMessage }
    });
  };

  Notifications.createGiftNotification = async function(toUserId, fromUserId, giftType) {
    const User = sequelize.models.User;
    const fromUser = await User.findOne({ where: { login: fromUserId } });
    
    if (!fromUser) return null;

    return await this.createNotification({
      user_id: toUserId,
      type: 'gift',
      title: 'Новый подарок!',
      message: `${fromUser.login} отправил(а) вам подарок!`,
      from_user: fromUserId,
      target_id: fromUserId,
      target_type: 'gift',
      priority: 'high',
      data: { gift_type: giftType }
    });
  };

  // Ассоциации
  Notifications.associate = function(models) {
    Notifications.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'login',
      as: 'User'
    });

    Notifications.belongsTo(models.User, {
      foreignKey: 'from_user',
      targetKey: 'login',
      as: 'FromUser'
    });
  };

  return Notifications;
};