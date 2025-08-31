module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем новые поля для полноценной системы клубов
    
    // Аутентификация
    await queryInterface.addColumn('clubs', 'login', {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true
    });
    
    await queryInterface.addColumn('clubs', 'password', {
      type: Sequelize.STRING(255),
      allowNull: false
    });
    
    // Тип и статус
    await queryInterface.addColumn('clubs', 'type', {
      type: Sequelize.ENUM('public', 'private', 'exclusive'),
      allowNull: false,
      defaultValue: 'public'
    });
    
    await queryInterface.addColumn('clubs', 'is_verified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    
    // Участники
    await queryInterface.addColumn('clubs', 'max_members', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    
    await queryInterface.addColumn('clubs', 'current_members', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });
    
    // Финансы
    await queryInterface.addColumn('clubs', 'balance', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('clubs', 'membership_fee', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    });
    
    // Дополнительная информация
    await queryInterface.addColumn('clubs', 'age_restriction', {
      type: Sequelize.STRING(20),
      allowNull: true
    });
    
    await queryInterface.addColumn('clubs', 'contact_info', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('clubs', 'social_links', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('clubs', 'rules', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('clubs', 'tags', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
    
    // Медиа
    await queryInterface.addColumn('clubs', 'cover_image', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    
    // Верификация
    await queryInterface.addColumn('clubs', 'verification_date', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('clubs', 'verified_by', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
    
    // Удаляем поле owner (клубы больше не принадлежат пользователям)
    await queryInterface.removeColumn('clubs', 'owner');
    
    // Создаем индексы для оптимизации
    await queryInterface.addIndex('clubs', ['login']);
    await queryInterface.addIndex('clubs', ['type']);
    await queryInterface.addIndex('clubs', ['is_verified']);
    await queryInterface.addIndex('clubs', ['balance']);
    await queryInterface.addIndex('clubs', ['is_active']);
  },
  
  down: async (queryInterface, Sequelize) => {
    // Восстанавливаем поле owner
    await queryInterface.addColumn('clubs', 'owner', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
    
    // Удаляем все добавленные поля
    const columns = [
      'login', 'password', 'type', 'is_verified', 'max_members',
      'current_members', 'balance', 'membership_fee', 'age_restriction',
      'contact_info', 'social_links', 'rules', 'tags', 'cover_image',
      'verification_date', 'verified_by'
    ];
    
    for (const column of columns) {
      await queryInterface.removeColumn('clubs', column);
    }
    
    // Удаляем ENUM тип
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_clubs_type";');
    
    // Удаляем индексы
    await queryInterface.removeIndex('clubs', ['login']);
    await queryInterface.removeIndex('clubs', ['type']);
    await queryInterface.removeIndex('clubs', ['is_verified']);
    await queryInterface.removeIndex('clubs', ['balance']);
  }
};
