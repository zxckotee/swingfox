import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clubApi, clubAuth } from '../services/clubApi';
import EventForm from '../components/EventForm';
import ClubAvatarCropper from '../components/UI/ClubAvatarCropper';
import EventDetailsModal from '../components/EventDetailsModal';
import '../styles/ClubDashboard.css';

// Иконки
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const ChartBarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 20V10"/>
    <path d="M12 20V4"/>
    <path d="M6 20v-6"/>
  </svg>
);

const CogIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const MapPinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const ClubDashboard = () => {
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [stats, setStats] = useState({});
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Проверяем аутентификацию клуба
    if (!clubAuth.isAuthenticated()) {
      navigate('/club/login');
      return;
    }
    
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      const [clubData, statsData, eventsData] = await Promise.all([
        clubApi.getProfile(),
        clubApi.getAnalytics('overview'),
        clubApi.getEvents({ limit: 5 })
      ]);
      
      setClub(clubData.club || clubData);
      setStats(statsData.analytics || statsData);
      setRecentEvents(Array.isArray(eventsData.events) ? eventsData.events : (Array.isArray(eventsData) ? eventsData : []));
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      
      // Если ошибка аутентификации, перенаправляем на страницу входа
      if (error.message === 'Unauthorized' || error.message.includes('токен') || error.message.includes('token')) {
        clubAuth.removeToken();
        navigate('/club/login');
        return;
      }
      
      // Устанавливаем fallback данные
      setClub(null);
      setStats({});
      setRecentEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setShowCreateEventModal(true);
  };

  const handleCloseCreateEventModal = () => {
    setShowCreateEventModal(false);
  };

  const handleEventCreated = () => {
    setShowCreateEventModal(false);
    // Перезагружаем данные дашборда
    loadDashboardData();
  };

  const handleSettings = () => {
    window.location.href = '/club/settings';
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImageFile(file);
      setShowAvatarCropper(true);
    }
  };

  const handleAvatarCrop = async (cropData) => {
    try {
      const formData = new FormData();
      formData.append('avatar', cropData.file);
      
      // Добавляем параметры обрезки
      if (cropData.cropParams) {
        formData.append('x', cropData.cropParams.x);
        formData.append('y', cropData.cropParams.y);
        formData.append('width', cropData.cropParams.width);
        formData.append('height', cropData.cropParams.height);
      }
      
      const response = await clubApi.uploadClubAvatar(formData);
      
      if (response.success) {
        // Обновляем аватар в состоянии
        setClub(prev => ({
          ...prev,
          avatar: response.filename
        }));
      }
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      alert('Ошибка при загрузке аватара');
    }
  };

  const handleCloseAvatarCropper = () => {
    setShowAvatarCropper(false);
    setSelectedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleShowEventDetails = (eventId) => {
    console.log('=== handleShowEventDetails called ===');
    console.log('Event ID:', eventId);
    console.log('Current showEventDetails state:', showEventDetails);
    console.log('Current selectedEventId state:', selectedEventId);
    
    setSelectedEventId(eventId);
    setShowEventDetails(true);
    
    console.log('States updated, showEventDetails should be true now');
  };

  const handleCloseEventDetails = () => {
    setShowEventDetails(false);
    setSelectedEventId(null);
  };

  if (loading) {
    return (
      <div className="club-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка дашборда...</p>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="club-dashboard-error">
        <h2>Ошибка загрузки данных клуба</h2>
        <p>Не удалось загрузить информацию о клубе. Проверьте подключение к интернету и попробуйте снова.</p>
        <button onClick={loadDashboardData} className="btn btn-primary">
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="club-dashboard">
      {/* Header */}
      <div className="club-dashboard-header">
        <div className="club-info">
          <div className="club-avatar-panoramic" onClick={handleAvatarClick}>
            <img 
              src={club?.avatar ? `/uploads/${club.avatar}` : '/uploads/no_photo.jpg'} 
              alt={club?.name}
              onError={(e) => {
                e.target.src = '/uploads/no_photo.jpg';
              }}
            />
            <div className="avatar-overlay">
              <span>📷</span>
              <span>Изменить аватар</span>
            </div>
          </div>
          <div className="club-details">
            <h1>{club?.name}</h1>
            <p className="club-location">
              <MapPinIcon className="icon" />
              {club?.location}
            </p>
            <p className="club-type">{club?.type}</p>
          </div>
        </div>
        <div className="club-actions">
          <button className="btn btn-primary" onClick={handleCreateEvent}>
            <PlusIcon className="icon" />
            Создать мероприятие
          </button>
          <button className="btn btn-secondary" onClick={handleSettings}>
            <CogIcon className="icon" />
            Настройки
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon events">
            <CalendarIcon />
          </div>
          <div className="stat-content">
            <h3>{stats.total_events || 0}</h3>
            <p>Всего мероприятий</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon participants">
            <UsersIcon />
          </div>
          <div className="stat-content">
            <h3>{stats.total_participants || 0}</h3>
            <p>Участников</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon revenue">
            <ChartBarIcon />
          </div>
          <div className="stat-content">
            <h3>{stats.total_revenue || 0} ₽</h3>
            <p>Доход</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon rating">
            <StarIcon />
          </div>
          <div className="stat-content">
            <h3>{stats.average_rating || 0}</h3>
            <p>Рейтинг</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Быстрые действия</h2>
        <div className="actions-grid">
          <button className="action-card" onClick={handleCreateEvent}>
            <CalendarIcon className="icon" />
            <h3>Создать мероприятие</h3>
            <p>Организуйте новое событие</p>
          </button>
          
          <Link to="/club/events" className="action-card">
            <BellIcon className="icon" />
            <h3>Мероприятия</h3>
            <p>Управление событиями</p>
          </Link>
          
          <Link to="/club/analytics" className="action-card">
            <ChartBarIcon className="icon" />
            <h3>Аналитика</h3>
            <p>Просмотр статистики</p>
          </Link>
          
          <Link to="/club/participants" className="action-card">
            <UsersIcon className="icon" />
            <h3>Участники</h3>
            <p>Управление участниками</p>
          </Link>
        </div>
      </div>

      {/* Recent Events */}
      <div className="recent-events">
        <div className="section-header">
          <h2>Последние мероприятия</h2>
          <Link to="/club/events" className="view-all">Посмотреть все</Link>
        </div>
        
        <div className="events-grid">
          {(recentEvents || []).map(event => (
            <div key={event.id} className="event-card">
              <div className="event-header">
                <h3>{event.title}</h3>
                <span className={`event-status ${event.status}`}>
                  {event.status === 'upcoming' ? 'Предстоит' : 
                   event.status === 'ongoing' ? 'Идет' : 'Завершено'}
                </span>
              </div>
              
              <div className="event-details">
                <p className="event-date">
                  <ClockIcon className="icon" />
                  {new Date(event.date).toLocaleDateString('ru-RU')}
                </p>
                <p className="event-location">
                  <MapPinIcon className="icon" />
                  {event.location}
                </p>
                <p className="event-participants">
                  <UsersIcon className="icon" />
                  {event.max_participants && event.max_participants > 0 
                    ? `${event.current_participants || 0}/${event.max_participants} участников`
                    : `${event.current_participants || 0} участников`
                  }
                </p>
              </div>
              
              <div className="event-actions">
                <div 
                  className="btn btn-sm btn-outline"
                  onClick={(e) => {
                    console.log('=== EYE BUTTON CLICKED ===');
                    console.log('Event object:', e);
                    console.log('Event target:', e.target);
                    console.log('Event currentTarget:', e.currentTarget);
                    console.log('Event ID:', event.id);
                    
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('About to call handleShowEventDetails');
                    handleShowEventDetails(event.id);
                    console.log('handleShowEventDetails called');
                    
                    return false;
                  }}
                  title="Просмотр деталей"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  👁️
                </div>
                <div 
                  className="btn btn-sm btn-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Details button clicked for event:', event.id);
                    handleShowEventDetails(event.id);
                    return false;
                  }}
                  title="Подробнее"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Подробнее
                </div>
                <Link 
                  to="/club/events" 
                  className="btn btn-sm btn-secondary"
                  onClick={(e) => e.stopPropagation()}
                >
                  Редактировать
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="notifications-panel">
        <h2>Уведомления</h2>
        <div className="notifications-list">
          <div className="notification-item">
            <div className="notification-icon">
              <UsersIcon />
            </div>
            <div className="notification-content">
              <p>Новый участник присоединился к мероприятию "Вечеринка в стиле 80-х"</p>
              <span className="notification-time">2 минуты назад</span>
            </div>
          </div>
          
          <div className="notification-item">
            <div className="notification-icon">
              <BellIcon />
            </div>
            <div className="notification-content">
              <p>Заявка на вступление в клуб от пользователя @dancer123</p>
              <span className="notification-time">15 минут назад</span>
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <EventForm
              onCancel={handleCloseCreateEventModal}
              onSave={handleEventCreated}
            />
          </div>
        </div>
      )}

        {/* Avatar Cropper Modal */}
        <ClubAvatarCropper
          isOpen={showAvatarCropper}
          onClose={handleCloseAvatarCropper}
          imageFile={selectedImageFile}
          onCrop={handleAvatarCrop}
          aspectRatio={590/160}
        />

        {/* Event Details Modal */}
        <EventDetailsModal
          isOpen={showEventDetails}
          onClose={handleCloseEventDetails}
          eventId={selectedEventId}
        />
      </div>
    );
  };

export default ClubDashboard;
