'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем поля настроек в таблицу clubs
    const columns = [
      {
        name: 'is_public',
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      {
        name: 'show_members',
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      {
        name: 'email_notifications',
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      {
        name: 'event_reminders',
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      {
        name: 'member_activity',
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    ];

    for (const column of columns) {
      try {
        await queryInterface.addColumn('clubs', column.name, {
          type: column.type,
          allowNull: column.allowNull,
          defaultValue: column.defaultValue
        });
        console.log(`Added column ${column.name} to clubs table`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`Column ${column.name} already exists, skipping`);
        } else {
          throw error;
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Удаляем добавленные колонки
    const columns = ['is_public', 'show_members', 'email_notifications', 'event_reminders', 'member_activity'];
    
    for (const column of columns) {
      try {
        await queryInterface.removeColumn('clubs', column);
        console.log(`Removed column ${column} from clubs table`);
      } catch (error) {
        console.log(`Could not remove column ${column}:`, error.message);
      }
    }
  }
};
