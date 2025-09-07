const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { sequelize } = require('../config/database');
const { ClubEvents, EventParticipants, User, Clubs } = require('../models');
const { authenticateClub, checkEventOwnership } = require('../middleware/clubAuth');
const { generateId } = require('../utils/helpers');
const router = express.Router();

// Multer configuration for event images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `event_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Только изображения разрешены'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Максимум 10 файлов за раз
  }
});

// Получение списка мероприятий клуба
router.get('/events', authenticateClub, async (req, res) => {
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
router.post('/events', authenticateClub, async (req, res) => {
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
      auto_invite_enabled,
      duration_hours
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
      auto_invite_enabled: auto_invite_enabled !== false,
      duration_hours: duration_hours ? parseInt(duration_hours) : 2
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
router.get('/events/:eventId', authenticateClub, checkEventOwnership, async (req, res) => {
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
              attributes: ['id', 'login', 'ava', 'city']
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
router.put('/events/:eventId', authenticateClub, checkEventOwnership, async (req, res) => {
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
      auto_invite_enabled,
      duration_hours
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
    if (duration_hours !== undefined) event.duration_hours = duration_hours ? parseInt(duration_hours) : 2;

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
router.delete('/events/:eventId', authenticateClub, checkEventOwnership, async (req, res) => {
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
router.get('/events/:eventId/participants', authenticateClub, checkEventOwnership, async (req, res) => {
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
router.post('/events/:eventId/invite', authenticateClub, checkEventOwnership, async (req, res) => {
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
router.delete('/events/:eventId/participants/:userId', authenticateClub, checkEventOwnership, async (req, res) => {
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
router.get('/public/events/upcoming', async (req, res) => {
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

// Загрузка аватара мероприятия
router.post('/events/:eventId/avatar', authenticateClub, checkEventOwnership, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не был загружен' });
    }

    const { x = 0, y = 0, width, height } = req.body;
    const event = req.event;

    // Обработка изображения с помощью Sharp
    const processedFileName = `event_avatar_${generateId()}.jpg`;
    const outputPath = path.join(__dirname, '../../public/uploads', processedFileName);

    try {
      let sharpImage = sharp(req.file.path);
      
      // Автоповорот на основе EXIF данных
      sharpImage = sharpImage.rotate();

      // Если указаны параметры обрезки
      if (width && height) {
        const cropX = parseInt(x) || 0;
        const cropY = parseInt(y) || 0;
        const cropWidth = parseInt(width);
        const cropHeight = parseInt(height);

        // Проверяем, что параметры обрезки корректны
        if (cropWidth > 0 && cropHeight > 0 && cropX >= 0 && cropY >= 0) {
          sharpImage = sharpImage.extract({
            left: cropX,
            top: cropY,
            width: cropWidth,
            height: cropHeight
          });
        }
      }

      // Изменяем размер до 590x160 и сохраняем как JPEG
      await sharpImage
        .resize(590, 160, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 90 })
        .toFile(outputPath);

    } catch (sharpError) {
      console.error('Sharp processing error:', sharpError);
      // Если ошибка Sharp, пробуем просто изменить размер без обрезки
      await sharp(req.file.path)
        .rotate()
        .resize(590, 160, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 90 })
        .toFile(outputPath);
    }

    // Удаляем временный файл
    await fs.unlink(req.file.path);

    // Удаляем старый аватар (если есть)
    if (event.avatar) {
      const oldAvatarPath = path.join(__dirname, '../../public/uploads', event.avatar);
      try {
        await fs.unlink(oldAvatarPath);
      } catch (err) {
        console.warn('Не удалось удалить старый аватар:', err.message);
      }
    }

    // Обновляем аватар мероприятия
    await event.update({ avatar: processedFileName });

    res.json({
      success: true,
      message: 'Аватар мероприятия успешно загружен',
      filename: processedFileName,
      url: `/uploads/${processedFileName}`
    });

  } catch (error) {
    console.error('Upload event avatar error:', error);
    res.status(500).json({ error: 'Ошибка при загрузке аватара мероприятия' });
  }
});

// Загрузка изображений мероприятия
router.post('/events/:eventId/images', authenticateClub, checkEventOwnership, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Файлы не были загружены' });
    }

    const event = req.event;
    const processedFiles = [];

    for (const file of req.files) {
      try {
        // Обработка изображения с помощью Sharp
        const processedFileName = `event_img_${generateId()}.jpg`;
        const outputPath = path.join(__dirname, '../../public/uploads', processedFileName);

        await sharp(file.path)
          .rotate()
          .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toFile(outputPath);

        // Удаляем временный файл
        await fs.unlink(file.path);

        processedFiles.push(processedFileName);
      } catch (error) {
        console.error('Error processing image:', error);
        // Удаляем временный файл в случае ошибки
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting temp file:', unlinkError);
        }
      }
    }

    if (processedFiles.length === 0) {
      return res.status(500).json({ error: 'Не удалось обработать ни одного изображения' });
    }

    // Добавляем новые изображения к существующим
    const currentImages = event.getImages();
    const updatedImages = [...currentImages, ...processedFiles];
    
    await event.update({ images: updatedImages });

    res.json({
      success: true,
      message: `Загружено ${processedFiles.length} изображений`,
      files: processedFiles.map(filename => ({
        filename,
        url: `/uploads/${filename}`
      }))
    });

  } catch (error) {
    console.error('Upload event images error:', error);
    res.status(500).json({ error: 'Ошибка при загрузке изображений мероприятия' });
  }
});

// Удаление изображения мероприятия
router.delete('/events/:eventId/images/:filename', authenticateClub, checkEventOwnership, async (req, res) => {
  try {
    const { filename } = req.params;
    const event = req.event;

    // Удаляем файл с диска
    const filePath = path.join(__dirname, '../../public/uploads', filename);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn('Не удалось удалить файл:', err.message);
    }

    // Удаляем из массива изображений
    const currentImages = event.getImages();
    const updatedImages = currentImages.filter(img => img !== filename);
    
    await event.update({ images: updatedImages });

    res.json({
      success: true,
      message: 'Изображение удалено'
    });

  } catch (error) {
    console.error('Delete event image error:', error);
    res.status(500).json({ error: 'Ошибка при удалении изображения' });
  }
});

module.exports = router;
