'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Проверяем существование колонок перед удалением
    const tableDescription = await queryInterface.describeTable('ads');
    
    // Удаляем поля связанные с клубными объявлениями из таблицы ads, если они существуют
    if (tableDescription.club_id) {
      await queryInterface.removeColumn('ads', 'club_id');
    }
    if (tableDescription.is_club_ad) {
      await queryInterface.removeColumn('ads', 'is_club_ad');
    }
    if (tableDescription.club_contact_info) {
      await queryInterface.removeColumn('ads', 'club_contact_info');
    }
    if (tableDescription.event_id) {
      await queryInterface.removeColumn('ads', 'event_id');
    }
    
    // Удаляем индексы связанные с клубными объявлениями (игнорируем ошибки если индексы не существуют)
    try {
      await queryInterface.removeIndex('ads', 'idx_ads_club_id');
    } catch (e) {
      // Индекс не существует, игнорируем
    }
    try {
      await queryInterface.removeIndex('ads', 'idx_ads_is_club_ad');
    } catch (e) {
      // Индекс не существует, игнорируем
    }
    try {
      await queryInterface.removeIndex('ads', 'idx_ads_event_id');
    } catch (e) {
      // Индекс не существует, игнорируем
    }
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
