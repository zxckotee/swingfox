import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';

// Импорты для пользователей
import SwipeInterface from '../components/SwipeInterface';
import CatalogInterface from '../components/CatalogInterface';

// Импорты для клубов
import ClubAdsInterface from '../components/ClubAdsInterface';
import ClubChatInterface from '../components/ClubChatInterface';
import ClubSettingsInterface from '../components/ClubSettingsInterface';
import ClubAnalyticsInterface from '../components/ClubAnalyticsInterface';

// API
import { clubAuthAPI } from '../services/api';

// Иконки
import { 
  HeartIcon, 
  UsersIcon, 
  ChatIcon, 
  SettingsIcon, 
  ChartIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon
} from '../components/UI';

const HomeContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 30px;
  margin: 0 auto;
  max-width: ${props => props.$maxWidth || '1200px'};
`;

const FlexContainer = styled.div`
  display: flex;
  justify-content: ${props => props.$justify || 'flex-start'};
  align-items: ${props => props.$align || 'center'};
  gap: ${props => props.$gap || '20px'};
  flex-wrap: ${props => props.$wrap ? 'wrap' : 'nowrap'};
`;

const SectionTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 15px;
  
  svg {
    width: 40px;
    height: 40px;
    color: #dc3522;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin: 30px 0;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 10px;
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 25px;
  border: none;
  border-radius: 12px;
  background: ${props => props.$active ? 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#4a5568'};
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.$active ? 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)' : '#f7fafc'};
    transform: translateY(-2px);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const WelcomeSection = styled.div`
  text-align: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 15px;
  margin-bottom: 30px;
`;

const WelcomeTitle = styled.h2`
  font-size: 2rem;
  color: #2d3748;
  margin: 0 0 15px 0;
`;

const WelcomeSubtitle = styled.p`
  font-size: 1.1rem;
  color: #718096;
  margin: 0;
  line-height: 1.6;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 1.2rem;
  color: #718096;
`;

const Home = () => {
  const [activeTab, setActiveTab] = useState('main');
  const [isClubUser, setIsClubUser] = useState(false);
  const [clubData, setClubData] = useState(null);

  // Проверяем тип авторизации
  useEffect(() => {
    const clubToken = localStorage.getItem('clubToken');
    const userToken = localStorage.getItem('token');
    
    if (clubToken && !userToken) {
      setIsClubUser(true);
    } else {
      setIsClubUser(false);
    }
  }, []);

  // Получаем данные клуба если авторизован как клуб
  const { data: clubInfo, isLoading: isLoadingClub } = useQuery({
    queryKey: ['clubInfo'],
    queryFn: clubAuthAPI.verify,
    enabled: isClubUser,
    onSuccess: (data) => {
      setClubData(data);
    },
    onError: (error) => {
      console.error('Ошибка получения данных клуба:', error);
      toast.error('Ошибка загрузки данных клуба');
    }
  });

  // Вкладки для клубов согласно техническому плану
  const clubTabs = [
    { id: 'ads', label: 'Объявления', icon: <PlusIcon />, component: <ClubAdsInterface /> },
    { id: 'chat', label: 'Чат', icon: <ChatIcon />, component: <ClubChatInterface /> },
    { id: 'settings', label: 'Настройки', icon: <SettingsIcon />, component: <ClubSettingsInterface /> },
    { id: 'analytics', label: 'Аналитика', icon: <ChartIcon />, component: <ClubAnalyticsInterface /> }
  ];

  // Вкладки для пользователей
  const userTabs = [
    { id: 'swipe', label: 'Свайп', icon: <HeartIcon />, component: <SwipeInterface /> },
    { id: 'catalog', label: 'Каталог', icon: <UsersIcon />, component: <CatalogInterface /> }
  ];

  if (isLoadingClub) {
    return (
      <HomeContainer>
        <ContentCard>
          <LoadingSpinner>Загрузка данных клуба...</LoadingSpinner>
        </ContentCard>
      </HomeContainer>
    );
  }

  return (
    <HomeContainer>
      <ContentCard>
        {/* Заголовок в зависимости от типа пользователя */}
        <FlexContainer $justify="space-between" $align="center" $wrap>
          <SectionTitle>
            {isClubUser ? (
              <>
                <UsersIcon />
                Панель управления клубом
              </>
            ) : (
              <>
                <HeartIcon />
                SwingFox - Поиск знакомств
              </>
            )}
          </SectionTitle>
        </FlexContainer>

        {/* Приветственный блок для клубов */}
        {isClubUser && clubData && (
          <WelcomeSection>
            <WelcomeTitle>Добро пожаловать, {clubData.name}!</WelcomeTitle>
            <WelcomeSubtitle>
              Управляйте объявлениями, общайтесь с участниками и анализируйте эффективность ваших мероприятий
            </WelcomeSubtitle>
          </WelcomeSection>
        )}

        {/* Вкладки в зависимости от типа пользователя */}
        <TabsContainer>
          {isClubUser ? (
            // Вкладки для клубов согласно техническому плану
            clubTabs.map((tab) => (
              <Tab
                key={tab.id}
                $active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </Tab>
            ))
          ) : (
            // Вкладки для пользователей
            userTabs.map((tab) => (
              <Tab
                key={tab.id}
                $active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </Tab>
            ))
          )}
        </TabsContainer>

        {/* Контент в зависимости от активной вкладки */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isClubUser ? (
            // Контент для клубов
            clubTabs.find(tab => tab.id === activeTab)?.component || <ClubAdsInterface />
          ) : (
            // Контент для пользователей
            userTabs.find(tab => tab.id === activeTab)?.component || <SwipeInterface />
          )}
        </motion.div>
      </ContentCard>
    </HomeContainer>
  );
};

export default Home;