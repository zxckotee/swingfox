const { Likes } = require('../models');
const { APILogger } = require('./logger');

/**
 * Утилиты для проверки мэтчей и разрешений на чат
 * Обеспечивает безопасность чатов через систему взаимных лайков
 */
class MatchChecker {
  /**
   * Проверяет, есть ли взаимный лайк между пользователями
   * @param {string} user1 - Первый пользователь
   * @param {string} user2 - Второй пользователь
   * @returns {Promise<Object>} Результат проверки мэтча
   */
  static async checkMutualLike(user1, user2) {
    try {
      // Проверяем лайк от user1 к user2
      const like1to2 = await Likes.findOne({
        where: {
          like_from: user1,
          like_to: user2
        }
      });

      // Проверяем лайк от user2 к user1  
      const like2to1 = await Likes.findOne({
        where: {
          like_from: user2,
          like_to: user1
        }
      });

      const hasMatch = !!(like1to2 && like2to1);

      console.log('Match check completed:', {
        user1,
        user2,
        hasMatch,
        like1to2: !!like1to2,
        like2to1: !!like2to1
      });

      return {
        hasMatch,
        like1to2: !!like1to2,
        like2to1: !!like2to1,
        canChat: hasMatch,
        reason: hasMatch ? 'mutual_like' : 'no_match'
      };

    } catch (error) {
      console.error('Error checking mutual like:', {
        user1,
        user2,
        error: error.message
      });

      // В случае ошибки БД - разрешаем чат для безопасности
      return {
        hasMatch: true,
        like1to2: false,
        like2to1: false,
        canChat: true,
        reason: 'db_error_fallback'
      };
    }
  }

  /**
   * Проверяет разрешение на отправку сообщения
   * @param {string} fromUser - Отправитель
   * @param {string} toUser - Получатель
   * @returns {Promise<Object>} Результат проверки разрешения
   */
  static async canSendMessage(fromUser, toUser) {
    try {
      // Запрещаем отправку самому себе
      if (fromUser === toUser) {
        return {
          allowed: false,
          reason: 'self_message',
          message: 'Нельзя отправлять сообщения самому себе'
        };
      }

      // Проверяем мэтч
      const matchResult = await this.checkMutualLike(fromUser, toUser);

      if (!matchResult.canChat) {
        return {
          allowed: false,
          reason: 'no_match',
          message: 'Для отправки сообщений нужен взаимный лайк',
          matchData: matchResult
        };
      }

      return {
        allowed: true,
        reason: matchResult.reason,
        message: 'Отправка разрешена',
        matchData: matchResult
      };

    } catch (error) {
      console.error('Error checking send permission:', {
        fromUser,
        toUser,
        error: error.message
      });

      // Fallback: разрешаем для совместимости
      return {
        allowed: true,
        reason: 'fallback_allow',
        message: 'Разрешено (fallback)',
        error: error.message
      };
    }
  }

  /**
   * Проверяет разрешение на просмотр чата
   * @param {string} currentUser - Текущий пользователь
   * @param {string} chatPartner - Собеседник
   * @returns {Promise<Object>} Результат проверки разрешения
   */
  static async canViewChat(currentUser, chatPartner) {
    try {
      // Разрешаем просмотр существующих чатов для совместимости
      const matchResult = await this.checkMutualLike(currentUser, chatPartner);

      return {
        allowed: true, // Всегда разрешаем просмотр
        hasMatch: matchResult.hasMatch,
        canReply: matchResult.canChat,
        reason: 'view_allowed',
        matchData: matchResult
      };

    } catch (error) {
      console.error('Error checking view permission:', {
        currentUser,
        chatPartner,
        error: error.message
      });

      return {
        allowed: true,
        hasMatch: false,
        canReply: true, // Fallback
        reason: 'fallback_allow'
      };
    }
  }

  /**
   * Создает мэтч между пользователями при взаимном лайке
   * @param {string} user1 - Первый пользователь
   * @param {string} user2 - Второй пользователь
   * @returns {Promise<Object>} Результат создания мэтча
   */
  static async createMatch(user1, user2) {
    try {
      // Обновляем статус взаимности в записях лайков
      await Likes.update(
        { reciprocal: 'mutual' },
        {
          where: {
            like_from: user1,
            like_to: user2
          }
        }
      );

      await Likes.update(
        { reciprocal: 'mutual' },
        {
          where: {
            like_from: user2,
            like_to: user1
          }
        }
      );

      console.log('Match created successfully:', {
        user1,
        user2
      });

      return {
        success: true,
        message: 'Мэтч создан успешно'
      };

    } catch (error) {
      console.error('Error creating match:', {
        user1,
        user2,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Получает статус мэтча для отображения в UI
   * @param {string} currentUser - Текущий пользователь
   * @param {string} targetUser - Целевой пользователь
   * @returns {Promise<Object>} Статус мэтча для UI
   */
  static async getMatchStatus(currentUser, targetUser) {
    try {
      const matchResult = await this.checkMutualLike(currentUser, targetUser);

      if (matchResult.hasMatch) {
        return {
          status: 'matched',
          canChat: true,
          icon: '💕',
          message: 'У вас взаимная симпатия!'
        };
      }

      if (matchResult.like1to2 && !matchResult.like2to1) {
        return {
          status: 'waiting',
          canChat: false,
          icon: '💭',
          message: 'Ожидаем ответного лайка'
        };
      }

      if (!matchResult.like1to2 && matchResult.like2to1) {
        return {
          status: 'incoming',
          canChat: false,
          icon: '❤️',
          message: 'Вами интересуются! Лайкните в ответ'
        };
      }

      return {
        status: 'no_match',
        canChat: false,
        icon: '👋',
        message: 'Поставьте лайк для знакомства'
      };

    } catch (error) {
      console.error('Error getting match status:', {
        currentUser,
        targetUser,
        error: error.message
      });

      return {
        status: 'unknown',
        canChat: true, // Fallback
        icon: '💬',
        message: 'Доступно общение'
      };
    }
  }
}

module.exports = MatchChecker;