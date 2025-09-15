const { Status } = require('../models');

/**
 * Middleware для обновления активности пользователя
 * Автоматически обновляет last_activity при каждом запросе к API
 */
const updateUserActivity = async (req, res, next) => {
  try {
    // Обновляем активность только для аутентифицированных пользователей
    if (req.user && req.user.login) {
      const login = req.user.login;
      
      // Обновляем статус как "онлайн" в таблице Status
      await Status.updateUserStatus(login, 'online');
      
      // Также обновляем поле online в таблице User
      const { User } = require('../models');
      await User.update(
        { online: new Date() },
        { where: { login } }
      );
    }
    
    next();
  } catch (error) {
    // Не блокируем запрос в случае ошибки обновления активности
    console.warn('Failed to update user activity:', error.message);
    next();
  }
};

module.exports = updateUserActivity;
