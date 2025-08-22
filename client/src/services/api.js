import axios from 'axios';
import toast from 'react-hot-toast';

// Базовая конфигурация API
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// URL для загрузок
const UPLOADS_URL = process.env.REACT_APP_UPLOADS_URL || '/uploads';

// Ключи для localStorage
const TOKEN_KEY = 'swingfox_token';
const USER_CACHE_KEY = 'swingfox_user_cache';

// Получение токена из localStorage
const getToken = () => localStorage.getItem(TOKEN_KEY);

// Сохранение токена
const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    // При удалении токена также очищаем кэш пользователя
    clearUserCache();
  }
};

// Работа с кэшем данных пользователя
const getUserCache = () => {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn('Ошибка парсинга кэша пользователя:', error);
    return null;
  }
};

const setUserCache = (userData) => {
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify({
      ...userData,
      cachedAt: Date.now()
    }));
  } catch (error) {
    console.warn('Ошибка сохранения кэша пользователя:', error);
  }
};

const clearUserCache = () => {
  localStorage.removeItem(USER_CACHE_KEY);
};

// Проверка актуальности кэша (15 минут)
const isCacheValid = (cachedData) => {
  if (!cachedData || !cachedData.cachedAt) return false;
  const CACHE_LIFETIME = 15 * 60 * 1000; // 15 минут
  return (Date.now() - cachedData.cachedAt) < CACHE_LIFETIME;
};

// Интерцептор для добавления токена к запросам
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Интерцептор для обработки ответов
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен истек или недействителен
      setToken(null);
      window.location.href = '/login';
    } else if (error.response?.status >= 500) {
      toast.error('Ошибка сервера. Попробуйте позже.');
    }
    return Promise.reject(error);
  }
);

// API методы для авторизации
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      setToken(response.data.token);
      // Кэшируем данные пользователя при логине
      if (response.data.user) {
        setUserCache(response.data.user);
      }
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      setToken(response.data.token);
      // Кэшируем данные пользователя при регистрации
      if (response.data.user) {
        setUserCache(response.data.user);
      }
    }
    return response.data;
  },

  sendCode: async (email) => {
    const response = await api.post('/auth/send-code', { email });
    return response.data;
  },

  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setToken(null);
    }
  },

  getCurrentUser: () => {
    const token = getToken();
    if (!token) return null;
    
    try {
      // Сначала получаем базовые данные из токена
      const payload = JSON.parse(atob(token.split('.')[1]));
      const baseUser = {
        userId: payload.userId,
        login: payload.login,
        vipType: payload.vipType
      };

      // Пытаемся дополнить данные из кэша
      const cachedUser = getUserCache();
      if (cachedUser && isCacheValid(cachedUser) && cachedUser.login === baseUser.login) {
        return {
          ...baseUser,
          ava: cachedUser.ava,
          email: cachedUser.email,
          status: cachedUser.status,
          city: cachedUser.city,
          country: cachedUser.country,
          is_admin: cachedUser.is_admin || false
        };
      }

      // Если кэш недоступен или устарел, возвращаем базовые данные
      return baseUser;
    } catch {
      return null;
    }
  },

  // Новый метод для получения актуальных данных пользователя
  fetchCurrentUserData: async () => {
    const baseUser = authAPI.getCurrentUser();
    if (!baseUser || !baseUser.login) return null;

    try {
      const response = await api.get(`/users/profile/${baseUser.login}`);
      const userData = response.data;
      
      // Обновляем кэш с актуальными данными
      setUserCache({
        id: userData.id,
        login: userData.login,
        ava: userData.ava,
        email: baseUser.email, // email не возвращается в профиле
        status: userData.status,
        city: userData.city,
        country: userData.country,
        viptype: userData.viptype,
        is_admin: baseUser.is_admin
      });

      return authAPI.getCurrentUser(); // Возвращаем обновленные данные
    } catch (error) {
      console.warn('Ошибка получения актуальных данных пользователя:', error);
      return baseUser; // Возвращаем данные из токена при ошибке
    }
  },

  // Метод для обновления данных пользователя в кэше
  updateUserCache: (updates) => {
    const currentUser = getUserCache();
    if (currentUser) {
      setUserCache({
        ...currentUser,
        ...updates
      });
    }
  }
};

// API методы для пользователей
export const usersAPI = {
  getProfile: async (login) => {
    const response = await api.get(`/users/profile/${login}`);
    
    // Обновляем кэш, если это профиль текущего пользователя
    const currentUser = authAPI.getCurrentUser();
    if (currentUser && currentUser.login === login) {
      authAPI.updateUserCache({
        ava: response.data.ava,
        status: response.data.status,
        city: response.data.city,
        country: response.data.country,
        viptype: response.data.viptype
      });
    }
    
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    
    // Обновляем кэш после успешного обновления профиля
    if (response.data.success && response.data.user) {
      authAPI.updateUserCache({
        status: response.data.user.status,
        city: response.data.user.city,
        country: response.data.user.country
      });
    }
    
    return response.data;
  },

  uploadAvatar: async (formData) => {
    const response = await api.post('/users/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    // Обновляем кэш после успешной загрузки аватарки
    if (response.data.success && response.data.filename) {
      authAPI.updateUserCache({
        ava: response.data.filename
      });
    }
    
    return response.data;
  },

  uploadImages: async (formData) => {
    const response = await api.post('/users/upload-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteImage: async (filename, type = 'images') => {
    const response = await api.delete(`/users/images/${filename}?type=${type}`);
    return response.data;
  },

  setLockedPassword: async (password) => {
    const response = await api.post('/users/set-locked-password', { password });
    return response.data;
  },

  unlockImages: async (targetUser, password) => {
    const response = await api.post('/users/unlock-images', {
      target_user: targetUser,
      password
    });
    return response.data;
  }
};

// API методы для свайпинга
export const swipeAPI = {
  getProfiles: async (direction = 'forward') => {
    const response = await api.get(`/swipe/profiles?direction=${direction}`);
    return response.data;
  },

  like: async (targetUser) => {
    const response = await api.post('/swipe/like', { target_user: targetUser });
    return response.data;
  },

  dislike: async (targetUser) => {
    const response = await api.post('/swipe/dislike', { target_user: targetUser });
    return response.data;
  },

  superlike: async (targetUser, message) => {
    const response = await api.post('/swipe/superlike', { 
      target_user: targetUser, 
      message 
    });
    return response.data;
  },

  getSuperlikes: async () => {
    const response = await api.get('/swipe/superlike-count');
    return response.data;
  }
};

// API методы для чатов
export const chatAPI = {
  getConversations: async (limit = 20, offset = 0) => {
    const response = await api.get(`/chat/conversations?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  getMessages: async (username, limit = 50, offset = 0) => {
    const response = await api.get(`/chat/${username}?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  sendMessage: async (formData) => {
    const response = await api.post('/chat/send', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getUserStatus: async (username) => {
    const response = await api.get(`/chat/status/${username}`);
    return response.data;
  },

  setTyping: async (toUser, isTyping) => {
    const response = await api.post('/chat/typing', { 
      to_user: toUser, 
      is_typing: isTyping 
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/chat/unread-count');
    return response.data;
  },

  deleteConversation: async (username) => {
    const response = await api.delete(`/chat/${username}`);
    return response.data;
  }
};

// API методы для объявлений
export const adsAPI = {
  getAds: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/ads?${params}`);
    return response.data;
  },

  getMyAds: async (limit = 10, offset = 0) => {
    const response = await api.get(`/ads/my?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  createAd: async (adData) => {
    const response = await api.post('/ads/create', adData);
    return response.data;
  },

  updateAd: async (id, adData) => {
    const response = await api.put(`/ads/${id}`, adData);
    return response.data;
  },

  deleteAd: async (id) => {
    const response = await api.delete(`/ads/${id}`);
    return response.data;
  },

  respondToAd: async (id, message) => {
    const response = await api.post(`/ads/${id}/respond`, { message });
    return response.data;
  },

  getAdTypes: async () => {
    const response = await api.get('/ads/types');
    return response.data;
  }
};

// API методы для администрирования
export const adminAPI = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getUsers: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/admin/users?${params}`);
    return response.data;
  },

  updateUser: async (login, userData) => {
    const response = await api.put(`/admin/users/${login}`, userData);
    return response.data;
  },

  deleteUser: async (login) => {
    const response = await api.delete(`/admin/users/${login}`);
    return response.data;
  },

  getMessages: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/admin/messages?${params}`);
    return response.data;
  },

  deleteMessage: async (id) => {
    const response = await api.delete(`/admin/messages/${id}`);
    return response.data;
  },

  broadcast: async (message, targetVipType = 'ALL') => {
    const response = await api.post('/admin/broadcast', { 
      message, 
      target_viptype: targetVipType 
    });
    return response.data;
  },

  getAnalytics: async (period = '30') => {
    const response = await api.get(`/admin/analytics?period=${period}`);
    return response.data;
  }
};

// Утилиты
export const apiUtils = {
  isAuthenticated: () => !!getToken(),
  
  getCurrentUser: authAPI.getCurrentUser,
  
  logout: authAPI.logout,

  // Принудительное обновление данных пользователя
  refreshCurrentUser: async () => {
    return await authAPI.fetchCurrentUserData();
  },

  // Обновление кэша пользователя
  updateUserCache: authAPI.updateUserCache,

  // Очистка кэша пользователя
  clearUserCache,

  // Создание FormData для загрузки файлов
  createFormData: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        if (Array.isArray(data[key])) {
          data[key].forEach(item => formData.append(key, item));
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    return formData;
  },

  // Обработка ошибок API
  handleError: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Произошла неизвестная ошибка';
  }
};

export default api;