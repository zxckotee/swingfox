const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User } = require('../models');
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

    // Получаем данные текущего пользователя для расчета расстояния
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

    // Фильтр по семейному статусу
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

    // Получаем пользователей с фильтрами
    const users = await User.findAll({
      where: whereConditions,
      attributes: [
        'id', 'login', 'ava', 'status', 'country', 'city', 
        'geo', 'date', 'registration', 'info', 'online', 'viptype'
      ],
      order: User.sequelize.random(),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Подготавливаем геоданные текущего пользователя
    const currentGeo = parseGeo(currentUser.geo);

    // Форматируем результаты
    const formattedUsers = users.map(user => {
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
      if (user.alko) user.alko = user.alko;
      if (user.search_status) userData.searchStatus = user.search_status;
      if (user.search_age) userData.searchAge = user.search_age;
      if (user.location) userData.location = user.location;

      return userData;
    });

    // Получаем общее количество для пагинации
    const totalCount = await User.count({ where: whereConditions });

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
    // Получаем доступные статусы из базы данных
    const statuses = await User.findAll({
      attributes: ['status'],
      where: {
        status: { [Op.ne]: null },
        status: { [Op.ne]: '' }
      },
      group: ['status'],
      order: [['status', 'ASC']]
    });

    // Получаем доступные страны и города
    const countries = await User.findAll({
      attributes: ['country'],
      where: {
        country: { [Op.ne]: null },
        country: { [Op.ne]: '' }
      },
      group: ['country'],
      order: [['country', 'ASC']]
    });

    const cities = await User.findAll({
      attributes: ['country', 'city'],
      where: {
        city: { [Op.ne]: null },
        city: { [Op.ne]: '' }
      },
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

    res.json({
      statuses: statuses.map(s => s.status),
      countries: countries.map(c => c.country),
      cities: citiesByCountry
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