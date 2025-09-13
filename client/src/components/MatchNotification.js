import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { Button, Avatar } from './UI';

const heartBeat = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(180deg); }
`;

const MatchContainer = styled(motion.div)`
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 50%, #ffa8a8 100%);
  border-radius: 20px;
  padding: 25px;
  margin: 15px 0;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    animation: ${sparkle} 3s infinite;
  }
`;

const MatchHeader = styled.div`
  text-align: center;
  margin-bottom: 20px;
  position: relative;
  z-index: 2;
`;

const MatchIcon = styled.div`
  font-size: 48px;
  margin-bottom: 10px;
  animation: ${heartBeat} 2s infinite;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
`;

const MatchTitle = styled.h3`
  margin: 0 0 5px 0;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const MatchSubtitle = styled.p`
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const MatchContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 20px 0;
  position: relative;
  z-index: 2;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
  }
`;

const UserInfo = styled.div`
  text-align: center;
  flex: 1;
`;

const UserName = styled.div`
  font-size: 18px;
  font-weight: 600;
  margin-top: 10px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const HeartConnector = styled.div`
  font-size: 32px;
  animation: ${heartBeat} 1.5s infinite;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
  
  @media (max-width: 768px) {
    transform: rotate(90deg);
    font-size: 28px;
  }
`;

const MatchActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
  position: relative;
  z-index: 2;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ChatButton = styled(Button)`
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  border: none;
  padding: 12px 24px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(68, 160, 141, 0.3);
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #45b7b8 0%, #3d8b7a 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(68, 160, 141, 0.4);
  }
`;

const DismissButton = styled(Button)`
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 12px 24px;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }
`;

const TimeStamp = styled.div`
  text-align: center;
  margin-top: 15px;
  font-size: 12px;
  opacity: 0.8;
  position: relative;
  z-index: 2;
`;

const MatchNotification = ({ 
  notification, 
  onDismiss, 
  onStartChat,
  isAnimatingOut = false
}) => {
  const navigate = useNavigate();
  
  const matchUser = notification?.data?.match_user || notification?.from_user;
  const userData = notification?.from_user_data;

  const handleStartChat = () => {
    if (onStartChat) {
      onStartChat(matchUser);
    } else {
      navigate(`/chat/${matchUser}`);
    }
  };

  const handleViewProfile = () => {
    // Проверяем, является ли matchUser клубом (начинается с @club_)
    if (matchUser && matchUser.startsWith('@club_')) {
      const clubId = matchUser.replace('@club_', '');
      navigate(`/club-profile/${clubId}`);
    } else {
      navigate(`/profile/${matchUser}`);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'только что';
    if (diffMinutes < 60) return `${diffMinutes} мин назад`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} ч назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <MatchContainer
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: isAnimatingOut ? 0.8 : 1, 
        opacity: isAnimatingOut ? 0 : 1,
        y: isAnimatingOut ? -20 : 0
      }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ 
        type: "spring", 
        duration: isAnimatingOut ? 0.3 : 0.6,
        bounce: isAnimatingOut ? 0 : 0.4 
      }}
    >
      <MatchHeader>
        <MatchIcon>💕</MatchIcon>
        <MatchTitle>Взаимная симпатия!</MatchTitle>
        <MatchSubtitle>У вас совпадение! Начните общение прямо сейчас</MatchSubtitle>
      </MatchHeader>

      <MatchContent>
        <UserInfo>
          <Avatar
            $src={userData?.avatar ? `/uploads/${userData.avatar}` : ''}
            $size="80px"
            $fontSize="32px"
            $online={true}
          >
            {!userData?.avatar && 'Я'}
          </Avatar>
          <UserName>Вы</UserName>
        </UserInfo>

        <HeartConnector>💖</HeartConnector>

        <UserInfo>
          <Avatar
            $src={userData?.avatar ? `/uploads/${userData.avatar}` : ''}
            $size="80px"
            $fontSize="32px"
            $online={true}
          >
            {!userData?.avatar && (matchUser ? matchUser.charAt(0).toUpperCase() : '?')}
          </Avatar>
          <UserName 
            style={{ cursor: 'pointer' }}
            onClick={() => handleViewProfile()}
            title="Кликните, чтобы перейти в профиль"
          >
            @{matchUser || 'Пользователь'}
          </UserName>
        </UserInfo>
      </MatchContent>

      <MatchActions>
        <ChatButton onClick={handleStartChat}>
          💬 Начать чат
        </ChatButton>
        
        <DismissButton $variant="secondary" onClick={handleViewProfile}>
          👀 Профиль
        </DismissButton>
        
        {onDismiss && (
          <DismissButton $variant="secondary" onClick={onDismiss}>
            ✕ Закрыть
          </DismissButton>
        )}
      </MatchActions>

      <TimeStamp>
        {formatTime(notification.created_at)}
      </TimeStamp>
    </MatchContainer>
  );
};

export default MatchNotification;