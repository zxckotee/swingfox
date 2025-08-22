import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { clubsAPI, apiUtils } from '../services/api';
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
  height: 120px;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  position: relative;
  padding: 20px;
  color: white;
  
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
  
  .icon {
    font-size: 64px;
    margin-bottom: 20px;
    opacity: 0.5;
  }
  
  h3 {
    margin: 0 0 10px 0;
    font-size: 20px;
    color: #2d3748;
  }
  
  p {
    margin: 0 0 20px 0;
    font-size: 16px;
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

const Clubs = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const queryClient = useQueryClient();

  // Form state
  const [clubForm, setClubForm] = useState({
    name: '',
    description: '',
    city: '',
    is_private: false,
    max_members: 50
  });

  // Queries
  const { data: clubsData, isLoading: isLoadingClubs } = useQuery(
    ['clubs', searchQuery, cityFilter, typeFilter],
    () => clubsAPI.getClubs({
      search: searchQuery,
      city: cityFilter,
      type: typeFilter
    }),
    {
      enabled: activeTab === 'browse',
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  const { data: myClubs, isLoading: isLoadingMyClubs } = useQuery(
    'my-clubs',
    clubsAPI.getMyClubs,
    {
      enabled: activeTab === 'my-clubs',
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  const { data: clubApplications, isLoading: isLoadingApplications } = useQuery(
    ['club-applications', selectedClub?.id],
    () => clubsAPI.getClubApplications(selectedClub.id),
    {
      enabled: !!selectedClub && activeTab === 'my-clubs',
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  // Mutations
  const createClubMutation = useMutation(clubsAPI.createClub, {
    onSuccess: () => {
      toast.success('Клуб создан успешно!');
      setShowCreateModal(false);
      setClubForm({
        name: '',
        description: '',
        city: '',
        is_private: false,
        max_members: 50
      });
      queryClient.invalidateQueries(['clubs']);
      queryClient.invalidateQueries('my-clubs');
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const joinClubMutation = useMutation(
    ({ clubId, message }) => clubsAPI.joinClub(clubId, message),
    {
      onSuccess: () => {
        toast.success('Заявка на вступление отправлена!');
        queryClient.invalidateQueries(['clubs']);
      },
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  const manageApplicationMutation = useMutation(
    ({ clubId, applicationId, action, reason }) => 
      clubsAPI.manageApplication(clubId, applicationId, action, reason),
    {
      onSuccess: (data, variables) => {
        toast.success(
          variables.action === 'approve' 
            ? 'Заявка одобрена!' 
            : 'Заявка отклонена!'
        );
        queryClient.invalidateQueries(['club-applications']);
      },
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  // Handlers
  const handleCreateClub = (e) => {
    e.preventDefault();
    
    if (!clubForm.name.trim()) {
      toast.error('Введите название клуба');
      return;
    }

    if (!clubForm.description.trim()) {
      toast.error('Введите описание клуба');
      return;
    }

    createClubMutation.mutate(clubForm);
  };

  const handleJoinClub = (club) => {
    const message = prompt('Введите сообщение для заявки (необязательно):');
    if (message !== null) { // Пользователь не отменил
      joinClubMutation.mutate({
        clubId: club.id,
        message: message.trim()
      });
    }
  };

  const handleClubClick = (club) => {
    setSelectedClub(club);
    setShowDetailsModal(true);
  };

  const handleApplicationAction = (applicationId, action) => {
    const reason = action === 'reject' 
      ? prompt('Причина отклонения (необязательно):') 
      : '';
    
    if (action === 'reject' && reason === null) return;

    manageApplicationMutation.mutate({
      clubId: selectedClub.id,
      applicationId,
      action,
      reason: reason || ''
    });
  };

  const filteredClubs = clubsData?.clubs || [];
  const myClubsList = myClubs?.clubs || [];

  return (
    <ClubsContainer>
      <ContentCard $maxWidth="1200px">
        <FlexContainer $justify="space-between" $align="center" $wrap>
          <SectionTitle>
            <UsersIcon />
            Клубы и события
          </SectionTitle>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon />
            Создать клуб
          </Button>
        </FlexContainer>

        <TabsContainer>
          <Tab
            $active={activeTab === 'browse'}
            onClick={() => setActiveTab('browse')}
          >
            <SearchIcon />
            Все клубы
          </Tab>
          <Tab
            $active={activeTab === 'my-clubs'}
            onClick={() => setActiveTab('my-clubs')}
          >
            <UsersIcon />
            Мои клубы
          </Tab>
        </TabsContainer>

        {/* Фильтры для просмотра всех клубов */}
        {activeTab === 'browse' && (
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

        {/* Просмотр всех клубов */}
        {activeTab === 'browse' && (
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
                    <ClubHeader>
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
                          <span>
                            <UsersIcon />
                            {club.member_count || 0}/{club.max_members}
                          </span>
                        </ClubStats>
                        
                        <Button 
                          $size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinClub(club);
                          }}
                          disabled={club.is_member || joinClubMutation.isLoading}
                        >
                          {club.is_member ? 'Участник' : 'Вступить'}
                        </Button>
                      </ClubMeta>
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

        {/* Мои клубы */}
        {activeTab === 'my-clubs' && (
          <div>
            {isLoadingMyClubs ? (
              <LoadingSpinner />
            ) : myClubsList.length > 0 ? (
              <Grid $columns="repeat(auto-fill, minmax(300px, 1fr))" $gap="25px">
                {myClubsList.map((club) => (
                  <MyClubCard
                    key={club.id}
                    onClick={() => handleClubClick(club)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ClubHeader>
                      <FlexContainer $justify="space-between" $align="flex-start">
                        <div>
                          <ClubTitle style={{ color: 'white', fontSize: '16px' }}>
                            {club.name}
                          </ClubTitle>
                          <div style={{ fontSize: '12px', opacity: '0.9' }}>
                            {club.is_owner ? 'Владелец' : 'Участник'}
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
                          <span>
                            <UsersIcon />
                            {club.member_count || 0}/{club.max_members}
                          </span>
                          {club.pending_applications > 0 && (
                            <span style={{ color: '#d69e2e' }}>
                              📋 {club.pending_applications} заявок
                            </span>
                          )}
                        </ClubStats>
                        
                        {club.is_owner && (
                          <Button $size="small" $variant="secondary">
                            <EditIcon />
                            Управление
                          </Button>
                        )}
                      </ClubMeta>
                    </ClubContent>
                  </MyClubCard>
                ))}
              </Grid>
            ) : (
              <EmptyState>
                <div className="icon">🏛️</div>
                <h3>Вы не состоите в клубах</h3>
                <p>Вступите в существующий клуб или создайте свой</p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <PlusIcon />
                  Создать клуб
                </Button>
              </EmptyState>
            )}
          </div>
        )}

        {/* Модал создания клуба */}
        {showCreateModal && (
          <Modal onClick={() => setShowCreateModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>Создать новый клуб</h2>
                <IconButton onClick={() => setShowCreateModal(false)}>
                  <CloseIcon />
                </IconButton>
              </ModalHeader>

              <Form onSubmit={handleCreateClub}>
                <FormGroup>
                  <Label>Название клуба</Label>
                  <Input
                    type="text"
                    placeholder="Введите название клуба"
                    value={clubForm.name}
                    onChange={(e) => setClubForm({...clubForm, name: e.target.value})}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Описание</Label>
                  <TextArea
                    placeholder="Опишите цели и активности клуба..."
                    value={clubForm.description}
                    onChange={(e) => setClubForm({...clubForm, description: e.target.value})}
                    $minHeight="120px"
                    required
                  />
                </FormGroup>

                <FlexContainer $gap="15px">
                  <FormGroup style={{ flex: 1 }}>
                    <Label>Город</Label>
                    <Input
                      type="text"
                      placeholder="Укажите город"
                      value={clubForm.city}
                      onChange={(e) => setClubForm({...clubForm, city: e.target.value})}
                    />
                  </FormGroup>

                  <FormGroup style={{ flex: 1 }}>
                    <Label>Максимум участников</Label>
                    <Input
                      type="number"
                      min="5"
                      max="500"
                      value={clubForm.max_members}
                      onChange={(e) => setClubForm({...clubForm, max_members: parseInt(e.target.value)})}
                    />
                  </FormGroup>
                </FlexContainer>

                <FormGroup>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={clubForm.is_private}
                      onChange={(e) => setClubForm({...clubForm, is_private: e.target.checked})}
                    />
                    Приватный клуб (требует одобрения заявок)
                  </label>
                </FormGroup>

                <FlexContainer $gap="10px" $justify="flex-end">
                  <Button 
                    $variant="secondary" 
                    onClick={() => setShowCreateModal(false)} 
                    type="button"
                  >
                    Отмена
                  </Button>
                  <Button type="submit" disabled={createClubMutation.isLoading}>
                    {createClubMutation.isLoading ? 'Создание...' : 'Создать клуб'}
                  </Button>
                </FlexContainer>
              </Form>
            </ModalContent>
          </Modal>
        )}

        {/* Модал деталей клуба и заявок */}
        {showDetailsModal && selectedClub && (
          <Modal onClick={() => setShowDetailsModal(false)}>
            <ModalContent $maxWidth="600px" onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>{selectedClub.name}</h2>
                <IconButton onClick={() => setShowDetailsModal(false)}>
                  <CloseIcon />
                </IconButton>
              </ModalHeader>

              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#4a5568', lineHeight: 1.5 }}>
                  {selectedClub.description}
                </p>
                
                <FlexContainer $gap="15px" $wrap style={{ marginTop: '15px' }}>
                  <span>📍 {selectedClub.city}</span>
                  <span>👥 {selectedClub.member_count}/{selectedClub.max_members}</span>
                  <ClubType $isPrivate={selectedClub.is_private}>
                    {selectedClub.is_private ? 'Приватный' : 'Открытый'}
                  </ClubType>
                </FlexContainer>
              </div>

              {/* Заявки на вступление (только для владельцев) */}
              {selectedClub.is_owner && clubApplications?.applications?.length > 0 && (
                <div>
                  <h3 style={{ marginBottom: '15px', color: '#2d3748' }}>
                    Заявки на вступление ({clubApplications.applications.length})
                  </h3>
                  
                  {clubApplications.applications.map((application) => (
                    <ApplicationCard key={application.id}>
                      <div className="header">
                        <div className="applicant">
                          <Avatar
                            $src={application.user_avatar ? `/uploads/${application.user_avatar}` : ''}
                            $size="40px"
                          >
                            {application.user_login?.charAt(0).toUpperCase()}
                          </Avatar>
                          <div>
                            <div className="name">@{application.user_login}</div>
                            <div className="date">
                              {apiUtils.formatTimeAgo(application.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {application.message && (
                        <div className="message">
                          "{application.message}"
                        </div>
                      )}
                      
                      <div className="actions">
                        <Button
                          $size="small"
                          onClick={() => handleApplicationAction(application.id, 'approve')}
                          disabled={manageApplicationMutation.isLoading}
                        >
                          <CheckIcon />
                          Принять
                        </Button>
                        <Button
                          $size="small"
                          $variant="danger"
                          onClick={() => handleApplicationAction(application.id, 'reject')}
                          disabled={manageApplicationMutation.isLoading}
                        >
                          Отклонить
                        </Button>
                      </div>
                    </ApplicationCard>
                  ))}
                </div>
              )}

              {!selectedClub.is_member && !selectedClub.is_owner && (
                <FlexContainer $justify="center">
                  <Button onClick={() => handleJoinClub(selectedClub)}>
                    Подать заявку на вступление
                  </Button>
                </FlexContainer>
              )}
            </ModalContent>
          </Modal>
        )}
      </ContentCard>
    </ClubsContainer>
  );
};

export default Clubs;