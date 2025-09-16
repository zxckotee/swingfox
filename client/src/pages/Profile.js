import React, { useState, useRef, useEffect } from 'react';
import { useParams, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { usersAPI, swipeAPI, chatAPI, giftsAPI, ratingAPI, subscriptionsAPI, apiUtils, privacyAPI } from '../services/api';
import { LocationSelector } from '../components/Geography';
import RatingDisplay from '../components/RatingDisplay';
import ProfileRating from '../components/ProfileRating';
import PhotoComments from '../components/PhotoComments';
import ProfileComments from '../components/ProfileComments';
import Reactions from '../components/Reactions';

// Функция для преобразования возрастного диапазона в понятное описание
const getAgeDescription = (ageRange) => {
  if (!ageRange) return '';
  
  // Если это диапазон вида "22-40"
  if (ageRange.includes('-')) {
    const [minAge, maxAge] = ageRange.split('-').map(age => parseInt(age.trim()));
    const diff = maxAge - minAge;
    
    if (diff <= 2) {
      return 'ровесники';
    } else if (diff <= 5) {
      return 'сверстники';
    } else if (diff <= 10) {
      return 'какая разница';
    } else if (diff <= 15) {
      return 'не важен возраст';
    } else {
      return 'возраст не важен';
    }
  }
  
  // Если это конкретный возраст
  if (ageRange.includes('+')) {
    const minAge = parseInt(ageRange.replace('+', ''));
    if (minAge <= 25) {
      return 'молодые';
    } else if (minAge <= 35) {
      return 'зрелые';
    } else {
      return 'опытные';
    }
  }
  
  // Если это просто число
  const age = parseInt(ageRange);
  if (!isNaN(age)) {
    if (age <= 25) {
      return 'молодые';
    } else if (age <= 35) {
      return 'зрелые';
    } else {
      return 'опытные';
    }
  }
  
  // Если не удалось распарсить, возвращаем как есть
  return ageRange;
};

// Функция для расчета возраста из даты рождения
const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error('Ошибка при расчете возраста:', error);
    return null;
  }
};

// Функция для правильного склонения слова "год"
const getAgeText = (age) => {
  if (!age) return '';
  
  const lastDigit = age % 10;
  const lastTwoDigits = age % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${age} лет`;
  } else if (lastDigit === 1) {
    return `${age} год`;
  } else if (lastDigit >= 2 && lastDigit <= 4) {
    return `${age} года`;
  } else {
    return `${age} лет`;
  }
};
// Убираем импорт getStatusDisplayName, так как теперь статусы уже русские
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
  Checkbox,
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
  SendIcon,
  CrownIcon,
  CreditCardIcon,
  WalletIcon,
  CheckIcon,
  AvatarCropper
} from '../components/UI';

// Дополнительные иконки
const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
  text-align: center;
  
  /* Центрируем аватарку */
  .avatar-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 auto;
  }
`;

const AvatarOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 2;
  
  &:hover {
    opacity: 1;
    background: rgba(220, 53, 34, 0.8);
  }
  
  svg {
    color: white;
    width: 24px;
    height: 24px;
  }
  
  @media (max-width: 768px) {
    svg {
      width: 20px;
      height: 20px;
    }
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

const GiftCard = styled(Card)`
  background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
  border: 2px solid #fed7d7;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(220, 53, 34, 0.15);
    border-color: #dc3522;
  }
`;

const BalanceSection = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  padding: 25px;
  margin: 20px 40px;
  color: white;
  text-align: center;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  
  @media (max-width: 768px) {
    margin: 20px 20px;
    padding: 20px;
  }
`;

const BalanceTitle = styled.h3`
  margin: 0 0 15px 0;
  font-size: 20px;
  font-weight: 600;
  color: white;
`;

const BalanceAmount = styled.div`
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const BalanceButton = styled(Button)`
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #2d3748;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 25px;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.6);
  }
`;

const VipAdSection = styled.div`
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border-radius: 15px;
  padding: 25px;
  margin: 20px 40px;
  text-align: center;
  box-shadow: 0 8px 25px rgba(255, 215, 0, 0.3);
  border: 2px solid #ffd700;
  
  @media (max-width: 768px) {
    margin: 20px 20px;
    padding: 20px;
  }
`;

const VipAdTitle = styled.h3`
  margin: 0 0 15px 0;
  font-size: 22px;
  font-weight: 700;
  color: #2d3748;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const VipAdText = styled.p`
  margin: 0 0 20px 0;
  font-size: 16px;
  color: #4a5568;
  line-height: 1.6;
`;

const VipAdButton = styled(Button)`
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  color: white;
  font-weight: 600;
  padding: 12px 30px;
  border-radius: 25px;
  box-shadow: 0 4px 15px rgba(45, 55, 72, 0.4);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(45, 55, 72, 0.6);
  }
`;

const GiftEmoji = styled.div`
  font-size: 48px;
  margin-bottom: 15px;
  text-align: center;
`;

const GiftSender = styled.div`
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  margin: 10px 0;
  display: inline-block;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(220, 53, 34, 0.3);
  }
`;

const GiftMessage = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  margin: 10px 0;
  font-style: italic;
  color: #4a5568;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AvatarHint = styled.div`
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 3;
  
  ${AvatarSection}:hover & {
    opacity: 1;
  }
  
  @media (max-width: 768px) {
    font-size: 11px;
    padding: 6px 10px;
    bottom: -25px;
  }
`;

const Profile = () => {
  const { login } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // Получение параметра tab из URL
  const searchParams = new URLSearchParams(location.search);
  const tabFromUrl = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState('profile');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [giftMessage, setGiftMessage] = useState('');
  const [showSuperlikeModal, setShowSuperlikeModal] = useState(false);
  const [superlikeMessage, setSuperlikeMessage] = useState('');

  // Устанавливаем активную вкладку на основе URL параметра
  useEffect(() => {
    if (tabFromUrl && ['profile', 'photos', 'gifts', 'settings'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const currentUser = apiUtils.getCurrentUser();
  
  // Определяем, чей это профиль
  const isOwnProfile = !login || (currentUser && currentUser.login === login);
  
  // Обрабатываем логин - убираем @ если есть
  const cleanLogin = login ? login.replace(/^@/, '') : login;
  const targetLogin = isOwnProfile ? currentUser?.login : cleanLogin;
  
  // Проверяем, является ли это клубом
  const isClubProfile = cleanLogin && cleanLogin.startsWith('club_');
  const clubId = isClubProfile ? cleanLogin.replace('club_', '') : null;

  // Отладочная информация
  useEffect(() => {
    console.log('Profile component debug:', {
      login,
      cleanLogin,
      isClubProfile,
      clubId,
      currentUser: apiUtils.getCurrentUser() ? { login: apiUtils.getCurrentUser().login, hasLogin: !!apiUtils.getCurrentUser().login } : null,
      isOwnProfile,
      targetLogin,
      hasTargetLogin: !!targetLogin
    });
  }, [login, cleanLogin, isClubProfile, clubId, currentUser, isOwnProfile, targetLogin]);

  // Редирект на страницу клуба, если это клуб
  useEffect(() => {
    if (isClubProfile && clubId) {
      navigate(`/club-profile/${clubId}`, { replace: true });
    }
  }, [isClubProfile, clubId, navigate]);
  
  // Состояния
  // const [activeTab, setActiveTab] = useState('profile');
  // const [showImageModal, setShowImageModal] = useState(false);
  // const [selectedImage, setSelectedImage] = useState(null);
  // const [showGiftModal, setShowGiftModal] = useState(false);
  // const [showSuperlikeModal, setShowSuperlikeModal] = useState(false);
  // const [selectedGift, setSelectedGift] = useState(null);
  // const [giftMessage, setGiftMessage] = useState('');
  // const [superlikeMessage, setSuperlikeMessage] = useState('');

  // Получение полученных подарков
  const { data: receivedGiftsData = { gifts: [] } } = useQuery(
    ['receivedGifts', targetLogin],
    () => giftsAPI.getReceivedGifts(20, 0, targetLogin),
    {
      enabled: !!targetLogin && !isClubProfile,
      onError: (error) => {
        console.error('Ошибка при получении подарков:', error);
      }
    }
  );

  // Получение настроек приватности
  const { data: privacySettings } = useQuery(
    ['privacySettings'],
    () => privacyAPI.getSettings(),
    {
      enabled: isOwnProfile,
      onError: (error) => {
        console.error('Ошибка при получении настроек приватности:', error);
      }
    }
  );

  // Отладочная информация
  useEffect(() => {
    if (receivedGiftsData) {
      console.log('Received gifts data:', receivedGiftsData);
      console.log('Received gifts:', receivedGiftsData.gifts);
    }
  }, [receivedGiftsData]);

  // Отладочная информация для подписки
  useEffect(() => {
    if (subscriptionStatus) {
      console.log('Subscription status:', subscriptionStatus);
    }
  }, [subscriptionStatus]);

  const avatarInputRef = useRef();
  const imagesInputRef = useRef();

  // Добавляем состояние для кропа аватарки
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [avatarFileToCrop, setAvatarFileToCrop] = useState(null);

  // Функция для перехода в профиль отправителя подарка
  const handleGiftSenderClick = (senderLogin) => {
    if (senderLogin && senderLogin !== currentUser?.login) {
      // Проверяем, является ли senderLogin клубом (начинается с @club_)
      if (senderLogin.startsWith('@club_')) {
        const clubId = senderLogin.replace('@club_', '');
        navigate(`/club-profile/${clubId}`);
      } else {
        navigate(`/profile/${senderLogin}`);
      }
    }
  };

  // Проверка авторизации
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Дополнительная проверка targetLogin
  if (!targetLogin) {
    console.warn('Profile: targetLogin is undefined', { login, currentUser, isOwnProfile });
    return (
      <ProfileContainer>
        <ContentCard $maxWidth="600px">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2>Ошибка</h2>
            <p>Не удалось определить профиль для просмотра</p>
            <p style={{ fontSize: '14px', color: '#718096', marginTop: '10px' }}>
              Debug: login={String(login)}, currentUser={currentUser ? 'exists' : 'null'}, isOwnProfile={String(isOwnProfile)}
            </p>
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
      enabled: !!targetLogin && !isClubProfile,
      onError: (error) => {
        console.error('Profile API error:', {
          targetLogin,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        
        if (error.response?.status === 404) {
          toast.error('Пользователь не найден');
          navigate('/catalog');
        } else {
          toast.error(`Ошибка загрузки профиля: ${error.message}`);
        }
      }
    }
  );

  // Получение рейтинга пользователя (только для чужих профилей)
  const { data: userRating } = useQuery(
    ['rating', targetLogin],
    () => ratingAPI.getUserRating(targetLogin),
    {
      enabled: !isOwnProfile && !!targetLogin,
      retry: false,
      onError: (error) => {
        console.error('Rating API error:', error);
      }
    }
  );

  // Получение статуса мэтча (только для чужих профилей)
  const { data: matchStatus } = useQuery(
    ['match-status', targetLogin],
    () => chatAPI.getMatchStatus(targetLogin),
    {
      enabled: !isOwnProfile && !!targetLogin,
      retry: false,
      onError: (error) => {
        console.error('Match status API error:', {
          targetLogin,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      }
    }
  );

  // Получение статуса подписки (только для своего профиля)
  const { data: subscriptionStatus, isLoading: isLoadingSubscription } = useQuery(
    ['subscription-status'],
    subscriptionsAPI.getStatus,
    {
      enabled: isOwnProfile,
      onError: (error) => {
        console.error('Subscription status API error:', {
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      }
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
    onSuccess: (data) => {
      console.log('Upload success:', data);
      toast.success('Фото добавлено!');
      queryClient.invalidateQueries(['profile']);
      if (targetLogin) {
        queryClient.invalidateQueries(['profile', targetLogin]);
      }
      // Принудительно обновляем профиль
      if (isOwnProfile) {
        queryClient.invalidateQueries(['profile', currentUser?.login]);
      }
    },
    onError: (error) => {
      console.error('Upload error:', error);
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

  // Мутация для отправки подарка
  const sendGiftMutation = useMutation(giftsAPI.sendGift, {
    onSuccess: (data) => {
      toast.success('Подарок успешно отправлен!');
      setShowGiftModal(false);
      setSelectedGift(null);
      setGiftMessage('');
      
      // Обновляем данные профиля и подарков
      if (targetLogin) {
        queryClient.invalidateQueries(['profile', targetLogin]);
        queryClient.invalidateQueries(['gifts', targetLogin]);
      }
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  // Мутация для сохранения настроек приватности
  const privacyMutation = useMutation(privacyAPI.updateSettings, {
    onSuccess: (data) => {
      toast.success('Настройки приватности обновлены');
      
      // Обновляем данные пользователя
      queryClient.invalidateQueries(['currentUser']);
    },
    onError: (error) => {
      toast.error('Ошибка при сохранении настроек: ' + apiUtils.handleError(error));
      
      // Восстанавливаем предыдущие настройки в случае ошибки
      queryClient.invalidateQueries(['privacySettings']);
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

  // Обновляем функцию загрузки аватарки
  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Проверяем, что это изображение
      if (!file.type.startsWith('image/')) {
        toast.error('Пожалуйста, выберите файл изображения');
        return;
      }
      
      // Открываем кроппер
      setAvatarFileToCrop(file);
      setShowAvatarCropper(true);
      
      // Очищаем input
      event.target.value = '';
    }
  };

  // Добавляем функцию обработки обрезанной аватарки
  const handleAvatarCrop = (croppedFile) => {
    const formData = new FormData();
    formData.append('avatar', croppedFile);
    uploadAvatarMutation.mutate(formData);
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });
      uploadImageMutation.mutate(formData);
      
      // Очищаем input после загрузки
      event.target.value = '';
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

  // Функция для отправки подарка
  const handleSendGift = async () => {
    if (!selectedGift) {
      toast.error('Выберите подарок');
      return;
    }

    try {
      await sendGiftMutation.mutateAsync({
        to_user: targetLogin,
        gift_type: selectedGift,
        message: giftMessage
      });
    } catch (error) {
      console.error('Ошибка при отправке подарка:', error);
    }
  };

  // Функция для сохранения настроек приватности
  const handlePrivacySubmit = async (e) => {
    e.preventDefault();
    
    try {
      const currentSettings = queryClient.getQueryData(['privacySettings']);
      if (currentSettings) {
        await privacyMutation.mutateAsync({
          privacy: currentSettings.privacy,
          notifications: currentSettings.notifications
        });
      }
    } catch (error) {
      console.error('Ошибка при сохранении настроек:', error);
    }
  };

  // Функция для обновления настроек с автоматическим сохранением
  const updatePrivacySetting = (category, setting, value) => {
    const newSettings = {
      ...privacySettings,
      [category]: {
        ...privacySettings?.[category],
        [setting]: value
      }
    };
    
    // Обновляем локальное состояние
    queryClient.setQueryData(['privacySettings'], newSettings);
    
    // Автоматически сохраняем настройки
    privacyMutation.mutate({
      privacy: newSettings.privacy,
      notifications: newSettings.notifications
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

  // Проверяем наличие взаимного мэтча и сообщений
  const hasMatch = matchStatus?.hasMatch || false;
  const hasMessages = matchStatus?.hasMessages || false;
  const canChat = matchStatus?.canChat || false;
  const hasUserLiked = matchStatus?.userHasLiked || false;

  return (
    <ProfileContainer>
      <ContentCard $maxWidth="1000px" $padding="0">
        <ProfileHeader>
          <AvatarSection>
            <div className="avatar-container">
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
                  <AvatarHint>
                    Нажмите для загрузки аватарки
                  </AvatarHint>
                </>
              )}
            </div>
          </AvatarSection>
          
          <UserInfo>
            <h2>@{profile.login}</h2>
            <p>{profile.city} • {profile.status} {profile.distance > 0 && `• ${profile.distance}км от вас`}</p>
          </UserInfo>
        </ProfileHeader>

        {/* Секция баланса (только для своего профиля) */}
        {isOwnProfile && (
          <BalanceSection>
            <BalanceTitle>💰 Ваш баланс</BalanceTitle>
            <BalanceAmount>{profile.balance || 0} 🦊</BalanceAmount>
            <BalanceButton onClick={() => navigate('/balance-topup')}>
              Пополнить баланс
            </BalanceButton>
          </BalanceSection>
        )}

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
            
            {canChat ? (
              <ActionButton
                className="chat"
                onClick={handleGoToChat}
              >
                <MessageIcon />
                {hasMatch ? 'Написать' : 'Продолжить общение'}
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
            <ProfileRating
              targetUser={targetLogin}
              currentUser={currentUser}
              initialRating={userRating}
              canVote={true}
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
          <Tab
            $active={activeTab === 'gifts'}
            onClick={() => setActiveTab('gifts')}
          >
                              🎁 Подарки {receivedGiftsData.gifts && receivedGiftsData.gifts.length > 0 && `(${receivedGiftsData.gifts.length})`}
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
                <>
                  <Form onSubmit={handleSubmit(onSubmit)}>
                    <FormGroup>
                      <Label>Имя</Label>
                      <Input
                        {...register('name')}
                        placeholder="Ваше имя"
                      />
                    </FormGroup>

                    <LocationSelector
                      countryValue={watch('country')}
                      cityValue={watch('city')}
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
                      <Label>Дата рождения</Label>
                      <Input
                        {...register('date')}
                        type="date"
                        placeholder="Выберите дату рождения"
                      />
                    </FormGroup>

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
                  
                  {/* Реклама подписки (только для своего профиля и только если нет активной подписки) */}
                  {!isLoadingSubscription && (!subscriptionStatus?.has_subscription || subscriptionStatus?.plan === 'free') && (
                    <VipAdSection>
                      <VipAdTitle>
                        👑 
                        Переходите на подписку!
                      </VipAdTitle>
                      <VipAdText>
                        Получите эксклюзивные возможности: больше лайков, 
                        приоритет в поиске, расширенная статистика и многое другое!
                        Доступны планы VIP и PREMIUM.
                      </VipAdText>
                      <VipAdButton onClick={() => navigate('/subscriptions')}>
                        Перейти к подписке
                      </VipAdButton>
                    </VipAdSection>
                  )}

                  {/* Информация о текущей подписке (если есть активная подписка) */}
                  {!isLoadingSubscription && subscriptionStatus?.has_subscription && subscriptionStatus?.plan !== 'free' && (
                    <VipAdSection style={{ 
                      background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                      borderColor: '#48bb78'
                    }}>
                      <VipAdTitle style={{ color: 'white' }}>
                        👑 
                        У вас активна {subscriptionStatus.plan === 'vip' ? 'VIP' : 'PREMIUM'} подписка!
                      </VipAdTitle>
                      <VipAdText style={{ color: 'white' }}>
                        Ваша подписка активна до {new Date(subscriptionStatus.expires_at).toLocaleDateString('ru-RU')}.
                        {subscriptionStatus.auto_renew && ' Автопродление включено.'}
                      </VipAdText>
                      <VipAdButton 
                        onClick={() => navigate('/subscriptions')}
                        style={{
                          background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
                          color: 'white'
                        }}
                      >
                        Управление подпиской
                      </VipAdButton>
                    </VipAdSection>
                  )}

                  {/* Индикатор загрузки статуса подписки */}
                  {isLoadingSubscription && (
                    <VipAdSection style={{ 
                      background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)',
                      borderColor: '#cbd5e0'
                    }}>
                      <VipAdTitle style={{ color: '#4a5568' }}>
                        ⏳ 
                        Проверяем статус подписки...
                      </VipAdTitle>
                      <VipAdText style={{ color: '#718096' }}>
                        Загружаем информацию о вашей подписке
                      </VipAdText>
                    </VipAdSection>
                  )}
                </>
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

                  {/* Показываем данные партнера для пар */}
                  {profile.isCouple && profile.partnerData && (
                    <InfoSection>
                      <h3>👫 Данные пары</h3>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '15px',
                        padding: '15px',
                        background: 'rgba(220, 53, 34, 0.05)',
                        borderRadius: '10px',
                        border: '1px solid rgba(220, 53, 34, 0.1)'
                      }}>
                        <div>
                          <h4 style={{ margin: '0 0 10px 0', color: '#dc3522', fontSize: '16px' }}>👨 Мужчина</h4>
                          {profile.partnerData.manDate && (
                            <InfoItem>
                              <strong>Дата рождения:</strong> {new Date(profile.partnerData.manDate).toLocaleDateString('ru-RU')}
                              {calculateAge(profile.partnerData.manDate) && (
                                <span style={{ color: '#dc3522', fontWeight: '600' }}> ({getAgeText(calculateAge(profile.partnerData.manDate))})</span>
                              )}
                            </InfoItem>
                          )}
                          {profile.partnerData.manHeight && (
                            <InfoItem><strong>Рост:</strong> {profile.partnerData.manHeight} см</InfoItem>
                          )}
                          {profile.partnerData.manWeight && (
                            <InfoItem><strong>Вес:</strong> {profile.partnerData.manWeight} кг</InfoItem>
                          )}
                          {profile.partnerData.manSmoking && (
                            <InfoItem><strong>Курение:</strong> {profile.partnerData.manSmoking}</InfoItem>
                          )}
                          {profile.partnerData.manAlko && (
                            <InfoItem><strong>Алкоголь:</strong> {profile.partnerData.manAlko}</InfoItem>
                          )}
                        </div>
                        <div>
                          <h4 style={{ margin: '0 0 10px 0', color: '#dc3522', fontSize: '16px' }}>👩 Женщина</h4>
                          {profile.partnerData.womanDate && (
                            <InfoItem>
                              <strong>Дата рождения:</strong> {new Date(profile.partnerData.womanDate).toLocaleDateString('ru-RU')}
                              {calculateAge(profile.partnerData.womanDate) && (
                                <span style={{ color: '#dc3522', fontWeight: '600' }}> ({getAgeText(calculateAge(profile.partnerData.womanDate))})</span>
                              )}
                            </InfoItem>
                          )}
                          {profile.partnerData.womanHeight && (
                            <InfoItem><strong>Рост:</strong> {profile.partnerData.womanHeight} см</InfoItem>
                          )}
                          {profile.partnerData.womanWeight && (
                            <InfoItem><strong>Вес:</strong> {profile.partnerData.womanWeight} кг</InfoItem>
                          )}
                          {profile.partnerData.womanSmoking && (
                            <InfoItem><strong>Курение:</strong> {profile.partnerData.womanSmoking}</InfoItem>
                          )}
                          {profile.partnerData.womanAlko && (
                            <InfoItem><strong>Алкоголь:</strong> {profile.partnerData.womanAlko}</InfoItem>
                          )}
                        </div>
                      </div>
                    </InfoSection>
                  )}

                  {/* Дополнительная информация - убираем поля роста, веса, курения и алкоголя для пар */}
                  {profile.isCouple ? null : (profile.date || profile.height || profile.weight || profile.smoking || profile.alko) && (
                    <InfoSection>
                      <h3>Дополнительная информация</h3>
                      {profile.date && (
                        <InfoItem>
                          <strong>Дата рождения:</strong> {new Date(profile.date).toLocaleDateString('ru-RU')}
                          {calculateAge(profile.date) && (
                            <span style={{ color: '#dc3522', fontWeight: '600' }}> ({getAgeText(calculateAge(profile.date))})</span>
                          )}
                        </InfoItem>
                      )}
                      {profile.height && <InfoItem><strong>Рост:</strong> {profile.height} см</InfoItem>}
                      {profile.weight && <InfoItem><strong>Вес:</strong> {profile.weight} кг</InfoItem>}
                      {profile.smoking && <InfoItem><strong>Отношение к курению:</strong> {profile.smoking}</InfoItem>}
                      {profile.alko && <InfoItem><strong>Отношение к алкоголю:</strong> {profile.alko}</InfoItem>}
                    </InfoSection>
                  )}

                  {/* Предпочтения в поиске */}
                  {(profile.searchStatus || profile.searchAge || profile.location) && (
                    <InfoSection>
                      <h3>Что ищет</h3>
                      {profile.searchStatus && (
                        <InfoItem>
                          <strong>Кого ищет:</strong>
                          <div style={{ marginTop: '4px', marginLeft: '8px' }}>
                            {profile.searchStatus.split('&&').map((status, index) => (
                              <div key={index} style={{ marginBottom: '2px' }}>
                                • {status.trim()}
                              </div>
                            ))}
                          </div>
                        </InfoItem>
                      )}
                      {profile.searchAge && <InfoItem><strong>Возраст:</strong> {getAgeDescription(profile.searchAge)}</InfoItem>}
                      {profile.location && (
                        <InfoItem>
                          <strong>Где предпочитает знакомиться:</strong>
                          <div style={{ marginTop: '4px', marginLeft: '8px' }}>
                            {profile.location.split('&&').map((place, index) => (
                              <div key={index} style={{ marginBottom: '2px' }}>
                                • {place.trim()}
                              </div>
                            ))}
                          </div>
                        </InfoItem>
                      )}
                    </InfoSection>
                  )}

                  {profile.info && (
                    <InfoSection>
                      <h3>О пользователе</h3>
                      <InfoItem>{profile.info}</InfoItem>
                    </InfoSection>
                  )}

                  {/* Подарки (для всех профилей) */}
                  {receivedGiftsData.gifts && receivedGiftsData.gifts.length > 0 && (
                    <InfoSection>
                      <h3>🎁 Полученные подарки</h3>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '15px',
                        marginTop: '15px'
                      }}>
                        {receivedGiftsData.gifts.slice(0, 6).map((gift, index) => (
                          <div key={index} style={{
                            background: 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)',
                            border: '2px solid #fed7d7',
                            borderRadius: '12px',
                            padding: '15px',
                            textAlign: 'center',
                            transition: 'all 0.3s ease'
                          }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                              {GIFT_CONFIG[gift.gift_type]?.emoji || '🎁'}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#dc3522', 
                              fontWeight: '600',
                              marginBottom: '5px'
                            }}>
                              {GIFT_CONFIG[gift.gift_type]?.name || 'Подарок'}
                            </div>
                            {gift.message && (
                              <div style={{ 
                                fontSize: '11px', 
                                color: '#4a5568', 
                                fontStyle: 'italic',
                                marginBottom: '5px'
                              }}>
                                "{gift.message}"
                              </div>
                            )}
                            <div style={{ 
                              fontSize: '10px', 
                              color: '#718096'
                            }}>
                              {new Date(gift.created_at).toLocaleDateString('ru-RU')}
                            </div>
                          </div>
                        ))}
                        {receivedGiftsData.gifts && receivedGiftsData.gifts.length > 6 && (
                          <div style={{
                            background: 'rgba(220, 53, 34, 0.1)',
                            border: '2px dashed #dc3522',
                            borderRadius: '12px',
                            padding: '15px',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }} onClick={() => setActiveTab('gifts')}>
                            <div style={{ color: '#dc3522', fontSize: '14px', fontWeight: '600' }}>
                              +{receivedGiftsData.gifts.length - 6} еще
                            </div>
                          </div>
                        )}
                      </div>
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
                {profile?.images && Array.isArray(profile.images) && profile.images.map((image, index) => (
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
              {profile?.images && Array.isArray(profile.images) && profile.images.length > 0 && (
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

          {activeTab === 'gifts' && (
            <div>
              <h3 style={{ marginBottom: '20px', color: '#2d3748' }}>
                🎁 Подарки
              </h3>
              
                                {receivedGiftsData.gifts && receivedGiftsData.gifts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#718096' }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>🎁</div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>
                    {isOwnProfile ? 'Вы пока не получили подарков' : 'Пользователь пока не получил подарков'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    {isOwnProfile 
                      ? 'Подарки появятся здесь, когда кто-то отправит их вам'
                      : 'Подарки появятся здесь, когда кто-то отправит их пользователю'
                    }
                  </p>
                </div>
              ) : (
                <>
                  {/* Статистика подарков */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)',
                    border: '2px solid #fed7d7',
                    borderRadius: '15px',
                    padding: '20px',
                    marginBottom: '25px',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#dc3522' }}>
                      📊 Статистика подарков
                    </h4>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                      gap: '15px'
                    }}>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3522' }}>
                          {receivedGiftsData.gifts ? receivedGiftsData.gifts.length : 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#4a5568' }}>Всего получено</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3522' }}>
                          {receivedGiftsData.gifts ? receivedGiftsData.gifts.filter(g => g.message).length : 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#4a5568' }}>С сообщениями</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3522' }}>
                          {receivedGiftsData.gifts ? new Set(receivedGiftsData.gifts.map(g => g.from_user)).size : 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#4a5568' }}>Отправителей</div>
                      </div>
                    </div>
                  </div>

                  {/* Список подарков */}
                  <Grid $columns="repeat(auto-fill, minmax(280px, 1fr))" $gap="20px">
                    {receivedGiftsData.gifts && receivedGiftsData.gifts.map((gift, index) => (
                      <GiftCard key={index}>
                        <GiftEmoji>{GIFT_CONFIG[gift.gift_type]?.emoji || '🎁'}</GiftEmoji>
                        <GiftSender onClick={() => handleGiftSenderClick(gift.from_user)}>
                          {gift.from_user}
                        </GiftSender>
                        <GiftMessage>{gift.message || 'Нет сообщения'}</GiftMessage>
                        <p style={{ margin: '0 0 10px 0', color: '#4a5568', fontSize: '14px' }}>
                          Тип: {GIFT_CONFIG[gift.gift_type]?.name || 'Неизвестный подарок'}
                        </p>
                        <p style={{ margin: '0 0 10px 0', color: '#4a5568', fontSize: '14px' }}>
                          Дата: {new Date(gift.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </GiftCard>
                    ))}
                  </Grid>
                </>
              )}
            </div>
          )}

          {activeTab === 'settings' && isOwnProfile && (
            <div>
              <InfoSection>
                <h3>Настройки профиля</h3>
                
                <Form>
                  <FormGroup>
                    <Label>Приватность</Label>
                    
                    <Checkbox
                      label="Анонимные посещения профилей"
                      checked={privacySettings?.privacy?.anonymous_visits || false}
                      onChange={(e) => updatePrivacySetting('privacy', 'anonymous_visits', e.target.checked)}
                    />
                    
                    <Checkbox
                      label="Показывать статус онлайн"
                      checked={privacySettings?.privacy?.show_online_status !== false}
                      onChange={(e) => updatePrivacySetting('privacy', 'show_online_status', e.target.checked)}
                    />
                    
                    <Checkbox
                      label="Показывать время последнего посещения"
                      checked={privacySettings?.privacy?.show_last_seen !== false}
                      onChange={(e) => updatePrivacySetting('privacy', 'show_last_seen', e.target.checked)}
                    />
                    
                    <Checkbox
                      label="Разрешить сообщения от всех"
                      checked={privacySettings?.privacy?.allow_messages !== false}
                      onChange={(e) => updatePrivacySetting('privacy', 'allow_messages', e.target.checked)}
                    />
                    
                    <Checkbox
                      label="Разрешить подарки от всех"
                      checked={privacySettings?.privacy?.allow_gifts !== false}
                      onChange={(e) => updatePrivacySetting('privacy', 'allow_gifts', e.target.checked)}
                    />
                    
                    <Checkbox
                      label="Разрешить оценки профиля"
                      checked={privacySettings?.privacy?.allow_ratings !== false}
                      onChange={(e) => updatePrivacySetting('privacy', 'allow_ratings', e.target.checked)}
                    />
                    
                    <Checkbox
                      label="Разрешить комментарии"
                      checked={privacySettings?.privacy?.allow_comments !== false}
                      onChange={(e) => updatePrivacySetting('privacy', 'allow_comments', e.target.checked)}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>Уведомления</Label>
                    
                    <Checkbox
                      label="Новые мэтчи"
                      checked={privacySettings?.notifications?.new_matches !== false}
                      onChange={(e) => updatePrivacySetting('notifications', 'new_matches', e.target.checked)}
                    />
                    
                    <Checkbox
                      label="Сообщения"
                      checked={privacySettings?.notifications?.messages !== false}
                      onChange={(e) => updatePrivacySetting('notifications', 'messages', e.target.checked)}
                    />
                    
                    <Checkbox
                      label="Лайки"
                      checked={privacySettings?.notifications?.likes !== false}
                      onChange={(e) => updatePrivacySetting('notifications', 'likes', e.target.checked)}
                    />
                    
                    <Checkbox
                      label="Подарки"
                      checked={privacySettings?.notifications?.gifts !== false}
                      onChange={(e) => updatePrivacySetting('notifications', 'gifts', e.target.checked)}
                    />
                    
                    <Checkbox
                      label="Посещения профиля"
                      checked={privacySettings?.notifications?.profile_visits !== false}
                      onChange={(e) => updatePrivacySetting('notifications', 'profile_visits', e.target.checked)}
                    />
                  </FormGroup>
                  
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '20px 0', 
                    color: '#4a5568',
                    fontSize: '14px',
                    fontStyle: 'italic'
                  }}>
                    Настройки сохраняются автоматически при изменении
                  </div>
                </Form>
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

      {/* Модальное окно кропа аватарки */}
      {showAvatarCropper && (
        <AvatarCropper
          isOpen={showAvatarCropper}
          onClose={() => setShowAvatarCropper(false)}
          imageFile={avatarFileToCrop}
          onCrop={handleAvatarCrop}
          aspectRatio={1}
          minSize={100}
        />
      )}
    </ProfileContainer>
  );
};

export default Profile;