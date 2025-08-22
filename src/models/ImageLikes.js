const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ImageLikes = sequelize.define('ImageLikes', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    from_user: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Пользователь, который лайкнул'
    },
    image_filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Имя файла изображения'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    }
  }, {
    tableName: 'image_likes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['from_user', 'image_filename'],
        name: 'unique_user_image_like'
      }
    ]
  });

  // Ассоциации
  ImageLikes.associate = (models) => {
    ImageLikes.belongsTo(models.User, {
      foreignKey: 'from_user',
      targetKey: 'login',
      as: 'user'
    });
  };

  // Статические методы
  ImageLikes.getImageLikes = async (imageFilename) => {
    const likes = await ImageLikes.findAll({
      where: { image_filename: imageFilename },
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['login', 'ava']
      }],
      order: [['created_at', 'DESC']]
    });

    return {
      total: likes.length,
      likes: likes.map(like => ({
        user: like.user.login,
        avatar: like.user.ava,
        date: like.date
      }))
    };
  };

  ImageLikes.getUserImageLike = async (fromUser, imageFilename) => {
    return await ImageLikes.findOne({
      where: {
        from_user: fromUser,
        image_filename: imageFilename
      }
    });
  };

  ImageLikes.toggleLike = async (fromUser, imageFilename) => {
    const existingLike = await ImageLikes.getUserImageLike(fromUser, imageFilename);
    
    if (existingLike) {
      // Удаляем лайк
      await existingLike.destroy();
      return { action: 'removed', liked: false };
    } else {
      // Добавляем лайк
      await ImageLikes.create({
        from_user: fromUser,
        image_filename: imageFilename,
        date: new Date().toISOString().split('T')[0]
      });
      return { action: 'added', liked: true };
    }
  };

  ImageLikes.getUserLikesCount = async (fromUser, dateFrom = null) => {
    const where = { from_user: fromUser };
    
    if (dateFrom) {
      where.date = {
        [sequelize.Sequelize.Op.gte]: dateFrom
      };
    }

    return await ImageLikes.count({ where });
  };

  return ImageLikes;
};