'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Удаляем таблицу заявок
    await queryInterface.dropTable('club_applications');
    
    // Удаляем ENUM тип
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS application_status CASCADE;');
  },

  async down(queryInterface, Sequelize) {
    // Восстанавливаем таблицу (если понадобится)
    await queryInterface.createTable('club_applications', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      club_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'clubs',
          key: 'id'
        }
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  }
};
