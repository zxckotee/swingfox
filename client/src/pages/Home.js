import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { swipeAPI, apiUtils } from '../services/api';

const HomeContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background};
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  background: white;
  padding: ${props => props.theme.spacing.md};
  box-shadow: ${props => props.theme.shadow};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  color: ${props => props.theme.colors.primary};
  margin: 0;
  font-size: ${props => props.theme.fonts.sizes.xlarge};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: ${props => props.theme.colors.primary};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
`;

const SwipeContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.lg};
  position: relative;
`;

const ProfileCard = styled(motion.div)`
  width: 350px;
  height: 500px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  overflow: hidden;
  position: relative;
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }
`;

const ProfileImage = styled.div`
  width: 100%;
  height: 60%;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  background-color: ${props => props.theme.colors.border};
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(transparent, rgba(0,0,0,0.7));
  }
`;

const ProfileInfo = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: ${props => props.theme.spacing.md};
  color: white;
  z-index: 1;
  
  h3 {
    margin: 0 0 ${props => props.theme.spacing.xs} 0;
    font-size: ${props => props.theme.fonts.sizes.xlarge};
  }
  
  p {
    margin: 0;
    opacity: 0.9;
    font-size: ${props => props.theme.fonts.sizes.medium};
  }
`;

const ProfileDetails = styled.div`
  padding: ${props => props.theme.spacing.md};
  height: 40%;
  overflow: hidden;
  
  .status {
    font-weight: bold;
    color: ${props => props.theme.colors.primary};
    margin-bottom: ${props => props.theme.spacing.xs};
  }
  
  .info {
    color: ${props => props.theme.colors.textLight};
    font-size: ${props => props.theme.fonts.sizes.small};
    line-height: 1.4;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.lg};
`;

const ActionButton = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.theme.shadow};
  
  &.dislike {
    background: #f44336;
    color: white;
    
    &:hover {
      background: #d32f2f;
      transform: scale(1.1);
    }
  }
  
  &.like {
    background: #4caf50;
    color: white;
    
    &:hover {
      background: #388e3c;
      transform: scale(1.1);
    }
  }
  
  &.superlike {
    background: #ff9800;
    color: white;
    
    &:hover {
      background: #f57c00;
      transform: scale(1.1);
    }
  }
  
  &.back {
    background: #9e9e9e;
    color: white;
    
    &:hover {
      background: #757575;
      transform: scale(1.1);
    }
  }
`;

const NoMoreProfiles = styled.div`
  text-align: center;
  color: ${props => props.theme.colors.textLight};
  
  h3 {
    margin-bottom: ${props => props.theme.spacing.md};
  }
  
  p {
    margin-bottom: ${props => props.theme.spacing.lg};
  }
`;

const Home = () => {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [dragDirection, setDragDirection] = useState(null);
  const queryClient = useQueryClient();
  const currentUser = apiUtils.getCurrentUser();

  // Получение профилей
  const { data: profile, isLoading, refetch } = useQuery(
    'current-profile',
    () => swipeAPI.getProfiles('forward'),
    {
      onSuccess: (data) => {
        setCurrentProfile(data);
      },
      onError: (error) => {
        if (error.response?.data?.error === 'no_profiles') {
          setCurrentProfile(null);
        } else {
          toast.error(apiUtils.handleError(error));
        }
      }
    }
  );

  // Мутации для лайков
  const likeMutation = useMutation(swipeAPI.like, {
    onSuccess: (data) => {
      if (data.result === 'reciprocal_like') {
        toast.success(data.message, { duration: 6000 });
      } else {
        toast.success('Лайк отправлен!');
      }
      refetch();
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const dislikeMutation = useMutation(swipeAPI.dislike, {
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const superlikeMutation = useMutation(
    ({ targetUser, message }) => swipeAPI.superlike(targetUser, message),
    {
      onSuccess: (data) => {
        toast.success('Суперлайк отправлен!');
        refetch();
      },
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  // Обработчики действий
  const handleLike = () => {
    if (currentProfile) {
      likeMutation.mutate(currentProfile.login);
    }
  };

  const handleDislike = () => {
    if (currentProfile) {
      dislikeMutation.mutate(currentProfile.login);
    }
  };

  const handleSuperlike = () => {
    if (currentProfile) {
      const message = prompt('Напишите сообщение для суперлайка:');
      if (message && message.trim()) {
        superlikeMutation.mutate({
          targetUser: currentProfile.login,
          message: message.trim()
        });
      }
    }
  };

  const handleBack = async () => {
    try {
      const data = await swipeAPI.getProfiles('back');
      setCurrentProfile(data);
    } catch (error) {
      toast.error(apiUtils.handleError(error));
    }
  };

  // Обработка свайпов
  const handleDragEnd = (event, info) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      // Свайп вправо - лайк
      handleLike();
    } else if (info.offset.x < -threshold) {
      // Свайп влево - дизлайк
      handleDislike();
    }
  };

  if (isLoading) {
    return (
      <HomeContainer>
        <Header>
          <Logo>SwingFox</Logo>
        </Header>
        <div className="loading">Загрузка профилей...</div>
      </HomeContainer>
    );
  }

  return (
    <HomeContainer>
      <Header>
        <Logo>SwingFox</Logo>
        <UserInfo>
          <div className="avatar">
            {currentUser?.login?.charAt(0).toUpperCase()}
          </div>
          <span>@{currentUser?.login}</span>
        </UserInfo>
      </Header>

      <SwipeContainer>
        <AnimatePresence mode="wait">
          {currentProfile ? (
            <ProfileCard
              key={currentProfile.login}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              whileDrag={{ scale: 1.05 }}
            >
              <ProfileImage src={`/uploads/${currentProfile.ava}`}>
                <ProfileInfo>
                  <h3>@{currentProfile.login}</h3>
                  <p>{currentProfile.city}, {currentProfile.distance}км</p>
                  <p>{currentProfile.age}</p>
                </ProfileInfo>
              </ProfileImage>
              
              <ProfileDetails>
                <div className="status">{currentProfile.status}</div>
                <div className="info">
                  {currentProfile.info || 'Информация не указана'}
                </div>
              </ProfileDetails>
            </ProfileCard>
          ) : (
            <NoMoreProfiles>
              <h3>Профили закончились!</h3>
              <p>Попробуйте позже или расширьте критерии поиска</p>
              <button className="btn btn-primary" onClick={() => refetch()}>
                Обновить
              </button>
            </NoMoreProfiles>
          )}
        </AnimatePresence>
      </SwipeContainer>

      {currentProfile && (
        <ActionButtons>
          <ActionButton className="back" onClick={handleBack} title="Назад">
            ↶
          </ActionButton>
          <ActionButton className="dislike" onClick={handleDislike} title="Дизлайк">
            ✕
          </ActionButton>
          <ActionButton className="like" onClick={handleLike} title="Лайк">
            ♡
          </ActionButton>
          <ActionButton className="superlike" onClick={handleSuperlike} title="Суперлайк">
            ★
          </ActionButton>
        </ActionButtons>
      )}
    </HomeContainer>
  );
};

export default Home;