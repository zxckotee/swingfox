import React, { useState, useEffect } from 'react';
import { clubApi } from '../services/clubApi';
import '../styles/ClubApplications.css';

// Иконки
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

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const ClubApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await clubApi.getApplications();
      setApplications(Array.isArray(response.applications) ? response.applications : (Array.isArray(response) ? response : []));
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  const handleApproveApplication = async (applicationId) => {
    if (window.confirm('Вы уверены, что хотите одобрить эту заявку?')) {
      try {
        await clubApi.approveApplication(applicationId);
        await loadApplications();
        setShowModal(false);
        setSelectedApplication(null);
      } catch (error) {
        console.error('Ошибка одобрения заявки:', error);
        alert('Ошибка при одобрении заявки');
      }
    }
  };

  const handleRejectApplication = async (applicationId) => {
    if (window.confirm('Вы уверены, что хотите отклонить эту заявку?')) {
      try {
        await clubApi.rejectApplication(applicationId);
        await loadApplications();
        setShowModal(false);
        setSelectedApplication(null);
      } catch (error) {
        console.error('Ошибка отклонения заявки:', error);
        alert('Ошибка при отклонении заявки');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { text: 'На рассмотрении', class: 'status-pending' },
      'approved': { text: 'Одобрена', class: 'status-approved' },
      'rejected': { text: 'Отклонена', class: 'status-rejected' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'status-unknown' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  if (loading) {
    return (
      <div className="club-applications">
        <div className="loading">
          <div className="spinner"></div>
          <p>Загрузка заявок...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="club-applications">
      <div className="page-header">
        <div className="header-content">
          <h1>Заявки на вступление</h1>
          <p>Управляйте заявками пользователей на вступление в клуб</p>
        </div>
      </div>

      <div className="applications-stats">
        <div className="stat-card">
          <h3>Всего заявок</h3>
          <span className="stat-number">{applications.length}</span>
        </div>
        <div className="stat-card">
          <h3>На рассмотрении</h3>
          <span className="stat-number">{applications.filter(app => app.status === 'pending').length}</span>
        </div>
        <div className="stat-card">
          <h3>Одобрено</h3>
          <span className="stat-number">{applications.filter(app => app.status === 'approved').length}</span>
        </div>
        <div className="stat-card">
          <h3>Отклонено</h3>
          <span className="stat-number">{applications.filter(app => app.status === 'rejected').length}</span>
        </div>
      </div>

      <div className="applications-filters">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Все ({applications.length})
          </button>
          <button 
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            На рассмотрении ({applications.filter(app => app.status === 'pending').length})
          </button>
          <button 
            className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Одобрено ({applications.filter(app => app.status === 'approved').length})
          </button>
          <button 
            className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Отклонено ({applications.filter(app => app.status === 'rejected').length})
          </button>
        </div>
      </div>

      <div className="applications-content">
        {filteredApplications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>Нет заявок</h3>
            <p>
              {filter === 'all' 
                ? 'Пока нет заявок на вступление в клуб'
                : `Нет заявок со статусом "${filter === 'pending' ? 'на рассмотрении' : filter === 'approved' ? 'одобрено' : 'отклонено'}"`
              }
            </p>
          </div>
        ) : (
          <div className="applications-list">
            {filteredApplications.map((application) => (
              <div key={application.id} className="application-card">
                <div className="application-header">
                  <div className="user-info">
                    <div className="user-avatar">
                      {application.user?.avatar ? (
                        <img src={application.user.avatar} alt={application.user.name || application.user.login} />
                      ) : (
                        <UserIcon />
                      )}
                    </div>
                    <div className="user-details">
                      <h3>{application.user?.name || application.user?.login || 'Неизвестный пользователь'}</h3>
                      <p>{application.user?.email || 'Email не указан'}</p>
                    </div>
                  </div>
                  <div className="application-status">
                    {getStatusBadge(application.status)}
                  </div>
                </div>

                <div className="application-content">
                  <div className="application-message">
                    <h4>Сообщение:</h4>
                    <p>{application.message || 'Сообщение не указано'}</p>
                  </div>
                  
                  {application.experience && (
                    <div className="application-experience">
                      <h4>Опыт:</h4>
                      <p>{application.experience}</p>
                    </div>
                  )}

                  {application.interests && (
                    <div className="application-interests">
                      <h4>Интересы:</h4>
                      <p>{application.interests}</p>
                    </div>
                  )}
                </div>

                <div className="application-footer">
                  <div className="application-dates">
                    <div className="date-item">
                      <ClockIcon className="icon" />
                      <span>Подана: {new Date(application.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                    {application.updated_at && application.updated_at !== application.created_at && (
                      <div className="date-item">
                        <span>Обновлена: {new Date(application.updated_at).toLocaleDateString('ru-RU')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="application-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleViewApplication(application)}
                    >
                      <EyeIcon className="icon" />
                      Подробнее
                    </button>
                    
                    {application.status === 'pending' && (
                      <>
                        <button 
                          className="btn btn-success"
                          onClick={() => handleApproveApplication(application.id)}
                        >
                          <CheckIcon className="icon" />
                          Одобрить
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => handleRejectApplication(application.id)}
                        >
                          <XIcon className="icon" />
                          Отклонить
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && selectedApplication && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ApplicationModal
              application={selectedApplication}
              onClose={() => {
                setShowModal(false);
                setSelectedApplication(null);
              }}
              onApprove={() => handleApproveApplication(selectedApplication.id)}
              onReject={() => handleRejectApplication(selectedApplication.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Модальное окно с подробной информацией о заявке
const ApplicationModal = ({ application, onClose, onApprove, onReject }) => {
  return (
    <div className="application-modal">
      <div className="modal-header">
        <h2>Заявка на вступление</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="modal-body">
        <div className="user-profile">
          <div className="user-avatar-large">
            {application.user?.avatar ? (
              <img src={application.user.avatar} alt={application.user.name || application.user.login} />
            ) : (
              <UserIcon />
            )}
          </div>
          <div className="user-info">
            <h3>{application.user?.name || application.user?.login || 'Неизвестный пользователь'}</h3>
            <p>{application.user?.email || 'Email не указан'}</p>
            {application.user?.age && <p>Возраст: {application.user.age}</p>}
            {application.user?.location && <p>Местоположение: {application.user.location}</p>}
          </div>
        </div>

        <div className="application-details">
          <div className="detail-section">
            <h4>Сообщение</h4>
            <p>{application.message || 'Сообщение не указано'}</p>
          </div>

          {application.experience && (
            <div className="detail-section">
              <h4>Опыт</h4>
              <p>{application.experience}</p>
            </div>
          )}

          {application.interests && (
            <div className="detail-section">
              <h4>Интересы</h4>
              <p>{application.interests}</p>
            </div>
          )}

          <div className="detail-section">
            <h4>Статус</h4>
            <span className={`status-badge status-${application.status}`}>
              {application.status === 'pending' ? 'На рассмотрении' : 
               application.status === 'approved' ? 'Одобрена' : 'Отклонена'}
            </span>
          </div>

          <div className="detail-section">
            <h4>Дата подачи</h4>
            <p>{new Date(application.created_at).toLocaleString('ru-RU')}</p>
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>
          Закрыть
        </button>
        
        {application.status === 'pending' && (
          <>
            <button className="btn btn-success" onClick={onApprove}>
              <CheckIcon className="icon" />
              Одобрить
            </button>
            <button className="btn btn-danger" onClick={onReject}>
              <XIcon className="icon" />
              Отклонить
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ClubApplications;

