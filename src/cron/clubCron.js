const cron = require('node-cron');
const ClubBotService = require('../services/clubBots');
const { ClubEvents, ClubBots } = require('../models');

class ClubCron {
  constructor() {
    this.tasks = [];
  }

  start() {
    console.log('🕐 Запуск cron-задач для клубной системы...');

    // Отправка напоминаний о мероприятиях каждый час
    this.tasks.push(
      cron.schedule('0 * * * *', async () => {
        try {
          console.log('📅 Отправка напоминаний о мероприятиях...');
          const result = await ClubBotService.sendEventReminders();
          if (result.success) {
            console.log('✅ Напоминания отправлены');
          } else {
            console.log('❌ Ошибка отправки напоминаний:', result.message);
          }
        } catch (error) {
          console.error('❌ Ошибка cron-задачи напоминаний:', error);
        }
      }, {
        scheduled: true,
        timezone: 'Europe/Moscow'
      })
    );

    // Автоматические приглашения на новые мероприятия (каждые 6 часов)
    this.tasks.push(
      cron.schedule('0 */6 * * *', async () => {
        try {
          console.log('🤖 Отправка автоматических приглашений...');
          
          // Находим мероприятия, созданные в последние 6 часов
          const sixHoursAgo = new Date();
          sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

          const newEvents = await ClubEvents.findAll({
            where: {
              created_at: {
                [require('sequelize').Op.gte]: sixHoursAgo
              },
              auto_invite_enabled: true
            },
            include: [
              {
                model: ClubBots,
                as: 'club'
              }
            ]
          });

          for (const event of newEvents) {
            try {
              const result = await ClubBotService.sendAutoInvites(event.id);
              if (result.success) {
                console.log(`✅ Авто-приглашения для мероприятия ${event.id}: ${result.invited_count} приглашений`);
              } else {
                console.log(`❌ Ошибка авто-приглашений для мероприятия ${event.id}: ${result.message}`);
              }
            } catch (error) {
              console.error(`❌ Ошибка обработки мероприятия ${event.id}:`, error);
            }
          }
        } catch (error) {
          console.error('❌ Ошибка cron-задачи авто-приглашений:', error);
        }
      }, {
        scheduled: true,
        timezone: 'Europe/Moscow'
      })
    );

    // Обновление статистики клубов (каждый день в 2:00)
    this.tasks.push(
      cron.schedule('0 2 * * *', async () => {
        try {
          console.log('📊 Обновление статистики клубов...');
          
          const clubs = await ClubBots.findAll({
            attributes: ['club_id'],
            group: ['club_id']
          });

          for (const clubBot of clubs) {
            try {
              const result = await ClubBotService.updateClubStats(clubBot.club_id);
              if (result.success) {
                console.log(`✅ Статистика обновлена для клуба ${clubBot.club_id}`);
              } else {
                console.log(`❌ Ошибка обновления статистики для клуба ${clubBot.club_id}: ${result.message}`);
              }
            } catch (error) {
              console.error(`❌ Ошибка обработки клуба ${clubBot.club_id}:`, error);
            }
          }
        } catch (error) {
          console.error('❌ Ошибка cron-задачи обновления статистики:', error);
        }
      }, {
        scheduled: true,
        timezone: 'Europe/Moscow'
      })
    );

    // Генерация рекомендаций для клубов (каждые 3 дня в 3:00)
    this.tasks.push(
      cron.schedule('0 3 */3 * *', async () => {
        try {
          console.log('🎯 Генерация рекомендаций для клубов...');
          
          const clubs = await ClubBots.findAll({
            where: {
              name: 'Аналитика',
              is_active: true
            },
            attributes: ['club_id']
          });

          for (const clubBot of clubs) {
            try {
              const result = await ClubBotService.generateRecommendations(clubBot.club_id);
              if (result.success) {
                console.log(`✅ Рекомендации сгенерированы для клуба ${clubBot.club_id}`);
              } else {
                console.log(`❌ Ошибка генерации рекомендаций для клуба ${clubBot.club_id}: ${result.message}`);
              }
            } catch (error) {
              console.error(`❌ Ошибка обработки клуба ${clubBot.club_id}:`, error);
            }
          }
        } catch (error) {
          console.error('❌ Ошибка cron-задачи генерации рекомендаций:', error);
        }
      }, {
        scheduled: true,
        timezone: 'Europe/Moscow'
      })
    );

    // Очистка старых данных (каждую неделю в воскресенье в 4:00)
    this.tasks.push(
      cron.schedule('0 4 * * 0', async () => {
        try {
          console.log('🧹 Очистка старых данных клубов...');
          
          const result = await ClubBotService.cleanupOldData();
          if (result.success) {
            console.log(`✅ Очистка завершена: удалено ${result.deleted_notifications} уведомлений`);
          } else {
            console.log('❌ Ошибка очистки данных:', result.message);
          }
        } catch (error) {
          console.error('❌ Ошибка cron-задачи очистки данных:', error);
        }
      }, {
        scheduled: true,
        timezone: 'Europe/Moscow'
      })
    );

    // Проверка и деактивация просроченных мероприятий (каждый день в 1:00)
    this.tasks.push(
      cron.schedule('0 1 * * *', async () => {
        try {
          console.log('⏰ Проверка просроченных мероприятий...');
          
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);

          const expiredEvents = await ClubEvents.findAll({
            where: {
              date: {
                [require('sequelize').Op.lt]: yesterday
              }
            }
          });

          console.log(`📅 Найдено ${expiredEvents.length} просроченных мероприятий`);
          
          // Здесь можно добавить логику для обработки просроченных мероприятий
          // Например, отправка отчетов, архивирование и т.д.
          
        } catch (error) {
          console.error('❌ Ошибка cron-задачи проверки мероприятий:', error);
        }
      }, {
        scheduled: true,
        timezone: 'Europe/Moscow'
      })
    );

    console.log('✅ Cron-задачи для клубной системы запущены');
  }

  stop() {
    console.log('🛑 Остановка cron-задач для клубной системы...');
    
    this.tasks.forEach(task => {
      task.stop();
    });
    
    this.tasks = [];
    console.log('✅ Cron-задачи для клубной системы остановлены');
  }

  // Метод для ручного запуска задач (для тестирования)
  async runTask(taskName) {
    try {
      switch (taskName) {
        case 'reminders':
          console.log('📅 Ручной запуск отправки напоминаний...');
          return await ClubBotService.sendEventReminders();
          
        case 'auto-invites':
          console.log('🤖 Ручной запуск авто-приглашений...');
          // Находим все активные мероприятия
          const events = await ClubEvents.findAll({
            where: { auto_invite_enabled: true },
            limit: 5
          });
          
          const results = [];
          for (const event of events) {
            const result = await ClubBotService.sendAutoInvites(event.id);
            results.push({ event_id: event.id, result });
          }
          return results;
          
        case 'stats':
          console.log('📊 Ручной запуск обновления статистики...');
          const clubs = await ClubBots.findAll({
            attributes: ['club_id'],
            group: ['club_id'],
            limit: 3
          });
          
          const statsResults = [];
          for (const clubBot of clubs) {
            const result = await ClubBotService.updateClubStats(clubBot.club_id);
            statsResults.push({ club_id: clubBot.club_id, result });
          }
          return statsResults;
          
        case 'recommendations':
          console.log('🎯 Ручной запуск генерации рекомендаций...');
          const analyticsClubs = await ClubBots.findAll({
            where: { name: 'Аналитика' },
            limit: 3
          });
          
          const recResults = [];
          for (const clubBot of analyticsClubs) {
            const result = await ClubBotService.generateRecommendations(clubBot.club_id);
            recResults.push({ club_id: clubBot.club_id, result });
          }
          return recResults;
          
        case 'cleanup':
          console.log('🧹 Ручной запуск очистки данных...');
          return await ClubBotService.cleanupOldData();
          
        default:
          throw new Error(`Неизвестная задача: ${taskName}`);
      }
    } catch (error) {
      console.error(`❌ Ошибка выполнения задачи ${taskName}:`, error);
      throw error;
    }
  }
}

module.exports = ClubCron;
