const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Gifts = sequelize.define('Gifts', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false
    },
    owner: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Получатель подарка'
    },
    from_user: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Отправитель подарка'
    },
    gift_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Тип подарка (1-10 или стоимость)'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Сообщение к подарку'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    is_valid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Действительность подарка'
    }
  }, {
    tableName: 'gifts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Ассоциации
  Gifts.associate = (models) => {
    // Подарок принадлежит получателю
    Gifts.belongsTo(models.User, {
      foreignKey: 'owner',
      targetKey: 'login',
      as: 'recipient'
    });

    // Подарок отправлен пользователем
    Gifts.belongsTo(models.User, {
      foreignKey: 'from_user',
      targetKey: 'login',
      as: 'sender'
    });
  };

  // Методы модели
  Gifts.prototype.getCost = function() {
    const costs = {
      '1': 50,   // Роза
      '2': 100,  // Букет
      '3': 150,  // Шампанское
      '4': 200,  // Подарок
      '5': 300,  // Ужин
      '6': 500,  // Путешествие
      '7': 750,  // Украшение
      '8': 1000, // VIP статус
      '9': 1500, // Premium статус
      '10': 2000 // Эксклюзивный подарок
    };
    
    return costs[this.gift_type] || parseInt(this.gift_type);
  };

  Gifts.prototype.getTypeName = function() {
    const types = {
      '1': 'Роза',
      '2': 'Букет цветов',
      '3': 'Шампанское',
      '4': 'Подарок',
      '5': 'Романтический ужин',
      '6': 'Путешествие',
      '7': 'Украшение',
      '8': 'VIP статус на месяц',
      '9': 'Premium статус на месяц',
      '10': 'Эксклюзивный подарок'
    };
    
    return types[this.gift_type] || `Подарок (${this.gift_type})`;
  };

  // Статические методы
  Gifts.getGiftTypes = () => {
    return [
      { id: '1', name: 'Роза', cost: 50, icon: '🌹' },
      { id: '2', name: 'Букет цветов', cost: 100, icon: '💐' },
      { id: '3', name: 'Шампанское', cost: 150, icon: '🍾' },
      { id: '4', name: 'Подарок', cost: 200, icon: '🎁' },
      { id: '5', name: 'Романтический ужин', cost: 300, icon: '🍽️' },
      { id: '6', name: 'Путешествие', cost: 500, icon: '✈️' },
      { id: '7', name: 'Украшение', cost: 750, icon: '💎' },
      { id: '8', name: 'VIP статус на месяц', cost: 1000, icon: '👑' },
      { id: '9', name: 'Premium статус на месяц', cost: 1500, icon: '⭐' },
      { id: '10', name: 'Эксклюзивный подарок', cost: 2000, icon: '🏆' }
    ];
  };

  Gifts.getUserGifts = async (login, limit = 10) => {
    return await Gifts.findAll({
      where: { owner: login },
      include: [{
        model: sequelize.models.User,
        as: 'sender',
        attributes: ['login', 'ava']
      }],
      order: [['created_at', 'DESC']],
      limit
    });
  };

  return Gifts;
};