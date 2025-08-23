const express = require('express');
const router = express.Router();
const { PhotoComments, User, Notifications } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { APILogger } = require('../utils/logger');

// GET /api/photo-comments/:filename - Получение комментариев к фотографии
router.get('/:filename', authenticateToken, async (req, res) => {
  const logger = new APILogger('PHOTO_COMMENTS');
  
  try {
    logger.logRequest(req, 'GET /photo-comments/:filename');
    
    const { filename } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const currentUser = req.user.login;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    logger.logBusinessLogic(1, 'Получение комментариев к фотографии', {
      current_user: currentUser,
      filename,
      page: parseInt(page),
      limit: parseInt(limit)
    }, req);

    // Получаем комментарии к фотографии
    const commentsData = await PhotoComments.getImageComments(filename, {
      limit: parseInt(limit),
      offset
    });

    // Получаем общее количество комментариев
    const totalCount = await PhotoComments.getCommentCount(filename);

    const responseData = {
      filename,
      comments: commentsData.comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };

    logger.logSuccess(req, 200, {
      filename,
      comments_count: commentsData.comments.length,
      total_count: totalCount
    });
    
    res.json(responseData);

  } catch (error) {
    logger.logError(req, error);
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении комментариев'
    });
  }
});

// POST /api/photo-comments/:filename - Создание комментария к фотографии
router.post('/:filename', authenticateToken, async (req, res) => {
  const logger = new APILogger('PHOTO_COMMENTS');
  
  try {
    logger.logRequest(req, 'POST /photo-comments/:filename');
    
    const { filename } = req.params;
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

    logger.logBusinessLogic(1, 'Создание комментария к фотографии', {
      current_user: currentUser,
      filename,
      comment_length: comment_text.length
    }, req);

    // Создаем комментарий
    const comment = await PhotoComments.createComment(
      currentUser,
      filename,
      comment_text.trim()
    );

    // Получаем данные пользователя для ответа
    const user = await User.findOne({ where: { login: currentUser } });

    logger.logDatabase('INSERT', 'photo_comments', {
      comment_id: comment.id,
      from_user: currentUser,
      filename,
      comment_length: comment_text.length
    }, req);

    // Создаем уведомление владельцу фотографии (если это не его фотография)
    try {
      // TODO: Получить владельца фотографии из User модели
      // Пока что создаем уведомление в общем виде
      await Notifications.createNotification({
        user_id: 'photo_owner', // Нужно получить из User
        type: 'photo_comment',
        title: 'Новый комментарий к фотографии',
        message: `Пользователь ${user?.name || currentUser} оставил комментарий к вашей фотографии`,
        from_user: currentUser,
        priority: 'normal',
        data: {
          filename,
          comment_id: comment.id,
          comment_preview: comment_text.substring(0, 100)
        }
      });
    } catch (notifError) {
      logger.logWarning('Ошибка создания уведомления о комментарии', notifError, req);
    }

    const responseData = {
      success: true,
      comment: {
        id: comment.id,
        text: comment.comment_text,
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

// PUT /api/photo-comments/:id - Редактирование комментария
router.put('/:id', authenticateToken, async (req, res) => {
  const logger = new APILogger('PHOTO_COMMENTS');
  
  try {
    logger.logRequest(req, 'PUT /photo-comments/:id');
    
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

    logger.logBusinessLogic(1, 'Редактирование комментария к фотографии', {
      current_user: currentUser,
      comment_id: id,
      comment_length: comment_text.length
    }, req);

    // Обновляем комментарий
    const updatedComment = await PhotoComments.updateComment(
      parseInt(id),
      currentUser,
      comment_text.trim()
    );

    logger.logDatabase('UPDATE', 'photo_comments', {
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

// DELETE /api/photo-comments/:id - Удаление комментария
router.delete('/:id', authenticateToken, async (req, res) => {
  const logger = new APILogger('PHOTO_COMMENTS');
  
  try {
    logger.logRequest(req, 'DELETE /photo-comments/:id');
    
    const { id } = req.params;
    const currentUser = req.user.login;

    logger.logBusinessLogic(1, 'Удаление комментария к фотографии', {
      current_user: currentUser,
      comment_id: id
    }, req);

    // Удаляем комментарий
    const deletedComment = await PhotoComments.deleteComment(
      parseInt(id),
      currentUser
    );

    logger.logDatabase('DELETE', 'photo_comments', {
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

// GET /api/photo-comments/user/:username - Получение комментариев пользователя
router.get('/user/:username', authenticateToken, async (req, res) => {
  const logger = new APILogger('PHOTO_COMMENTS');
  
  try {
    logger.logRequest(req, 'GET /photo-comments/user/:username');
    
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
    const comments = await PhotoComments.getUserComments(username, {
      limit: parseInt(limit),
      offset
    });

    // Подсчитываем общее количество
    const totalCount = await PhotoComments.count({
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
        image_filename: comment.image_filename,
        is_edited: comment.is_edited,
        edited_at: comment.edited_at,
        created_at: comment.created_at
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
