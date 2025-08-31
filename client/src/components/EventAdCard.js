import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { eventsAPI } from '../services/api';

const EventCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    border-color: #dc3522;
  }
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const EventHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
`;

const EventBadge = styled.span`
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const EventPrice = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #dc3522;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &.free {
    color: #10b981;
  }
`;

const EventTitle = styled.h3`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
  line-height: 1.3;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const EventDescription = styled.p`
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 20px 0;
  font-size: 16px;
`;

const EventDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4b5563;
  font-size: 14px;
  
  .icon {
    font-size: 18px;
    color: #dc3522;
  }
  
  .label {
    font-weight: 500;
  }
  
  .value {
    color: #1f2937;
    font-weight: 600;
  }
`;

const EventTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
`;

const Tag = styled.span`
  background: #f3f4f6;
  color: #6b7280;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
`;

const JoinButton = styled.button`
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(220, 53, 34, 0.3);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    padding: 12px 24px;
    font-size: 14px;
  }
`;

const ClubInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 20px;
`;

const ClubAvatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
`;

const ClubDetails = styled.div`
  flex: 1;
`;

const ClubName = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
`;

const ClubVerified = styled.span`
  background: #10b981;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  margin-left: 8px;
`;

const ClubStatus = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const EventAdCard = ({ ad, event, onJoinSuccess }) => {
  const [isJoining, setIsJoining] = useState(false);
  const queryClient = useQueryClient();
  
  const joinEventMutation = useMutation(
    () => eventsAPI.joinEvent(event.id),
    {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries(['ads']);
        queryClient.invalidateQueries(['events']);
        queryClient.invalidateQueries(['my-events']);
        if (onJoinSuccess) {
          onJoinSuccess(data);
        }
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Ошибка при регистрации на мероприятие';
        toast.error(message);
      },
      onSettled: () => {
        setIsJoining(false);
      }
    }
  );
  
  const handleJoin = async () => {
    if (isJoining) return;
    
    setIsJoining(true);
    try {
      await joinEventMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to join event:', error);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatPrice = (price) => {
    if (price === 0 || !price) return 'Бесплатно';
    return `${price} 🦊`;
  };
  
  const isEventFull = event.max_participants && event.current_participants >= event.max_participants;
  const canJoin = event.can_join && !isEventFull;
  
  return (
    <EventCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <EventHeader>
        <EventBadge>🎪 Мероприятие</EventBadge>
        <EventPrice className={event.price === 0 ? 'free' : ''}>
          {formatPrice(event.price)}
        </EventPrice>
      </EventHeader>
      
      <EventTitle>{ad.title}</EventTitle>
      <EventDescription>{ad.description}</EventDescription>
      
      {event.club && (
        <ClubInfo>
          <ClubAvatar 
            src={event.club.avatar ? `/uploads/${event.club.avatar}` : '/img/no_photo.jpg'} 
            alt={event.club.name}
          />
          <ClubDetails>
            <ClubName>
              {event.club.name}
              {event.club.is_verified && <ClubVerified>✓ Верифицирован</ClubVerified>}
            </ClubName>
            <ClubStatus>Организатор мероприятия</ClubStatus>
          </ClubDetails>
        </ClubInfo>
      )}
      
      <EventDetails>
        <DetailItem>
          <span className="icon">📅</span>
          <span className="label">Дата:</span>
          <span className="value">{formatDate(event.event_date)}</span>
        </DetailItem>
        
        <DetailItem>
          <span className="icon">📍</span>
          <span className="label">Место:</span>
          <span className="value">{event.location}</span>
        </DetailItem>
        
        <DetailItem>
          <span className="icon">👥</span>
          <span className="label">Участники:</span>
          <span className="value">
            {event.current_participants}/{event.max_participants || '∞'}
          </span>
        </DetailItem>
        
        {event.requirements && (
          <DetailItem>
            <span className="icon">📋</span>
            <span className="label">Требования:</span>
            <span className="value">{event.requirements}</span>
          </DetailItem>
        )}
        
        {event.dress_code && (
          <DetailItem>
            <span className="icon">👔</span>
            <span className="label">Дресс-код:</span>
            <span className="value">{event.dress_code}</span>
          </DetailItem>
        )}
      </EventDetails>
      
      {event.tags && event.tags.length > 0 && (
        <EventTags>
          {event.tags.map((tag, index) => (
            <Tag key={index}>{tag}</Tag>
          ))}
        </EventTags>
      )}
      
      {canJoin ? (
        <JoinButton 
          onClick={handleJoin}
          disabled={isJoining}
        >
          {isJoining ? 'Регистрируюсь...' : 'Зарегистрироваться на мероприятие'}
        </JoinButton>
      ) : (
        <JoinButton disabled>
          {isEventFull ? 'Мероприятие переполнено' : 'Регистрация недоступна'}
        </JoinButton>
      )}
      
      {event.contact_info && (
        <div style={{ marginTop: '16px', padding: '12px', background: '#f3f4f6', borderRadius: '8px' }}>
          <strong>Контактная информация:</strong> {event.contact_info}
        </div>
      )}
    </EventCard>
  );
};

export default EventAdCard;
