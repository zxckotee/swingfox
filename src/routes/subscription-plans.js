const express = require('express');
const router = express.Router();
const { SubscriptionPlans, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { APILogger } = require('../utils/logger');

// GET /api/subscription-plans - Получение всех активных тарифных планов
router.get('/', authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTION_PLANS');
  
  try {
    logger.logRequest(req, 'GET /subscription-plans');
    
    const plans = await SubscriptionPlans.findAll({
      where: { is_active: true },
      order: [['monthly_price', 'ASC']]
    });

    logger.logSuccess(req, 200, { plans_count: plans.length });
    res.json(plans);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении тарифных планов'
    });
  }
});

// GET /api/subscription-plans/:type - Получение конкретного тарифного плана
router.get('/:type', authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTION_PLANS');
  
  try {
    logger.logRequest(req, `GET /subscription-plans/${req.params.type}`);
    
    const { type } = req.params;
    
    if (!['FREE', 'VIP', 'PREMIUM'].includes(type)) {
      return res.status(400).json({
        error: 'invalid_plan_type',
        message: 'Некорректный тип тарифного плана'
      });
    }

    const plan = await SubscriptionPlans.findOne({
      where: { type, is_active: true }
    });

    if (!plan) {
      return res.status(404).json({
        error: 'plan_not_found',
        message: 'Тарифный план не найден'
      });
    }

    logger.logSuccess(req, 200, { plan_type: type });
    res.json(plan);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении тарифного плана'
    });
  }
});

// POST /api/subscription-plans - Создание нового тарифного плана (только для админов)
router.post('/', authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTION_PLANS');
  
  try {
    logger.logRequest(req, 'POST /subscription-plans');
    
    // Проверяем права администратора
    const user = await User.findOne({ 
      where: { login: req.user.login },
      attributes: ['viptype']
    });

    if (user.viptype !== 'PREMIUM') {
      return res.status(403).json({
        error: 'insufficient_permissions',
        message: 'Недостаточно прав для создания тарифных планов'
      });
    }

    const {
      name,
      type,
      monthly_price,
      quarterly_price,
      yearly_price,
      features
    } = req.body;

    // Валидация данных
    if (!name || !type || !monthly_price || !quarterly_price || !yearly_price || !features) {
      return res.status(400).json({
        error: 'missing_required_fields',
        message: 'Не все обязательные поля заполнены'
      });
    }

    if (!['FREE', 'VIP', 'PREMIUM'].includes(type)) {
      return res.status(400).json({
        error: 'invalid_plan_type',
        message: 'Некорректный тип тарифного плана'
      });
    }

    // Проверяем, не существует ли уже план с таким типом
    const existingPlan = await SubscriptionPlans.findOne({
      where: { type }
    });

    if (existingPlan) {
      return res.status(409).json({
        error: 'plan_already_exists',
        message: 'Тарифный план с таким типом уже существует'
      });
    }

    // Создаем новый план
    const newPlan = await SubscriptionPlans.create({
      name,
      type,
      monthly_price,
      quarterly_price,
      yearly_price,
      features,
      is_active: true
    });

    logger.logSuccess(req, 201, { 
      plan_id: newPlan.id,
      plan_type: newPlan.type 
    });
    
    res.status(201).json(newPlan);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при создании тарифного плана'
    });
  }
});

// PUT /api/subscription-plans/:id - Обновление тарифного плана (только для админов)
router.put('/:id', authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTION_PLANS');
  
  try {
    logger.logRequest(req, `PUT /subscription-plans/${req.params.id}`);
    
    // Проверяем права администратора
    const user = await User.findOne({ 
      where: { login: req.user.login },
      attributes: ['viptype']
    });

    if (user.viptype !== 'PREMIUM') {
      return res.status(403).json({
        error: 'insufficient_permissions',
        message: 'Недостаточно прав для обновления тарифных планов'
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Находим план
    const plan = await SubscriptionPlans.findByPk(id);

    if (!plan) {
      return res.status(404).json({
        error: 'plan_not_found',
        message: 'Тарифный план не найден'
      });
    }

    // Обновляем план
    await plan.update(updateData);

    logger.logSuccess(req, 200, { 
      plan_id: plan.id,
      plan_type: plan.type 
    });
    
    res.json(plan);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при обновлении тарифного плана'
    });
  }
});

// DELETE /api/subscription-plans/:id - Деактивация тарифного плана (только для админов)
router.delete('/:id', authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTION_PLANS');
  
  try {
    logger.logRequest(req, `DELETE /subscription-plans/${req.params.id}`);
    
    // Проверяем права администратора
    const user = await User.findOne({ 
      where: { login: req.user.login },
      attributes: ['viptype']
    });

    if (user.viptype !== 'PREMIUM') {
      return res.status(403).json({
        error: 'insufficient_permissions',
        message: 'Недостаточно прав для деактивации тарифных планов'
      });
    }

    const { id } = req.params;

    // Находим план
    const plan = await SubscriptionPlans.findByPk(id);

    if (!plan) {
      return res.status(404).json({
        error: 'plan_not_found',
        message: 'Тарифный план не найден'
      });
    }

    // Деактивируем план (не удаляем физически)
    await plan.update({ is_active: false });

    logger.logSuccess(req, 200, { 
      plan_id: plan.id,
      plan_type: plan.type 
    });
    
    res.json({ 
      message: 'Тарифный план успешно деактивирован',
      plan: plan
    });

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при деактивации тарифного плана'
    });
  }
});

// GET /api/subscription-plans/compare/:plan1/:plan2 - Сравнение двух тарифных планов
router.get('/compare/:plan1/:plan2', authenticateToken, async (req, res) => {
  const logger = new APILogger('SUBSCRIPTION_PLANS');
  
  try {
    logger.logRequest(req, `GET /subscription-plans/compare/${req.params.plan1}/${req.params.plan2}`);
    
    const { plan1, plan2 } = req.params;
    
    if (!['FREE', 'VIP', 'PREMIUM'].includes(plan1) || !['FREE', 'VIP', 'PREMIUM'].includes(plan2)) {
      return res.status(400).json({
        error: 'invalid_plan_type',
        message: 'Некорректные типы тарифных планов'
      });
    }

    const [plan1Data, plan2Data] = await Promise.all([
      SubscriptionPlans.findOne({ where: { type: plan1, is_active: true } }),
      SubscriptionPlans.findOne({ where: { type: plan2, is_active: true } })
    ]);

    if (!plan1Data || !plan2Data) {
      return res.status(404).json({
        error: 'plan_not_found',
        message: 'Один или оба тарифных плана не найдены'
      });
    }

    // Сравниваем возможности
    const comparison = {
      plan1: {
        type: plan1Data.type,
        name: plan1Data.name,
        prices: {
          monthly: plan1Data.monthly_price,
          quarterly: plan1Data.quarterly_price,
          yearly: plan1Data.yearly_price
        },
        features: plan1Data.features
      },
      plan2: {
        type: plan2Data.type,
        name: plan2Data.name,
        prices: {
          monthly: plan2Data.monthly_price,
          quarterly: plan2Data.quarterly_price,
          yearly: plan2Data.yearly_price
        },
        features: plan2Data.features
      },
      price_difference: {
        monthly: plan2Data.monthly_price - plan1Data.monthly_price,
        quarterly: plan2Data.quarterly_price - plan1Data.quarterly_price,
        yearly: plan2Data.yearly_price - plan1Data.yearly_price
      }
    };

    logger.logSuccess(req, 200, { 
      plan1_type: plan1,
      plan2_type: plan2 
    });
    
    res.json(comparison);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при сравнении тарифных планов'
    });
  }
});

module.exports = router;
