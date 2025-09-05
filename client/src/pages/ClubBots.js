import React, { useState, useEffect } from 'react';
import { clubApi } from '../services/clubApi';
import '../styles/ClubBots.css';

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

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5,3 19,12 5,21"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const ActivityIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const ClubBots = () => {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBot, setEditingBot] = useState(null);

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      setLoading(true);
      const response = await clubApi.getBots();
      setBots(Array.isArray(response.bots) ? response.bots : (Array.isArray(response) ? response : []));
    } catch (error) {
      console.error('Ошибка загрузки ботов:', error);
      setBots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = () => {
    setEditingBot(null);
    setShowCreateModal(true);
  };

  const handleEditBot = (bot) => {
    setEditingBot(bot);
    setShowCreateModal(true);
  };

  const handleDeleteBot = async (botId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого бота?')) {
      try {
        await clubApi.deleteBot(botId);
        await loadBots();
      } catch (error) {
        console.error('Ошибка удаления бота:', error);
        alert('Ошибка при удалении бота');
      }
    }
  };

  const handleToggleBot = async (botId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await clubApi.updateBot(botId, { status: newStatus });
      await loadBots();
    } catch (error) {
      console.error('Ошибка изменения статуса бота:', error);
      alert('Ошибка при изменении статуса бота');
    }
  };

  const handleBotSaved = () => {
    setShowCreateModal(false);
    setEditingBot(null);
    loadBots();
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { text: 'Активен', class: 'status-active' },
      'inactive': { text: 'Неактивен', class: 'status-inactive' },
      'error': { text: 'Ошибка', class: 'status-error' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'status-unknown' };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const getBotTypeIcon = (type) => {
    switch (type) {
      case 'welcome':
        return '👋';
      case 'event_reminder':
        return '📅';
      case 'auto_response':
        return '💬';
      case 'analytics':
        return '📊';
      case 'moderation':
        return '🛡️';
      default:
        return '🤖';
    }
  };

  const getBotTypeName = (type) => {
    const typeMap = {
      'welcome': 'Приветственный',
      'event_reminder': 'Напоминания о событиях',
      'auto_response': 'Автоответчик',
      'analytics': 'Аналитика',
      'moderation': 'Модерация',
      'custom': 'Пользовательский'
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="club-bots">
        <div className="loading">
          <div className="spinner"></div>
          <p>Загрузка ботов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="club-bots">
      <div className="page-header">
        <div className="header-content">
          <h1>Боты клуба</h1>
          <p>Управляйте автоматизацией и ботами для вашего клуба</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateBot}>
          <PlusIcon className="icon" />
          Создать бота
        </button>
      </div>

      <div className="bots-stats">
        <div className="stat-card">
          <h3>Всего ботов</h3>
          <span className="stat-number">{bots.length}</span>
        </div>
        <div className="stat-card">
          <h3>Активных</h3>
          <span className="stat-number">{bots.filter(bot => bot.status === 'active').length}</span>
        </div>
        <div className="stat-card">
          <h3>Выполнено задач</h3>
          <span className="stat-number">{bots.reduce((sum, bot) => sum + (bot.tasks_completed || 0), 0)}</span>
        </div>
        <div className="stat-card">
          <h3>Ошибок</h3>
          <span className="stat-number">{bots.filter(bot => bot.status === 'error').length}</span>
        </div>
      </div>

      <div className="bots-content">
        {bots.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🤖</div>
            <h3>Нет ботов</h3>
            <p>Создайте первого бота для автоматизации процессов в клубе</p>
            <button className="btn btn-primary" onClick={handleCreateBot}>
              <PlusIcon className="icon" />
              Создать бота
            </button>
          </div>
        ) : (
          <div className="bots-grid">
            {bots.map((bot) => (
              <div key={bot.id} className="bot-card">
                <div className="bot-header">
                  <div className="bot-info">
                    <div className="bot-icon">
                      {getBotTypeIcon(bot.type)}
                    </div>
                    <div className="bot-details">
                      <h3>{bot.name}</h3>
                      <p>{getBotTypeName(bot.type)}</p>
                    </div>
                  </div>
                  <div className="bot-status">
                    {getStatusBadge(bot.status)}
                  </div>
                </div>
                
                <div className="bot-content">
                  <p className="bot-description">{bot.description}</p>
                  
                  <div className="bot-settings">
                    <div className="setting-item">
                      <span className="setting-label">Триггер:</span>
                      <span className="setting-value">{bot.trigger || 'Не настроен'}</span>
                    </div>
                    <div className="setting-item">
                      <span className="setting-label">Интервал:</span>
                      <span className="setting-value">{bot.interval || 'Не настроен'}</span>
                    </div>
                    {bot.last_run && (
                      <div className="setting-item">
                        <span className="setting-label">Последний запуск:</span>
                        <span className="setting-value">
                          {new Date(bot.last_run).toLocaleString('ru-RU')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bot-footer">
                  <div className="bot-metrics">
                    <div className="metric">
                      <ActivityIcon className="icon" />
                      <span>{bot.tasks_completed || 0} задач</span>
                    </div>
                    <div className="metric">
                      <ClockIcon className="icon" />
                      <span>Создан: {new Date(bot.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                  
                  <div className="bot-actions">
                    <button 
                      className={`btn btn-sm ${bot.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => handleToggleBot(bot.id, bot.status)}
                      title={bot.status === 'active' ? 'Остановить' : 'Запустить'}
                    >
                      {bot.status === 'active' ? <PauseIcon className="icon" /> : <PlayIcon className="icon" />}
                      {bot.status === 'active' ? 'Остановить' : 'Запустить'}
                    </button>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleEditBot(bot)}
                      title="Настройки"
                    >
                      <SettingsIcon />
                    </button>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleEditBot(bot)}
                      title="Редактировать"
                    >
                      <EditIcon />
                    </button>
                    <button 
                      className="btn-icon danger" 
                      onClick={() => handleDeleteBot(bot.id)}
                      title="Удалить"
                    >
                      <TrashIcon />
                    </button>
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
            <BotForm
              bot={editingBot}
              onCancel={() => {
                setShowCreateModal(false);
                setEditingBot(null);
              }}
              onSave={handleBotSaved}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Компонент формы бота
const BotForm = ({ bot, onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    name: bot?.name || '',
    description: bot?.description || '',
    type: bot?.type || 'custom',
    trigger: bot?.trigger || '',
    interval: bot?.interval || '',
    settings: bot?.settings || {},
    status: bot?.status || 'inactive'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (bot) {
        await clubApi.updateBot(bot.id, formData);
      } else {
        await clubApi.createBot(formData);
      }
      onSave();
    } catch (error) {
      console.error('Ошибка сохранения бота:', error);
      alert('Ошибка при сохранении бота');
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
    <form onSubmit={handleSubmit} className="bot-form">
      <div className="form-header">
        <h2>{bot ? 'Редактировать бота' : 'Создать бота'}</h2>
        <button type="button" className="close-btn" onClick={onCancel}>×</button>
      </div>

      <div className="form-group">
        <label htmlFor="name">Название бота *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Введите название бота"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Описание</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          placeholder="Опишите функционал бота"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="type">Тип бота *</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="welcome">Приветственный</option>
            <option value="event_reminder">Напоминания о событиях</option>
            <option value="auto_response">Автоответчик</option>
            <option value="analytics">Аналитика</option>
            <option value="moderation">Модерация</option>
            <option value="custom">Пользовательский</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="status">Статус</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="inactive">Неактивен</option>
            <option value="active">Активен</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="trigger">Триггер (условие запуска)</label>
        <input
          type="text"
          id="trigger"
          name="trigger"
          value={formData.trigger}
          onChange={handleChange}
          placeholder="Например: новое сообщение, регистрация пользователя"
        />
      </div>

      <div className="form-group">
        <label htmlFor="interval">Интервал выполнения</label>
        <select
          id="interval"
          name="interval"
          value={formData.interval}
          onChange={handleChange}
        >
          <option value="">По событию</option>
          <option value="1m">Каждую минуту</option>
          <option value="5m">Каждые 5 минут</option>
          <option value="15m">Каждые 15 минут</option>
          <option value="30m">Каждые 30 минут</option>
          <option value="1h">Каждый час</option>
          <option value="6h">Каждые 6 часов</option>
          <option value="12h">Каждые 12 часов</option>
          <option value="1d">Ежедневно</option>
          <option value="1w">Еженедельно</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Отмена
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Сохранение...' : (bot ? 'Обновить' : 'Создать')}
        </button>
      </div>
    </form>
  );
};

export default ClubBots;
