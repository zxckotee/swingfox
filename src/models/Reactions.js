const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Reactions = sequelize.define('Reactions', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    from_user: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Пользователь, который поставил реакцию'
    },
    object_type: {
      type: DataTypes.ENUM('image', 'post', 'profile', 'comment'),
      allowNull: false,
      comment: 'Тип объекта: image, post, profile, comment'
    },
    object_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'ID или имя файла объекта'
    },
    reaction_type: {
      type: DataTypes.ENUM('like', 'love', 'laugh', 'wow', 'sad', 'angry'),
      allowNull: false,
      defaultValue: 'like',
      comment: 'Тип реакции: like, love, laugh, wow, sad, angry'
    },
    value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Значение реакции: 1 (позитивная), -1 (негативная), 0 (нейтральная)'
    }
  }, {
    tableName: 'reactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['from_user', 'object_type', 'object_id'],
        name: 'unique_user_object_reaction'
      },
      {
        fields: ['object_type', 'object_id'],
        name: 'idx_reactions_object'
      },
      {
        fields: ['from_user', 'created_at'],
        name: 'idx_reactions_user_date'
      },
      {
        fields: ['reaction_type', 'value'],
        name: 'idx_reactions_type_value'
      }
    ]
  });

  // Ассоциации
  Reactions.associate = (models) => {
    Reactions.belongsTo(models.User, {
      foreignKey: 'from_user',
      targetKey: 'login',
      as: 'user'
    });
  };

  // Статические методы
  Reactions.getObjectReactions = async (objectType, objectId) => {
    const reactions = await Reactions.findAll({
      where: {
        object_type: objectType,
        object_id: objectId
      },
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['login', 'ava']
      }],
      order: [['created_at', 'DESC']]
    });

    // Группируем реакции по типам
    const groupedReactions = {
      like: 0,
      love: 0,
      laugh: 0,
      wow: 0,
      sad: 0,
      angry: 0,
      total: reactions.length,
      users: reactions.map(reaction => ({
        login: reaction.user?.login,
        name: reaction.user?.login,
        avatar: reaction.user?.ava,
        reaction_type: reaction.reaction_type,
        created_at: reaction.created_at
      }))
    };

    reactions.forEach(reaction => {
      if (groupedReactions[reaction.reaction_type] !== undefined) {
        groupedReactions[reaction.reaction_type]++;
      }
    });

    return groupedReactions;
  };

  Reactions.getUserReaction = async (fromUser, objectType, objectId) => {
    return await Reactions.findOne({
      where: {
        from_user: fromUser,
        object_type: objectType,
        object_id: objectId
      }
    });
  };

  Reactions.setReaction = async (fromUser, objectType, objectId, reactionType, value = 1) => {
    const existingReaction = await Reactions.getUserReaction(fromUser, objectType, objectId);

    if (existingReaction) {
      // Обновляем существующую реакцию
      await existingReaction.update({
        reaction_type: reactionType,
        value
      });
      return { action: 'updated', reaction: existingReaction };
    } else {
      // Создаем новую реакцию
      const newReaction = await Reactions.create({
        from_user: fromUser,
        object_type: objectType,
        object_id: objectId,
        reaction_type: reactionType,
        value
      });
      return { action: 'created', reaction: newReaction };
    }
  };

  Reactions.removeReaction = async (fromUser, objectType, objectId) => {
    const existingReaction = await Reactions.getUserReaction(fromUser, objectType, objectId);

    if (existingReaction) {
      await existingReaction.destroy();
      return { action: 'removed', reaction: existingReaction };
    }

    return { action: 'not_found' };
  };

  Reactions.getUserReactions = async (fromUser, options = {}) => {
    const { limit = 20, offset = 0, objectType = null } = options;
    
    const where = { from_user: fromUser };
    
    if (objectType) {
      where.object_type = objectType;
    }

    return await Reactions.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
  };

  Reactions.getReactionStats = async (objectType, objectId) => {
    const stats = await Reactions.findAll({
      where: {
        object_type: objectType,
        object_id: objectId
      },
      attributes: [
        'reaction_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['reaction_type'],
      raw: true
    });

    const result = {
      like: 0,
      love: 0,
      laugh: 0,
      wow: 0,
      sad: 0,
      angry: 0,
      total: 0
    };

    stats.forEach(stat => {
      const type = stat.reaction_type;
      const count = parseInt(stat.count);
      if (result[type] !== undefined) {
        result[type] = count;
        result.total += count;
      }
    });

    return result;
  };

  return Reactions;
};
