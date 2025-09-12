import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clubApi, clubAuth } from '../services/clubApi';
import toast from 'react-hot-toast';
import '../styles/ClubParticipants.css';

// Иконки
const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const MessageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const ClubParticipants = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showParticipantDetails, setShowParticipantDetails] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  useEffect(() => {
    // Проверяем аутентификацию клуба
    if (!clubAuth.isAuthenticated()) {
      navigate('/club/login');
      return;
    }
    
    loadEvents();
  }, [navigate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsData = await clubApi.getEvents({ limit: 100 });
      setEvents(Array.isArray(eventsData.events) ? eventsData.events : (Array.isArray(eventsData) ? eventsData : []));
    } catch (error) {
      console.error('Ошибка загрузки мероприятий:', error);
      toast.error('Ошибка при загрузке мероприятий');
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async (eventId) => {
    try {
      setParticipantsLoading(true);
      const participantsData = await clubApi.getEventParticipants(eventId);
      setParticipants(Array.isArray(participantsData.participants) ? participantsData.participants : (Array.isArray(participantsData) ? participantsData : []));
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
      toast.error('Ошибка при загрузке участников');
      setParticipants([]);
    } finally {
      setParticipantsLoading(false);
    }
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    loadParticipants(event.id);
  };

  const handleStatusChange = async (participant, newStatus) => {
    try {
      await clubApi.updateParticipantStatus(selectedEvent.id, participant.user_id, newStatus);
      toast.success(`Статус участника изменен на "${getStatusText(newStatus)}"`);
      
      // Обновляем список участников
      setParticipants(prev => prev.map(p => 
        p.id === participant.id ? { ...p, status: newStatus } : p
      ));
    } catch (error) {
      console.error('Ошибка изменения статуса:', error);
      toast.error('Ошибка при изменении статуса участника');
    }
  };

  const handleRemoveParticipant = async (participant) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого участника?')) {
      return;
    }

    try {
      await clubApi.removeParticipant(selectedEvent.id, participant.user_id);
      toast.success('Участник удален');
      
      // Обновляем список участников
      setParticipants(prev => prev.filter(p => p.id !== participant.id));
    } catch (error) {
      console.error('Ошибка удаления участника:', error);
      toast.error('Ошибка при удалении участника');
    }
  };

  const handleOpenChat = (participant) => {
    // Создаем данные чата для навигации
    const chatData = {
      id: `temp_${selectedEvent.id}_${participant.user_id}`,
      event_id: selectedEvent.id,
      user_id: participant.user_id,
      user: {
        login: participant.user?.login,
        ava: participant.user?.ava,
        email: participant.user?.email
      },
      event_title: selectedEvent.title,
      event_date: selectedEvent.date,
      participation_status: participant.status,
      last_message: '',
      last_message_at: null,
      unread_count: 0
    };

    // Переходим к чату
    navigate(`/club/chat/${chatData.id}`, {
      state: { chatData }
    });
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Ожидает подтверждения',
      'confirmed': 'Подтвержден',
      'cancelled': 'Отменен',
      'attended': 'Присутствовал',
      'no_show': 'Не явился'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      'pending': 'status-pending',
      'confirmed': 'status-confirmed',
      'cancelled': 'status-cancelled',
      'attended': 'status-attended',
      'no_show': 'status-no-show'
    };
    return classMap[status] || 'status-unknown';
  };

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.user?.login?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         participant.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || participant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="club-participants-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка мероприятий...</p>
      </div>
    );
  }

  return (
    <div className="club-participants">
      {/* Header */}
      <div className="participants-header">
        <div className="header-content">
          <h1>Управление участниками</h1>
          <p>Управление участниками ваших мероприятий</p>
        </div>
        <Link to="/club/dashboard" className="btn btn-secondary">
          ← Назад к дашборду
        </Link>
      </div>

      <div className="participants-layout">
        {/* Events List */}
        <div className="events-sidebar">
          <div className="sidebar-header">
            <h2>Мероприятия</h2>
            <span className="events-count">{events.length}</span>
          </div>
          
          <div className="events-list">
            {events.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <p>Нет мероприятий</p>
              </div>
            ) : (
              events.map(event => (
                <div
                  key={event.id}
                  className={`event-item ${selectedEvent?.id === event.id ? 'active' : ''}`}
                  onClick={() => handleEventSelect(event)}
                >
                  <div className="event-header">
                    <h3>{event.title}</h3>
                    <span className="event-date">
                      {new Date(event.date).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <div className="event-meta">
                    <span className="participants-count">
                      <UsersIcon className="icon" />
                      {event.current_participants || 0}/{event.max_participants || '∞'}
                    </span>
                    <span className="event-location">
                      📍 {event.location}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Participants Management */}
        <div className="participants-main">
          {!selectedEvent ? (
            <div className="no-selection">
              <div className="no-selection-icon">👥</div>
              <h2>Выберите мероприятие</h2>
              <p>Выберите мероприятие из списка слева для управления участниками</p>
            </div>
          ) : (
            <>
              {/* Event Info */}
              <div className="selected-event-info">
                <div className="event-details">
                  <h2>{selectedEvent.title}</h2>
                  <div className="event-meta">
                    <span className="event-date">
                      <CalendarIcon className="icon" />
                      {new Date(selectedEvent.date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="event-location">
                      📍 {selectedEvent.location}
                    </span>
                    <span className="event-participants">
                      <UsersIcon className="icon" />
                      {selectedEvent.current_participants || 0}/{selectedEvent.max_participants || '∞'} участников
                    </span>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="participants-filters">
                <div className="search-box">
                  <SearchIcon className="search-icon" />
                  <input
                    type="text"
                    placeholder="Поиск участников..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="status-filter">
                  <FilterIcon className="filter-icon" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Все статусы</option>
                    <option value="pending">Ожидает подтверждения</option>
                    <option value="confirmed">Подтвержден</option>
                    <option value="cancelled">Отменен</option>
                    <option value="attended">Присутствовал</option>
                    <option value="no_show">Не явился</option>
                  </select>
                </div>
              </div>

              {/* Participants List */}
              <div className="participants-list">
                {participantsLoading ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Загрузка участников...</p>
                  </div>
                ) : filteredParticipants.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>Нет участников</h3>
                    <p>
                      {searchQuery || statusFilter !== 'all' 
                        ? 'Не найдено участников по заданным критериям'
                        : 'На это мероприятие пока никто не записался'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="participants-grid">
                    {filteredParticipants.map(participant => (
                      <div key={participant.id} className="participant-card">
                        <div className="participant-header">
                          <div className="participant-avatar">
                            <img
                              src={participant.user?.ava ? `/uploads/${participant.user.ava}` : '/uploads/no_photo.jpg'}
                              alt={participant.user?.login}
                              onError={(e) => {
                                e.target.src = '/uploads/no_photo.jpg';
                              }}
                            />
                          </div>
                          <div className="participant-info">
                            <h3>@{participant.user?.login}</h3>
                            <p className="participant-email">{participant.user?.email}</p>
                            <span className={`status-badge ${getStatusClass(participant.status)}`}>
                              {getStatusText(participant.status)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="participant-meta">
                          <div className="meta-item">
                            <ClockIcon className="icon" />
                            <span>Записался: {new Date(participant.created_at).toLocaleDateString('ru-RU')}</span>
                          </div>
                          {participant.message && (
                            <div className="participant-message">
                              <strong>Сообщение:</strong> {participant.message}
                            </div>
                          )}
                        </div>
                        
                        <div className="participant-actions">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleOpenChat(participant)}
                          >
                            <MessageIcon className="icon" />
                            Открыть чат
                          </button>
                          
                          {participant.status === 'pending' && (
                            <>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleStatusChange(participant, 'confirmed')}
                              >
                                <CheckIcon className="icon" />
                                Подтвердить
                              </button>
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => handleStatusChange(participant, 'cancelled')}
                              >
                                <XIcon className="icon" />
                                Отклонить
                              </button>
                            </>
                          )}
                          
                          {participant.status === 'confirmed' && (
                            <>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleStatusChange(participant, 'attended')}
                              >
                                <CheckIcon className="icon" />
                                Отметить присутствие
                              </button>
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => handleStatusChange(participant, 'no_show')}
                              >
                                <XIcon className="icon" />
                                Не явился
                              </button>
                            </>
                          )}
                          
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemoveParticipant(participant)}
                          >
                            <XIcon className="icon" />
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubParticipants;
