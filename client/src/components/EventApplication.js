import React, { useState } from 'react';
import { clubApi } from '../services/clubApi';
import './EventApplication.css';

const EventApplication = ({ event, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    message: '',
    contact_info: '',
    special_requirements: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      setError('Пожалуйста, напишите сообщение');
      return;
    }

    setLoading(true);
    try {
      await clubApi.applyToEvent(event.id, formData);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Ошибка подачи заявки:', error);
      setError('Не удалось подать заявку. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="event-application-overlay">
      <div className="event-application">
        <div className="application-header">
          <h2>Подать заявку на участие</h2>
          <button 
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="event-info">
          <h3>{event.title}</h3>
          <div className="event-details">
            <div className="detail-item">
              <span className="detail-icon">📅</span>
              <span>{formatEventDate(event.date)}</span>
            </div>
            {event.location && (
              <div className="detail-item">
                <span className="detail-icon">📍</span>
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="application-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="message">
              Сообщение организатору *
              <span className="label-hint">Расскажите, почему вы хотите участвовать в этом событии</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="4"
              placeholder="Напишите сообщение организатору..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact_info">
              Контактная информация
              <span className="label-hint">Телефон, Telegram или другие способы связи</span>
            </label>
            <input
              type="text"
              id="contact_info"
              name="contact_info"
              value={formData.contact_info}
              onChange={handleChange}
              placeholder="+7 (999) 123-45-67 или @username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="special_requirements">
              Особые требования
              <span className="label-hint">Диетические ограничения, доступность и т.д.</span>
            </label>
            <textarea
              id="special_requirements"
              name="special_requirements"
              value={formData.special_requirements}
              onChange={handleChange}
              rows="3"
              placeholder="Укажите, если у вас есть особые требования..."
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Отправка...' : 'Подать заявку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventApplication;
