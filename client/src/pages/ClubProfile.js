import React, { useState, useRef, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { clubsAPI, chatAPI, apiUtils } from '../services/api';
import {
  PageContainer,
  ContentCard,
  Button,
  IconButton,
  LoadingSpinner,
  Grid,
  Card,
  Modal,
  ModalContent,
  ModalHeader,
  CloseIcon,
  HeartIcon,
  SendIcon,
  CrownIcon,
  StarIcon
} from '../components/UI';

// Дополнительные иконки
const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const TagIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

// Стили
const ClubProfileContainer = styled(PageContainer)`
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const ClubHeader = styled.div`
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    border-radius: 20px 20px 0 0;
  }
`;

const ClubAvatar = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: ${props => props.$avatarUrl ? `url(${props.$avatarUrl})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  background-size: cover;
  background-position: center;
  border: 4px solid white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 2;
  
  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
    margin-bottom: 15px;
  }
`;

const ClubName = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 2;
  position: relative;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const ClubType = styled.div`
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 20px;
  z-index: 2;
  position: relative;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const ClubInfo = styled.div`
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 20px;
  z-index: 2;
  position: relative;
  
  @media (max-width: 768px) {
    gap: 20px;
    flex-wrap: wrap;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  opacity: 0.9;
  
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const ClubDescription = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 15px;
  margin: 20px 0;
  backdrop-filter: blur(10px);
  z-index: 2;
  position: relative;
  
  @media (max-width: 768px) {
    padding: 15px;
    margin: 15px 0;
  }
`;

const DescriptionText = styled.p`
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const ClubDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const DetailCard = styled(Card)`
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
`;

const DetailTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 15px 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DetailContent = styled.div`
  color: #4a5568;
  line-height: 1.6;
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ContactLabel = styled.span`
  font-weight: 600;
  color: #2d3748;
  min-width: 80px;
`;

const ContactValue = styled.span`
  color: #4a5568;
  word-break: break-all;
`;

const SocialLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
`;

const SocialLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 20px;
  font-size: 14px;
  transition: all 0.3s ease;
  
  &:hover {
    background: #5a67d8;
    transform: translateY(-2px);
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;

const Tag = styled.span`
  background: #e2e8f0;
  color: #4a5568;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 500;
`;

const OwnerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  margin-top: 15px;
`;

const OwnerAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${props => props.$avatarUrl ? `url(${props.$avatarUrl})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  background-size: cover;
  background-position: center;
  border: 2px solid white;
`;

const OwnerDetails = styled.div`
  flex: 1;
`;

const OwnerName = styled.div`
  font-weight: 600;
  color: white;
  margin-bottom: 5px;
`;

const OwnerStatus = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
`;

const VerificationBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #48bb78;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 10px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin: 20px 0;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;


const ClubContent = styled.div`
  padding: 30px 40px;
  background: white;
  border-radius: 0 0 25px 25px;
  min-height: 400px;
  
  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 0 0 20px 20px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const EventCard = styled(Card)`
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const EventTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 10px 0;
`;

const EventDate = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #718096;
  font-size: 14px;
  margin-bottom: 10px;
`;

const EventLocation = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #718096;
  font-size: 14px;
  margin-bottom: 15px;
`;

const EventDescriptionText = styled.p`
  color: #4a5568;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 15px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const EventActions = styled.div`
  display: flex;
  gap: 10px;
`;

// Новые стили для улучшенных карточек мероприятий

const EventContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const EventParticipants = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
`;

const EventPrice = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #d69e2e;
  font-size: 14px;
  font-weight: 600;
`;

const EventType = styled.div`
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  align-self: flex-start;
`;

// Стили для заголовка мероприятия с изображением (как в разделе "Клубы")
const EventHeader = styled.div`
  height: 180px;
  background: ${props => props.$avatarUrl ? `url(${props.$avatarUrl})` : 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)'};
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  padding: 20px;
  color: white;
  border-radius: 20px 20px 0 0;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%);
    border-radius: 20px 20px 0 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 20px;
    background: white;
    border-radius: 20px 20px 0 0;
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
`;

const EventHeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  justify-content: flex-end;
`;

const EventClub = styled.div`
  font-size: 14px;
  opacity: 0.9;
  font-weight: 500;
`;

// Стили для улучшенного модального окна мероприятия
const EventModalContent = styled(ModalContent)`
  max-width: 800px;
  width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0;
`;

const EventModalImage = styled.div`
  width: 100%;
  height: 300px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const EventModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  background: white;
`;

const EventModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  flex: 1;
`;

const EventModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
`;

const EventInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const EventInfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  svg {
    color: #667eea;
    margin-top: 2px;
    flex-shrink: 0;
  }
`;

const EventInfoLabel = styled.div`
  font-size: 12px;
  color: #718096;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const EventInfoValue = styled.div`
  font-size: 16px;
  color: #2d3748;
  font-weight: 600;
  line-height: 1.4;
`;

const EventDescription = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const EventDescriptionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 12px 0;
`;

const EventModalDescriptionText = styled.p`
  font-size: 16px;
  color: #4a5568;
  line-height: 1.6;
  margin: 0;
  white-space: pre-line;
`;

const EventImages = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const EventImagesTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 16px 0;
`;

const EventImagesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
`;

const EventImageItem = styled.div`
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const EventModalFooter = styled.div`
  display: flex;
  gap: 12px;
  padding: 20px;
  background: white;
  border-top: 1px solid #e2e8f0;
  justify-content: flex-end;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #718096;
  
  .icon {
    font-size: 64px;
    margin-bottom: 20px;
    opacity: 0.5;
  }
  
  h3 {
    font-size: 20px;
    color: #2d3748;
    margin: 0 0 10px 0;
  }
  
  p {
    margin: 0;
    font-size: 16px;
  }
`;

const ClubProfile = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Получение информации о клубе
  const { data: clubData, isLoading: isLoadingClub, error: clubError } = useQuery(
    ['club', clubId],
    () => clubsAPI.getClub(clubId),
    {
      enabled: !!clubId,
      onError: (error) => {
        console.error('Ошибка при получении информации о клубе:', error);
        toast.error('Не удалось загрузить информацию о клубе');
      }
    }
  );

  // Получение мероприятий клуба
  const { data: eventsData, isLoading: isLoadingEvents } = useQuery(
    ['club-events', clubId],
    () => clubsAPI.getClubEvents(clubId),
    {
      enabled: !!clubId,
      onError: (error) => {
        console.error('Ошибка при получении мероприятий клуба:', error);
        toast.error('Не удалось загрузить мероприятия клуба');
      }
    }
  );


  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleCloseEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  // Мутация для записи на мероприятие
  const joinEventMutation = useMutation(
    (eventId) => clubsAPI.joinEvent(eventId),
    {
      onSuccess: () => {
        toast.success('Вы успешно записались на мероприятие!');
        queryClient.invalidateQueries(['club-events', clubId]);
        handleCloseEventModal();
      },
      onError: (error) => {
        console.error('Ошибка при записи на мероприятие:', error);
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  const handleJoinEvent = (eventId) => {
    joinEventMutation.mutate(eventId);
  };

  if (isLoadingClub) {
    return (
      <ClubProfileContainer>
        <LoadingSpinner />
      </ClubProfileContainer>
    );
  }

  if (clubError || !clubData) {
    return (
      <ClubProfileContainer>
        <EmptyState>
          <div className="icon">❌</div>
          <h3>Клуб не найден</h3>
          <p>Возможно, клуб был удален или у вас нет доступа к нему</p>
        </EmptyState>
      </ClubProfileContainer>
    );
  }

  const club = clubData.club || clubData;
  const events = eventsData?.events || [];

  return (
    <ClubProfileContainer>
      <ClubHeader>
        <ClubAvatar $avatarUrl={club.avatar ? `/uploads/${club.avatar}` : null}>
          {!club.avatar && <CrownIcon />}
        </ClubAvatar>
        
        <ClubName>
          {club.name}
          {club.is_verified && (
            <VerificationBadge>
              <ShieldIcon />
              Проверен
            </VerificationBadge>
          )}
        </ClubName>
        <ClubType>{club.type}</ClubType>
        
        {club.description && (
          <ClubDescription>
            <DescriptionText>{club.description}</DescriptionText>
          </ClubDescription>
        )}
        
        <StatsGrid>
          <StatItem>
            <StatValue>{club.member_count || 0}</StatValue>
            <StatLabel>Участников</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{events.length}</StatValue>
            <StatLabel>Мероприятий</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{new Date(club.date_created).getFullYear()}</StatValue>
            <StatLabel>Год создания</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{club.type === 'nightclub' ? 'Ночной клуб' : 
                      club.type === 'restaurant' ? 'Ресторан' :
                      club.type === 'event_space' ? 'Площадка' :
                      club.type === 'swing' ? 'Свинг-клуб' :
                      club.type === 'bdsm' ? 'BDSM' :
                      club.type === 'fetish' ? 'Фетиш' :
                      club.type === 'lifestyle' ? 'Лайфстайл' : 'Другое'}</StatValue>
            <StatLabel>Тип клуба</StatLabel>
          </StatItem>
        </StatsGrid>
        
        <ClubInfo>
          <InfoItem>
            <LocationIcon />
            <span>{club.location}</span>
          </InfoItem>
          <InfoItem>
            <MapPinIcon />
            <span>{club.city}, {club.country}</span>
          </InfoItem>
        </ClubInfo>
        
      </ClubHeader>

      <ClubContent>
        {/* Информация о владельце */}
        {club.owner_info && (
          <DetailCard>
            <DetailTitle>
              <UserIcon />
              Владелец клуба
            </DetailTitle>
            <OwnerInfo>
              <OwnerAvatar $avatarUrl={club.owner_info.avatar ? `/uploads/${club.owner_info.avatar}` : null}>
                {!club.owner_info.avatar && <UserIcon />}
              </OwnerAvatar>
              <OwnerDetails>
                <OwnerName>@{club.owner_info.login}</OwnerName>
                <OwnerStatus>{club.owner_info.status}</OwnerStatus>
              </OwnerDetails>
            </OwnerInfo>
          </DetailCard>
        )}

        {/* Детальная информация о клубе */}
        <ClubDetails>
          {/* Контактная информация */}
          <DetailCard>
            <DetailTitle>
              <MailIcon />
              Контакты
            </DetailTitle>
            <ContactInfo>
              {club.email && (
                <ContactItem>
                  <ContactLabel>Email:</ContactLabel>
                  <ContactValue>{club.email}</ContactValue>
                </ContactItem>
              )}
              {club.website && (
                <ContactItem>
                  <ContactLabel>Сайт:</ContactLabel>
                  <ContactValue>
                    <SocialLink href={club.website} target="_blank" rel="noopener noreferrer">
                      <GlobeIcon />
                      {club.website}
                    </SocialLink>
                  </ContactValue>
                </ContactItem>
              )}
              {club.contact_info && (
                <ContactItem>
                  <ContactLabel>Контакты:</ContactLabel>
                  <ContactValue>{club.contact_info}</ContactValue>
                </ContactItem>
              )}
            </ContactInfo>
          </DetailCard>

          {/* Адрес и местоположение */}
          <DetailCard>
            <DetailTitle>
              <MapPinIcon />
              Местоположение
            </DetailTitle>
            <DetailContent>
              <p><strong>Адрес:</strong> {club.address}</p>
              <p><strong>Город:</strong> {club.city}</p>
              <p><strong>Страна:</strong> {club.country}</p>
              {club.location && (
                <p><strong>Дополнительно:</strong> {club.location}</p>
              )}
            </DetailContent>
          </DetailCard>

          {/* Социальные сети и ссылки */}
          {club.links && (
            <DetailCard>
              <DetailTitle>
                <GlobeIcon />
                Ссылки
              </DetailTitle>
              <DetailContent>
                <SocialLinks>
                  {club.links.split(',').map((link, index) => {
                    const trimmedLink = link.trim();
                    if (!trimmedLink) return null;
                    
                    let icon = <GlobeIcon />;
                    let displayText = trimmedLink;
                    
                    if (trimmedLink.includes('instagram.com')) {
                      icon = <span>📷</span>;
                      displayText = 'Instagram';
                    } else if (trimmedLink.includes('facebook.com')) {
                      icon = <span>📘</span>;
                      displayText = 'Facebook';
                    } else if (trimmedLink.includes('vk.com')) {
                      icon = <span>🔵</span>;
                      displayText = 'VKontakte';
                    } else if (trimmedLink.includes('telegram.me') || trimmedLink.includes('t.me')) {
                      icon = <span>✈️</span>;
                      displayText = 'Telegram';
                    }
                    
                    return (
                      <SocialLink key={index} href={trimmedLink} target="_blank" rel="noopener noreferrer">
                        {icon}
                        {displayText}
                      </SocialLink>
                    );
                  })}
                </SocialLinks>
              </DetailContent>
            </DetailCard>
          )}

          {/* Теги */}
          {club.tags && club.tags.length > 0 && (
            <DetailCard>
              <DetailTitle>
                <TagIcon />
                Теги
              </DetailTitle>
              <DetailContent>
                <TagsContainer>
                  {club.tags.map((tag, index) => (
                    <Tag key={index}>{tag}</Tag>
                  ))}
                </TagsContainer>
              </DetailContent>
            </DetailCard>
          )}

          {/* Правила клуба */}
          {club.rules && (
            <DetailCard>
              <DetailTitle>
                <ShieldIcon />
                Правила клуба
              </DetailTitle>
              <DetailContent>
                <div style={{ whiteSpace: 'pre-line' }}>{club.rules}</div>
              </DetailContent>
            </DetailCard>
          )}

          {/* Ограничения по возрасту */}
          {club.age_restriction && (
            <DetailCard>
              <DetailTitle>
                <ShieldIcon />
                Ограничения
              </DetailTitle>
              <DetailContent>
                <p><strong>Возрастные ограничения:</strong> {club.age_restriction}</p>
              </DetailContent>
            </DetailCard>
          )}
        </ClubDetails>

        <SectionTitle>
          <CalendarIcon />
          Мероприятия клуба
        </SectionTitle>

        {isLoadingEvents ? (
          <LoadingSpinner />
        ) : events.length > 0 ? (
          <EventsGrid>
            {events.map((event) => (
              <EventCard
                key={event.id}
                onClick={() => handleEventClick(event)}
              >
                {/* Заголовок с изображением как в разделе "Клубы" */}
                <EventHeader $avatarUrl={event.avatar ? `/uploads/${event.avatar}` : null}>
                  <EventHeaderContent>
                    <EventTitle>{event.title}</EventTitle>
                    <EventClub>Клуб</EventClub>
                    <EventDate>
                      {new Date(event.date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </EventDate>
                  </EventHeaderContent>
                </EventHeader>
                
                <EventContent>
                  <EventLocation>
                    <LocationIcon />
                    {event.location}
                  </EventLocation>
                  
                  {/* Участники */}
                  <EventParticipants>
                    <UsersIcon />
                    {event.current_participants || 0}
                    {event.max_participants && ` / ${event.max_participants}`}
                  </EventParticipants>
                  
                  {/* Цена */}
                  {event.price && (
                    <EventPrice>
                      <CrownIcon />
                      {event.price} ₽
                    </EventPrice>
                  )}
                  
                  {/* Тип мероприятия */}
                  {event.event_type && (
                    <EventType>
                      {event.event_type}
                    </EventType>
                  )}
                  
                  <EventDescriptionText>{event.description}</EventDescriptionText>
                  
                  <EventActions>
                    <Button $size="small" $variant="primary">
                      Подробнее
                    </Button>
                  </EventActions>
                </EventContent>
              </EventCard>
            ))}
          </EventsGrid>
        ) : (
          <EmptyState>
            <div className="icon">📅</div>
            <h3>Пока нет мероприятий</h3>
            <p>Клуб еще не создал ни одного мероприятия</p>
          </EmptyState>
        )}
      </ClubContent>

      {/* Модальное окно с деталями мероприятия */}
      <AnimatePresence>
        {showEventModal && selectedEvent && (
          <Modal onClick={handleCloseEventModal}>
            <EventModalContent onClick={(e) => e.stopPropagation()}>
              {/* Изображение мероприятия */}
              {selectedEvent.avatar && (
                <EventModalImage>
                  <img 
                    src={`/uploads/${selectedEvent.avatar}`} 
                    alt={selectedEvent.title}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </EventModalImage>
              )}
              
              <EventModalHeader>
                <EventModalTitle>{selectedEvent.title}</EventModalTitle>
                <IconButton onClick={handleCloseEventModal}>
                  <CloseIcon />
                </IconButton>
              </EventModalHeader>
              
              <EventModalBody>
                {/* Информация о мероприятии */}
                <EventInfoGrid>
                  <EventInfoItem>
                    <CalendarIcon />
                    <div>
                      <EventInfoLabel>Дата и время</EventInfoLabel>
                      <EventInfoValue>
                        {new Date(selectedEvent.date).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </EventInfoValue>
                    </div>
                  </EventInfoItem>
                  
                  <EventInfoItem>
                    <LocationIcon />
                    <div>
                      <EventInfoLabel>Место проведения</EventInfoLabel>
                      <EventInfoValue>{selectedEvent.location}</EventInfoValue>
                    </div>
                  </EventInfoItem>
                  
                  <EventInfoItem>
                    <UsersIcon />
                    <div>
                      <EventInfoLabel>Участники</EventInfoLabel>
                      <EventInfoValue>
                        {selectedEvent.current_participants || 0}
                        {selectedEvent.max_participants && ` / ${selectedEvent.max_participants}`}
                      </EventInfoValue>
                    </div>
                  </EventInfoItem>
                  
                  {selectedEvent.price && (
                    <EventInfoItem>
                      <CrownIcon />
                      <div>
                        <EventInfoLabel>Стоимость</EventInfoLabel>
                        <EventInfoValue>{selectedEvent.price} ₽</EventInfoValue>
                      </div>
                    </EventInfoItem>
                  )}
                  
                  {selectedEvent.event_type && (
                    <EventInfoItem>
                      <StarIcon />
                      <div>
                        <EventInfoLabel>Тип мероприятия</EventInfoLabel>
                        <EventInfoValue>{selectedEvent.event_type}</EventInfoValue>
                      </div>
                    </EventInfoItem>
                  )}
                </EventInfoGrid>
                
                {/* Описание */}
                <EventDescription>
                  <EventDescriptionTitle>Описание</EventDescriptionTitle>
                  <EventModalDescriptionText>{selectedEvent.description}</EventModalDescriptionText>
                </EventDescription>
                
                {/* Дополнительные изображения */}
                {selectedEvent.images && selectedEvent.images.length > 0 && (
                  <EventImages>
                    <EventImagesTitle>Фотографии мероприятия</EventImagesTitle>
                    <EventImagesGrid>
                      {selectedEvent.images.map((image, index) => (
                        <EventImageItem key={index}>
                          <img 
                            src={`/uploads/${image}`} 
                            alt={`${selectedEvent.title} - фото ${index + 1}`}
                            onClick={() => {
                              setSelectedImage(`/uploads/${image}`);
                              setShowImageModal(true);
                            }}
                          />
                        </EventImageItem>
                      ))}
                    </EventImagesGrid>
                  </EventImages>
                )}
              </EventModalBody>
              
              <EventModalFooter>
                <Button 
                  $variant="primary" 
                  onClick={() => handleJoinEvent(selectedEvent.id)}
                  disabled={joinEventMutation.isLoading}
                  $size="large"
                >
                  {joinEventMutation.isLoading ? 'Записываемся...' : 'Записаться на мероприятие'}
                </Button>
                <Button $variant="secondary" onClick={handleCloseEventModal}>
                  Закрыть
                </Button>
              </EventModalFooter>
            </EventModalContent>
          </Modal>
        )}
      </AnimatePresence>
    </ClubProfileContainer>
  );
};

export default ClubProfile;
