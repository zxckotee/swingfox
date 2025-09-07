import React, { useState, useEffect } from 'react';
import { clubApi } from '../services/clubApi';
import toast from 'react-hot-toast';
import '../styles/ClubSettings.css';

// Иконки
const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17,21 17,13 7,13 7,21"/>
    <polyline points="7,3 7,8 15,8"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,15 17,10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const ClubSettings = () => {
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    loadClubData();
  }, []);

  // Обработчик скролла для табов
  useEffect(() => {
    const tabsList = document.querySelector('.tabs-list');
    const sidebar = document.querySelector('.settings-sidebar');
    const scrollHint = document.querySelector('.scroll-hint');
    
    if (!tabsList || !sidebar) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = tabsList;
      
      // Добавляем класс для скрытия подсказки после первого скролла
      if (scrollLeft > 0) {
        tabsList.classList.add('scrolled');
        if (scrollHint) {
          scrollHint.style.opacity = '0';
        }
      } else {
        tabsList.classList.remove('scrolled');
        if (scrollHint) {
          scrollHint.style.opacity = '1';
        }
      }
      
      // Управляем индикаторами прокрутки
      if (scrollLeft > 0) {
        sidebar.classList.add('scrollable-left');
      } else {
        sidebar.classList.remove('scrollable-left');
      }
      
      if (scrollLeft < scrollWidth - clientWidth - 1) {
        sidebar.classList.add('scrollable-right');
      } else {
        sidebar.classList.remove('scrollable-right');
      }
    };

    // Проверяем состояние при загрузке
    handleScroll();
    
    tabsList.addEventListener('scroll', handleScroll);
    
    // Проверяем состояние при изменении размера окна
    const handleResize = () => {
      setTimeout(handleScroll, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      tabsList.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const loadClubData = async () => {
    try {
      setLoading(true);
      const response = await clubApi.getProfile();
      setClub(response.club || response);
    } catch (error) {
      console.error('Ошибка загрузки данных клуба:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);
      await clubApi.updateProfile(formData);
      await loadClubData();
      toast.success('Настройки сохранены успешно!');
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      toast.error('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (passwordData) => {
    try {
      setSaving(true);
      await clubApi.changePassword(passwordData);
      setShowPasswordForm(false);
      toast.success('Пароль изменен успешно!');
    } catch (error) {
      console.error('Ошибка изменения пароля:', error);
      toast.error('Ошибка при изменении пароля');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAvatar = async (file) => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('avatar', file);
      await clubApi.uploadAvatar(formData);
      await loadClubData();
      toast.success('Аватар обновлен успешно!');
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      toast.error('Ошибка при загрузке аватара');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="club-settings">
        <div className="loading">
          <div className="spinner"></div>
          <p>Загрузка настроек...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'Основные', icon: '⚙️' },
    { id: 'profile', label: 'Профиль', icon: '👤' },
    { id: 'privacy', label: 'Приватность', icon: '🔒' },
    { id: 'notifications', label: 'Уведомления', icon: '🔔' },
    { id: 'security', label: 'Безопасность', icon: '🛡️' }
  ];

  return (
    <div className="club-settings">
      <div className="page-header">
        <div className="header-content">
          <h1>Настройки клуба</h1>
          <p>Управляйте настройками и конфигурацией вашего клуба</p>
        </div>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar">
          <div className="tabs-list">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="scroll-hint">
            Прокрутите для просмотра всех разделов
          </div>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <GeneralSettings club={club} onSave={handleSave} saving={saving} />
          )}
          
          {activeTab === 'profile' && (
            <ProfileSettings 
              club={club} 
              onSave={handleSave} 
              onUploadAvatar={handleUploadAvatar}
              saving={saving} 
            />
          )}
          
          {activeTab === 'privacy' && (
            <PrivacySettings club={club} onSave={handleSave} saving={saving} />
          )}
          
          {activeTab === 'notifications' && (
            <NotificationSettings club={club} onSave={handleSave} saving={saving} />
          )}
          
          {activeTab === 'security' && (
            <SecuritySettings 
              club={club} 
              onSave={handleSave} 
              onChangePassword={handleChangePassword}
              showPasswordForm={showPasswordForm}
              setShowPasswordForm={setShowPasswordForm}
              saving={saving} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Компонент основных настроек
const GeneralSettings = ({ club, onSave, saving }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'general',
    website: '',
    contact_info: ''
  });

  // Обновляем formData когда club загружается
  useEffect(() => {
    if (club) {
      setFormData({
        name: club.name || '',
        description: club.description || '',
        type: club.type || 'general',
        website: club.website || '',
        contact_info: club.contact_info || ''
      });
    }
  }, [club]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="settings-section">
      <h2>Основные настройки</h2>
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-group">
          <label htmlFor="name">Название клуба *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Введите название клуба"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Описание клуба</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Опишите ваш клуб"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="type">Тип клуба</label>
            <select id="type" name="type" value={formData.type} onChange={handleChange}>
              <option value="general">Общий</option>
              <option value="swing">Свинг</option>
              <option value="bdsm">БДСМ</option>
              <option value="fetish">Фетиш</option>
              <option value="lifestyle">Лайфстайл</option>
              <option value="other">Другое</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="website">Веб-сайт</label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://example.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="contact_info">Контактная информация</label>
          <textarea
            id="contact_info"
            name="contact_info"
            value={formData.contact_info}
            onChange={handleChange}
            rows="3"
            placeholder="Дополнительная контактная информация"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <SaveIcon className="icon" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Компонент настроек профиля
const ProfileSettings = ({ club, onSave, onUploadAvatar, saving }) => {
  const [formData, setFormData] = useState({
    country: '',
    city: '',
    address: '',
    email: ''
  });

  // Обновляем formData когда club загружается
  useEffect(() => {
    if (club) {
      setFormData({
        country: club.country || '',
        city: club.city || '',
        address: club.address || '',
        email: club.email || ''
      });
    }
  }, [club]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUploadAvatar(file);
    }
  };

  return (
    <div className="settings-section">
      <h2>Настройки профиля</h2>
      
      <div className="avatar-section">
        <h3>Аватар клуба</h3>
        <div className="avatar-upload">
          <div className="current-avatar" onClick={() => document.getElementById('avatar-upload').click()}>
            {club?.avatar ? (
              <img 
                src={`/uploads/${club.avatar}`} 
                alt="Аватар клуба" 
                onError={(e) => {
                  e.target.src = '/uploads/no_photo.jpg';
                }}
              />
            ) : (
              <div className="avatar-placeholder">👤</div>
            )}
            <div className="avatar-overlay">
              <span>📷</span>
              <span>Изменить аватар</span>
            </div>
          </div>
          <div className="upload-controls">
            <label htmlFor="avatar-upload" className="btn btn-secondary">
              <UploadIcon className="icon" />
              Загрузить аватар
            </label>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <p className="upload-hint">Рекомендуемый размер: 200x200px</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="country">Страна</label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="Россия"
            />
          </div>
          <div className="form-group">
            <label htmlFor="city">Город</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Москва"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="address">Адрес</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Полный адрес клуба"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="club@example.com"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <SaveIcon className="icon" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Компонент настроек приватности
const PrivacySettings = ({ club, onSave, saving }) => {
  const [formData, setFormData] = useState({
    is_public: true,
    show_members: true,
  });

  // Обновляем formData когда club загружается
  useEffect(() => {
    if (club) {
      setFormData({
        is_public: club.is_public !== false,
        show_members: club.show_members !== false,
      });
    }
  }, [club]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  return (
    <div className="settings-section">
      <h2>Настройки приватности</h2>
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="privacy-options">
          <div className="privacy-item">
            <div className="privacy-info">
              <h4>Публичный клуб</h4>
              <p>Клуб будет виден всем пользователям в каталоге</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="is_public"
                checked={formData.is_public}
                onChange={handleChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="privacy-item">
            <div className="privacy-info">
              <h4>Показывать участников</h4>
              <p>Отображать список участников на странице клуба</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="show_members"
                checked={formData.show_members}
                onChange={handleChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <SaveIcon className="icon" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Компонент настроек уведомлений
const NotificationSettings = ({ club, onSave, saving }) => {
  const [formData, setFormData] = useState({
    email_notifications: true,
    event_reminders: true,
    member_activity: true
  });

  // Обновляем formData когда club загружается
  useEffect(() => {
    if (club) {
      setFormData({
        email_notifications: club.email_notifications !== false,
        event_reminders: club.event_reminders !== false,
        member_activity: club.member_activity !== false
      });
    }
  }, [club]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  return (
    <div className="settings-section">
      <h2>Настройки уведомлений</h2>
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="notification-options">
          <div className="notification-item">
            <div className="notification-info">
              <h4>Email уведомления</h4>
              <p>Получать уведомления на email</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="email_notifications"
                checked={formData.email_notifications}
                onChange={handleChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="notification-item">
            <div className="notification-info">
              <h4>Напоминания о событиях</h4>
              <p>Уведомления о предстоящих мероприятиях</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="event_reminders"
                checked={formData.event_reminders}
                onChange={handleChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>


          <div className="notification-item">
            <div className="notification-info">
              <h4>Активность участников</h4>
              <p>Уведомления о активности участников клуба</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="member_activity"
                checked={formData.member_activity}
                onChange={handleChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <SaveIcon className="icon" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Компонент настроек безопасности
const SecuritySettings = ({ club, onSave, onChangePassword, showPasswordForm, setShowPasswordForm, saving }) => {
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Пароли не совпадают');
      return;
    }
    
    // Преобразуем поля для API
    const apiData = {
      currentPassword: passwordData.current_password,
      newPassword: passwordData.new_password
    };
    
    onChangePassword(apiData);
    setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="settings-section">
      <h2>Настройки безопасности</h2>
      
      <div className="security-section">
        <h3>Смена пароля</h3>
        <p>Регулярно меняйте пароль для обеспечения безопасности</p>
        
        {!showPasswordForm ? (
          <button 
            className="btn btn-secondary"
            onClick={() => setShowPasswordForm(true)}
          >
            Изменить пароль
          </button>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="password-form">
            <div className="form-group">
              <label htmlFor="current_password">Текущий пароль</label>
              <input
                type="password"
                id="current_password"
                name="current_password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                required
                placeholder="Введите текущий пароль"
              />
            </div>

            <div className="form-group">
              <label htmlFor="new_password">Новый пароль</label>
              <input
                type="password"
                id="new_password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                required
                placeholder="Введите новый пароль"
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">Подтвердите пароль</label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                required
                placeholder="Подтвердите новый пароль"
                minLength="6"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordForm(false)}>
                Отмена
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Сохранение...' : 'Изменить пароль'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="security-info">
        <h3>Информация о безопасности</h3>
        <div className="security-stats">
          <div className="security-item">
            <span className="security-label">Последний вход:</span>
            <span className="security-value">
              {club?.last_login ? new Date(club.last_login).toLocaleString('ru-RU') : 'Неизвестно'}
            </span>
          </div>
          <div className="security-item">
            <span className="security-label">Email подтвержден:</span>
            <span className="security-value">
              {club?.email_verified ? 'Да' : 'Нет'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubSettings;

