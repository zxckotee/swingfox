const express = require('express');
const { ClubBots, ClubBotService } = require('../models');
const { authenticateClub } = require('../middleware/clubAuth');
const router = express.Router();

// Получение ботов клуба
router.get('/', authenticateClub, async (req, res) => {
  try {
    const bots = await ClubBots.findAll({
      where: { club_id: req.club.id },
      order: [['created_at', 'ASC']]
    });
    
    // Преобразуем is_active в status для совместимости с фронтендом
    const formattedBots = bots.map(bot => {
      const botData = bot.toJSON();
      return {
        ...botData,
        status: botData.is_active ? 'active' : 'inactive',
        type: botData.settings?.type || 'custom',
        trigger: botData.settings?.trigger || '',
        interval: botData.settings?.interval || '',
        tasks_completed: botData.settings?.tasks_completed || 0,
        last_run: botData.settings?.last_run || null
      };
    });
    
    res.json({ bots: formattedBots });
  } catch (error) {
    console.error('Get club bots error:', error);
    res.status(500).json({ error: 'Ошибка при получении ботов' });
  }
});

// Получение конкретного бота
router.get('/:botId', authenticateClub, async (req, res) => {
  try {
    const { botId } = req.params;

    const bot = await ClubBots.findOne({
      where: {
        id: botId,
        club_id: req.club.id
      }
    });

    if (!bot) {
      return res.status(404).json({ error: 'Бот не найден' });
    }

    // Преобразуем is_active в status для совместимости с фронтендом
    const botData = bot.toJSON();
    const formattedBot = {
      ...botData,
      status: botData.is_active ? 'active' : 'inactive',
      type: botData.settings?.type || 'custom',
      trigger: botData.settings?.trigger || '',
      interval: botData.settings?.interval || '',
      tasks_completed: botData.settings?.tasks_completed || 0,
      last_run: botData.settings?.last_run || null
    };

    res.json({ bot: formattedBot });
  } catch (error) {
    console.error('Get bot error:', error);
    res.status(500).json({ error: 'Ошибка при получении бота' });
  }
});

// Обновление настроек бота
router.put('/:botId/settings', authenticateClub, async (req, res) => {
  try {
    const { botId } = req.params;
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Настройки должны быть объектом' });
    }

    const bot = await ClubBots.findOne({
      where: {
        id: botId,
        club_id: req.club.id
      }
    });

    if (!bot) {
      return res.status(404).json({ error: 'Бот не найден' });
    }

    // Обновляем настройки
    for (const [key, value] of Object.entries(settings)) {
      await bot.setSetting(key, value);
    }

    res.json({
      message: 'Настройки обновлены',
      bot: bot.toJSON()
    });

  } catch (error) {
    console.error('Update bot settings error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении настроек' });
  }
});

// Активация/деактивация бота
router.put('/:botId/toggle', authenticateClub, async (req, res) => {
  try {
    const { botId } = req.params;

    const bot = await ClubBots.findOne({
      where: {
        id: botId,
        club_id: req.club.id
      }
    });

    if (!bot) {
      return res.status(404).json({ error: 'Бот не найден' });
    }

    bot.is_active = !bot.is_active;
    await bot.save();

    // Преобразуем is_active в status для совместимости с фронтендом
    const botData = bot.toJSON();
    const formattedBot = {
      ...botData,
      status: botData.is_active ? 'active' : 'inactive',
      type: botData.settings?.type || 'custom',
      trigger: botData.settings?.trigger || '',
      interval: botData.settings?.interval || '',
      tasks_completed: botData.settings?.tasks_completed || 0,
      last_run: botData.settings?.last_run || null
    };

    res.json({
      message: `Бот ${bot.is_active ? 'активирован' : 'деактивирован'}`,
      bot: formattedBot
    });

  } catch (error) {
    console.error('Toggle bot error:', error);
    res.status(500).json({ error: 'Ошибка при переключении бота' });
  }
});

// Ручной запуск авто-приглашений
router.post('/auto-invites/:eventId', authenticateClub, async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await ClubBotService.sendAutoInvites(eventId);
    
    if (result.success) {
      res.json({
        message: result.message,
        invited_count: result.invited_count
      });
    } else {
      res.status(400).json({ error: result.message });
    }

  } catch (error) {
    console.error('Manual auto-invites error:', error);
    res.status(500).json({ error: 'Ошибка при отправке авто-приглашений' });
  }
});

// Ручной запуск напоминаний
router.post('/reminders', authenticateClub, async (req, res) => {
  try {
    const result = await ClubBotService.sendEventReminders();
    
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ error: result.message });
    }

  } catch (error) {
    console.error('Manual reminders error:', error);
    res.status(500).json({ error: 'Ошибка при отправке напоминаний' });
  }
});

// Генерация рекомендаций
router.post('/recommendations', authenticateClub, async (req, res) => {
  try {
    const result = await ClubBotService.generateRecommendations(req.club.id);
    
    if (result.success) {
      res.json({
        message: result.message,
        recommendations: result.recommendations
      });
    } else {
      res.status(400).json({ error: result.message });
    }

  } catch (error) {
    console.error('Generate recommendations error:', error);
    res.status(500).json({ error: 'Ошибка при генерации рекомендаций' });
  }
});

// Обновление статистики
router.post('/update-stats', authenticateClub, async (req, res) => {
  try {
    const result = await ClubBotService.updateClubStats(req.club.id);
    
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ error: result.message });
    }

  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении статистики' });
  }
});

// Создание нового бота
router.post('/', authenticateClub, async (req, res) => {
  try {
    const { name, description, type, trigger, interval, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Название бота обязательно' });
    }

    // Собираем настройки из полей формы
    const settings = {
      type: type || 'custom',
      trigger: trigger || '',
      interval: interval || '',
      tasks_completed: 0,
      last_run: null
    };

    const bot = await ClubBots.create({
      club_id: req.club.id,
      name,
      description,
      settings,
      is_active: status === 'active'
    });

    // Преобразуем is_active в status для совместимости с фронтендом
    const botData = bot.toJSON();
    const formattedBot = {
      ...botData,
      status: botData.is_active ? 'active' : 'inactive',
      type: botData.settings?.type || 'custom',
      trigger: botData.settings?.trigger || '',
      interval: botData.settings?.interval || '',
      tasks_completed: botData.settings?.tasks_completed || 0,
      last_run: botData.settings?.last_run || null
    };

    res.status(201).json({
      message: 'Бот создан',
      bot: formattedBot
    });

  } catch (error) {
    console.error('Create bot error:', error);
    res.status(500).json({ error: 'Ошибка при создании бота' });
  }
});

// Обновление бота
router.put('/:botId', authenticateClub, async (req, res) => {
  try {
    const { botId } = req.params;
    const { name, description, type, trigger, interval, status } = req.body;

    const bot = await ClubBots.findOne({
      where: {
        id: botId,
        club_id: req.club.id
      }
    });

    if (!bot) {
      return res.status(404).json({ error: 'Бот не найден' });
    }

    // Обновляем настройки
    const settings = {
      ...bot.settings,
      type: type || bot.settings?.type || 'custom',
      trigger: trigger || bot.settings?.trigger || '',
      interval: interval || bot.settings?.interval || '',
      tasks_completed: bot.settings?.tasks_completed || 0,
      last_run: bot.settings?.last_run || null
    };

    await bot.update({
      name: name || bot.name,
      description: description || bot.description,
      settings,
      is_active: status !== undefined ? (status === 'active') : bot.is_active
    });

    // Преобразуем is_active в status для совместимости с фронтендом
    const botData = bot.toJSON();
    const formattedBot = {
      ...botData,
      status: botData.is_active ? 'active' : 'inactive',
      type: botData.settings?.type || 'custom',
      trigger: botData.settings?.trigger || '',
      interval: botData.settings?.interval || '',
      tasks_completed: botData.settings?.tasks_completed || 0,
      last_run: botData.settings?.last_run || null
    };

    res.json({
      message: 'Бот обновлен',
      bot: formattedBot
    });

  } catch (error) {
    console.error('Update bot error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении бота' });
  }
});

// Удаление бота
router.delete('/:botId', authenticateClub, async (req, res) => {
  try {
    const { botId } = req.params;

    const bot = await ClubBots.findOne({
      where: {
        id: botId,
        club_id: req.club.id
      }
    });

    if (!bot) {
      return res.status(404).json({ error: 'Бот не найден' });
    }

    await bot.destroy();

    res.json({ message: 'Бот удален' });

  } catch (error) {
    console.error('Delete bot error:', error);
    res.status(500).json({ error: 'Ошибка при удалении бота' });
  }
});

// Получение логов бота (заглушка для будущей реализации)
router.get('/:botId/logs', authenticateClub, async (req, res) => {
  try {
    const { botId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const bot = await ClubBots.findOne({
      where: {
        id: botId,
        club_id: req.club.id
      }
    });

    if (!bot) {
      return res.status(404).json({ error: 'Бот не найден' });
    }

    // Здесь будет логика получения логов бота
    // Пока возвращаем заглушку
    const logs = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Бот запущен',
        data: {}
      }
    ];

    res.json({ logs });

  } catch (error) {
    console.error('Get bot logs error:', error);
    res.status(500).json({ error: 'Ошибка при получении логов' });
  }
});

// Получение статистики работы ботов
router.get('/stats/overview', authenticateClub, async (req, res) => {
  try {
    const bots = await ClubBots.findAll({
      where: { club_id: req.club.id },
      attributes: [
        'id',
        'name',
        'is_active',
        'created_at'
      ]
    });

    const stats = {
      total_bots: bots.length,
      active_bots: bots.filter(bot => bot.is_active).length,
      inactive_bots: bots.filter(bot => !bot.is_active).length,
      bots: bots.map(bot => ({
        id: bot.id,
        name: bot.name,
        is_active: bot.is_active,
        created_at: bot.created_at
      }))
    };

    res.json({ stats });

  } catch (error) {
    console.error('Get bots stats error:', error);
    res.status(500).json({ error: 'Ошибка при получении статистики ботов' });
  }
});

module.exports = router;
