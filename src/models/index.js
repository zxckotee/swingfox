const { sequelize } = require('../config/database');
const User = require('./User');
const Chat = require('./Chat');
const Likes = require('./Likes');
const Ads = require('./Ads');
const Reports = require('./Reports');
const Events = require('./Events');
const Geo = require('./Geo');

// Определение ассоциаций между моделями

// User ассоциации
User.hasMany(Chat, { 
  foreignKey: 'from_user', 
  sourceKey: 'login',
  as: 'SentMessages',
  onDelete: 'CASCADE'
});

User.hasMany(Chat, { 
  foreignKey: 'to_user', 
  sourceKey: 'login',
  as: 'ReceivedMessages',
  onDelete: 'CASCADE'
});

User.hasMany(Likes, { 
  foreignKey: 'from_user', 
  sourceKey: 'login',
  as: 'GivenLikes',
  onDelete: 'CASCADE'
});

User.hasMany(Likes, { 
  foreignKey: 'target_user', 
  sourceKey: 'login',
  as: 'ReceivedLikes',
  onDelete: 'CASCADE'
});

User.hasMany(Ads, { 
  foreignKey: 'author', 
  sourceKey: 'login',
  as: 'Advertisements',
  onDelete: 'CASCADE'
});

User.hasMany(Reports, { 
  foreignKey: 'from_user', 
  sourceKey: 'login',
  as: 'ReportsMade',
  onDelete: 'CASCADE'
});

User.hasMany(Reports, { 
  foreignKey: 'target_user', 
  sourceKey: 'login',
  as: 'ReportsReceived',
  onDelete: 'CASCADE'
});

User.hasMany(Reports, { 
  foreignKey: 'resolved_by', 
  sourceKey: 'login',
  as: 'ReportsResolved',
  onDelete: 'SET NULL'
});

User.hasMany(Events, { 
  foreignKey: 'organizer', 
  sourceKey: 'login',
  as: 'OrganizedEvents',
  onDelete: 'CASCADE'
});

User.hasMany(Events, { 
  foreignKey: 'approved_by', 
  sourceKey: 'login',
  as: 'ApprovedEvents',
  onDelete: 'SET NULL'
});

// Chat ассоциации
Chat.belongsTo(User, { 
  foreignKey: 'from_user', 
  targetKey: 'login',
  as: 'FromUser'
});

Chat.belongsTo(User, { 
  foreignKey: 'to_user', 
  targetKey: 'login',
  as: 'ToUser'
});

// Likes ассоциации
Likes.belongsTo(User, { 
  foreignKey: 'from_user', 
  targetKey: 'login',
  as: 'LikerUser'
});

Likes.belongsTo(User, { 
  foreignKey: 'target_user', 
  targetKey: 'login',
  as: 'LikedUser'
});

// Ads ассоциации
Ads.belongsTo(User, { 
  foreignKey: 'author', 
  targetKey: 'login',
  as: 'AuthorUser'
});

// Reports ассоциации
Reports.belongsTo(User, { 
  foreignKey: 'from_user', 
  targetKey: 'login',
  as: 'ReporterUser'
});

Reports.belongsTo(User, { 
  foreignKey: 'target_user', 
  targetKey: 'login',
  as: 'ReportedUser'
});

Reports.belongsTo(User, { 
  foreignKey: 'resolved_by', 
  targetKey: 'login',
  as: 'ResolverUser'
});

// Events ассоциации
Events.belongsTo(User, { 
  foreignKey: 'organizer', 
  targetKey: 'login',
  as: 'OrganizerUser'
});

Events.belongsTo(User, { 
  foreignKey: 'approved_by', 
  targetKey: 'login',
  as: 'ApproverUser'
});

module.exports = {
  sequelize,
  User,
  Chat,
  Likes,
  Ads,
  Reports,
  Events,
  Geo
};