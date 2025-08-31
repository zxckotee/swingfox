import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Иконки
import { 
  SettingsIcon, 
  SaveIcon, 
  BotIcon,
  UsersIcon,
  BellIcon,
  ShieldIcon
} from './UI';

const Container = styled.div`
  padding: 20px 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  color: #2d3748;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(72, 187, 120, 0.3);
  }
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
`;

const SettingsSection = styled(motion.div)`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
`;

const SectionTitle = styled.h3`
  font-size: 1.3rem;
  color: #2d3748;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e2e8f0;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
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
  width: 100%;
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
  width: 100%;
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
  margin-bottom: 15px;
  
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

const ToggleSwitch = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  
  .switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
  }
  
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e0;
    transition: 0.3s;
    border-radius: 24px;
  }
  
  .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
  
  input:checked + .slider {
    background-color: #dc3522;
  }
  
  input:checked + .slider:before {
    transform: translateX(26px);
  }
  
  label {
    font-weight: 500;
    color: #4a5568;
    cursor: pointer;
  }
`;

const HelpText = styled.p`
  font-size: 0.8rem;
  color: #718096;
  margin-top: 5px;
  line-height: 1.4;
`;

const BotSettings = styled.div`
  background: #f7fafc;
  border-radius: 10px;
  padding: 20px;
  margin-top: 15px;
`;

const BotMessagePreview = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 15px;
  margin-top: 10px;
  font-size: 0.9rem;
  color: #4a5568;
  line-height: 1.5;
`;

const ClubSettingsInterface = () => {
  const [settings, setSettings] = useState({
    // Основные настройки клуба
    clubName: 'Веселый клуб',
    description: 'Клуб для активных людей, которые любят веселиться и знакомиться',
    category: 'party',
    city: 'Москва',
    isPrivate: false,
    maxMembers: 100,
    
    // Настройки бота
    botEnabled: true,
    welcomeMessage: 'Привет! Добро пожаловать в наш клуб! 👋 Мы рады видеть вас здесь.',
    invitationMessage: 'Приглашаем вас на наше следующее мероприятие! Будет очень весело! 🎉',
    thanksMessage: 'Спасибо за вступление в клуб! Мы обязательно свяжемся с вами! 💖',
    
    // Настройки уведомлений
    emailNotifications: true,
    pushNotifications: true,
    eventReminders: true,
    
    // Настройки приватности
    showMembersList: true,
    allowDirectMessages: true,
    requireApproval: false
  });

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    toast.success('Настройки сохранены успешно!');
  };

  return (
    <Container>
      <Header>
        <Title>
          <SettingsIcon />
          Настройки клуба
        </Title>
        <SaveButton onClick={handleSave}>
          <SaveIcon />
          Сохранить настройки
        </SaveButton>
      </Header>

      <SettingsGrid>
        {/* Основные настройки */}
        <SettingsSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SectionTitle>
            <UsersIcon />
            Основная информация
          </SectionTitle>
          
          <FormGroup>
            <Label>Название клуба</Label>
            <Input
              type="text"
              value={settings.clubName}
              onChange={(e) => handleInputChange('clubName', e.target.value)}
              placeholder="Введите название клуба"
            />
          </FormGroup>

          <FormGroup>
            <Label>Описание</Label>
            <TextArea
              value={settings.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Опишите ваш клуб"
            />
          </FormGroup>

          <FormGroup>
            <Label>Категория</Label>
            <Select
              value={settings.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
            >
              <option value="party">Вечеринки</option>
              <option value="dinner">Ужины</option>
              <option value="activity">Активности</option>
              <option value="networking">Нетворкинг</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Город</Label>
            <Input
              type="text"
              value={settings.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Введите город"
            />
          </FormGroup>

          <FormGroup>
            <Label>Максимальное количество участников</Label>
            <Input
              type="number"
              value={settings.maxMembers}
              onChange={(e) => handleInputChange('maxMembers', parseInt(e.target.value))}
              min="1"
              max="1000"
            />
          </FormGroup>

          <Checkbox>
            <input
              type="checkbox"
              checked={settings.isPrivate}
              onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
            />
            <label>Приватный клуб (только по приглашениям)</label>
          </Checkbox>
        </SettingsSection>

        {/* Настройки бота */}
        <SettingsSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <SectionTitle>
            <BotIcon />
            Настройки бота
          </SectionTitle>
          
          <ToggleSwitch>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.botEnabled}
                onChange={(e) => handleInputChange('botEnabled', e.target.checked)}
              />
              <span className="slider"></span>
            </label>
            <label>Включить автоматического бота</label>
          </ToggleSwitch>

          {settings.botEnabled && (
            <BotSettings>
              <FormGroup>
                <Label>Приветственное сообщение</Label>
                <TextArea
                  value={settings.welcomeMessage}
                  onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                  placeholder="Сообщение, которое бот отправляет новым участникам"
                />
                <HelpText>Это сообщение будет отправлено каждому новому участнику клуба</HelpText>
                <BotMessagePreview>
                  <strong>Предварительный просмотр:</strong><br />
                  {settings.welcomeMessage}
                </BotMessagePreview>
              </FormGroup>

              <FormGroup>
                <Label>Сообщение-приглашение</Label>
                <TextArea
                  value={settings.invitationMessage}
                  onChange={(e) => handleInputChange('invitationMessage', e.target.value)}
                  placeholder="Сообщение для приглашения на мероприятия"
                />
                <HelpText>Используется для приглашения участников на мероприятия</HelpText>
              </FormGroup>

              <FormGroup>
                <Label>Сообщение благодарности</Label>
                <TextArea
                  value={settings.thanksMessage}
                  onChange={(e) => handleInputChange('thanksMessage', e.target.value)}
                  placeholder="Сообщение после вступления в клуб"
                />
                <HelpText>Отправляется после успешного вступления в клуб</HelpText>
              </FormGroup>
            </BotSettings>
          )}
        </SettingsSection>

        {/* Настройки уведомлений */}
        <SettingsSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <SectionTitle>
            <BellIcon />
            Уведомления
          </SectionTitle>
          
          <Checkbox>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
            />
            <label>Email уведомления</label>
          </Checkbox>

          <Checkbox>
            <input
              type="checkbox"
              checked={settings.pushNotifications}
              onChange={(e) => handleInputChange('pushNotifications', e.target.checked)}
            />
            <label>Push уведомления</label>
          </Checkbox>

          <Checkbox>
            <input
              type="checkbox"
              checked={settings.eventReminders}
              onChange={(e) => handleInputChange('eventReminders', e.target.checked)}
            />
            <label>Напоминания о мероприятиях</label>
          </Checkbox>

          <HelpText>
            Выберите типы уведомлений, которые хотите получать о деятельности клуба
          </HelpText>
        </SettingsSection>

        {/* Настройки приватности */}
        <SettingsSection
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <SectionTitle>
            <ShieldIcon />
            Приватность и безопасность
          </SectionTitle>
          
          <Checkbox>
            <input
              type="checkbox"
              checked={settings.showMembersList}
              onChange={(e) => handleInputChange('showMembersList', e.target.checked)}
            />
            <label>Показывать список участников</label>
          </Checkbox>

          <Checkbox>
            <input
              type="checkbox"
              checked={settings.allowDirectMessages}
              onChange={(e) => handleInputChange('allowDirectMessages', e.target.checked)}
            />
            <label>Разрешить личные сообщения</label>
          </Checkbox>

          <Checkbox>
            <input
              type="checkbox"
              checked={settings.requireApproval}
              onChange={(e) => handleInputChange('requireApproval', e.target.checked)}
            />
            <label>Требовать одобрения для вступления</label>
          </Checkbox>

          <HelpText>
            Эти настройки помогут контролировать, как участники взаимодействуют друг с другом
          </HelpText>
        </SettingsSection>
      </SettingsGrid>
    </Container>
  );
};

export default ClubSettingsInterface;
