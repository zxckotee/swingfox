const express = require('express');
const { sequelize } = require('../config/database');
const { ClubApplications, User, Clubs } = require('../models');
const { authenticateClub } = require('../middleware/clubAuth');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Получение заявок в клуб (для клуба)
router.get('/', authenticateClub, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    
    const whereClause = { club_id: req.club.id };
    if (status) {
      whereClause.status = status;
    }

    const applications = await ClubApplications.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'login', 'name', 'ava', 'age', 'city', 'description']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ applications });
  } catch (error) {
    console.error('Get club applications error:', error);
    res.status(500).json({ error: 'Ошибка при получении заявок' });
  }
});

// Получение заявок пользователя (для пользователя)
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const applications = await ClubApplications.getUserApplications(req.user.id);
    res.json({ applications });
  } catch (error) {
    console.error('Get user applications error:', error);
    res.status(500).json({ error: 'Ошибка при получении заявок' });
  }
});

// Создание заявки в клуб (для пользователя)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { clubId, message } = req.body;

    if (!clubId) {
      return res.status(400).json({ error: 'ID клуба обязателен' });
    }

    // Проверяем существование клуба
    const club = await Clubs.findByPk(clubId);
    if (!club) {
      return res.status(404).json({ error: 'Клуб не найден' });
    }

    // Проверяем, активен ли клуб
    if (!club.is_active) {
      return res.status(400).json({ error: 'Клуб неактивен' });
    }

    // Создаем заявку
    const application = await ClubApplications.createApplication(clubId, req.user.id, message);

    res.status(201).json({
      message: 'Заявка отправлена',
      application: application.toJSON()
    });

  } catch (error) {
    console.error('Create application error:', error);
    if (error.message.includes('уже существует')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Ошибка при создании заявки' });
    }
  }
});

// Одобрение заявки (для клуба)
router.put('/:applicationId/approve', authenticateClub, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await ClubApplications.findOne({
      where: {
        id: applicationId,
        club_id: req.club.id,
        status: 'pending'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'login', 'name', 'ava']
        }
      ]
    });

    if (!application) {
      return res.status(404).json({ error: 'Заявка не найдена или уже обработана' });
    }

    await application.approve();

    res.json({
      message: 'Заявка одобрена',
      application: application.toJSON()
    });

  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({ error: 'Ошибка при одобрении заявки' });
  }
});

// Отклонение заявки (для клуба)
router.put('/:applicationId/reject', authenticateClub, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await ClubApplications.findOne({
      where: {
        id: applicationId,
        club_id: req.club.id,
        status: 'pending'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'login', 'name', 'ava']
        }
      ]
    });

    if (!application) {
      return res.status(404).json({ error: 'Заявка не найдена или уже обработана' });
    }

    await application.reject();

    res.json({
      message: 'Заявка отклонена',
      application: application.toJSON()
    });

  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({ error: 'Ошибка при отклонении заявки' });
  }
});

// Получение статистики заявок (для клуба)
router.get('/stats', authenticateClub, async (req, res) => {
  try {
    const stats = await ClubApplications.getApplicationStats(req.club.id);
    res.json({ stats });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({ error: 'Ошибка при получении статистики' });
  }
});

// Получение конкретной заявки (для клуба)
router.get('/:applicationId', authenticateClub, async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await ClubApplications.findOne({
      where: {
        id: applicationId,
        club_id: req.club.id
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'login', 'name', 'ava', 'age', 'city', 'description', 'created_at']
        }
      ]
    });

    if (!application) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    res.json({ application: application.toJSON() });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Ошибка при получении заявки' });
  }
});

// Массовое одобрение заявок (для клуба)
router.post('/bulk-approve', authenticateClub, async (req, res) => {
  try {
    const { applicationIds } = req.body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ error: 'Список ID заявок обязателен' });
    }

    const applications = await ClubApplications.findAll({
      where: {
        id: applicationIds,
        club_id: req.club.id,
        status: 'pending'
      }
    });

    if (applications.length === 0) {
      return res.status(404).json({ error: 'Нет заявок для одобрения' });
    }

    const approvedCount = 0;
    for (const application of applications) {
      await application.approve();
      approvedCount++;
    }

    res.json({
      message: `Одобрено ${approvedCount} заявок`,
      approved_count: approvedCount
    });

  } catch (error) {
    console.error('Bulk approve applications error:', error);
    res.status(500).json({ error: 'Ошибка при массовом одобрении заявок' });
  }
});

// Массовое отклонение заявок (для клуба)
router.post('/bulk-reject', authenticateClub, async (req, res) => {
  try {
    const { applicationIds } = req.body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ error: 'Список ID заявок обязателен' });
    }

    const applications = await ClubApplications.findAll({
      where: {
        id: applicationIds,
        club_id: req.club.id,
        status: 'pending'
      }
    });

    if (applications.length === 0) {
      return res.status(404).json({ error: 'Нет заявок для отклонения' });
    }

    const rejectedCount = 0;
    for (const application of applications) {
      await application.reject();
      rejectedCount++;
    }

    res.json({
      message: `Отклонено ${rejectedCount} заявок`,
      rejected_count: rejectedCount
    });

  } catch (error) {
    console.error('Bulk reject applications error:', error);
    res.status(500).json({ error: 'Ошибка при массовом отклонении заявок' });
  }
});

// Публичные клубы (для пользователей)
router.get('/public/clubs', async (req, res) => {
  try {
    const { limit = 20, offset = 0, city, type } = req.query;
    
    const whereClause = { is_active: true };
    
    if (city) {
      whereClause.location = {
        [sequelize.Sequelize.Op.iLike]: `%${city}%`
      };
    }
    
    if (type) {
      whereClause.type = type;
    }

    const clubs = await Clubs.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'description', 'location', 'type', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ clubs });
  } catch (error) {
    console.error('Get public clubs error:', error);
    res.status(500).json({ error: 'Ошибка при получении клубов' });
  }
});

module.exports = router;
