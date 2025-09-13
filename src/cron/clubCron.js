const cron = require('node-cron');
const { ClubEvents } = require('../models');

class ClubCron {
  constructor() {
    this.tasks = [];
  }

  start() {
    console.log('🕐 Запуск cron-задач для клубной системы...');

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
}

module.exports = ClubCron;