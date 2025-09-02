'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Создаем тестовые клубы
    const clubs = [
      {
        id: 1,
        name: 'Ночной клуб "Элит"',
        login: 'elite_club',
        email: 'elite@example.com',
        password: await bcrypt.hash('password123', 10),
        description: 'Премиальный ночной клуб в центре города с лучшей музыкой и атмосферой',
        location: 'Москва, ул. Тверская, 15',
        contact_info: 'Телефон: +7 (495) 123-45-67\nEmail: info@elite-club.ru',
        website: 'https://elite-club.ru',
        social_media: JSON.stringify({
          instagram: '@elite_club',
          facebook: 'eliteclub',
          vk: 'elite_club'
        }),
        is_active: true,
        type: 'nightclub',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        name: 'Ресторан "Вкус"',
        login: 'vkus_restaurant',
        email: 'vkus@example.com',
        password: await bcrypt.hash('password123', 10),
        description: 'Уютный ресторан с авторской кухней и отличным обслуживанием',
        location: 'Санкт-Петербург, Невский пр., 25',
        contact_info: 'Телефон: +7 (812) 987-65-43\nEmail: info@vkus-rest.ru',
        website: 'https://vkus-rest.ru',
        social_media: JSON.stringify({
          instagram: '@vkus_restaurant',
          facebook: 'vkusrestaurant'
        }),
        is_active: true,
        type: 'restaurant',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        name: 'Event Space "Пространство"',
        login: 'prostranstvo_events',
        email: 'events@prostranstvo.com',
        password: await bcrypt.hash('password123', 10),
        description: 'Современное пространство для проведения мероприятий любого масштаба',
        location: 'Екатеринбург, ул. Ленина, 10',
        contact_info: 'Телефон: +7 (343) 555-12-34\nEmail: info@prostranstvo.ru',
        website: 'https://prostranstvo.ru',
        social_media: JSON.stringify({
          instagram: '@prostranstvo_events',
          vk: 'prostranstvo_events'
        }),
        is_active: true,
        type: 'event_space',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('clubs', clubs, {});

    // Создаем тестовые мероприятия
    const events = [
      {
        id: 1,
        club_id: 1,
        title: 'Вечеринка "Ночь в стиле 80-х"',
        description: 'Погрузитесь в атмосферу легендарных 80-х! Лучшие хиты эпохи, костюмы и танцы до утра.',
        date: '2024-02-15',
        time: '22:00:00',
        location: 'Ночной клуб "Элит"',
        max_participants: 150,
        current_participants: 0,
        price: 2000.00,
        event_type: 'party',
        is_premium: true,
        auto_invite_enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        club_id: 1,
        title: 'DJ Night с лучшими диджеями',
        description: 'Ночь электронной музыки с приглашенными диджеями. Только лучшие треки!',
        date: '2024-02-20',
        time: '23:00:00',
        location: 'Ночной клуб "Элит"',
        max_participants: 200,
        current_participants: 0,
        price: 1500.00,
        event_type: 'party',
        is_premium: false,
        auto_invite_enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        club_id: 2,
        title: 'Ужин с шеф-поваром',
        description: 'Эксклюзивный ужин с шеф-поваром ресторана. Дегустация новых блюд и вина.',
        date: '2024-02-18',
        time: '19:00:00',
        location: 'Ресторан "Вкус"',
        max_participants: 30,
        current_participants: 0,
        price: 5000.00,
        event_type: 'dinner',
        is_premium: true,
        auto_invite_enabled: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 4,
        club_id: 3,
        title: 'Бизнес-встреча "Стартапы 2024"',
        description: 'Встреча предпринимателей и инвесторов. Презентации проектов и нетворкинг.',
        date: '2024-02-25',
        time: '18:00:00',
        location: 'Event Space "Пространство"',
        max_participants: 100,
        current_participants: 0,
        price: 3000.00,
        event_type: 'meeting',
        is_premium: false,
        auto_invite_enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 5,
        club_id: 3,
        title: 'Выставка современного искусства',
        description: 'Открытие выставки современных художников. Живая музыка и фуршет.',
        date: '2024-03-01',
        time: '19:00:00',
        location: 'Event Space "Пространство"',
        max_participants: 80,
        current_participants: 0,
        price: 1000.00,
        event_type: 'other',
        is_premium: false,
        auto_invite_enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('club_events', events, {});

    // Создаем тестовые объявления клубов
    const ads = [
      {
        id: 1001,
        title: 'Вечеринка в стиле 80-х - Ночной клуб "Элит"',
        description: 'Приглашаем на незабываемую вечеринку в стиле 80-х! Лучшие хиты эпохи, костюмы и танцы до утра. Вход строго в костюмах 80-х!',
        author: 'elite_club',
        type: 'Вечеринки',
        country: 'Россия',
        city: 'Москва',
        price: 2000.00,
        contact_info: 'Телефон: +7 (495) 123-45-67\nEmail: info@elite-club.ru',
        image: null,
        status: 'approved',
        approved_by: 'admin',
        approved_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        views_count: 45,
        is_featured: true,
        club_id: 1,
        is_club_ad: true,
        club_contact_info: 'Телефон: +7 (495) 123-45-67\nEmail: info@elite-club.ru',
        viral_share_enabled: true,
        referral_bonus: 200.00,
        social_proof_count: 12,
        event_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 1002,
        title: 'Ужин с шеф-поваром - Ресторан "Вкус"',
        description: 'Эксклюзивный ужин с шеф-поваром ресторана "Вкус". Дегустация новых блюд, вина и общение с профессионалом.',
        author: 'vkus_restaurant',
        type: 'Встречи',
        country: 'Россия',
        city: 'Санкт-Петербург',
        price: 5000.00,
        contact_info: 'Телефон: +7 (812) 987-65-43\nEmail: info@vkus-rest.ru',
        image: null,
        status: 'approved',
        approved_by: 'admin',
        approved_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        views_count: 23,
        is_featured: false,
        club_id: 2,
        is_club_ad: true,
        club_contact_info: 'Телефон: +7 (812) 987-65-43\nEmail: info@vkus-rest.ru',
        viral_share_enabled: true,
        referral_bonus: 500.00,
        social_proof_count: 5,
        event_id: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 1003,
        title: 'Бизнес-встреча "Стартапы 2024" - Event Space "Пространство"',
        description: 'Встреча предпринимателей и инвесторов. Презентации проектов, нетворкинг и новые возможности для бизнеса.',
        author: 'prostranstvo_events',
        type: 'Мероприятия',
        country: 'Россия',
        city: 'Екатеринбург',
        price: 3000.00,
        contact_info: 'Телефон: +7 (343) 555-12-34\nEmail: info@prostranstvo.ru',
        image: null,
        status: 'approved',
        approved_by: 'admin',
        approved_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        views_count: 67,
        is_featured: true,
        club_id: 3,
        is_club_ad: true,
        club_contact_info: 'Телефон: +7 (343) 555-12-34\nEmail: info@prostranstvo.ru',
        viral_share_enabled: true,
        referral_bonus: 300.00,
        social_proof_count: 18,
        event_id: 4,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('ads', ads, {});

    console.log('✅ Тестовые данные клубов созданы');
  },

  down: async (queryInterface, Sequelize) => {
    // Удаляем тестовые данные в обратном порядке
    await queryInterface.bulkDelete('ads', { is_club_ad: true }, {});
    await queryInterface.bulkDelete('club_events', null, {});
    await queryInterface.bulkDelete('clubs', null, {});
    
    console.log('✅ Тестовые данные клубов удалены');
  }
};
