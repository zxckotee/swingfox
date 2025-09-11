'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем недостающие колонки в таблицу ads
    await queryInterface.addColumn('ads', 'viral_share_enabled', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true
    });

    await queryInterface.addColumn('ads', 'referral_bonus', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    });

    await queryInterface.addColumn('ads', 'social_proof_count', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });

    await queryInterface.addColumn('ads', 'club_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'clubs',
        key: 'id'
      }
    });

    await queryInterface.addColumn('ads', 'event_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'club_events',
        key: 'id'
      }
    });

    // Добавляем индексы для новых колонок
    await queryInterface.addIndex('ads', ['club_id'], {
      name: 'idx_ads_club_id'
    });

    await queryInterface.addIndex('ads', ['event_id'], {
      name: 'idx_ads_event_id'
    });

    // Обновляем существующие записи, устанавливая значения по умолчанию
    await queryInterface.sequelize.query(`
      UPDATE ads 
      SET viral_share_enabled = true,
          referral_bonus = 0,
          social_proof_count = 0
      WHERE viral_share_enabled IS NULL
    `);
  },

  async down(queryInterface, Sequelize) {
    // Удаляем индексы
    await queryInterface.removeIndex('ads', 'idx_ads_club_id');
    await queryInterface.removeIndex('ads', 'idx_ads_event_id');

    // Удаляем колонки
    await queryInterface.removeColumn('ads', 'viral_share_enabled');
    await queryInterface.removeColumn('ads', 'referral_bonus');
    await queryInterface.removeColumn('ads', 'social_proof_count');
    await queryInterface.removeColumn('ads', 'club_id');
    await queryInterface.removeColumn('ads', 'event_id');
  }
};
