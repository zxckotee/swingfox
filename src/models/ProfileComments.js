const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProfileComments = sequelize.define('ProfileComments', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    from_user: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Пользователь, который оставил комментарий'
    },
    to_user: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Пользователь, к профилю которого оставлен комментарий'
    },
    comment_text: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Текст комментария'
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Виден ли комментарий всем или только получателю'
    },
    is_edited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Был ли комментарий отредактирован'
    },
    edited_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Дата последнего редактирования'
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Удален ли комментарий'
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Дата удаления'
    }
  }, {
    tableName: 'profile_comments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['to_user', 'created_at'],
        name: 'idx_profile_comments_to_user_date'
      },
      {
        fields: ['from_user', 'created_at'],
        name: 'idx_profile_comments_from_user_date'
      },
      {
        fields: ['is_public', 'is_deleted'],
        name: 'idx_profile_comments_visibility'
      }
    ]
  });

  // Ассоциации
  ProfileComments.associate = (models) => {
    ProfileComments.belongsTo(models.User, {
      foreignKey: 'from_user',
      targetKey: 'login',
      as: 'author'
    });

    ProfileComments.belongsTo(models.User, {
      foreignKey: 'to_user',
      targetKey: 'login',
      as: 'recipient'
    });
  };

  // Статические методы
  ProfileComments.getProfileComments = async (username, options = {}) => {
    const { limit = 20, offset = 0, includePrivate = false, currentUser = null } = options;
    
    const where = { 
      to_user: username,
      is_deleted: false
    };

    // Если не включаем приватные комментарии, показываем только публичные
    if (!includePrivate) {
      where.is_public = true;
    }

    // Сначала получаем общее количество комментариев
    const totalCount = await ProfileComments.count({ where });
    console.log('🔍 [ProfileComments] Count query result:', totalCount);
    console.log('🔍 [ProfileComments] Where clause:', JSON.stringify(where, null, 2));
    
    // Затем получаем комментарии с лимитом
    const comments = await ProfileComments.findAll({
      where,
      include: [{
        model: sequelize.models.User,
        as: 'author',
        attributes: ['login', 'ava', 'viptype']
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    console.log('🔍 [ProfileComments] Found comments:', comments.length);
    console.log('🔍 [ProfileComments] Returning total:', totalCount);

    return {
      username,
      total: totalCount,
      comments: comments.map(comment => ({
        id: comment.id,
        text: comment.comment_text,
        is_public: comment.is_public,
        is_edited: comment.is_edited,
        edited_at: comment.edited_at,
        created_at: comment.created_at,
        can_edit: currentUser === comment.author?.login,
        can_delete: currentUser === comment.author?.login || currentUser === username,
        author: comment.author ? {
          login: comment.author.login,
          name: comment.author.login,
          avatar: comment.author.ava,
          vip_type: comment.author.viptype
        } : null
      })),
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };
  };

  ProfileComments.getUserComments = async (username, options = {}) => {
    const { limit = 20, offset = 0, includeDeleted = false } = options;
    
    const where = { 
      from_user: username,
      is_deleted: false 
    };

    if (includeDeleted) {
      delete where.is_deleted;
    }

    return await ProfileComments.findAll({
      where,
      include: [{
        model: sequelize.models.User,
        as: 'recipient',
        attributes: ['login', 'ava']
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
  };

  ProfileComments.createComment = async (fromUser, toUser, commentText, isPublic = true) => {
    return await ProfileComments.create({
      from_user: fromUser,
      to_user: toUser,
      comment_text: commentText,
      is_public: isPublic
    });
  };

  ProfileComments.updateComment = async (commentId, fromUser, newText) => {
    const comment = await ProfileComments.findOne({
      where: {
        id: commentId,
        from_user: fromUser,
        is_deleted: false
      }
    });

    if (!comment) {
      throw new Error('Комментарий не найден или у вас нет прав на его редактирование');
    }

    await comment.update({
      comment_text: newText,
      is_edited: true,
      edited_at: new Date()
    });

    return comment;
  };

  ProfileComments.deleteComment = async (commentId, username) => {
    const comment = await ProfileComments.findOne({
      where: {
        id: commentId,
        [sequelize.Sequelize.Op.or]: [
          { from_user: username },
          { to_user: username }
        ],
        is_deleted: false
      }
    });

    if (!comment) {
      throw new Error('Комментарий не найден или у вас нет прав на его удаление');
    }

    await comment.update({
      is_deleted: true,
      deleted_at: new Date()
    });

    return comment;
  };

  ProfileComments.getCommentCount = async (username) => {
    return await ProfileComments.count({
      where: {
        to_user: username,
        is_deleted: false,
        is_public: true
      }
    });
  };

  return ProfileComments;
};
