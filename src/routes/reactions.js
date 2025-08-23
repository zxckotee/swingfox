const express = require('express');
const router = express.Router();
const { Reactions, User, Notifications } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { APILogger } = require('../utils/logger');

// GET /api/reactions/:object_type/:object_id - Получение реакций на объект
router.get('/:object_type/:object_id', authenticateToken, async (req, res) => {
  const logger = new APILogger('REACTIONS');
  
  try {
    logger.logRequest(req, 'GET /reactions/:object_type/:object_id');
    
    const { object_type, object_id } = req.params;
    const currentUser = req.user.login;

    logger.logBusinessLogic(1, 'Получение реакций на объект', {
      current_user: currentUser,
      object_type,
      object_id
    }, req);

    // Получаем реакции на объект
    const reactionsData = await Reactions.getObjectReactions(object_type, object_id);
    
    // Получаем реакцию текущего пользователя
    const userReaction = await Reactions.getUserReaction(currentUser, object_type, object_id);

    const responseData = {
      object_type,
      object_id,
      reactions: reactionsData,
      user_reaction: userReaction ? {
        type: userReaction.reaction_type,
        value: userReaction.value
      } : null
    };

    logger.logSuccess(req, 200, {
      object_type,
      object_id,
      total_reactions: reactionsData.total,
      user_has_reaction: !!userReaction
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении реакций'
    });
  }
});

// POST /api/reactions/:object_type/:object_id - Установка реакции на объект
router.post('/:object_type/:object_id', authenticateToken, async (req, res) => {
  const logger = new APILogger('REACTIONS');
  
  try {
    logger.logRequest(req, 'POST /reactions/:object_type/:object_id');
    
    const { object_type, object_id } = req.params;
    const { reaction_type, value = 1 } = req.body;
    const currentUser = req.user.login;

    if (!reaction_type || !['like', 'love', 'laugh', 'wow', 'sad', 'angry'].includes(reaction_type)) {
      return res.status(400).json({
        error: 'invalid_reaction_type',
        message: 'Неверный тип реакции'
      });
    }

    if (![-1, 0, 1].includes(value)) {
      return res.status(400).json({
        error: 'invalid_value',
        message: 'Значение реакции должно быть -1, 0 или 1'
      });
    }

    logger.logBusinessLogic(1, 'Установка реакции на объект', {
      current_user: currentUser,
      object_type,
      object_id,
      reaction_type,
      value
    }, req);

    // Устанавливаем реакцию
    const result = await Reactions.setReaction(
      currentUser,
      object_type,
      object_id,
      reaction_type,
      value
    );

    logger.logDatabase(result.action.toUpperCase(), 'reactions', {
      from_user: currentUser,
      object_type,
      object_id,
      reaction_type,
      value
    }, req);

    // Получаем обновленные данные реакций
    const updatedReactions = await Reactions.getObjectReactions(object_type, object_id);

    const responseData = {
      success: true,
      action: result.action,
      reaction: {
        type: reaction_type,
        value,
        object_type,
        object_id
      },
      updated_reactions: updatedReactions,
      message: result.action === 'created' ? 'Реакция добавлена' : 'Реакция обновлена'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при установке реакции'
    });
  }
});

// DELETE /api/reactions/:object_type/:object_id - Удаление реакции с объекта
router.delete('/:object_type/:object_id', authenticateToken, async (req, res) => {
  const logger = new APILogger('REACTIONS');
  
  try {
    logger.logRequest(req, 'DELETE /reactions/:object_type/:object_id');
    
    const { object_type, object_id } = req.params;
    const currentUser = req.user.login;

    logger.logBusinessLogic(1, 'Удаление реакции с объекта', {
      current_user: currentUser,
      object_type,
      object_id
    }, req);

    // Удаляем реакцию
    const result = await Reactions.removeReaction(currentUser, object_type, object_id);

    if (result.action === 'not_found') {
      return res.status(404).json({
        error: 'reaction_not_found',
        message: 'Реакция не найдена'
      });
    }

    logger.logDatabase('DELETE', 'reactions', {
      from_user: currentUser,
      object_type,
      object_id
    }, req);

    // Получаем обновленные данные реакций
    const updatedReactions = await Reactions.getObjectReactions(object_type, object_id);

    const responseData = {
      success: true,
      action: result.action,
      updated_reactions: updatedReactions,
      message: 'Реакция удалена'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при удалении реакции'
    });
  }
});

// GET /api/reactions/user/:username - Получение реакций пользователя
router.get('/user/:username', authenticateToken, async (req, res) => {
  const logger = new APILogger('REACTIONS');
  
  try {
    logger.logRequest(req, 'GET /reactions/user/:username');
    
    const { username } = req.params;
    const { page = 1, limit = 20, object_type = null } = req.query;
    const currentUser = req.user.login;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Проверяем права доступа (только свои реакции или публичные)
    if (currentUser !== username) {
      return res.status(403).json({
        error: 'access_denied',
        message: 'У вас нет прав для просмотра реакций этого пользователя'
      });
    }

    logger.logBusinessLogic(1, 'Получение реакций пользователя', {
      current_user: currentUser,
      target_user: username,
      page: parseInt(page),
      limit: parseInt(limit),
      object_type
    }, req);

    // Получаем реакции пользователя
    const reactions = await Reactions.getUserReactions(username, {
      limit: parseInt(limit),
      offset,
      objectType: object_type
    });

    // Подсчитываем общее количество
    const where = { from_user: username };
    if (object_type) {
      where.object_type = object_type;
    }
    
    const totalCount = await Reactions.count({ where });

    const responseData = {
      username,
      reactions: reactions.map(reaction => ({
        id: reaction.id,
        object_type: reaction.object_type,
        object_id: reaction.object_id,
        reaction_type: reaction.reaction_type,
        value: reaction.value,
        created_at: reaction.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };

    logger.logSuccess(req, 200, {
      username,
      reactions_count: reactions.length,
      total_count: totalCount
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении реакций пользователя'
    });
  }
});

// GET /api/reactions/stats/:object_type/:object_id - Получение статистики реакций
router.get('/stats/:object_type/:object_id', authenticateToken, async (req, res) => {
  const logger = new APILogger('REACTIONS');
  
  try {
    logger.logRequest(req, 'GET /reactions/stats/:object_type/:object_id');
    
    const { object_type, object_id } = req.params;
    const currentUser = req.user.login;

    logger.logBusinessLogic(1, 'Получение статистики реакций', {
      current_user: currentUser,
      object_type,
      object_id
    }, req);

    // Получаем статистику реакций
    const stats = await Reactions.getReactionStats(object_type, object_id);

    const responseData = {
      object_type,
      object_id,
      stats
    };

    logger.logSuccess(req, 200, {
      object_type,
      object_id,
      total_reactions: stats.total
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении статистики реакций'
    });
  }
});

module.exports = router;
