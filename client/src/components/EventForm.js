import React, { useState, useEffect } from 'react';
import { clubApi } from '../services/clubApi';
import ClubAvatarCropper from './UI/ClubAvatarCropper';
import EventImageUploader from './UI/EventImageUploader';
import toast from 'react-hot-toast';
import './EventForm.css';

const EventForm = ({ event, onSave, onCancel, clubId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    max_participants: '',
    category: 'party',
    age_restriction: '18+',
    dress_code: '',
    special_requirements: '',
    duration_hours: 2
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [eventImages, setEventImages] = useState([]);

  useEffect(() => {
    if (event) {
      const eventDate = new Date(event.date);
      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: eventDate.toISOString().split('T')[0],
        time: eventDate.toTimeString().slice(0, 5),
        location: event.location || '',
        max_participants: event.max_participants || '',
        category: event.category || 'party',
        age_restriction: event.age_restriction || '18+',
        dress_code: event.dress_code || '',
        special_requirements: event.special_requirements || '',
        avatar: event.avatar || '',
        duration_hours: event.duration_hours || 2
      });
      
      // Загружаем существующие изображения
      setEventImages(event.images || []);
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


    if (formData.max_participants && (isNaN(parseInt(formData.max_participants)) || parseInt(formData.max_participants) < 1)) {
      newErrors.max_participants = 'Количество участников должно быть положительным числом';
    }

    if (formData.duration_hours && (isNaN(parseInt(formData.duration_hours)) || parseInt(formData.duration_hours) < 1 || parseInt(formData.duration_hours) > 24)) {
      newErrors.duration_hours = 'Длительность должна быть от 1 до 24 часов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAvatarClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setSelectedImageFile(file);
        setShowAvatarCropper(true);
      }
    };
    input.click();
  };

  const handleAvatarCrop = async (cropData) => {
    try {
      // Если это создание нового мероприятия, сохраняем файл для последующей загрузки
      if (!event?.id) {
        setFormData(prev => ({
          ...prev,
          avatarFile: cropData.file,
          avatar: URL.createObjectURL(cropData.file), // Для предварительного просмотра
          avatarCropParams: cropData.cropParams // Сохраняем параметры обрезки
        }));
        return;
      }
      
      // Если это редактирование существующего мероприятия
      const formData = new FormData();
      formData.append('avatar', cropData.file);
      
      if (cropData.cropParams) {
        formData.append('x', cropData.cropParams.x);
        formData.append('y', cropData.cropParams.y);
        formData.append('width', cropData.cropParams.width);
        formData.append('height', cropData.cropParams.height);
      }
      
      const response = await clubApi.uploadEventAvatar(event.id, formData);
      
      if (response.success) {
        // Обновляем аватар в форме
        setFormData(prev => ({
          ...prev,
          avatar: response.filename
        }));
      }
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      toast.error('Ошибка при загрузке аватара мероприятия');
    }
  };

  const handleCloseAvatarCropper = () => {
    setShowAvatarCropper(false);
    setSelectedImageFile(null);
  };

  const handleImageUpload = async (eventId, formData) => {
    try {
      // Если это создание нового мероприятия, сохраняем файлы для последующей загрузки
      if (!event?.id) {
        const files = Array.from(formData.getAll('images'));
        setFormData(prev => ({
          ...prev,
          imageFiles: [...(prev.imageFiles || []), ...files]
        }));
        
        // Добавляем в локальный массив для предварительного просмотра
        const newImages = files.map(file => ({
          file,
          preview: URL.createObjectURL(file),
          id: Date.now() + Math.random()
        }));
        setEventImages(prev => [...prev, ...newImages]);
        
        return { success: true, files: newImages };
      }
      
      // Если это редактирование существующего мероприятия
      const response = await clubApi.uploadEventImages(eventId, formData);
      
      if (response.success) {
        const newImages = response.files.map(f => f.filename);
        setEventImages(prev => [...prev, ...newImages]);
        console.log('Images uploaded successfully:', newImages);
        console.log('Updated eventImages:', [...eventImages, ...newImages]);
      }
      
      return response;
    } catch (error) {
      console.error('Ошибка загрузки изображений:', error);
      throw error;
    }
  };

  const handleImageRemove = async (eventId, filename) => {
    try {
      // Если это создание нового мероприятия, удаляем из локального массива
      if (!event?.id) {
        setEventImages(prev => prev.filter(img => {
          if (typeof img === 'string') {
            return img !== filename;
          }
          return img.id !== filename;
        }));
        
        // Также удаляем из formData
        setFormData(prev => ({
          ...prev,
          imageFiles: (prev.imageFiles || []).filter(file => file.name !== filename)
        }));
        return;
      }
      
      // Если это редактирование существующего мероприятия
      await clubApi.deleteEventImage(eventId, filename);
      setEventImages(prev => prev.filter(img => img !== filename));
    } catch (error) {
      console.error('Ошибка удаления изображения:', error);
      throw error;
    }
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
        price: 0, // Все мероприятия бесплатные
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        duration_hours: formData.duration_hours ? parseInt(formData.duration_hours) : 2,
        // Добавляем текущие изображения при обновлении
        images: event ? eventImages : undefined
      };

      let createdEvent;
      if (event) {
        // Редактирование существующего события
        await clubApi.updateEvent(event.id, eventData);
      } else {
        // Создание нового события
        createdEvent = await clubApi.createEvent(eventData);
        
        // Если есть загруженные файлы, загружаем их после создания мероприятия
        if (formData.avatarFile || (formData.imageFiles && formData.imageFiles.length > 0)) {
          const eventId = createdEvent.event?.id || createdEvent.id;
          
          // Загружаем аватарку
          if (formData.avatarFile) {
            try {
              const avatarFormData = new FormData();
              avatarFormData.append('avatar', formData.avatarFile);
              
              // Если есть параметры обрезки, добавляем их
              if (formData.avatarCropParams) {
                avatarFormData.append('x', formData.avatarCropParams.x);
                avatarFormData.append('y', formData.avatarCropParams.y);
                avatarFormData.append('width', formData.avatarCropParams.width);
                avatarFormData.append('height', formData.avatarCropParams.height);
              }
              
              await clubApi.uploadEventAvatar(eventId, avatarFormData);
            } catch (error) {
              console.error('Ошибка загрузки аватарки:', error);
              toast.error('Ошибка при загрузке аватарки мероприятия');
            }
          }
          
          // Загружаем изображения
          if (formData.imageFiles && formData.imageFiles.length > 0) {
            try {
              const imagesFormData = new FormData();
              formData.imageFiles.forEach(file => {
                imagesFormData.append('images', file);
              });
              
              await clubApi.uploadEventImages(eventId, imagesFormData);
            } catch (error) {
              console.error('Ошибка загрузки изображений:', error);
              toast.error('Ошибка при загрузке изображений мероприятия');
            }
          }
        }
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

          {/* Аватар мероприятия */}
          <div className="form-section">
            <h3>Аватар мероприятия</h3>
            <div 
              className="event-avatar-upload"
              onClick={handleAvatarClick}
              style={{
                width: '200px',
                height: '80px',
                border: '2px dashed #e2e8f0',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: formData.avatar ? 'transparent' : '#f8fafc',
                backgroundImage: formData.avatar ? 
                  (formData.avatar.startsWith('blob:') ? `url(${formData.avatar})` : `url(/uploads/${formData.avatar})`) : 
                  'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                position: 'relative'
              }}
            >
              {!formData.avatar && (
                <div style={{ textAlign: 'center', color: '#718096' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>📷</div>
                  <div style={{ fontSize: '12px' }}>Загрузить аватар</div>
                </div>
              )}
              {formData.avatar && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  color: 'white',
                  fontSize: '12px'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '1'}
                onMouseLeave={(e) => e.target.style.opacity = '0'}
                >
                  Изменить
                </div>
              )}
            </div>
          </div>

          {/* Галерея изображений */}
          <div className="form-section">
            <h3>Галерея изображений</h3>
            <EventImageUploader
              eventId={event?.id || 'new'}
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              existingImages={eventImages}
              maxFiles={10}
            />
          </div>

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

            <div className="form-group">
              <label htmlFor="duration_hours">Длительность (часы)</label>
              <input
                type="number"
                id="duration_hours"
                name="duration_hours"
                value={formData.duration_hours}
                onChange={handleChange}
                className={errors.duration_hours ? 'error' : ''}
                placeholder="2"
                min="1"
                max="24"
              />
              {errors.duration_hours && <span className="field-error">{errors.duration_hours}</span>}
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

        {/* Модальное окно обрезки аватара */}
        <ClubAvatarCropper
          isOpen={showAvatarCropper}
          onClose={handleCloseAvatarCropper}
          imageFile={selectedImageFile}
          onCrop={handleAvatarCrop}
          aspectRatio={590/160}
        />
      </div>
    </div>
  );
};

export default EventForm;
