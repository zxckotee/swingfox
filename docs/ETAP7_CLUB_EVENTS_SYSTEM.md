# ЭТАП 7: Система клубных мероприятий и специализированных объявлений

## 🎯 Обзор

Реализация комплексной системы для клубов, которая позволяет создавать официальные мероприятия с возможностью приема платежей, управления участниками и интеграции с чатом. Система разграничивает обычных пользователей и клубы, предоставляя клубам дополнительные возможности для монетизации и организации событий.

## 🏗️ Архитектурные принципы

- **🔐 Роли и права доступа**: Четкое разделение между обычными пользователями и владельцами клубов
- **💳 Безопасная обработка платежей**: Холдинг средств до завершения мероприятия
- **🔄 Обратная совместимость**: Сохранение всей существующей функциональности объявлений
- **📱 Seamless UX**: Интеграция с существующими чатами и профилями
- **🛡️ Защита от злоупотреблений**: Валидация прав и ограничения

---

## 📋 ЭТАП 7.1: Ограничения доступа к типу "Мероприятия"

### 🎯 Цель
Реализовать систему ограничений, при которой только владельцы активных клубов могут создавать объявления типа "Мероприятия"

### 🔧 Backend изменения

#### 1. Модификация `src/routes/ads.js`

**Добавление импорта и валидации:**
```javascript
const { User, Ads, Clubs } = require('../models');

// Функция проверки прав на создание мероприятий
const validateEventCreationRights = async (userLogin, adType) => {
  if (adType === 'Мероприятия') {
    const userClub = await Clubs.findOne({
      where: {
        owner: userLogin,
        is_active: true
      }
    });
    
    if (!userClub) {
      throw new Error('Только владельцы активных клубов могут создавать мероприятия');
    }
    
    return userClub;
  }
  return null;
};
```

**Интеграция в POST /api/ads/create:**
```javascript
// После получения пользователя
const user = await User.findOne({ where: { login: userLogin } });

// Проверка прав на мероприятия
try {
  const club = await validateEventCreationRights(userLogin, type);
  console.log('Club validation passed:', club?.name || 'not a club');
} catch (error) {
  return res.status(403).json({
    error: 'club_required',
    message: error.message
  });
}
```

**Интеграция в PUT /api/ads/:id:**
```javascript
// После проверки прав на редактирование
if (ad.status !== 'pending') { /* ... */ }

// Проверка при смене типа на "Мероприятия"
if (type === 'Мероприятия' && ad.type !== 'Мероприятия') {
  try {
    await validateEventCreationRights(userLogin, type);
  } catch (error) {
    return res.status(403).json({
      error: 'club_required',
      message: error.message
    });
  }
}
```

### 🎨 Frontend изменения

#### 1. Условное отображение типа "Мероприятия" в `client/src/pages/Ads.js`

**Проверка прав пользователя:**
```javascript
// Добавить новый API метод
export const clubAPI = {
  checkClubOwnership: async () => {
    const response = await apiClient.get('/api/clubs/my/ownership');
    return response.data;
  }
};

// В компоненте Ads
const { data: clubOwnership } = useQuery(
  ['club-ownership'],
  clubAPI.checkClubOwnership,
  {
    retry: false,
    onError: () => {
      // Пользователь не владеет клубом
    }
  }
);

// Фильтрация типов объявлений
const availableAdTypes = useMemo(() => {
  const baseTypes = ['Встречи', 'Знакомства', 'Вечеринки', 'Общение'];
  
  if (clubOwnership?.hasActiveClub) {
    return [...baseTypes, 'Мероприятия'];
  }
  
  return baseTypes;
}, [clubOwnership]);
```

#### 2. Новый API endpoint `GET /api/clubs/my/ownership`

```javascript
// src/routes/clubs.js
router.get('/my/ownership', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.login;
    
    const club = await Clubs.findOne({
      where: {
        owner: userId,
        is_active: true
      }
    });
    
    res.json({
      hasActiveClub: !!club,
      club: club ? {
        id: club.id,
        name: club.name,
        is_verified: club.is_verified
      } : null
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'server_error',
      message: 'Ошибка при проверке владения клубом'
    });
  }
});
```

---

## 📋 ЭТАП 7.2: Интеграция мероприятий с моделью Events

### 🎯 Цель
Связать объявления типа "Мероприятия" с полноценными записями в таблице `events` для управления участниками и платежами

### 🔧 Backend интеграция

#### 1. Модификация создания объявлений мероприятий

**Расширение POST /api/ads/create для мероприятий:**
```javascript
// После успешного создания объявления типа "Мероприятия"
if (type === 'Мероприятия' && club) {
  // Создаем соответствующее событие
  const eventData = {
    title: title,
    description: description,
    organizer: userLogin,
    club_id: club.id,
    event_date: req.body.event_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // через неделю по умолчанию
    location: `${city}, ${country}`,
    city: city,
    max_participants: req.body.max_participants || null,
    price: req.body.price || 0,
    type: 'club_event',
    status: 'planned',
    contact_info: contact_info,
    image: imageFile ? imageFile.filename : null,
    registration_required: true
  };
  
  const event = await Events.create(eventData);
  
  // Связываем объявление с событием
  newAd.event_id = event.id;
  await newAd.save();
  
  console.log('Created linked event:', event.id);
}
```

#### 2. Новые поля в модели Ads

**Миграция для связи с Events:**
```javascript
// migrations/20241227000003-add-event-link-to-ads.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
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
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ads', 'event_id');
  }
};
```

---

## 📋 ЭТАП 7.3: Платежная система для мероприятий

### 🎯 Цель
Реализовать безопасную систему приема платежей с холдингом средств до завершения мероприятия

### 💳 Backend платежной системы

#### 1. Интеграция с платежным провайдером

**src/services/paymentService.js:**
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  async createPaymentIntent({ amount, user_id, event_id, hold = true }) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // в копейках
        currency: 'rub',
        capture_method: hold ? 'manual' : 'automatic',
        metadata: {
          user_id,
          event_id,
          platform: 'swingfox'
        }
      });
      
      // Сохраняем в БД
      await Payments.create({
        payment_intent_id: paymentIntent.id,
        user_id,
        event_id,
        amount,
        status: 'authorized',
        provider: 'stripe'
      });
      
      return {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        payment_url: `${process.env.FRONTEND_URL}/payment/${paymentIntent.id}`
      };
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      throw error;
    }
  }
  
  async capturePayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
      
      // Обновляем статус в БД
      await Payments.update(
        { status: 'captured' },
        { where: { payment_intent_id: paymentIntentId } }
      );
      
      return paymentIntent;
    } catch (error) {
      console.error('Payment capture failed:', error);
      throw error;
    }
  }
}
```

#### 2. Модель Payments

**src/models/Payments.js:**
```javascript
module.exports = (sequelize) => {
  const Payments = sequelize.define('Payments', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    payment_intent_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    user_id: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'authorized', 'captured', 'cancelled', 'refunded'),
      defaultValue: 'pending'
    },
    provider: {
      type: DataTypes.STRING(50),
      defaultValue: 'stripe'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'payments',
    timestamps: true
  });
  
  return Payments;
};
```

---

## 📋 ЭТАП 7.4: Интеграция с чатом

### 🎯 Цель
Добавить в чат возможность присоединения к мероприятиям и запретить общение между клубами

### 💬 Backend изменения чата

#### 1. Запрет "клуб -> клуб" в `src/routes/chat.js`

```javascript
// Middleware для проверки прав на чат
const validateChatParticipants = async (req, res, next) => {
  try {
    const { username } = req.params;
    const currentUser = req.user.login;
    
    // Проверяем, является ли текущий пользователь владельцем клуба
    const currentUserClub = await Clubs.findOne({
      where: { owner: currentUser, is_active: true }
    });
    
    // Проверяем, является ли собеседник владельцем клуба
    const targetUserClub = await Clubs.findOne({
      where: { owner: username, is_active: true }
    });
    
    // Запрещаем общение между владельцами клубов
    if (currentUserClub && targetUserClub) {
      return res.status(403).json({
        error: 'club_to_club_forbidden',
        message: 'Клубы не могут общаться между собой'
      });
    }
    
    req.chatValidation = {
      currentUserIsClub: !!currentUserClub,
      targetUserIsClub: !!targetUserClub,
      currentUserClub: currentUserClub,
      targetUserClub: targetUserClub
    };
    
    next();
  } catch (error) {
    console.error('Chat validation error:', error);
    next();
  }
};

// Применяем middleware к маршрутам чата
router.get('/:username', authenticateToken, validateChatParticipants, async (req, res) => {
  // ... существующий код
});
```

#### 2. CTA "Вступить в мероприятие" в чате

```javascript
// В ответе GET /api/chat/:username добавляем информацию о мероприятиях
const getChatWithEventCTA = async (currentUser, targetUser) => {
  // Если собеседник - клуб, ищем активные мероприятия
  if (req.chatValidation.targetUserIsClub) {
    const activeEvents = await Events.findAll({
      where: {
        organizer: targetUser,
        status: 'planned',
        event_date: {
          [Op.gt]: new Date()
        }
      },
      limit: 3
    });
    
    return activeEvents.map(event => ({
      id: event.id,
      title: event.title,
      event_date: event.event_date,
      price: event.price,
      current_participants: event.current_participants,
      max_participants: event.max_participants,
      can_join: event.canJoin()
    }));
  }
  
  return [];
};

// В ответе чата
const responseData = {
  // ... существующие поля
  event_cta: await getChatWithEventCTA(currentUser, targetUser)
};
```

---

## 📋 ЭТАП 7.5: Frontend компоненты

### 🎨 UI для мероприятий

#### 1. Карточка объявления с CTA "Вступить"

**client/src/components/EventAdCard.js:**
```javascript
import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { eventAPI } from '../services/api';

const EventAdCard = ({ ad, event }) => {
  const queryClient = useQueryClient();
  
  const joinEventMutation = useMutation(
    () => eventAPI.joinEvent(event.id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['ads']);
        queryClient.invalidateQueries(['events']);
      }
    }
  );
  
  const handleJoin = async () => {
    try {
      await joinEventMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to join event:', error);
    }
  };
  
  return (
    <div className="event-ad-card">
      <div className="event-header">
        <span className="event-badge">🎉 Мероприятие</span>
        <span className="event-price">
          {event.price > 0 ? `${event.price} ₽` : 'Бесплатно'}
        </span>
      </div>
      
      <h3>{ad.title}</h3>
      <p>{ad.description}</p>
      
      <div className="event-details">
        <div className="event-date">
          📅 {new Date(event.event_date).toLocaleDateString('ru-RU')}
        </div>
        <div className="event-location">
          📍 {event.location}
        </div>
        <div className="event-participants">
          👥 {event.current_participants}/{event.max_participants || '∞'}
        </div>
      </div>
      
      {event.can_join && (
        <button 
          className="join-event-btn"
          onClick={handleJoin}
          disabled={joinEventMutation.isLoading}
        >
          {joinEventMutation.isLoading ? 'Присоединяюсь...' : 'Вступить в мероприятие'}
        </button>
      )}
    </div>
  );
};

export default EventAdCard;
```

#### 2. Интеграция в страницу объявлений

**client/src/pages/Ads.js:**
```javascript
// В компоненте Ads добавляем условное отображение
const renderAdCard = (ad) => {
  if (ad.type === 'Мероприятия' && ad.event) {
    return <EventAdCard key={ad.id} ad={ad} event={ad.event} />;
  }
  
  return <RegularAdCard key={ad.id} ad={ad} />;
};

// В списке объявлений
{ads.map(renderAdCard)}
```

---

## 📋 ЭТАП 7.6: Модерация и администрирование

### 🛡️ Система модерации

#### 1. Автоматическая проверка прав клубов

```javascript
// В middleware для создания объявлений
const validateClubRights = async (req, res, next) => {
  try {
    const { type } = req.body;
    
    if (type === 'Мероприятия') {
      const userLogin = req.user.login;
      const club = await Clubs.findOne({
        where: {
          owner: userLogin,
          is_active: true
        }
      });
      
      if (!club) {
        return res.status(403).json({
          error: 'club_required',
          message: 'Только владельцы активных клубов могут создавать мероприятия'
        });
      }
      
      // Добавляем информацию о клубе в request
      req.userClub = club;
    }
    
    next();
  } catch (error) {
    next(error);
  }
};
```

#### 2. Админская панель для клубов

**src/routes/admin.js:**
```javascript
// GET /api/admin/clubs - Список клубов для модерации
router.get('/clubs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const clubs = await Clubs.findAll({
      include: [
        {
          model: User,
          as: 'OwnerUser',
          attributes: ['login', 'name', 'email']
        },
        {
          model: Events,
          as: 'Events',
          attributes: ['id', 'title', 'status', 'created_at']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      clubs: clubs.map(club => ({
        id: club.id,
        name: club.name,
        owner: club.OwnerUser,
        events_count: club.Events.length,
        is_active: club.is_active,
        is_verified: club.is_verified,
        created_at: club.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при получении списка клубов'
    });
  }
});

// PUT /api/admin/clubs/:id/verify - Верификация клуба
router.put('/clubs/:id/verify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, reason } = req.body;
    
    const club = await Clubs.findByPk(id);
    if (!club) {
      return res.status(404).json({
        error: 'club_not_found',
        message: 'Клуб не найден'
      });
    }
    
    club.is_verified = verified;
    await club.save();
    
    // Уведомляем владельца клуба
    await Notifications.createNotification({
      user_id: club.owner,
      type: 'club_verification',
      title: verified ? 'Клуб верифицирован' : 'Клуб отклонен',
      message: verified 
        ? `Ваш клуб "${club.name}" успешно верифицирован!`
        : `Ваш клуб "${club.name}" отклонен. Причина: ${reason}`,
      priority: 'high'
    });
    
    res.json({
      success: true,
      message: `Клуб ${verified ? 'верифицирован' : 'отклонен'}`,
      club: {
        id: club.id,
        name: club.name,
        is_verified: club.is_verified
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'server_error',
      message: 'Ошибка при верификации клуба'
    });
  }
});
```

---

## 📋 ЭТАП 7.7: Маркетинг и монетизация

### 💰 Бизнес-модель

#### 1. Монетизация клубов

- **Комиссия платформы**: 5-10% от стоимости билетов на мероприятия
- **Премиум-подписки для клубов**: Расширенные возможности, приоритет в поиске
- **Рекламные возможности**: Продвижение мероприятий в топе

#### 2. Преимущества для пользователей

- **Безопасные платежи**: Холдинг средств до завершения мероприятия
- **Гарантия качества**: Верифицированные клубы и модерация мероприятий
- **Удобная регистрация**: Через чат или прямо с карточки мероприятия

#### 3. Преимущества для клубов

- **Новая аудитория**: Доступ к пользователям платформы
- **Автоматизация**: Управление регистрациями и платежами
- **Аналитика**: Статистика участников и доходов

---

## 🚀 План развертывания

### Фаза 1: Базовые ограничения (1-2 дня)
- [ ] Добавить валидацию прав клубов в `src/routes/ads.js`
- [ ] Создать API endpoint `/api/clubs/my/ownership`
- [ ] Обновить фронтенд для скрытия типа "Мероприятия"

### Фаза 2: Интеграция с Events (2-3 дня)
- [ ] Создать миграцию для связи `ads.event_id`
- [ ] Модифицировать создание объявлений для автоматического создания событий
- [ ] Обновить модели и ассоциации

### Фаза 3: Платежная система (3-4 дня)
- [ ] Интегрировать Stripe/ЮKassa
- [ ] Создать модель `Payments`
- [ ] Реализовать холдинг средств
- [ ] Добавить webhook обработчики

### Фаза 4: Интеграция с чатом (2-3 дня)
- [ ] Добавить запрет "клуб -> клуб"
- [ ] Реализовать CTA "Вступить в мероприятие"
- [ ] Обновить API чата

### Фаза 5: Frontend компоненты (2-3 дня)
- [ ] Создать `EventAdCard` компонент
- [ ] Интегрировать в страницу объявлений
- [ ] Добавить страницу управления мероприятиями для клубов

### Фаза 6: Модерация и админка (1-2 дня)
- [ ] Создать админские эндпоинты для клубов
- [ ] Добавить верификацию клубов
- [ ] Система уведомлений

---

## 🔄 Принцип rollback

### Стратегия отката:
1. **Feature Flags** - включение/выключение новых функций
2. **Database migrations** - обратимые миграции
3. **API versioning** - сохранение старых версий API
4. **Frontend fallbacks** - резервные компоненты

### Пример Feature Flag:
```javascript
// В конфиге
const FEATURES = {
  CLUB_EVENTS: process.env.ENABLE_CLUB_EVENTS === 'true',
  EVENT_PAYMENTS: process.env.ENABLE_EVENT_PAYMENTS === 'true',
  CLUB_CHAT_RESTRICTIONS: process.env.ENABLE_CLUB_CHAT_RESTRICTIONS === 'true'
};

// В коде
if (FEATURES.CLUB_EVENTS) {
  // Новая логика мероприятий
} else {
  // Старая логика (fallback)
}
```

---

## 📊 Метрики успеха

### Технические метрики:
- ✅ 0% ошибок при создании объявлений клубами
- ✅ Время ответа API < 200ms
- ✅ 100% успешность валидации прав клубов

### Бизнес-метрики:
- ✅ Количество клубов, создающих мероприятия
- ✅ Средний чек на мероприятия
- ✅ Конверсия "просмотр -> регистрация"
- ✅ Доля платных мероприятий

### Пользовательские метрики:
- ✅ Удовлетворенность клубов новой системой
- ✅ Количество участников мероприятий
- ✅ Активность в чатах с клубами

---

## 🔮 Дальнейшее развитие

### Следующие этапы:
1. **Система отзывов о мероприятиях** - рейтинги и комментарии
2. **Персональные рекомендации** - AI-алгоритм для предложения мероприятий
3. **Интеграция с календарями** - синхронизация с Google/Apple Calendar
4. **Мобильное приложение** - нативные уведомления и push-сообщения
5. **Аналитика для клубов** - детальная статистика и отчеты

Эта система создаст новую экосистему взаимодействия между пользователями и клубами, обеспечивая безопасность, удобство и монетизацию для всех участников!
