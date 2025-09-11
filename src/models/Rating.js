const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Rating = sequelize.define('Rating', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    from_user: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Пользователь, который оценил'
    },
    to_user: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Пользователь, которого оценили'
    },
    value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Значение рейтинга: 1 (плюс) или -1 (минус)'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    }
  }, {
    tableName: 'rating',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['from_user', 'to_user'],
        name: 'unique_user_rating'
      }
    ]
  });

  // Ассоциации
  Rating.associate = (models) => {
    Rating.belongsTo(models.User, {
      foreignKey: 'from_user',
      targetKey: 'login',
      as: 'rater'
    });

    Rating.belongsTo(models.User, {
      foreignKey: 'to_user',
      targetKey: 'login',
      as: 'rated'
    });
  };

  // Методы модели
  Rating.getUserRating = async (login) => {
    const ratings = await Rating.findAll({
      where: { to_user: login },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('value')), 'total_rating'],
        [sequelize.fn('COUNT', sequelize.col('value')), 'total_votes'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN value = 1 THEN 1 ELSE 0 END')), 'positive_votes'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN value = -1 THEN 1 ELSE 0 END')), 'negative_votes']
      ],
      raw: true
    });

    const result = ratings[0];
    const totalRating = parseInt(result.total_rating) || 0;
    const totalVotes = parseInt(result.total_votes) || 0;
    const positiveVotes = parseInt(result.positive_votes) || 0;
    const negativeVotes = parseInt(result.negative_votes) || 0;

    return {
      total_rating: totalRating,
      total_votes: totalVotes,
      positive_votes: positiveVotes,
      negative_votes: negativeVotes,
      average_rating: totalVotes > 0 ? (totalRating / totalVotes).toFixed(1) : 0,
      percentage_positive: totalVotes > 0 ? Math.round((positiveVotes / totalVotes) * 100) : 0
    };
  };

  Rating.setUserRating = async (fromUser, toUser, value) => {
    // Проверяем, что пользователь не ставит рейтинг самому себе
    if (fromUser === toUser) {
      throw new Error('Нельзя ставить рейтинг самому себе');
    }

    // Проверяем корректность значения
    if (value !== 1 && value !== -1) {
      throw new Error('Значение рейтинга должно быть 1 или -1');
    }

    const existingRating = await Rating.findOne({
      where: {
        from_user: fromUser,
        to_user: toUser
      }
    });

    const today = new Date().toISOString().split('T')[0];

    if (existingRating) {
      // Обновляем существующий рейтинг
      await existingRating.update({
        value,
        date: today
      });
      return { action: 'updated', rating: existingRating };
    } else {
      // Создаем новый рейтинг
      const newRating = await Rating.create({
        from_user: fromUser,
        to_user: toUser,
        value,
        date: today
      });
      return { action: 'created', rating: newRating };
    }
  };

  Rating.getUserRatingHistory = async (login, limit = 10) => {
    return await Rating.findAll({
      where: { to_user: login },
      include: [{
        model: sequelize.models.User,
        as: 'rater',
        attributes: ['login', 'ava']
      }],
      order: [['created_at', 'DESC']],
      limit
    });
  };

  // Комплексный расчет рейтинга с учетом активности
  Rating.getComprehensiveRating = async (login) => {
    const { Reactions, ProfileComments, PhotoComments, ImageLikes } = sequelize.models;
    
    // 1. Прямые оценки (стрелочки вверх/вниз)
    const directRatings = await Rating.findAll({
      where: { to_user: login },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('value')), 'total_rating'],
        [sequelize.fn('COUNT', sequelize.col('value')), 'total_votes'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN value = 1 THEN 1 ELSE 0 END')), 'positive_votes'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN value = -1 THEN 1 ELSE 0 END')), 'negative_votes']
      ],
      raw: true
    });

    const directResult = directRatings[0];
    const directRating = parseInt(directResult.total_rating) || 0;
    const directVotes = parseInt(directResult.total_votes) || 0;

    // 2. Реакции на фото пользователя
    const photoReactions = await Reactions.findAll({
      where: { 
        object_type: 'image',
        object_id: { [sequelize.Sequelize.Op.like]: `%${login}%` } // Предполагаем, что в object_id есть login
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('value')), 'total_reactions'],
        [sequelize.fn('COUNT', sequelize.col('value')), 'reaction_count']
      ],
      raw: true
    });

    const photoReactionResult = photoReactions[0];
    const photoReactionScore = parseInt(photoReactionResult.total_reactions) || 0;
    const photoReactionCount = parseInt(photoReactionResult.reaction_count) || 0;

    // 3. Реакции на профиль
    const profileReactions = await Reactions.findAll({
      where: { 
        object_type: 'profile',
        object_id: login
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('value')), 'total_reactions'],
        [sequelize.fn('COUNT', sequelize.col('value')), 'reaction_count']
      ],
      raw: true
    });

    const profileReactionResult = profileReactions[0];
    const profileReactionScore = parseInt(profileReactionResult.total_reactions) || 0;
    const profileReactionCount = parseInt(profileReactionResult.reaction_count) || 0;

    // 4. Комментарии к профилю
    const profileComments = await ProfileComments.count({
      where: { 
        to_user: login,
        is_deleted: false
      }
    });

    // 5. Комментарии к фото пользователя
    const photoComments = await PhotoComments.count({
      where: { 
        image_filename: { [sequelize.Sequelize.Op.like]: `%${login}%` },
        is_deleted: false
      }
    });

    // 6. Лайки фото (если есть таблица ImageLikes)
    let photoLikes = 0;
    try {
      photoLikes = await ImageLikes.count({
        where: { 
          to_user: login
        }
      });
    } catch (error) {
      // Таблица может не существовать
      console.log('ImageLikes table not found, skipping photo likes calculation');
    }

    // Расчет комплексного рейтинга с весами
    const weights = {
      directRating: 3.0,        // Прямые оценки - самый важный фактор
      photoReactions: 2.0,      // Реакции на фото
      profileReactions: 1.5,    // Реакции на профиль
      profileComments: 1.0,     // Комментарии к профилю
      photoComments: 0.8,       // Комментарии к фото
      photoLikes: 0.5           // Лайки фото
    };

    const comprehensiveScore = 
      (directRating * weights.directRating) +
      (photoReactionScore * weights.photoReactions) +
      (profileReactionScore * weights.profileReactions) +
      (profileComments * weights.profileComments) +
      (photoComments * weights.photoComments) +
      (photoLikes * weights.photoLikes);

    const totalActivity = 
      directVotes + 
      photoReactionCount + 
      profileReactionCount + 
      profileComments + 
      photoComments + 
      photoLikes;

    return {
      // Основные показатели
      comprehensive_score: Math.round(comprehensiveScore),
      total_activity: totalActivity,
      
      // Детальная разбивка
      direct_rating: {
        score: directRating,
        votes: directVotes,
        positive_votes: parseInt(directResult.positive_votes) || 0,
        negative_votes: parseInt(directResult.negative_votes) || 0,
        percentage_positive: directVotes > 0 ? Math.round((parseInt(directResult.positive_votes) / directVotes) * 100) : 0
      },
      
      photo_reactions: {
        score: photoReactionScore,
        count: photoReactionCount
      },
      
      profile_reactions: {
        score: profileReactionScore,
        count: profileReactionCount
      },
      
      comments: {
        profile_comments: profileComments,
        photo_comments: photoComments,
        total_comments: profileComments + photoComments
      },
      
      photo_likes: photoLikes,
      
      // Веса для отладки
      weights: weights
    };
  };

  return Rating;
};