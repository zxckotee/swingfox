import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clubApi, clubAuth } from '../services/clubApi';
import { chatAPI } from '../services/api';
import toast from 'react-hot-toast';
import '../styles/ClubChats.css';

// Иконки
const ChatBubbleLeftRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    <path d="M13 8H7"/>
    <path d="M17 12H7"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
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

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const ClubChats = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Проверяем аутентификацию клуба
    if (!clubAuth.isAuthenticated()) {
      navigate('/club/login');
      return;
    }
    
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadChats(),
        loadEvents()
      ]);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      toast.error('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const loadChats = async () => {
    try {
      const chatsData = await clubApi.getClubChats();
      setChats(Array.isArray(chatsData.chats) ? chatsData.chats : (Array.isArray(chatsData) ? chatsData : []));
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
      setChats([]);
    }
  };

  const loadEvents = async () => {
    try {
      const eventsData = await clubApi.getEvents({ limit: 100 });
      setEvents(Array.isArray(eventsData.events) ? eventsData.events : (Array.isArray(eventsData) ? eventsData : []));
    } catch (error) {
      console.error('Ошибка загрузки мероприятий:', error);
      setEvents([]);
    }
  };

  const handleViewChat = (chat) => {
    console.log('Opening chat:', chat);
    
    if (!chat.id) {
      toast.error('Ошибка: ID чата не найден');
      return;
    }
    
    // Переходим к чату клуба с участником
    navigate(`/club/chat/${chat.id}`, {
      state: {
        chatData: {
          id: chat.id,
          event_id: chat.event_id,
          user_id: chat.user_id,
          user: chat.user,
          event_title: chat.event_title,
          club_id: chat.club_id
        }
      }
    });
  };

  const getEventTitle = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.title : `Мероприятие #${eventId}`;
  };

  const getStatusText = (status) => {
    const statusMap = {
      'confirmed': 'Подтвержден',
      'pending': 'Ожидает подтверждения',
      'cancelled': 'Отменен',
      'attended': 'Присутствовал',
      'no_show': 'Не явился',
      'unknown': 'Не зарегистрирован',
      'invited': 'Приглашен',
      'maybe': 'Возможно придет',
      'declined': 'Отклонил'
    };
    return statusMap[status] || 'Статус неизвестен';
  };

  const getStatusClass = (status) => {
    const classMap = {
      'confirmed': 'status-confirmed',
      'pending': 'status-pending',
      'cancelled': 'status-cancelled',
      'attended': 'status-attended',
      'no_show': 'status-no-show',
      'unknown': 'status-unknown',
      'invited': 'status-invited',
      'maybe': 'status-maybe',
      'declined': 'status-declined'
    };
    return classMap[status] || 'status-unknown';
  };

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.user?.login?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         chat.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         getEventTitle(chat.event_id).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || chat.participation_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="club-chats-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка чатов...</p>
      </div>
    );
  }

  return (
    <div className="club-chats">
      {/* Header */}
      <div className="chats-header">
        <div className="chats-header-content">
          <div className="header-content">
            <h1>Чаты с участниками</h1>
            <p>Управление чатами с участниками ваших мероприятий</p>
          </div>
          <Link to="/club/dashboard" className="btn btn-secondary">
            ← Назад к дашборду
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="chats-stats">
        <div className="stat-card">
          <h3>Всего чатов</h3>
          <span className="stat-number">{chats.length}</span>
        </div>
        <div className="stat-card">
          <h3>Активных чатов</h3>
          <span className="stat-number">{chats.filter(chat => chat.last_message_at).length}</span>
        </div>
        <div className="stat-card">
          <h3>Новых сообщений</h3>
          <span className="stat-number">{chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0)}</span>
        </div>
        <div className="stat-card">
          <h3>Мероприятий</h3>
          <span className="stat-number">{events.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="chats-filters">
        <div className="search-box">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            placeholder="Поиск по участникам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <div className="filter-item">
            <FilterIcon className="filter-icon" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Все статусы</option>
              <option value="confirmed">Подтвержден</option>
              <option value="pending">Ожидает подтверждения</option>
              <option value="cancelled">Отменен</option>
              <option value="attended">Присутствовал</option>
              <option value="no_show">Не явился</option>
              <option value="unknown">Не зарегистрирован</option>
              <option value="invited">Приглашен</option>
              <option value="maybe">Возможно придет</option>
              <option value="declined">Отклонил</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chats List */}
      <div className="chats-content">
        {filteredChats.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3>Нет чатов</h3>
            <p>
              {searchQuery || statusFilter !== 'all'
                ? 'Не найдено чатов по заданным критериям'
                : 'Пока нет чатов с участниками мероприятий'
              }
            </p>
          </div>
        ) : (
          <div className="chats-grid">
            {filteredChats.map((chat, index) => (
              <div key={`${chat.id}-${chat.event_id}-${chat.user_id}-${index}`} className="chat-card">
                <div className="chat-header">
                  <div className="chat-user-info">
                    <div className="user-avatar">
                      <img
                        src={chat.user?.ava ? `/uploads/${chat.user.ava}` : '/uploads/no_photo.jpg'}
                        alt={chat.user?.login}
                        onError={(e) => {
                          e.target.src = '/uploads/no_photo.jpg';
                        }}
                      />
                    </div>
                    <div className="user-details">
                      <h3>@{chat.user?.login || chat.user_id || 'Неизвестный пользователь'}</h3>
                      <p className="user-email">{chat.user?.email || 'Email не указан'}</p>
                    </div>
                  </div>
                  <div className="chat-status">
                    <span className={`status-badge ${getStatusClass(chat.participation_status)}`}>
                      {getStatusText(chat.participation_status)}
                    </span>
                  </div>
                </div>
                
                <div className="chat-content">
                  <div className="event-info">
                    <div className="event-title">
                      <CalendarIcon className="icon" />
                      <span>{getEventTitle(chat.event_id)}</span>
                    </div>
                    <div className="event-date">
                      <ClockIcon className="icon" />
                      <span>
                        {chat.event_date ? new Date(chat.event_date).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }) : 'Дата не указана'}
                      </span>
                    </div>
                  </div>
                  
                  {chat.last_message && (
                    <div className="last-message">
                      <p className="message-preview">
                        {chat.last_message.length > 100 
                          ? `${chat.last_message.substring(0, 100)}...` 
                          : chat.last_message
                        }
                      </p>
                      <span className="message-time">
                        {chat.last_message_at ? new Date(chat.last_message_at).toLocaleString('ru-RU') : 'Время неизвестно'}
                      </span>
                    </div>
                  )}
                  
                  {chat.unread_count > 0 && (
                    <div className="unread-badge">
                      {chat.unread_count}
                    </div>
                  )}
                </div>
                
                <div className="chat-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleViewChat(chat)}
                  >
                    <EyeIcon className="icon" />
                    Открыть чат
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubChats;
