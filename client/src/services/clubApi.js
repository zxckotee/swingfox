// Club API Service
const API_BASE_URL = '/api/club';

// Флаг для предотвращения повторных редиректов
let isClubRedirecting = false;

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('clubToken');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      let errorMessage = 'API Error';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || `HTTP ${response.status}: ${response.statusText}`;
        
        // Обработка ошибок авторизации
        const isInvalidToken = errorMessage.includes('Недействительный токен') || 
                              errorMessage.includes('Invalid token') ||
                              errorMessage.includes('Token expired');
        
        if ((response.status === 401 || isInvalidToken) && !isClubRedirecting) {
          isClubRedirecting = true;
          localStorage.removeItem('clubToken');
          
          // Перенаправляем на страницу входа клуба
          window.location.href = '/club/login';
          
          // Сбрасываем флаг через некоторое время
          setTimeout(() => {
            isClubRedirecting = false;
          }, 1000);
          
          throw new Error('Недействительный токен');
        }
      } catch (parseError) {
        // Если не удалось распарсить JSON, проверяем только статус
        if (response.status === 401 && !isClubRedirecting) {
          isClubRedirecting = true;
          localStorage.removeItem('clubToken');
          window.location.href = '/club/login';
          setTimeout(() => {
            isClubRedirecting = false;
          }, 1000);
          throw new Error('Недействительный токен');
        }
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      console.error('API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        config
      });
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const clubApi = {
  // Authentication
  register: async (clubData) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(clubData)
    });
  },

  login: async (credentials) => {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (response.token) {
      localStorage.setItem('clubToken', response.token);
    }
    
    return response;
  },

  logout: async () => {
    try {
      await apiCall('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('clubToken');
    }
  },

  getProfile: async () => {
    return apiCall('/auth/profile');
  },

  updateProfile: async (profileData) => {
    return apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  // Events
  getEvents: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/events/events${queryString ? `?${queryString}` : ''}`);
  },

  getEvent: async (eventId) => {
    return apiCall(`/events/events/${eventId}`);
  },

  createEvent: async (eventData) => {
    return apiCall('/events/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  },

  updateEvent: async (eventId, eventData) => {
    return apiCall(`/events/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData)
    });
  },

  deleteEvent: async (eventId) => {
    return apiCall(`/events/events/${eventId}`, {
      method: 'DELETE'
    });
  },

  // Event Participants
  getEventParticipants: async (eventId) => {
    return apiCall(`/events/events/${eventId}/participants`);
  },

  updateParticipantStatus: async (eventId, userId, status) => {
    return apiCall(`/events/events/${eventId}/participants/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  removeParticipant: async (eventId, userId) => {
    return apiCall(`/events/events/${eventId}/participants/${userId}`, {
      method: 'DELETE'
    });
  },

  // Event Applications
  applyToEvent: async (eventId, applicationData) => {
    return apiCall(`/events/events/${eventId}/apply`, {
      method: 'POST',
      body: JSON.stringify(applicationData)
    });
  },

  getMyApplications: async () => {
    return apiCall('/user-events/applications');
  },

  cancelApplication: async (eventId) => {
    return apiCall(`/user-events/events/${eventId}/cancel`, {
      method: 'POST'
    });
  },

  inviteParticipants: async (eventId, userIds) => {
    return apiCall(`/events/events/${eventId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ user_ids: userIds })
    });
  },

  removeParticipant: async (eventId, userId) => {
    return apiCall(`/events/events/${eventId}/participants/${userId}`, {
      method: 'DELETE'
    });
  },

  // Event Images
  uploadEventAvatar: async (eventId, formData) => {
    const token = localStorage.getItem('clubToken');
    
    const response = await fetch(`${API_BASE_URL}/events/events/${eventId}/avatar`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload Error');
    }
    
    return await response.json();
  },

  uploadEventImages: async (eventId, formData) => {
    const token = localStorage.getItem('clubToken');
    
    const response = await fetch(`${API_BASE_URL}/events/events/${eventId}/images`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload Error');
    }
    
    return await response.json();
  },

  deleteEventImage: async (eventId, filename) => {
    return apiCall(`/events/events/${eventId}/images/${filename}`, {
      method: 'DELETE'
    });
  },

  // Ads
  getAds: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/ads/ads${queryString ? `?${queryString}` : ''}`);
  },

  getAd: async (adId) => {
    return apiCall(`/ads/ads/${adId}`);
  },

  createAd: async (adData) => {
    return apiCall('/ads/ads', {
      method: 'POST',
      body: JSON.stringify(adData)
    });
  },

  updateAd: async (adId, adData) => {
    return apiCall(`/ads/ads/${adId}`, {
      method: 'PUT',
      body: JSON.stringify(adData)
    });
  },

  deleteAd: async (adId) => {
    return apiCall(`/ads/ads/${adId}`, {
      method: 'DELETE'
    });
  },

  getAdStats: async () => {
    return apiCall('/ads/ads/stats/overview');
  },

  // Analytics
  getAnalytics: async (type = 'overview', period = 'week') => {
    return apiCall(`/analytics/${type}?period=${period}`);
  },


  // Bots
  getBots: async () => {
    return apiCall('/bots');
  },

  getBot: async (botId) => {
    return apiCall(`/bots/${botId}`);
  },

  createBot: async (botData) => {
    return apiCall('/bots', {
      method: 'POST',
      body: JSON.stringify(botData)
    });
  },

  updateBot: async (botId, botData) => {
    return apiCall(`/bots/${botId}`, {
      method: 'PUT',
      body: JSON.stringify(botData)
    });
  },

  updateBotSettings: async (botId, settings) => {
    return apiCall(`/bots/${botId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  toggleBot: async (botId) => {
    return apiCall(`/bots/${botId}/toggle`, {
      method: 'PUT'
    });
  },

  deleteBot: async (botId) => {
    return apiCall(`/bots/${botId}`, {
      method: 'DELETE'
    });
  },

  getBotLogs: async (botId) => {
    return apiCall(`/bots/${botId}/logs`);
  },

  // Bot Actions
  sendAutoInvites: async (eventId) => {
    return apiCall(`/bots/auto-invites/${eventId}`, {
      method: 'POST'
    });
  },

  sendReminders: async () => {
    return apiCall('/bots/reminders', {
      method: 'POST'
    });
  },

  generateRecommendations: async () => {
    return apiCall('/bots/recommendations', {
      method: 'POST'
    });
  },

  updateStats: async () => {
    return apiCall('/bots/update-stats', {
      method: 'POST'
    });
  },

  getBotStats: async () => {
    return apiCall('/bots/stats/overview');
  },

  // User Events (Public API)
  getPublicEvents: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/user-events/public/events${queryString ? `?${queryString}` : ''}`);
  },

  getPublicEvent: async (eventId) => {
    return apiCall(`/user-events/events/${eventId}`);
  },

  joinEvent: async (eventId) => {
    return apiCall(`/user-events/events/${eventId}/join`, {
      method: 'POST'
    });
  },

  leaveEvent: async (eventId) => {
    return apiCall(`/user-events/events/${eventId}/leave`, {
      method: 'DELETE'
    });
  },

  updateEventStatus: async (eventId, status) => {
    return apiCall(`/user-events/events/${eventId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  getUserEvents: async () => {
    return apiCall('/user-events/user/events');
  },

  getRecommendations: async () => {
    return apiCall('/user-events/recommendations');
  },

  searchEvents: async (query, filters = {}) => {
    const params = { q: query, ...filters };
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/user-events/search/events?${queryString}`);
  },


  // Public Clubs
  getPublicClubs: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/user-events/public/clubs${queryString ? `?${queryString}` : ''}`);
  },

  // User Applications
  getUserApplications: async () => {
    return apiCall('/applications/applications/user');
  },

  createApplication: async (clubId, message = '') => {
    return apiCall('/applications/applications', {
      method: 'POST',
      body: JSON.stringify({ club_id: clubId, message })
    });
  },

  uploadClubAvatar: async (formData) => {
    const token = localStorage.getItem('clubToken');
    
    const response = await fetch(`${API_BASE_URL}/auth/profile/avatar`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload Error');
    }
    
    return await response.json();
  },

  updateProfile: async (profileData) => {
    return apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  changePassword: async (passwordData) => {
    console.log('ClubApi.changePassword called with:', passwordData);
    try {
      const result = await apiCall('/auth/password', {
        method: 'PUT',
        body: JSON.stringify(passwordData)
      });
      console.log('ClubApi.changePassword success:', result);
      return result;
    } catch (error) {
      console.error('ClubApi.changePassword error:', error);
      throw error;
    }
  },

  uploadAvatar: async (formData) => {
    const token = localStorage.getItem('clubToken');
    
    const response = await fetch(`${API_BASE_URL}/auth/profile/avatar`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload Error');
    }
    
    return await response.json();
  },

  // Chat methods
  getClubChats: async () => {
    return apiCall('/chats');
  },

  getChatMessages: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/chats/messages${queryString ? `?${queryString}` : ''}`);
  },

  sendChatMessage: async (messageData) => {
    // Если это FormData (с файлами), отправляем как multipart/form-data
    if (messageData instanceof FormData) {
      const token = localStorage.getItem('clubToken');
      
      const response = await fetch(`${API_BASE_URL}/chats/messages`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: messageData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Send Message Error');
      }
      
      return await response.json();
    }
    
    // Если это обычные данные, отправляем как JSON
    return apiCall(`/chats/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData)
    });
  },

  markChatAsRead: async (chatId) => {
    return apiCall(`/chats/${chatId}/read`, {
      method: 'POST'
    });
  },

};

// Auth helper functions
export const clubAuth = {
  isAuthenticated: () => {
    return !!localStorage.getItem('clubToken');
  },

  getToken: () => {
    return localStorage.getItem('clubToken');
  },

  setToken: (token) => {
    localStorage.setItem('clubToken', token);
  },

  removeToken: () => {
    localStorage.removeItem('clubToken');
  },

  // Auto-refresh token if needed
  refreshToken: async () => {
    try {
      const response = await apiCall('/auth/refresh', {
        method: 'POST'
      });
      
      if (response.token) {
        localStorage.setItem('clubToken', response.token);
      }
      
      return response;
    } catch (error) {
      localStorage.removeItem('clubToken');
      throw error;
    }
  },

  // Ads Management
  getAds: async () => {
    return apiCall('/ads/ads');
  },

  createAd: async (adData) => {
    return apiCall('/ads/ads', {
      method: 'POST',
      body: JSON.stringify(adData)
    });
  },

  updateAd: async (adId, adData) => {
    return apiCall(`/ads/ads/${adId}`, {
      method: 'PUT',
      body: JSON.stringify(adData)
    });
  },

  deleteAd: async (adId) => {
    return apiCall(`/ads/ads/${adId}`, {
      method: 'DELETE'
    });
  },


  // Bots Management (дублированные методы удалены - используются основные методы выше)

};

// Error handling
export const handleApiError = (error) => {
  const errorMessage = error.message || '';
  const isInvalidToken = errorMessage.includes('Недействительный токен') || 
                        errorMessage.includes('Invalid token') ||
                        errorMessage.includes('Token expired') ||
                        errorMessage === 'Unauthorized';
  
  if (isInvalidToken) {
    if (!isClubRedirecting) {
      isClubRedirecting = true;
      localStorage.removeItem('clubToken');
      window.location.href = '/club/login';
      
      // Сбрасываем флаг через некоторое время
      setTimeout(() => {
        isClubRedirecting = false;
      }, 1000);
    }
    return;
  }
  
  return error.message || 'Произошла ошибка';
};


