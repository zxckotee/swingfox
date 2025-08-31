module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Создаем таблицу участников мероприятий
    await queryInterface.createTable('event_participants', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      user_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'users',
          key: 'login'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      club_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clubs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      registration_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      
      payment_status: {
        type: Sequelize.ENUM('pending', 'paid', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      
      amount_paid: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Сумма оплаты'
      },
      
      payment_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Дата оплаты'
      },
      
      status: {
        type: Sequelize.ENUM('registered', 'attended', 'cancelled', 'no_show'),
        allowNull: false,
        defaultValue: 'registered'
      },
      
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Заметки организатора'
      },
      
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
    
    // Создаем индексы для оптимизации
    await queryInterface.addIndex('event_participants', ['event_id']);
    await queryInterface.addIndex('event_participants', ['user_id']);
    await queryInterface.addIndex('event_participants', ['club_id']);
    await queryInterface.addIndex('event_participants', ['payment_status']);
    await queryInterface.addIndex('event_participants', ['status']);
    
    // Уникальный индекс для предотвращения дублирования регистраций
    await queryInterface.addIndex('event_participants', ['event_id', 'user_id'], {
      unique: true,
      name: 'event_participants_unique'
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    // Удаляем таблицу
    await queryInterface.dropTable('event_participants');
  }
};
