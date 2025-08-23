import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, Button } from './UI';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const heartFloat = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(2deg); }
  75% { transform: translateY(-5px) rotate(-2deg); }
`;

const sparkleAnimation = keyframes`
  0% { transform: scale(0) rotate(0deg); opacity: 0; }
  50% { transform: scale(1) rotate(180deg); opacity: 1; }
  100% { transform: scale(0) rotate(360deg); opacity: 0; }
`;

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9999;
  pointer-events: none;
`;

const PopupContainer = styled(motion.div)`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 350px;
  max-width: calc(100vw - 40px);
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 50%, #ffa8a8 100%);
  border-radius: 20px;
  padding: 20px;
  color: white;
  box-shadow: 0 15px 35px rgba(255, 107, 107, 0.4);
  pointer-events: all;
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -20px;
    right: -20px;
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    animation: ${sparkleAnimation} 2s infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: -10px;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
    animation: ${sparkleAnimation} 3s infinite 0.5s;
  }
  
  @media (max-width: 768px) {
    width: calc(100vw - 20px);
    right: 10px;
    top: 10px;
    padding: 15px;
  }
`;

const PopupHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
  position: relative;
  z-index: 2;
`;

const HeartIcon = styled.div`
  font-size: 32px;
  animation: ${heartFloat} 3s infinite;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
`;

const PopupTitle = styled.h4`
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const PopupContent = styled.div`
  position: relative;
  z-index: 2;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const UserSubtext = styled.div`
  font-size: 13px;
  opacity: 0.9;
  
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const PopupActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 15px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ChatButton = styled(Button)`
  flex: 1;
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  border: none;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(68, 160, 141, 0.3);
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #45b7b8 0%, #3d8b7a 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(68, 160, 141, 0.4);
  }
`;

const DismissButton = styled(Button)`
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 10px 16px;
  font-size: 14px;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
  z-index: 3;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
`;

const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 0 0 20px 20px;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: rgba(255, 255, 255, 0.8);
    border-radius: inherit;
    animation: progress ${props => props.$duration}ms linear;
  }
  
  @keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
  }
`;

const MatchPopup = ({ 
  notification, 
  onClose, 
  onStartChat,
  autoCloseDelay = 8000 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  const matchUser = notification?.data?.match_user || notification?.from_user;
  const userData = notification?.from_user_data;

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, autoCloseDelay);

    return () => clearTimeout(timer);
  }, [autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  const handleStartChat = () => {
    if (onStartChat) {
      onStartChat(matchUser);
    } else {
      navigate(`/chat/${matchUser}`);
    }
    handleClose();
  };

  const handleViewProfile = () => {
    navigate(`/profiles/${matchUser}`);
    handleClose();
  };

  if (!notification) return null;

  return createPortal(
    <PopupOverlay>
      <AnimatePresence>
        {isVisible && (
          <PopupContainer
            initial={{ x: '100%', opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: '100%', opacity: 0, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              duration: 0.6,
              bounce: 0.3 
            }}
          >
            <CloseButton onClick={handleClose}>
              ✕
            </CloseButton>

            <PopupHeader>
              <HeartIcon>💕</HeartIcon>
              <PopupTitle>Новый мэтч!</PopupTitle>
            </PopupHeader>

            <PopupContent>
              <UserInfo>
                <Avatar
                  $src={userData?.avatar ? `/uploads/${userData.avatar}` : ''}
                  $size="50px"
                  $fontSize="20px"
                  $online={true}
                >
                  {!userData?.avatar && (matchUser ? matchUser.charAt(0).toUpperCase() : '?')}
                </Avatar>
                
                <UserDetails>
                  <UserName>@{matchUser || 'Пользователь'}</UserName>
                  <UserSubtext>У вас взаимная симпатия!</UserSubtext>
                </UserDetails>
              </UserInfo>

              <PopupActions>
                <ChatButton onClick={handleStartChat}>
                  💬 Чат
                </ChatButton>
                
                <DismissButton onClick={handleViewProfile}>
                  👀 Профиль
                </DismissButton>
              </PopupActions>
            </PopupContent>

            <ProgressBar $duration={autoCloseDelay} />
          </PopupContainer>
        )}
      </AnimatePresence>
    </PopupOverlay>,
    document.body
  );
};

export default MatchPopup;