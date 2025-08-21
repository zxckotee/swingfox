const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Geo = sequelize.define('Geo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Название страны'
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Регион/область/штат'
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Название города'
  }
}, {
  tableName: 'geo',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['country']
    },
    {
      fields: ['country', 'region']
    },
    {
      fields: ['country', 'city']
    },
    {
      fields: ['city']
    },
    {
      unique: true,
      fields: ['country', 'region', 'city'],
      name: 'geo_unique_location'
    }
  ]
});

// Статические методы для удобной работы с географическими данными
Geo.getCountries = function() {
  return this.findAll({
    attributes: ['country'],
    group: ['country'],
    order: [['country', 'ASC']]
  });
};

Geo.getCitiesByCountry = function(country) {
  return this.findAll({
    where: { country },
    attributes: ['city', 'region'],
    order: [['city', 'ASC']]
  });
};

Geo.getRegionsByCountry = function(country) {
  return this.findAll({
    where: { 
      country,
      region: {
        [sequelize.Sequelize.Op.ne]: null
      }
    },
    attributes: ['region'],
    group: ['region'],
    order: [['region', 'ASC']]
  });
};

Geo.getCitiesByCountryAndRegion = function(country, region) {
  return this.findAll({
    where: { country, region },
    attributes: ['city'],
    order: [['city', 'ASC']]
  });
};

Geo.validateLocation = async function(country, city, region = null) {
  const whereCondition = { country, city };
  if (region) {
    whereCondition.region = region;
  }
  
  const location = await this.findOne({ where: whereCondition });
  return !!location;
};

Geo.searchCities = function(searchTerm, limit = 50) {
  return this.findAll({
    where: {
      [sequelize.Sequelize.Op.or]: [
        {
          city: {
            [sequelize.Sequelize.Op.iLike]: `%${searchTerm}%`
          }
        },
        {
          country: {
            [sequelize.Sequelize.Op.iLike]: `%${searchTerm}%`
          }
        }
      ]
    },
    limit,
    order: [['city', 'ASC']]
  });
};

module.exports = Geo;