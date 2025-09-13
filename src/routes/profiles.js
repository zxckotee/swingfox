const express = require('express');
const router = express.Router();
const { User, Likes, Gifts, Rating, PhotoLike, ProfileVisit, PhotoComments, ProfileComments, Reactions } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { generateId, calculateDistance, parseGeo, formatAge, formatOnlineTime } = require('../utils/helpers');
const { APILogger } = require('../utils/logger');

// GET /api/profiles/:login - Получение полного профиля пользователя
router.get('/:login', authenticateToken, async (req, res) => {
  const logger = new APILogger('PROFILES');
  
  try {
    logger.logRequest(req, 'GET /:login');
    
    const { login } = req.params;
    const fromUser = req.user.login;

    logger.logProcess('Получение профиля пользователя', { target_user: login }, req);

    // Получаем профиль пользователя
    const targetUser = await User.findOne({ where: { login } });
    if (!targetUser) {
      const errorData = { error: 'user_not_found', message: 'Пользователь не найден' };
      logger.logError(req, new Error('Target user not found'), 404);
      return res.status(404).json(errorData);
    }

    // Вычисляем расстояние между пользователями
    const currentUser = await User.findOne({ where: { login: fromUser } });
    let distance = 0;
    
    if (currentUser && currentUser.geo && targetUser.geo) {
      const currentGeo = parseGeo(currentUser.geo);
      const targetGeo = parseGeo(targetUser.geo);
      
      if (currentGeo && targetGeo) {
        distance = Math.round(calculateDistance(
          currentGeo.lat, currentGeo.lng,
          targetGeo.lat, targetGeo.lng
        ));
      }
    }

    // Форматируем возраст
    const age = formatAge(targetUser.date);

    // Форматируем время онлайн
    const onlineStatus = formatOnlineTime(targetUser.online);

    // Формируем ответ с учетом настроек приватности
    const response = {
      profile: {
        login: targetUser.login,
        name: targetUser.name,
        ava: targetUser.ava,
        status: targetUser.status,
        country: targetUser.country,
        city: targetUser.city,
        geo: targetUser.geo,
        age: age,
        distance: distance,
        registration: targetUser.registration,
        info: targetUser.info,
        // Показываем статус онлайн только если разрешено в настройках
        online: targetUser.privacy_settings?.privacy?.show_online_status !== false ? formatOnlineTime(targetUser.online) : null,
        viptype: targetUser.viptype,
        images: targetUser.images ? targetUser.images.split('&&') : [],
        search_status: targetUser.search_status,
        search_age: targetUser.search_age,
        location: targetUser.location,
        mobile: targetUser.mobile,
        height: targetUser.height,
        weight: targetUser.weight,
        smoking: targetUser.smoking,
        alko: targetUser.alko,
        date: targetUser.date,
        balance: targetUser.balance,
        locked_images: targetUser.locked_images,
        images_password: targetUser.images_password
      }
    };

    // Добавляем данные партнера для пар
    if (targetUser.status === 'Семейная пара(М+Ж)' || targetUser.status === 'Несемейная пара(М+Ж)') {
      const partnerData = targetUser.getPartnerData();
      if (partnerData) {
        response.profile.partnerData = partnerData;
        response.profile.isCouple = true;
      }
    } else {
      response.profile.isCouple = false;
    }

    // Добавляем дополнительные поля для отображения
    if (targetUser.height) response.profile.height = targetUser.height;
    if (targetUser.weight) response.profile.weight = targetUser.weight;
    if (targetUser.smoking) response.profile.smoking = targetUser.smoking;
    if (targetUser.alko) response.profile.alko = targetUser.alko;
    if (targetUser.search_status) response.profile.searchStatus = targetUser.search_status;
    if (targetUser.search_age) response.profile.searchAge = targetUser.search_age;
    if (targetUser.location) response.profile.location = targetUser.location;
    if (targetUser.mobile) response.profile.mobile = targetUser.mobile;
    if (targetUser.images) response.profile.images = targetUser.images.split('&&').filter(Boolean);

    // Получаем статистику лайков фото
    const photoLikes = await PhotoLike.findAll({
      where: { to_user: login },
      attributes: ['photo_index'],
      group: ['photo_index'],
      raw: true
    });

    const likeCounts = {};
    for (const like of photoLikes) {
      const count = await PhotoLike.count({
        where: {
          to_user: login,
          photo_index: like.photo_index
        }
      });
      likeCounts[like.photo_index] = count;
    }
    response.profile.photoLikes = likeCounts;

    // Получаем рейтинг пользователя
    const ratings = await Rating.findAll({
      where: { to_user: login },
      attributes: ['value']
    });
    response.profile.totalRating = ratings.reduce((sum, rating) => sum + rating.value, 0);
    response.profile.ratingCount = ratings.length;

    // Получаем мою оценку (если не свой профиль)
    if (fromUser !== login) {
      const myRating = await Rating.findOne({
        where: {
          from_user: fromUser,
          to_user: login
        }
      });
      response.profile.myRating = myRating ? myRating.value : 0;
    }

    logger.logSuccess(req, 200, { profile_found: true, user_status: targetUser.status });
    res.json({
      success: true,
      profile: response.profile
    });

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении профиля'
    });
  }
});

// POST /api/profiles/:login/like-photo - Лайк фото
router.post('/:login/like-photo', authenticateToken, async (req, res) => {
  const logger = new APILogger('PROFILES');
  
  try {
    logger.logRequest(req, 'POST /:login/like-photo');
    
    const { login } = req.params;
    const { photo_index } = req.body;
    const fromUser = req.user.login;

    logger.logBusinessLogic(1, 'Валидация лайка фото', {
      target_user: login,
      from_user: fromUser,
      photo_index,
      is_self_like: fromUser === login
    }, req);

    // Проверка на лайк собственного фото
    if (fromUser === login) {
      const errorData = { error: 'self_like', message: 'Нельзя лайкнуть собственное фото' };
      logger.logError(req, new Error('Self like attempt'), 400);
      return res.status(400).json(errorData);
    }

    // Проверка существования пользователя
    logger.logProcess('Поиск целевого пользователя', { login }, req);
    const targetUser = await User.findOne({ where: { login } });
    
    if (!targetUser) {
      const errorData = { error: 'user_not_found', message: 'Пользователь не найден' };
      logger.logError(req, new Error('Target user not found'), 404);
      return res.status(404).json(errorData);
    }

    // Проверка существования лайка
    logger.logProcess('Проверка существующего лайка фото', {
      from_user: fromUser,
      to_user: login,
      photo_index
    }, req);

    const existingLike = await PhotoLike.findOne({
      where: {
        from_user: fromUser,
        to_user: login,
        photo_index
      }
    });

    if (existingLike) {
      // Удаляем лайк (toggle)
      await existingLike.destroy();
      logger.logResult('Лайк фото удален', true, { like_id: existingLike.id }, req);
      
      res.json({
        success: true,
        action: 'unliked',
        message: 'Лайк убран'
      });
    } else {
      // Добавляем лайк
      const photoLike = await PhotoLike.create({
        id: generateId(),
        from_user: fromUser,
        to_user: login,
        photo_index,
        created_at: new Date()
      });

      logger.logResult('Лайк фото добавлен', true, { like_id: photoLike.id }, req);

      res.json({
        success: true,
        action: 'liked',
        message: 'Фото понравилось!'
      });
    }

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при обработке лайка фото'
    });
  }
});

// GET /api/profiles/:login/photo-likes - Получение лайков фото
router.get('/:login/photo-likes', authenticateToken, async (req, res) => {
  const logger = new APILogger('PROFILES');
  
  try {
    logger.logRequest(req, 'GET /:login/photo-likes');
    
    const { login } = req.params;
    const currentUser = req.user.login;

    // Проверяем права доступа - только VIP и PREMIUM могут видеть, кто лайкнул их фото
    const user = await User.findOne({ where: { login: currentUser } });
    if (!user) {
      return res.status(404).json({ error: 'user_not_found', message: 'Пользователь не найден' });
    }

    if (user.viptype === 'FREE') {
      return res.status(403).json({ 
        error: 'insufficient_privileges',
        message: 'Доступ к информации о лайках только для VIP и PREMIUM пользователей' 
      });
    }

    // Проверяем, что пользователь запрашивает информацию о своих фото
    if (login !== currentUser) {
      return res.status(403).json({ 
        error: 'access_denied',
        message: 'Можно просматривать только свои лайки' 
      });
    }

    logger.logProcess('Получение лайков фото пользователя', { target_user: login }, req);

    // Получаем всех, кто лайкнул фотографии пользователя
    const photoLikes = await PhotoLike.findAll({
      where: { to_user: login },
      include: [{
        model: User,
        as: 'FromUser',
        attributes: ['login', 'ava', 'viptype']
      }],
      order: [['created_at', 'DESC']]
    });

    // Группируем лайки по фото
    const likesByPhoto = {};
    photoLikes.forEach(like => {
      const photoIndex = like.photo_index;
      if (!likesByPhoto[photoIndex]) {
        likesByPhoto[photoIndex] = [];
      }
      likesByPhoto[photoIndex].push({
        user: like.FromUser.login,
        avatar: like.FromUser.ava,
        vip_type: like.FromUser.viptype,
        liked_at: like.created_at
      });
    });

    logger.logSuccess(req, 200, { photo_likes: likesByPhoto });
    res.json({
      success: true,
      photo_likes: likesByPhoto,
      total_likes: photoLikes.length
    });

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении лайков фото'
    });
  }
});

// POST /api/profiles/:login/send-gift - Отправка подарка
router.post('/:login/send-gift', authenticateToken, async (req, res) => {
  const logger = new APILogger('PROFILES');
  
  try {
    logger.logRequest(req, 'POST /:login/send-gift');
    
    const { login } = req.params;
    const { gift_type, message } = req.body;
    const fromUser = req.user.login;

    logger.logBusinessLogic(1, 'Валидация отправки подарка', {
      target_user: login,
      from_user: fromUser,
      gift_type,
      is_self_gift: fromUser === login
    }, req);

    // Проверка на подарок самому себе
    if (fromUser === login) {
      const errorData = { error: 'self_gift', message: 'Нельзя отправить подарок самому себе' };
      logger.logError(req, new Error('Self gift attempt'), 400);
      return res.status(400).json(errorData);
    }

    // Проверка типа подарка
    const validGiftTypes = ['1', '2', '3', '4', '5', '6', '7', '10'];
    if (!validGiftTypes.includes(gift_type)) {
      const errorData = { error: 'invalid_gift_type', message: 'Недопустимый тип подарка' };
      logger.logError(req, new Error('Invalid gift type'), 400);
      return res.status(400).json(errorData);
    }

    // Проверяем существование получателя
    const targetUser = await User.findOne({ where: { login } });
    if (!targetUser) {
      const errorData = { error: 'user_not_found', message: 'Пользователь не найден' };
      logger.logError(req, new Error('Target user not found'), 404);
      return res.status(404).json(errorData);
    }

    // Проверяем настройки приватности получателя
    if (targetUser.privacy_settings?.privacy?.allow_gifts === false) {
      const errorData = { error: 'gifts_not_allowed', message: 'Получатель не разрешает отправку подарков' };
      logger.logError(req, new Error('Gifts not allowed by privacy settings'), 403);
      return res.status(403).json(errorData);
    }

    // Проверка баланса отправителя
    const sender = await User.findOne({ where: { login: fromUser } });
    const giftCost = parseInt(gift_type); // Стоимость = номер подарка
    
    if (sender.balance < giftCost) {
      const errorData = { error: 'insufficient_balance', message: 'Недостаточно фоксиков' };
      logger.logError(req, new Error('Insufficient balance'), 400);
      return res.status(400).json(errorData);
    }

    logger.logBusinessLogic(2, 'Создание подарка и списание баланса', {
      sender_balance: sender.balance,
      gift_cost: giftCost,
      new_balance: sender.balance - giftCost
    }, req);

    // Создание подарка
    const gift = await Gifts.create({
      id: generateId(),
      gifttype: gift_type,
      owner: login,
      from_user: fromUser,
      message: message || '',
      valid: 1,
      created_at: new Date()
    });

    // Списание с баланса отправителя
    await sender.update({
      balance: sender.balance - giftCost
    });

    logger.logResult('Подарок отправлен', true, {
      gift_id: gift.id,
      cost: giftCost,
      sender_new_balance: sender.balance - giftCost
    }, req);

    res.json({
      success: true,
      message: 'Подарок отправлен!',
      gift_id: gift.id,
      cost: giftCost
    });

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при отправке подарка'
    });
  }
});

// POST /api/profiles/:login/rate - Оценка пользователя
router.post('/:login/rate', authenticateToken, async (req, res) => {
  const logger = new APILogger('PROFILES');
  
  try {
    logger.logRequest(req, 'POST /:login/rate');
    
    const { login } = req.params;
    const { value } = req.body;
    const fromUser = req.user.login;

    logger.logBusinessLogic(1, 'Валидация оценки пользователя', {
      target_user: login,
      from_user: fromUser,
      rating_value: value,
      is_self_rating: fromUser === login
    }, req);

    // Проверка на оценку самого себя
    if (fromUser === login) {
      const errorData = { error: 'self_rating', message: 'Нельзя оценить самого себя' };
      logger.logError(req, new Error('Self rating attempt'), 400);
      return res.status(400).json(errorData);
    }

    // Проверка значения оценки
    if (![1, -1].includes(value)) {
      const errorData = { error: 'invalid_value', message: 'Значение должно быть 1 или -1' };
      logger.logError(req, new Error('Invalid rating value'), 400);
      return res.status(400).json(errorData);
    }

    // Проверяем существование получателя
    const targetUser = await User.findOne({ where: { login } });
    if (!targetUser) {
      const errorData = { error: 'user_not_found', message: 'Пользователь не найден' };
      logger.logError(req, new Error('Target user not found'), 404);
      return res.status(404).json(errorData);
    }

    // Проверяем настройки приватности получателя
    if (targetUser.privacy_settings?.privacy?.allow_ratings === false) {
      const errorData = { error: 'ratings_not_allowed', message: 'Получатель не разрешает оценки профиля' };
      logger.logError(req, new Error('Ratings not allowed by privacy settings'), 403);
      return res.status(403).json(errorData);
    }

    // Проверка существующей оценки
    const existingRating = await Rating.findOne({
      where: {
        from_user: fromUser,
        to_user: login
      }
    });

    if (existingRating) {
      if (existingRating.value === value) {
        // Удаляем оценку (toggle)
        await existingRating.destroy();
        logger.logResult('Оценка удалена', true, { rating_id: existingRating.id }, req);
        
        res.json({
          success: true,
          action: 'removed',
          message: 'Оценка убрана'
        });
      } else {
        // Обновляем оценку
        await existingRating.update({ 
          value,
          date: new Date()
        });
        
        logger.logResult('Оценка обновлена', true, { 
          rating_id: existingRating.id,
          new_value: value 
        }, req);
        
        res.json({
          success: true,
          action: 'updated',
          message: 'Оценка изменена'
        });
      }
    } else {
      // Создаем новую оценку
      const rating = await Rating.create({
        id: generateId(),
        from_user: fromUser,
        to_user: login,
        value,
        date: new Date()
      });

      logger.logResult('Новая оценка создана', true, { rating_id: rating.id }, req);

      res.json({
        success: true,
        action: 'created',
        message: 'Оценка поставлена'
      });
    }

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при оценке пользователя'
    });
  }
});

// GET /api/profiles/:login/rating - Получение рейтинга пользователя
router.get('/:login/rating', authenticateToken, async (req, res) => {
  const logger = new APILogger('PROFILES');
  
  try {
    logger.logRequest(req, 'GET /:login/rating');
    
    const { login } = req.params;
    const fromUser = req.user.login;

    logger.logProcess('Получение рейтинга пользователя', { target_user: login }, req);

    // Получение общего рейтинга
    const ratings = await Rating.findAll({
      where: { to_user: login },
      attributes: ['value']
    });

    const totalRating = ratings.reduce((sum, rating) => sum + rating.value, 0);

    // Получение моей оценки
    let myRating = 0;
    if (fromUser !== login) {
      const myRatingRecord = await Rating.findOne({
        where: {
          from_user: fromUser,
          to_user: login
        }
      });
      myRating = myRatingRecord ? myRatingRecord.value : 0;
    }

    // Статистика по периодам
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const weekRatings = await Rating.findAll({
      where: { 
        to_user: login,
        date: { [require('sequelize').Op.gte]: weekAgo }
      },
      attributes: ['value']
    });

    const monthRatings = await Rating.findAll({
      where: { 
        to_user: login,
        date: { [require('sequelize').Op.gte]: monthAgo }
      },
      attributes: ['value']
    });

    const weekTotal = weekRatings.reduce((sum, rating) => sum + rating.value, 0);
    const monthTotal = monthRatings.reduce((sum, rating) => sum + rating.value, 0);

    const responseData = {
      success: true,
      totalRating,
      weekRating: weekTotal,
      monthRating: monthTotal,
      myRating,
      ratingCount: ratings.length
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении рейтинга'
    });
  }
});

// POST /api/profiles/:login/visit - Регистрация посещения профиля
router.post('/:login/visit', authenticateToken, async (req, res) => {
  const logger = new APILogger('PROFILES');
  
  try {
    logger.logRequest(req, 'POST /:login/visit');
    
    const { login } = req.params;
    const fromUser = req.user.login;

    // Не регистрируем посещение собственного профиля
    if (fromUser === login) {
      return res.json({ success: true, message: 'Own profile visit ignored' });
    }

    logger.logBusinessLogic(1, 'Регистрация посещения профиля', {
      visitor: fromUser,
      visited: login
    }, req);

    // Получаем данные посетителя и посещаемого пользователя
    const visitorUser = await User.findOne({ where: { login: fromUser } });
    const targetUser = await User.findOne({ where: { login } });
    if (!targetUser) {
      return res.status(404).json({ error: 'user_not_found', message: 'Пользователь не найден' });
    }

    // PREMIUM пользователи могут посещать анонимно
    const isAnonymousVisit = visitorUser.viptype === 'PREMIUM' && targetUser.viptype === 'VIP';
    
    // Если у посещаемого пользователя включены анонимные посещения, не регистрируем
    if (targetUser.privacy_settings?.privacy?.anonymous_visits || isAnonymousVisit) {
      logger.logResult('Посещение не зарегистрировано (анонимный режим)', true, {
        visitor: fromUser,
        visited: login,
        reason: isAnonymousVisit ? 'premium_anonymous_visit' : 'anonymous_visits_enabled'
      }, req);
      
      return res.json({
        success: true,
        message: 'Visit registered anonymously',
        anonymous: true
      });
    }

    // Проверка последнего посещения (не чаще раза в час)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentVisit = await ProfileVisit.findOne({
      where: {
        visitor: fromUser,
        visited: login,
        created_at: { [require('sequelize').Op.gte]: oneHourAgo }
      }
    });

    if (!recentVisit) {
      // Создаем запись о посещении
      await ProfileVisit.create({
        id: generateId(),
        visitor: fromUser,
        visited: login,
        created_at: new Date()
      });

      logger.logResult('Посещение зарегистрировано', true, {
        visitor: fromUser,
        visited: login
      }, req);
    }

    res.json({
      success: true,
      message: 'Visit registered'
    });

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при регистрации посещения'
    });
  }
});

// POST /api/profiles/:login/superlike - Отправка суперлайка
router.post('/:login/superlike', authenticateToken, async (req, res) => {
  const logger = new APILogger('PROFILES');
  
  try {
    logger.logRequest(req, 'POST /:login/superlike');
    
    const { login } = req.params;
    const { message } = req.body;
    const fromUser = req.user.login;

    logger.logBusinessLogic(1, 'Валидация суперлайка', {
      target_user: login,
      from_user: fromUser,
      has_message: !!message,
      is_self_superlike: fromUser === login
    }, req);

    // Проверка на суперлайк самому себе
    if (fromUser === login) {
      const errorData = { error: 'self_superlike', message: 'Нельзя отправить суперлайк самому себе' };
      logger.logError(req, new Error('Self superlike attempt'), 400);
      return res.status(400).json(errorData);
    }

    // Проверка существования получателя
    const targetUser = await User.findOne({ where: { login } });
    if (!targetUser) {
      const errorData = { error: 'user_not_found', message: 'Пользователь не найден' };
      logger.logError(req, new Error('Target user not found'), 404);
      return res.status(404).json(errorData);
    }

    // Проверка лимита суперлайков
    const sender = await User.findOne({ where: { login: fromUser } });
    
    // TODO: Проверить количество использованных суперлайков сегодня
    // В зависимости от VIP статуса: FREE = 0, VIP = 5, PREMIUM = 10

    // Создаем суперлайк через существующий API
    const superlikeResult = await Likes.create({
      id: generateId(),
      like_from: fromUser,
      like_to: login,
      reciprocal: 'empty',
      super_message: message || '0',
      date: new Date()
    });

    logger.logResult('Суперлайк отправлен', true, {
      superlike_id: superlikeResult.id,
      has_message: !!message
    }, req);

    res.json({
      success: true,
      message: 'Суперлайк отправлен!',
      superlike_id: superlikeResult.id
    });

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при отправке суперлайка'
    });
  }
});

// GET /api/profiles/:login/stats - Получение расширенной статистики профиля
router.get('/:login/stats', authenticateToken, async (req, res) => {
  const logger = new APILogger('PROFILES');
  
  try {
    logger.logRequest(req, 'GET /:login/stats');
    
    const { login } = req.params;
    const currentUser = req.user.login;
    
    // Получаем данные текущего пользователя
    const user = await User.findOne({ where: { login: currentUser } });
    if (!user) {
      return res.status(404).json({ error: 'user_not_found', message: 'Пользователь не найден' });
    }

    // Проверяем права доступа к статистике
    if (user.viptype === 'FREE') {
      return res.status(403).json({ 
        error: 'insufficient_privileges',
        message: 'Доступ к расширенной статистике только для VIP и PREMIUM пользователей' 
      });
    }

    logger.logBusinessLogic(1, 'Получение расширенной статистики профиля', {
      target_user: login,
      viewer: currentUser,
      viewer_vip_type: user.viptype
    }, req);

    // Получаем базовую информацию о профиле
    const targetUser = await User.findOne({ where: { login } });
    if (!targetUser) {
      return res.status(404).json({ error: 'user_not_found', message: 'Пользователь не найден' });
    }

    // Получаем статистику лайков фотографий
    const photoLikes = await PhotoLike.count({
      where: { to_user: login }
    });

    // Получаем статистику комментариев к фотографиям
    const photoComments = await PhotoComments.count({
      where: { to_user: login }
    });

    // Получаем статистику комментариев к профилю
    const profileComments = await ProfileComments.count({
      where: { to_user: login }
    });

    // Получаем статистику реакций
    const reactions = await Reactions.count({
      where: { to_user: login }
    });

    // Получаем статистику посещений за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentVisits = await ProfileVisit.count({
      where: {
        visited: login,
        created_at: { [require('sequelize').Op.gte]: thirtyDaysAgo }
      }
    });

    // Для PREMIUM пользователей - статистика за 90 дней
    let extendedVisits = null;
    if (user.viptype === 'PREMIUM') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      extendedVisits = await ProfileVisit.count({
        where: {
          visited: login,
          created_at: { [require('sequelize').Op.gte]: ninetyDaysAgo }
        }
      });

      // Топ-10 посетителей
      const topVisitors = await ProfileVisit.findAll({
        where: { visited: login },
        include: [{
          model: User,
          as: 'VisitorUser',
          attributes: ['login', 'ava', 'viptype']
        }],
        order: [['created_at', 'DESC']],
        limit: 10,
        group: ['visitor']
      });
    }

    const responseData = {
      success: true,
      profile_stats: {
        photo_likes: photoLikes,
        photo_comments: photoComments,
        profile_comments: profileComments,
        reactions: reactions,
        visits_30_days: recentVisits,
        visits_90_days: extendedVisits,
        top_visitors: extendedVisits ? topVisitors : null
      },
      viewer_privileges: {
        vip_type: user.viptype,
        can_see_extended_stats: true
      }
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении статистики профиля'
    });
  }
});

module.exports = router;