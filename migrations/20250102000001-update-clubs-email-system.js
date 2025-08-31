'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем email поля в таблицу clubs
    await queryInterface.addColumn('clubs', 'email', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Email клуба для подтверждения'
    });

    await queryInterface.addColumn('clubs', 'email_verified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Подтвержден ли email клуба'
    });

    await queryInterface.addColumn('clubs', 'email_verification_token', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Токен для подтверждения email'
    });

    await queryInterface.addColumn('clubs', 'email_verification_expires', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Срок действия токена подтверждения'
    });

    await queryInterface.addColumn('clubs', 'verification_sent_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Когда отправлено подтверждение email'
    });

    // НОВЫЕ МАРКЕТИНГОВЫЕ ПОЛЯ
    await queryInterface.addColumn('clubs', 'category', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Категория клуба (вечеринки, ужины, активность)'
    });

    await queryInterface.addColumn('clubs', 'rating', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Рейтинг клуба'
    });

    await queryInterface.addColumn('clubs', 'member_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Количество участников клуба'
    });

    await queryInterface.addColumn('clubs', 'is_premium', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Является ли клуб премиум'
    });

    await queryInterface.addColumn('clubs', 'referral_code', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Реферальный код клуба'
    });

    // Создаем индексы для оптимизации
    await queryInterface.addIndex('clubs', ['email']);
    await queryInterface.addIndex('clubs', ['email_verified']);
    await queryInterface.addIndex('clubs', ['email_verification_token']);
    await queryInterface.addIndex('clubs', ['category']);
    await queryInterface.addIndex('clubs', ['rating']);
    await queryInterface.addIndex('clubs', ['is_premium']);
    await queryInterface.addIndex('clubs', ['referral_code']);
  },

  async down(queryInterface, Sequelize) {
    // Удаляем добавленные поля
    await queryInterface.removeColumn('clubs', 'email');
    await queryInterface.removeColumn('clubs', 'email_verified');
    await queryInterface.removeColumn('clubs', 'email_verification_token');
    await queryInterface.removeColumn('clubs', 'email_verification_expires');
    await queryInterface.removeColumn('clubs', 'verification_sent_at');
    await queryInterface.removeColumn('clubs', 'category');
    await queryInterface.removeColumn('clubs', 'rating');
    await queryInterface.removeColumn('clubs', 'member_count');
    await queryInterface.removeColumn('clubs', 'is_premium');
    await queryInterface.removeColumn('clubs', 'referral_code');
  }
};
