import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { clubDashboardAPI } from '../services/api';

// Контейнер страницы с градиентным фоном
const DashboardContainer = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
`;

// Главная карточка с эффектами
const DashboardCard = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  border-radius: 24px;
  padding: 48px;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #dc3522, #ff6b58, #dc3522);
    border-radius: 24px 24px 0 0;
  }
  
  @media (max-width: 768px) {
    padding: 32px 24px;
    margin: 20px;
    width: calc(100% - 40px);
  }
`;

// Заголовок с анимацией
const Header = styled.div`
  text-align: center;
  margin-bottom: 48px;
`;

const Title = styled.h1`
  font-size: 42px;
  font-weight: 800;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 16px 0;
  position: relative;
  
  &::after {
    content: '🎪';
    position: absolute;
    top: -15px;
    right: -30px;
    font-size: 32px;
    animation: bounce 2s infinite;
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }
  
  @media (max-width: 768px) {
    font-size: 32px;
    
    &::after {
      font-size: 24px;
      top: -12px;
      right: -24px;
    }
  }
`;

const Subtitle = styled.p`
  font-size: 20px;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
  font-weight: 500;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

// Статистика в виде карточек
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 32px 24px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #dc3522, #ff6b58);
    border-radius: 20px 20px 0 0;
  }
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(220, 53, 34, 0.15);
  }
`;

const StatIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
`;

const StatValue = styled.div`
  font-size: 36px;
  font-weight: 800;
  color: #dc3522;
  margin-bottom: 8px;
  
  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const StatLabel = styled.div`
  font-size: 16px;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// Действия
const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const ActionCard = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 20px;
  padding: 32px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #dc3522, #ff6b58);
    border-radius: 20px 20px 0 0;
  }
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(220, 53, 34, 0.15);
    border-color: #dc3522;
  }
`;

const ActionIcon = styled.div`
  font-size: 64px;
  margin-bottom: 24px;
  transition: transform 0.3s ease;
  
  ${ActionCard}:hover & {
    transform: scale(1.1);
  }
`;

const ActionTitle = styled.h3`
  font-size: 24px;
  font-weight: 700;
  color: #dc3522;
  margin: 0 0 16px 0;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const ActionDescription = styled.p`
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

// Кнопка выхода
const LogoutButton = styled.button`
  background: linear-gradient(135deg, #dc3522 0%, #991b1b 100%);
  color: white;
  border: none;
  border-radius: 16px;
  padding: 16px 32px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: block;
  margin: 0 auto;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 40px rgba(220, 53, 34, 0.3);
  }
  
  &:active {
    transform: translateY(-1px);
  }
  
  @media (max-width: 768px) {
    padding: 14px 28px;
    font-size: 16px;
  }
`;

// Дополнительные декоративные элементы
const DecorativeCircle = styled.div`
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(220, 53, 34, 0.3) 0%, rgba(255, 107, 88, 0.3) 100%) !important;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(220, 53, 34, 0.4) !important;
  z-index: 1;
  
  &.circle-1 {
    width: 400px;
    height: 400px;
    top: -200px;
    right: -200px;
    animation: float 6s ease-in-out infinite;
    background: linear-gradient(135deg, rgba(220, 53, 34, 0.4) 0%, rgba(255, 107, 88, 0.4) 100%) !important;
    border: 3px solid rgba(220, 53, 34, 0.6) !important;
  }
  
  &.circle-2 {
    width: 300px;
    height: 300px;
    bottom: -150px;
    left: -150px;
    animation: float 8s ease-in-out infinite reverse;
    background: linear-gradient(135deg, rgba(220, 53, 34, 0.4) 0%, rgba(255, 107, 88, 0.4) 100%) !important;
    border: 3px solid rgba(220, 53, 34, 0.6) !important;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
  }
  
  @media (max-width: 768px) {
    &.circle-1 {
      width: 300px;
      height: 300px;
      top: -150px;
      right: -150px;
    }
    
    &.circle-2 {
      width: 200px;
      height: 200px;
      bottom: -100px;
      left: -100px;
    }
  }
`;

const ClubDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Проверяем аутентификацию
    const clubToken = localStorage.getItem('clubToken');
    if (!clubToken) {
      toast.error('Необходима авторизация');
      navigate('/club/login');
      return;
    }
    
    loadDashboard();
  }, [navigate]);
  
  const loadDashboard = async () => {
    // Проверяем наличие токена клуба
    const clubToken = localStorage.getItem('clubToken');
    if (!clubToken) {
      toast.error('Токен клуба не найден. Войдите снова.');
      navigate('/club/login');
      return;
    }
    
    try {
      const data = await clubDashboardAPI.getDashboard();
      setDashboardData(data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('clubToken');
        navigate('/club/login');
      } else {
        toast.error('Ошибка загрузки дашборда');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('clubToken');
    toast.success('Выход выполнен успешно');
    navigate('/club/login');
  };
  
  const handleCreateEvent = () => {
    toast('Создание мероприятий будет доступно в следующем обновлении', {
      icon: 'ℹ️',
      duration: 4000
    });
  };
  
  const handleViewEvents = () => {
    toast('Просмотр мероприятий будет доступен в следующем обновлении', {
      icon: 'ℹ️',
      duration: 4000
    });
  };
  
  const handleViewParticipants = () => {
    toast('Управление участниками будет доступно в следующем обновлении', {
      icon: 'ℹ️',
      duration: 4000
    });
  };
  
  const handleSettings = () => {
    toast('Настройки клуба будут доступны в следующем обновлении', {
      icon: 'ℹ️',
      duration: 4000
    });
  };
  
  if (isLoading) {
    return (
      <DashboardContainer>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: 'white',
          fontSize: '24px'
        }}>
          Загрузка дашборда...
        </div>
      </DashboardContainer>
    );
  }
  
  if (!dashboardData) {
    return (
      <DashboardContainer>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: 'white',
          fontSize: '24px'
        }}>
          Ошибка загрузки данных
        </div>
      </DashboardContainer>
    );
  }
  
  return (
    <DashboardContainer>
      <DecorativeCircle className="circle-1" />
      <DecorativeCircle className="circle-2" />
      
      <DashboardCard>
        <Header>
          <Title>Панель управления клубом</Title>
          <Subtitle>
            Управляйте мероприятиями, участниками и настройками вашего клуба
          </Subtitle>
        </Header>
        
        <StatsGrid>
          <StatCard>
            <StatIcon>📅</StatIcon>
            <StatValue>{dashboardData.totalEvents || 0}</StatValue>
            <StatLabel>Мероприятий</StatLabel>
          </StatCard>
          
          <StatCard>
            <StatIcon>👥</StatIcon>
            <StatValue>{dashboardData.totalParticipants || 0}</StatValue>
            <StatLabel>Участников</StatLabel>
          </StatCard>
          
          <StatCard>
            <StatIcon>💰</StatIcon>
            <StatValue>{dashboardData.balance || 0} ₽</StatValue>
            <StatLabel>Баланс</StatLabel>
          </StatCard>
          
          <StatCard>
            <StatIcon>⭐</StatIcon>
            <StatValue>{dashboardData.rating || 'Н/Д'}</StatValue>
            <StatLabel>Рейтинг</StatLabel>
          </StatCard>
        </StatsGrid>
        
        <ActionsGrid>
          <ActionCard onClick={handleCreateEvent}>
            <ActionIcon>🎉</ActionIcon>
            <ActionTitle>Создать мероприятие</ActionTitle>
            <ActionDescription>
              Организуйте новое мероприятие для участников вашего клуба
            </ActionDescription>
          </ActionCard>
          
          <ActionCard onClick={handleViewEvents}>
            <ActionIcon>📋</ActionIcon>
            <ActionTitle>Мои мероприятия</ActionTitle>
            <ActionDescription>
              Просматривайте и управляйте всеми вашими мероприятиями
            </ActionDescription>
          </ActionCard>
          
          <ActionCard onClick={handleViewParticipants}>
            <ActionIcon>👥</ActionIcon>
            <ActionTitle>Участники</ActionTitle>
            <ActionDescription>
              Управляйте списком участников и их статусами
            </ActionDescription>
          </ActionCard>
          
          <ActionCard onClick={handleSettings}>
            <ActionIcon>⚙️</ActionIcon>
            <ActionTitle>Настройки</ActionTitle>
            <ActionDescription>
              Настройте параметры клуба и профиль
            </ActionDescription>
          </ActionCard>
        </ActionsGrid>
        
        <LogoutButton onClick={handleLogout}>
          Выйти из системы
        </LogoutButton>
      </DashboardCard>
    </DashboardContainer>
  );
};

export default ClubDashboard;
