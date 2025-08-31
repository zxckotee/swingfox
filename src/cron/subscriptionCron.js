const cron = require('node-cron');
const SubscriptionManager = require('../services/SubscriptionManager');
const { APILogger } = require('../utils/logger');

class SubscriptionCron {
  constructor() {
    this.logger = new APILogger('SUBSCRIPTION_CRON');
    this.subscriptionManager = new SubscriptionManager();
  }

  // Запуск ежедневной задачи в 00:00
  startDailyTask() {
    cron.schedule('0 0 * * *', async () => {
      console.log('🕐 [SUBSCRIPTION_CRON] Запуск ежедневной задачи обработки подписок');
      
      try {
        const result = await this.subscriptionManager.processDailySubscriptions();
        console.log('✅ [SUBSCRIPTION_CRON] Ежедневная задача завершена успешно', result);
      } catch (error) {
        console.error('❌ [SUBSCRIPTION_CRON] Ошибка при выполнении ежедневной задачи:', error);
      }
    }, {
      scheduled: true,
      timezone: "Europe/Moscow"
    });

    console.log('✅ [SUBSCRIPTION_CRON] Ежедневная задача обработки подписок запланирована на 00:00');
  }

  // Запуск задачи каждые 6 часов для проверки критических ситуаций
  startCriticalCheckTask() {
    cron.schedule('0 */6 * * *', async () => {
      console.log('🔍 [SUBSCRIPTION_CRON] Запуск критической проверки подписок');
      
      try {
        // Проверяем подписки с недостатком средств
        await this.subscriptionManager.checkLowBalanceSubscriptions();
        
        // Проверяем подписки, которые истекают в течение дня
        await this.subscriptionManager.notifyExpiringSubscriptions();
        
        console.log('✅ [SUBSCRIPTION_CRON] Критическая проверка завершена');
      } catch (error) {
        console.error('❌ [SUBSCRIPTION_CRON] Ошибка при критической проверке:', error);
      }
    }, {
      scheduled: true,
      timezone: "Europe/Moscow"
    });

    console.log('✅ [SUBSCRIPTION_CRON] Критическая проверка подписок запланирована каждые 6 часов');
  }

  // Запуск всех задач
  start() {
    this.startDailyTask();
    this.startCriticalCheckTask();
    console.log('✅ [SUBSCRIPTION_CRON] Все cron-задачи для подписок запущены');
  }

  // Остановка всех задач
  stop() {
    cron.getTasks().forEach(task => task.stop());
    console.log('✅ [SUBSCRIPTION_CRON] Все cron-задачи для подписок остановлены');
  }
}

module.exports = SubscriptionCron;
