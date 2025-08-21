const { Sequelize } = require('sequelize');

// Конфигурация для Sequelize CLI
const config = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'swingfox',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME_TEST || 'swingfox_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  },
  production: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'swingfox',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    pool: {
      max: 20,
      min: 0,
      acquire: 60000,
      idle: 10000
    }
  }
};

// Создание экземпляра Sequelize для приложения
const currentConfig = config[process.env.NODE_ENV || 'development'];
const sequelize = new Sequelize(currentConfig);

// Тестирование подключения
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к PostgreSQL успешно установлено');
  } catch (error) {
    console.error('❌ Не удалось подключиться к базе данных:', error.message);
  }
};

// Экспорт для Sequelize CLI и приложения
module.exports = config;
module.exports.sequelize = sequelize;
module.exports.testConnection = testConnection;