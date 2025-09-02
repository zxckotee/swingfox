'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем поля для клубов в таблицу ads
    await queryInterface.addColumn('ads', 'club_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'clubs',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('ads', 'is_club_ad', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('ads', 'club_contact_info', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('ads', 'viral_share_enabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });

    await queryInterface.addColumn('ads', 'referral_bonus', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    });

    await queryInterface.addColumn('ads', 'social_proof_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('ads', 'event_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'club_events',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Добавляем индексы
    await queryInterface.addIndex('ads', ['club_id']);
    await queryInterface.addIndex('ads', ['is_club_ad']);
    await queryInterface.addIndex('ads', ['event_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Удаляем добавленные поля
    await queryInterface.removeColumn('ads', 'club_id');
    await queryInterface.removeColumn('ads', 'is_club_ad');
    await queryInterface.removeColumn('ads', 'club_contact_info');
    await queryInterface.removeColumn('ads', 'viral_share_enabled');
    await queryInterface.removeColumn('ads', 'referral_bonus');
    await queryInterface.removeColumn('ads', 'social_proof_count');
    await queryInterface.removeColumn('ads', 'event_id');
  }
};
