'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем поля для авторизации клубов
    const columns = [
      {
        name: 'login',
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'Логин клуба для входа'
      },
      {
        name: 'email',
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'Email клуба'
      },
      {
        name: 'password',
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Хешированный пароль клуба'
      },
      {
        name: 'contact_info',
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Контактная информация клуба'
      },
      {
        name: 'type',
        type: Sequelize.ENUM('nightclub', 'restaurant', 'event_space', 'other'),
        allowNull: true,
        defaultValue: 'other',
        comment: 'Тип клуба'
      },
      {
        name: 'email_verified',
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Подтвержден ли email клуба'
      }
    ];

    for (const column of columns) {
      try {
        await queryInterface.addColumn('clubs', column.name, {
          type: column.type,
          allowNull: column.allowNull,
          unique: column.unique,
          defaultValue: column.defaultValue,
          comment: column.comment
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

    // Создаем индексы для новых полей
    try {
      await queryInterface.addIndex('clubs', ['login']);
      console.log('Added index for login column');
    } catch (error) {
      console.log('Index for login already exists, skipping');
    }

    try {
      await queryInterface.addIndex('clubs', ['email']);
      console.log('Added index for email column');
    } catch (error) {
      console.log('Index for email already exists, skipping');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Удаляем добавленные колонки
    const columns = ['login', 'email', 'password', 'contact_info', 'type', 'email_verified'];
    
    for (const column of columns) {
      try {
        await queryInterface.removeColumn('clubs', column);
        console.log(`Removed column ${column} from clubs table`);
      } catch (error) {
        console.log(`Could not remove column ${column}:`, error.message);
      }
    }

    // Удаляем индексы
    try {
      await queryInterface.removeIndex('clubs', ['login']);
      console.log('Removed index for login column');
    } catch (error) {
      console.log('Could not remove index for login:', error.message);
    }

    try {
      await queryInterface.removeIndex('clubs', ['email']);
      console.log('Removed index for email column');
    } catch (error) {
      console.log('Could not remove index for email:', error.message);
    }
  }
};
