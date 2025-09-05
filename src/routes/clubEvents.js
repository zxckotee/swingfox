const express = require('express');
const { sequelize } = require('../config/database');
const { ClubEvents, EventParticipants, User, Clubs } = require('../models');
const { authenticateClub, checkEventOwnership } = require('../middleware/clubAuth');
const router = express.Router();

// Получение списка мероприятий клуба
router.get('/', authenticateClub, async (req, res) => {
  try {
    const { status = 'all', limit = 20, offset = 0 } = req.query;
    
    const events = await ClubEvents.getClubEvents(req.club.id, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ events });
  } catch (error) {
    console.error('Get club events error:', error);
    res.status(500).json({ error: 'Ошибка при получении мероприятий' });
  }
});

// Создание нового мероприятия
router.post('/', authenticateClub, async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      location,
      max_participants,
      price,
      event_type,
      is_premium,
      auto_invite_enabled
    } = req.body;

    // Валидация
    if (!title || !date) {
      return res.status(400).json({ error: 'Название и дата обязательны' });
    }

    // Проверка даты
    const eventDate = new Date(date);
    if (eventDate <= new Date()) {
      return res.status(400).json({ error: 'Дата мероприятия должна быть в будущем' });
    }

    const event = await ClubEvents.create({
      club_id: req.club.id,
      title,
      description,
      date,
      time,
      location,
      max_participants: max_participants ? parseInt(max_participants) : null,
      price: price ? parseFloat(price) : 0,
      event_type: event_type || 'other',
      is_premium: is_premium || false,
      auto_invite_enabled: auto_invite_enabled !== false
    });

    res.status(201).json({
      message: 'Мероприятие создано',
      event: event.toJSON()
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Ошибка при создании мероприятия' });
  }
});

// Получение конкретного мероприятия
router.get('/:eventId', authenticateClub, checkEventOwnership, async (req, res) => {
  try {
    const event = await ClubEvents.findByPk(req.event.id, {
      include: [
        {
          model: EventParticipants,
          as: 'participants',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'login', 'name', 'ava', 'age', 'city']
            }
          ]
        }
      ]
    });

    res.json({ event: event.toJSON() });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Ошибка при получении мероприятия' });
  }
});

// Обновление мероприятия
router.put('/:eventId', authenticateClub, checkEventOwnership, async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      location,
      max_participants,
      price,
      event_type,
      is_premium,
      auto_invite_enabled
    } = req.body;

    const event = req.event;

    // Обновление полей
    if (title) event.title = title;
    if (description !== undefined) event.description = description;
    if (date) {
      const eventDate = new Date(date);
      if (eventDate <= new Date()) {
        return res.status(400).json({ error: 'Дата мероприятия должна быть в будущем' });
      }
      event.date = date;
    }
    if (time !== undefined) event.time = time;
    if (location !== undefined) event.location = location;
    if (max_participants !== undefined) {
      event.max_participants = max_participants ? parseInt(max_participants) : null;
    }
    if (price !== undefined) event.price = parseFloat(price) || 0;
    if (event_type) event.event_type = event_type;
    if (is_premium !== undefined) event.is_premium = is_premium;
    if (auto_invite_enabled !== undefined) event.auto_invite_enabled = auto_invite_enabled;

    await event.save();

    res.json({
      message: 'Мероприятие обновлено',
      event: event.toJSON()
    });

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Ошибка при обновлении мероприятия' });
  }
});

// Удаление мероприятия
router.delete('/:eventId', authenticateClub, checkEventOwnership, async (req, res) => {
  try {
    const event = req.event;

    // Проверяем, есть ли участники
    const participantCount = await EventParticipants.count({
      where: { event_id: event.id }
    });

    if (participantCount > 0) {
      return res.status(400).json({ 
        error: 'Нельзя удалить мероприятие с участниками. Сначала удалите всех участников.' 
      });
    }

    await event.destroy();

    res.json({ message: 'Мероприятие удалено' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Ошибка при удалении мероприятия' });
  }
});

// Получение участников мероприятия
router.get('/:eventId/participants', authenticateClub, checkEventOwnership, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    const participants = await EventParticipants.getEventParticipants(req.event.id, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ participants });
  } catch (error) {
    console.error('Get event participants error:', error);
    res.status(500).json({ error: 'Ошибка при получении участников' });
  }
});

// Приглашение пользователей на мероприятие
router.post('/:eventId/invite', authenticateClub, checkEventOwnership, async (req, res) => {
  try {
    const { userIds } = req.body;
    const event = req.event;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Список пользователей обязателен' });
    }

    // Проверяем, не превышает ли количество приглашений лимит
    if (event.max_participants) {
      const currentParticipants = await EventParticipants.count({
        where: { event_id: event.id }
      });
      
      if (currentParticipants + userIds.length > event.max_participants) {
        return res.status(400).json({ 
          error: `Превышен лимит участников. Максимум: ${event.max_participants}` 
        });
      }
    }

    const invitations = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        // Проверяем, не приглашен ли уже пользователь
        const existingInvitation = await EventParticipants.findOne({
          where: { event_id: event.id, user_id: userId }
        });

        if (existingInvitation) {
          errors.push(`Пользователь ${userId} уже приглашен`);
          continue;
        }

        // Проверяем существование пользователя
        const user = await User.findByPk(userId);
        if (!user) {
          errors.push(`Пользователь ${userId} не найден`);
          continue;
        }

        const invitation = await EventParticipants.create({
          event_id: event.id,
          user_id: userId,
          status: 'invited',
          invited_by: null // Можно добавить ID приглашающего
        });

        invitations.push(invitation);
      } catch (error) {
        errors.push(`Ошибка приглашения пользователя ${userId}: ${error.message}`);
      }
    }

    res.json({
      message: `Приглашено ${invitations.length} пользователей`,
      invitations: invitations.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Invite participants error:', error);
    res.status(500).json({ error: 'Ошибка при приглашении участников' });
  }
});

// Удаление участника из мероприятия
router.delete('/:eventId/participants/:userId', authenticateClub, checkEventOwnership, async (req, res) => {
  try {
    const { userId } = req.params;
    const event = req.event;

    const participant = await EventParticipants.findOne({
      where: { event_id: event.id, user_id: userId }
    });

    if (!participant) {
      return res.status(404).json({ error: 'Участник не найден' });
    }

    await participant.destroy();

    res.json({ message: 'Участник удален из мероприятия' });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({ error: 'Ошибка при удалении участника' });
  }
});

// Публичные мероприятия (для пользователей)
router.get('/public/upcoming', async (req, res) => {
  try {
    const { limit = 10, type, city, search } = req.query;
    
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
          attributes: ['id', 'status'],
          where: { status: 'confirmed' },
          required: false // Делаем JOIN необязательным
        }
      ],
      order: [['date', 'ASC']],
      limit: parseInt(limit)
    });

    res.json({ events });
  } catch (error) {
    console.error('Get public events error:', error);
    res.status(500).json({ error: 'Ошибка при получении мероприятий' });
  }
});

module.exports = router;
