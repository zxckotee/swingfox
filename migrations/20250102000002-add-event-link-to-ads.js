module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем поле для связи объявлений с мероприятиями
    await queryInterface.addColumn('ads', 'event_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'events',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    
    // Создаем индекс для оптимизации запросов
    await queryInterface.addIndex('ads', ['event_id']);
  },
  
  down: async (queryInterface, Sequelize) => {
    // Удаляем индекс
    await queryInterface.removeIndex('ads', ['event_id']);
    
    // Удаляем поле
    await queryInterface.removeColumn('ads', 'event_id');
  }
};
