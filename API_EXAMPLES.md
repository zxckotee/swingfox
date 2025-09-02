# 🔌 Примеры использования SwingFox API

## 🚀 Быстрый старт

### Базовый URL
```
Development: https://localhost:3001/api
Production: https://yourdomain.com/api
```

### Аутентификация
```javascript
// Получение токена
const token = localStorage.getItem('token');

// Заголовки для запросов
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
};
```

## 👥 Пользовательская система

### Регистрация
```javascript
const registerUser = async (userData) => {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                login: 'newuser',
                email: 'user@example.com',
                password: 'password123',
                birth_date: '1990-01-01',
                gender: 'female',
                looking_for: 'male'
            })
        });
        
        const data = await response.json();
        if (data.success) {
            localStorage.setItem('token', data.token);
            return data.user;
        }
    } catch (error) {
        console.error('Registration error:', error);
    }
};
```

### Вход в систему
```javascript
const loginUser = async (credentials) => {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                login: 'username',
                password: 'password123'
            })
        });
        
        const data = await response.json();
        if (data.success) {
            localStorage.setItem('token', data.token);
            return data.user;
        }
    } catch (error) {
        console.error('Login error:', error);
    }
};
```

### Обновление профиля
```javascript
const updateProfile = async (profileData) => {
    try {
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                name: 'Новое имя',
                bio: 'Описание профиля',
                interests: ['спорт', 'музыка', 'путешествия'],
                location: {
                    latitude: 55.7558,
                    longitude: 37.6176,
                    city: 'Москва'
                }
            })
        });
        
        const data = await response.json();
        return data.user;
    } catch (error) {
        console.error('Profile update error:', error);
    }
};
```

## 🎯 Система свайпов

### Получение профилей для свайпа
```javascript
const getSwipeProfiles = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams({
            limit: 10,
            age_min: filters.ageMin || 18,
            age_max: filters.ageMax || 50,
            distance_max: filters.maxDistance || 50,
            gender: filters.gender || 'female'
        });
        
        const response = await fetch(`/api/swipe/profiles?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        return data.profiles;
    } catch (error) {
        console.error('Get profiles error:', error);
    }
};
```

### Лайк профиля
```javascript
const likeProfile = async (profileId) => {
    try {
        const response = await fetch('/api/swipe/like', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                target_user_id: profileId,
                message: 'Привет! Ты мне понравилась 😊'
            })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Like error:', error);
    }
};
```

### Суперлайк
```javascript
const superLikeProfile = async (profileId) => {
    try {
        const response = await fetch('/api/swipe/superlike', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                target_user_id: profileId
            })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Superlike error:', error);
    }
};
```

## 💬 Чат и сообщения

### Получение списка чатов
```javascript
const getChats = async () => {
    try {
        const response = await fetch('/api/chat/chats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        return data.chats;
    } catch (error) {
        console.error('Get chats error:', error);
    }
};
```

### Получение сообщений чата
```javascript
const getChatMessages = async (chatId, page = 1) => {
    try {
        const response = await fetch(`/api/chat/messages/${chatId}?page=${page}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        return data.messages;
    } catch (error) {
        console.error('Get messages error:', error);
    }
};
```

### Отправка сообщения
```javascript
const sendMessage = async (chatId, message) => {
    try {
        const response = await fetch('/api/chat/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                chat_id: chatId,
                message: message,
                type: 'text' // text, image, gift
            })
        });
        
        const data = await response.json();
        return data.message;
    } catch (error) {
        console.error('Send message error:', error);
    }
};
```

## 🏢 Клубная система

### Регистрация клуба
```javascript
const registerClub = async (clubData) => {
    try {
        const response = await fetch('/api/club/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Название клуба',
                description: 'Описание клуба',
                type: 'swingers', // swingers, bdsm, fetish
                address: 'Адрес клуба',
                contact_email: 'club@example.com',
                contact_phone: '+7 999 123-45-67',
                rules: ['Правило 1', 'Правило 2'],
                age_restriction: 21
            })
        });
        
        const data = await response.json();
        if (data.success) {
            localStorage.setItem('club_token', data.token);
            return data.club;
        }
    } catch (error) {
        console.error('Club registration error:', error);
    }
};
```

### Создание мероприятия
```javascript
const createEvent = async (eventData) => {
    try {
        const response = await fetch('/api/club/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('club_token')}`
            },
            body: JSON.stringify({
                title: 'Название мероприятия',
                description: 'Описание мероприятия',
                date: '2024-02-15T20:00:00Z',
                duration: 4, // часы
                max_participants: 50,
                price: 1000,
                dress_code: 'smart casual',
                special_requirements: ['18+', 'Документы'],
                location: {
                    address: 'Адрес мероприятия',
                    coordinates: [55.7558, 37.6176]
                }
            })
        });
        
        const data = await response.json();
        return data.event;
    } catch (error) {
        console.error('Create event error:', error);
    }
};
```

### Присоединение к мероприятию
```javascript
const joinEvent = async (eventId) => {
    try {
        const response = await fetch(`/api/club/user-events/events/${eventId}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                message: 'Хочу присоединиться к мероприятию!',
                special_requests: 'Особые пожелания'
            })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Join event error:', error);
    }
};
```

## 💰 Подписки и платежи

### Получение планов подписок
```javascript
const getSubscriptionPlans = async () => {
    try {
        const response = await fetch('/api/subscription-plans', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        return data.plans;
    } catch (error) {
        console.error('Get plans error:', error);
    }
};
```

### Активация подписки
```javascript
const activateSubscription = async (planId, paymentMethod) => {
    try {
        const response = await fetch('/api/subscriptions/activate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                plan_id: planId,
                payment_method: paymentMethod,
                auto_renew: true
            })
        });
        
        const data = await response.json();
        return data.subscription;
    } catch (error) {
        console.error('Activate subscription error:', error);
    }
};
```

## 📱 Уведомления

### Получение уведомлений
```javascript
const getNotifications = async (page = 1) => {
    try {
        const response = await fetch(`/api/notifications?page=${page}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        return data.notifications;
    } catch (error) {
        console.error('Get notifications error:', error);
    }
};
```

### Отметка уведомления как прочитанного
```javascript
const markNotificationAsRead = async (notificationId) => {
    try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Mark as read error:', error);
    }
};
```

## 🔍 Поиск и фильтрация

### Поиск пользователей
```javascript
const searchUsers = async (searchParams) => {
    try {
        const queryParams = new URLSearchParams({
            query: searchParams.query || '',
            age_min: searchParams.ageMin || 18,
            age_max: searchParams.ageMax || 50,
            gender: searchParams.gender || '',
            location: searchParams.location || '',
            interests: searchParams.interests?.join(',') || '',
            online_only: searchParams.onlineOnly || false
        });
        
        const response = await fetch(`/api/users/search?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        return data.users;
    } catch (error) {
        console.error('Search users error:', error);
    }
};
```

### Расширенная фильтрация
```javascript
const advancedFilter = async (filters) => {
    try {
        const response = await fetch('/api/users/filter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                age_range: [25, 35],
                distance_max: 30,
                height_range: [160, 180],
                weight_range: [50, 80],
                education: ['высшее', 'среднее'],
                occupation: ['IT', 'медицина'],
                interests: ['спорт', 'музыка'],
                relationship_status: 'single',
                has_children: false,
                smoking: false,
                drinking: 'rarely'
            })
        });
        
        const data = await response.json();
        return data.users;
    } catch (error) {
        console.error('Advanced filter error:', error);
    }
};
```

## 📊 Аналитика и статистика

### Получение статистики профиля
```javascript
const getProfileStats = async () => {
    try {
        const response = await fetch('/api/users/profile/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        return data.stats;
    } catch (error) {
        console.error('Get stats error:', error);
    }
};
```

### Аналитика клуба
```javascript
const getClubAnalytics = async () => {
    try {
        const response = await fetch('/api/club/analytics/overview', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('club_token')}`
            }
        });
        
        const data = await response.json();
        return data.analytics;
    } catch (error) {
        console.error('Get club analytics error:', error);
    }
};
```

## 🛠️ Утилиты и хелперы

### Обработка ошибок
```javascript
const handleApiError = (error, fallbackMessage = 'Произошла ошибка') => {
    if (error.response) {
        // Сервер вернул ошибку
        const status = error.response.status;
        const message = error.response.data?.error || fallbackMessage;
        
        switch (status) {
            case 401:
                // Неавторизован - перенаправить на логин
                localStorage.removeItem('token');
                window.location.href = '/login';
                break;
            case 403:
                // Доступ запрещен
                showNotification('Доступ запрещен', 'error');
                break;
            case 404:
                // Не найдено
                showNotification('Ресурс не найден', 'warning');
                break;
            case 429:
                // Слишком много запросов
                showNotification('Слишком много запросов, попробуйте позже', 'warning');
                break;
            case 500:
                // Ошибка сервера
                showNotification('Ошибка сервера, попробуйте позже', 'error');
                break;
            default:
                showNotification(message, 'error');
        }
    } else if (error.request) {
        // Запрос был отправлен, но ответ не получен
        showNotification('Нет соединения с сервером', 'error');
    } else {
        // Ошибка при настройке запроса
        showNotification(fallbackMessage, 'error');
    }
};
```

### Retry механизм
```javascript
const apiRequestWithRetry = async (url, options, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return await response.json();
            }
            
            // Если это ошибка 5xx, попробуем еще раз
            if (response.status >= 500 && response.status < 600) {
                if (i === maxRetries - 1) {
                    throw new Error(`Server error after ${maxRetries} retries`);
                }
                // Ждем перед повторной попыткой
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                continue;
            }
            
            // Для других ошибок не повторяем
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error) {
            if (i === maxRetries - 1) {
                throw error;
            }
        }
    }
};
```

### Кэширование запросов
```javascript
const apiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

const cachedApiRequest = async (url, options = {}) => {
    const cacheKey = `${url}_${JSON.stringify(options)}`;
    const cached = apiCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        apiCache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
        
        return data;
    } catch (error) {
        // В случае ошибки возвращаем кэшированные данные, если они есть
        if (cached) {
            return cached.data;
        }
        throw error;
    }
};
```

## 📱 React компоненты

### Хук для API запросов
```javascript
import { useState, useEffect } from 'react';

const useApi = (url, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [url]);
    
    return { data, loading, error };
};
```

### Компонент для отображения профилей
```javascript
const ProfileCard = ({ profile, onLike, onDislike, onSuperlike }) => {
    const [loading, setLoading] = useState(false);
    
    const handleAction = async (action) => {
        setLoading(true);
        try {
            let url, body;
            
            switch (action) {
                case 'like':
                    url = '/api/swipe/like';
                    body = { target_user_id: profile.id };
                    break;
                case 'dislike':
                    url = '/api/swipe/dislike';
                    body = { target_user_id: profile.id };
                    break;
                case 'superlike':
                    url = '/api/swipe/superlike';
                    body = { target_user_id: profile.id };
                    break;
            }
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(body)
            });
            
            if (response.ok) {
                // Вызываем callback для обновления UI
                if (action === 'like') onLike(profile.id);
                else if (action === 'dislike') onDislike(profile.id);
                else if (action === 'superlike') onSuperlike(profile.id);
            }
        } catch (error) {
            console.error(`${action} error:`, error);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="profile-card">
            <img src={profile.avatar} alt={profile.name} />
            <h3>{profile.name}, {profile.age}</h3>
            <p>{profile.bio}</p>
            
            <div className="action-buttons">
                <button 
                    onClick={() => handleAction('dislike')}
                    disabled={loading}
                    className="btn-dislike"
                >
                    ✕
                </button>
                
                <button 
                    onClick={() => handleAction('superlike')}
                    disabled={loading}
                    className="btn-superlike"
                >
                    ⭐
                </button>
                
                <button 
                    onClick={() => handleAction('like')}
                    disabled={loading}
                    className="btn-like"
                >
                    ♥
                </button>
            </div>
        </div>
    );
};
```

---

**Дополнительные ресурсы:**
- [Полная API документация](./docs/CLUB_API_DOCUMENTATION.md)
- [Технические детали миграции](./MIGRATION_TECHNICAL_DETAILS.md)
- [Руководство по развертыванию](./DEPLOYMENT_GUIDE.md)

**Поддержка**: Для вопросов по API обращайтесь к команде разработки
