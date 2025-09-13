import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clubApi, clubAuth } from '../services/clubApi';
import toast from 'react-hot-toast';
import '../styles/ClubBotSettings.css';

const ClubBotSettings = () => {
  const navigate = useNavigate();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Проверяем аутентификацию клуба
    if (!clubAuth.isAuthenticated()) {
      navigate('/club/login');
      return;
    }
    
    loadBotConfig();
  }, [navigate]);

  const loadBotConfig = async () => {
    try {
      setLoading(true);
      const response = await clubApi.getBotConfig();
      if (response.success) {
        setBots(response.bots || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек ботов:', error);
      toast.error('Ошибка при загрузке настроек ботов');
    } finally {
      setLoading(false);
    }
  };

  const handleBotToggle = (botId, enabled) => {
    setBots(prev => prev.map(bot => 
      bot.id === botId 
        ? { ...bot, enabled, settings: { ...bot.settings, enabled } }
        : bot
    ));
  };

  const handleMessageChange = (botId, messageType, value) => {
    setBots(prev => prev.map(bot => 
      bot.id === botId 
        ? { 
            ...bot, 
            settings: { 
              ...bot.settings, 
              [messageType]: value 
            } 
          }
        : bot
    ));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await clubApi.updateBotConfig(bots);
      if (response.success) {
        toast.success('Настройки ботов сохранены');
      }
    } catch (error) {
      console.error('Ошибка сохранения настроек ботов:', error);
      toast.error('Ошибка при сохранении настроек ботов');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bot-settings-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка настроек ботов...</p>
      </div>
    );
  }

  return (
    <div className="bot-settings">
      {/* Header */}
      <div className="bot-settings-header">
        <div className="header-content">
          <h1>Настройка ботов</h1>
          <p>Управление автоматическими ботами клуба</p>
        </div>
        <Link to="/club/dashboard" className="btn btn-secondary">
          ← Назад к дашборду
        </Link>
      </div>

      {/* Bots List */}
      <div className="bots-list">
        {bots.map(bot => (
          <div key={bot.id} className="bot-card">
            <div className="bot-header">
              <div className="bot-info">
                <h3>{bot.name}</h3>
                <p>{bot.description}</p>
              </div>
              <div className="bot-toggle">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={bot.enabled}
                    onChange={(e) => handleBotToggle(bot.id, e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
                <span className="toggle-label">
                  {bot.enabled ? 'Включен' : 'Выключен'}
                </span>
              </div>
            </div>

            {bot.enabled && (
              <div className="bot-settings-content">
                {bot.settings.trigger_type === 'registration' && (
                  <div className="setting-group">
                    <label>Приветственное сообщение:</label>
                    <textarea
                      value={bot.settings.welcome_message || ''}
                      onChange={(e) => handleMessageChange(bot.id, 'welcome_message', e.target.value)}
                      placeholder="Введите текст приветствия..."
                      rows={3}
                    />
                  </div>
                )}

                {bot.settings.trigger_type === 'first_message' && (
                  <div className="setting-group">
                    <label>Сообщение с рекомендациями:</label>
                    <textarea
                      value={bot.settings.recommendation_message || ''}
                      onChange={(e) => handleMessageChange(bot.id, 'recommendation_message', e.target.value)}
                      placeholder="Введите текст рекомендаций..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="bot-settings-actions">
        <button 
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Сохранение...' : 'Сохранить настройки'}
        </button>
      </div>
    </div>
  );
};

export default ClubBotSettings;
