import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clubApi } from '../services/clubApi';
import '../styles/ClubEvents.css';

// Иконки
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const MapPinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
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

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const PencilIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6"/>
    <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const FunnelIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
  </svg>
);

const MagnifyingGlassIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
);

const ClubEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const eventsData = await clubApi.getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Ошибка загрузки мероприятий:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Вы уверены, что хотите удалить это мероприятие?')) {
      try {
        await clubApi.deleteEvent(eventId);
        setEvents(events.filter(event => event.id !== eventId));
      } catch (error) {
        console.error('Ошибка удаления мероприятия:', error);
      }
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'upcoming' && new Date(event.date) > new Date()) ||
                         (filter === 'ongoing' && new Date(event.date) <= new Date() && new Date(event.date) > new Date(Date.now() - 24 * 60 * 60 * 1000)) ||
                         (filter === 'completed' && new Date(event.date) < new Date(Date.now() - 24 * 60 * 60 * 1000));
    
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getEventStatus = (date) => {
    const eventDate = new Date(date);
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    if (eventDate > now) return 'upcoming';
    if (eventDate > oneDayAgo) return 'ongoing';
    return 'completed';
  };

  if (loading) {
    return (
      <div className="club-events-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка мероприятий...</p>
      </div>
    );
  }

  return (
    <div className="club-events">
      {/* Header */}
      <div className="events-header">
        <div className="header-content">
          <h1>Мероприятия клуба</h1>
          <p>Управляйте мероприятиями и событиями вашего клуба</p>
        </div>
        <button 
          className="btn btn-primary create-event-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <PlusIcon className="icon" />
          Создать мероприятие
        </button>
      </div>

      {/* Filters and Search */}
      <div className="events-controls">
        <div className="search-box">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            type="text"
            placeholder="Поиск мероприятий..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Все
          </button>
          <button
            className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            Предстоящие
          </button>
          <button
            className={`filter-btn ${filter === 'ongoing' ? 'active' : ''}`}
            onClick={() => setFilter('ongoing')}
          >
            Идут сейчас
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Завершенные
          </button>
        </div>
      </div>

      {/* Events Grid */}
      <div className="events-container">
        {filteredEvents.length === 0 ? (
          <div className="no-events">
            <CalendarIcon className="no-events-icon" />
            <h3>Мероприятия не найдены</h3>
            <p>Создайте первое мероприятие для вашего клуба</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusIcon className="icon" />
              Создать мероприятие
            </button>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map(event => (
              <div key={event.id} className="event-card">
                <div className="event-header">
                  <div className="event-status-badge">
                    <span className={`status-dot ${getEventStatus(event.date)}`}></span>
                    {getEventStatus(event.date) === 'upcoming' ? 'Предстоит' : 
                     getEventStatus(event.date) === 'ongoing' ? 'Идет' : 'Завершено'}
                  </div>
                  <div className="event-actions">
                    <Link to={`/club/events/${event.id}`} className="action-btn view">
                      <EyeIcon className="icon" />
                    </Link>
                    <Link to={`/club/events/${event.id}/edit`} className="action-btn edit">
                      <PencilIcon className="icon" />
                    </Link>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <TrashIcon className="icon" />
                    </button>
                  </div>
                </div>
                
                <div className="event-content">
                  <h3 className="event-title">{event.title}</h3>
                  <p className="event-description">{event.description}</p>
                  
                  <div className="event-details">
                    <div className="detail-item">
                      <CalendarIcon className="icon" />
                      <span>{new Date(event.date).toLocaleDateString('ru-RU')}</span>
                    </div>
                    
                    <div className="detail-item">
                      <ClockIcon className="icon" />
                      <span>{event.time}</span>
                    </div>
                    
                    <div className="detail-item">
                      <MapPinIcon className="icon" />
                      <span>{event.location}</span>
                    </div>
                    
                    <div className="detail-item">
                      <UsersIcon className="icon" />
                      <span>{event.current_participants}/{event.max_participants} участников</span>
                    </div>
                  </div>
                  
                  {event.price > 0 && (
                    <div className="event-price">
                      <span className="price-label">Стоимость:</span>
                      <span className="price-value">{event.price} ₽</span>
                    </div>
                  )}
                  
                  {event.is_premium && (
                    <div className="premium-badge">
                      <span>Премиум</span>
                    </div>
                  )}
                </div>
                
                <div className="event-footer">
                  <div className="participation-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${(event.current_participants / event.max_participants) * 100}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {Math.round((event.current_participants / event.max_participants) * 100)}% заполнено
                    </span>
                  </div>
                  
                  <Link to={`/club/events/${event.id}/participants`} className="btn btn-sm btn-secondary">
                    Участники
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Создать новое мероприятие</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Форма создания мероприятия будет здесь...</p>
              <p>Для полной реализации нужно создать компонент EventForm</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Отмена
              </button>
              <button className="btn btn-primary">
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubEvents;
