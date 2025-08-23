import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { usersAPI, swipeAPI, apiUtils } from '../services/api';
import {
  PageContainer,
  ContentCard,
  Avatar,
  Button,
  IconButton,
  LoadingSpinner,
  FlexContainer,
  Grid,
  Card,
  Modal,
  ModalContent,
  ModalHeader,
  CloseIcon
} from '../components/UI';

// Иконки
const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const GiftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,12 20,22 4,22 4,12"/>
    <rect x="2" y="7" width="20" height="5"/>
    <line x1="12" y1="22" x2="12" y2="7"/>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
);

const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>
);

const MinusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

// Стили
const ProfileContainer = styled(PageContainer)`
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const ProfileHeader = styled.div`
  position: relative;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  padding: 60px 40px 40px;
  border-radius: 25px 25px 0 0;
  color: white;
  text-align: center;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
    opacity: 0.3;
  }
  
  @media (max-width: 768px) {
    padding: 40px 20px 30px;
  }
`;

const UserInfo = styled.div`
  position: relative;
  z-index: 1;
  
  h2 {
    margin: 0 0 8px 0;
    font-size: 32px;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  p {
    margin: 0;
    opacity: 0.9;
    font-size: 16px;
  }
  
  @media (max-width: 768px) {
    h2 {
      font-size: 28px;
    }
    
    p {
      font-size: 14px;
    }
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 30px 40px;
  background: white;
  
  @media (max-width: 768px) {
    padding: 20px;
    gap: 10px;
  }
`;

const ActionButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &.like {
    background: linear-gradient(135deg, #e91e63 0%, #f06292 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(233, 30, 99, 0.3);
    }
  }
  
  &.gift {
    background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(255, 152, 0, 0.3);
    }
  }
  
  &.chat {
    background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
    }
  }
  
  &.superlike {
    background: linear-gradient(135deg, #2196f3 0%, #42a5f5 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(33, 150, 243, 0.3);
    }
  }
  
  @media (max-width: 768px) {
    padding: 10px 16px;
    font-size: 14px;
  }
`;

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  background: white;
  border-top: 1px solid #e2e8f0;
  
  @media (max-width: 768px) {
    gap: 15px;
    padding: 15px;
  }
`;

const RatingButton = styled(IconButton)`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  
  &.minus {
    background: ${props => props.$active ? '#f56565' : '#fed7d7'};
    color: ${props => props.$active ? 'white' : '#c53030'};
    
    &:hover {
      background: #f56565;
      color: white;
    }
  }
  
  &.plus {
    background: ${props => props.$active ? '#48bb78' : '#c6f6d5'};
    color: ${props => props.$active ? 'white' : '#2f855a'};
    
    &:hover {
      background: #48bb78;
      color: white;
    }
  }
  
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }
`;

const RatingScore = styled.div`
  text-align: center;
  
  .score {
    font-size: 28px;
    font-weight: 700;
    color: #dc3522;
    margin-bottom: 5px;
  }
  
  .label {
    font-size: 14px;
    color: #718096;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    .score {
      font-size: 24px;
    }
    
    .label {
      font-size: 13px;
    }
  }
`;

const ProfileContent = styled.div`
  padding: 40px;
  background: white;
  border-radius: 0 0 25px 25px;
  
  @media (max-width: 768px) {
    padding: 25px 20px;
  }
`;

const InfoSection = styled.div`
  margin-bottom: 30px;
  
  h3 {
    margin: 0 0 15px 0;
    font-size: 20px;
    font-weight: 600;
    color: #2d3748;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 8px;
  }
  
  @media (max-width: 768px) {
    margin-bottom: 25px;
    
    h3 {
      font-size: 18px;
    }
  }
`;

const InfoItem = styled.p`
  margin: 0 0 8px 0;
  color: #4a5568;
  font-size: 15px;
  
  strong {
    color: #2d3748;
    font-weight: 600;
  }
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const ImageGallery = styled(Grid)`
  margin-top: 30px;
`;

const ImageCard = styled(Card)`
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
  }
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ImageOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  color: white;
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  ${ImageCard}:hover & {
    opacity: 1;
  }
`;

const LikeButton = styled.button`
  background: rgba(233, 30, 99, 0.8);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e91e63;
    transform: scale(1.1);
  }
`;

const LikesCount = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  font-weight: 600;
`;

const OtherProfile = () => {
  const { login } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = apiUtils.getCurrentUser();
  
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showSuperlikeModal, setShowSuperlikeModal] = useState(false);

  // Защита от просмотра собственного профиля
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (currentUser.login === login) {
    return <Navigate to="/profile" replace />;
  }

  // Получение профиля пользователя
  const { data: profile, isLoading, error } = useQuery(
    ['profile', login],
    () => usersAPI.getProfile(login),
    {
      enabled: !!login,
      onError: (error) => {
        if (error.response?.status === 404) {
          toast.error('Пользователь не найден');
          navigate('/catalog');
        }
      }
    }
  );

  // Получение рейтинга пользователя
  const { data: ratingData } = useQuery(
    ['rating', login],
    () => usersAPI.getUserRating(login),
    {
      enabled: !!login
    }
  );

  // Регистрация посещения профиля
  const visitMutation = useMutation(usersAPI.registerVisit, {
    onError: (error) => {
      console.warn('Visit registration failed:', error);
    }
  });

  // Регистрируем посещение при загрузке
  useEffect(() => {
    if (login && profile) {
      visitMutation.mutate(login);
    }
  }, [login, profile]);

  // Мутации для взаимодействий
  const likeMutation = useMutation(swipeAPI.like, {
    onSuccess: (data) => {
      if (data.match) {
        toast.success('🎉 Взаимная симпатия! Теперь можете общаться');
        queryClient.invalidateQueries(['profile', login]);
      } else {
        toast.success('Лайк отправлен!');
      }
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const superlikeMutation = useMutation(
    ({ targetUser, message }) => usersAPI.sendSuperlike(targetUser, message),
    {
    onSuccess: () => {
      toast.success('Суперлайк отправлен!');
      setShowSuperlikeModal(false);
      queryClient.invalidateQueries(['profile', login]);
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const rateMutation = useMutation(
    ({ targetUser, value }) => usersAPI.rateUser(targetUser, value),
    {
    onSuccess: () => {
      toast.success('Оценка отправлена!');
      queryClient.invalidateQueries(['rating', login]);
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  // Обработчики
  const handleLike = () => {
    likeMutation.mutate(login);
  };

  const handleSuperlike = (message) => {
    superlikeMutation.mutate({ targetUser: login, message });
  };

  const handleRate = (value) => {
    rateMutation.mutate({ targetUser: login, value });
  };

  const handleGoToChat = () => {
    navigate(`/chat/${login}`);
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  if (isLoading) {
    return (
      <ProfileContainer>
        <LoadingSpinner />
      </ProfileContainer>
    );
  }

  if (error || !profile) {
    return (
      <ProfileContainer>
        <ContentCard $maxWidth="600px">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2>Профиль не найден</h2>
            <p>Пользователь {login} не существует или был удален</p>
            <Button onClick={() => navigate('/catalog')}>
              Вернуться к каталогу
            </Button>
          </div>
        </ContentCard>
      </ProfileContainer>
    );
  }

  // Проверка взаимных лайков (для показа кнопки чата)
  const hasReciprocal = false; // TODO: Получить из API

  return (
    <ProfileContainer>
      <ContentCard $maxWidth="1000px" $padding="0">
        <ProfileHeader>
          <Avatar
            $src={profile.ava ? `/uploads/${profile.ava}` : ''}
            $size="120px"
            $fontSize="48px"
          >
            {!profile.ava && profile.login?.charAt(0).toUpperCase()}
          </Avatar>
          
          <UserInfo>
            <h2>@{profile.login}</h2>
            <p>{profile.city} • {profile.status} • {profile.distance}км от вас</p>
          </UserInfo>
        </ProfileHeader>

        <ActionsContainer>
          <ActionButton 
            className="gift" 
            onClick={() => setShowGiftModal(true)}
          >
            <GiftIcon />
            Подарок
          </ActionButton>
          
          {!hasReciprocal ? (
            <>
              <ActionButton 
                className="like" 
                onClick={handleLike}
                disabled={likeMutation.isLoading}
              >
                <HeartIcon />
                {likeMutation.isLoading ? 'Отправляем...' : 'Лайк'}
              </ActionButton>
              
              <ActionButton 
                className="superlike" 
                onClick={() => setShowSuperlikeModal(true)}
              >
                <StarIcon />
                Суперлайк
              </ActionButton>
            </>
          ) : (
            <ActionButton 
              className="chat" 
              onClick={handleGoToChat}
            >
              <ChatIcon />
              Написать
            </ActionButton>
          )}
        </ActionsContainer>

        <RatingContainer>
          <RatingButton
            className="minus"
            $active={ratingData?.myRating === -1}
            onClick={() => handleRate(-1)}
            disabled={rateMutation.isLoading}
          >
            <MinusIcon />
          </RatingButton>
          
          <RatingScore>
            <div className="score">{ratingData?.totalRating || 0}</div>
            <div className="label">Рейтинг</div>
          </RatingScore>
          
          <RatingButton
            className="plus"
            $active={ratingData?.myRating === 1}
            onClick={() => handleRate(1)}
            disabled={rateMutation.isLoading}
          >
            <PlusIcon />
          </RatingButton>
        </RatingContainer>

        <ProfileContent>
          <InfoSection>
            <h3>О пользователе</h3>
            <InfoItem><strong>Страна:</strong> {profile.country}</InfoItem>
            <InfoItem><strong>Город:</strong> {profile.city}</InfoItem>
            <InfoItem><strong>Статус:</strong> {profile.status}</InfoItem>
            <InfoItem><strong>Возраст:</strong> {profile.age}</InfoItem>
            {profile.height && (
              <InfoItem><strong>Рост:</strong> {profile.height} см</InfoItem>
            )}
            {profile.weight && (
              <InfoItem><strong>Вес:</strong> {profile.weight} кг</InfoItem>
            )}
            {profile.info && (
              <InfoItem><strong>О себе:</strong> {profile.info}</InfoItem>
            )}
          </InfoSection>

          {profile.images && profile.images.length > 0 && (
            <InfoSection>
              <h3>Фотографии</h3>
              <ImageGallery $columns="repeat(auto-fill, minmax(200px, 1fr))" $gap="20px">
                {profile.images.map((image, index) => (
                  <ImageCard key={index} onClick={() => handleImageClick(image)}>
                    <Image src={`/uploads/${image}`} alt={`Фото ${index + 1}`} />
                    <ImageOverlay>
                      <LikesCount>
                        <HeartIcon />
                        {Math.floor(Math.random() * 50)} {/* TODO: Реальные лайки */}
                      </LikesCount>
                      <LikeButton>
                        <HeartIcon />
                      </LikeButton>
                    </ImageOverlay>
                  </ImageCard>
                ))}
              </ImageGallery>
            </InfoSection>
          )}
        </ProfileContent>
      </ContentCard>

      {/* Модальное окно для просмотра изображений */}
      {showImageModal && selectedImage && (
        <Modal onClick={() => setShowImageModal(false)}>
          <ModalContent $maxWidth="800px" onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>Просмотр фотографии</h2>
              <IconButton 
                $variant="secondary" 
                onClick={() => setShowImageModal(false)}
              >
                <CloseIcon />
              </IconButton>
            </ModalHeader>
            <img 
              src={`/uploads/${selectedImage}`} 
              alt="Просмотр" 
              style={{ 
                width: '100%', 
                borderRadius: '15px',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          </ModalContent>
        </Modal>
      )}

      {/* TODO: Модальные окна для подарков и суперлайков */}
    </ProfileContainer>
  );
};

export default OtherProfile;