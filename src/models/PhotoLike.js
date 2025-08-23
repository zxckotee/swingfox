const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PhotoLike = sequelize.define('PhotoLike', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false
    },
    from_user: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'users',
        key: 'login'
      }
    },
    to_user: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'users',
        key: 'login'
      }
    },
    photo_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'photo_likes',
    timestamps: false,
    indexes: [
      {
        fields: ['from_user', 'to_user', 'photo_index'],
        unique: true
      },
      {
        fields: ['to_user', 'photo_index']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  PhotoLike.associate = (models) => {
    PhotoLike.belongsTo(models.User, {
      foreignKey: 'from_user',
      targetKey: 'login',
      as: 'FromUser'
    });

    PhotoLike.belongsTo(models.User, {
      foreignKey: 'to_user',
      targetKey: 'login',
      as: 'ToUser'
    });
  };

  return PhotoLike;
};