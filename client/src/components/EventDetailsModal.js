import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Modal, ModalContent, ModalHeader, Button, CloseIcon } from './UI/index.js';
import { clubApi } from '../services/clubApi';

const EventContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 80vh;
  overflow-y: auto;
`;

const EventHeader = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const EventAvatar = styled.div`
  width: 200px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 768px) {
    width: 100%;
    height: 120px;
  }
`;

const EventInfo = styled.div`
  flex: 1;
`;

const EventTitle = styled.h2`
  margin: 0 0 10px 0;
  color: #2d3748;
  font-size: 24px;
  font-weight: 700;
`;

const EventMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: #4a5568;
  font-size: 14px;

  .icon {
    color: #667eea;
  }
`;

const EventDescription = styled.div`
  color: #4a5568;
  line-height: 1.6;
  margin-bottom: 20px;
`;

const ImagesSection = styled.div`
  margin-top: 20px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 15px 0;
  color: #2d3748;
  font-size: 18px;
  font-weight: 600;
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
`;

const ImageItem = styled.div`
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 12px;
  overflow: hidden;
  background: #e2e8f0;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.02);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ParticipantsSection = styled.div`
  margin-top: 20px;
`;

const ParticipantsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const ParticipantItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f7fafc;
  border-radius: 20px;
  font-size: 14px;
  color: #4a5568;
`;

const ParticipantAvatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  background: #e2e8f0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #667eea;
  font-size: 18px;
`;

const EventDetailsModal = ({ isOpen, onClose, eventId }) => {
  console.log('EventDetailsModal render:', { isOpen, eventId });
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('EventDetailsModal useEffect:', { isOpen, eventId });
    if (isOpen && eventId) {
      loadEventDetails();
    }
  }, [isOpen, eventId]);

  const loadEventDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await clubApi.getEvent(eventId);
      setEvent(response.event);
    } catch (error) {
      console.error('Error loading event details:', error);
      setError('Ошибка при загрузке деталей мероприятия');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  if (!isOpen) return null;

  return (
    <Modal>
      <ModalContent $maxWidth="800px">
        <ModalHeader>
          <h2>Детали мероприятия</h2>
          <Button $variant="secondary" onClick={onClose}>
            <CloseIcon />
          </Button>
        </ModalHeader>
        
        <EventContent>
          {loading && <LoadingSpinner>Загрузка...</LoadingSpinner>}
          
          {error && (
            <div style={{ color: '#e53e3e', textAlign: 'center', padding: '20px' }}>
              {error}
            </div>
          )}
          
          {event && (
            <>
              <EventHeader>
                <EventAvatar>
                  {event.avatar ? (
                    <img 
                      src={`/uploads/${event.avatar}`} 
                      alt={event.title}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : null}
                </EventAvatar>
                
                <EventInfo>
                  <EventTitle>{event.title}</EventTitle>
                  
                  <EventMeta>
                    <MetaItem>
                      <span className="icon">📅</span>
                      <span>{formatDate(event.date)}</span>
                    </MetaItem>
                    
                    {event.time && (
                      <MetaItem>
                        <span className="icon">🕐</span>
                        <span>{formatTime(event.time)}</span>
                      </MetaItem>
                    )}
                    
                    {event.location && (
                      <MetaItem>
                        <span className="icon">📍</span>
                        <span>{event.location}</span>
                      </MetaItem>
                    )}
                    
                    {event.price > 0 && (
                      <MetaItem>
                        <span className="icon">💰</span>
                        <span>{event.price} ₽</span>
                      </MetaItem>
                    )}
                    
                    {event.max_participants && (
                      <MetaItem>
                        <span className="icon">👥</span>
                        <span>{event.current_participants || 0}/{event.max_participants}</span>
                      </MetaItem>
                    )}
                  </EventMeta>
                  
                  {event.description && (
                    <EventDescription>{event.description}</EventDescription>
                  )}
                </EventInfo>
              </EventHeader>

              {/* Галерея изображений */}
              {event.images && event.images.length > 0 && (
                <ImagesSection>
                  <SectionTitle>Фотографии ({event.images.length})</SectionTitle>
                  <ImageGrid>
                    {event.images.map((image, index) => (
                      <ImageItem key={index}>
                        <img 
                          src={`/uploads/${image}`} 
                          alt={`Event photo ${index + 1}`}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </ImageItem>
                    ))}
                  </ImageGrid>
                </ImagesSection>
              )}

              {/* Участники */}
              {event.participants && event.participants.length > 0 && (
                <ParticipantsSection>
                  <SectionTitle>Участники ({event.participants.length})</SectionTitle>
                  <ParticipantsList>
                    {event.participants.map((participant, index) => (
                      <ParticipantItem key={index}>
                        <ParticipantAvatar>
                          {participant.user?.ava ? (
                            <img 
                              src={`/uploads/${participant.user.ava}`} 
                              alt={participant.user.name || participant.user.login}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : null}
                        </ParticipantAvatar>
                        <span>{participant.user?.name || participant.user?.login}</span>
                        <span style={{ 
                          color: participant.status === 'confirmed' ? '#38a169' : '#ed8936',
                          fontSize: '12px'
                        }}>
                          {participant.status === 'confirmed' ? '✓' : '?'}
                        </span>
                      </ParticipantItem>
                    ))}
                  </ParticipantsList>
                </ParticipantsSection>
              )}
            </>
          )}
        </EventContent>
      </ModalContent>
    </Modal>
  );
};

export default EventDetailsModal;
