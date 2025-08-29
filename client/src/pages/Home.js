import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { swipeAPI, apiUtils } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';
// Убираем импорт getStatusDisplayName, так как теперь статусы уже русские
import {
  PageContainer,
  Avatar,
  Button,
  IconButton,
  LoadingSpinner,
  FlexContainer,
  Card,
  HeartIcon,
  Modal,
  ModalContent,
  ModalHeader,
  CloseIcon,
  TextArea
} from '../components/UI';

// Иконки для действий
const DislikeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SuperlikeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12,2 15.09,8.26 22,9 17,14.74 18.18,21.02 12,17.77 5.82,21.02 7,14.74 2,9 8.91,8.26 12,2"/>
  </svg>
);

const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H6m6-7l-7 7 7 7"/>
  </svg>
);

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const HomeContainer = styled(PageContainer)`
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Header = styled.div`
  background: white;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e2e8f0;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const WelcomeText = styled.div`
  h1 {
    margin: 0 0 5px 0;
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  p {
    margin: 0;
    color: #718096;
    font-size: 14px;
  }
  
  @media (max-width: 768px) {
    h1 {
      font-size: 24px;
    }
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  .user-details {
    text-align: right;
    
    .username {
      font-weight: 600;
      color: #2d3748;
      margin: 0;
    }
    
    .status {
      font-size: 12px;
      color: #718096;
      margin: 0;
    }
  }
  
  @media (max-width: 576px) {
    .user-details {
      display: none;
    }
  }
`;

const SwipeContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  position: relative;
  max-width: 500px;
  margin: 0 auto;
  width: 100%;
  
  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const ProfileCard = styled(motion.div)`
  width: 100%;
  max-width: 400px;
  height: 650px;
  background: white;
  border-radius: 25px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  position: relative;
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }
  
  @media (max-width: 768px) {
    height: 600px;
    max-width: 100%;
  }
  
  @media (max-width: 480px) {
    height: 550px;
  }
`;

const ProfileImage = styled.div`
  width: 100%;
  height: 65%;
  background-image: url(${props => props.$src});
  background-size: cover;
  background-position: center;
  background-color: #f7fafc;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      transparent 50%,
      rgba(0,0,0,0.3) 80%,
      rgba(0,0,0,0.8) 100%
    );
  }
  
  ${props => !props.$src && `
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
    color: #a0aec0;
    font-size: 48px;
    font-weight: bold;
    
    &::before {
      display: none;
    }
  `}
`;

const ProfileOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  color: white;
  z-index: 2;
  
  .username {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 6px 0;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  
  .location {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    opacity: 0.9;
    margin-bottom: 3px;
  }
  
  .age {
    font-size: 14px;
    opacity: 0.9;
  }
  
  @media (max-width: 768px) {
    padding: 16px;
    
    .username {
      font-size: 20px;
    }
    
    .location, .age {
      font-size: 12px;
    }
  }
`;

const ProfileDetails = styled.div`
  padding: 20px;
  height: 35%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow-y: auto;
  
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
    color: white;
    padding: 6px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 10px;
    align-self: flex-start;
  }
  
  .info {
    color: #4a5568;
    font-size: 13px;
    line-height: 1.4;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  
  @media (max-width: 768px) {
    padding: 16px;
    
    .status-badge {
      font-size: 11px;
      padding: 5px 10px;
    }
    
    .info {
      font-size: 12px;
      -webkit-line-clamp: 2;
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 30px 20px 40px;
  
  @media (max-width: 768px) {
    gap: 15px;
    padding: 20px 15px 30px;
  }
`;

const ActionButton = styled(IconButton)`
  width: 65px;
  height: 65px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.dislike {
    background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
    
    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
      transform: scale(1.15) translateY(-3px);
      box-shadow: 0 12px 35px rgba(245, 101, 101, 0.4);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
  
  &.like {
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    
    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
      transform: scale(1.15) translateY(-3px);
      box-shadow: 0 12px 35px rgba(72, 187, 120, 0.4);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
  
  &.superlike {
    background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
    
    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #dd6b20 0%, #c05621 100%);
      transform: scale(1.15) translateY(-3px);
      box-shadow: 0 12px 35px rgba(237, 137, 54, 0.4);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
  
  &.back {
    background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
    
    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
      transform: scale(1.15) translateY(-3px);
      box-shadow: 0 12px 35px rgba(160, 174, 192, 0.4);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
  
  @media (max-width: 768px) {
    width: 55px;
    height: 55px;
  }
  
  @media (max-width: 480px) {
    width: 50px;
    height: 50px;
  }
`;

const NoMoreProfiles = styled.div`
  text-align: center;
  color: #718096;
  padding: 60px 20px;
  
  .icon {
    font-size: 64px;
    margin-bottom: 20px;
    opacity: 0.5;
  }
  
  h3 {
    margin: 0 0 15px 0;
    font-size: 24px;
    color: #2d3748;
  }
  
  p {
    margin: 0 0 30px 0;
    font-size: 16px;
    line-height: 1.5;
    max-width: 300px;
    margin-left: auto;
    margin-right: auto;
  }
  
  @media (max-width: 768px) {
    padding: 40px 20px;
    
    .icon {
      font-size: 48px;
    }
    
    h3 {
      font-size: 20px;
    }
    
    p {
      font-size: 14px;
    }
  }
`;

const SwipeHint = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px 25px;
  border-radius: 15px;
  font-size: 14px;
  text-align: center;
  pointer-events: none;
  opacity: ${props => props.$show ? 1 : 0};
  transition: opacity 0.3s ease;
  backdrop-filter: blur(10px);
  
  @media (max-width: 768px) {
    padding: 12px 20px;
    font-size: 13px;
  }
`;

const Home = () => {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showSuperlikeModal, setShowSuperlikeModal] = useState(false);
  const [superlikeMessage, setSuperlikeMessage] = useState('');
  const [swipeDirection, setSwipeDirection] = useState(null); // 'left' для дизлайка, 'right' для лайка
  const [profileQueue, setProfileQueue] = useState([]); // Очередь предзагруженных профилей
  const [isPreloading, setIsPreloading] = useState(false); // Флаг предзагрузки
  const queryClient = useQueryClient();
  const currentUser = apiUtils.getCurrentUser();
  const { showMatchPopup } = useNotifications();

  // Функция для форматирования возраста партнеров
  const formatPartnerAge = (dateString) => {
    if (!dateString) return 'Возраст не указан';
    
    try {
      const birthDate = new Date(dateString);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1;
      }
      
      return age;
    } catch (error) {
      return 'Возраст не указан';
    }
  };

  // Функция предзагрузки профилей
  const preloadProfiles = async (count = 3) => {
    if (isPreloading) return;
    
    setIsPreloading(true);
    
    // Запускаем предзагрузку в фоне
    setTimeout(async () => {
      try {
        const profiles = [];
        for (let i = 0; i < count; i++) {
          try {
            const profile = await swipeAPI.getProfiles('forward');
            if (profile) {
              profiles.push(profile);
            }
          } catch (error) {
            // Игнорируем ошибки при предзагрузке
            break;
          }
        }
        
        if (profiles.length > 0) {
          setProfileQueue(prev => [...prev, ...profiles]);
        }
      } catch (error) {
        // Игнорируем ошибки предзагрузки
      } finally {
        setIsPreloading(false);
      }
    }, 100); // Небольшая задержка для неблокирующей работы
  };

  // Функция получения следующего профиля
  const getNextProfile = () => {
    if (profileQueue.length > 0) {
      // Берем профиль из очереди
      const nextProfile = profileQueue[0];
      setProfileQueue(prev => prev.slice(1));
      setCurrentProfile(nextProfile);
      
      // Если в очереди осталось 2 профиля, подгружаем еще 3
      if (profileQueue.length <= 2) {
        preloadProfiles(3);
      }
      
      return nextProfile;
    } else {
      // Если очередь пуста, делаем обычный refetch
      refetch();
      return null;
    }
  };

  // Получение профилей
  const { data: profile, isLoading, refetch } = useQuery(
    'current-profile',
    () => swipeAPI.getProfiles('forward'),
    {
      onSuccess: (data) => {
        setCurrentProfile(data);
        setSwipeDirection(null);
        
        // Запускаем предзагрузку после получения первого профиля
        if (profileQueue.length === 0) {
          preloadProfiles(5);
        }
      },
      onError: (error) => {
        if (error.response?.data?.error === 'no_profiles') {
          setCurrentProfile(null);
        } else {
          toast.error(apiUtils.handleError(error));
        }
        setSwipeDirection(null);
      }
    }
  );

  // Мутации для лайков
  const likeMutation = useMutation(
    ({ targetUser, source }) => swipeAPI.like(targetUser, source),
    {
      onSuccess: (data) => {
        if (data.result === 'reciprocal_like' || data.match_created) {
          // Показываем специальный попап для мэтча
          if (currentProfile) {
            showMatchPopup({
              username: currentProfile.login,
              userData: {
                avatar: currentProfile.ava,
                login: currentProfile.login
              }
            });
          }
          toast.success('Взаимная симпатия! 💕', { duration: 6000 });
        } else {
          toast.success('Лайк отправлен! 💖');
        }
        // Получаем следующий профиль после завершения анимации
        setTimeout(() => {
          setSwipeDirection(null); // Сбрасываем направление
          getNextProfile();
        }, 400);
      },
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
        setSwipeDirection(null); // Сбрасываем направление при ошибке
      }
    }
  );

  const dislikeMutation = useMutation(
    ({ targetUser, source }) => swipeAPI.dislike(targetUser, source),
    {
      onSuccess: () => {
        // Получаем следующий профиль после завершения анимации
        setTimeout(() => {
          setSwipeDirection(null); // Сбрасываем направление
          getNextProfile();
        }, 400);
      },
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
        setSwipeDirection(null); // Сбрасываем направление при ошибке
      }
    }
  );

  const superlikeMutation = useMutation(
    ({ targetUser, message }) => swipeAPI.superlike({ targetUser, message }),
    {
      onSuccess: (data) => {
        setShowSuperlikeModal(false);
        setSuperlikeMessage('');
        
        // Суперлайки часто создают мэтчи - показываем попап если есть
        if (currentProfile && (data.result === 'reciprocal_like' || data.match_created)) {
          showMatchPopup({
            username: currentProfile.login,
            userData: {
              avatar: currentProfile.ava,
              login: currentProfile.login
            }
          });
          toast.success('Взаимная симпатия! 💕', { duration: 6000 });
        } else {
          toast.success('Суперлайк отправлен! ⭐');
        }
        
        setTimeout(() => {
          setSwipeDirection(null); // Сбрасываем направление
          getNextProfile();
        }, 400);
      },
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  // Показать подсказку для новых пользователей
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('swipe-hint-seen');
    if (!hasSeenHint && currentProfile) {
      setShowHint(true);
      setTimeout(() => {
        setShowHint(false);
        localStorage.setItem('swipe-hint-seen', 'true');
      }, 3000);
    }
  }, [currentProfile]);

  // Автоматическая предзагрузка при инициализации
  useEffect(() => {
    if (currentProfile && profileQueue.length === 0) {
      preloadProfiles(5);
    }
  }, [currentProfile]);

  // Обработчики действий
  const handleLike = () => {
    if (currentProfile) {
      // Небольшая задержка для визуального отклика кнопки
      setTimeout(() => {
        setSwipeDirection('right');
        // Запускаем анимацию свайпа вправо
        setTimeout(() => {
          likeMutation.mutate({
            targetUser: currentProfile.login,
            source: 'button'
          });
        }, 300); // Задержка для завершения анимации
      }, 100);
    }
  };

  const handleDislike = () => {
    if (currentProfile) {
      // Небольшая задержка для визуального отклика кнопки
      setTimeout(() => {
        setSwipeDirection('left');
        // Запускаем анимацию свайпа влево
        setTimeout(() => {
          dislikeMutation.mutate({
            targetUser: currentProfile.login,
            source: 'button'
          });
        }, 300); // Задержка для завершения анимации
      }, 100);
    }
  };

  const handleSuperlike = () => {
    if (currentProfile) {
      setShowSuperlikeModal(true);
    }
  };

  const handleSendSuperlike = () => {
    if (currentProfile && superlikeMessage.trim()) {
      superlikeMutation.mutate({
        targetUser: currentProfile.login,
        message: superlikeMessage.trim()
      });
    }
  };

  const handleCloseSuperlikeModal = () => {
    setShowSuperlikeModal(false);
    setSuperlikeMessage('');
  };

  const handleBack = async () => {
    try {
      const data = await swipeAPI.getProfiles('back');
      setCurrentProfile(data);
      // При возврате назад также запускаем предзагрузку
      if (profileQueue.length <= 2) {
        preloadProfiles(3);
      }
    } catch (error) {
      toast.error(apiUtils.handleError(error));
    }
  };

  // Обработка свайпов
  const handleDragEnd = (event, info) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      // Свайп вправо - лайк
      if (currentProfile) {
        setSwipeDirection('right');
        setTimeout(() => {
          likeMutation.mutate({
            targetUser: currentProfile.login,
            source: 'gesture'
          });
        }, 300);
      }
    } else if (info.offset.x < -threshold) {
      // Свайп влево - дизлайк
      if (currentProfile) {
        setSwipeDirection('left');
        setTimeout(() => {
          dislikeMutation.mutate({
            targetUser: currentProfile.login,
            source: 'gesture'
          });
        }, 300);
      }
    }
  };

  if (isLoading) {
    return (
      <HomeContainer>
        <Header>
          <HeaderContent>
            <WelcomeText>
              <h1>SwingFox</h1>
              <p>Загружаем профили...</p>
            </WelcomeText>
          </HeaderContent>
        </Header>
        <LoadingSpinner />
      </HomeContainer>
    );
  }

  return (
    <HomeContainer>
      <Header>
        <HeaderContent>
          <WelcomeText>
            <h1>Найдите свою пару</h1>
            <p>Свайпайте и знакомьтесь с интересными людьми</p>
          </WelcomeText>
          <UserInfo>
            <div className="user-details">
              <p className="username">@{currentUser?.login}</p>
              <p className="status">Онлайн</p>
            </div>
            <Avatar
              $src={currentUser?.ava ? `/uploads/${currentUser.ava}` : ''}
              $size="50px"
              $fontSize="20px"
            >
              {!currentUser?.ava && currentUser?.login?.charAt(0).toUpperCase()}
            </Avatar>
          </UserInfo>
        </HeaderContent>
      </Header>

      <SwipeContainer>
        <SwipeHint $show={showHint}>
          Свайпайте влево/вправо или используйте кнопки ниже
        </SwipeHint>
        
        {/* Отладочная информация о предзагрузке */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '15px',
            fontSize: '12px',
            zIndex: 10
          }}>
            Очередь: {profileQueue.length} | Загрузка: {isPreloading ? 'Да' : 'Нет'}
          </div>
        )}
        
        <AnimatePresence mode="wait">
          {currentProfile ? (
            <ProfileCard
              key={currentProfile.login}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              initial={{ scale: 0, opacity: 0, rotateY: 90 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                rotateY: 0,
                x: swipeDirection === 'left' ? -400 : swipeDirection === 'right' ? 400 : 0,
                rotate: swipeDirection === 'left' ? -20 : swipeDirection === 'right' ? 20 : 0
              }}
              exit={{ 
                scale: 0, 
                opacity: 0, 
                rotateY: swipeDirection === 'left' ? -90 : 90,
                x: swipeDirection === 'left' ? -400 : 400,
                rotate: swipeDirection === 'left' ? -20 : 20
              }}
              transition={{ 
                duration: swipeDirection ? 0.3 : 0.5,
                type: swipeDirection ? "tween" : "spring",
                stiffness: swipeDirection ? undefined : 100
              }}
              whileDrag={{ scale: 1.05, rotate: 5 }}
            >
              <ProfileImage $src={currentProfile.ava ? `/uploads/${currentProfile.ava}` : ''}>
                {!currentProfile.ava && '👤'}
                <ProfileOverlay>
                  <h3 className="username">@{currentProfile.login}</h3>
                  <div className="location">
                    <LocationIcon />
                    {currentProfile.city}, {currentProfile.distance}км
                  </div>
                  <div className="age">{currentProfile.age} лет</div>
                </ProfileOverlay>
              </ProfileImage>
              
              <ProfileDetails>
                <div>
                  <div className="status-badge">
                    <InfoIcon />
                    {currentProfile.status}
                  </div>
                  
                  {/* Компактная информация о паре */}
                  {currentProfile.isCouple && currentProfile.partnerData && (
                    <div className="partner-info" style={{ 
                      margin: '8px 0', 
                      padding: '8px 12px', 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>👫 Пара</div>
                      <div style={{ opacity: 0.9 }}>
                        {formatPartnerAge(currentProfile.partnerData.manDate)}/{formatPartnerAge(currentProfile.partnerData.womanDate)} лет
                      </div>
                    </div>
                  )}
                  
                  {/* Компактная дополнительная информация */}
                  <div className="additional-info" style={{ 
                    fontSize: '11px', 
                    marginTop: '8px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4px'
                  }}>
                    {currentProfile.height && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        📏 {currentProfile.height}см
                      </div>
                    )}
                    {currentProfile.weight && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⚖️ {currentProfile.weight}кг
                      </div>
                    )}
                    {currentProfile.smoking && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🚬 {currentProfile.smoking.length > 15 ? currentProfile.smoking.substring(0, 15) + '...' : currentProfile.smoking}
                      </div>
                    )}
                    {currentProfile.alko && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🍷 {currentProfile.alko.length > 15 ? currentProfile.alko.substring(0, 15) + '...' : currentProfile.alko}
                      </div>
                    )}
                  </div>
                  
                  {/* Основная информация */}
                  <div className="info" style={{ 
                    marginTop: '12px',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    color: '#4a5568'
                  }}>
                    {currentProfile.info ? 
                      (currentProfile.info.length > 120 ? currentProfile.info.substring(0, 120) + '...' : currentProfile.info) 
                      : 'Информация не указана'
                    }
                  </div>
                </div>
              </ProfileDetails>
            </ProfileCard>
          ) : (
            <NoMoreProfiles>
              <div className="icon">🎯</div>
              <h3>Профили закончились!</h3>
              <p>Попробуйте позже или расширьте критерии поиска в настройках</p>
              <Button onClick={() => refetch()}>
                Обновить
              </Button>
            </NoMoreProfiles>
          )}
        </AnimatePresence>
      </SwipeContainer>

      {currentProfile && (
        <ActionButtons>
          <ActionButton 
            className="back" 
            onClick={handleBack} 
            title="Вернуться к предыдущему профилю"
          >
            <BackIcon />
          </ActionButton>
          
          <ActionButton 
            className="dislike" 
            onClick={handleDislike} 
            title="Не нравится"
            disabled={dislikeMutation.isLoading}
          >
            <DislikeIcon />
          </ActionButton>
          
          <ActionButton 
            className="like" 
            onClick={handleLike} 
            title="Нравится"
            disabled={likeMutation.isLoading}
          >
            <HeartIcon />
          </ActionButton>
          
          <ActionButton 
            className="superlike" 
            onClick={handleSuperlike} 
            title="Суперлайк с сообщением"
            disabled={superlikeMutation.isLoading}
          >
            <SuperlikeIcon />
          </ActionButton>
        </ActionButtons>
      )}

      {/* Модальное окно для суперлайка */}
      {showSuperlikeModal && (
        <Modal onClick={handleCloseSuperlikeModal}>
          <ModalContent $maxWidth="500px" onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>Отправить суперлайк</h2>
              <IconButton
                $variant="secondary"
                onClick={handleCloseSuperlikeModal}
              >
                <CloseIcon />
              </IconButton>
            </ModalHeader>
            
            <div style={{ padding: '20px' }}>
              <p style={{
                marginBottom: '20px',
                color: '#4a5568',
                lineHeight: '1.5'
              }}>
                Суперлайк поможет выделиться среди других пользователей.
                Напишите сообщение для <strong>@{currentProfile?.login}</strong>:
              </p>
              
              <TextArea
                value={superlikeMessage}
                onChange={(e) => setSuperlikeMessage(e.target.value)}
                placeholder="Привет! Ты мне очень понравился(лась)..."
                $minHeight="120px"
                style={{ marginBottom: '20px' }}
                maxLength={500}
              />
              
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'flex-end'
              }}>
                <Button
                  $variant="secondary"
                  onClick={handleCloseSuperlikeModal}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleSendSuperlike}
                  disabled={!superlikeMessage.trim() || superlikeMutation.isLoading}
                >
                  {superlikeMutation.isLoading ? 'Отправляем...' : 'Отправить суперлайк'}
                </Button>
              </div>
              
              <p style={{
                marginTop: '15px',
                fontSize: '12px',
                color: '#718096',
                textAlign: 'center'
              }}>
                У вас осталось суперлайков: ∞
              </p>
            </div>
          </ModalContent>
        </Modal>
      )}
    </HomeContainer>
  );
};

export default Home;