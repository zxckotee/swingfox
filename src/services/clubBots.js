const { ClubBots, ClubEvents, EventParticipants, User, Notifications } = require('../models');
const { sequelize } = require('../config/database');

class ClubBotService {
  // Автоматические приглашения на мероприятия
  static async sendAutoInvites(eventId) {
    try {
      const event = await ClubEvents.findByPk(eventId, {
        include: [
          {
            model: ClubBots,
            as: 'club',
            include: [
              {
                model: ClubBots,
                as: 'bots',
                where: { 
                  name: 'Авто-приглашения',
                  is_active: true 
                }
              }
            ]
          }
        ]
      });

      if (!event || !event.auto_invite_enabled) {
        return { success: false, message: 'Авто-приглашения отключены для этого мероприятия' };
      }

      const bot = event.club.bots[0];
      if (!bot) {
        return { success: false, message: 'Бот авто-приглашений не найден' };
      }

      const settings = bot.getSetting('autoInvite', true);
      if (!settings) {
        return { success: false, message: 'Авто-приглашения отключены в настройках' };
      }

      // Получаем подходящих пользователей
      const eligibleUsers = await this.getEligibleUsers(event, bot);
      
      let invitedCount = 0;
      const maxInvites = bot.getSetting('maxInvitesPerEvent', 50);

      for (const user of eligibleUsers.slice(0, maxInvites)) {
        try {
          // Проверяем, не приглашен ли уже пользователь
          const existingInvitation = await EventParticipants.findOne({
            where: { event_id: eventId, user_id: user.id }
          });

          if (existingInvitation) {
            continue;
          }

          // Создаем приглашение
          await EventParticipants.create({
            event_id: eventId,
            user_id: user.id,
            status: 'invited'
          });

          // Отправляем уведомление пользователю
          await Notifications.create({
            user_id: user.id,
            type: 'event_invite',
            title: 'Приглашение на мероприятие',
            message: `Вас приглашают на мероприятие "${event.title}" в клубе "${event.club.name}"`,
            data: { 
              event_id: eventId, 
              club_id: event.club_id,
              event_title: event.title,
              club_name: event.club.name
            }
          });

          invitedCount++;
        } catch (error) {
          console.error(`Ошибка приглашения пользователя ${user.id}:`, error);
        }
      }

      return { 
        success: true, 
        message: `Отправлено ${invitedCount} приглашений`,
        invited_count: invitedCount
      };

    } catch (error) {
      console.error('Auto invite error:', error);
      return { success: false, message: 'Ошибка отправки авто-приглашений' };
    }
  }

  // Получение подходящих пользователей для приглашения
  static async getEligibleUsers(event, bot) {
    const userPreferences = bot.getSetting('userPreferences', ['age', 'location']);
    
    const whereClause = {
      is_active: true
    };

    // Фильтр по возрасту
    if (userPreferences.includes('age')) {
      whereClause.age = {
        [sequelize.Sequelize.Op.between]: [18, 65]
      };
    }

    // Фильтр по местоположению
    if (userPreferences.includes('location') && event.club.location) {
      whereClause.city = {
        [sequelize.Sequelize.Op.iLike]: `%${event.club.location}%`
      };
    }

    // Исключаем пользователей, которые уже участвуют в мероприятиях клуба
    const existingParticipants = await EventParticipants.findAll({
      where: { status: 'confirmed' },
      include: [
        {
          model: ClubEvents,
          where: { club_id: event.club_id }
        }
      ],
      attributes: ['user_id']
    });

    const existingUserIds = existingParticipants.map(p => p.user_id);
    if (existingUserIds.length > 0) {
      whereClause.id = {
        [sequelize.Sequelize.Op.notIn]: existingUserIds
      };
    }

    return await User.findAll({
      where: whereClause,
      attributes: ['id', 'login', 'city'],
      order: sequelize.random(),
      limit: 100
    });
  }

  // Отправка напоминаний о мероприятиях
  static async sendEventReminders() {
    try {
      const now = new Date();
      const reminderHours = [24, 2]; // За 24 часа и за 2 часа
      
      for (const hours of reminderHours) {
        const reminderTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
        
        // Находим мероприятия, которые начинаются через указанное время
        const upcomingEvents = await ClubEvents.findAll({
          where: {
            date: {
              [sequelize.Sequelize.Op.between]: [
                new Date(reminderTime.getTime() - 30 * 60 * 1000), // ±30 минут
                new Date(reminderTime.getTime() + 30 * 60 * 1000)
              ]
            }
          },
          include: [
            {
              model: Clubs,
              as: 'club'
            },
            {
              model: EventParticipants,
              as: 'participants',
              where: { status: 'confirmed' },
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'login', 'name']
                }
              ]
            }
          ]
        });

        for (const event of upcomingEvents) {
          // Проверяем, есть ли активный бот напоминаний
          const reminderBot = await ClubBots.findOne({
            where: {
              club_id: event.club_id,
              name: 'Напоминания',
              is_active: true
            }
          });

          if (!reminderBot) continue;

          const reminderTypes = reminderBot.getSetting('reminderTypes', ['push']);
          
          for (const participant of event.participants) {
            try {
              // Создаем уведомление
              await Notifications.create({
                user_id: participant.user_id,
                type: 'event_reminder',
                title: 'Напоминание о мероприятии',
                message: `Через ${hours} часа(ов) начинается мероприятие "${event.title}" в клубе "${event.club.name}"`,
                data: {
                  event_id: event.id,
                  club_id: event.club_id,
                  event_title: event.title,
                  club_name: event.club.name,
                  reminder_hours: hours
                }
              });
            } catch (error) {
              console.error(`Ошибка отправки напоминания пользователю ${participant.user_id}:`, error);
            }
          }
        }
      }

      return { success: true, message: 'Напоминания отправлены' };
    } catch (error) {
      console.error('Send reminders error:', error);
      return { success: false, message: 'Ошибка отправки напоминаний' };
    }
  }

  // Генерация рекомендаций мероприятий
  static async generateRecommendations(clubId) {
    try {
      const club = await Clubs.findByPk(clubId);
      if (!club) {
        return { success: false, message: 'Клуб не найден' };
      }

      // Анализируем популярные типы мероприятий
      const eventTypeStats = await ClubEvents.findAll({
        where: { club_id: clubId },
        include: [
          {
            model: EventParticipants,
            as: 'participants',
            where: { status: 'confirmed' }
          }
        ],
        attributes: [
          'event_type',
          [sequelize.fn('COUNT', sequelize.col('ClubEvents.id')), 'events_count'],
          [sequelize.fn('COUNT', sequelize.col('participants.id')), 'participants_count']
        ],
        group: ['event_type'],
        order: [[sequelize.fn('COUNT', sequelize.col('participants.id')), 'DESC']],
        limit: 5
      });

      // Анализируем лучшее время для мероприятий
      const timeStats = await ClubEvents.findAll({
        where: { club_id: clubId },
        include: [
          {
            model: EventParticipants,
            as: 'participants',
            where: { status: 'confirmed' }
          }
        ],
        attributes: [
          [sequelize.fn('HOUR', sequelize.col('time')), 'hour'],
          [sequelize.fn('COUNT', sequelize.col('ClubEvents.id')), 'events_count'],
          [sequelize.fn('AVG', sequelize.col('participants.id')), 'avg_participants']
        ],
        group: [sequelize.fn('HOUR', sequelize.col('time'))],
        order: [[sequelize.fn('AVG', sequelize.col('participants.id')), 'DESC']],
        limit: 3
      });

      // Анализируем оптимальную цену
      const priceStats = await ClubEvents.findAll({
        where: { club_id: clubId },
        include: [
          {
            model: EventParticipants,
            as: 'participants',
            where: { status: 'confirmed' }
          }
        ],
        attributes: [
          [sequelize.fn('AVG', sequelize.col('price')), 'avg_price'],
          [sequelize.fn('COUNT', sequelize.col('participants.id')), 'total_participants']
        ],
        group: ['price'],
        order: [[sequelize.fn('COUNT', sequelize.col('participants.id')), 'DESC']],
        limit: 5
      });

      const recommendations = {
        popular_event_types: eventTypeStats.map(stat => ({
          type: stat.event_type,
          events_count: parseInt(stat.dataValues.events_count),
          participants_count: parseInt(stat.dataValues.participants_count)
        })),
        best_times: timeStats.map(stat => ({
          hour: parseInt(stat.dataValues.hour),
          events_count: parseInt(stat.dataValues.events_count),
          avg_participants: parseFloat(stat.dataValues.avg_participants)
        })),
        optimal_prices: priceStats.map(stat => ({
          price: parseFloat(stat.dataValues.avg_price),
          total_participants: parseInt(stat.dataValues.total_participants)
        }))
      };

      return { 
        success: true, 
        recommendations,
        message: 'Рекомендации сгенерированы'
      };

    } catch (error) {
      console.error('Generate recommendations error:', error);
      return { success: false, message: 'Ошибка генерации рекомендаций' };
    }
  }

  // Автоматическое обновление статистики
  static async updateClubStats(clubId) {
    try {
      const club = await Clubs.findByPk(clubId);
      if (!club) {
        return { success: false, message: 'Клуб не найден' };
      }

      // Обновляем счетчики участников для всех мероприятий
      const events = await ClubEvents.findAll({
        where: { club_id: clubId }
      });

      for (const event of events) {
        const confirmedCount = await EventParticipants.count({
          where: { 
            event_id: event.id,
            status: 'confirmed'
          }
        });

        if (event.current_participants !== confirmedCount) {
          event.current_participants = confirmedCount;
          await event.save();
        }
      }

      return { success: true, message: 'Статистика обновлена' };
    } catch (error) {
      console.error('Update club stats error:', error);
      return { success: false, message: 'Ошибка обновления статистики' };
    }
  }

  // Автоматическая очистка старых данных
  static async cleanupOldData() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);


      // Удаляем старые уведомления
      const deletedNotifications = await Notifications.destroy({
        where: {
          created_at: {
            [sequelize.Sequelize.Op.lt]: thirtyDaysAgo
          }
        }
      });

      return { 
        success: true, 
        message: 'Очистка завершена',
        deleted_notifications: deletedNotifications
      };
    } catch (error) {
      console.error('Cleanup old data error:', error);
      return { success: false, message: 'Ошибка очистки данных' };
    }
  }
}

module.exports = ClubBotService;
