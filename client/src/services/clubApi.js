// Club API Service
const API_BASE_URL = '/api/club';

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
      } catch (parseError) {
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

  updateParticipantStatus: async (eventId, participantId, status) => {
    return apiCall(`/events/events/${eventId}/participants/${participantId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  removeParticipant: async (eventId, participantId) => {
    return apiCall(`/events/events/${eventId}/participants/${participantId}`, {
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

  // Applications
  getApplications: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/applications/applications${queryString ? `?${queryString}` : ''}`);
  },

  getApplication: async (applicationId) => {
    return apiCall(`/applications/applications/${applicationId}`);
  },

  approveApplication: async (applicationId) => {
    return apiCall(`/applications/applications/${applicationId}/approve`, {
      method: 'PUT'
    });
  },

  rejectApplication: async (applicationId, reason = '') => {
    return apiCall(`/applications/applications/${applicationId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  },

  bulkApproveApplications: async (applicationIds) => {
    return apiCall('/applications/applications/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ application_ids: applicationIds })
    });
  },

  bulkRejectApplications: async (applicationIds, reason = '') => {
    return apiCall('/applications/applications/bulk-reject', {
      method: 'POST',
      body: JSON.stringify({ application_ids: applicationIds, reason })
    });
  },

  getApplicationStats: async () => {
    return apiCall('/applications/applications/stats');
  },

  // Bots
  getBots: async () => {
    return apiCall('/bots/bots');
  },

  getBot: async (botId) => {
    return apiCall(`/bots/bots/${botId}`);
  },

  createBot: async (botData) => {
    return apiCall('/bots/bots', {
      method: 'POST',
      body: JSON.stringify(botData)
    });
  },

  updateBotSettings: async (botId, settings) => {
    return apiCall(`/bots/bots/${botId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  toggleBot: async (botId) => {
    return apiCall(`/bots/bots/${botId}/toggle`, {
      method: 'PUT'
    });
  },

  deleteBot: async (botId) => {
    return apiCall(`/bots/bots/${botId}`, {
      method: 'DELETE'
    });
  },

  getBotLogs: async (botId) => {
    return apiCall(`/bots/bots/${botId}/logs`);
  },

  // Bot Actions
  sendAutoInvites: async (eventId) => {
    return apiCall(`/bots/bots/auto-invites/${eventId}`, {
      method: 'POST'
    });
  },

  sendReminders: async () => {
    return apiCall('/bots/bots/reminders', {
      method: 'POST'
    });
  },

  generateRecommendations: async () => {
    return apiCall('/bots/bots/recommendations', {
      method: 'POST'
    });
  },

  updateStats: async () => {
    return apiCall('/bots/bots/update-stats', {
      method: 'POST'
    });
  },

  getBotStats: async () => {
    return apiCall('/bots/bots/stats/overview');
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
  }
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

  // Applications Management
  getApplications: async () => {
    return apiCall('/applications/applications');
  },

  approveApplication: async (applicationId) => {
    return apiCall(`/applications/applications/${applicationId}/approve`, {
      method: 'POST'
    });
  },

  rejectApplication: async (applicationId) => {
    return apiCall(`/applications/applications/${applicationId}/reject`, {
      method: 'POST'
    });
  },

  // Bots Management
  getBots: async () => {
    return apiCall('/bots/bots');
  },

  createBot: async (botData) => {
    return apiCall('/bots/bots', {
      method: 'POST',
      body: JSON.stringify(botData)
    });
  },

  updateBot: async (botId, botData) => {
    return apiCall(`/bots/bots/${botId}`, {
      method: 'PUT',
      body: JSON.stringify(botData)
    });
  },

  deleteBot: async (botId) => {
    return apiCall(`/bots/bots/${botId}`, {
      method: 'DELETE'
    });
  },

  // Participants Management
  getParticipants: async () => {
    return apiCall('/participants');
  },

  updateParticipantRole: async (participantId, role) => {
    return apiCall(`/participants/${participantId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  },

  removeParticipant: async (participantId) => {
    return apiCall(`/participants/${participantId}`, {
      method: 'DELETE'
    });
  }
};

// Error handling
export const handleApiError = (error) => {
  if (error.message === 'Unauthorized') {
    localStorage.removeItem('clubToken');
    window.location.href = '/club/login';
    return;
  }
  
  return error.message || 'Произошла ошибка';
};


