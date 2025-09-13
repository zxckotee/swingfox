const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User, Geo } = require('../models');
const sequelize = require('../models/index').sequelize; // Добавляем sequelize для SQL запросов
const { authenticateToken } = require('../middleware/auth');
const { calculateDistance, formatAge, parseGeo, formatOnlineTime } = require('../utils/helpers');
const compatibilityCalculator = require('../utils/compatibilityCalculator');

// GET /api/catalog - Получение каталога анкет с фильтрами и улучшенным подбором
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.login;
    const { 
      status = [], 
      country = '', 
      city = '', 
      limit = 14, 
      offset = 0 
    } = req.query;

    // Получаем данные текущего пользователя для расчета расстояния и проверки совместимости
    const currentUser = await User.findOne({ where: { login: userId } });
    if (!currentUser) {
      return res.status(404).json({ 
        error: 'user_not_found',
        message: 'Пользователь не найден' 
      });
    }

    // Строим базовые условия фильтрации для SQL запроса
    let whereClause = 'u.login != :userId AND u.status != \'BANNED\' AND u.viptype IN (\'VIP\', \'PREMIUM\')';
    let replacements = { userId };

    // Фильтр по семейному статусу (только те, кого я ищу)
    if (status && status.length > 0) {
      const statusArray = Array.isArray(status) ? status : [status];
      const statusConditions = statusArray.map((_, index) => `u.status = :status${index}`).join(' OR ');
      whereClause += ` AND (${statusConditions})`;
      
      statusArray.forEach((statusValue, index) => {
        replacements[`status${index}`] = statusValue;
      });
    }

    // Фильтр по стране
    if (country) {
      whereClause += ' AND u.country = :country';
      replacements.country = country;
      
      // Фильтр по городу (только если указана страна)
      if (city) {
        whereClause += ' AND u.city = :city';
        replacements.city = city;
      }
    }

    // Улучшенный SQL запрос с расчетом совместимости прямо в базе данных
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
          
          -- Общий балл совместимости с весами как в swipe.js
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
        WHERE ${whereClause}
      )
      SELECT 
        *,
        RANDOM() as random_sort
      FROM candidate_profiles
      ORDER BY vip_priority DESC, total_compatibility_score DESC, random_sort
      LIMIT :limit OFFSET :offset
    `, {
      replacements: {
        ...replacements,
        currentUserStatus: currentUser.status,
        currentUserSearchStatus: currentUser.search_status || '',
        currentUserDate: currentUser.date,
        currentUserGeo: currentUser.geo,
        currentUserLocation: currentUser.location || '',
        currentUserSmoking: currentUser.smoking || '',
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      type: sequelize.QueryTypes.SELECT
    });

    if (profiles.length === 0) {
      return res.status(404).json({ 
        error: 'no_profiles',
        message: 'Нет доступных профилей по заданным критериям' 
      });
    }

    // Формируем финальный ответ с информацией о совместимости
    const formattedUsers = profiles.map(profile => {
      // Вычисляем расстояние
      const currentGeo = parseGeo(currentUser.geo);
      const userGeo = parseGeo(profile.geo);
      let distance = 0;
      if (currentGeo && userGeo) {
        distance = Math.round(calculateDistance(
          currentGeo.lat, currentGeo.lng,
          userGeo.lat, userGeo.lng
        ));
      }

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

      // Формируем объект совместимости на основе SQL расчетов
      const compatibility = {
        score: Math.round(profile.total_compatibility_score * 100) / 100,
        percentage: Math.round(profile.total_compatibility_score * 100),
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
        recommendations: generateCatalogRecommendations(profile.total_compatibility_score, profile)
      };

      // Базовые данные пользователя
      let userData = {
        id: profile.id,
        login: profile.login,
        ava: profile.ava,
        status: profile.status,
        country: profile.country,
        city: profile.city,
        age,
        distance,
        registration: profile.registration,
        info: profile.info,
        online: onlineTime,
        viptype: profile.viptype,
        isCouple,
        partnerData,
        // Добавляем информацию о совместимости
        compatibility
      };

      // Добавляем дополнительные поля для отображения
      if (profile.height) userData.height = profile.height;
      if (profile.weight) userData.weight = profile.weight;
      if (profile.smoking) userData.smoking = profile.smoking;
      if (profile.alko) userData.alko = profile.alko;
      if (profile.search_status) userData.searchStatus = profile.search_status;
      if (profile.search_age) userData.searchAge = profile.search_age;
      if (profile.location) userData.location = profile.location;

      return userData;
    });

    // Получаем общее количество для пагинации (с учетом совместимости)
    const totalCountQuery = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM users u
      WHERE ${whereClause}
    `, {
      replacements: {
        ...replacements,
        currentUserStatus: currentUser.status,
        currentUserSearchStatus: currentUser.search_status || '',
        currentUserDate: currentUser.date,
        currentUserGeo: currentUser.geo,
        currentUserLocation: currentUser.location || '',
        currentUserSmoking: currentUser.smoking || ''
      },
      type: sequelize.QueryTypes.SELECT
    });

    const totalCount = totalCountQuery[0]?.total || 0;

    res.json({
      users: formattedUsers,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
      },
      filters: {
        status: Array.isArray(status) ? status : (status ? [status] : []),
        country,
        city
      }
    });

  } catch (error) {
    console.error('Catalog error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении каталога анкет' 
    });
  }
});

// GET /api/catalog/filters - Получение доступных фильтров
router.get('/filters', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.login;
    
    // Получаем данные текущего пользователя для установки значений по умолчанию
    const currentUser = await User.findOne({ where: { login: userId } });
    if (!currentUser) {
      return res.status(404).json({ 
        error: 'user_not_found',
        message: 'Пользователь не найден' 
      });
    }

    // Получаем доступные статусы из базы данных
    // Примечание: берем из базы, но не используем, так как нужно принудительно задать русские названия
    const statuses = await User.findAll({
      attributes: ['status'],
      where: {
        status: { [Op.ne]: null },
        status: { [Op.ne]: '' }
      },
      group: ['status'],
      order: [['status', 'ASC']]
    });

    // Получаем доступные страны из таблицы geo (все возможные варианты)
    const countries = await Geo.findAll({
      attributes: ['country'],
      group: ['country'],
      order: [['country', 'ASC']]
    });

    // Получаем города по странам из таблицы geo
    const cities = await Geo.findAll({
      attributes: ['country', 'city'],
      group: ['country', 'city'],
      order: [['country', 'ASC'], ['city', 'ASC']]
    });

    // Группируем города по странам
    const citiesByCountry = {};
    cities.forEach(item => {
      if (!citiesByCountry[item.country]) {
        citiesByCountry[item.country] = [];
      }
      citiesByCountry[item.country].push(item.city);
    });

    // Принудительно задаем ВСЕ 4 типа статусов на русском языке
    // независимо от того, есть ли такие в базе
    const correctStatuses = [
      'Мужчина',
      'Женщина', 
      'Семейная пара(М+Ж)',
      'Несемейная пара(М+Ж)'
    ];

    res.json({
      statuses: correctStatuses,
      countries: countries.map(c => c.country),
      cities: citiesByCountry,
      // Добавляем текущие данные пользователя для установки значений по умолчанию
      currentUser: {
        country: currentUser.country,
        city: currentUser.city,
        search_status: currentUser.search_status
      }
    });

  } catch (error) {
    console.error('Get catalog filters error:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении фильтров' 
    });
  }
});

// GET /api/catalog/recommendations - Получение расширенных рекомендаций с улучшенным подбором
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.login;
    const { count = 10 } = req.query;
    
    // Получаем данные текущего пользователя
    const currentUser = await User.findOne({ where: { login: userId } });
    if (!currentUser) {
      return res.status(404).json({ 
        error: 'user_not_found',
        message: 'Пользователь не найден' 
      });
    }

    // SQL запрос с расчетом совместимости прямо в базе (аналогично swipe.js)
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
          
          -- Общий балл совместимости с весами как в swipe.js
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
      ORDER BY vip_priority DESC, total_compatibility_score DESC, random_sort
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
        message: 'Нет доступных VIP профилей для рекомендаций' 
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
        recommendations: generateCatalogRecommendations(profile.total_compatibility_score, profile)
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

    res.json({
      recommendations: shuffledProfiles,
      total: finalProfiles.length,
      requested: parseInt(count),
      algorithm: 'enhanced_compatibility_sql'
    });
    
  } catch (error) {
    console.error('Error in catalog recommendations:', error);
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при получении рекомендаций' 
    });
  }
});

module.exports = router;

// Вспомогательная функция для генерации рекомендаций в каталоге
function generateCatalogRecommendations(totalScore, profile) {
  const recommendations = [];
  
  if (totalScore >= 0.8) {
    recommendations.push('Отличная совместимость!');
  } else if (totalScore >= 0.6) {
    recommendations.push('Хорошая совместимость');
  } else if (totalScore >= 0.4) {
    recommendations.push('Умеренная совместимость');
  } else {
    recommendations.push('Низкая совместимость');
  }
  
  // Конкретные рекомендации по критериям
  if (profile.status_compatibility < 0.5) {
    recommendations.push('Проверьте настройки поиска');
  }
  
  if (profile.distance_compatibility < 0.5) {
    recommendations.push('Рассмотрите расширение географии поиска');
  }
  
  if (profile.location_compatibility < 0.5) {
    recommendations.push('Разные предпочтения по местам встреч');
  }
  
  return recommendations;
}