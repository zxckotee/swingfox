'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const defaultPlans = [
      {
        name: 'Бесплатный',
        type: 'FREE',
        monthly_price: 0,
        quarterly_price: 0,
        yearly_price: 0,
        features: JSON.stringify({
          superlikes_daily: 1,
          attention_weekly: 0,
          hide_online: false,
          private_photos: false,
          see_likes: false,
          carousel: false,
          see_visits: false,
          unlimited_likes: false,
          priority_support: false,
          exclusive_events: false
        }),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'VIP',
        type: 'VIP',
        monthly_price: 299,
        quarterly_price: 799,
        yearly_price: 2999,
        features: JSON.stringify({
          superlikes_daily: 5,
          attention_weekly: 1,
          hide_online: true,
          private_photos: true,
          see_likes: true,
          carousel: true,
          see_visits: true,
          unlimited_likes: true,
          priority_support: false,
          exclusive_events: false
        }),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'PREMIUM',
        type: 'PREMIUM',
        monthly_price: 499,
        quarterly_price: 1399,
        yearly_price: 4999,
        features: JSON.stringify({
          superlikes_daily: 10,
          attention_weekly: 3,
          hide_online: true,
          private_photos: true,
          see_likes: true,
          carousel: true,
          see_visits: true,
          unlimited_likes: true,
          priority_support: true,
          exclusive_events: true,
          custom_badges: true,
          boost_profile: true
        }),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('subscription_plans', defaultPlans);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('subscription_plans', null, {});
  }
};
