const express = require('express');
const router = express.Router();
const { ProfileComments, User, Notifications } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { APILogger } = require('../utils/logger');

// GET /api/profile-comments/:username - Получение комментариев к профилю
router.get('/:username', authenticateToken, async (req, res) => {
  const logger = new APILogger('PROFILE_COMMENTS');
  
  try {
    logger.logRequest(req, 'GET /profile-comments/:username');
    
    const { username } = req.params;
    const { page = 1, limit = 20, include_private = false } = req.query;
    const currentUser = req.user.login;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    logger.logBusinessLogic(1, 'Получение комментариев к профилю', {
      current_user: currentUser,
      target_user: username,
      page: parseInt(page),
      limit: parseInt(limit),
      include_private: include_private === 'true'
    }, req);

    // Проверяем существование пользователя
    const targetUser = await User.findOne({ where: { login: username } });
    if (!targetUser) {
      return res.status(404).json({
        error: 'user_not_found',
        message: 'Пользователь не найден'
      });
    }

    // Получаем комментарии к профилю
    const commentsData = await ProfileComments.getProfileComments(username, {
      limit: parseInt(limit),
      offset,
      includePrivate: include_private === 'true',
      currentUser
    });

    // Получаем общее количество комментариев
    const totalCount = await ProfileComments.getCommentCount(username);

    const responseData = {
      username,
      comments: commentsData.comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };

    logger.logSuccess(req, 200, {
      username,
      comments_count: commentsData.comments.length,
      total_count: totalCount
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении комментариев к профилю'
    });
  }
});

// POST /api/profile-comments/:username - Создание комментария к профилю
router.post('/:username', authenticateToken, async (req, res) => {
  const logger = new APILogger('PROFILE_COMMENTS');
  
  try {
    logger.logRequest(req, 'POST /profile-comments/:username');
    
    const { username } = req.params;
    const { comment_text, is_public = true } = req.body;
    const currentUser = req.user.login;

    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({
        error: 'empty_comment',
        message: 'Текст комментария не может быть пустым'
      });
    }

    if (comment_text.length > 1000) {
      return res.status(400).json({
        error: 'comment_too_long',
        message: 'Комментарий слишком длинный (максимум 1000 символов)'
      });
    }

    // Нельзя комментировать свой профиль
    if (currentUser === username) {
      return res.status(400).json({
        error: 'self_comment',
        message: 'Нельзя оставлять комментарии к своему профилю'
      });
    }

    logger.logBusinessLogic(1, 'Создание комментария к профилю', {
      current_user: currentUser,
      target_user: username,
      comment_length: comment_text.length,
      is_public
    }, req);

    // Создаем комментарий
    const comment = await ProfileComments.createComment(
      currentUser,
      username,
      comment_text.trim(),
      is_public
    );

    // Получаем данные пользователя для ответа
    const user = await User.findOne({ where: { login: currentUser } });

    logger.logDatabase('INSERT', 'profile_comments', {
      comment_id: comment.id,
      from_user: currentUser,
      to_user: username,
      comment_length: comment_text.length,
      is_public
    }, req);

    // Создаем уведомление владельцу профиля
    try {
      await Notifications.createNotification({
        user_id: username,
        type: 'profile_comment',
        title: 'Новый комментарий к профилю',
        message: `Пользователь ${user?.name || currentUser} оставил комментарий к вашему профилю`,
        from_user: currentUser,
        priority: 'normal',
        data: {
          comment_id: comment.id,
          comment_preview: comment_text.substring(0, 100),
          is_public
        }
      });
    } catch (notifError) {
      logger.logWarning('Ошибка создания уведомления о комментарии к профилю', notifError, req);
    }

    const responseData = {
      success: true,
      comment: {
        id: comment.id,
        text: comment.comment_text,
        is_public: comment.is_public,
        created_at: comment.created_at,
        user: {
          login: currentUser,
          name: user?.name,
          avatar: user?.ava,
          vip_type: user?.viptype
        }
      },
      message: 'Комментарий добавлен'
    };

    logger.logSuccess(req, 201, responseData);
    res.status(201).json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при создании комментария'
    });
  }
});

// PUT /api/profile-comments/:id - Редактирование комментария к профилю
router.put('/:id', authenticateToken, async (req, res) => {
  const logger = new APILogger('PROFILE_COMMENTS');
  
  try {
    logger.logRequest(req, 'PUT /profile-comments/:id');
    
    const { id } = req.params;
    const { comment_text } = req.body;
    const currentUser = req.user.login;

    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({
        error: 'empty_comment',
        message: 'Текст комментария не может быть пустым'
      });
    }

    if (comment_text.length > 1000) {
      return res.status(400).json({
        error: 'comment_too_long',
        message: 'Комментарий слишком длинный (максимум 1000 символов)'
      });
    }

    logger.logBusinessLogic(1, 'Редактирование комментария к профилю', {
      current_user: currentUser,
      comment_id: id,
      comment_length: comment_text.length
    }, req);

    // Обновляем комментарий
    const updatedComment = await ProfileComments.updateComment(
      parseInt(id),
      currentUser,
      comment_text.trim()
    );

    logger.logDatabase('UPDATE', 'profile_comments', {
      comment_id: id,
      from_user: currentUser,
      new_length: comment_text.length
    }, req);

    const responseData = {
      success: true,
      comment: {
        id: updatedComment.id,
        text: updatedComment.comment_text,
        is_edited: updatedComment.is_edited,
        edited_at: updatedComment.edited_at,
        created_at: updatedComment.created_at
      },
      message: 'Комментарий обновлен'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    
    if (error.message.includes('не найден')) {
      return res.status(404).json({
        error: 'comment_not_found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при обновлении комментария'
    });
  }
});

// DELETE /api/profile-comments/:id - Удаление комментария к профилю
router.delete('/:id', authenticateToken, async (req, res) => {
  const logger = new APILogger('PROFILE_COMMENTS');
  
  try {
    logger.logRequest(req, 'DELETE /profile-comments/:id');
    
    const { id } = req.params;
    const currentUser = req.user.login;

    logger.logBusinessLogic(1, 'Удаление комментария к профилю', {
      current_user: currentUser,
      comment_id: id
    }, req);

    // Удаляем комментарий
    const deletedComment = await ProfileComments.deleteComment(
      parseInt(id),
      currentUser
    );

    logger.logDatabase('DELETE', 'profile_comments', {
      comment_id: id,
      from_user: currentUser
    }, req);

    const responseData = {
      success: true,
      message: 'Комментарий удален'
    };

    logger.logSuccess(req, 200, responseData);
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    
    if (error.message.includes('не найден')) {
      return res.status(404).json({
        error: 'comment_not_found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при удалении комментария'
    });
  }
});

// GET /api/profile-comments/user/:username - Получение комментариев пользователя
router.get('/user/:username', authenticateToken, async (req, res) => {
  const logger = new APILogger('PROFILE_COMMENTS');
  
  try {
    logger.logRequest(req, 'GET /profile-comments/user/:username');
    
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const currentUser = req.user.login;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    logger.logBusinessLogic(1, 'Получение комментариев пользователя', {
      current_user: currentUser,
      target_user: username,
      page: parseInt(page),
      limit: parseInt(limit)
    }, req);

    // Получаем комментарии пользователя
    const comments = await ProfileComments.getUserComments(username, {
      limit: parseInt(limit),
      offset
    });

    // Подсчитываем общее количество
    const totalCount = await ProfileComments.count({
      where: {
        from_user: username,
        is_deleted: false
      }
    });

    const responseData = {
      username,
      comments: comments.map(comment => ({
        id: comment.id,
        text: comment.comment_text,
        to_user: comment.to_user,
        is_public: comment.is_public,
        is_edited: comment.is_edited,
        edited_at: comment.edited_at,
        created_at: comment.created_at,
        recipient: comment.recipient ? {
          login: comment.recipient.login,
          name: comment.recipient.name,
          avatar: comment.recipient.ava
        } : null
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
      comments_count: comments.length,
      total_count: totalCount
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении комментариев пользователя'
    });
  }
});

module.exports = router;
