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

  return Rating;
};