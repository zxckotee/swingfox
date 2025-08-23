# ЭТАП 3: Критическое исправление системы профилей

## 🚨 Проблема
В текущей Node.js реализации отсутствует разделение между "моим профилем" и "чужими профилями", что критически нарушает функциональность:

1. **Каталог не работает**: Ссылки из каталога ведут на `/profile/${user.login}`, но показывается собственный профиль
2. **Отсутствует функциональность чужих профилей**: Лайки, подарки, рейтинг, чат
3. **Нарушена основная логика PHP версии**: `profiles.php?us=username` vs `my.php`

## 🎯 Архитектурное решение

### 1. Создание двух типов профилей

#### A. MyProfile.js (собственный профиль)
- Редактирование данных
- Загрузка фото
- Настройки приватности
- Статистика

#### B. OtherProfile.js (чужой профиль) 
- Просмотр информации
- Лайки на фото
- Отправка подарков
- Рейтинг (+/-)
- Переход в чат
- Суперлайк

### 2. Обновление роутинга

```javascript
// Текущее (неправильное)
<Route path="/profile/:login?" element={<Profile />} />

// Новое (правильное)
<Route path="/profile" element={<MyProfile />} />        // Мой профиль
<Route path="/profiles/:login" element={<OtherProfile />} />  // Чужой профиль
```

### 3. API расширения

#### Новые эндпоинты:
- `POST /api/profiles/:login/like-photo` - Лайк фото
- `POST /api/profiles/:login/send-gift` - Отправка подарка
- `POST /api/profiles/:login/rate` - Оценка пользователя
- `GET /api/profiles/:login/rating` - Получение рейтинга
- `POST /api/profiles/:login/superlike` - Суперлайк
- `POST /api/profiles/:login/visit` - Регистрация посещения

## 🔧 Детальный план реализации

### Шаг 1: Разделение компонентов профилей

#### 1.1 Переименование текущего Profile.js в MyProfile.js
- Сохранить всю существующую функциональность редактирования
- Добавить проверку на собственный профиль
- Оптимизировать для управления собственными данными

#### 1.2 Создание OtherProfile.js
```javascript
// Структура компонента
const OtherProfile = () => {
  const { login } = useParams();
  const currentUser = apiUtils.getCurrentUser();
  
  // Защита от просмотра собственного профиля
  if (currentUser?.login === login) {
    return <Navigate to="/profile" replace />;
  }
  
  // Логика просмотра чужого профиля
};
```

### Шаг 2: API расширение

#### 2.1 Создание src/routes/profiles.js
```javascript
// Новый роутер для профильных взаимодействий
router.post('/:login/like-photo', authenticateToken, likePhoto);
router.post('/:login/send-gift', authenticateToken, sendGift);
router.post('/:login/rate', authenticateToken, rateUser);
router.get('/:login/rating', authenticateToken, getUserRating);
router.post('/:login/superlike', authenticateToken, sendSuperlike);
router.post('/:login/visit', authenticateToken, registerVisit);
```

#### 2.2 Модели данных
- **PhotoLikes**: Лайки на фото
- **ProfileVisits**: Посещения профилей  
- **UserRatings**: Рейтинговая система (уже существует)
- **Gifts**: Система подарков (уже существует)

### Шаг 3: UI компоненты взаимодействия

#### 3.1 ProfileActions.js
```javascript
const ProfileActions = ({ targetUser, currentUser }) => (
  <ActionsContainer>
    <GiftButton onClick={() => openGiftModal()} />
    {!hasReciprocal && (
      <>
        <LikeButton onClick={() => sendLike()} />
        <SuperlikeButton onClick={() => openSuperlikeModal()} />
      </>
    )}
    {hasReciprocal && (
      <ChatButton onClick={() => goToChat(targetUser.login)} />
    )}
  </ActionsContainer>
);
```

#### 3.2 RatingWidget.js  
```javascript
const RatingWidget = ({ targetUser, myRating, totalRating }) => (
  <RatingContainer>
    <RatingButton 
      variant="minus" 
      active={myRating === -1}
      onClick={() => rateUser(-1)} 
    />
    <RatingDisplay>{totalRating}</RatingDisplay>
    <RatingButton 
      variant="plus" 
      active={myRating === 1}
      onClick={() => rateUser(1)} 
    />
  </RatingContainer>
);
```

#### 3.3 PhotoGallery.js с лайками
```javascript
const PhotoWithLikes = ({ photo, likes, canLike, onLike }) => (
  <PhotoContainer>
    <Image src={photo.url} onClick={() => openFullscreen()} />
    <LikesOverlay>
      <LikesCount>{likes}</LikesCount>
      {canLike && (
        <LikeIcon onClick={() => onLike(photo.id)} />
      )}
    </LikesOverlay>
  </PhotoContainer>
);
```

### Шаг 4: Обновление навигации

#### 4.1 Исправление Catalog.js
```javascript
// Вместо
<a href={`/profile/${user.login}`}>@{user.login}</a>

// Использовать
<Link to={`/profiles/${user.login}`}>@{user.login}</Link>
```

#### 4.2 Обновление Navigation.js
```javascript
// Ссылка "Профиль" должна вести на /profile (мой)
<Link to="/profile">Профиль</Link>
```

### Шаг 5: Модальные окна и взаимодействие

#### 5.1 GiftModal.js
- Выбор подарка (1-10 типов)
- Стоимость в фоксиках
- Подтверждение отправки
- Интеграция с балансом

#### 5.2 SuperlikeModal.js  
- Текстовое сообщение
- Проверка лимита суперлайков
- Отправка уведомления

#### 5.3 FullscreenImageModal.js
- Просмотр фото в полном размере
- Кнопка лайка
- Счетчик лайков
- Навигация между фото

## 🔗 Интеграция с существующими системами

### Совместимость с ЭТАП 1 (Swipe)
- Унификация логики лайков между swipe и profile
- Общий API для отправки лайков
- Синхронизация состояний

### Совместимость с ЭТАП 2 (Catalog)
- Правильное перенаправление из каталога
- Единообразное отображение профилей
- Фильтрация собственного профиля из каталога

### Подготовка к ЭТАП 4 (Chat)
- Проверка взаимных лайков перед чатом
- Уведомления о новых лайках
- История взаимодействий

## 📱 Responsive Design

### Мобильная версия OtherProfile
- Компактное отображение действий
- Свайп-галерея фото
- Быстрые кнопки лайк/дизлайк
- Адаптивные модальные окна

### Десктопная версия
- Боковая панель с действиями
- Сетка фотографий
- Расширенная информация
- Hover-эффекты

## 🚀 План развертывания

### Фаза 1: Базовое разделение (Критично)
1. Создать OtherProfile.js
2. Обновить роутинг App.js  
3. Исправить навигацию из каталога
4. Базовый API для просмотра чужих профилей

### Фаза 2: Функциональность взаимодействия
1. Система лайков на фото
2. Отправка подарков
3. Рейтинговая система
4. Модальные окна

### Фаза 3: UX улучшения
1. Анимации и переходы
2. Уведомления о действиях
3. Статистика посещений
4. Расширенная галерея

## 🧪 Тестирование

### Unit тесты
- Компоненты профилей
- API методы взаимодействия
- Утилиты рейтинга

### Integration тесты  
- Переход между типами профилей
- Отправка лайков и подарков
- Синхронизация с backend

### E2E тесты
- Полный сценарий знакомства
- Каталог → Профиль → Лайк → Чат
- Мобильная версия

## 🎯 Метрики успеха

### Функциональные
- ✅ Каталог корректно открывает чужие профили
- ✅ Собственный профиль доступен для редактирования
- ✅ Все действия PHP версии реализованы
- ✅ Backward compatibility сохранена

### UX метрики
- Время перехода каталог → профиль < 2с
- Конверсия просмотр → лайк > 15%  
- Конверсия лайк → взаимность > 8%
- Отказов от загрузки профиля < 5%

## 🔧 Implementation Priority

### 🔴 Критический приоритет (Блокирует основную функциональность)
1. Разделение MyProfile/OtherProfile
2. Исправление роутинга  
3. Починка навигации из каталога
4. Базовое API для чужих профилей

### 🟡 Высокий приоритет  
1. Система лайков на фото
2. Отправка подарков
3. Рейтинговая система
4. Переход в чат

### 🟢 Средний приоритет
1. Модальные окна
2. Анимации
3. Статистика
4. Расширенная галерея

Этот этап критично важен для восстановления базовой функциональности платформы знакомств!