import React, { useState, useEffect } from 'react';
import { clubApi } from '../services/clubApi';
import '../styles/ClubAds.css';

// Иконки
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6"/>
    <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const ClubAds = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      setLoading(true);
      const response = await clubApi.getAds();
      setAds(Array.isArray(response.ads) ? response.ads : (Array.isArray(response) ? response : []));
    } catch (error) {
      console.error('Ошибка загрузки объявлений:', error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAd = () => {
    setEditingAd(null);
    setShowCreateModal(true);
  };

  const handleEditAd = (ad) => {
    setEditingAd(ad);
    setShowCreateModal(true);
  };

  const handleDeleteAd = async (adId) => {
    if (window.confirm('Вы уверены, что хотите удалить это объявление?')) {
      try {
        await clubApi.deleteAd(adId);
        await loadAds();
      } catch (error) {
        console.error('Ошибка удаления объявления:', error);
        alert('Ошибка при удалении объявления');
      }
    }
  };

  const handleAdSaved = () => {
    setShowCreateModal(false);
    setEditingAd(null);
    loadAds();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { text: 'Активно', class: 'status-active' },
      'paused': { text: 'Приостановлено', class: 'status-paused' },
      'draft': { text: 'Черновик', class: 'status-draft' },
      'expired': { text: 'Истекло', class: 'status-expired' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'status-unknown' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  if (loading) {
    return (
      <div className="club-ads">
        <div className="loading">
          <div className="spinner"></div>
          <p>Загрузка объявлений...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="club-ads">
      <div className="page-header">
        <div className="header-content">
          <h1>Объявления клуба</h1>
          <p>Управляйте рекламными объявлениями вашего клуба</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateAd}>
          <PlusIcon className="icon" />
          Создать объявление
        </button>
      </div>

      <div className="ads-stats">
        <div className="stat-card">
          <h3>Всего объявлений</h3>
          <span className="stat-number">{ads.length}</span>
        </div>
        <div className="stat-card">
          <h3>Активных</h3>
          <span className="stat-number">{ads.filter(ad => ad.status === 'active').length}</span>
        </div>
        <div className="stat-card">
          <h3>Просмотров</h3>
          <span className="stat-number">{ads.reduce((sum, ad) => sum + (ad.views || 0), 0)}</span>
        </div>
        <div className="stat-card">
          <h3>Кликов</h3>
          <span className="stat-number">{ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0)}</span>
        </div>
      </div>

      <div className="ads-content">
        {ads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📢</div>
            <h3>Нет объявлений</h3>
            <p>Создайте первое объявление для привлечения новых участников</p>
            <button className="btn btn-primary" onClick={handleCreateAd}>
              <PlusIcon className="icon" />
              Создать объявление
            </button>
          </div>
        ) : (
          <div className="ads-grid">
            {ads.map((ad) => (
              <div key={ad.id} className="ad-card">
                <div className="ad-header">
                  <div className="ad-title">
                    <h3>{ad.title}</h3>
                    {getStatusBadge(ad.status)}
                  </div>
                  <div className="ad-actions">
                    <button 
                      className="btn-icon" 
                      onClick={() => handleEditAd(ad)}
                      title="Редактировать"
                    >
                      <EditIcon />
                    </button>
                    <button 
                      className="btn-icon danger" 
                      onClick={() => handleDeleteAd(ad.id)}
                      title="Удалить"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
                
                <div className="ad-content">
                  <p className="ad-description">{ad.description}</p>
                  {ad.image && (
                    <div className="ad-image">
                      <img src={ad.image} alt={ad.title} />
                    </div>
                  )}
                </div>
                
                <div className="ad-footer">
                  <div className="ad-metrics">
                    <div className="metric">
                      <EyeIcon className="icon" />
                      <span>{ad.views || 0} просмотров</span>
                    </div>
                    <div className="metric">
                      <span>CTR: {ad.ctr || 0}%</span>
                    </div>
                  </div>
                  <div className="ad-dates">
                    <span>Создано: {new Date(ad.created_at).toLocaleDateString('ru-RU')}</span>
                    {ad.expires_at && (
                      <span>Истекает: {new Date(ad.expires_at).toLocaleDateString('ru-RU')}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <AdForm
              ad={editingAd}
              onCancel={() => {
                setShowCreateModal(false);
                setEditingAd(null);
              }}
              onSave={handleAdSaved}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Компонент формы объявления
const AdForm = ({ ad, onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    title: ad?.title || '',
    description: ad?.description || '',
    image: ad?.image || '',
    target_audience: ad?.target_audience || '',
    budget: ad?.budget || '',
    duration_days: ad?.duration_days || 30,
    status: ad?.status || 'draft'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (ad) {
        await clubApi.updateAd(ad.id, formData);
      } else {
        await clubApi.createAd(formData);
      }
      onSave();
    } catch (error) {
      console.error('Ошибка сохранения объявления:', error);
      alert('Ошибка при сохранении объявления');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="ad-form">
      <div className="form-header">
        <h2>{ad ? 'Редактировать объявление' : 'Создать объявление'}</h2>
        <button type="button" className="close-btn" onClick={onCancel}>×</button>
      </div>

      <div className="form-group">
        <label htmlFor="title">Заголовок *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="Введите заголовок объявления"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Описание *</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows="4"
          placeholder="Опишите ваше объявление"
        />
      </div>

      <div className="form-group">
        <label htmlFor="image">URL изображения</label>
        <input
          type="url"
          id="image"
          name="image"
          value={formData.image}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="target_audience">Целевая аудитория</label>
          <select
            id="target_audience"
            name="target_audience"
            value={formData.target_audience}
            onChange={handleChange}
          >
            <option value="">Выберите аудиторию</option>
            <option value="all">Все пользователи</option>
            <option value="premium">Премиум пользователи</option>
            <option value="local">Локальные пользователи</option>
            <option value="age_18_25">18-25 лет</option>
            <option value="age_26_35">26-35 лет</option>
            <option value="age_36_plus">36+ лет</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="budget">Бюджет (руб.)</label>
          <input
            type="number"
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            min="0"
            placeholder="0"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="duration_days">Продолжительность (дни)</label>
          <input
            type="number"
            id="duration_days"
            name="duration_days"
            value={formData.duration_days}
            onChange={handleChange}
            min="1"
            max="365"
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">Статус</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="draft">Черновик</option>
            <option value="active">Активно</option>
            <option value="paused">Приостановлено</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Отмена
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Сохранение...' : (ad ? 'Обновить' : 'Создать')}
        </button>
      </div>
    </form>
  );
};

export default ClubAds;
