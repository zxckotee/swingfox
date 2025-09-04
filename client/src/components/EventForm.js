import React, { useState, useEffect } from 'react';
import { clubApi } from '../services/clubApi';
import './EventForm.css';

const EventForm = ({ event, onSave, onCancel, clubId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    price: '',
    max_participants: '',
    category: 'party',
    age_restriction: '18+',
    dress_code: '',
    special_requirements: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (event) {
      const eventDate = new Date(event.date);
      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: eventDate.toISOString().split('T')[0],
        time: eventDate.toTimeString().slice(0, 5),
        location: event.location || '',
        price: event.price || '',
        max_participants: event.max_participants || '',
        category: event.category || 'party',
        age_restriction: event.age_restriction || '18+',
        dress_code: event.dress_code || '',
        special_requirements: event.special_requirements || ''
      });
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название события обязательно';
    }

    if (!formData.date) {
      newErrors.date = 'Дата события обязательна';
    } else {
      const eventDate = new Date(`${formData.date}T${formData.time}`);
      if (eventDate <= new Date()) {
        newErrors.date = 'Дата события должна быть в будущем';
      }
    }

    if (!formData.time) {
      newErrors.time = 'Время события обязательно';
    }

    if (formData.price && isNaN(parseFloat(formData.price))) {
      newErrors.price = 'Цена должна быть числом';
    }

    if (formData.max_participants && (isNaN(parseInt(formData.max_participants)) || parseInt(formData.max_participants) < 1)) {
      newErrors.max_participants = 'Количество участников должно быть положительным числом';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        ...formData,
        club_id: clubId,
        date: new Date(`${formData.date}T${formData.time}`).toISOString(),
        price: formData.price ? parseFloat(formData.price) : 0,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null
      };

      if (event) {
        // Редактирование существующего события
        await clubApi.updateEvent(event.id, eventData);
      } else {
        // Создание нового события
        await clubApi.createEvent(eventData);
      }

      onSave();
    } catch (error) {
      console.error('Ошибка сохранения события:', error);
      setErrors({ submit: 'Ошибка сохранения события' });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'party', label: 'Вечеринка' },
    { value: 'concert', label: 'Концерт' },
    { value: 'workshop', label: 'Мастер-класс' },
    { value: 'networking', label: 'Нетворкинг' },
    { value: 'exhibition', label: 'Выставка' },
    { value: 'sports', label: 'Спорт' },
    { value: 'other', label: 'Другое' }
  ];

  const ageRestrictions = [
    { value: '16+', label: '16+' },
    { value: '18+', label: '18+' },
    { value: '21+', label: '21+' },
    { value: 'all', label: 'Все возрасты' }
  ];

  return (
    <div className="event-form-overlay">
      <div className="event-form">
        <div className="event-form-header">
          <h2>{event ? 'Редактировать событие' : 'Создать событие'}</h2>
          <button 
            type="button" 
            className="close-button"
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="event-form-content">
          {errors.submit && (
            <div className="error-message">
              {errors.submit}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Название события *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={errors.title ? 'error' : ''}
                placeholder="Введите название события"
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="category">Категория</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Опишите событие..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Дата события *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={errors.date ? 'error' : ''}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.date && <span className="field-error">{errors.date}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="time">Время события *</label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className={errors.time ? 'error' : ''}
              />
              {errors.time && <span className="field-error">{errors.time}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Место проведения</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Адрес или название места"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Цена (₽)</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className={errors.price ? 'error' : ''}
                placeholder="0"
                min="0"
                step="0.01"
              />
              {errors.price && <span className="field-error">{errors.price}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="max_participants">Макс. участников</label>
              <input
                type="number"
                id="max_participants"
                name="max_participants"
                value={formData.max_participants}
                onChange={handleChange}
                className={errors.max_participants ? 'error' : ''}
                placeholder="Без ограничений"
                min="1"
              />
              {errors.max_participants && <span className="field-error">{errors.max_participants}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="age_restriction">Возрастные ограничения</label>
              <select
                id="age_restriction"
                name="age_restriction"
                value={formData.age_restriction}
                onChange={handleChange}
              >
                {ageRestrictions.map(age => (
                  <option key={age.value} value={age.value}>
                    {age.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dress_code">Дресс-код</label>
              <input
                type="text"
                id="dress_code"
                name="dress_code"
                value={formData.dress_code}
                onChange={handleChange}
                placeholder="Например: вечерний, casual"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="special_requirements">Особые требования</label>
            <textarea
              id="special_requirements"
              name="special_requirements"
              value={formData.special_requirements}
              onChange={handleChange}
              rows="3"
              placeholder="Дополнительная информация для участников..."
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Сохранение...' : (event ? 'Сохранить изменения' : 'Создать событие')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
