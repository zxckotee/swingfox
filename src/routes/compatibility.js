const express = require('express');
const router = express.Router();
const { Events, EventParticipants, User, Clubs } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { APILogger } = require('../utils/logger');

// GET /api/compatibility/calculate - Расчет совместимости
router.get('/calculate', authenticateToken, async (req, res) => {
  const logger = new APILogger('COMPATIBILITY');
  
  try {
    logger.logRequest(req, 'GET /compatibility/calculate');
    
    const { event_id, user_id, algorithm = 'basic' } = req.query;
    const userId = req.user.login;

    if (!event_id || !user_id) {
      return res.status(400).json({
        error: 'missing_data',
        message: 'Укажите ID мероприятия и ID пользователя'
      });
    }

    logger.logBusinessLogic(1, 'Расчет совместимости', {
      user_id: userId,
      event_id,
      target_user_id: user_id,
      algorithm
    }, req);

    // Получаем мероприятие
    const event = await Events.findOne({
      where: { id: parseInt(event_id) },
      include: [
        {
          model: Clubs,
          as: 'Club',
          attributes: ['id', 'owner']
        }
      ]
    });

    if (!event) {
      return res.status(404).json({
        error: 'event_not_found',
        message: 'Мероприятие не найдено'
      });
    }

    // Проверяем права доступа
    if (event.Club.owner !== userId) {
      return res.status(403).json({
        error: 'access_denied',
        message: 'Нет доступа к расчету совместимости для этого мероприятия'
      });
    }

    // Получаем целевого пользователя
    const targetUser = await User.findByPk(parseInt(user_id));
    if (!targetUser) {
      return res.status(404).json({
        error: 'user_not_found',
        message: 'Пользователь не найден'
      });
    }

    // Получаем всех участников мероприятия
    const participants = await EventParticipants.findAll({
      where: { event_id: parseInt(event_id) },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'login', 'name', 'ava', 'age', 'city', 'interests', 'viptype']
        }
      ]
    });

    // Рассчитываем совместимость
    let compatibilityScore = 0;
    let compatibilityDetails = {};

    switch (algorithm) {
      case 'basic':
        compatibilityScore = calculateBasicCompatibility(targetUser, event, participants);
        break;
      case 'advanced':
        compatibilityScore = calculateAdvancedCompatibility(targetUser, event, participants);
        break;
      case 'ai_enhanced':
        compatibilityScore = calculateAIEnhancedCompatibility(targetUser, event, participants);
        break;
      default:
        compatibilityScore = calculateBasicCompatibility(targetUser, event, participants);
    }

    // Получаем детали совместимости
    compatibilityDetails = getCompatibilityDetails(targetUser, event, participants, algorithm);

    // Обновляем оценку совместимости в базе данных
    try {
      await EventParticipants.update(
        { compatibility_score: compatibilityScore },
        {
          where: {
            event_id: parseInt(event_id),
            user_id: parseInt(user_id)
          }
        }
      );
    } catch (updateError) {
      logger.logWarning('Ошибка обновления оценки совместимости', updateError, req);
    }

    const responseData = {
      event: {
        id: event.id,
        title: event.title,
        event_type: event.event_type
      },
      user: {
        id: targetUser.id,
        login: targetUser.login,
        name: targetUser.name,
        avatar: targetUser.ava
      },
      compatibility: {
        score: compatibilityScore,
        algorithm: algorithm,
        details: compatibilityDetails
      }
    };

    logger.logSuccess(req, 200, {
      event_id,
      user_id,
      compatibility_score: compatibilityScore
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при расчете совместимости'
    });
  }
});

// GET /api/compatibility/event/:eventId - Совместимость всех участников мероприятия
router.get('/event/:eventId', authenticateToken, async (req, res) => {
  const logger = new APILogger('COMPATIBILITY');
  
  try {
    logger.logRequest(req, 'GET /compatibility/event/:eventId');
    
    const { eventId } = req.params;
    const { algorithm = 'basic', min_score = 3.0 } = req.query;
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Получение совместимости участников мероприятия', {
      user_id: userId,
      event_id: eventId,
      algorithm,
      min_score: parseFloat(min_score)
    }, req);

    // Получаем мероприятие
    const event = await Events.findOne({
      where: { id: parseInt(eventId) },
      include: [
        {
          model: Clubs,
          as: 'Club',
          attributes: ['id', 'owner']
        }
      ]
    });

    if (!event) {
      return res.status(404).json({
        error: 'event_not_found',
        message: 'Мероприятие не найдено'
      });
    }

    // Проверяем права доступа
    if (event.Club.owner !== userId) {
      return res.status(403).json({
        error: 'access_denied',
        message: 'Нет доступа к совместимости этого мероприятия'
      });
    }

    // Получаем всех участников
    const participants = await EventParticipants.findAll({
      where: { event_id: parseInt(eventId) },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'login', 'name', 'ava', 'age', 'city', 'interests', 'viptype']
        }
      ]
    });

    // Рассчитываем совместимость между всеми участниками
    const compatibilityMatrix = [];
    
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        const participant1 = participants[i];
        const participant2 = participants[j];
        
        let compatibilityScore = 0;
        switch (algorithm) {
          case 'basic':
            compatibilityScore = calculateBasicCompatibility(participant1.User, event, [participant2]);
            break;
          case 'advanced':
            compatibilityScore = calculateAdvancedCompatibility(participant1.User, event, [participant2]);
            break;
          case 'ai_enhanced':
            compatibilityScore = calculateAIEnhancedCompatibility(participant1.User, event, [participant2]);
            break;
          default:
            compatibilityScore = calculateBasicCompatibility(participant1.User, event, [participant2]);
        }

        // Обновляем оценки в базе данных
        try {
          await EventParticipants.update(
            { compatibility_score: compatibilityScore },
            {
              where: {
                event_id: parseInt(eventId),
                user_id: participant1.user_id
              }
            }
          );
          
          await EventParticipants.update(
            { compatibility_score: compatibilityScore },
            {
              where: {
                event_id: parseInt(eventId),
                user_id: participant2.user_id
              }
            }
          );
        } catch (updateError) {
          logger.logWarning('Ошибка обновления оценок совместимости', updateError, req);
        }

        compatibilityMatrix.push({
          user1: {
            id: participant1.user_id,
            login: participant1.User.login,
            name: participant1.User.name,
            avatar: participant1.User.ava
          },
          user2: {
            id: participant2.user_id,
            login: participant2.User.login,
            name: participant2.User.name,
            avatar: participant2.User.ava
          },
          compatibility_score: compatibilityScore,
          details: getCompatibilityDetails(participant1.User, event, [participant2], algorithm)
        });
      }
    }

    // Фильтруем по минимальному баллу
    const filteredMatrix = compatibilityMatrix.filter(item => 
      item.compatibility_score >= parseFloat(min_score)
    );

    // Сортируем по убыванию совместимости
    filteredMatrix.sort((a, b) => b.compatibility_score - a.compatibility_score);

    const responseData = {
      event: {
        id: event.id,
        title: event.title,
        event_type: event.event_type
      },
      algorithm,
      min_score: parseFloat(min_score),
      total_pairs: compatibilityMatrix.length,
      filtered_pairs: filteredMatrix.length,
      compatibility_matrix: filteredMatrix
    };

    logger.logSuccess(req, 200, {
      event_id: eventId,
      total_pairs: compatibilityMatrix.length,
      filtered_pairs: filteredMatrix.length
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении совместимости участников'
    });
  }
});

// GET /api/compatibility/suggestions/:eventId - Предложения по совместимости
router.get('/suggestions/:eventId', authenticateToken, async (req, res) => {
  const logger = new APILogger('COMPATIBILITY');
  
  try {
    logger.logRequest(req, 'GET /compatibility/suggestions/:eventId');
    
    const { eventId } = req.params;
    const { limit = 10 } = req.query;
    const userId = req.user.login;

    logger.logBusinessLogic(1, 'Получение предложений по совместимости', {
      user_id: userId,
      event_id: eventId,
      limit: parseInt(limit)
    }, req);

    // Получаем мероприятие
    const event = await Events.findOne({
      where: { id: parseInt(eventId) },
      include: [
        {
          model: Clubs,
          as: 'Club',
          attributes: ['id', 'owner']
        }
      ]
    });

    if (!event) {
      return res.status(404).json({
        error: 'event_not_found',
        message: 'Мероприятие не найдено'
      });
    }

    // Проверяем права доступа
    if (event.Club.owner !== userId) {
      return res.status(403).json({
        error: 'access_denied',
        message: 'Нет доступа к предложениям этого мероприятия'
      });
    }

    // Получаем участников с высокой совместимостью
    const compatibleParticipants = await EventParticipants.getCompatibleParticipants(
      parseInt(eventId),
      null, // Не исключаем никого
      {
        limit: parseInt(limit),
        min_compatibility: 3.5
      }
    );

    // Группируем по уровням совместимости
    const suggestions = {
      excellent: compatibleParticipants.filter(p => p.compatibility_score >= 4.5),
      good: compatibleParticipants.filter(p => p.compatibility_score >= 3.5 && p.compatibility_score < 4.5),
      moderate: compatibleParticipants.filter(p => p.compatibility_score >= 2.5 && p.compatibility_score < 3.5)
    };

    const responseData = {
      event: {
        id: event.id,
        title: event.title,
        event_type: event.event_type
      },
      suggestions,
      summary: {
        excellent_count: suggestions.excellent.length,
        good_count: suggestions.good.length,
        moderate_count: suggestions.moderate.length,
        total_suggestions: compatibleParticipants.length
      }
    };

    logger.logSuccess(req, 200, {
      event_id: eventId,
      total_suggestions: compatibleParticipants.length
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении предложений по совместимости'
    });
  }
});

// Вспомогательные функции для расчета совместимости

function calculateBasicCompatibility(user, event, participants) {
  let score = 0;
  let factors = 0;

  // Возрастная совместимость
  if (user.age && participants.length > 0) {
    const avgAge = participants.reduce((sum, p) => sum + (p.User?.age || 0), 0) / participants.length;
    const ageDiff = Math.abs(user.age - avgAge);
    
    if (ageDiff <= 5) score += 2;
    else if (ageDiff <= 10) score += 1;
    else if (ageDiff <= 15) score += 0.5;
    
    factors++;
  }

  // Географическая совместимость
  if (user.city && participants.length > 0) {
    const sameCity = participants.filter(p => p.User?.city === user.city).length;
    const cityCompatibility = sameCity / participants.length;
    score += cityCompatibility * 2;
    factors++;
  }

  // VIP статус совместимость
  if (user.viptype && participants.length > 0) {
    const sameVipType = participants.filter(p => p.User?.viptype === user.viptype).length;
    const vipCompatibility = sameVipType / participants.length;
    score += vipCompatibility * 1.5;
    factors++;
  }

  // Тип мероприятия
  if (event.event_type && user.interests) {
    const interests = user.interests.toLowerCase();
    const eventType = event.event_type.toLowerCase();
    
    if (interests.includes(eventType) || eventType.includes(interests)) {
      score += 1.5;
    }
    factors++;
  }

  return factors > 0 ? Math.min(5, (score / factors) * 2.5) : 0;
}

function calculateAdvancedCompatibility(user, event, participants) {
  let score = calculateBasicCompatibility(user, event, participants);
  
  // Дополнительные факторы для продвинутого алгоритма
  if (participants.length > 0) {
    // Уровень активности
    const activeParticipants = participants.filter(p => p.participation_level === 'active' || p.participation_level === 'leader').length;
    const activityCompatibility = activeParticipants / participants.length;
    score += activityCompatibility * 0.5;

    // История участия
    const experiencedParticipants = participants.filter(p => p.participation_level === 'leader' || p.participation_level === 'vip').length;
    const experienceCompatibility = experiencedParticipants / participants.length;
    score += experienceCompatibility * 0.5;
  }

  return Math.min(5, score);
}

function calculateAIEnhancedCompatibility(user, event, participants) {
  let score = calculateAdvancedCompatibility(user, event, participants);
  
  // Имитация AI-улучшений
  if (participants.length > 0) {
    // Анализ паттернов поведения
    const behaviorScore = Math.random() * 0.5;
    score += behaviorScore;

    // Анализ социальных связей
    const socialScore = Math.random() * 0.5;
    score += socialScore;

    // Машинное обучение факторов
    const mlScore = Math.random() * 0.5;
    score += mlScore;
  }

  return Math.min(5, score);
}

function getCompatibilityDetails(user, event, participants, algorithm) {
  const details = {
    factors: {},
    strengths: [],
    areas_for_improvement: []
  };

  // Анализируем факторы совместимости
  if (user.age && participants.length > 0) {
    const avgAge = participants.reduce((sum, p) => sum + (p.User?.age || 0), 0) / participants.length;
    const ageDiff = Math.abs(user.age - avgAge);
    
    details.factors.age = {
      user_age: user.age,
      average_participant_age: Math.round(avgAge),
      difference: ageDiff,
      compatibility: ageDiff <= 5 ? 'high' : ageDiff <= 10 ? 'medium' : 'low'
    };
  }

  if (user.city && participants.length > 0) {
    const sameCity = participants.filter(p => p.User?.city === user.city).length;
    const cityCompatibility = sameCity / participants.length;
    
    details.factors.location = {
      user_city: user.city,
      same_city_participants: sameCity,
      total_participants: participants.length,
      compatibility: cityCompatibility >= 0.5 ? 'high' : cityCompatibility >= 0.2 ? 'medium' : 'low'
    };
  }

  if (user.viptype && participants.length > 0) {
    const sameVipType = participants.filter(p => p.User?.viptype === user.viptype).length;
    const vipCompatibility = sameVipType / participants.length;
    
    details.factors.vip_status = {
      user_vip_type: user.viptype,
      same_vip_type_participants: sameVipType,
      total_participants: participants.length,
      compatibility: vipCompatibility >= 0.5 ? 'high' : vipCompatibility >= 0.2 ? 'medium' : 'low'
    };
  }

  // Определяем сильные стороны
  Object.entries(details.factors).forEach(([factor, data]) => {
    if (data.compatibility === 'high') {
      details.strengths.push(`${factor}_compatibility`);
    }
  });

  // Определяем области для улучшения
  Object.entries(details.factors).forEach(([factor, data]) => {
    if (data.compatibility === 'low') {
      details.areas_for_improvement.push(`${factor}_compatibility`);
    }
  });

  return details;
}

module.exports = router;
