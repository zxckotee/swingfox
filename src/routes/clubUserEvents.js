const express = require('express');
const { sequelize } = require('../config/database');
const { 
  ClubEvents, 
  EventParticipants, 
  Clubs, 
  User,
  Notifications 
} = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Получение публичных мероприятий клубов
router.get('/public/events', async (req, res) => {
  try {
    const { limit = 20, offset = 0, type, city, date } = req.query;
    
    const whereClause = {
      date: {
        [sequelize.Sequelize.Op.gte]: new Date()
      }
    };

    if (type) {
      whereClause.event_type = type;
    }

    if (date) {
      whereClause.date = {
        [sequelize.Sequelize.Op.gte]: new Date(date)
      };
    }

    const events = await ClubEvents.findAll({
      where: whereClause,
      include: [
        {
          model: Clubs,
          as: 'club',
          attributes: ['id', 'name', 'location', 'type'],
          where: city ? {
            location: {
              [sequelize.Sequelize.Op.iLike]: `%${city}%`
            }
          } : {}
        },
        {
          model: EventParticipants,
          as: 'participants',
          attributes: ['id', 'status'],
          where: { status: 'confirmed' }
        }
      ],
      order: [['date', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ events });
  } catch (error) {
    console.error('Get public events error:', error);
    res.status(500).json({ error: 'Ошибка при получении мероприятий' });
  }
});

// Получение мероприятий с информацией об участии пользователя (авторизованный)
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0, type, city, search } = req.query;
    const userId = req.user.id;
    
    const whereClause = {
      date: {
        [sequelize.Sequelize.Op.gte]: new Date()
      }
    };

    if (type) {
      whereClause.event_type = type;
    }

    if (search) {
      whereClause.title = {
        [sequelize.Sequelize.Op.iLike]: `%${search}%`
      };
    }

    const events = await ClubEvents.findAll({
      where: whereClause,
      include: [
        {
          model: Clubs,
          as: 'club',
          attributes: ['id', 'name', 'location', 'type'],
          where: city ? {
            location: {
              [sequelize.Sequelize.Op.iLike]: `%${city}%`
            }
          } : {}
        },
        {
          model: EventParticipants,
          as: 'participants',
          attributes: ['id', 'status', 'user_id'],
          where: { status: 'confirmed' },
          required: false
        }
      ],
      order: [['date', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Добавляем информацию об участии пользователя
    const eventsWithParticipation = events.map(event => {
      const eventData = event.toJSON();
      const userParticipation = eventData.participants?.find(p => p.user_id === userId);
      
      return {
        ...eventData,
        user_participation: userParticipation ? {
          status: userParticipation.status,
          is_participating: true
        } : {
          status: null,
          is_participating: false
        }
      };
    });

    res.json({ events: eventsWithParticipation });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({ error: 'Ошибка при получении мероприятий' });
  }
});

// Получение конкретного мероприятия
router.get('/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await ClubEvents.findByPk(eventId, {
      include: [
        {
          model: Clubs,
          as: 'club',
          attributes: ['id', 'name', 'location', 'type', 'description', 'contact_info']
        },
        {
          model: EventParticipants,
          as: 'participants',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'login', 'name', 'ava', 'age']
            }
          ]
        }
      ]
    });

    if (!event) {
      return res.status(404).json({ error: 'Мероприятие не найдено' });
    }

    res.json({ event: event.toJSON() });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Ошибка при получении мероприятия' });
  }
});

// Присоединение к мероприятию (для авторизованных пользователей)
router.post('/events/:eventId/join', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // Проверяем существование мероприятия
    const event = await ClubEvents.findByPk(eventId, {
      include: [
        {
          model: Clubs,
          as: 'club',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!event) {
      return res.status(404).json({ error: 'Мероприятие не найдено' });
    }

    // Проверяем, можно ли присоединиться
    if (!event.canJoin()) {
      return res.status(400).json({ error: 'Нельзя присоединиться к этому мероприятию' });
    }

    // Проверяем, не присоединился ли уже пользователь
    const existingParticipation = await EventParticipants.findOne({
      where: { event_id: eventId, user_id: userId }
    });

    if (existingParticipation) {
      return res.status(400).json({ error: 'Вы уже участвуете в этом мероприятии' });
    }

    // Проверяем лимит участников
    if (event.max_participants) {
      const currentParticipants = await EventParticipants.count({
        where: { event_id: eventId, status: 'confirmed' }
      });

      if (currentParticipants >= event.max_participants) {
        return res.status(400).json({ error: 'Достигнут лимит участников' });
      }
    }

    // Создаем участие
    const participation = await EventParticipants.create({
      event_id: eventId,
      user_id: userId,
      status: 'confirmed'
    });

    // Обновляем счетчик участников
    event.current_participants += 1;
    await event.save();

    // Создаем уведомление для клуба
    await Notifications.create({
      user_id: event.club_id,
      type: 'event_update',
      title: 'Новый участник',
      message: `${req.user.login} присоединился к мероприятию "${event.title}"`,
      data: { event_id: eventId, user_id: userId }
    });

    res.json({
      message: 'Успешно присоединились к мероприятию',
      participation: participation.toJSON()
    });

  } catch (error) {
    console.error('Join event error:', error);
    res.status(500).json({ error: 'Ошибка при присоединении к мероприятию' });
  }
});

// Отмена участия в мероприятии
router.delete('/events/:eventId/leave', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // Находим участие
    const participation = await EventParticipants.findOne({
      where: { event_id: eventId, user_id: userId }
    });

    if (!participation) {
      return res.status(404).json({ error: 'Участие не найдено' });
    }

    // Удаляем участие
    await participation.destroy();

    // Обновляем счетчик участников
    const event = await ClubEvents.findByPk(eventId);
    if (event && participation.status === 'confirmed') {
      event.current_participants = Math.max(0, event.current_participants - 1);
      await event.save();
    }

    res.json({ message: 'Участие отменено' });

  } catch (error) {
    console.error('Leave event error:', error);
    res.status(500).json({ error: 'Ошибка при отмене участия' });
  }
});

// Изменение статуса участия
router.put('/events/:eventId/status', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['confirmed', 'maybe', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    // Находим участие
    const participation = await EventParticipants.findOne({
      where: { event_id: eventId, user_id: userId }
    });

    if (!participation) {
      return res.status(404).json({ error: 'Участие не найдено' });
    }

    const oldStatus = participation.status;
    participation.status = status;
    await participation.save();

    // Обновляем счетчик участников
    const event = await ClubEvents.findByPk(eventId);
    if (event) {
      if (oldStatus === 'confirmed' && status !== 'confirmed') {
        event.current_participants = Math.max(0, event.current_participants - 1);
      } else if (oldStatus !== 'confirmed' && status === 'confirmed') {
        event.current_participants += 1;
      }
      await event.save();
    }

    res.json({
      message: 'Статус обновлен',
      participation: participation.toJSON()
    });

  } catch (error) {
    console.error('Update participation status error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении статуса' });
  }
});

// Получение мероприятий пользователя
router.get('/user/events', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;

    const participations = await EventParticipants.getUserEvents(userId, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ participations });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({ error: 'Ошибка при получении мероприятий пользователя' });
  }
});

// Получение рекомендаций мероприятий
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.id;

    // Получаем предпочтения пользователя на основе его участия
    const userParticipations = await EventParticipants.findAll({
      where: { user_id: userId, status: 'confirmed' },
      include: [
        {
          model: ClubEvents,
          as: 'event',
          attributes: ['event_type', 'club_id']
        }
      ]
    });

    // Анализируем предпочтения
    const preferences = {};
    userParticipations.forEach(participation => {
      const eventType = participation.event.event_type;
      preferences[eventType] = (preferences[eventType] || 0) + 1;
    });

    // Получаем рекомендуемые мероприятия
    const recommendedEvents = await ClubEvents.findAll({
      where: {
        date: {
          [sequelize.Sequelize.Op.gte]: new Date()
        },
        event_type: {
          [sequelize.Sequelize.Op.in]: Object.keys(preferences)
        }
      },
      include: [
        {
          model: Clubs,
          as: 'club',
          attributes: ['id', 'name', 'location', 'type']
        },
        {
          model: EventParticipants,
          as: 'participants',
          attributes: ['id', 'status'],
          where: { status: 'confirmed' }
        }
      ],
      order: [['date', 'ASC']],
      limit: parseInt(limit)
    });

    res.json({ 
      recommendations: recommendedEvents,
      user_preferences: preferences
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Ошибка при получении рекомендаций' });
  }
});

// Поиск мероприятий
router.get('/search/events', async (req, res) => {
  try {
    const { q, type, city, date_from, date_to, limit = 20, offset = 0 } = req.query;
    
    const whereClause = {
      date: {
        [sequelize.Sequelize.Op.gte]: new Date()
      }
    };

    if (q) {
      whereClause[sequelize.Sequelize.Op.or] = [
        {
          title: {
            [sequelize.Sequelize.Op.iLike]: `%${q}%`
          }
        },
        {
          description: {
            [sequelize.Sequelize.Op.iLike]: `%${q}%`
          }
        }
      ];
    }

    if (type) {
      whereClause.event_type = type;
    }

    if (date_from) {
      whereClause.date[sequelize.Sequelize.Op.gte] = new Date(date_from);
    }

    if (date_to) {
      whereClause.date[sequelize.Sequelize.Op.lte] = new Date(date_to);
    }

    const events = await ClubEvents.findAll({
      where: whereClause,
      include: [
        {
          model: Clubs,
          as: 'club',
          attributes: ['id', 'name', 'location', 'type'],
          where: city ? {
            location: {
              [sequelize.Sequelize.Op.iLike]: `%${city}%`
            }
          } : {}
        },
        {
          model: EventParticipants,
          as: 'participants',
          attributes: ['id', 'status'],
          where: { status: 'confirmed' }
        }
      ],
      order: [['date', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ events });
  } catch (error) {
    console.error('Search events error:', error);
    res.status(500).json({ error: 'Ошибка при поиске мероприятий' });
  }
});

module.exports = router;
