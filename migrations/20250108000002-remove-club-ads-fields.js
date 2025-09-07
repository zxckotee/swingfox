'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Удаляем поля связанные с клубными объявлениями из таблицы ads
    await queryInterface.removeColumn('ads', 'club_id');
    await queryInterface.removeColumn('ads', 'is_club_ad');
    await queryInterface.removeColumn('ads', 'club_contact_info');
    await queryInterface.removeColumn('ads', 'event_id');
    
    // Удаляем индексы связанные с клубными объявлениями
    await queryInterface.removeIndex('ads', 'idx_ads_club_id');
    await queryInterface.removeIndex('ads', 'idx_ads_is_club_ad');
    await queryInterface.removeIndex('ads', 'idx_ads_event_id');
  },

  async down(queryInterface, Sequelize) {
    // Восстанавливаем поля (если нужно будет откатить)
    await queryInterface.addColumn('ads', 'club_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'clubs',
        key: 'id'
      }
    });

    await queryInterface.addColumn('ads', 'is_club_ad', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('ads', 'club_contact_info', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('ads', 'event_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'club_events',
        key: 'id'
      }
    });

    // Восстанавливаем индексы
    await queryInterface.addIndex('ads', ['club_id'], {
      name: 'idx_ads_club_id'
    });

    await queryInterface.addIndex('ads', ['is_club_ad'], {
      name: 'idx_ads_is_club_ad'
    });

    await queryInterface.addIndex('ads', ['event_id'], {
      name: 'idx_ads_event_id'
    });
  }
};
