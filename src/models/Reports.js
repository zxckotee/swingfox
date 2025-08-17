const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Reports = sequelize.define('Reports', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  from_user: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 50]
    }
  },
  target_user: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 50]
    }
  },
  type: {
    type: DataTypes.ENUM('spam', 'harassment', 'fake_profile', 'inappropriate_content', 'other'),
    allowNull: false,
    defaultValue: 'other'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [10, 1000]
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'resolved', 'dismissed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resolved_by: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'reports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['from_user']
    },
    {
      fields: ['target_user']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    },
    {
      unique: false,
      fields: ['from_user', 'target_user', 'type'],
      name: 'idx_reports_unique_complaint'
    }
  ]
});

// Статические методы
Reports.getTypeLabels = () => ({
  spam: 'Спам',
  harassment: 'Домогательства',
  fake_profile: 'Фальшивый профиль',
  inappropriate_content: 'Неподходящий контент',
  other: 'Другое'
});

Reports.getStatusLabels = () => ({
  pending: 'На рассмотрении',
  resolved: 'Решено',
  dismissed: 'Отклонено'
});

// Методы экземпляра
Reports.prototype.resolve = async function(adminLogin, notes = null) {
  this.status = 'resolved';
  this.resolved_by = adminLogin;
  this.resolved_at = new Date();
  if (notes) {
    this.admin_notes = notes;
  }
  await this.save();
};

Reports.prototype.dismiss = async function(adminLogin, notes = null) {
  this.status = 'dismissed';
  this.resolved_by = adminLogin;
  this.resolved_at = new Date();
  if (notes) {
    this.admin_notes = notes;
  }
  await this.save();
};

Reports.prototype.getTypeLabel = function() {
  const labels = Reports.getTypeLabels();
  return labels[this.type] || this.type;
};

Reports.prototype.getStatusLabel = function() {
  const labels = Reports.getStatusLabels();
  return labels[this.status] || this.status;
};

// Hooks
Reports.beforeCreate(async (report) => {
  // Проверяем, что пользователь не жалуется сам на себя
  if (report.from_user === report.target_user) {
    throw new Error('Нельзя пожаловаться на самого себя');
  }
});

module.exports = Reports;