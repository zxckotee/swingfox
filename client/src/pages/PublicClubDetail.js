import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { clubApi } from '../services/clubApi';
import EventApplication from '../components/EventApplication';
import toast from 'react-hot-toast';
import './PublicClubDetail.css';

const PublicClubDetail = () => {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    if (id) {
      loadClubData();
    }
  }, [id]);

  const loadClubData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Загружаем данные клуба
      const clubResponse = await api.clubs.getClub(id);
      setClub(clubResponse.club || clubResponse);
      
      // Загружаем события клуба
      try {
        const eventsResponse = await clubApi.getEvents({ club_id: id, limit: 10 });
        setEvents(eventsResponse.events || []);
      } catch (eventsError) {
        console.warn('Не удалось загрузить события:', eventsError);
        setEvents([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки клуба:', error);
      setError('Клуб не найден или произошла ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const getClubTypeLabel = (type) => {
    const types = {
      'nightclub': 'Ночной клуб',
      'restaurant': 'Ресторан',
      'event_space': 'Event Space',
      'other': 'Другое'
    };
    return types[type] || 'Клуб';
  };

  const getClubTypeIcon = (type) => {
    switch (type) {
      case 'nightclub':
        return '🎵';
      case 'restaurant':
        return '🍽️';
      case 'event_space':
        return '🏢';
      default:
        return '🏛️';
    }
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleApplyToEvent = (event) => {
    setSelectedEvent(event);
    setShowApplicationForm(true);
  };

  const handleCloseApplicationForm = () => {
    setShowApplicationForm(false);
    setSelectedEvent(null);
  };

  const handleApplicationSuccess = () => {
    toast.success('Заявка успешно подана! Организатор рассмотрит её в ближайшее время.');
  };

  if (loading) {
    return (
      <div className="public-club-detail-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка информации о клубе...</p>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="public-club-detail-error">
        <h2>Ошибка загрузки</h2>
        <p>{error || 'Клуб не найден'}</p>
        <Link to="/clubs" className="btn btn-primary">
          Вернуться к списку клубов
        </Link>
      </div>
    );
  }

  return (
    <div className="public-club-detail">
      {/* Header */}
      <div className="club-detail-header">
        <div className="club-detail-back">
          <Link to="/clubs" className="back-link">
            ← Назад к клубам
          </Link>
        </div>
        
        <div className="club-detail-hero">
          <div className="club-hero-avatar">
            <img 
              src={club.avatar ? `/uploads/${club.avatar}` : '/uploads/no_photo.jpg'} 
              alt={club.name}
              onError={(e) => {
                e.target.src = '/uploads/no_photo.jpg';
              }}
            />
          </div>
          
          <div className="club-hero-info">
            <div className="club-type-badge">
              <span className="club-type-icon">{getClubTypeIcon(club.type)}</span>
              <span className="club-type-label">{getClubTypeLabel(club.type)}</span>
            </div>
            
            <h1 className="club-hero-name">{club.name}</h1>
            
            <div className="club-hero-location">
              <span className="location-icon">📍</span>
              <span className="location-text">
                {club.city}, {club.country}
              </span>
            </div>
            
            {club.website && (
              <div className="club-hero-website">
                <a 
                  href={club.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="website-link"
                >
                  🌐 {club.website}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="club-detail-tabs">
        <button 
          className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Информация
        </button>
        <button 
          className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          События ({events.length})
        </button>
      </div>

      {/* Content */}
      <div className="club-detail-content">
        {activeTab === 'info' && (
          <div className="club-info-tab">
            <div className="club-description">
              <h3>О клубе</h3>
              <p>
                {club.description || 'Описание клуба не указано.'}
              </p>
            </div>
            
            <div className="club-contact">
              <h3>Контактная информация</h3>
              {club.email && (
                <div className="contact-item">
                  <strong>Email:</strong> {club.email}
                </div>
              )}
              {club.contact_info && (
                <div className="contact-item">
                  <strong>Дополнительные контакты:</strong> {club.contact_info}
                </div>
              )}
              {club.website && (
                <div className="contact-item">
                  <strong>Веб-сайт:</strong> 
                  <a href={club.website.startsWith('http') ? club.website : `https://${club.website}`} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="website-link">
                    {club.website}
                  </a>
                </div>
              )}
            </div>
            
            <div className="club-details">
              <h3>Детали</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Тип:</span>
                  <span className="detail-value">{getClubTypeLabel(club.type)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Город:</span>
                  <span className="detail-value">{club.city}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Страна:</span>
                  <span className="detail-value">{club.country}</span>
                </div>
                {club.address && (
                  <div className="detail-item">
                    <span className="detail-label">Адрес:</span>
                    <span className="detail-value">{club.address}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Дата создания:</span>
                  <span className="detail-value">
                    {club.date_created ? new Date(club.date_created).toLocaleDateString('ru-RU') : 'Не указана'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'events' && (
          <div className="club-events-tab">
            <h3>Предстоящие события</h3>
            
            {events.length === 0 ? (
              <div className="no-events">
                <div className="no-events-icon">📅</div>
                <p>У этого клуба пока нет запланированных событий</p>
              </div>
            ) : (
              <div className="events-list">
                {events.map(event => (
                  <div key={event.id} className="event-card">
                    <div className="event-date">
                      {formatEventDate(event.date)}
                    </div>
                    <div className="event-info">
                      <h4 className="event-title">{event.title}</h4>
                      {event.description && (
                        <p className="event-description">{event.description}</p>
                      )}
                      <div className="event-details">
                        <span className="event-participants">
                          {event.max_participants ? `До ${event.max_participants} участников` : 'Без ограничений'}
                        </span>
                      </div>
                      
                      <div className="event-actions">
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleApplyToEvent(event)}
                        >
                          Подать заявку
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Event Application Modal */}
      {showApplicationForm && selectedEvent && (
        <EventApplication
          event={selectedEvent}
          onClose={handleCloseApplicationForm}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
};

export default PublicClubDetail;
