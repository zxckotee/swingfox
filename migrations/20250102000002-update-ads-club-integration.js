'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем связь с клубами и мероприятиями
    await queryInterface.addColumn('ads', 'club_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'ID клуба (если объявление от клуба)',
      references: {
        model: 'clubs',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('ads', 'event_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'ID мероприятия (если это объявление о мероприятии)',
      references: {
        model: 'events',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('ads', 'is_club_ad', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Флаг объявления клуба'
    });

    await queryInterface.addColumn('ads', 'club_contact_info', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Контактная информация клуба'
    });

    // НОВЫЕ ПОЛЯ ДЛЯ ВИРУСНОГО МАРКЕТИНГА
    await queryInterface.addColumn('ads', 'viral_share_enabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Можно ли делиться объявлением в социальных сетях'
    });

    await queryInterface.addColumn('ads', 'referral_bonus', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Бонус за приглашение друга (в баллах или валюте)'
    });

    await queryInterface.addColumn('ads', 'social_proof_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Количество репостов/лайков для социального доказательства'
    });

    // Создаем индексы для оптимизации
    await queryInterface.addIndex('ads', ['club_id']);
    await queryInterface.addIndex('ads', ['event_id']);
    await queryInterface.addIndex('ads', ['is_club_ad']);
    await queryInterface.addIndex('ads', ['club_id', 'is_club_ad']);
    await queryInterface.addIndex('ads', ['viral_share_enabled']);
    await queryInterface.addIndex('ads', ['referral_bonus']);
    await queryInterface.addIndex('ads', ['social_proof_count']);
  },

  async down(queryInterface, Sequelize) {
    // Удаляем добавленные поля
    await queryInterface.removeColumn('ads', 'club_id');
    await queryInterface.removeColumn('ads', 'event_id');
    await queryInterface.removeColumn('ads', 'is_club_ad');
    await queryInterface.removeColumn('ads', 'club_contact_info');
    await queryInterface.removeColumn('ads', 'viral_share_enabled');
    await queryInterface.removeColumn('ads', 'referral_bonus');
    await queryInterface.removeColumn('ads', 'social_proof_count');
  }
};
