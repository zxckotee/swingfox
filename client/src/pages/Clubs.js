import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { clubsAPI, apiUtils, chatAPI } from '../services/api';
import {
  PageContainer,
  ContentCard,
  SectionTitle,
  Button,
  IconButton,
  FlexContainer,
  Grid,
  LoadingSpinner,
  Modal,
  ModalContent,
  ModalHeader,
  Form,
  FormGroup,
  Label,
  Input,
  TextArea,
  Select,
  Avatar,
  UsersIcon,
  PlusIcon,
  CloseIcon,
  SearchIcon,
  FilterIcon,
  CheckIcon,
  EditIcon
} from '../components/UI';

const ClubsContainer = styled(PageContainer)`
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const TabsContainer = styled.div`
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 4px;
  }
`;

const Tab = styled.button`
  flex: 1;
  padding: 15px 20px;
  border: none;
  background: ${props => props.$active ? 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#4a5568'};
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover:not(:disabled) {
    background: ${props => props.$active ? 
      'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)' : 
      'linear-gradient(135deg, rgba(220, 53, 34, 0.1) 0%, rgba(255, 107, 88, 0.1) 100%)'
    };
    color: ${props => props.$active ? 'white' : '#dc3522'};
  }
  
  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 14px;
  }
`;

const FiltersContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const FilterRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 15px;
  align-items: end;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const SearchInput = styled.div`
  position: relative;
  
  input {
    width: 100%;
    padding: 12px 16px 12px 45px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 15px;
    transition: all 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: #dc3522;
      box-shadow: 0 0 0 3px rgba(220, 53, 34, 0.1);
    }
  }
  
  .search-icon {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #718096;
  }
`;

const ClubCard = styled(motion.div)`
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
  }
`;

const ClubHeader = styled.div`
  height: 160px;
  background: ${props => props.$avatarUrl ? `url(${props.$avatarUrl})` : 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)'};
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  padding: 20px;
  color: white;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.$avatarUrl ? 'rgba(0, 0, 0, 0.4)' : 'transparent'};
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

const ClubContent = styled.div`
  padding: 20px;
`;

const ClubTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const ClubDescription = styled.p`
  margin: 0 0 15px 0;
  color: #4a5568;
  font-size: 14px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ClubMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
`;

const ClubStats = styled.div`
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #718096;
  
  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const ClubType = styled.span`
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  
  ${props => props.$isPrivate ? `
    background: #fed7d7;
    color: #c53030;
  ` : `
    background: #c6f6d5;
    color: #276749;
  `}
`;

const ClubActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
`;

const LearnMoreButton = styled(Button)`
  flex: 1;
  font-size: 14px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
`;

const MyClubCard = styled(ClubCard)`
  border: 2px solid #dc3522;
  
  ${ClubHeader} {
    background: linear-gradient(135deg, #38a169 0%, #48bb78 100%);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #718096;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px; /* Добавляем как в других компонентах */
  
  .icon {
    font-size: 72px; /* Увеличиваем с 64px до 72px */
    margin-bottom: 54px; /* Увеличиваем с 20px до 54px для поднятия эмодзи на 30px */
    opacity: 0.7; /* Увеличиваем с 0.5 до 0.7 */
    line-height: 1;
    display: block;
    text-align: center;
    width: 100%;
    transform: translateX(-2px); /* Компенсация для визуального центра эмодзи */
  }
  
  h3 {
    margin: 0 0 16px 0; /* Увеличиваем с 10px до 16px */
    font-size: 28px; /* Увеличиваем с 20px до 28px */
    color: #2d3748;
    font-weight: 700; /* Добавляем font-weight */
    line-height: 1.2;
    text-align: center;
    width: 100%;
  }
  
  p {
    margin: 0 0 20px 0;
    font-size: 16px;
    line-height: 1.6;
    max-width: 320px;
    margin-left: auto;
    margin-right: auto;
  }
  
  @media (max-width: 768px) {
    min-height: 300px;
    padding: 40px 20px;
    
    .icon {
      font-size: 56px;
      margin-bottom: 50px;
      transform: translateX(-1px);
    }
    
    h3 {
      font-size: 24px;
      margin-bottom: 14px;
    }
    
    p {
      font-size: 15px;
      max-width: 280px;
    }
  }
  
  @media (max-width: 480px) {
    min-height: 250px;
    padding: 30px 16px;
    
    .icon {
      font-size: 48px;
      margin-bottom: 48px;
      transform: translateX(-1px);
    }
    
    h3 {
      font-size: 22px;
      margin-bottom: 12px;
    }
    
    p {
      font-size: 14px;
      max-width: 260px;
    }
  }
`;

const ApplicationCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #d69e2e;
  margin-bottom: 15px;
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
  }
  
  .applicant {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .name {
      font-weight: 600;
      color: #2d3748;
    }
    
    .date {
      font-size: 12px;
      color: #718096;
    }
  }
  
  .message {
    margin: 10px 0;
    color: #4a5568;
    font-size: 14px;
    font-style: italic;
  }
  
  .actions {
    display: flex;
    gap: 10px;
  }
`;

// Стили для карточек мероприятий
const EventCard = styled(motion.div)`
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
    border-color: #dc3522;
  }
`;

const EventHeader = styled.div`
  height: 180px;
  background: ${props => props.$avatarUrl ? `url(${props.$avatarUrl})` : 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)'};
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  padding: 20px;
  color: white;
  
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

const EventTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: white;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const EventClub = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    transform: translateY(-1px);
  }
`;

const EventDate = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const EventContent = styled.div`
  padding: 24px;
`;

const EventDescription = styled.p`
  margin: 0 0 20px 0;
  color: #4a5568;
  font-size: 15px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const EventDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
`;

const EventDetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const EventDetailIcon = styled.span`
  font-size: 16px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
`;

const EventDetailText = styled.span`
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
`;

const EventAction = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 8px;
`;

const EventButton = styled(Button)`
  min-width: 140px;
  font-weight: 600;
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 14px;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(220, 53, 34, 0.3);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    min-width: 120px;
    padding: 10px 20px;
    font-size: 13px;
  }
`;

const EventActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
  }
`;

const MessageButton = styled(Button)`
  min-width: 120px;
  font-weight: 600;
  border-radius: 12px;
  padding: 12px 20px;
  font-size: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    min-width: 100px;
    padding: 10px 16px;
    font-size: 13px;
  }
`;

// Адаптивность для карточек мероприятий
const EventCardResponsive = styled(EventCard)`
  @media (max-width: 768px) {
    margin: 0 10px;
  }
`;

const EventHeaderResponsive = styled(EventHeader)`
  @media (max-width: 768px) {
    height: 160px;
    padding: 16px;
  }
`;

const EventContentResponsive = styled(EventContent)`
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const EventDetailsResponsive = styled(EventDetails)`
  @media (max-width: 768px) {
    padding: 12px;
    gap: 10px;
  }
`;

const EventDetailTextResponsive = styled(EventDetailText)`
  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const EventsGrid = styled(Grid)`
  @media (max-width: 768px) {
    grid-template-columns: 1fr !important;
    gap: 20px !important;
    padding: 0 10px;
  }
`;

const Clubs = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('clubs');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [showJoinEventModal, setShowJoinEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const queryClient = useQueryClient();


  // Queries
  const { data: clubsData, isLoading: isLoadingClubs } = useQuery(
    ['clubs', searchQuery, cityFilter, typeFilter],
    () => clubsAPI.getClubs({
      search: searchQuery,
      city: cityFilter,
      type: typeFilter
    }),
    {
      enabled: activeTab === 'clubs',
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  const { data: eventsData, isLoading: isLoadingEvents } = useQuery(
    ['events', searchQuery, cityFilter],
    () => clubsAPI.getEvents({
      search: searchQuery,
      city: cityFilter
    }),
    {
      enabled: activeTab === 'events',
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );




  const joinEventMutation = useMutation(
    (eventId) => clubsAPI.joinEvent(eventId),
    {
      onSuccess: () => {
        toast.success('Вы успешно записались на мероприятие!');
        queryClient.invalidateQueries(['events']);
      },
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );




  const handleClubClick = (club) => {
    setSelectedClub(club);
    setShowDetailsModal(true);
  };

  const handleEventClick = (event) => {
    setSelectedEventDetails(event);
    setShowEventDetailsModal(true);
  };


  const handleJoinEvent = (event) => {
    setSelectedEvent(event);
    setShowJoinEventModal(true);
  };

  const confirmJoinEvent = async () => {
    try {
      await joinEventMutation.mutateAsync(selectedEvent.id);
      toast.success('Вы успешно записались на мероприятие!');
      queryClient.invalidateQueries(['events']);
      setShowJoinEventModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Join event error:', error);
      toast.error(error.response?.data?.error || 'Ошибка при записи на мероприятие');
    }
  };

  // Функция для создания чата с клубом по мероприятию
  const handleMessageClub = async (event) => {
    try {
      if (!event.club?.id) {
        toast.error('Информация о клубе недоступна');
        return;
      }

      // Создаем чат с клубом по мероприятию
      const message = `Привет! У меня есть вопрос по поводу мероприятия "${event.title}"`;
      
      await chatAPI.createClubEventChat(event.club.id, event.id, message);
      
      toast.success('Сообщение отправлено клубу!');
      
      // Переходим в чат
      window.location.href = `/chat/club_${event.club.id}?event=${event.id}`;
      
    } catch (error) {
      console.error('Error creating club chat:', error);
      toast.error(error.response?.data?.message || 'Не удалось создать чат с клубом');
    }
  };

  const filteredClubs = clubsData?.clubs || [];
  const eventsList = eventsData?.events || [];

  return (
    <ClubsContainer>
      <ContentCard $maxWidth="1200px">
        <FlexContainer $justify="center" $align="center" $wrap>
          <SectionTitle>
            <UsersIcon />
            Клубы и мероприятия
          </SectionTitle>
        </FlexContainer>

        <TabsContainer>
          <Tab
            $active={activeTab === 'clubs'}
            onClick={() => setActiveTab('clubs')}
          >
            <UsersIcon />
            Клубы
          </Tab>
          <Tab
            $active={activeTab === 'events'}
            onClick={() => setActiveTab('events')}
          >
            <SearchIcon />
            Мероприятия
          </Tab>
        </TabsContainer>

        {/* Фильтры для просмотра клубов */}
        {activeTab === 'clubs' && (
          <FiltersContainer>
            <FilterRow>
              <SearchInput>
                <div className="search-icon">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Поиск клубов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </SearchInput>
              
              <Select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                style={{ minWidth: '150px' }}
              >
                <option value="">Все города</option>
                <option value="Москва">Москва</option>
                <option value="Санкт-Петербург">Санкт-Петербург</option>
                <option value="Екатеринбург">Екатеринбург</option>
                <option value="Новосибирск">Новосибирск</option>
              </Select>
              
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ minWidth: '120px' }}
              >
                <option value="">Все типы</option>
                <option value="public">Открытые</option>
                <option value="private">Приватные</option>
              </Select>
            </FilterRow>
          </FiltersContainer>
        )}

        {/* Фильтры для просмотра мероприятий */}
        {activeTab === 'events' && (
          <FiltersContainer>
            <FilterRow>
              <SearchInput>
                <div className="search-icon">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Поиск мероприятий..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </SearchInput>
              
              <Select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                style={{ minWidth: '150px' }}
              >
                <option value="">Все города</option>
                <option value="Москва">Москва</option>
                <option value="Санкт-Петербург">Санкт-Петербург</option>
                <option value="Екатеринбург">Екатеринбург</option>
                <option value="Новосибирск">Новосибирск</option>
              </Select>
            </FilterRow>
          </FiltersContainer>
        )}

        {/* Просмотр клубов */}
        {activeTab === 'clubs' && (
          <div>
            {isLoadingClubs ? (
              <LoadingSpinner />
            ) : filteredClubs.length > 0 ? (
              <Grid $columns="repeat(auto-fill, minmax(300px, 1fr))" $gap="25px">
                {filteredClubs.map((club) => (
                  <ClubCard
                    key={club.id}
                    onClick={() => handleClubClick(club)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ClubHeader $avatarUrl={club.avatar ? `/uploads/${club.avatar}` : null}>
                      <FlexContainer $justify="space-between" $align="flex-start">
                        <div>
                          <ClubTitle style={{ color: 'white', fontSize: '16px' }}>
                            {club.name}
                          </ClubTitle>
                          <div style={{ fontSize: '12px', opacity: '0.9' }}>
                            {club.city}
                          </div>
                        </div>
                        <ClubType $isPrivate={club.is_private}>
                          {club.is_private ? 'Приватный' : 'Открытый'}
                        </ClubType>
                      </FlexContainer>
                    </ClubHeader>
                    
                    <ClubContent>
                      <ClubDescription>
                        {club.description}
                      </ClubDescription>
                      
                      <ClubMeta>
                        <ClubStats>
                          <span style={{ fontSize: '12px', color: '#718096' }}>
                            📍 {club.city}
                          </span>
                          <span style={{ fontSize: '12px', color: '#718096' }}>
                            👥 {club.current_members || 0} участников
                          </span>
                          {club.membership_fee && (
                            <span style={{ fontSize: '12px', color: '#718096' }}>
                              💰 {club.membership_fee}₽
                            </span>
                          )}
                        </ClubStats>
                        <div style={{ fontSize: '12px', color: '#718096', marginTop: '8px' }}>
                          {club.is_private ? '🔒 Приватный клуб' : '🌐 Открытый клуб'}
                        </div>
                      </ClubMeta>
                      
                      <ClubActions>
                        <LearnMoreButton
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/club-profile/${club.id}`);
                          }}
                        >
                          Узнать больше
                        </LearnMoreButton>
                      </ClubActions>
                    </ClubContent>
                  </ClubCard>
                ))}
              </Grid>
            ) : (
              <EmptyState>
                <div className="icon">🏛️</div>
                <h3>Клубы не найдены</h3>
                <p>Попробуйте изменить параметры поиска</p>
              </EmptyState>
            )}
          </div>
        )}

        {/* Просмотр мероприятий */}
        {activeTab === 'events' && (
          <div>
            {isLoadingEvents ? (
              <LoadingSpinner />
            ) : eventsList.length > 0 ? (
              <EventsGrid $columns="repeat(auto-fill, minmax(350px, 1fr))" $gap="25px">
                {eventsList.map((event) => (
                  <EventCardResponsive
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <EventHeaderResponsive $avatarUrl={event.avatar ? `/uploads/${event.avatar}` : null}>
                      <EventHeaderContent>
                        <EventTitle>{event.title}</EventTitle>
                        <EventClub 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (event.club?.id) {
                              navigate(`/club-profile/${event.club.id}`);
                            }
                          }}
                        >
                          {event.club?.name || 'Клуб'}
                        </EventClub>
                        <EventDate>{new Date(event.date).toLocaleDateString('ru-RU', { 
                          day: 'numeric', 
                          month: 'long',
                          year: 'numeric'
                        })}</EventDate>
                      </EventHeaderContent>
                    </EventHeaderResponsive>
                    
                    <EventContentResponsive>
                      <EventDescription>
                        {event.description}
                      </EventDescription>
                      
                      <EventDetailsResponsive>
                        <EventDetailItem>
                          <EventDetailIcon>🕐</EventDetailIcon>
                          <EventDetailTextResponsive>{event.time || 'Время уточняется'}</EventDetailTextResponsive>
                        </EventDetailItem>
                        
                        <EventDetailItem>
                          <EventDetailIcon>📍</EventDetailIcon>
                          <EventDetailTextResponsive>{event.location || event.club?.location || 'Место уточняется'}</EventDetailTextResponsive>
                        </EventDetailItem>
                        
                        <EventDetailItem>
                          <EventDetailIcon>👥</EventDetailIcon>
                          <EventDetailTextResponsive>{event.current_participants || 0}/{event.max_participants || '∞'}</EventDetailTextResponsive>
                        </EventDetailItem>
                        
                        {event.price && (
                          <EventDetailItem>
                            <EventDetailIcon>💰</EventDetailIcon>
                            <EventDetailTextResponsive>{event.price}₽</EventDetailTextResponsive>
                          </EventDetailItem>
                        )}
                      </EventDetailsResponsive>
                      
                      <EventAction>
                        <EventActions>
                          <EventButton 
                            $size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (event.user_participation?.is_participating) {
                                return;
                              }
                              handleJoinEvent(event);
                            }}
                            disabled={joinEventMutation.isLoading || event.user_participation?.is_participating}
                            $variant={event.user_participation?.is_participating ? 'secondary' : 'primary'}
                          >
                            {joinEventMutation.isLoading ? 'Записываемся...' : 
                             event.user_participation?.is_participating ? 'Вы участвуете' : 'Участвовать'}
                          </EventButton>
                          
                          {event.user_participation?.is_participating && event.club?.id && (
                            <MessageButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMessageClub(event);
                              }}
                            >
                              💬 Написать
                            </MessageButton>
                          )}
                        </EventActions>
                      </EventAction>
                    </EventContentResponsive>
                  </EventCardResponsive>
                ))}
              </EventsGrid>
            ) : (
              <EmptyState>
                <div className="icon">🎉</div>
                <h3>Мероприятия не найдены</h3>
                <p>Попробуйте изменить параметры поиска</p>
              </EmptyState>
            )}
          </div>
        )}


        {/* Модал деталей клуба */}
        {showDetailsModal && selectedClub && (
          <Modal onClick={() => setShowDetailsModal(false)}>
            <ModalContent $maxWidth="700px" onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>{selectedClub.name}</h2>
                <IconButton onClick={() => setShowDetailsModal(false)}>
                  <CloseIcon />
                </IconButton>
              </ModalHeader>

              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#4a5568', lineHeight: 1.6, fontSize: '16px', marginBottom: '20px' }}>
                  {selectedClub.description}
                </p>
                
                <div style={{ 
                  background: '#f7fafc', 
                  padding: '20px', 
                  borderRadius: '12px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#2d3748', fontSize: '18px' }}>
                    📋 Информация о клубе
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div>
                      <strong>📍 Местоположение:</strong><br />
                      <span style={{ color: '#4a5568' }}>{selectedClub.city}</span>
                    </div>
                    
                    <div>
                      <strong>👥 Участники:</strong><br />
                      <span style={{ color: '#4a5568' }}>
                        {selectedClub.current_members || 0} из {selectedClub.max_members || '∞'}
                      </span>
                    </div>
                    
                    <div>
                      <strong>🔐 Тип:</strong><br />
                      <ClubType $isPrivate={selectedClub.is_private} style={{ margin: '5px 0' }}>
                        {selectedClub.is_private ? 'Приватный' : 'Открытый'}
                      </ClubType>
                    </div>
                    
                    {selectedClub.membership_fee && (
                      <div>
                        <strong>💰 Взнос:</strong><br />
                        <span style={{ color: '#4a5568' }}>{selectedClub.membership_fee}₽</span>
                      </div>
                    )}
                    
                    {selectedClub.website && (
                      <div>
                        <strong>🌐 Сайт:</strong><br />
                        <a href={selectedClub.website} target="_blank" rel="noopener noreferrer" 
                           style={{ color: '#3182ce', textDecoration: 'none' }}>
                          {selectedClub.website}
                        </a>
                      </div>
                    )}
                    
                    {selectedClub.email && (
                      <div>
                        <strong>📧 Email:</strong><br />
                        <span style={{ color: '#4a5568' }}>{selectedClub.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedClub.rules && (
                  <div style={{ 
                    background: '#fff5f5', 
                    padding: '20px', 
                    borderRadius: '12px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#2d3748', fontSize: '18px' }}>
                      📜 Правила клуба
                    </h3>
                    <p style={{ color: '#4a5568', lineHeight: 1.6, margin: 0 }}>
                      {selectedClub.rules}
                    </p>
                  </div>
                )}

                {selectedClub.tags && selectedClub.tags.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#2d3748', fontSize: '18px' }}>
                      🏷️ Теги
                    </h3>
                    <FlexContainer $gap="8px" $wrap>
                      {selectedClub.tags.map((tag, index) => (
                        <span key={index} style={{
                          background: '#e2e8f0',
                          color: '#4a5568',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '14px'
                        }}>
                          {tag}
                        </span>
                      ))}
                    </FlexContainer>
                  </div>
                )}
              </div>

              <FlexContainer $justify="center">
                <LearnMoreButton
                  onClick={() => {
                    setShowDetailsModal(false);
                    navigate(`/club-profile/${selectedClub.id}`);
                  }}
                  style={{ minWidth: '200px' }}
                >
                  Узнать больше
                </LearnMoreButton>
              </FlexContainer>
            </ModalContent>
          </Modal>
        )}

        {/* Модал деталей мероприятия */}
        {showEventDetailsModal && selectedEventDetails && (
          <Modal onClick={() => setShowEventDetailsModal(false)}>
            <ModalContent $maxWidth="700px" onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>🎉 {selectedEventDetails.title}</h2>
                <IconButton onClick={() => setShowEventDetailsModal(false)}>
                  <CloseIcon />
                </IconButton>
              </ModalHeader>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  background: '#f7fafc', 
                  padding: '20px', 
                  borderRadius: '12px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#2d3748', fontSize: '18px' }}>
                    📋 Информация о мероприятии
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div>
                      <strong>🏛️ Клуб:</strong><br />
                      <span style={{ color: '#4a5568' }}>{selectedEventDetails.club?.name || 'Не указан'}</span>
                    </div>
                    
                    <div>
                      <strong>📅 Дата:</strong><br />
                      <span style={{ color: '#4a5568' }}>
                        {new Date(selectedEventDetails.date).toLocaleDateString('ru-RU', { 
                          day: 'numeric', 
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    <div>
                      <strong>🕐 Время:</strong><br />
                      <span style={{ color: '#4a5568' }}>
                        {selectedEventDetails.time || 'Время уточняется'}
                      </span>
                    </div>
                    
                    <div>
                      <strong>📍 Место:</strong><br />
                      <span style={{ color: '#4a5568' }}>
                        {selectedEventDetails.location || selectedEventDetails.club?.location || 'Место уточняется'}
                      </span>
                    </div>
                    
                    <div>
                      <strong>👥 Участники:</strong><br />
                      <span style={{ color: '#4a5568' }}>
                        {selectedEventDetails.current_participants || 0} из {selectedEventDetails.max_participants || '∞'}
                      </span>
                    </div>
                    
                    {selectedEventDetails.price && (
                      <div>
                        <strong>💰 Стоимость:</strong><br />
                        <span style={{ color: '#4a5568' }}>{selectedEventDetails.price}₽</span>
                      </div>
                    )}
                    
                    {selectedEventDetails.event_type && (
                      <div>
                        <strong>🏷️ Тип:</strong><br />
                        <span style={{ color: '#4a5568' }}>{selectedEventDetails.event_type}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedEventDetails.description && (
                  <div style={{ 
                    background: '#fff5f5', 
                    padding: '20px', 
                    borderRadius: '12px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#2d3748', fontSize: '18px' }}>
                      📝 Описание мероприятия
                    </h3>
                    <p style={{ color: '#4a5568', lineHeight: 1.6, margin: 0 }}>
                      {selectedEventDetails.description}
                    </p>
                  </div>
                )}

                {/* Галерея изображений мероприятия */}
                {selectedEventDetails.images && selectedEventDetails.images.length > 0 && (
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: '20px', 
                    borderRadius: '12px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#2d3748', fontSize: '18px' }}>
                      📸 Фотографии мероприятия ({selectedEventDetails.images.length})
                    </h3>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                      gap: '10px' 
                    }}>
                      {selectedEventDetails.images.map((image, index) => (
                        <div
                          key={index}
                          style={{
                            aspectRatio: '4/3',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#e2e8f0',
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                          onClick={() => {
                            // Открываем изображение в новом окне
                            window.open(`/uploads/${image}`, '_blank');
                          }}
                        >
                          <img 
                            src={`/uploads/${image}`} 
                            alt={`Фото мероприятия ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #718096; font-size: 12px;">Ошибка загрузки</div>';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEventDetails.club && (
                  <div style={{ 
                    background: '#e6fffa', 
                    padding: '20px', 
                    borderRadius: '12px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#2d3748', fontSize: '18px' }}>
                      🏛️ Информация о клубе
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                      <div>
                        <strong>Название:</strong><br />
                        <span style={{ color: '#4a5568' }}>{selectedEventDetails.club.name}</span>
                      </div>
                      <div>
                        <strong>Местоположение:</strong><br />
                        <span style={{ color: '#4a5568' }}>{selectedEventDetails.club.location}</span>
                      </div>
                      <div>
                        <strong>Тип:</strong><br />
                        <span style={{ color: '#4a5568' }}>{selectedEventDetails.club.type}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <FlexContainer $gap="15px" $justify="center">
                <Button 
                  $variant="secondary" 
                  onClick={() => setShowEventDetailsModal(false)}
                >
                  Закрыть
                </Button>
                {!selectedEventDetails.user_participation?.is_participating && (
                  <Button 
                    onClick={() => {
                      setShowEventDetailsModal(false);
                      handleJoinEvent(selectedEventDetails);
                    }}
                  >
                    Записаться на мероприятие
                  </Button>
                )}
                {selectedEventDetails.user_participation?.is_participating && (
                  <>
                    <Button 
                      $variant="secondary"
                      disabled
                    >
                      Вы уже участвуете
                    </Button>
                    {selectedEventDetails.club?.id && (
                      <MessageButton
                        onClick={() => {
                          setShowEventDetailsModal(false);
                          handleMessageClub(selectedEventDetails);
                        }}
                      >
                        💬 Написать клубу
                      </MessageButton>
                    )}
                  </>
                )}
              </FlexContainer>
            </ModalContent>
          </Modal>
        )}

        {/* Модал вступления в мероприятие */}
        {showJoinEventModal && selectedEvent && (
          <Modal onClick={() => setShowJoinEventModal(false)}>
            <ModalContent $maxWidth="500px" onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>🎉 Записаться на мероприятие</h2>
                <IconButton onClick={() => setShowJoinEventModal(false)}>
                  <CloseIcon />
                </IconButton>
              </ModalHeader>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  background: '#f7fafc', 
                  padding: '20px', 
                  borderRadius: '12px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#2d3748', fontSize: '18px' }}>
                    {selectedEvent.title}
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>🏛️</span>
                      <span style={{ color: '#4a5568' }}>{selectedEvent.club?.name || 'Клуб'}</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>📅</span>
                      <span style={{ color: '#4a5568' }}>
                        {new Date(selectedEvent.date).toLocaleDateString('ru-RU', { 
                          day: 'numeric', 
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    {selectedEvent.time && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>🕐</span>
                        <span style={{ color: '#4a5568' }}>{selectedEvent.time}</span>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>📍</span>
                      <span style={{ color: '#4a5568' }}>
                        {selectedEvent.location || selectedEvent.club?.location || 'Место уточняется'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>👥</span>
                      <span style={{ color: '#4a5568' }}>
                        {selectedEvent.current_participants || 0} из {selectedEvent.max_participants || '∞'} участников
                      </span>
                    </div>
                    
                    {selectedEvent.price && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>💰</span>
                        <span style={{ color: '#4a5568' }}>{selectedEvent.price}₽</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedEvent.description && (
                  <div style={{ 
                    background: '#fff5f5', 
                    padding: '15px', 
                    borderRadius: '12px',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#2d3748', fontSize: '16px' }}>
                      📝 Описание
                    </h4>
                    <p style={{ color: '#4a5568', lineHeight: 1.5, margin: 0 }}>
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                <div style={{ 
                  background: '#e6fffa', 
                  padding: '15px', 
                  borderRadius: '12px',
                  border: '1px solid #81e6d9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>ℹ️</span>
                    <strong style={{ color: '#2d3748' }}>Важно знать:</strong>
                  </div>
                  <ul style={{ color: '#4a5568', margin: 0, paddingLeft: '20px' }}>
                    <li>После записи вы получите уведомление</li>
                    <li>Организатор может связаться с вами</li>
                    <li>Вы можете отменить участие в любое время</li>
                  </ul>
                </div>
              </div>

              <FlexContainer $gap="15px" $justify="flex-end">
                <Button 
                  $variant="secondary" 
                  onClick={() => setShowJoinEventModal(false)}
                  disabled={joinEventMutation.isLoading}
                >
                  Отмена
                </Button>
                <Button 
                  onClick={confirmJoinEvent}
                  disabled={joinEventMutation.isLoading}
                >
                  {joinEventMutation.isLoading ? 'Записываемся...' : 'Записаться на мероприятие'}
                </Button>
              </FlexContainer>
            </ModalContent>
          </Modal>
        )}
      </ContentCard>
    </ClubsContainer>
  );
};

export default Clubs;