import axios from 'axios';
import toast from 'react-hot-toast';

// Базовая конфигурация API
const apiClient = axios.create({
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

// Флаг для предотвращения повторных редиректов
let isRedirecting = false;

// Интерцептор для добавления токена к запросам
apiClient.interceptors.request.use(
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
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      // Токен истек или недействителен
      isRedirecting = true;
      setToken(null);
      
      // Вместо window.location.href используем событие
      window.dispatchEvent(new CustomEvent('auth-logout'));
      
      // Сбрасываем флаг через некоторое время
      setTimeout(() => {
        isRedirecting = false;
      }, 1000);
    } else if (error.response?.status >= 500) {
      toast.error('Ошибка сервера. Попробуйте позже.');
    }
    return Promise.reject(error);
  }
);

// API методы для авторизации
export const authAPI = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
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
    const response = await apiClient.post('/auth/register', userData);
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
    const response = await apiClient.post('/auth/send-code', { email });
    return response.data;
  },

  resetPassword: async (data) => {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
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
      const response = await apiClient.get(`/users/profile/${baseUser.login}`);
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
    const response = await apiClient.get(`/profiles/${login}`);
    
    // Обновляем кэш, если это профиль текущего пользователя
    const currentUser = authAPI.getCurrentUser();
    if (currentUser && currentUser.login === login) {
      authAPI.updateUserCache({
        ava: response.data.profile.ava,
        status: response.data.profile.status,
        city: response.data.profile.city,
        country: response.data.profile.country,
        viptype: response.data.profile.viptype
      });
    }
    
    return response.data.profile;
  },

  updateProfile: async (profileData) => {
    const response = await apiClient.put('/users/profile', profileData);
    
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
    const response = await apiClient.post('/users/upload-avatar', formData, {
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
    const response = await apiClient.post('/users/upload-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    // Обновляем кэш после успешной загрузки изображений
    if (response.data.success) {
      // Получаем актуальные данные пользователя для обновления кэша
      try {
        const currentUser = authAPI.getCurrentUser();
        if (currentUser && currentUser.login) {
          const userResponse = await apiClient.get(`/users/profile/${currentUser.login}`);
          if (userResponse.data.success) {
            authAPI.updateUserCache({
              ava: userResponse.data.user.ava,
              status: userResponse.data.user.status,
              city: userResponse.data.user.city,
              country: userResponse.data.user.country,
              viptype: userResponse.data.user.viptype
            });
          }
        }
      } catch (error) {
        console.warn('Ошибка обновления кэша после загрузки изображений:', error);
      }
    }
    
    return response.data;
  },

  deleteImage: async (filename, type = 'images') => {
    const response = await apiClient.delete(`/users/images/${filename}?type=${type}`);
    return response.data;
  },

  setLockedPassword: async (password) => {
    const response = await apiClient.post('/users/set-locked-password', { password });
    return response.data;
  },

  unlockImages: async (targetUser, password) => {
    const response = await apiClient.post('/users/unlock-images', {
      target_user: targetUser,
      password
    });
    return response.data;
  },

  // Лайки фото
  likePhoto: async (targetUser, photoIndex) => {
    const response = await apiClient.post(`/profiles/${targetUser}/like-photo`, {
      photo_index: photoIndex
    });
    return response.data;
  },

  getPhotoLikes: async (targetUser) => {
    const response = await apiClient.get(`/profiles/${targetUser}/photo-likes`);
    return response.data;
  },

  // Комментарии к фотографиям
  getPhotoComments: async (filename, page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    const response = await apiClient.get(`/photo-comments/${filename}?${params.toString()}`);
    return response.data;
  },

  createPhotoComment: async (filename, commentText) => {
    console.log('API createPhotoComment called with:', { filename, commentText });
    console.log('Filename type:', typeof filename, 'Value:', filename);
    
    if (typeof filename !== 'string') {
      console.error('Filename is not a string:', filename);
      throw new Error('Filename must be a string');
    }
    
    const response = await apiClient.post(`/photo-comments/${filename}`, {
      comment_text: commentText
    });
    return response.data;
  },

  updatePhotoComment: async (commentId, commentText) => {
    const response = await apiClient.put(`/photo-comments/${commentId}`, {
      comment_text: commentText
    });
    return response.data;
  },

  deletePhotoComment: async (commentId) => {
    const response = await apiClient.delete(`/photo-comments/${commentId}`);
    return response.data;
  },

  // Комментарии к профилям
  getProfileComments: async (username, page = 1, limit = 20, includePrivate = false) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    if (includePrivate) {
      params.append('include_private', 'true');
    }
    const response = await apiClient.get(`/profile-comments/${username}?${params.toString()}`);
    return response.data;
  },

  createProfileComment: async (username, commentText, isPublic = true) => {
    console.log('API createProfileComment called with:', { username, commentText, isPublic });
    console.log('Username type:', typeof username, 'Value:', username);
    
    if (typeof username !== 'string') {
      console.error('Username is not a string:', username);
      throw new Error('Username must be a string');
    }
    
    const response = await apiClient.post(`/profile-comments/${username}`, {
      comment_text: commentText,
      is_public: isPublic
    });
    return response.data;
  },

  updateProfileComment: async (commentId, commentText) => {
    const response = await apiClient.put(`/profile-comments/${commentId}`, {
      comment_text: commentText
    });
    return response.data;
  },

  deleteProfileComment: async (commentId) => {
    const response = await apiClient.delete(`/profile-comments/${commentId}`);
    return response.data;
  },

  // Отправка подарков
  sendGift: async (targetUser, giftType, message = '') => {
    const response = await apiClient.post(`/profiles/${targetUser}/send-gift`, {
      gift_type: giftType,
      message
    });
    return response.data;
  },

  // Система рейтинга
  rateUser: async (targetUser, value) => {
    const response = await apiClient.post(`/profiles/${targetUser}/rate`, {
      value
    });
    return response.data;
  },

  getUserRating: async (targetUser) => {
    const response = await apiClient.get(`/profiles/${targetUser}/rating`);
    return response.data;
  },

  // Суперлайки
  sendSuperlike: async (targetUser, message = '') => {
    const response = await apiClient.post(`/profiles/${targetUser}/superlike`, {
      message
    });
    return response.data;
  },

  // Регистрация посещений
  registerVisit: async (targetUser) => {
    const response = await apiClient.post(`/profiles/${targetUser}/visit`);
    return response.data;
  }
};

// API методы для свайпинга
export const swipeAPI = {
  getProfiles: async (direction = 'forward') => {
    const response = await apiClient.get(`/swipe/profiles?direction=${direction}`);
    return response.data;
  },

  getProfilesBatch: async (count = 10, exclude = []) => {
    const params = new URLSearchParams();
    params.append('count', count);
    if (exclude.length > 0) {
      params.append('exclude', exclude.join(','));
    }
    const response = await apiClient.get(`/swipe/profiles/batch?${params.toString()}`);
    return response.data;
  },

  like: async (targetUser, source = 'gesture') => {
    const response = await apiClient.post('/swipe/like', {
      target_user: targetUser,
      source
    });
    return response.data;
  },

  dislike: async (targetUser, source = 'gesture') => {
    const response = await apiClient.post('/swipe/dislike', {
      target_user: targetUser,
      source
    });
    return response.data;
  },

  superlike: async ({ targetUser, message }) => {
    const response = await apiClient.post('/swipe/superlike', {
      target_user: targetUser, 
      message: message || ''
    });
    return response.data;
  },

  getSuperlikes: async () => {
    const response = await apiClient.get('/swipe/superlike-count');
    return response.data;
  },

  // Проверка существующего мэтча с пользователем
  checkExistingMatch: async (targetUser) => {
    try {
      const response = await apiClient.get(`/chat/match-status/${targetUser}`);
      return response.data;
    } catch (error) {
      console.error('Error checking existing match:', error);
      return { hasMatch: false };
    }
  }
};

// API методы для каталога анкет
export const catalogAPI = {
  getProfiles: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Добавляем фильтры как параметры запроса
    if (filters.status && filters.status.length > 0) {
      filters.status.forEach(s => params.append('status', s));
    }
    if (filters.country) params.append('country', filters.country);
    if (filters.city) params.append('city', filters.city);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const response = await apiClient.get(`/catalog?${params.toString()}`);
    return response.data;
  },

  getFilters: async () => {
    const response = await apiClient.get('/catalog/filters');
    return response.data;
  }
};

// API методы для чатов
export const chatAPI = {
  getConversations: async (limit = 20, offset = 0) => {
    const response = await apiClient.get(`/chat/conversations?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  getMessages: async (username, limit = 50, offset = 0) => {
    const response = await apiClient.get(`/chat/${username}?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  sendMessage: async (formData) => {
    const response = await apiClient.post('/chat/send', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getUserStatus: async (username) => {
    const response = await apiClient.get(`/chat/status/${username}`);
    return response.data;
  },

  setTyping: async (toUser, isTyping) => {
    const response = await apiClient.post('/chat/typing', {
      to_user: toUser,
      is_typing: isTyping
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiClient.get('/chat/unread-count');
    return response.data;
  },

  deleteConversation: async (username) => {
    const response = await apiClient.delete(`/chat/${username}`);
    return response.data;
  },

  // Новые методы для работы с мэтчами
  getMatchStatus: async (targetUser) => {
    const response = await apiClient.get(`/chat/match-status/${targetUser}`);
    return response.data;
  },

  checkMatchPermission: async (targetUser) => {
    const response = await apiClient.get(`/chat/can-message/${targetUser}`);
    return response.data;
  }
};

// API методы для объявлений
export const adsAPI = {
  getAds: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/ads?${params}`);
    return response.data;
  },

  getMyAds: async (limit = 10, offset = 0) => {
    const response = await apiClient.get(`/ads/my?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  createAd: async (adData) => {
    // Создаем FormData для загрузки изображения
    const formData = new FormData();
    
    // Добавляем текстовые поля
    formData.append('title', adData.title);
    formData.append('type', adData.type);
    formData.append('description', adData.description);
    formData.append('country', adData.country);
    formData.append('city', adData.city);
    
    if (adData.price) {
      formData.append('price', adData.price);
    }
    
    if (adData.contact_info) {
      formData.append('contact_info', adData.contact_info);
    }
    
    // Добавляем изображение если оно есть
    if (adData.image && adData.image instanceof File) {
      formData.append('image', adData.image);
    }
    
    // Отправляем как multipart/form-data
    const response = await apiClient.post('/ads/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateAd: async (id, adData) => {
    // Создаем FormData для загрузки изображения
    const formData = new FormData();
    
    // Добавляем текстовые поля
    formData.append('title', adData.title);
    formData.append('type', adData.type);
    formData.append('description', adData.description);
    formData.append('country', adData.country);
    formData.append('city', adData.city);
    
    if (adData.price) {
      formData.append('price', adData.price);
    }
    
    if (adData.contact_info) {
      formData.append('contact_info', adData.contact_info);
    }
    
    // Добавляем изображение если оно есть
    if (adData.image && adData.image instanceof File) {
      formData.append('image', adData.image);
    }
    
    // Отправляем как multipart/form-data
    const response = await apiClient.put(`/ads/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteAd: async (id) => {
    const response = await apiClient.delete(`/ads/${id}`);
    return response.data;
  },

  respondToAd: async (id, message) => {
    const response = await apiClient.post(`/ads/${id}/respond`, { message });
    return response.data;
  },

  getAdTypes: async () => {
    const response = await apiClient.get('/ads/types');
    return response.data;
  }
};

// API методы для администрирования
export const adminAPI = {
  getDashboard: async () => {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  },

  getUsers: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/admin/users?${params}`);
    return response.data;
  },

  updateUser: async (login, userData) => {
    const response = await apiClient.put(`/admin/users/${login}`, userData);
    return response.data;
  },

  deleteUser: async (login) => {
    const response = await apiClient.delete(`/admin/users/${login}`);
    return response.data;
  },

  getMessages: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/admin/messages?${params}`);
    return response.data;
  },

  deleteMessage: async (id) => {
    const response = await apiClient.delete(`/admin/messages/${id}`);
    return response.data;
  },

  broadcast: async (message, targetVipType = 'ALL') => {
    const response = await apiClient.post('/admin/broadcast', {
      message,
      target_viptype: targetVipType
    });
    return response.data;
  },

  getAnalytics: async (period = '30') => {
    const response = await apiClient.get(`/admin/analytics?period=${period}`);
    return response.data;
  }
};

// API методы для уведомлений
export const notificationsAPI = {
  getNotifications: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.unread !== undefined) params.append('unread', filters.unread);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    
    const response = await apiClient.get(`/notifications?${params.toString()}`);
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.post('/notifications/mark-read');
    return response.data;
  },

  deleteNotification: async (id) => {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  },

  deleteReadNotifications: async () => {
    const response = await apiClient.post('/notifications/delete-read');
    return response.data;
  },

  getNotificationTypes: async () => {
    const response = await apiClient.get('/notifications/types');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/count');
    return response.data;
  }
};

// API методы для подарков
export const giftsAPI = {
  getGiftTypes: async () => {
    const response = await apiClient.get('/gifts/types');
    return response.data;
  },

  sendGift: async (giftData) => {
    // Преобразуем параметры в формат, ожидаемый сервером
    const { to_user, gift_type, message } = giftData;
    const response = await apiClient.post('/gifts/send', {
      target_user: to_user,
      gift_type,
      message: message || ''
    });
    return response.data;
  },

  getGiftHistory: async (type = 'all', limit = 20, offset = 0) => {
    const params = new URLSearchParams({
      type,
      limit: limit.toString(),
      offset: offset.toString()
    });
    const response = await apiClient.get(`/gifts/history?${params.toString()}`);
    return response.data;
  },

  getGiftStats: async (period = '30') => {
    const response = await apiClient.get(`/gifts/stats?period=${period}`);
    return response.data;
  },

  getReceivedGifts: async (limit = 20, offset = 0, targetUser = null) => {
    console.log('getReceivedGifts called with:', { limit, offset, targetUser });
    
    if (targetUser) {
      // Используем новый роут для получения подарков конкретного пользователя
      const url = `/gifts/received/${targetUser}?limit=${limit}&offset=${offset}`;
      console.log('Calling API:', url);
      const response = await apiClient.get(url);
      console.log('API response:', response.data);
      return response.data;
    } else {
      // Для текущего пользователя используем старый роут
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });
      const url = `/gifts?${params.toString()}`;
      console.log('Calling API:', url);
      const response = await apiClient.get(url);
      console.log('API response:', response.data);
      return response.data;
    }
  },

  getSentGifts: async (limit = 20, offset = 0) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    const response = await apiClient.get(`/gifts/sent?${params.toString()}`);
    return response.data;
  }
};

// API методы для клубов
export const clubsAPI = {
  getClubs: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.city) params.append('city', filters.city);
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    
    const response = await apiClient.get(`/clubs?${params.toString()}`);
    return response.data;
  },

  createClub: async (clubData) => {
    const response = await apiClient.post('/clubs', clubData);
    return response.data;
  },

  getClub: async (clubId) => {
    const response = await apiClient.get(`/clubs/${clubId}`);
    return response.data;
  },

  updateClub: async (clubId, clubData) => {
    const response = await apiClient.put(`/clubs/${clubId}`, clubData);
    return response.data;
  },

  deleteClub: async (clubId) => {
    const response = await apiClient.delete(`/clubs/${clubId}`);
    return response.data;
  },

  joinClub: async (clubId, message = '') => {
    const response = await apiClient.post(`/clubs/${clubId}/apply`, { message });
    return response.data;
  },

  leaveClub: async (clubId) => {
    const response = await apiClient.delete(`/clubs/${clubId}/leave`);
    return response.data;
  },

  getMyClubs: async () => {
    const response = await apiClient.get('/clubs/my');
    return response.data;
  },

  getClubMembers: async (clubId) => {
    const response = await apiClient.get(`/clubs/${clubId}/members`);
    return response.data;
  },

  getClubApplications: async (clubId) => {
    const response = await apiClient.get(`/clubs/${clubId}/applications`);
    return response.data;
  },

  manageApplication: async (clubId, applicationId, action, reason = '') => {
    const response = await apiClient.put(`/clubs/${clubId}/applications/${applicationId}`, {
      action,
      reason
    });
    return response.data;
  },

  checkClubOwnership: async () => {
    const response = await apiClient.get('/clubs/my/ownership');
    return response.data;
  }
};

// API методы для подписок
export const subscriptionsAPI = {
  getPlans: async () => {
    const response = await apiClient.get('/subscriptions/pricing');
    return response.data;
  },

  subscribe: async (planData) => {
    const response = await apiClient.post('/subscriptions/create', planData);
    return response.data;
  },

  getStatus: async () => {
    const response = await apiClient.get('/subscriptions/current');
    return response.data;
  },

  getHistory: async (limit = 20, offset = 0) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    const response = await apiClient.get(`/subscriptions/history?${params.toString()}`);
    return response.data;
  },

  // FIX: cancel method - remove subscriptionId parameter
  cancel: async (reason = '') => {
    const response = await apiClient.post('/subscriptions/cancel', { reason });
    return response.data;
  },

  usePromoCode: async (code) => {
    const response = await apiClient.post('/subscriptions/validate-promo', { code });
    return response.data;
  },

  getFeatures: async () => {
    const response = await apiClient.get('/subscriptions/pricing');
    return response.data;
  },

  changePlan: async (newPlanType, durationMonths = 1) => {
    const response = await apiClient.post('/subscriptions/change-plan', {
      new_plan_type: newPlanType,
      duration_months: durationMonths
    });
    return response.data;
  },
  

  
  // ADD: get user balance
  getBalance: async () => {
    const response = await apiClient.get('/users/balance');
    return response.data;
  }
};

// API методы для рейтинга
export const ratingAPI = {
  getUserRating: async (username) => {
    const response = await apiClient.get(`/rating/${username}`);
    return response.data;
  },

  rateUser: async (username, value) => {
    const response = await apiClient.post(`/rating/${username}`, { value });
    return response.data;
  },

  deleteRating: async (username) => {
    const response = await apiClient.delete(`/rating/${username}`);
    return response.data;
  },

  getTopUsers: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.period) params.append('period', filters.period);
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const response = await apiClient.get(`/rating/top/users?${params.toString()}`);
    return response.data;
  },

  getMyGivenRatings: async (page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    const response = await apiClient.get(`/rating/my/given?${params.toString()}`);
    return response.data;
  },

  getMyReceivedRatings: async (page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    const response = await apiClient.get(`/rating/my/received?${params.toString()}`);
    return response.data;
  },

  // Новые методы для интеграции с frontend
  getLeaderboard: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.period) params.append('period', filters.period);
    if (filters.category) params.append('category', filters.category);
    if (filters.city) params.append('city', filters.city);
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const response = await apiClient.get(`/rating/leaderboard?${params.toString()}`);
    return response.data;
  },

  getMyStats: async () => {
    const response = await apiClient.get('/rating/my/stats');
    return response.data;
  }
};

// API методы для реакций
export const reactionsAPI = {
  getObjectReactions: async (objectType, objectId) => {
    const response = await apiClient.get(`/reactions/${objectType}/${objectId}`);
    return response.data;
  },

  setReaction: async (objectType, objectId, reactionType, value = 1) => {
    const response = await apiClient.post(`/reactions/${objectType}/${objectId}`, {
      reaction_type: reactionType,
      value
    });
    return response.data;
  },

  removeReaction: async (objectType, objectId) => {
    const response = await apiClient.delete(`/reactions/${objectType}/${objectId}`);
    return response.data;
  },

  getUserReactions: async (username, page = 1, limit = 20, objectType = null) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    if (objectType) {
      params.append('object_type', objectType);
    }
    const response = await apiClient.get(`/reactions/user/${username}?${params.toString()}`);
    return response.data;
  },

  getReactionStats: async (objectType, objectId) => {
    const response = await apiClient.get(`/reactions/stats/${objectType}/${objectId}`);
    return response.data;
  }
};

// Расширенные API методы для загрузок
export const uploadsAPI = {
  uploadAvatar: async (formData) => {
    const response = await apiClient.post('/uploads/avatar', formData, {
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

  uploadPhotos: async (formData) => {
    const response = await apiClient.post('/uploads/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  uploadPrivatePhotos: async (formData) => {
    const response = await apiClient.post('/uploads/private-photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deletePhoto: async (filename, type = 'photos') => {
    const response = await apiClient.delete(`/uploads/${type}/${filename}`);
    return response.data;
  },

  getUploadProgress: (onProgress) => {
    // Для отслеживания прогресса загрузки
    return {
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        if (onProgress) onProgress(progress);
      }
    };
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
  },

  // Форматирование даты
  formatDate: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Форматирование времени "назад"
  formatTimeAgo: (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'только что';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин назад`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ч назад`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} дн назад`;
    
    return apiUtils.formatDate(dateString);
  },

  // Проверка VIP статуса
  isVip: (user) => {
    return user?.vipType && user.vipType !== 'BASE';
  },

  // Проверка PREMIUM статуса
  isPremium: (user) => {
    return user?.vipType === 'PREMIUM';
  },

  // Получение цвета VIP бейджа
  getVipBadgeColor: (vipType) => {
    switch (vipType) {
      case 'VIP': return '#ffd700';
      case 'PREMIUM': return '#9b59b6';
      default: return null;
    }
  },

  // Получение иконки VIP бейджа
  getVipBadgeIcon: (vipType) => {
    switch (vipType) {
      case 'VIP': return '👑';
      case 'PREMIUM': return '💎';
      default: return null;
    }
  },

  // Получение информации о пользователе
  getUserInfo: async (login) => {
    try {
      const response = await apiClient.get(`/users/profile/${login}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }
};

// Экспорт всех API групп для удобства
export const api = {
  auth: authAPI,
  users: usersAPI,
  swipe: swipeAPI,
  catalog: catalogAPI,
  chat: chatAPI,
  ads: adsAPI,
  admin: adminAPI,
  notifications: notificationsAPI,
  gifts: giftsAPI,
  clubs: clubsAPI,
  subscriptions: subscriptionsAPI,
  rating: ratingAPI,
  reactions: reactionsAPI,
  uploads: uploadsAPI,
  utils: apiUtils
};

export default apiClient;