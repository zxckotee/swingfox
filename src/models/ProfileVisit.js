const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProfileVisit = sequelize.define('ProfileVisit', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false
    },
    visitor: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'users',
        key: 'login'
      }
    },
    visited: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: 'users',
        key: 'login'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'profile_visits',
    timestamps: false,
    indexes: [
      {
        fields: ['visitor', 'visited']
      },
      {
        fields: ['visited', 'created_at']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  ProfileVisit.associate = (models) => {
    ProfileVisit.belongsTo(models.User, {
      foreignKey: 'visitor',
      targetKey: 'login',
      as: 'VisitorUser'
    });

    ProfileVisit.belongsTo(models.User, {
      foreignKey: 'visited',
      targetKey: 'login',
      as: 'VisitedUser'
    });
  };

  return ProfileVisit;
};