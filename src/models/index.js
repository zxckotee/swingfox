const { sequelize } = require('../config/database');
const User = require('./User');
const Chat = require('./Chat');
const Likes = require('./Likes');
const Ads = require('./Ads');
const Reports = require('./Reports');
const Events = require('./Events');
const Geo = require('./Geo');
const Gifts = require('./Gifts');
const ImageLikes = require('./ImageLikes');
const Rating = require('./Rating');
const Status = require('./Status');
const Notifications = require('./Notifications');
const Clubs = require('./Clubs');
const ClubApplications = require('./ClubApplications');
const Subscriptions = require('./Subscriptions');
const SubscriptionPlans = require('./SubscriptionPlans');
const SubscriptionPayments = require('./SubscriptionPayments');
const PhotoLike = require('./PhotoLike');
const ProfileVisit = require('./ProfileVisit');
const PhotoComments = require('./PhotoComments');
const ProfileComments = require('./ProfileComments');
const Reactions = require('./Reactions');
const EventParticipants = require('./EventParticipants');

// Определение ассоциаций между моделями

// User ассоциации
User.hasMany(Chat, { 
  foreignKey: 'by_user', 
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
  foreignKey: 'like_from', 
  sourceKey: 'login',
  as: 'GivenLikes',
  onDelete: 'CASCADE'
});

User.hasMany(Likes, { 
  foreignKey: 'like_to', 
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
  foreignKey: 'by_user', 
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
  foreignKey: 'like_from', 
  targetKey: 'login',
  as: 'LikerUser'
});

Likes.belongsTo(User, { 
  foreignKey: 'like_to', 
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

// Инициализация новых моделей
const GiftsModel = Gifts(sequelize);
const ImageLikesModel = ImageLikes(sequelize);
const RatingModel = Rating(sequelize);
const StatusModel = Status(sequelize);
const NotificationsModel = Notifications(sequelize);
const ClubsModel = Clubs(sequelize);
const ClubApplicationsModel = ClubApplications(sequelize);
const SubscriptionsModel = Subscriptions(sequelize);
const SubscriptionPlansModel = SubscriptionPlans(sequelize);
const SubscriptionPaymentsModel = SubscriptionPayments(sequelize);
const PhotoLikeModel = PhotoLike(sequelize);
const ProfileVisitModel = ProfileVisit(sequelize);
const PhotoCommentsModel = PhotoComments(sequelize);
const ProfileCommentsModel = ProfileComments(sequelize);
const ReactionsModel = Reactions(sequelize);
// Эти модели уже определены как готовые модели, не нужно вызывать как функции
const EventParticipantsModel = EventParticipants;
const EventsModel = Events;
const AdsModel = Ads;

// Ассоциации для новых моделей
if (GiftsModel.associate) GiftsModel.associate({ User });
if (ImageLikesModel.associate) ImageLikesModel.associate({ User });
if (RatingModel.associate) RatingModel.associate({ User });
if (StatusModel.associate) StatusModel.associate({ User });
if (NotificationsModel.associate) NotificationsModel.associate({ User });
if (ClubsModel.associate) ClubsModel.associate({ User, ClubApplications: ClubApplicationsModel, Events: EventsModel, EventParticipants: EventParticipantsModel });
if (ClubApplicationsModel.associate) ClubApplicationsModel.associate({ User, Clubs: ClubsModel });
if (EventsModel.associate) EventsModel.associate({ User, Clubs: ClubsModel, EventParticipants: EventParticipantsModel, Ads: AdsModel });
if (EventParticipantsModel.associate) EventParticipantsModel.associate({ Events: EventsModel, User, Clubs: ClubsModel });
if (AdsModel.associate) AdsModel.associate({ Events: EventsModel });
if (SubscriptionsModel.associate) SubscriptionsModel.associate({ User, SubscriptionPlans: SubscriptionPlansModel });
if (SubscriptionPlansModel.associate) SubscriptionPlansModel.associate({ User });
if (SubscriptionPaymentsModel.associate) SubscriptionPaymentsModel.associate({ User, Subscriptions: SubscriptionsModel });
if (PhotoLikeModel.associate) PhotoLikeModel.associate({ User });
if (ProfileVisitModel.associate) ProfileVisitModel.associate({ User });
if (PhotoCommentsModel.associate) PhotoCommentsModel.associate({ User });
if (ProfileCommentsModel.associate) ProfileCommentsModel.associate({ User });
if (ReactionsModel.associate) ReactionsModel.associate({ User });

module.exports = {
  sequelize,
  User,
  Chat,
  Likes,
  Ads: AdsModel,
  Reports,
  Events: EventsModel,
  Geo,
  Gifts: GiftsModel,
  ImageLikes: ImageLikesModel,
  Rating: RatingModel,
  Status: StatusModel,
  Notifications: NotificationsModel,
  Clubs: ClubsModel,
  ClubApplications: ClubApplicationsModel,
  Subscriptions: SubscriptionsModel,
  SubscriptionPlans: SubscriptionPlansModel,
  SubscriptionPayments: SubscriptionPaymentsModel,
  PhotoLike: PhotoLikeModel,
  ProfileVisit: ProfileVisitModel,
  PhotoComments: PhotoCommentsModel,
  ProfileComments: ProfileCommentsModel,
  Reactions: ReactionsModel,
  EventParticipants: EventParticipantsModel
};