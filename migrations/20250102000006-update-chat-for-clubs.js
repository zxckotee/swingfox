'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Добавляем поля для клубов в таблицу chat
    await queryInterface.addColumn('chat', 'club_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'clubs',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('chat', 'is_club_chat', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('chat', 'chat_type', {
      type: Sequelize.ENUM('user', 'club', 'event'),
      defaultValue: 'user'
    });

    // Добавляем индексы
    await queryInterface.addIndex('chat', ['club_id']);
    await queryInterface.addIndex('chat', ['is_club_chat']);
    await queryInterface.addIndex('chat', ['chat_type']);
  },

  down: async (queryInterface, Sequelize) => {
    // Удаляем добавленные поля
    await queryInterface.removeColumn('chat', 'club_id');
    await queryInterface.removeColumn('chat', 'is_club_chat');
    await queryInterface.removeColumn('chat', 'chat_type');
  }
};
