const { Subscriptions, User, SubscriptionPlans, Notifications } = require('../models');
const { APILogger } = require('../utils/logger');

class SubscriptionManager {
  constructor() {
    this.logger = new APILogger('SUBSCRIPTION_MANAGER');
  }

  // Основной метод для ежедневной проверки подписок
  async processDailySubscriptions() {
    console.log('🔄 [SUBSCRIPTION_MANAGER] Начинаем ежедневную обработку подписок');
    
    try {
      // 1. Обрабатываем автопродление
      const autoRenewalCount = await this.processAutoRenewals();
      
      // 2. Проверяем истекшие подписки
      const expiredCount = await this.processExpiredSubscriptions();
      
      // 3. Проверяем подписки, которые истекают через 3 дня
      const expiringSoonCount = await this.notifyExpiringSubscriptions();
      
      // 4. Проверяем подписки с недостатком средств
      const lowBalanceCount = await this.checkLowBalanceSubscriptions();
      
      console.log('✅ [SUBSCRIPTION_MANAGER] Ежедневная обработка завершена', {
        auto_renewals: autoRenewalCount,
        expired: expiredCount,
        expiring_soon: expiringSoonCount,
        low_balance: lowBalanceCount
      });

      return {
        auto_renewals: autoRenewalCount,
        expired: expiredCount,
        expiring_soon: expiringSoonCount,
        low_balance: lowBalanceCount
      };

    } catch (error) {
      console.error('❌ [SUBSCRIPTION_MANAGER] Ошибка при ежедневной обработке подписок:', error);
      throw error;
    }
  }

  // Обработка автопродления
  async processAutoRenewals() {
    try {
      return await Subscriptions.processAutoRenewal();
    } catch (error) {
      console.error('❌ [SUBSCRIPTION_MANAGER] Ошибка при обработке автопродления:', error);
      throw error;
    }
  }

  // Обработка истекших подписок
  async processExpiredSubscriptions() {
    try {
      const expiredSubscriptions = await Subscriptions.findAll({
        where: {
          status: 'active',
          end_date: {
            [Subscriptions.sequelize.Sequelize.Op.lt]: new Date()
          }
        },
        include: [{
          model: User,
          as: 'User',
          attributes: ['login', 'viptype']
        }]
      });

      let processedCount = 0;

      for (const subscription of expiredSubscriptions) {
        try {
                  // Если автопродление отключено (пользователь отменил), сбрасываем статус
        if (!subscription.auto_renewal) {
          await subscription.expire();
          
          // Отправляем уведомление
          await Notifications.create({
            user_id: subscription.user_id,
            type: 'subscription_expired',
            title: 'Подписка истекла',
            message: `Ваша подписка ${subscription.subscription_type} истекла.`,
            data: {
              subscription_id: subscription.id,
              subscription_type: subscription.subscription_type
            }
          });
          
          processedCount++;
        } else {
          // Если автопродление включено (по умолчанию), продлеваем подписку
          try {
            await this.autoRenewSubscription(subscription);
            processedCount++;
          } catch (renewError) {
            console.error(`❌ [SUBSCRIPTION_MANAGER] Ошибка при автопродлении подписки ${subscription.id}:`, renewError);
            
            // Если автопродление не удалось, истекаем подписку
            await subscription.expire();
            
            // Отправляем уведомление об ошибке автопродления
            await Notifications.create({
              user_id: subscription.user_id,
              type: 'subscription_auto_renewal_failed',
              title: 'Ошибка автопродления',
              message: `Не удалось автоматически продлить подписку ${subscription.subscription_type}. Подписка истекла.`,
              data: {
                subscription_id: subscription.id,
                subscription_type: subscription.subscription_type
              }
            });
          }
        }
        } catch (error) {
          console.error(`❌ [SUBSCRIPTION_MANAGER] Ошибка при обработке истекшей подписки ${subscription.id}:`, error);
        }
      }

      return processedCount;

    } catch (error) {
      console.error('❌ [SUBSCRIPTION_MANAGER] Ошибка при обработке истекших подписок:', error);
      throw error;
    }
  }

  // Уведомления о скором истечении подписки
  async notifyExpiringSubscriptions() {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const expiringSubscriptions = await Subscriptions.findAll({
        where: {
          status: 'active',
          end_date: {
            [Subscriptions.sequelize.Sequelize.Op.between]: [new Date(), threeDaysFromNow]
          }
        },
        include: [{
          model: User,
          as: 'User',
          attributes: ['login', 'balance']
        }]
      });

      let notifiedCount = 0;

      for (const subscription of expiringSubscriptions) {
        try {
          // Проверяем, не отправляли ли мы уже уведомление
          const existingNotification = await Notifications.findOne({
            where: {
              user_id: subscription.user_id,
              type: 'subscription_expiring_soon',
              data: {
                subscription_id: subscription.subscription_id
              }
            }
          });

          if (!existingNotification) {
            await Notifications.create({
              user_id: subscription.user_id,
              type: 'subscription_expiring_soon',
              title: 'Подписка истекает',
              message: `Ваша подписка ${subscription.subscription_type} истекает через ${this.getDaysRemaining(subscription.end_date)} дней.`,
              data: {
                subscription_id: subscription.id,
                subscription_type: subscription.subscription_type,
                days_remaining: this.getDaysRemaining(subscription.end_date)
              }
            });
            
            notifiedCount++;
          }
        } catch (error) {
          console.error(`❌ [SUBSCRIPTION_MANAGER] Ошибка при уведомлении о скором истечении подписки ${subscription.id}:`, error);
        }
      }

      return notifiedCount;

    } catch (error) {
      console.error('❌ [SUBSCRIPTION_MANAGER] Ошибка при уведомлении о скором истечении подписок:', error);
      throw error;
    }
  }

  // Проверка подписок с недостатком средств
  async checkLowBalanceSubscriptions() {
    try {
      const activeSubscriptions = await Subscriptions.findAll({
        where: {
          status: 'active',
          auto_renewal: true
        },
        include: [{
          model: User,
          as: 'User',
          attributes: ['login', 'balance']
        }]
      });

      let lowBalanceCount = 0;

      for (const subscription of activeSubscriptions) {
        try {
          const plan = await SubscriptionPlans.findOne({
            where: { type: subscription.subscription_type, is_active: true }
          });

          if (plan && subscription.User.balance < plan.monthly_price) {
            // Отправляем уведомление о недостатке средств
            await Notifications.create({
              user_id: subscription.user_id,
              type: 'low_balance_warning',
              title: 'Недостаточно средств',
              message: `Для автопродления подписки ${subscription.subscription_type} необходимо пополнить баланс на ${plan.monthly_price - subscription.User.balance} фоксиков.`,
              data: {
                subscription_id: subscription.id,
                subscription_type: subscription.subscription_type,
                required_amount: plan.monthly_price,
                current_balance: subscription.User.balance,
                deficit: plan.monthly_price - subscription.User.balance
              }
            });
            
            lowBalanceCount++;
          }
        } catch (error) {
          console.error(`❌ [SUBSCRIPTION_MANAGER] Ошибка при проверке баланса для подписки ${subscription.id}:`, error);
        }
      }

      return lowBalanceCount;

    } catch (error) {
      console.error('❌ [SUBSCRIPTION_MANAGER] Ошибка при проверке подписок с недостатком средств:', error);
      throw error;
    }
  }

  // Вспомогательный метод для расчета дней
  getDaysRemaining(endDate) {
    const diff = endDate.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // Метод для автоматического продления подписки
  async autoRenewSubscription(subscription) {
    try {
      console.log(`🔄 [SUBSCRIPTION_MANAGER] Автопродление подписки ${subscription.id} для пользователя ${subscription.user_id}`);

      // Получаем план подписки
      const plan = await sequelize.models.SubscriptionPlans.findOne({
        where: { type: subscription.subscription_type, is_active: true }
      });

      if (!plan) {
        throw new Error(`План ${subscription.subscription_type} не найден`);
      }

      // Получаем пользователя
      const user = await sequelize.models.User.findOne({ 
        where: { login: subscription.user_id } 
      });

      if (!user) {
        throw new Error('Пользователь не найден');
      }

      // Проверяем баланс
      if (user.balance < plan.monthly_price) {
        throw new Error('Недостаточно средств для автопродления');
      }

      // Рассчитываем новую дату окончания (продлеваем на месяц)
      const newEndDate = new Date(subscription.end_date);
      newEndDate.setMonth(newEndDate.getMonth() + 1);

      // Обновляем подписку
      subscription.end_date = newEndDate;
      await subscription.save();

      // Списываем средства
      const newBalance = user.balance - plan.monthly_price;
      await sequelize.models.User.update(
        { balance: newBalance },
        { where: { login: subscription.user_id } }
      );

      // Создаем запись о платеже
      await sequelize.models.SubscriptionPayments.create({
        subscription_id: subscription.id,
        user_id: subscription.user_id,
        amount: plan.monthly_price,
        payment_method: 'balance',
        payment_type: 'auto_renewal',
        status: 'completed'
      });

      // Отправляем уведомление об успешном автопродлении
      await sequelize.models.Notifications.create({
        user_id: subscription.user_id,
        type: 'subscription_auto_renewed',
        title: 'Подписка продлена автоматически',
        message: `Ваша подписка ${subscription.subscription_type} продлена автоматически до ${newEndDate.toLocaleDateString('ru-RU')}. Списано ${plan.monthly_price} фоксиков.`,
        data: {
          subscription_id: subscription.id,
          subscription_type: subscription.subscription_type,
          amount_charged: plan.monthly_price,
          new_balance: newBalance,
          new_expiry_date: newEndDate
        }
      });

      console.log(`✅ [SUBSCRIPTION_MANAGER] Подписка ${subscription.id} успешно продлена автоматически`);
      
      return {
        success: true,
        new_end_date: newEndDate,
        amount_charged: plan.monthly_price,
        new_balance: newBalance
      };

    } catch (error) {
      console.error(`❌ [SUBSCRIPTION_MANAGER] Ошибка при автопродлении подписки ${subscription.id}:`, error);
      throw error;
    }
  }

  // Метод для смены тарифного плана
  async changeSubscriptionPlan(userId, newPlanType, durationMonths = 1) {
    try {
      console.log(`🔄 [SUBSCRIPTION_MANAGER] Смена тарифного плана для пользователя ${userId} на ${newPlanType}`);

      // Получаем текущую активную подписку
      const currentSubscription = await Subscriptions.getUserActiveSubscription(userId);
      
      // Получаем новый план
      const newPlan = await SubscriptionPlans.findOne({
        where: { type: newPlanType, is_active: true }
      });

      if (!newPlan) {
        throw new Error(`План ${newPlanType} не найден`);
      }

      // Рассчитываем стоимость
      let price;
      switch (durationMonths) {
        case 1:
          price = newPlan.monthly_price;
          break;
        case 3:
          price = newPlan.quarterly_price;
          break;
        case 12:
          price = newPlan.yearly_price;
          break;
        default:
          throw new Error('Неподдерживаемая длительность');
      }

      // Получаем пользователя
      const user = await User.findOne({ where: { login: userId } });

      if (user.balance < price) {
        throw new Error('Недостаточно средств для смены тарифного плана');
      }

      // Если есть активная подписка, отменяем её
      if (currentSubscription) {
        currentSubscription.status = 'cancelled';
        currentSubscription.auto_renewal = false; // Отключаем автопродление при отмене
        await currentSubscription.save();
      }

      // Списываем средства
      const newBalance = user.balance - price;
      await User.update(
        { balance: newBalance },
        { where: { login: userId } }
      );

      // Создаем новую подписку
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + durationMonths);

      const newSubscription = await Subscriptions.create({
        user_id: userId,
        subscription_type: newPlanType,
        start_date: startDate,
        end_date: endDate,
        auto_renewal: true, // Автопродление всегда включено по умолчанию
        payment_amount: price,
        payment_method: 'balance',
        status: 'active'
      });

      // Обновляем статус пользователя
      await User.update(
        { viptype: newPlanType },
        { where: { login: userId } }
      );

      // Создаем запись о платеже
      await SubscriptionPayments.create({
        subscription_id: newSubscription.id,
        user_id: userId,
        amount: price,
        payment_method: 'balance',
        payment_type: 'upgrade',
        status: 'completed'
      });

      // Отправляем уведомление
      await Notifications.create({
        user_id: userId,
        type: 'subscription_upgraded',
        title: 'Тарифный план изменен',
        message: `Ваш тарифный план изменен на ${newPlanType}. Списано ${price} фоксиков.`,
        data: {
          subscription_id: newSubscription.id,
          new_plan: newPlanType,
          amount_charged: price,
          new_balance: newBalance,
          expiry_date: endDate
        }
      });

      console.log(`✅ [SUBSCRIPTION_MANAGER] Тарифный план успешно изменен для пользователя ${userId}`);
      
      return {
        success: true,
        new_subscription: newSubscription,
        new_balance: newBalance
      };

    } catch (error) {
      console.error(`❌ [SUBSCRIPTION_MANAGER] Ошибка при смене тарифного плана для пользователя ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = SubscriptionManager;
