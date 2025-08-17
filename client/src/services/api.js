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

// Получение токена из localStorage
const getToken = () => localStorage.getItem('swingfox_token');

// Сохранение токена
const setToken = (token) => {
  if (token) {
    localStorage.setItem('swingfox_token', token);
  } else {
    localStorage.removeItem('swingfox_token');
  }
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
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      setToken(response.data.token);
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
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload.userId,
        login: payload.login,
        vipType: payload.vipType
      };
    } catch {
      return null;
    }
  }
};

// API методы для пользователей
export const usersAPI = {
  getProfile: async (login) => {
    const response = await api.get(`/users/profile/${login}`);
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  uploadAvatar: async (formData) => {
    const response = await api.post('/users/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
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