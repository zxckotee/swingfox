const express = require('express');
const router = express.Router();
const { Geo } = require('../models');
const { APILogger } = require('../utils/logger');

// GET /api/geo/countries - Получить список всех стран
router.get('/countries', async (req, res) => {
  const logger = new APILogger('GEO');
  
  try {
    logger.logRequest(req, 'GET /countries');
    
    logger.logProcess('Получение списка стран', {}, req);
    logger.logDatabase('SELECT', 'geo', { 
      operation: 'getCountries',
      group_by: 'country',
      order_by: 'country ASC'
    }, req);
    
    const countries = await Geo.getCountries();
    
    logger.logResult('Получение стран', true, {
      countries_count: countries.length,
      first_country: countries[0]?.country,
      last_country: countries[countries.length - 1]?.country
    }, req);

    const responseData = {
      success: true,
      data: countries,
      count: countries.length
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении списка стран'
    });
  }
});

// GET /api/geo/cities/:country - Получить список городов для страны
router.get('/cities/:country', async (req, res) => {
  const logger = new APILogger('GEO');
  
  try {
    logger.logRequest(req, 'GET /cities/:country');
    
    const { country } = req.params;
    const { limit = 100, search } = req.query;
    
    logger.logBusinessLogic(1, 'Валидация параметров', {
      country_provided: !!country,
      limit,
      search_provided: !!search
    }, req);
    
    if (!country) {
      const errorData = { error: 'missing_country', message: 'Параметр country обязателен' };
      logger.logError(req, new Error('Missing country parameter'), 400);
      return res.status(400).json(errorData);
    }

    logger.logProcess('Получение городов для страны', { 
      country, 
      limit, 
      search 
    }, req);
    
    let cities;
    if (search) {
      logger.logDatabase('SELECT', 'geo', {
        operation: 'searchCitiesByCountry',
        country,
        search_term: search,
        limit
      }, req);
      
      cities = await Geo.findAll({
        where: {
          country,
          city: {
            [Geo.sequelize.Sequelize.Op.iLike]: `%${search}%`
          }
        },
        attributes: ['city', 'region'],
        limit: parseInt(limit),
        order: [['city', 'ASC']]
      });
    } else {
      logger.logDatabase('SELECT', 'geo', {
        operation: 'getCitiesByCountry',
        country,
        limit
      }, req);
      
      cities = await Geo.getCitiesByCountry(country);
      if (limit && parseInt(limit) < cities.length) {
        cities = cities.slice(0, parseInt(limit));
      }
    }
    
    logger.logResult('Получение городов', true, {
      country,
      cities_count: cities.length,
      search_used: !!search,
      first_city: cities[0]?.city,
      last_city: cities[cities.length - 1]?.city
    }, req);

    const responseData = {
      success: true,
      data: cities,
      count: cities.length,
      country
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении списка городов'
    });
  }
});

// GET /api/geo/regions/:country - Получить список регионов для страны
router.get('/regions/:country', async (req, res) => {
  const logger = new APILogger('GEO');
  
  try {
    logger.logRequest(req, 'GET /regions/:country');
    
    const { country } = req.params;
    
    logger.logBusinessLogic(1, 'Валидация параметров', {
      country_provided: !!country
    }, req);
    
    if (!country) {
      const errorData = { error: 'missing_country', message: 'Параметр country обязателен' };
      logger.logError(req, new Error('Missing country parameter'), 400);
      return res.status(400).json(errorData);
    }

    logger.logProcess('Получение регионов для страны', { country }, req);
    logger.logDatabase('SELECT', 'geo', {
      operation: 'getRegionsByCountry',
      country,
      filter: 'region IS NOT NULL',
      group_by: 'region'
    }, req);
    
    const regions = await Geo.getRegionsByCountry(country);
    
    logger.logResult('Получение регионов', true, {
      country,
      regions_count: regions.length,
      first_region: regions[0]?.region,
      last_region: regions[regions.length - 1]?.region
    }, req);

    const responseData = {
      success: true,
      data: regions,
      count: regions.length,
      country
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении списка регионов'
    });
  }
});

// GET /api/geo/cities/:country/:region - Получить города для страны и региона
router.get('/cities/:country/:region', async (req, res) => {
  const logger = new APILogger('GEO');
  
  try {
    logger.logRequest(req, 'GET /cities/:country/:region');
    
    const { country, region } = req.params;
    
    logger.logBusinessLogic(1, 'Валидация параметров', {
      country_provided: !!country,
      region_provided: !!region
    }, req);
    
    if (!country || !region) {
      const errorData = { 
        error: 'missing_parameters', 
        message: 'Параметры country и region обязательны' 
      };
      logger.logError(req, new Error('Missing country or region parameter'), 400);
      return res.status(400).json(errorData);
    }

    logger.logProcess('Получение городов для страны и региона', { 
      country, 
      region 
    }, req);
    logger.logDatabase('SELECT', 'geo', {
      operation: 'getCitiesByCountryAndRegion',
      country,
      region
    }, req);
    
    const cities = await Geo.getCitiesByCountryAndRegion(country, region);
    
    logger.logResult('Получение городов по региону', true, {
      country,
      region,
      cities_count: cities.length,
      first_city: cities[0]?.city,
      last_city: cities[cities.length - 1]?.city
    }, req);

    const responseData = {
      success: true,
      data: cities,
      count: cities.length,
      country,
      region
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении списка городов по региону'
    });
  }
});

// GET /api/geo/search - Поиск географических данных
router.get('/search', async (req, res) => {
  const logger = new APILogger('GEO');
  
  try {
    logger.logRequest(req, 'GET /search');
    
    const { q: searchTerm, limit = 50 } = req.query;
    
    logger.logBusinessLogic(1, 'Валидация поискового запроса', {
      search_term_provided: !!searchTerm,
      search_term_length: searchTerm?.length,
      limit
    }, req);
    
    if (!searchTerm || searchTerm.trim().length < 2) {
      const errorData = { 
        error: 'invalid_search', 
        message: 'Поисковый запрос должен содержать минимум 2 символа' 
      };
      logger.logError(req, new Error('Invalid search term'), 400);
      return res.status(400).json(errorData);
    }

    logger.logProcess('Поиск географических данных', { 
      search_term: searchTerm,
      limit 
    }, req);
    logger.logDatabase('SELECT', 'geo', {
      operation: 'searchCities',
      search_term: searchTerm,
      limit
    }, req);
    
    const results = await Geo.searchCities(searchTerm.trim(), parseInt(limit));
    
    logger.logResult('Поиск географических данных', true, {
      search_term: searchTerm,
      results_count: results.length,
      first_result: results[0]?.city,
      last_result: results[results.length - 1]?.city
    }, req);

    const responseData = {
      success: true,
      data: results,
      count: results.length,
      search_term: searchTerm
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при поиске географических данных'
    });
  }
});

// POST /api/geo/validate - Валидация географических данных
router.post('/validate', async (req, res) => {
  const logger = new APILogger('GEO');
  
  try {
    logger.logRequest(req, 'POST /validate');
    
    const { country, city, region } = req.body;
    
    logger.logBusinessLogic(1, 'Валидация входных данных', {
      country_provided: !!country,
      city_provided: !!city,
      region_provided: !!region
    }, req);
    
    if (!country || !city) {
      const errorData = { 
        error: 'missing_data', 
        message: 'Параметры country и city обязательны' 
      };
      logger.logError(req, new Error('Missing country or city'), 400);
      return res.status(400).json(errorData);
    }

    logger.logProcess('Валидация географического местоположения', { 
      country, 
      city, 
      region 
    }, req);
    logger.logDatabase('SELECT', 'geo', {
      operation: 'validateLocation',
      country,
      city,
      region
    }, req);
    
    const isValid = await Geo.validateLocation(country, city, region);
    
    logger.logResult('Валидация местоположения', isValid, {
      country,
      city,
      region,
      is_valid: isValid
    }, req);

    const responseData = {
      success: true,
      valid: isValid,
      location: { country, city, region }
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при валидации географических данных'
    });
  }
});

module.exports = router;