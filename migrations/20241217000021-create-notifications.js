'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Пользователь, которому отправлено уведомление'
      },
      type: {
        type: Sequelize.ENUM(
          'like',          // Лайк профиля
          'superlike',     // Суперлайк
          'match',         // Взаимный лайк (совпадение)
          'message',       // Новое сообщение
          'gift',          // Подарок
          'profile_visit', // Посещение профиля
          'image_like',    // Лайк изображения
          'rating',        // Оценка профиля
          'event_invite',  // Приглашение на мероприятие
          'event_update',  // Обновление мероприятия
          'system',        // Системное уведомление
          'warning',       // Предупреждение
          'ban',           // Блокировка
          'unban',         // Разблокировка
          'premium',       // Изменение статуса премиум
          'club_invite',   // Приглашение в клуб
          'club_request'   // Заявка на вступление в клуб
        ),
        allowNull: false,
        comment: 'Тип уведомления'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Заголовок уведомления'
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Текст уведомления'
      },
      from_user: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Пользователь, от которого пришло уведомление (если применимо)'
      },
      target_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'ID цели уведомления (профиль, сообщение, событие и т.д.)'
      },
      target_type: {
        type: Sequelize.ENUM('user', 'message', 'event', 'image', 'club', 'gift', 'rating'),
        allowNull: true,
        comment: 'Тип цели уведомления'
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Дополнительные данные уведомления в JSON формате'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Прочитано ли уведомление'
      },
      is_sent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Отправлено ли уведомление (для push/email)'
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
        defaultValue: 'normal',
        comment: 'Приоритет уведомления'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Дата истечения актуальности уведомления'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
        comment: 'Дата создания'
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
        comment: 'Дата последнего обновления'
      }
    });

    // Создание индексов для производительности
    await queryInterface.addIndex('notifications', ['user_id'], {
      name: 'idx_notifications_user_id'
    });

    await queryInterface.addIndex('notifications', ['user_id', 'is_read'], {
      name: 'idx_notifications_user_read'
    });

    await queryInterface.addIndex('notifications', ['type'], {
      name: 'idx_notifications_type'
    });

    await queryInterface.addIndex('notifications', ['from_user'], {
      name: 'idx_notifications_from_user'
    });

    await queryInterface.addIndex('notifications', ['created_at'], {
      name: 'idx_notifications_created_at'
    });

    await queryInterface.addIndex('notifications', ['priority'], {
      name: 'idx_notifications_priority'
    });

    await queryInterface.addIndex('notifications', ['expires_at'], {
      name: 'idx_notifications_expires_at'
    });

    // Создание внешних ключей
    await queryInterface.addConstraint('notifications', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_notifications_user_id',
      references: {
        table: 'users',
        field: 'login'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('notifications', {
      fields: ['from_user'],
      type: 'foreign key',
      name: 'fk_notifications_from_user',
      references: {
        table: 'users',
        field: 'login'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Удаление внешних ключей
    await queryInterface.removeConstraint('notifications', 'fk_notifications_from_user');
    await queryInterface.removeConstraint('notifications', 'fk_notifications_user_id');

    // Удаление индексов
    await queryInterface.removeIndex('notifications', 'idx_notifications_expires_at');
    await queryInterface.removeIndex('notifications', 'idx_notifications_priority');
    await queryInterface.removeIndex('notifications', 'idx_notifications_created_at');
    await queryInterface.removeIndex('notifications', 'idx_notifications_from_user');
    await queryInterface.removeIndex('notifications', 'idx_notifications_type');
    await queryInterface.removeIndex('notifications', 'idx_notifications_user_read');
    await queryInterface.removeIndex('notifications', 'idx_notifications_user_id');

    // Удаление таблицы
    await queryInterface.dropTable('notifications');
  }
};