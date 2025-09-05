import React, { useState, useEffect } from 'react';
import { clubApi } from '../services/clubApi';
import '../styles/ClubParticipants.css';

// Иконки
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const CrownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
    <path d="M6 16h12"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
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

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
  </svg>
);

const ClubParticipants = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const response = await clubApi.getParticipants();
      setParticipants(Array.isArray(response.participants) ? response.participants : (Array.isArray(response) ? response : []));
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewParticipant = (participant) => {
    setSelectedParticipant(participant);
    setShowModal(true);
  };

  const handleChangeRole = async (participantId, newRole) => {
    if (window.confirm(`Вы уверены, что хотите изменить роль участника?`)) {
      try {
        await clubApi.updateParticipantRole(participantId, newRole);
        await loadParticipants();
        setShowModal(false);
        setSelectedParticipant(null);
      } catch (error) {
        console.error('Ошибка изменения роли:', error);
        alert('Ошибка при изменении роли участника');
      }
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    if (window.confirm('Вы уверены, что хотите исключить этого участника из клуба?')) {
      try {
        await clubApi.removeParticipant(participantId);
        await loadParticipants();
        setShowModal(false);
        setSelectedParticipant(null);
      } catch (error) {
        console.error('Ошибка исключения участника:', error);
        alert('Ошибка при исключении участника');
      }
    }
  };

  const getRoleBadge = (role) => {
    const roleMap = {
      'owner': { text: 'Владелец', class: 'role-owner', icon: <CrownIcon /> },
      'admin': { text: 'Администратор', class: 'role-admin', icon: <ShieldIcon /> },
      'moderator': { text: 'Модератор', class: 'role-moderator', icon: <ShieldIcon /> },
      'member': { text: 'Участник', class: 'role-member', icon: <UserIcon /> }
    };
    
    const roleInfo = roleMap[role] || { text: role, class: 'role-unknown', icon: <UserIcon /> };
    return (
      <span className={`role-badge ${roleInfo.class}`}>
        {roleInfo.icon}
        {roleInfo.text}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { text: 'Активен', class: 'status-active' },
      'inactive': { text: 'Неактивен', class: 'status-inactive' },
      'banned': { text: 'Заблокирован', class: 'status-banned' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'status-unknown' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = !searchTerm || 
      (participant.user?.name && participant.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (participant.user?.login && participant.user.login.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (participant.user?.email && participant.user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || participant.role === filterRole;
    const matchesStatus = filterStatus === 'all' || participant.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="club-participants">
        <div className="loading">
          <div className="spinner"></div>
          <p>Загрузка участников...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="club-participants">
      <div className="page-header">
        <div className="header-content">
          <h1>Участники клуба</h1>
          <p>Управляйте участниками и их ролями в клубе</p>
        </div>
      </div>

      <div className="participants-stats">
        <div className="stat-card">
          <h3>Всего участников</h3>
          <span className="stat-number">{participants.length}</span>
        </div>
        <div className="stat-card">
          <h3>Администраторов</h3>
          <span className="stat-number">{participants.filter(p => p.role === 'admin' || p.role === 'owner').length}</span>
        </div>
        <div className="stat-card">
          <h3>Модераторов</h3>
          <span className="stat-number">{participants.filter(p => p.role === 'moderator').length}</span>
        </div>
        <div className="stat-card">
          <h3>Активных</h3>
          <span className="stat-number">{participants.filter(p => p.status === 'active').length}</span>
        </div>
      </div>

      <div className="participants-filters">
        <div className="search-box">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            placeholder="Поиск участников..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <FilterIcon className="filter-icon" />
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="all">Все роли</option>
              <option value="owner">Владелец</option>
              <option value="admin">Администратор</option>
              <option value="moderator">Модератор</option>
              <option value="member">Участник</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
              <option value="banned">Заблокированные</option>
            </select>
          </div>
        </div>
      </div>

      <div className="participants-content">
        {filteredParticipants.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>Нет участников</h3>
            <p>
              {searchTerm || filterRole !== 'all' || filterStatus !== 'all'
                ? 'По вашему запросу участники не найдены'
                : 'В клубе пока нет участников'
              }
            </p>
          </div>
        ) : (
          <div className="participants-list">
            {filteredParticipants.map((participant) => (
              <div key={participant.id} className="participant-card">
                <div className="participant-header">
                  <div className="user-info">
                    <div className="user-avatar">
                      {participant.user?.avatar ? (
                        <img src={participant.user.avatar} alt={participant.user.name || participant.user.login} />
                      ) : (
                        <UserIcon />
                      )}
                    </div>
                    <div className="user-details">
                      <h3>{participant.user?.name || participant.user?.login || 'Неизвестный пользователь'}</h3>
                      <p>{participant.user?.email || 'Email не указан'}</p>
                    </div>
                  </div>
                  <div className="participant-badges">
                    {getRoleBadge(participant.role)}
                    {getStatusBadge(participant.status)}
                  </div>
                </div>

                <div className="participant-content">
                  <div className="participant-stats">
                    <div className="stat-item">
                      <CalendarIcon className="icon" />
                      <span>Присоединился: {new Date(participant.joined_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                    {participant.events_attended && (
                      <div className="stat-item">
                        <span>Событий посещено: {participant.events_attended}</span>
                      </div>
                    )}
                    {participant.last_activity && (
                      <div className="stat-item">
                        <span>Последняя активность: {new Date(participant.last_activity).toLocaleDateString('ru-RU')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="participant-footer">
                  <div className="participant-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleViewParticipant(participant)}
                    >
                      Подробнее
                    </button>
                    
                    {participant.role !== 'owner' && (
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleRemoveParticipant(participant.id)}
                      >
                        Исключить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && selectedParticipant && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ParticipantModal
              participant={selectedParticipant}
              onClose={() => {
                setShowModal(false);
                setSelectedParticipant(null);
              }}
              onChangeRole={handleChangeRole}
              onRemove={handleRemoveParticipant}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Модальное окно с подробной информацией об участнике
const ParticipantModal = ({ participant, onClose, onChangeRole, onRemove }) => {
  const [showRoleChange, setShowRoleChange] = useState(false);
  const [newRole, setNewRole] = useState(participant.role);

  const handleRoleChange = () => {
    onChangeRole(participant.id, newRole);
    setShowRoleChange(false);
  };

  return (
    <div className="participant-modal">
      <div className="modal-header">
        <h2>Информация об участнике</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="modal-body">
        <div className="user-profile">
          <div className="user-avatar-large">
            {participant.user?.avatar ? (
              <img src={participant.user.avatar} alt={participant.user.name || participant.user.login} />
            ) : (
              <UserIcon />
            )}
          </div>
          <div className="user-info">
            <h3>{participant.user?.name || participant.user?.login || 'Неизвестный пользователь'}</h3>
            <p>{participant.user?.email || 'Email не указан'}</p>
            {participant.user?.age && <p>Возраст: {participant.user.age}</p>}
            {participant.user?.location && <p>Местоположение: {participant.user.location}</p>}
          </div>
        </div>

        <div className="participant-details">
          <div className="detail-section">
            <h4>Роль в клубе</h4>
            <div className="role-section">
              <span className={`role-badge role-${participant.role}`}>
                {participant.role === 'owner' ? <CrownIcon /> : 
                 participant.role === 'admin' || participant.role === 'moderator' ? <ShieldIcon /> : <UserIcon />}
                {participant.role === 'owner' ? 'Владелец' :
                 participant.role === 'admin' ? 'Администратор' :
                 participant.role === 'moderator' ? 'Модератор' : 'Участник'}
              </span>
              
              {participant.role !== 'owner' && (
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => setShowRoleChange(!showRoleChange)}
                >
                  Изменить роль
                </button>
              )}
            </div>
            
            {showRoleChange && (
              <div className="role-change-form">
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  <option value="member">Участник</option>
                  <option value="moderator">Модератор</option>
                  <option value="admin">Администратор</option>
                </select>
                <div className="form-actions">
                  <button className="btn btn-sm btn-primary" onClick={handleRoleChange}>
                    Сохранить
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowRoleChange(false)}>
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="detail-section">
            <h4>Статус</h4>
            <span className={`status-badge status-${participant.status}`}>
              {participant.status === 'active' ? 'Активен' :
               participant.status === 'inactive' ? 'Неактивен' : 'Заблокирован'}
            </span>
          </div>

          <div className="detail-section">
            <h4>Дата присоединения</h4>
            <p>{new Date(participant.joined_at).toLocaleString('ru-RU')}</p>
          </div>

          {participant.events_attended && (
            <div className="detail-section">
              <h4>Событий посещено</h4>
              <p>{participant.events_attended}</p>
            </div>
          )}

          {participant.last_activity && (
            <div className="detail-section">
              <h4>Последняя активность</h4>
              <p>{new Date(participant.last_activity).toLocaleString('ru-RU')}</p>
            </div>
          )}

          {participant.bio && (
            <div className="detail-section">
              <h4>О себе</h4>
              <p>{participant.bio}</p>
            </div>
          )}
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>
          Закрыть
        </button>
        
        {participant.role !== 'owner' && (
          <button className="btn btn-danger" onClick={() => onRemove(participant.id)}>
            Исключить из клуба
          </button>
        )}
      </div>
    </div>
  );
};

export default ClubParticipants;
