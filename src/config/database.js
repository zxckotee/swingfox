const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'swingfox',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
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
});

// Тестирование подключения
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к PostgreSQL успешно установлено');
  } catch (error) {
    console.error('❌ Не удалось подключиться к базе данных:', error.message);
  }
};

module.exports = { sequelize, testConnection };