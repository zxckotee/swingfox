import React, { useState, useRef, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { usersAPI, swipeAPI, chatAPI, giftsAPI, ratingAPI, apiUtils } from '../services/api';
import { LocationSelector } from '../components/Geography';
import RatingDisplay from '../components/RatingDisplay';
import PhotoComments from '../components/PhotoComments';
import ProfileComments from '../components/ProfileComments';
import Reactions from '../components/Reactions';
import {
  PageContainer,
  ContentCard,
  Avatar,
  Button,
  IconButton,
  Form,
  FormGroup,
  Label,
  Input,
  TextArea,
  LoadingSpinner,
  Grid,
  Card,
  Modal,
  ModalContent,
  ModalHeader,
  CloseIcon,
  EditIcon,
  HeartIcon,
  GiftIcon,
  StarIcon,
  MessageIcon,
  SendIcon
} from '../components/UI';

// Дополнительные иконки
const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

// Конфигурация подарков
const GIFT_CONFIG = {
  '1': { emoji: '🌹', name: 'Роза', cost: 50 },
  '2': { emoji: '💐', name: 'Букет цветов', cost: 100 },
  '3': { emoji: '🍾', name: 'Шампанское', cost: 200 },
  '4': { emoji: '🎁', name: 'Подарок', cost: 150 },
  '5': { emoji: '🍽️', name: 'Романтический ужин', cost: 500 },
  '6': { emoji: '✈️', name: 'Путешествие', cost: 1000 },
  '7': { emoji: '💎', name: 'Украшение', cost: 800 },
  '8': { emoji: '👑', name: 'VIP статус на месяц', cost: 1500 },
  '9': { emoji: '⭐', name: 'Premium статус на месяц', cost: 2000 },
  '10': { emoji: '🏆', name: 'Эксклюзивный подарок', cost: 3000 }
};

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

const AvatarSection = styled.div`
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
  z-index: 1;
`;

const AvatarOverlay = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: white;
    transform: scale(1.1);
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
    flex-wrap: wrap;
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
  border: none;
  
  &.like {
    background: linear-gradient(135deg, #e91e63 0%, #f06292 100%);
    color: white;
  }
  
  &.gift {
    background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
    color: white;
  }
  
  &.chat {
    background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
    color: white;
  }
  
  &.superlike {
    background: linear-gradient(135deg, #2196f3 0%, #42a5f5 100%);
    color: white;
  }
  
  @media (max-width: 768px) {
    padding: 10px 16px;
    font-size: 14px;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  background: white;
  border-radius: 0;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Tab = styled.button`
  flex: 1;
  padding: 20px;
  border: none;
  background: ${props => props.$active ? 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)' : 'white'};
  color: ${props => props.$active ? 'white' : '#4a5568'};
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
  border-bottom: ${props => props.$active ? 'none' : '1px solid #e2e8f0'};
  
  &:hover:not(:disabled) {
    background: ${props => props.$active ? 
      'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)' : 
      'linear-gradient(135deg, rgba(220, 53, 34, 0.1) 0%, rgba(255, 107, 88, 0.1) 100%)'
    };
    color: ${props => props.$active ? 'white' : '#dc3522'};
  }
  
  @media (max-width: 768px) {
    padding: 15px;
    font-size: 14px;
  }
`;

const TabContent = styled.div`
  padding: 40px;
  background: white;
  border-radius: 0 0 25px 25px;
  min-height: 400px;
  
  @media (max-width: 768px) {
    padding: 25px 20px;
  }
`;

const RatingSection = styled.div`
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 15px;
  padding: 20px;
  margin: 20px 40px;
  border: 1px solid #dee2e6;
  
  @media (max-width: 768px) {
    margin: 20px 20px;
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
`;

const InfoItem = styled.p`
  margin: 0 0 8px 0;
  color: #4a5568;
  font-size: 15px;
  
  strong {
    color: #2d3748;
    font-weight: 600;
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
  transition: transform 0.3s ease;
  
  ${ImageCard}:hover & {
    transform: scale(1.1);
  }
`;

const ImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(220, 53, 34, 0.8) 0%, rgba(255, 107, 88, 0.8) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  ${ImageCard}:hover & {
    opacity: 1;
  }
`;

const UploadArea = styled.div`
  border: 3px dashed #cbd5e0;
  border-radius: 15px;
  padding: 60px 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  
  &:hover {
    border-color: #dc3522;
    background: linear-gradient(135deg, rgba(220, 53, 34, 0.05) 0%, rgba(255, 107, 88, 0.05) 100%);
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const GiftGrid = styled(Grid)`
  margin-bottom: 20px;
`;

const GiftOption = styled(motion.div)`
  background: white;
  border: 2px solid ${props => props.$selected ? '#dc3522' : '#e2e8f0'};
  border-radius: 15px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #dc3522;
    transform: translateY(-2px);
  }
  
  .emoji {
    font-size: 32px;
    margin-bottom: 8px;
    display: block;
  }
  
  .name {
    font-size: 14px;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 4px;
  }
  
  .cost {
    font-size: 12px;
    color: #dc3522;
    font-weight: 600;
  }
`;

const Profile = () => {
  const { login } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = apiUtils.getCurrentUser();
  
  // Определяем, чей это профиль
  const isOwnProfile = !login || (currentUser && currentUser.login === login);
  const targetLogin = isOwnProfile ? currentUser?.login : login;
  
  // Состояния
  const [activeTab, setActiveTab] = useState('profile');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showSuperlikeModal, setShowSuperlikeModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [giftMessage, setGiftMessage] = useState('');
  const [superlikeMessage, setSuperlikeMessage] = useState('');
  
  const avatarInputRef = useRef();
  const imagesInputRef = useRef();

  // Проверка авторизации
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Дополнительная проверка targetLogin
  if (!targetLogin) {
    return (
      <ProfileContainer>
        <ContentCard $maxWidth="600px">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2>Ошибка</h2>
            <p>Не удалось определить профиль для просмотра</p>
            <Button onClick={() => navigate('/catalog')}>
              Вернуться к каталогу
            </Button>
          </div>
        </ContentCard>
      </ProfileContainer>
    );
  }

  // Получение профиля
  const { data: profile, isLoading, error } = useQuery(
    ['profile', targetLogin],
    () => usersAPI.getProfile(targetLogin),
    {
      enabled: !!targetLogin,
      onError: (error) => {
        if (error.response?.status === 404) {
          toast.error('Пользователь не найден');
          navigate('/catalog');
        }
      }
    }
  );

  // Получение статуса мэтча (только для чужих профилей)
  const { data: matchStatus } = useQuery(
    ['match-status', targetLogin],
    () => chatAPI.getMatchStatus(targetLogin),
    {
      enabled: !isOwnProfile && !!targetLogin,
      retry: false
    }
  );

  // Form для редактирования профиля
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors }
  } = useForm({
    values: profile
  });

  // Мутации
  const updateProfileMutation = useMutation(usersAPI.updateProfile, {
    onSuccess: () => {
      toast.success('Профиль обновлен!');
      queryClient.invalidateQueries(['profile']);
      if (targetLogin) {
        queryClient.invalidateQueries(['profile', targetLogin]);
      }
      
      if (window.refreshNavigation) {
        window.refreshNavigation();
      }
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const uploadAvatarMutation = useMutation(usersAPI.uploadAvatar, {
    onSuccess: () => {
      toast.success('Аватар обновлен!');
      queryClient.invalidateQueries(['profile']);
      if (targetLogin) {
        queryClient.invalidateQueries(['profile', targetLogin]);
      }
      
      if (window.refreshNavigation) {
        window.refreshNavigation();
      }
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const uploadImageMutation = useMutation(usersAPI.uploadImages, {
    onSuccess: () => {
      toast.success('Фото добавлено!');
      queryClient.invalidateQueries(['profile']);
      if (targetLogin) {
        queryClient.invalidateQueries(['profile', targetLogin]);
      }
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const deleteImageMutation = useMutation(usersAPI.deleteImage, {
    onSuccess: () => {
      toast.success('Фото удалено!');
      queryClient.invalidateQueries(['profile']);
      if (targetLogin) {
        queryClient.invalidateQueries(['profile', targetLogin]);
      }
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const likeMutation = useMutation(swipeAPI.like, {
    onSuccess: (data) => {
      if (data.result === 'reciprocal_like') {
        toast.success('🎉 Взаимная симпатия! Теперь можете общаться');
        if (targetLogin) {
          queryClient.invalidateQueries(['match-status', targetLogin]);
        }
      } else {
        toast.success('Лайк отправлен!');
      }
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const superlikeMutation = useMutation(swipeAPI.superlike, {
    onSuccess: () => {
      toast.success('Суперлайк отправлен!');
      setShowSuperlikeModal(false);
      setSuperlikeMessage('');
      if (targetLogin) {
        queryClient.invalidateQueries(['match-status', targetLogin]);
      }
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const sendGiftMutation = useMutation(giftsAPI.sendGift, {
    onSuccess: () => {
      toast.success('Подарок отправлен!');
      setShowGiftModal(false);
      setSelectedGift(null);
      setGiftMessage('');
      if (targetLogin) {
        queryClient.invalidateQueries(['match-status', targetLogin]);
      }
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  // Регистрация посещения
  const visitMutation = useMutation(usersAPI.registerVisit, {
    onSuccess: () => {
      if (targetLogin) {
        queryClient.invalidateQueries(['profile', targetLogin]);
      }
    },
    onError: (error) => {
      console.warn('Visit registration failed:', error);
    }
  });

  // Эффекты
  useEffect(() => {
    if (!isOwnProfile && targetLogin && profile) {
      visitMutation.mutate(targetLogin);
    }
  }, [targetLogin, profile, isOwnProfile]);

  // Обработчики
  const onSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('avatar', file);
      uploadAvatarMutation.mutate(formData);
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });
      uploadImageMutation.mutate(formData);
    }
  };

  const handleDeleteImage = (imageId) => {
    if (window.confirm('Удалить это фото?')) {
      deleteImageMutation.mutate(imageId);
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  const handleLike = () => {
    if (likeMutation.isLoading) return;
    
    if (!targetLogin) {
      toast.error('Ошибка: не указан получатель лайка');
      return;
    }
    
    likeMutation.mutate(targetLogin);
  };

  const handleSuperlike = () => {
    if (!superlikeMessage.trim()) {
      toast.error('Введите сообщение для суперлайка');
      return;
    }
    
    if (!targetLogin) {
      toast.error('Ошибка: не указан получатель суперлайка');
      return;
    }
    
    superlikeMutation.mutate({
      targetUser: targetLogin,
      message: superlikeMessage ? superlikeMessage.trim() : ''
    });
  };

  const handleSendGift = () => {
    if (!selectedGift) {
      toast.error('Выберите подарок');
      return;
    }
    
    if (!targetLogin) {
      toast.error('Ошибка: не указан получатель подарка');
      return;
    }
    
    sendGiftMutation.mutate({
      to_user: targetLogin,
      gift_type: selectedGift,
      message: giftMessage ? giftMessage.trim() : ''
    });
  };

  const handleGoToChat = () => {
    if (!targetLogin) {
      toast.error('Ошибка: не указан пользователь для чата');
      return;
    }
    
    navigate(`/chat/${targetLogin}`);
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
            <p>Пользователь {targetLogin} не существует или был удален</p>
            <Button onClick={() => navigate('/catalog')}>
              Вернуться к каталогу
            </Button>
          </div>
        </ContentCard>
      </ProfileContainer>
    );
  }

  // Проверяем наличие взаимного мэтча
  const hasMatch = matchStatus?.hasMatch || false;
  const hasUserLiked = matchStatus?.userHasLiked || false;

  return (
    <ProfileContainer>
      <ContentCard $maxWidth="1000px" $padding="0">
        <ProfileHeader>
          <AvatarSection>
            <Avatar
              $src={profile.ava ? `/uploads/${profile.ava}` : ''}
              $size="120px"
              $fontSize="48px"
              $clickable={isOwnProfile}
            >
              {!profile.ava && profile.login?.charAt(0).toUpperCase()}
            </Avatar>
            {isOwnProfile && (
              <>
                <AvatarOverlay onClick={() => avatarInputRef.current?.click()}>
                  <CameraIcon />
                </AvatarOverlay>
                <HiddenInput
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
              </>
            )}
          </AvatarSection>
          
          <UserInfo>
            <h2>@{profile.login}</h2>
            <p>{profile.city} • {profile.status} {profile.distance > 0 && `• ${profile.distance}км от вас`}</p>
          </UserInfo>
        </ProfileHeader>

        {/* Кнопки действий (только для чужих профилей) */}
        {!isOwnProfile && (
          <ActionsContainer>
            <ActionButton 
              className="gift" 
              onClick={() => setShowGiftModal(true)}
            >
              <GiftIcon />
              Подарок
            </ActionButton>
            
            {hasMatch ? (
              <ActionButton
                className="chat"
                onClick={handleGoToChat}
              >
                <MessageIcon />
                Написать
              </ActionButton>
            ) : !hasUserLiked ? (
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
            ) : null}
          </ActionsContainer>
        )}

        {/* Интеграция рейтинговой системы */}
        {!isOwnProfile && (
          <RatingSection>
                        <RatingDisplay
              targetUser={targetLogin}
              onRatingSubmit={() => {
                if (targetLogin) {
                  queryClient.invalidateQueries(['profile', targetLogin]);
                }
              }}
            />
          </RatingSection>
        )}

        <TabsContainer>
          <Tab
            $active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          >
            Профиль
          </Tab>
          <Tab
            $active={activeTab === 'photos'}
            onClick={() => setActiveTab('photos')}
          >
            Фотографии
          </Tab>
          {isOwnProfile && (
            <Tab
              $active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
            >
              Настройки
            </Tab>
          )}
        </TabsContainer>

        <TabContent>
          {activeTab === 'profile' && (
            <div>
              {isOwnProfile ? (
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <FormGroup>
                    <Label>Имя</Label>
                    <Input
                      {...register('name')}
                      placeholder="Ваше имя"
                    />
                  </FormGroup>

                  <LocationSelector
                    countryValue={watch('country') || ''}
                    cityValue={watch('city') || ''}
                    onCountryChange={(value) => {
                      setValue('country', value);
                      clearErrors('country');
                      if (watch('city')) {
                        setValue('city', '');
                        clearErrors('city');
                      }
                    }}
                    onCityChange={(value) => {
                      setValue('city', value);
                      clearErrors('city');
                    }}
                    countryError={errors.country?.message}
                    cityError={errors.city?.message}
                    required={true}
                    showValidation={true}
                    layout="side-by-side"
                  />

                  <FormGroup>
                    <Label>О себе</Label>
                    <TextArea
                      {...register('info')}
                      placeholder="Расскажите о себе..."
                      $minHeight="120px"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Что ищете</Label>
                    <TextArea
                      {...register('looking_for')}
                      placeholder="Опишите, кого или что вы ищете..."
                      $minHeight="120px"
                    />
                  </FormGroup>

                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isLoading}
                  >
                    {updateProfileMutation.isLoading ? 'Сохранение...' : 'Сохранить изменения'}
                  </Button>
                </Form>
              ) : (
                <div>
                  <InfoSection>
                    <h3>Основная информация</h3>
                    <InfoItem><strong>Страна:</strong> {profile.country}</InfoItem>
                    <InfoItem><strong>Город:</strong> {profile.city}</InfoItem>
                    <InfoItem><strong>Статус:</strong> {profile.status}</InfoItem>
                    {profile.distance > 0 && (
                      <InfoItem><strong>Расстояние:</strong> {profile.distance} км от вас</InfoItem>
                    )}
                  </InfoSection>

                  {profile.info && (
                    <InfoSection>
                      <h3>О пользователе</h3>
                      <InfoItem>{profile.info}</InfoItem>
                    </InfoSection>
                  )}

                  {profile.looking_for && (
                    <InfoSection>
                      <h3>Что ищет</h3>
                      <InfoItem>{profile.looking_for}</InfoItem>
                    </InfoSection>
                  )}
                  
                  {/* Комментарии к профилю */}
                  <div style={{ marginTop: '30px' }}>
                    <ProfileComments 
                      username={login} 
                      currentUser={currentUser?.login}
                      isOwnProfile={isOwnProfile}
                    />
                  </div>
                  
                  {/* Реакции на профиль */}
                  <div style={{ marginTop: '20px' }}>
                    <Reactions 
                      objectType="profile" 
                      objectId={login} 
                      currentUser={currentUser?.login}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div>
              {isOwnProfile && (
                <>
                  <UploadArea onClick={() => imagesInputRef.current?.click()}>
                    <div style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.6 }}>📸</div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#2d3748', fontSize: '18px' }}>Загрузить фотографии</h4>
                    <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>
                      Нажмите, чтобы выбрать файлы. Поддерживаются JPG, PNG. Максимум 5MB на файл.
                    </p>
                  </UploadArea>
                  
                  <HiddenInput
                    ref={imagesInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                </>
              )}

              <ImageGallery $columns="repeat(auto-fill, minmax(200px, 1fr))" $gap="20px">
                {profile?.images?.map((image, index) => (
                  <ImageCard key={index} onClick={() => handleImageClick(image)}>
                    <Image src={`/uploads/${image}`} alt={`Фото ${index + 1}`} />
                    {isOwnProfile && (
                      <ImageOverlay>
                        <IconButton
                          $variant="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(image);
                          }}
                        >
                          <TrashIcon />
                        </IconButton>
                      </ImageOverlay>
                    )}
                  </ImageCard>
                ))}
              </ImageGallery>
              
              {/* Комментарии к фотографиям */}
              {profile?.images?.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                  <h3 style={{ marginBottom: '20px', color: '#2d3748' }}>
                    Комментарии к фотографиям
                  </h3>
                  {profile.images.map((image, index) => (
                    <div key={index} style={{ marginBottom: '30px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '15px', 
                        marginBottom: '15px',
                        padding: '15px',
                        background: '#f7fafc',
                        borderRadius: '12px'
                      }}>
                        <img 
                          src={`/uploads/${image}`} 
                          alt={`Фото ${index + 1}`}
                          style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '2px solid #e2e8f0'
                          }}
                        />
                        <div>
                          <h4 style={{ margin: '0 0 5px 0', color: '#2d3748' }}>
                            Фото {index + 1}
                          </h4>
                          <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>
                            Нажмите на фото для просмотра
                          </p>
                        </div>
                      </div>
                      
                      <PhotoComments 
                        filename={image} 
                        currentUser={currentUser?.login}
                      />
                      
                      {/* Реакции на фотографию */}
                      <div style={{ marginTop: '20px' }}>
                        <Reactions 
                          objectType="image" 
                          objectId={image} 
                          currentUser={currentUser?.login}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && isOwnProfile && (
            <div>
              <InfoSection>
                <h3>Настройки профиля</h3>
                <InfoItem>Здесь будут настройки приватности и уведомлений</InfoItem>
              </InfoSection>
            </div>
          )}
        </TabContent>
      </ContentCard>

      {/* Модальные окна */}
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

      {/* Модальное окно подарков */}
      {showGiftModal && (
        <Modal onClick={() => setShowGiftModal(false)}>
          <ModalContent $maxWidth="600px" onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>Отправить подарок</h2>
              <IconButton
                $variant="secondary"
                onClick={() => setShowGiftModal(false)}
              >
                <CloseIcon />
              </IconButton>
            </ModalHeader>
            
            <GiftGrid $columns="repeat(auto-fit, minmax(120px, 1fr))" $gap="15px">
              {Object.entries(GIFT_CONFIG).map(([id, gift]) => (
                <GiftOption
                  key={id}
                  $selected={selectedGift === id}
                  onClick={() => setSelectedGift(id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="emoji">{gift.emoji}</div>
                  <div className="name">{gift.name}</div>
                  <div className="cost">{gift.cost} 🦊</div>
                </GiftOption>
              ))}
            </GiftGrid>

            <FormGroup>
              <Label>Сообщение (необязательно)</Label>
              <TextArea
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder="Добавьте личное сообщение к подарку..."
                $minHeight="80px"
              />
            </FormGroup>

            <Button
              onClick={handleSendGift}
              disabled={sendGiftMutation.isLoading || !selectedGift}
              style={{ width: '100%' }}
            >
              {sendGiftMutation.isLoading ? 'Отправляем...' : 'Отправить подарок'}
            </Button>
          </ModalContent>
        </Modal>
      )}

      {/* Модальное окно суперлайка */}
      {showSuperlikeModal && (
        <Modal onClick={() => setShowSuperlikeModal(false)}>
          <ModalContent $maxWidth="500px" onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>Отправить суперлайк</h2>
              <IconButton
                $variant="secondary"
                onClick={() => setShowSuperlikeModal(false)}
              >
                <CloseIcon />
              </IconButton>
            </ModalHeader>

            <FormGroup>
              <Label>Сообщение *</Label>
              <TextArea
                value={superlikeMessage}
                onChange={(e) => setSuperlikeMessage(e.target.value)}
                placeholder="Напишите сообщение для суперлайка..."
                $minHeight="120px"
                required
              />
            </FormGroup>

            <Button
              onClick={handleSuperlike}
              disabled={superlikeMutation.isLoading || !superlikeMessage.trim()}
              style={{ width: '100%' }}
            >
              {superlikeMutation.isLoading ? 'Отправляем...' : 'Отправить суперлайк'}
            </Button>
          </ModalContent>
        </Modal>
      )}
    </ProfileContainer>
  );
};

export default Profile;