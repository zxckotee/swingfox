const express = require('express');
const router = express.Router();
const { User, Likes } = require('../models');
const { authenticateToken, requireVip } = require('../middleware/auth');
const { generateId, calculateDistance, formatAge, parseGeo, formatOnlineTime } = require('../utils/helpers');

// Хранилище для истории слайдов пользователей (в продакшене использовать Redis)
const userSlideHistory = new Map();

// GET /api/swipe/profiles - Получение профилей для свайпинга
router.get('/profiles', authenticateToken, async (req, res) => {
  try {
    const { direction = 'forward' } = req.query;
    const userId = req.user.login;

    // Получаем данные текущего пользователя
    const currentUser = await User.findOne({ where: { login: userId } });
    if (!currentUser) {
      return res.status(404).json({ 
        error: 'user_not_found',
        message: 'Пользователь не найден' 
      });
    }

    let targetUser;

    if (direction === 'back') {
      // Возврат к предыдущему профилю (только для VIP)
      if (currentUser.viptype === 'FREE') {
        return res.status(403).json({ 
          error: 'no_permission',
          message: 'Требуется VIP статус для возврата к предыдущим профилям' 
        });
      }

      const history = userSlideHistory.get(userId) || [];
      if (history.length < 2) {
        return res.status(404).json({ 
          error: 'no_previous',
          message: 'Нет предыдущих профилей' 
        });
      }

      // Берем предпоследний профиль из истории
      const targetLogin = history[history.length - 2];
      targetUser = await User.findOne({ where: { login: targetLogin } });
    } else {
      // Получение нового случайного профиля
      targetUser = await User.findOne({
        where: {
          login: { [User.sequelize.Op.ne]: userId },
          viptype: { [User.sequelize.Op.ne]: 'FREE' } // Показываем только VIP пользователей
        },
        order: User.sequelize.random()
      });
    }

    if (!targetUser) {
      return res.status(404).json({ 
        error: 'no_profiles',
        message: 'Нет доступных профилей' 
      });
    }

    // Вычисляем расстояние
    const currentGeo = parseGeo(currentUser.geo);
    const targetGeo = parseGeo(targetUser.geo);
    
    let distance = 0;
    if (currentGeo && targetGeo) {
      distance = Math.round(calculateDistance(
        currentGeo.lat, currentGeo.lng,
        targetGeo.lat, targetGeo.lng
      ));
    }

    // Форматируем возраст
    const age = formatAge(targetUser.date);

    // Форматируем время онлайн
    const onlineStatus = formatOnlineTime(targetUser.online);

    // Обновляем историю слайдов
    const history = userSlideHistory.get(userId) || [];
    if (history.length >= 2) {
      history.shift(); // Удаляем старый элемент
    }
    history.push(targetUser.login);
    userSlideHistory.set(userId, history);

    // Формируем ответ
    const profileData = {
      id: targetUser.id,
      login: targetUser.login,
      ava: targetUser.ava,
      age,
      status: targetUser.status,
      city: targetUser.city,
      distance,
      registration: targetUser.registration,
      info: targetUser.info,
      online: onlineStatus
    };

    res.json(profileData);

  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении профилей' 
    });
  }
});

// POST /api/swipe/like - Лайк профиля
router.post('/like', authenticateToken, async (req, res) => {
  try {
    const { target_user } = req.body;
    const fromUser = req.user.login;

    if (!target_user) {
      return res.status(400).json({ 
        error: 'missing_target',
        message: 'Не указан пользователь для лайка' 
      });
    }

    // Получаем данные текущего пользователя
    const currentUser = await User.findOne({ where: { login: fromUser } });
    
    // Проверяем лимиты для бесплатных пользователей
    if (currentUser.viptype === 'FREE') {
      const today = new Date().toISOString().split('T')[0];
      const todayLikesCount = await Likes.getTodayLikesCount(fromUser, new Date());
      
      if (todayLikesCount >= 50) {
        return res.status(429).json({ 
          error: 'like_limit',
          message: 'Превышен дневной лимит лайков (50). Необходим VIP или PREMIUM статус' 
        });
      }
    }

    // Проверяем взаимный лайк
    const mutualLike = await Likes.checkMutualLike(fromUser, target_user);
    const likeId = generateId();
    const today = new Date().toISOString().split('T')[0];

    if (mutualLike) {
      // Взаимный лайк - обновляем статус
      await mutualLike.update({ reciprocal: 'yes' });
      
      // Создаем новый лайк
      await Likes.create({
        id: likeId,
        date: today,
        like_from: fromUser,
        like_to: target_user,
        reciprocal: 'yes',
        super_message: '0'
      });

      res.json({
        result: 'reciprocal_like',
        message: 'Есть взаимная симпатия! Заходите в личный кабинет, чтобы посмотреть кто это!'
      });
    } else {
      // Обычный лайк
      await Likes.create({
        id: likeId,
        date: today,
        like_from: fromUser,
        like_to: target_user,
        reciprocal: 'empty',
        super_message: '0'
      });

      res.json({
        result: 'success',
        message: 'Лайк отправлен'
      });
    }

  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при отправке лайка' 
    });
  }
});

// POST /api/swipe/dislike - Дизлайк профиля
router.post('/dislike', authenticateToken, async (req, res) => {
  try {
    const { target_user } = req.body;
    const fromUser = req.user.login;

    if (!target_user) {
      return res.status(400).json({ 
        error: 'missing_target',
        message: 'Не указан пользователь для дизлайка' 
      });
    }

    // Проверяем есть ли лайк от этого пользователя к нам
    const incomingLike = await Likes.findOne({
      where: {
        like_from: target_user,
        like_to: fromUser,
        reciprocal: 'empty'
      }
    });

    if (incomingLike) {
      // Отклоняем входящий лайк
      await incomingLike.update({ reciprocal: 'no' });
      
      res.json({
        result: 'reciprocal_dislike',
        message: 'Лайк отклонен'
      });
    } else {
      res.json({
        result: 'forward',
        message: 'Профиль пропущен'
      });
    }

  } catch (error) {
    console.error('Dislike error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при дизлайке' 
    });
  }
});

// POST /api/swipe/superlike - Суперлайк
router.post('/superlike', authenticateToken, async (req, res) => {
  try {
    const { target_user, message } = req.body;
    const fromUser = req.user.login;

    if (!target_user || !message) {
      return res.status(400).json({ 
        error: 'missing_data',
        message: 'Не указан пользователь или сообщение для суперлайка' 
      });
    }

    // Получаем данные пользователя
    const currentUser = await User.findOne({ where: { login: fromUser } });
    
    if (currentUser.viptype === 'FREE') {
      return res.status(403).json({ 
        error: 'no_permission',
        message: 'Суперлайки доступны только VIP и PREMIUM пользователям' 
      });
    }

    // Проверяем лимиты суперлайков
    const today = new Date();
    const todaySuperlikes = await Likes.getTodaySuperlikes(fromUser, today);
    
    let maxSuperlikes = 0;
    if (currentUser.viptype === 'VIP') maxSuperlikes = 5;
    if (currentUser.viptype === 'PREMIUM') maxSuperlikes = 10;

    if (todaySuperlikes.length >= maxSuperlikes) {
      return res.status(429).json({ 
        error: 'limit_exceeded',
        message: 'Ваши суперлайки на сегодня закончились' 
      });
    }

    // Создаем суперлайк
    const likeId = generateId();
    const todayStr = today.toISOString().split('T')[0];

    await Likes.create({
      id: likeId,
      date: todayStr,
      like_from: fromUser,
      like_to: target_user,
      reciprocal: 'empty',
      super_message: message
    });

    // Автоматически создаем взаимный лайк (суперлайк это всегда взаимность)
    const mutualLike = await Likes.findOne({
      where: {
        like_from: target_user,
        like_to: fromUser
      }
    });

    if (mutualLike) {
      await mutualLike.update({ reciprocal: 'yes' });
    }

    res.json({
      result: 'success',
      message: 'Суперлайк отправлен',
      remaining_count: maxSuperlikes - todaySuperlikes.length - 1
    });

  } catch (error) {
    console.error('Superlike error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при отправке суперлайка' 
    });
  }
});

// GET /api/swipe/superlike-count - Получение количества доступных суперлайков
router.get('/superlike-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.login;
    
    // Получаем данные пользователя
    const currentUser = await User.findOne({ where: { login: userId } });
    
    if (currentUser.viptype === 'FREE') {
      return res.status(403).json({ 
        error: 'no_permission',
        message: 'Суперлайки доступны только VIP и PREMIUM пользователям' 
      });
    }

    let maxSuperlikes = 0;
    if (currentUser.viptype === 'VIP') maxSuperlikes = 5;
    if (currentUser.viptype === 'PREMIUM') maxSuperlikes = 10;

    // Подсчитываем использованные сегодня
    const today = new Date();
    const todaySuperlikes = await Likes.getTodaySuperlikes(userId, today);
    const remainingCount = maxSuperlikes - todaySuperlikes.length;

    res.json({
      total: maxSuperlikes,
      used: todaySuperlikes.length,
      remaining: remainingCount,
      vip_type: currentUser.viptype
    });

  } catch (error) {
    console.error('Superlike count error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении данных о суперлайках' 
    });
  }
});

module.exports = router;