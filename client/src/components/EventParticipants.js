import React, { useState, useEffect } from 'react';
import { clubApi } from '../services/clubApi';
import './EventParticipants.css';

const EventParticipants = ({ eventId, onClose }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    if (eventId) {
      loadParticipants();
    }
  }, [eventId]);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await clubApi.getEventParticipants(eventId);
      setParticipants(response.participants || []);
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
      setError('Не удалось загрузить список участников');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (participantId, newStatus) => {
    try {
      await clubApi.updateParticipantStatus(eventId, participantId, newStatus);
      
      setParticipants(prev => 
        prev.map(participant => 
          participant.id === participantId 
            ? { ...participant, status: newStatus }
            : participant
        )
      );
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      alert('Не удалось обновить статус участника');
    }
  };

  const handleRemoveParticipant = async (participantId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого участника?')) {
      return;
    }

    try {
      await clubApi.removeParticipant(eventId, participantId);
      setParticipants(prev => prev.filter(p => p.id !== participantId));
    } catch (error) {
      console.error('Ошибка удаления участника:', error);
      alert('Не удалось удалить участника');
    }
  };

  const getStatusLabel = (status) => {
    const statuses = {
      'pending': 'Ожидает',
      'approved': 'Подтвержден',
      'rejected': 'Отклонен',
      'cancelled': 'Отменен'
    };
    return statuses[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'approved': '#10b981',
      'rejected': '#ef4444',
      'cancelled': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = 
      participant.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || participant.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = participants.reduce((acc, participant) => {
    acc[participant.status] = (acc[participant.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="event-participants-overlay">
        <div className="event-participants">
          <div className="participants-loading">
            <div className="loading-spinner"></div>
            <p>Загрузка участников...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="event-participants-overlay">
      <div className="event-participants">
        <div className="participants-header">
          <h2>Участники события</h2>
          <button 
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Statistics */}
        <div className="participants-stats">
          <div className="stat-item">
            <span className="stat-number">{participants.length}</span>
            <span className="stat-label">Всего заявок</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{statusCounts.approved || 0}</span>
            <span className="stat-label">Подтверждено</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{statusCounts.pending || 0}</span>
            <span className="stat-label">Ожидает</span>
          </div>
        </div>

        {/* Filters */}
        <div className="participants-filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-group">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="status-filter"
            >
              <option value="all">Все статусы</option>
              <option value="pending">Ожидает</option>
              <option value="approved">Подтвержден</option>
              <option value="rejected">Отклонен</option>
              <option value="cancelled">Отменен</option>
            </select>
          </div>
        </div>

        {/* Participants List */}
        <div className="participants-list">
          {filteredParticipants.length === 0 ? (
            <div className="no-participants">
              <div className="no-participants-icon">👥</div>
              <p>Участники не найдены</p>
            </div>
          ) : (
            filteredParticipants.map(participant => (
              <div key={participant.id} className="participant-card">
                <div className="participant-info">
                  <div className="participant-avatar">
                    <img 
                      src={participant.user?.avatar || '/images/default-avatar.png'} 
                      alt={participant.user?.name}
                      onError={(e) => {
                        e.target.src = '/images/default-avatar.png';
                      }}
                    />
                  </div>
                  
                  <div className="participant-details">
                    <h4 className="participant-name">
                      {participant.user?.name || 'Неизвестный пользователь'}
                    </h4>
                    <p className="participant-email">
                      {participant.user?.email}
                    </p>
                    <p className="participant-date">
                      Подал заявку: {new Date(participant.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>

                <div className="participant-actions">
                  <div className="status-badge" style={{ backgroundColor: getStatusColor(participant.status) }}>
                    {getStatusLabel(participant.status)}
                  </div>
                  
                  <div className="action-buttons">
                    {participant.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleStatusChange(participant.id, 'approved')}
                        >
                          ✓ Одобрить
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleStatusChange(participant.id, 'rejected')}
                        >
                          ✗ Отклонить
                        </button>
                      </>
                    )}
                    
                    {participant.status === 'approved' && (
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => handleStatusChange(participant.id, 'cancelled')}
                      >
                        Отменить
                      </button>
                    )}
                    
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveParticipant(participant.id)}
                    >
                      🗑️ Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EventParticipants;
