const { Clubs, User, Notifications, EventParticipants } = require('../models');
const { APILogger } = require('../utils/logger');

class ReferralManager {
  constructor() {
    this.logger = new APILogger('REFERRAL_MANAGER');
  }

  /**
   * Генерирует реферальный код для клуба
   * @param {number} clubId - ID клуба
   * @param {string} userId - ID пользователя (владельца клуба)
   * @returns {Promise<string>} - Сгенерированный реферальный код
   */
  async generateReferralCode(clubId, userId) {
    try {
      this.logger.logBusinessLogic(1, 'Генерация реферального кода', {
        club_id: clubId,
        user_id: userId
      });

      // Проверяем права доступа
      const club = await Clubs.findOne({
        where: {
          id: parseInt(clubId),
          owner: userId,
          is_active: true
        }
      });

      if (!club) {
        throw new Error('Клуб не найден или нет доступа');
      }

      // Генерируем новый реферальный код
      const referralCode = await club.generateReferralCode();

      this.logger.logResult('Генерация реферального кода', true, {
        club_id: clubId,
        referral_code: referralCode
      });

      return referralCode;
    } catch (error) {
      this.logger.logError('Ошибка генерации реферального кода', error);
      throw error;
    }
  }

  /**
   * Применяет реферальный код пользователем
   * @param {string} referralCode - Реферальный код
   * @param {string} userId - ID пользователя
   * @returns {Promise<Object>} - Информация о примененном коде
   */
  async useReferralCode(referralCode, userId) {
    try {
      this.logger.logBusinessLogic(1, 'Применение реферального кода', {
        referral_code: referralCode,
        user_id: userId
      });

      // Находим клуб по реферальному коду
      const club = await Clubs.findOne({
        where: {
          referral_code: referralCode.toUpperCase(),
          is_active: true
        }
      });

      if (!club) {
        throw new Error('Неверный реферальный код');
      }

      // Проверяем, не использовал ли пользователь уже этот код
      const existingReferral = await User.findOne({
        where: {
          login: userId,
          referral_source: referralCode
        }
      });

      if (existingReferral) {
        throw new Error('Вы уже использовали этот реферальный код');
      }

      // Обновляем профиль пользователя
      await User.update(
        { referral_source: referralCode },
        { where: { login: userId } }
      );

      // Создаем уведомление владельцу клуба
      await this.createReferralNotification(club, userId, 'referral_used');

      // Создаем уведомление пользователю
      await this.createReferralNotification(club, userId, 'referral_success');

      // Обновляем статистику клуба
      await this.updateClubReferralStats(club.id);

      this.logger.logResult('Применение реферального кода', true, {
        user_id: userId,
        club_id: club.id,
        referral_code: referralCode
      });

      return {
        success: true,
        club: {
          id: club.id,
          name: club.name,
          description: club.description,
          category: club.category,
          rating: club.rating,
          member_count: club.member_count,
          is_premium: club.is_premium
        },
        referral_code: referralCode
      };
    } catch (error) {
      this.logger.logError('Ошибка применения реферального кода', error);
      throw error;
    }
  }

  /**
   * Создает уведомление о реферале
   * @param {Object} club - Объект клуба
   * @param {string} userId - ID пользователя
   * @param {string} type - Тип уведомления
   * @returns {Promise<void>}
   */
  async createReferralNotification(club, userId, type) {
    try {
      const user = await User.findOne({ where: { login: userId } });
      
      let notificationData;
      
      switch (type) {
        case 'referral_used':
          notificationData = {
            user_id: club.owner,
            type: 'referral_used',
            title: 'Реферальный код использован!',
            message: `Пользователь ${user?.name || userId} использовал ваш реферальный код для клуба "${club.name}"`,
            from_user: userId,
            target_id: club.id.toString(),
            target_type: 'club',
            priority: 'normal',
            data: {
              club_id: club.id,
              referral_code: club.referral_code,
              referred_user: userId
            }
          };
          break;
          
        case 'referral_success':
          notificationData = {
            user_id: userId,
            type: 'referral_success',
            title: 'Реферальный код применен!',
            message: `Вы успешно использовали реферальный код для клуба "${club.name}"`,
            from_user: club.owner,
            target_id: club.id.toString(),
            target_type: 'club',
            priority: 'normal',
            data: {
              club_id: club.id,
              referral_code: club.referral_code
            }
          };
          break;
          
        default:
          return;
      }

      await Notifications.createNotification(notificationData);
    } catch (error) {
      this.logger.logWarning('Ошибка создания уведомления о реферале', error);
    }
  }

  /**
   * Обновляет статистику рефералов клуба
   * @param {number} clubId - ID клуба
   * @returns {Promise<void>}
   */
  async updateClubReferralStats(clubId) {
    try {
      const referredUsers = await User.count({
        where: {
          referral_source: {
            [require('sequelize').Op.like]: `%${clubId}%`
          }
        }
      });

      // Можно добавить дополнительную логику обновления статистики
      this.logger.logResult('Обновление статистики рефералов', true, {
        club_id: clubId,
        referred_users_count: referredUsers
      });
    } catch (error) {
      this.logger.logWarning('Ошибка обновления статистики рефералов', error);
    }
  }

  /**
   * Получает статистику рефералов для пользователя
   * @param {string} userId - ID пользователя
   * @returns {Promise<Object>} - Статистика рефералов
   */
  async getUserReferralStats(userId) {
    try {
      this.logger.logBusinessLogic(1, 'Получение статистики рефералов пользователя', {
        user_id: userId
      });

      // Получаем клубы пользователя
      const userClubs = await Clubs.findAll({
        where: {
          owner: userId,
          is_active: true
        },
        attributes: ['id', 'name', 'referral_code', 'member_count']
      });

      // Получаем статистику по каждому клубу
      const referralStats = await Promise.all(
        userClubs.map(async (club) => {
          const referredUsers = await User.count({
            where: {
              referral_source: club.referral_code
            }
          });

          return {
            club_id: club.id,
            club_name: club.name,
            referral_code: club.referral_code,
            total_members: club.member_count,
            referred_users: referredUsers,
            conversion_rate: club.member_count > 0 ? 
              ((referredUsers / club.member_count) * 100).toFixed(2) : 0
          };
        })
      );

      // Общая статистика
      const totalStats = {
        total_clubs: userClubs.length,
        total_referred_users: referralStats.reduce((sum, stat) => sum + stat.referred_users, 0),
        total_members: referralStats.reduce((sum, stat) => sum + stat.total_members, 0),
        average_conversion_rate: referralStats.length > 0 ? 
          (referralStats.reduce((sum, stat) => sum + parseFloat(stat.conversion_rate), 0) / referralStats.length).toFixed(2) : 0
      };

      this.logger.logResult('Получение статистики рефералов', true, {
        user_id: userId,
        clubs_count: userClubs.length,
        total_referred_users: totalStats.total_referred_users
      });

      return {
        club_stats: referralStats,
        total_stats: totalStats
      };
    } catch (error) {
      this.logger.logError('Ошибка получения статистики рефералов', error);
      throw error;
    }
  }

  /**
   * Получает список рефералов конкретного клуба
   * @param {number} clubId - ID клуба
   * @param {string} userId - ID владельца клуба
   * @param {Object} options - Опции пагинации
   * @returns {Promise<Object>} - Список рефералов
   */
  async getClubReferrals(clubId, userId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      this.logger.logBusinessLogic(1, 'Получение рефералов клуба', {
        club_id: clubId,
        user_id: userId,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      // Проверяем права доступа
      const club = await Clubs.findOne({
        where: {
          id: parseInt(clubId),
          owner: userId,
          is_active: true
        }
      });

      if (!club) {
        throw new Error('Нет доступа к этому клубу');
      }

      // Получаем пользователей, использовавших реферальный код
      const referredUsers = await User.findAndCountAll({
        where: {
          referral_source: club.referral_code
        },
        attributes: ['id', 'login', 'name', 'ava', 'city', 'viptype', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      this.logger.logResult('Получение рефералов клуба', true, {
        club_id: clubId,
        referred_users_count: referredUsers.rows.length,
        total_count: referredUsers.count
      });

      return {
        club: {
          id: club.id,
          name: club.name,
          referral_code: club.referral_code
        },
        referred_users: referredUsers.rows.map(user => ({
          id: user.id,
          login: user.login,
          name: user.name,
          avatar: user.ava,
          city: user.city,
          vip_type: user.viptype,
          joined_at: user.created_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: referredUsers.count,
          pages: Math.ceil(referredUsers.count / parseInt(limit))
        }
      };
    } catch (error) {
      this.logger.logError('Ошибка получения рефералов клуба', error);
      throw error;
    }
  }

  /**
   * Анализирует эффективность реферальной системы
   * @param {number} clubId - ID клуба
   * @param {string} userId - ID владельца клуба
   * @param {Object} options - Опции анализа
   * @returns {Promise<Object>} - Анализ эффективности
   */
  async analyzeReferralEffectiveness(clubId, userId, options = {}) {
    try {
      const { period = '30d' } = options;

      this.logger.logBusinessLogic(1, 'Анализ эффективности реферальной системы', {
        club_id: clubId,
        user_id: userId,
        period
      });

      // Проверяем права доступа
      const club = await Clubs.findOne({
        where: {
          id: parseInt(clubId),
          owner: userId,
          is_active: true
        }
      });

      if (!club) {
        throw new Error('Нет доступа к этому клубу');
      }

      // Рассчитываем период
      const now = new Date();
      let startDate;
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Получаем рефералов за период
      const referredUsers = await User.findAll({
        where: {
          referral_source: club.referral_code,
          created_at: {
            [require('sequelize').Op.gte]: startDate
          }
        },
        attributes: ['id', 'created_at', 'city', 'viptype']
      });

      // Получаем участников мероприятий за период
      const eventParticipants = await EventParticipants.findAll({
        where: {
          event_id: {
            [require('sequelize').Op.in]: await this.getClubEventIds(clubId)
          },
          joined_at: {
            [require('sequelize').Op.gte]: startDate
          }
        },
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['referral_source']
          }
        ]
      });

      // Анализируем эффективность
      const analysis = {
        period,
        start_date: startDate,
        end_date: now,
        referral_stats: {
          total_referrals: referredUsers.length,
          referrals_by_city: this.groupByCity(referredUsers),
          referrals_by_vip_type: this.groupByVipType(referredUsers),
          daily_referrals: this.groupByDay(referredUsers, startDate, now)
        },
        participation_stats: {
          total_participants: eventParticipants.length,
          referred_participants: eventParticipants.filter(p => 
            p.User?.referral_source === club.referral_code
          ).length,
          participation_rate: eventParticipants.length > 0 ? 
            (eventParticipants.filter(p => p.User?.referral_source === club.referral_code).length / eventParticipants.length * 100).toFixed(2) : 0
        },
        conversion_metrics: {
          referral_to_participation_rate: referredUsers.length > 0 ? 
            (eventParticipants.filter(p => p.User?.referral_source === club.referral_code).length / referredUsers.length * 100).toFixed(2) : 0,
          overall_conversion_rate: club.member_count > 0 ? 
            (referredUsers.length / club.member_count * 100).toFixed(2) : 0
        }
      };

      this.logger.logResult('Анализ эффективности реферальной системы', true, {
        club_id: clubId,
        total_referrals: referredUsers.length,
        total_participants: eventParticipants.length
      });

      return analysis;
    } catch (error) {
      this.logger.logError('Ошибка анализа эффективности реферальной системы', error);
      throw error;
    }
  }

  /**
   * Получает ID мероприятий клуба
   * @param {number} clubId - ID клуба
   * @returns {Promise<Array>} - Массив ID мероприятий
   */
  async getClubEventIds(clubId) {
    try {
      const events = await require('../models').Events.findAll({
        where: { club_id: clubId },
        attributes: ['id']
      });
      return events.map(event => event.id);
    } catch (error) {
      this.logger.logWarning('Ошибка получения ID мероприятий клуба', error);
      return [];
    }
  }

  /**
   * Группирует пользователей по городам
   * @param {Array} users - Массив пользователей
   * @returns {Object} - Группировка по городам
   */
  groupByCity(users) {
    const grouped = {};
    users.forEach(user => {
      const city = user.city || 'Не указан';
      grouped[city] = (grouped[city] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Группирует пользователей по VIP типу
   * @param {Array} users - Массив пользователей
   * @returns {Object} - Группировка по VIP типу
   */
  groupByVipType(users) {
    const grouped = {};
    users.forEach(user => {
      const vipType = user.viptype || 'FREE';
      grouped[vipType] = (grouped[vipType] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Группирует пользователей по дням
   * @param {Array} users - Массив пользователей
   * @param {Date} startDate - Начальная дата
   * @param {Date} endDate - Конечная дата
   * @returns {Object} - Группировка по дням
   */
  groupByDay(users, startDate, endDate) {
    const grouped = {};
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      grouped[dateKey] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    users.forEach(user => {
      const dateKey = user.created_at.toISOString().split('T')[0];
      if (grouped[dateKey] !== undefined) {
        grouped[dateKey]++;
      }
    });

    return grouped;
  }
}

module.exports = ReferralManager;
