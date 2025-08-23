const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PhotoComments = sequelize.define('PhotoComments', {
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
    image_filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Имя файла изображения'
    },
    comment_text: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Текст комментария'
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
    tableName: 'photo_comments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['image_filename', 'created_at'],
        name: 'idx_photo_comments_image_date'
      },
      {
        fields: ['from_user', 'created_at'],
        name: 'idx_photo_comments_user_date'
      },
      {
        fields: ['is_deleted'],
        name: 'idx_photo_comments_deleted'
      }
    ]
  });

  // Ассоциации
  PhotoComments.associate = (models) => {
    PhotoComments.belongsTo(models.User, {
      foreignKey: 'from_user',
      targetKey: 'login',
      as: 'user'
    });
  };

  // Статические методы
  PhotoComments.getImageComments = async (imageFilename, options = {}) => {
    const { limit = 20, offset = 0, includeDeleted = false } = options;
    
    const where = { 
      image_filename: imageFilename,
      is_deleted: false 
    };

    if (includeDeleted) {
      delete where.is_deleted;
    }

    // Сначала получаем общее количество комментариев
    const totalCount = await PhotoComments.count({ where });
    console.log('🔍 [PhotoComments] Count query result:', totalCount);
    console.log('🔍 [PhotoComments] Where clause:', JSON.stringify(where, null, 2));
    
    // Затем получаем комментарии с лимитом
    const comments = await PhotoComments.findAll({
      where,
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['login', 'ava', 'viptype']
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    console.log('🔍 [PhotoComments] Found comments:', comments.length);
    console.log('🔍 [PhotoComments] Found comments:', totalCount);

    return {
      filename: imageFilename,
      total: totalCount,
      comments: comments.map(comment => ({
        id: comment.id,
        text: comment.comment_text,
        is_edited: comment.is_edited,
        edited_at: comment.edited_at,
        created_at: comment.created_at,
        user: comment.user ? {
          login: comment.user.login,
          name: comment.user.login,
          avatar: comment.user.ava,
          vip_type: comment.user.viptype
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

  PhotoComments.getUserComments = async (username, options = {}) => {
    const { limit = 20, offset = 0, includeDeleted = false } = options;
    
    const where = { 
      from_user: username,
      is_deleted: false 
    };

    if (includeDeleted) {
      delete where.is_deleted;
    }

    return await PhotoComments.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
  };

  PhotoComments.createComment = async (fromUser, imageFilename, commentText) => {
    return await PhotoComments.create({
      from_user: fromUser,
      image_filename: imageFilename,
      comment_text: commentText
    });
  };

  PhotoComments.updateComment = async (commentId, fromUser, newText) => {
    const comment = await PhotoComments.findOne({
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

  PhotoComments.deleteComment = async (commentId, fromUser) => {
    const comment = await PhotoComments.findOne({
      where: {
        id: commentId,
        from_user: fromUser,
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

  PhotoComments.getCommentCount = async (imageFilename) => {
    return await PhotoComments.count({
      where: {
        image_filename: imageFilename,
        is_deleted: false
      }
    });
  };

  return PhotoComments;
};
