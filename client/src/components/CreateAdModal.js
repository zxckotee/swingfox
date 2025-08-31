import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Иконки
import { 
  CloseIcon, 
  CalendarIcon, 
  MapPinIcon, 
  UsersIcon,
  PlusIcon,
  EditIcon
} from './UI';

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e2e8f0;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  color: #2d3748;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #718096;
  cursor: pointer;
  padding: 5px;
  border-radius: 5px;
  transition: all 0.3s ease;
  
  &:hover {
    background: #f7fafc;
    color: #2d3748;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #2d3748;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #dc3522;
    box-shadow: 0 0 0 3px rgba(220, 53, 34, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #dc3522;
    box-shadow: 0 0 0 3px rgba(220, 53, 34, 0.1);
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #dc3522;
    box-shadow: 0 0 0 3px rgba(220, 53, 34, 0.1);
  }
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #dc3522;
  }
  
  label {
    font-weight: 500;
    color: #4a5568;
    cursor: pointer;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.primary {
    background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
    color: white;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(220, 53, 34, 0.3);
    }
  }
  
  &.secondary {
    background: #f7fafc;
    color: #4a5568;
    border: 1px solid #e2e8f0;
    
    &:hover:not(:disabled) {
      background: #edf2f7;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const EventFields = styled.div`
  background: #f7fafc;
  border-radius: 10px;
  padding: 20px;
  margin-top: 10px;
  border: 1px solid #e2e8f0;
`;

const CreateAdModal = ({ isOpen, onClose, onSuccess, editAd = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'ad', // 'ad' или 'event'
    date: '',
    location: '',
    maxParticipants: '',
    clubContactInfo: '',
    viralShareEnabled: true,
    referralBonus: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Заполняем форму данными для редактирования
  useEffect(() => {
    if (editAd) {
      setFormData({
        title: editAd.title || '',
        description: editAd.description || '',
        type: editAd.type || 'ad',
        date: editAd.date ? new Date(editAd.date).toISOString().split('T')[0] : '',
        location: editAd.location || '',
        maxParticipants: editAd.maxParticipants || '',
        clubContactInfo: editAd.club_contact_info || '',
        viralShareEnabled: editAd.viral_share_enabled !== false,
        referralBonus: editAd.referral_bonus || 0
      });
    } else {
      // Сброс формы для создания
      setFormData({
        title: '',
        description: '',
        type: 'ad',
        date: '',
        location: '',
        maxParticipants: '',
        clubContactInfo: '',
        viralShareEnabled: true,
        referralBonus: 0
      });
    }
  }, [editAd, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.title.trim()) {
      toast.error('Заголовок обязателен');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Описание обязательно');
      return;
    }
    
    if (formData.type === 'event') {
      if (!formData.date) {
        toast.error('Дата мероприятия обязательна');
        return;
      }
      
      if (!formData.location.trim()) {
        toast.error('Место проведения обязательно');
        return;
      }
      
      if (!formData.maxParticipants || formData.maxParticipants < 1) {
        toast.error('Максимальное количество участников должно быть больше 0');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        date: formData.date,
        location: formData.location.trim(),
        maxParticipants: parseInt(formData.maxParticipants) || null,
        clubContactInfo: formData.clubContactInfo.trim(),
        viralShareEnabled: formData.viralShareEnabled,
        referralBonus: parseInt(formData.referralBonus) || 0
      };

      if (editAd) {
        // Обновление существующего объявления
        await onSuccess({ adId: editAd.id, adData: submitData });
      } else {
        // Создание нового объявления
        await onSuccess(submitData);
      }

      onClose();
      toast.success(editAd ? 'Объявление обновлено!' : 'Объявление создано!');
    } catch (error) {
      console.error('Ошибка сохранения объявления:', error);
      toast.error('Ошибка сохранения объявления');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <ModalContent
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader>
              <ModalTitle>
                {editAd ? <EditIcon /> : <PlusIcon />}
                {editAd ? 'Редактировать объявление' : 'Создать объявление'}
              </ModalTitle>
              <CloseButton onClick={onClose}>
                <CloseIcon />
              </CloseButton>
            </ModalHeader>

            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Тип объявления *</Label>
                <Select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  <option value="ad">Обычное объявление</option>
                  <option value="event">Мероприятие</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Заголовок *</Label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Введите заголовок объявления"
                  maxLength={100}
                />
              </FormGroup>

              <FormGroup>
                <Label>Описание *</Label>
                <TextArea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Опишите ваше объявление или мероприятие"
                  maxLength={500}
                />
              </FormGroup>

              {formData.type === 'event' && (
                <EventFields>
                  <FormRow>
                    <FormGroup>
                      <Label>Дата мероприятия *</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Максимум участников *</Label>
                      <Input
                        type="number"
                        value={formData.maxParticipants}
                        onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                        placeholder="Например: 50"
                        min="1"
                        max="1000"
                      />
                    </FormGroup>
                  </FormRow>
                  <FormGroup>
                    <Label>Место проведения *</Label>
                    <Input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Адрес или название места"
                      maxLength={200}
                    />
                  </FormGroup>
                </EventFields>
              )}

              <FormGroup>
                <Label>Контактная информация</Label>
                <TextArea
                  value={formData.clubContactInfo}
                  onChange={(e) => handleInputChange('clubContactInfo', e.target.value)}
                  placeholder="Телефон, email или другие способы связи"
                  maxLength={300}
                />
              </FormGroup>

              <FormGroup>
                <Label>Дополнительные настройки</Label>
                <Checkbox>
                  <input
                    type="checkbox"
                    checked={formData.viralShareEnabled}
                    onChange={(e) => handleInputChange('viralShareEnabled', e.target.checked)}
                  />
                  <label>Разрешить делиться в социальных сетях</label>
                </Checkbox>
              </FormGroup>

              <FormGroup>
                <Label>Реферальный бонус (руб.)</Label>
                <Input
                  type="number"
                  value={formData.referralBonus}
                  onChange={(e) => handleInputChange('referralBonus', e.target.value)}
                  placeholder="0"
                  min="0"
                  max="10000"
                />
              </FormGroup>

              <ButtonGroup>
                <Button
                  type="button"
                  className="secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  className="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Сохранение...' : (editAd ? 'Обновить' : 'Создать')}
                </Button>
              </ButtonGroup>
            </Form>
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
};

export default CreateAdModal;
