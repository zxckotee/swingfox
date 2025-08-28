const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User, Geo } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { calculateDistance, formatAge, parseGeo } = require('../utils/helpers');

// GET /api/catalog - Получение каталога анкет с фильтрами
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

    // Строим условия фильтрации
    const whereConditions = {
      login: { [Op.ne]: userId } // Исключаем себя
    };

    // Фильтр по семейному статусу (только те, кого я ищу)
    if (status && status.length > 0) {
      const statusArray = Array.isArray(status) ? status : [status];
      whereConditions.status = { [Op.in]: statusArray };
    }

    // Фильтр по стране
    if (country) {
      whereConditions.country = country;
      
      // Фильтр по городу (только если указана страна)
      if (city) {
        whereConditions.city = city;
      }
    }

    // ДОПОЛНИТЕЛЬНАЯ ФИЛЬТРАЦИЯ ПО ВЗАИМНОЙ СОВМЕСТИМОСТИ
    // 1. Проверяем, что я ищу людей с их статусом
    // 2. Проверяем, что они ищут людей с моим статусом
    
    // Получаем пользователей с базовыми фильтрами
    let users = await User.findAll({
      where: whereConditions,
      attributes: [
        'id', 'login', 'ava', 'status', 'country', 'city', 
        'geo', 'date', 'registration', 'info', 'online', 'viptype',
        'search_status', 'search_age', 'height', 'weight', 'smoking', 'alko'
      ],
      order: User.sequelize.random(),
      limit: parseInt(limit) * 2, // Берем больше для фильтрации по совместимости
      offset: parseInt(offset)
    });

    // Фильтруем по взаимной совместимости
    const compatibleUsers = users.filter(user => {
      // Проверяем, что я ищу людей с их статусом
      const iAmLookingForTheirStatus = currentUser.search_status && 
        currentUser.search_status.includes(user.status);
      
      // Проверяем, что они ищут людей с моим статусом
      const theyAreLookingForMyStatus = user.search_status && 
        user.search_status.includes(currentUser.status);
      
      // Проверяем возрастные ограничения (если указаны)
      let ageCompatible = true;
      if (currentUser.search_age && user.date) {
        const userAge = formatAge(user.date);
        const [minAge, maxAge] = currentUser.search_age.split('_').map(Number);
        if (!isNaN(minAge) && !isNaN(maxAge)) {
          ageCompatible = userAge >= minAge && userAge <= maxAge;
        }
      }
      
      // Проверяем их возрастные ограничения
      if (user.search_age && currentUser.date) {
        const myAge = formatAge(currentUser.date);
        const [minAge, maxAge] = user.search_age.split('_').map(Number);
        if (!isNaN(minAge) && !isNaN(maxAge)) {
          ageCompatible = ageCompatible && (myAge >= minAge && myAge <= maxAge);
        }
      }
      
      return iAmLookingForTheirStatus && theyAreLookingForMyStatus && ageCompatible;
    });

    // Ограничиваем результат до нужного количества
    const finalUsers = compatibleUsers.slice(0, parseInt(limit));

    // Подготавливаем геоданные текущего пользователя
    const currentGeo = parseGeo(currentUser.geo);

    // Форматируем результаты
    const formattedUsers = finalUsers.map(user => {
      // Вычисляем расстояние
      const userGeo = parseGeo(user.geo);
      let distance = 0;
      if (currentGeo && userGeo) {
        distance = Math.round(calculateDistance(
          currentGeo.lat, currentGeo.lng,
          userGeo.lat, userGeo.lng
        ));
      }

      // Форматируем возраст
      const age = formatAge(user.date);

      // Базовые данные пользователя
      let userData = {
        id: user.id,
        login: user.login,
        ava: user.ava,
        status: user.status,
        country: user.country,
        city: user.city,
        age,
        distance,
        registration: user.registration,
        info: user.info,
        online: user.online,
        viptype: user.viptype
      };

      // Добавляем данные партнера для пар
      if (user.status === 'Семейная пара(М+Ж)' || user.status === 'Несемейная пара(М+Ж)') {
        const partnerData = user.getPartnerData();
        if (partnerData) {
          userData.partnerData = partnerData;
          userData.isCouple = true;
        }
      } else {
        userData.isCouple = false;
      }

      // Добавляем дополнительные поля для отображения
      if (user.height) userData.height = user.height;
      if (user.weight) userData.weight = user.weight;
      if (user.smoking) userData.smoking = user.smoking;
      if (user.alko) userData.alko = user.alko;
      if (user.search_status) userData.searchStatus = user.search_status;
      if (user.search_age) userData.searchAge = user.search_age;
      if (user.location) userData.location = user.location;

      return userData;
    });

    // Получаем общее количество для пагинации (с учетом совместимости)
    const totalCompatibleCount = await User.count({
      where: {
        ...whereConditions,
        // Добавляем базовые условия совместимости для подсчета
        search_status: {
          [Op.like]: `%${currentUser.status}%`
        }
      }
    });

    res.json({
      users: formattedUsers,
      pagination: {
        total: totalCompatibleCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCompatibleCount
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

module.exports = router;