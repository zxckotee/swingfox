const express = require('express');
const router = express.Router();
const { Gifts, User, Notifications } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');
const { APILogger } = require('../utils/logger');
const sequelize = require('../models/index').sequelize; // Added for direct query

// GET /api/gifts - Получение подарков пользователя
router.get('/', authenticateToken, async (req, res) => {
  const logger = new APILogger('GIFTS');
  
  try {
    logger.logRequest(req, 'GET /gifts');
    
    const userId = req.user.login;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    logger.logBusinessLogic(1, 'Получение подарков пользователя', {
      user_id: userId,
      page: parseInt(page),
      limit: parseInt(limit)
    }, req);

    // Получаем подарки пользователя
    const gifts = await Gifts.findAll({
      where: { 
        owner: userId,
        is_valid: true 
      },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['login', 'name', 'ava']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Подсчитываем общее количество
    const totalCount = await Gifts.count({
      where: { 
        owner: userId,
        is_valid: true 
      }
    });

    // Форматируем подарки
    const formattedGifts = gifts.map(gift => ({
      id: gift.id,
      gift_type: gift.gift_type,
      type_name: gift.getTypeName(),
      cost: gift.getCost(),
      from_user: gift.from_user,
      sender_info: gift.sender ? {
        login: gift.sender.login,
        avatar: gift.sender.ava
      } : null,
      date: gift.date,
      created_at: gift.created_at
    }));

    const responseData = {
      gifts: formattedGifts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };

    logger.logSuccess(req, 200, {
      gifts_count: gifts.length,
      total_count: totalCount
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении подарков'
    });
  }
});

// GET /api/gifts/types - Получение типов подарков
router.get('/types', authenticateToken, async (req, res) => {
  const logger = new APILogger('GIFTS');
  
  try {
    logger.logRequest(req, 'GET /gifts/types');
    
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Получение типов подарков', {
      user_id: userId
    }, req);

    // Получаем типы подарков
    const giftTypes = Gifts.getGiftTypes();

    // Получаем баланс пользователя
    const user = await User.findOne({ 
      where: { login: userId },
      attributes: ['balance', 'viptype']
    });

    const responseData = {
      gift_types: giftTypes,
      user_balance: user.balance,
      user_vip_type: user.viptype
    };

    logger.logSuccess(req, 200, {
      types_count: giftTypes.length,
      user_balance: user.balance
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении типов подарков'
    });
  }
});

// GET /api/gifts/history - История подарков (отправленные и полученные)
router.get('/history', authenticateToken, async (req, res) => {
  const logger = new APILogger('GIFTS');
  
  try {
    logger.logRequest(req, 'GET /gifts/history');
    
    const userId = req.user.login;
    const { type = 'all', limit = 20, offset = 0 } = req.query;

    logger.logBusinessLogic(1, 'Получение истории подарков', {
      user_id: userId,
      type,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }, req);

    let whereCondition = { is_valid: true };
    
    if (type === 'sent') {
      whereCondition.from_user = userId;
    } else if (type === 'received') {
      whereCondition.owner = userId;
    } else {
      // 'all' - получаем и отправленные и полученные
      whereCondition = {
        [require('sequelize').Op.or]: [
          { from_user: userId, is_valid: true },
          { owner: userId, is_valid: true }
        ]
      };
    }

    // Получаем подарки
    const gifts = await Gifts.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['login', 'name', 'ava']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['login', 'name', 'ava']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Подсчитываем общее количество
    const totalCount = await Gifts.count({ where: whereCondition });

    // Форматируем подарки
    const formattedGifts = gifts.map(gift => ({
      id: gift.id,
      gift_type: gift.gift_type,
      type_name: gift.getTypeName(),
      cost: gift.getCost(),
      from_user: gift.from_user,
      to_user: gift.owner,
      sender_info: gift.sender ? {
        login: gift.sender.login,
        name: gift.sender.name,
        avatar: gift.sender.ava
      } : null,
      recipient_info: gift.recipient ? {
        login: gift.recipient.login,
        name: gift.recipient.name,
        avatar: gift.recipient.ava
      } : null,
      message: gift.message || '',
      date: gift.date,
      created_at: gift.created_at
    }));

    const responseData = {
      gifts: formattedGifts,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: totalCount,
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
      }
    };

    logger.logSuccess(req, 200, {
      gifts_count: gifts.length,
      total_count: totalCount
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении истории подарков'
    });
  }
});

// POST /api/gifts/send - Отправка подарка
router.post('/send', authenticateToken, async (req, res) => {
  const logger = new APILogger('GIFTS');
  
  try {
    logger.logRequest(req, 'POST /gifts/send');
    
    const { target_user, gift_type, message } = req.body;
    const fromUser = req.user.login;

    if (!target_user || !gift_type) {
      return res.status(400).json({
        error: 'missing_data',
        message: 'Не указан получатель или тип подарка'
      });
    }

    logger.logBusinessLogic(1, 'Отправка подарка', {
      from_user: fromUser,
      target_user,
      gift_type,
      message: message || ''
    }, req);

    // Получаем данные отправителя
    const currentUser = await User.findOne({ where: { login: fromUser } });
    const giftTypes = Gifts.getGiftTypes();
    const gift = giftTypes.find(g => g.id === gift_type);
    
    if (!gift) {
      return res.status(400).json({
        error: 'invalid_gift',
        message: 'Неверный тип подарка'
      });
    }

    // Проверяем баланс
    if (currentUser.balance < gift.cost) {
      logger.logWarning('Недостаточно средств', {
        user_balance: currentUser.balance,
        gift_cost: gift.cost
      }, req);
      
      return res.status(400).json({
        error: 'insufficient_balance',
        message: 'Недостаточно средств на балансе',
        required: gift.cost,
        available: currentUser.balance
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

    // Создаем подарок
    const giftId = generateId();
    const today = new Date().toISOString().split('T')[0];

    logger.logDatabase('INSERT', 'gifts', {
      id: giftId,
      owner: target_user,
      from_user: fromUser,
      gift_type,
      cost: gift.cost
    }, req);

    const newGift = await Gifts.create({
      id: giftId,
      owner: target_user,
      from_user: fromUser,
      gift_type,
      message: message || '',
      date: today,
      is_valid: true
    });

    // Списываем средства
    logger.logDatabase('UPDATE', 'users', {
      user_id: fromUser,
      balance_change: -gift.cost
    }, req);

    await currentUser.update({
      balance: currentUser.balance - gift.cost
    });

    // Создаем уведомление о подарке
    try {
      await Notifications.createGiftNotification(target_user, fromUser, gift_type);
    } catch (notifError) {
      logger.logWarning('Ошибка создания уведомления о подарке', notifError, req);
    }

    const responseData = {
      success: true,
      gift: {
        id: newGift.id,
        type: gift_type,
        type_name: gift.name,
        cost: gift.cost,
        recipient: target_user,
        date: today
      },
      remaining_balance: currentUser.balance - gift.cost,
      message: `Подарок "${gift.name}" отправлен!`
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при отправке подарка'
    });
  }
});

// GET /api/gifts/sent - Получение отправленных подарков
router.get('/sent', authenticateToken, async (req, res) => {
  const logger = new APILogger('GIFTS');
  
  try {
    logger.logRequest(req, 'GET /gifts/sent');
    
    const userId = req.user.login;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    logger.logBusinessLogic(1, 'Получение отправленных подарков', {
      user_id: userId,
      page: parseInt(page),
      limit: parseInt(limit)
    }, req);

    // Получаем отправленные подарки
    const sentGifts = await Gifts.findAll({
      where: { 
        from_user: userId,
        is_valid: true 
      },
      include: [{
        model: User,
        as: 'recipient',
        attributes: ['login', 'name', 'ava']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Подсчитываем общее количество
    const totalCount = await Gifts.count({
      where: { 
        from_user: userId,
        is_valid: true 
      }
    });

    // Форматируем подарки
    const formattedGifts = sentGifts.map(gift => ({
      id: gift.id,
      type: gift.gift_type,
      type_name: gift.getTypeName(),
      cost: gift.getCost(),
      to_user: gift.owner,
      recipient_info: gift.recipient ? {
        login: gift.recipient.login,
        name: gift.recipient.name,
        avatar: gift.recipient.ava
      } : null,
      date: gift.date,
      created_at: gift.created_at
    }));

    const responseData = {
      sent_gifts: formattedGifts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };

    logger.logSuccess(req, 200, {
      gifts_count: sentGifts.length,
      total_count: totalCount
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении отправленных подарков'
    });
  }
});

// DELETE /api/gifts/:id - Удаление подарка (только для получателя)
router.delete('/:id', authenticateToken, async (req, res) => {
  const logger = new APILogger('GIFTS');
  
  try {
    logger.logRequest(req, 'DELETE /gifts/:id');
    
    const { id } = req.params;
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Удаление подарка', {
      user_id: userId,
      gift_id: id
    }, req);

    // Находим подарок
    const gift = await Gifts.findOne({
      where: {
        id: parseInt(id),
        owner: userId
      }
    });

    if (!gift) {
      return res.status(404).json({
        error: 'gift_not_found',
        message: 'Подарок не найден или не принадлежит вам'
      });
    }

    // Помечаем подарок как недействительный
    logger.logDatabase('UPDATE', 'gifts', {
      gift_id: id,
      is_valid: false
    }, req);

    await gift.update({ is_valid: false });

    logger.logResult('Удаление подарка', true, {
      gift_id: id
    }, req);

    const responseData = {
      success: true,
      message: 'Подарок удален'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при удалении подарка'
    });
  }
});

// GET /api/gifts/stats - Статистика подарков пользователя
router.get('/stats', authenticateToken, async (req, res) => {
  const logger = new APILogger('GIFTS');
  
  try {
    logger.logRequest(req, 'GET /gifts/stats');
    
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Получение статистики подарков', {
      user_id: userId
    }, req);

    // Получаем количество полученных подарков
    const receivedCount = await Gifts.count({
      where: { 
        owner: userId,
        is_valid: true 
      }
    });

    // Получаем количество отправленных подарков
    const sentCount = await Gifts.count({
      where: { 
        from_user: userId,
        is_valid: true 
      }
    });

    // Получаем общую стоимость полученных подарков
    const receivedGifts = await Gifts.findAll({
      where: { 
        owner: userId,
        is_valid: true 
      }
    });

    let totalReceivedValue = 0;
    receivedGifts.forEach(gift => {
      totalReceivedValue += gift.getCost();
    });

    // Получаем общую стоимость отправленных подарков
    const sentGifts = await Gifts.findAll({
      where: { 
        from_user: userId,
        is_valid: true 
      }
    });

    let totalSentValue = 0;
    sentGifts.forEach(gift => {
      totalSentValue += gift.getCost();
    });

    // Получаем топ отправителей
    const topSenders = await Gifts.findAll({
      where: { 
        owner: userId,
        is_valid: true 
      },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['login', 'name', 'ava']
      }],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    const responseData = {
      received: {
        count: receivedCount,
        total_value: totalReceivedValue
      },
      sent: {
        count: sentCount,
        total_value: totalSentValue
      },
      top_senders: topSenders.map(gift => ({
        user: gift.sender ? {
          login: gift.sender.login,
          avatar: gift.sender.ava
        } : null,
        gift_type: gift.getTypeName(),
        date: gift.date
      }))
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении статистики подарков'
    });
  }
});

// GET /api/gifts/received/:username - Получение подарков конкретного пользователя
router.get('/received/:username', authenticateToken, async (req, res) => {
  const logger = new APILogger('GIFTS');
  
  try {
    logger.logRequest(req, 'GET /gifts/received/:username');
    
    const { username } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    console.log('Gifts route called with:', { username, limit, offset });

    // Прямой SQL запрос для отладки
    const directQuery = await sequelize.query(
      'SELECT * FROM gifts WHERE owner = :username AND is_valid = true LIMIT 5',
      {
        replacements: { username },
        type: sequelize.QueryTypes.SELECT
      }
    );
    console.log('Direct SQL query result:', directQuery);

    logger.logBusinessLogic(1, 'Получение подарков пользователя', {
      target_user: username,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }, req);

    // Получаем подарки пользователя
    const whereCondition = { 
      owner: username,
      is_valid: true 
    };
    console.log('Sequelize where condition:', whereCondition);
    
    // Проверяем структуру модели
    console.log('Gifts model attributes:', Object.keys(Gifts.rawAttributes));
    console.log('Gifts model associations:', Object.keys(Gifts.associations || {}));
    
    const gifts = await Gifts.findAll({
      where: whereCondition,
      include: [{
        model: User,
        as: 'sender',
        attributes: ['login', 'ava']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('Found gifts:', gifts.length);
    console.log('Gifts data:', gifts.map(g => ({ id: g.id, owner: g.owner, from_user: g.from_user, gift_type: g.gift_type })));

    // Подсчитываем общее количество
    const totalCount = await Gifts.count({
      where: { 
        owner: username,
        is_valid: true 
      }
    });

    console.log('Total count:', totalCount);

    // Форматируем подарки
    const formattedGifts = gifts.map(gift => ({
      id: gift.id,
      gift_type: gift.gift_type,
      type_name: gift.getTypeName(),
      cost: gift.getCost(),
      from_user: gift.from_user,
      sender_login: gift.from_user,
      sender_info: gift.sender ? {
        login: gift.sender.login,
        name: gift.sender.name,
        avatar: gift.sender.ava
      } : null,
      recipient_info: gift.recipient ? {
        login: gift.recipient.login,
        avatar: gift.recipient.ava
      } : null,
      message: gift.message || '',
      date: gift.date,
      created_at: gift.created_at
    }));

    console.log('Formatted gifts:', formattedGifts);

    const responseData = {
      gifts: formattedGifts,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: totalCount,
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
      }
    };

    logger.logSuccess(req, 200, {
      target_user: username,
      gifts_count: gifts.length,
      total_count: totalCount
    });
    
    res.json(responseData);

  } catch (error) {
    console.error('Error in gifts route:', error);
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении подарков пользователя'
    });
  }
});

module.exports = router;