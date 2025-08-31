module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем поле club_id в таблицу events
    await queryInterface.addColumn('events', 'club_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'clubs',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    
    // Создаем индекс для оптимизации запросов
    await queryInterface.addIndex('events', ['club_id']);
  },
  
  down: async (queryInterface, Sequelize) => {
    // Удаляем индекс
    await queryInterface.removeIndex('events', ['club_id']);
    
    // Удаляем поле
    await queryInterface.removeColumn('events', 'club_id');
  }
};
