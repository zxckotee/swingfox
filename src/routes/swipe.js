const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User, Likes, Status, Gifts, Notifications, Rating } = require('../models');
const sequelize = require('../models/index').sequelize; // ДОБАВИТЬ ЭТО
const { authenticateToken, requireVip } = require('../middleware/auth');
const { generateId, calculateDistance, formatAge, parseGeo, formatOnlineTime } = require('../utils/helpers');
const MatchChecker = require('../utils/matchChecker');
const { APILogger } = require('../utils/logger');
const compatibilityCalculator = require('../utils/compatibilityCalculator');
const axios = require('axios');

// Хранилище для истории слайдов пользователей (в продакшене использовать Redis)
const userSlideHistory = new Map();

// Кэш для профилей (в продакшене использовать Redis)
const profileCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

// Очистка кэша каждые 5 минут
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of profileCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      profileCache.delete(key);
    }
  }
}, CACHE_TTL);

// Умный алгоритм рекомендаций на основе совместимости
const getRecommendedProfile = async (currentUserId) => {
  const logger = new APILogger('SWIPE_RECOMMENDATIONS');
  
  try {
    logger.logBusinessLogic(1, 'Запуск алгоритма рекомендаций на основе совместимости', {
      current_user: currentUserId
    });

    // Получаем данные текущего пользователя
    const currentUser = await User.findOne({ where: { login: currentUserId } });
    if (!currentUser) {
      logger.logError('Текущий пользователь не найден', { current_user: currentUserId });
      return null;
    }

    // Получаем batch профилей и берем первый (самый совместимый)
    const batchProfiles = await getRecommendedProfilesBatch(currentUserId, 5);
    
    if (batchProfiles && batchProfiles.length > 0) {
      const selectedProfile = batchProfiles[0]; // Берем самый совместимый
      
      logger.logResult('Выбран пользователь по совместимости', true, {
        selected_user: selectedProfile.login,
        compatibility_score: selectedProfile.compatibility.totalScore,
        total_candidates: batchProfiles.length
      });
      
      return selectedProfile;
    }

    logger.logWarning('Нет доступных профилей', { current_user: currentUserId });
    return null;

  } catch (error) {
    logger.logError('Ошибка в алгоритме рекомендаций', error);
    return null;
  }
};

// Вспомогательная функция для получения отсортированных профилей
const getRecommendedProfilesBatch = async (userId, count = 5) => {
  try {
    const currentUser = await User.findOne({ where: { login: userId } });
    if (!currentUser) return [];

    // Получаем случайные профили
    const allCandidates = await User.findAll({
      where: {
        login: { [Op.ne]: userId },
        status: { [Op.ne]: 'BANNED' },
        viptype: { [Op.ne]: 'FREE' }
      },
      attributes: [
        'id', 'login', 'ava', 'status', 'city', 'country', 'date', 'info', 
        'registration', 'online', 'viptype', 'geo', 'search_status', 'search_age',
        'height', 'weight', 'smoking', 'alko', 'location'
      ],
      order: User.sequelize.random()
    });

    if (allCandidates.length === 0) return [];

    // Выбираем случайные
    let selectedUsers = [];
    for (let i = 0; i < Math.min(count * 2, allCandidates.length); i++) {
      const randomIndex = Math.floor(Math.random() * allCandidates.length);
      selectedUsers.push(allCandidates[randomIndex]);
    }

    // Рассчитываем совместимость и сортируем
    const profilesWithCompatibility = [];
    
    for (const targetUser of selectedUsers) {
      if (!targetUser || !targetUser.login || !targetUser.ava) continue;
      
      let compatibility = { totalScore: 0.5 };
      try {
        compatibility = compatibilityCalculator.calculateCompatibility(currentUser, targetUser);
      } catch (error) {
        // Игнорируем ошибки
      }

      profilesWithCompatibility.push({
        ...targetUser.toJSON(),
        compatibility
      });
    }

    // Сортируем по совместимости
    profilesWithCompatibility.sort((a, b) => {
      return b.compatibility.totalScore - a.compatibility.totalScore;
    });

    return profilesWithCompatibility.slice(0, count);
    
  } catch (error) {
    console.error('Error in getRecommendedProfilesBatch:', error);
    return [];
  }
};

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
      // Простое получение нового профиля
      targetUser = await getRecommendedProfile(userId);
    }

    if (!targetUser) {
      return res.status(404).json({ 
        error: 'no_profiles',
        message: 'Нет доступных профилей' 
      });
    }
    
    // Проверяем, что у нас есть все необходимые поля
    if (!targetUser.login || !targetUser.ava) {
      console.warn('Обнаружен неполный профиль в основном endpoint:', targetUser);
      return res.status(500).json({ 
        error: 'invalid_profile',
        message: 'Профиль содержит неполные данные' 
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

    // Формируем ответ с учетом статуса (пара или одиночка)
    let profileData = {
      id: targetUser.id,
      login: targetUser.login,
      ava: targetUser.ava,
      age,
      status: targetUser.status,
      city: targetUser.city,
      country: targetUser.country,
      distance,
      registration: targetUser.registration,
      info: targetUser.info,
      online: onlineStatus,
      viptype: targetUser.viptype
    };

    // Добавляем данные партнера для пар
    if (targetUser.status === 'Семейная пара(М+Ж)' || targetUser.status === 'Несемейная пара(М+Ж)') {
      const partnerData = targetUser.getPartnerData();
      if (partnerData) {
        profileData.partnerData = partnerData;
        profileData.isCouple = true;
      }
    } else {
      profileData.isCouple = false;
    }

    // Добавляем дополнительные поля для отображения
    if (targetUser.height) profileData.height = targetUser.height;
    if (targetUser.weight) profileData.weight = targetUser.weight;
    if (targetUser.smoking) profileData.smoking = targetUser.smoking;
    if (targetUser.alko) profileData.alko = targetUser.alko;
    if (targetUser.search_status) profileData.searchStatus = targetUser.search_status;
    if (targetUser.search_age) profileData.searchAge = targetUser.search_age;
    if (targetUser.location) profileData.location = targetUser.location;

    // Добавляем информацию о совместимости
    try {
      const compatibility = compatibilityCalculator.calculateCompatibility(currentUser, targetUser);
      profileData.compatibility = compatibility;
    } catch (compatibilityError) {
      // Игнорируем ошибки расчета совместимости
      console.warn('Ошибка расчета совместимости:', compatibilityError);
      // Добавляем пустую совместимость
      profileData.compatibility = {
        totalScore: 0.5,
        scores: {},
        weights: {},
        recommendations: ['Совместимость не рассчитана']
      };
    }
    
    // Проверяем, что профиль не пустой
    if (!profileData.login || !profileData.ava) {
      console.warn('Обнаружен пустой профиль в основном endpoint:', profileData.login);
    }

    res.json(profileData);

  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении профилей' 
    });
  }
});

// GET /api/swipe/profiles/batch - Массовая загрузка профилей для предзагрузки
router.get('/profiles/batch', authenticateToken, async (req, res) => {
  try {
    const { count = 10 } = req.query;
    const userId = req.user.login;
    
    // Получаем данные текущего пользователя
    const currentUser = await User.findOne({ where: { login: userId } });
    if (!currentUser) {
      return res.status(404).json({ 
        error: 'user_not_found',
        message: 'Пользователь не найден' 
      });
    }

   
    // SQL запрос с расчетом совместимости прямо в базе (PostgreSQL версия, универсальный split)
    const profiles = await sequelize.query(`
      WITH candidate_profiles AS (
        SELECT 
          u.id,
          u.login,
          u.ava,
          u.status,
          u.city,
          u.country,
          u.date,
          u.info,
          u.registration,
          u.online,
          u.viptype,
          u.geo,
          u.search_status,
          u.search_age,
          u.height,
          u.weight,
          u.smoking,
          u.alko,
          u.location,
          
          -- Расчет совместимости по статусам (самый важный критерий)
          CASE 
            WHEN (
              u.search_status LIKE '%' || :currentUserStatus || '%' 
              AND :currentUserSearchStatus LIKE '%' || u.status || '%'
            ) THEN 1.0
            WHEN (
              u.search_status LIKE '%' || :currentUserStatus || '%' 
              OR :currentUserSearchStatus LIKE '%' || u.status || '%'
            ) THEN 0.5
            ELSE 0.0
          END AS status_compatibility,
          
          -- Расчет совместимости по возрасту с универсальным split по "_"
          CASE 
            WHEN u.date IS NOT NULL AND :currentUserDate IS NOT NULL THEN
              CASE 
                WHEN ABS(
                  -- Средний возраст пользователя из базы (универсальный split)
                  (SELECT AVG(EXTRACT(YEAR FROM date_part::DATE))
                  FROM unnest(string_to_array(u.date, '_')) AS date_part) -
                  -- Средний возраст текущего пользователя (универсальный split)
                  (SELECT AVG(EXTRACT(YEAR FROM date_part::DATE))
                  FROM unnest(string_to_array(:currentUserDate, '_')) AS date_part)
                ) <= 5 THEN 1.0
                WHEN ABS(
                  (SELECT AVG(EXTRACT(YEAR FROM date_part::DATE))
                  FROM unnest(string_to_array(u.date, '_')) AS date_part) -
                  (SELECT AVG(EXTRACT(YEAR FROM date_part::DATE))
                  FROM unnest(string_to_array(:currentUserDate, '_')) AS date_part)
                ) <= 10 THEN 0.8
                WHEN ABS(
                  (SELECT AVG(EXTRACT(YEAR FROM date_part::DATE))
                  FROM unnest(string_to_array(u.date, '_')) AS date_part) -
                  (SELECT AVG(EXTRACT(YEAR FROM date_part::DATE))
                  FROM unnest(string_to_array(:currentUserDate, '_')) AS date_part)
                ) <= 20 THEN 0.6
                ELSE 0.4
              END
            ELSE 0.5
          END AS age_compatibility,
          
          -- Расчет совместимости по расстоянию (универсальный split для координат по "&&")
          CASE 
            WHEN u.geo IS NOT NULL AND :currentUserGeo IS NOT NULL THEN
              CASE 
                WHEN SQRT(
                  POW(
                    (SELECT AVG(CAST(coord AS DECIMAL))
                    FROM unnest(string_to_array(u.geo, '&&')) AS coord) - 
                    (SELECT AVG(CAST(coord AS DECIMAL))
                    FROM unnest(string_to_array(:currentUserGeo, '&&')) AS coord), 2) +
                  POW(
                    (SELECT AVG(CAST(coord AS DECIMAL))
                    FROM unnest(string_to_array(u.geo, '&&')) AS coord) - 
                    (SELECT AVG(CAST(coord AS DECIMAL))
                    FROM unnest(string_to_array(:currentUserGeo, '&&')) AS coord), 2)
                ) <= 0.1 THEN 1.0  -- ~10км
                WHEN SQRT(
                  POW(
                    (SELECT AVG(CAST(coord AS DECIMAL))
                    FROM unnest(string_to_array(u.geo, '&&')) AS coord) - 
                    (SELECT AVG(CAST(coord AS DECIMAL))
                    FROM unnest(string_to_array(:currentUserGeo, '&&')) AS coord), 2) +
                  POW(
                    (SELECT AVG(CAST(coord AS DECIMAL))
                    FROM unnest(string_to_array(u.geo, '&&')) AS coord) - 
                    (SELECT AVG(CAST(coord AS DECIMAL))
                    FROM unnest(string_to_array(:currentUserGeo, '&&')) AS coord), 2)
                ) <= 0.5 THEN 0.8  -- ~50км
                WHEN SQRT(
                  POW(
                    (SELECT AVG(CAST(coord AS DECIMAL))
                    FROM unnest(string_to_array(u.geo, '&&')) AS coord) - 
                    (SELECT AVG(CAST(coord AS DECIMAL))
                    FROM unnest(string_to_array(:currentUserGeo, '&&')) AS coord), 2) +
                  POW(
                    (SELECT AVG(CAST(coord AS DECIMAL))
                    FROM unnest(string_to_array(u.geo, '&&')) AS coord) - 
                    (SELECT AVG(CAST(coord AS DECIMAL))
                    FROM unnest(string_to_array(:currentUserGeo, '&&')) AS coord), 2)
                ) <= 1.0 THEN 0.6 -- ~100км
                ELSE 0.4
              END
            ELSE 0.5
          END AS distance_compatibility,
          
          -- Расчет совместимости по местам встреч (универсальный split по "&&")
          CASE 
            WHEN u.location IS NOT NULL AND :currentUserLocation IS NOT NULL THEN
              CASE 
                WHEN u.location = :currentUserLocation THEN 1.0
                WHEN EXISTS (
                  SELECT 1 FROM unnest(string_to_array(u.location, '&&')) AS loc_part
                  WHERE loc_part = ANY(string_to_array(:currentUserLocation, '&&'))
                ) THEN 0.8
                ELSE 0.3
              END
            ELSE 0.5
          END AS location_compatibility,
          
          -- Расчет совместимости по образу жизни (универсальный split по "_")
          CASE 
            WHEN u.smoking IS NOT NULL AND :currentUserSmoking IS NOT NULL THEN
              CASE 
                WHEN u.smoking = :currentUserSmoking THEN 1.0
                WHEN EXISTS (
                  SELECT 1 FROM unnest(string_to_array(u.smoking, '_')) AS smoking_part
                  WHERE smoking_part = ANY(string_to_array(:currentUserSmoking, '_'))
                ) THEN 0.7
                ELSE 0.4
              END
            ELSE 0.5
          END AS lifestyle_compatibility,
          
          -- Общий балл совместимости
          (
            CASE 
              WHEN (
                u.search_status LIKE '%' || :currentUserStatus || '%' 
                AND :currentUserSearchStatus LIKE '%' || u.status || '%'
              ) THEN 1.0
              WHEN (
                u.search_status LIKE '%' || :currentUserStatus || '%' 
                OR :currentUserSearchStatus LIKE '%' || u.status || '%'
              ) THEN 0.5
              ELSE 0.0
            END * 0.25 +
            
            CASE 
              WHEN u.date IS NOT NULL AND :currentUserDate IS NOT NULL THEN
                CASE 
                  WHEN ABS(
                    (SELECT AVG(EXTRACT(YEAR FROM date_part::DATE))
                    FROM unnest(string_to_array(u.date, '_')) AS date_part) -
                    (SELECT AVG(EXTRACT(YEAR FROM date_part::DATE))
                    FROM unnest(string_to_array(:currentUserDate, '_')) AS date_part)
                  ) <= 5 THEN 1.0
                  WHEN ABS(
                    (SELECT AVG(EXTRACT(YEAR FROM date_part::DATE))
                    FROM unnest(string_to_array(u.date, '_')) AS date_part) -
                    (SELECT AVG(EXTRACT(YEAR FROM date_part::DATE))
                    FROM unnest(string_to_array(:currentUserDate, '_')) AS date_part)
                  ) <= 10 THEN 0.8
                  WHEN ABS(
                    (SELECT AVG(EXTRACT(YEAR FROM date_part::DATE))
                    FROM unnest(string_to_array(u.date, '_')) AS date_part) -
                    (SELECT AVG(EXTRACT(YEAR FROM date_part::DATE))
                    FROM unnest(string_to_array(:currentUserDate, '_')) AS date_part)
                  ) <= 20 THEN 0.6
                  ELSE 0.4
                END
              ELSE 0.5
            END * 0.20 +
            
            CASE 
              WHEN u.geo IS NOT NULL AND :currentUserGeo IS NOT NULL THEN
                CASE 
                  WHEN SQRT(
                    POW(
                      (SELECT AVG(CAST(coord AS DECIMAL))
                      FROM unnest(string_to_array(u.geo, '&&')) AS coord) - 
                      (SELECT AVG(CAST(coord AS DECIMAL))
                      FROM unnest(string_to_array(:currentUserGeo, '&&')) AS coord), 2) +
                    POW(
                      (SELECT AVG(CAST(coord AS DECIMAL))
                      FROM unnest(string_to_array(u.geo, '&&')) AS coord) - 
                      (SELECT AVG(CAST(coord AS DECIMAL))
                      FROM unnest(string_to_array(:currentUserGeo, '&&')) AS coord), 2)
                  ) <= 0.1 THEN 1.0
                  WHEN SQRT(
                    POW(
                      (SELECT AVG(CAST(coord AS DECIMAL))
                      FROM unnest(string_to_array(u.geo, '&&')) AS coord) - 
                      (SELECT AVG(CAST(coord AS DECIMAL))
                      FROM unnest(string_to_array(:currentUserGeo, '&&')) AS coord), 2) +
                    POW(
                      (SELECT AVG(CAST(coord AS DECIMAL))
                      FROM unnest(string_to_array(u.geo, '&&')) AS coord) - 
                      (SELECT AVG(CAST(coord AS DECIMAL))
                      FROM unnest(string_to_array(:currentUserGeo, '&&')) AS coord), 2)
                  ) <= 0.5 THEN 0.8
                  WHEN SQRT(
                    POW(
                      (SELECT AVG(CAST(coord AS DECIMAL))
                      FROM unnest(string_to_array(u.geo, '&&')) AS coord) - 
                      (SELECT AVG(CAST(coord AS DECIMAL))
                      FROM unnest(string_to_array(:currentUserGeo, '&&')) AS coord), 2) +
                    POW(
                      (SELECT AVG(CAST(coord AS DECIMAL))
                      FROM unnest(string_to_array(u.geo, '&&')) AS coord) - 
                      (SELECT AVG(CAST(coord AS DECIMAL))
                      FROM unnest(string_to_array(:currentUserGeo, '&&')) AS coord), 2)
                  ) <= 1.0 THEN 0.6
                  ELSE 0.4
                END
              ELSE 0.5
            END * 0.15 +
            
            CASE 
              WHEN u.location IS NOT NULL AND :currentUserLocation IS NOT NULL THEN
                CASE 
                  WHEN u.location = :currentUserLocation THEN 1.0
                  WHEN EXISTS (
                    SELECT 1 FROM unnest(string_to_array(u.location, '&&')) AS loc_part
                    WHERE loc_part = ANY(string_to_array(:currentUserLocation, '&&'))
                  ) THEN 0.8
                  ELSE 0.3
                END
              ELSE 0.5
            END * 0.15 +
            
            CASE 
              WHEN u.smoking IS NOT NULL AND :currentUserSmoking IS NOT NULL THEN
                CASE 
                  WHEN u.smoking = :currentUserSmoking THEN 1.0
                  WHEN EXISTS (
                    SELECT 1 FROM unnest(string_to_array(u.smoking, '_')) AS smoking_part
                    WHERE smoking_part = ANY(string_to_array(:currentUserSmoking, '_'))
                  ) THEN 0.7
                  ELSE 0.4
                END
              ELSE 0.5
            END * 0.10 +
            
            0.5 * 0.15 -- Фиксированный балл для остальных критериев
          ) AS total_compatibility_score
          
        FROM users u
        WHERE u.login != :userId
          AND u.status != 'BANNED'
          AND u.viptype != 'FREE'
      )
      SELECT 
        *,
        RANDOM() as random_sort
      FROM candidate_profiles
      ORDER BY total_compatibility_score DESC, random_sort
      LIMIT :count
    `, {
      replacements: {
        userId: userId,
        currentUserStatus: currentUser.status,
        currentUserSearchStatus: currentUser.search_status || '',
        currentUserDate: currentUser.date,
        currentUserGeo: currentUser.geo,
        currentUserLocation: currentUser.location || '',
        currentUserSmoking: currentUser.smoking || '',
        count: count * 2 // Берем в 2 раза больше для лучшего выбора
      },
      type: sequelize.QueryTypes.SELECT
    });

    if (profiles.length === 0) {
      return res.status(404).json({ 
        error: 'no_profiles',
        message: 'Нет доступных VIP профилей' 
      });
    }

    // Формируем финальный ответ
    const finalProfiles = [];
    
    for (const profile of profiles) {
      // Проверяем, что у нас есть все необходимые поля
      if (!profile.login || !profile.ava) {
        continue;
      }
      
      // Вычисляем расстояние
      const currentGeo = parseGeo(currentUser.geo);
      const targetGeo = parseGeo(profile.geo);
      const distance = currentGeo && targetGeo ? 
        calculateDistance(currentGeo.lat, currentGeo.lng, targetGeo.lat, targetGeo.lng) : 
        null;

      // Форматируем возраст
      const age = profile.date ? formatAge(profile.date) : null;

      // Форматируем время онлайн
      const onlineTime = profile.online ? formatOnlineTime(profile.online) : null;

      // Проверяем, является ли пара
      const isCouple = profile.status === 'Семейная пара(М+Ж)' || profile.status === 'Несемейная пара(М+Ж)';
      let partnerData = null;
      
      if (isCouple && profile.info) {
        try {
          const infoData = JSON.parse(profile.info);
          if (infoData.manDate && infoData.womanDate) {
            partnerData = {
              manDate: infoData.manDate,
              womanDate: infoData.womanDate
            };
          }
        } catch (e) {
          // Игнорируем ошибки парсинга
        }
      }

      // Формируем объект совместимости
      const compatibility = {
        totalScore: Math.round(profile.total_compatibility_score * 100) / 100,
        scores: {
          mutualStatus: profile.status_compatibility,
          age: profile.age_compatibility,
          distance: profile.distance_compatibility,
          location: profile.location_compatibility,
          lifestyle: profile.lifestyle_compatibility
        },
        weights: {
          mutualStatus: 0.25,
          age: 0.20,
          distance: 0.15,
          location: 0.15,
          lifestyle: 0.10,
          physical: 0.10,
          activity: 0.05
        },
        recommendations: ['Совместимость рассчитана в SQL']
      };

      finalProfiles.push({
        id: profile.id,
        login: profile.login,
        ava: profile.ava,
        status: profile.status,
        city: profile.city,
        country: profile.country,
        distance: distance ? Math.round(distance) : null,
        age: age,
        info: profile.info,
        online: onlineTime,
        viptype: profile.viptype,
        isCouple: isCouple,
        partnerData: partnerData,
        height: profile.height,
        weight: profile.weight,
        smoking: profile.smoking,
        alko: profile.alko,
        search_status: profile.search_status,
        search_age: profile.search_age,
        location: profile.location,
        registration: profile.registration,
        compatibility: compatibility
      });
    }

    // Применяем финальную рандомизацию для разнообразия
    const shuffledProfiles = finalProfiles
      .sort(() => Math.random() - 0.5)
      .slice(0, count);

    res.json(shuffledProfiles);
    
  } catch (error) {
    console.error('Error in batch profiles:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при загрузке профилей' 
    });
  }
});

// POST /api/swipe/like - Лайк профиля
router.post('/like', authenticateToken, async (req, res) => {
  try {
    const { target_user, source = 'gesture' } = req.body;
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

    // Создаем основной лайк
    await Likes.create({
      id: likeId,
      date: today,
      like_from: fromUser,
      like_to: target_user,
      reciprocal: mutualLike ? 'yes' : 'empty',
      super_message: '0'
    });

    // Используем новую систему MatchChecker для проверки мэтча
    let matchCreated = false;
    try {
      const matchResult = await MatchChecker.checkMutualLike(fromUser, target_user);
      
      if (matchResult.hasMatch) {
        // Создаем мэтч с новой системой
        await MatchChecker.createMatch(fromUser, target_user);
        matchCreated = true;
        
        console.log('Match created via swipe:', {
          user1: fromUser,
          user2: target_user,
          source: source
        });

        // Обновляем статус старого лайка если он был
        if (mutualLike) {
          await mutualLike.update({ reciprocal: 'mutual' });
        }

        // Создаем уведомления о мэтче для обоих пользователей
        try {
          await Notifications.createMatchNotification(fromUser, target_user);
          await Notifications.createMatchNotification(target_user, fromUser);
        } catch (notifError) {
          console.error('Error creating match notifications:', notifError);
        }

        res.json({
          result: 'reciprocal_like',
          message: 'Взаимная симпатия! 💕 Теперь вы можете общаться в чате!',
          source,
          match_created: true
        });
      } else {
        // Создаем обычное уведомление о лайке
        try {
          await Notifications.createLikeNotification(target_user, fromUser, false);
        } catch (notifError) {
          console.error('Error creating like notification:', notifError);
        }

        res.json({
          result: 'success',
          message: 'Лайк отправлен',
          source,
          match_created: false
        });
      }
    } catch (error) {
      console.error('Error checking match after swipe like:', {
        fromUser,
        target_user,
        error: error.message
      });
      
      // Fallback: используем старую логику
      if (mutualLike) {
        await mutualLike.update({ reciprocal: 'yes' });
        
        try {
          await Notifications.createMatchNotification(fromUser, target_user);
        } catch (notifError) {
          console.error('Error creating fallback match notification:', notifError);
        }

        res.json({
          result: 'reciprocal_like',
          message: 'Взаимная симпатия! (режим совместимости)',
          source,
          match_created: true
        });
      } else {
        try {
          await Notifications.createLikeNotification(target_user, fromUser, false);
        } catch (notifError) {
          console.error('Error creating fallback like notification:', notifError);
        }

        res.json({
          result: 'success',
          message: 'Лайк отправлен',
          source,
          match_created: false
        });
      }
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
    const { target_user, source = 'gesture' } = req.body;
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
        message: 'Лайк отклонен',
        source
      });
    } else {
      res.json({
        result: 'forward',
        message: 'Профиль пропущен',
        source
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

    // Создаем уведомление о суперлайке
    try {
      await Notifications.createLikeNotification(target_user, fromUser, true);
    } catch (notifError) {
      console.error('Error creating superlike notification:', notifError);
    }

    // Автоматически создаем взаимный лайк (суперлайк это всегда взаимность)
    const mutualLike = await Likes.findOne({
      where: {
        like_from: target_user,
        like_to: fromUser
      }
    });

    if (mutualLike) {
      await mutualLike.update({ reciprocal: 'yes' });
      
      // Создаем уведомления о взаимной симпатии
      try {
        await Notifications.createMatchNotification(fromUser, target_user);
      } catch (notifError) {
        console.error('Error creating superlike match notification:', notifError);
      }
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

// POST /api/swipe/geo-reload - Обновление геоданных пользователя
router.post('/geo-reload', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.login;
    
    // Получаем IP пользователя
    const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    
    // Проверяем последнее обновление геоданных (не чаще раза в сутки)
    const user = await User.findOne({ where: { login: userId } });
    const lastGeoUpdate = user.geo_updated_at || new Date(0);
    const daysDiff = (Date.now() - new Date(lastGeoUpdate).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff < 1) {
      return res.json({
        error: 'geoSets',
        message: 'Геоданные уже обновлялись сегодня'
      });
    }

    try {
      // Получаем геоданные по IP
      const geoResponse = await axios.get(`http://ip-api.com/json/${userIP}`);
      const geoData = geoResponse.data;
      
      if (geoData.status === 'success' && geoData.lat && geoData.lon) {
        const newGeo = `${geoData.lat}&&${geoData.lon}`;
        
        await user.update({
          geo: newGeo,
          geo_updated_at: new Date()
        });
        
        res.json({
          success: true,
          message: 'Геоданные обновлены',
          geo: newGeo
        });
      } else {
        res.status(400).json({
          error: 'geo_error',
          message: 'Не удалось определить местоположение'
        });
      }
    } catch (geoError) {
      console.error('Geo API error:', geoError);
      res.status(500).json({
        error: 'geo_service_error',
        message: 'Ошибка сервиса геолокации'
      });
    }

  } catch (error) {
    console.error('Geo reload error:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при обновлении геоданных'
    });
  }
});

// POST /api/swipe/send-gift - Отправка подарка
router.post('/send-gift', authenticateToken, async (req, res) => {
  try {
    const { target_user, gift_type } = req.body;
    const fromUser = req.user.login;

    if (!target_user || !gift_type) {
      return res.status(400).json({
        error: 'missing_data',
        message: 'Не указан получатель или тип подарка'
      });
    }

    // Получаем данные отправителя
    const currentUser = await User.findOne({ where: { login: fromUser } });
    const gift = Gifts.getGiftTypes().find(g => g.id === gift_type);
    
    if (!gift) {
      return res.status(400).json({
        error: 'invalid_gift',
        message: 'Неверный тип подарка'
      });
    }

    // Проверяем баланс
    if (currentUser.balance < gift.cost) {
      return res.status(400).json({
        error: 'insufficient_balance',
        message: 'Недостаточно средств на балансе'
      });
    }

    // Проверяем существование получателя
    const targetUserData = await User.findOne({ where: { login: target_user } });
    if (!targetUserData) {
      return res.status(404).json({
        error: 'user_not_found',
        message: 'Пользователь не найден'
      });
    }

    // Получаем текущего пользователя из истории слайдов
    const history = userSlideHistory.get(fromUser) || [];
    if (history.length === 0 || !history.includes(target_user)) {
      return res.status(400).json({
        error: 'no_interaction',
        message: 'Можно отправлять подарки только просмотренным профилям'
      });
    }

    // Создаем подарок
    const giftId = generateId();
    const today = new Date().toISOString().split('T')[0];

    await Gifts.create({
      id: giftId,
      owner: target_user,
      from_user: fromUser,
      gift_type,
      date: today,
      is_valid: true
    });

    // Списываем средства
    await currentUser.update({
      balance: currentUser.balance - gift.cost
    });

    // Создаем уведомление о подарке
    try {
      await Notifications.createGiftNotification(target_user, fromUser, gift_type);
    } catch (notifError) {
      console.error('Error creating gift notification:', notifError);
    }

    res.json({
      success: true,
      message: `Подарок "${gift.name}" отправлен!`,
      remaining_balance: currentUser.balance - gift.cost
    });

  } catch (error) {
    console.error('Send gift error:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при отправке подарка'
    });
  }
});

// POST /api/swipe/profile-visit - Посещение профиля
router.post('/profile-visit', authenticateToken, async (req, res) => {
  try {
    const { target_user } = req.body;
    const fromUser = req.user.login;

    if (!target_user) {
      return res.status(400).json({
        error: 'missing_target',
        message: 'Не указан пользователь'
      });
    }

    // Проверяем VIP статус (FREE пользователи видны в посещениях)
    const currentUser = await User.findOne({ where: { login: fromUser } });
    
    if (currentUser.viptype === 'FREE') {
      // Для бесплатных пользователей записываем посещение
      await Status.updateUserStatus(fromUser, 'visit_profile');
    }

    // Обновляем статус активности
    await Status.updateUserStatus(fromUser, 'online');

    res.json({
      success: true,
      message: 'Посещение зафиксировано'
    });

  } catch (error) {
    console.error('Profile visit error:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при фиксации посещения'
    });
  }
});

// GET /api/swipe/check-visits - Проверка посещений
router.get('/check-visits', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.login;
    
    // Ищем недавние посещения (за последнюю минуту)
    const recentVisits = await Status.findAll({
      where: {
        type: 'visit_profile',
        timestamp: {
          [Op.gte]: Math.floor(Date.now() / 1000) - 60
        }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['login', 'ava'],
        where: {
          login: { [Op.ne]: userId } // Исключаем себя
        }
      }],
      order: [['timestamp', 'DESC']],
      limit: 10
    });

    if (recentVisits.length > 0) {
      res.json({
        has_visits: true,
        visits: recentVisits.map(visit => ({
          user: visit.user.login,
          avatar: visit.user.ava,
          timestamp: visit.timestamp
        }))
      });
    } else {
      res.json({
        has_visits: false,
        visits: []
      });
    }

  } catch (error) {
    console.error('Check visits error:', error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при проверке посещений'
    });
  }
});

module.exports = router;