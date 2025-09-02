'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем все недостающие колонки в таблицу clubs
    const columns = [
      {
        name: 'location',
        type: Sequelize.STRING(255),
        allowNull: true
      },
      {
        name: 'website',
        type: Sequelize.STRING(255),
        allowNull: true
      }
    ];

    for (const column of columns) {
      try {
        await queryInterface.addColumn('clubs', column.name, {
          type: column.type,
          allowNull: column.allowNull
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
    const columns = ['location', 'website'];
    
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

