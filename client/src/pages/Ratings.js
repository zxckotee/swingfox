import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ratingAPI, apiUtils } from '../services/api';
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
  StarIcon,
  CrownIcon,
  TrophyIcon,
  FilterIcon,
  CloseIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '../components/UI';

const RatingsContainer = styled(PageContainer)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

const RankingCard = styled(motion.div)`
  background: white;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  ${props => props.$rank <= 3 && `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: ${props.$rank === 1 ? '#ffd700' : props.$rank === 2 ? '#c0c0c0' : '#cd7f32'};
    }
  `}
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 15px;
    
    &:hover {
      transform: none;
    }
  }
`;

const RankBadge = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${props => {
    if (props.$rank === 1) return 'linear-gradient(135deg, #ffd700 0%, #ffed4a 100%)';
    if (props.$rank === 2) return 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)';
    if (props.$rank === 3) return 'linear-gradient(135deg, #cd7f32 0%, #deb887 100%)';
    return 'linear-gradient(135deg, #4a5568 0%, #718096 100%)';
  }};
  color: ${props => props.$rank <= 3 ? '#2d3748' : 'white'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    font-size: 16px;
  }
`;

const UserInfo = styled.div`
  flex: 1;
  
  .name {
    font-size: 18px;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .stats {
    display: flex;
    gap: 20px;
    color: #4a5568;
    font-size: 14px;
    
    .stat {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
  
  @media (max-width: 768px) {
    .stats {
      justify-content: center;
      gap: 15px;
    }
  }
`;

const RatingValue = styled.div`
  text-align: right;
  
  .rating {
    font-size: 24px;
    font-weight: 700;
    color: #dc3522;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .change {
    font-size: 12px;
    margin-top: 2px;
    display: flex;
    align-items: center;
    gap: 2px;
    
    &.positive {
      color: #4caf50;
    }
    
    &.negative {
      color: #f44336;
    }
  }
  
  @media (max-width: 768px) {
    text-align: center;
    
    .rating {
      justify-content: center;
    }
  }
`;

const StatsGrid = styled(Grid)`
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  
  .icon {
    width: 60px;
    height: 60px;
    margin: 0 auto 15px;
    border-radius: 15px;
    background: ${props => props.$color};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }
  
  .value {
    font-size: 28px;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 5px;
  }
  
  .label {
    color: #4a5568;
    font-size: 14px;
  }
  
  @media (max-width: 768px) {
    padding: 20px;
    
    .icon {
      width: 50px;
      height: 50px;
      font-size: 20px;
    }
    
    .value {
      font-size: 24px;
    }
  }
`;

const FilterContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  
  .filter-row {
    display: flex;
    gap: 15px;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .filter-group {
    flex: 1;
    min-width: 200px;
  }
  
  @media (max-width: 768px) {
    .filter-row {
      flex-direction: column;
      gap: 10px;
    }
    
    .filter-group {
      width: 100%;
      min-width: auto;
    }
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
    margin: 0;
    font-size: 16px;
  }
`;

const VipBadge = styled.span`
  background: ${props => apiUtils.getVipBadgeColor(props.$vipLevel)};
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
`;

const Ratings = () => {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [filter, setFilter] = useState({
    period: 'month',
    category: 'overall',
    city: ''
  });
  
  const queryClient = useQueryClient();

  // Queries
  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useQuery(
    ['leaderboard', filter],
    () => ratingAPI.getLeaderboard(filter),
    {
      enabled: activeTab === 'leaderboard',
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  const { data: myStats, isLoading: isLoadingStats } = useQuery(
    ['my-rating-stats'],
    ratingAPI.getMyStats,
    {
      enabled: activeTab === 'my-rating',
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  const { data: topUsers, isLoading: isLoadingTop } = useQuery(
    ['top-users', filter.period],
    () => ratingAPI.getTopUsers({ period: filter.period }),
    {
      enabled: activeTab === 'top-users',
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  // Handlers
  const handleFilterChange = (field, value) => {
    setFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const renderChangeIcon = (change) => {
    if (change > 0) return <ChevronUpIcon />;
    if (change < 0) return <ChevronDownIcon />;
    return null;
  };

  const renderChangeClass = (change) => {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return '';
  };

  if ((activeTab === 'leaderboard' && isLoadingLeaderboard) ||
      (activeTab === 'my-rating' && isLoadingStats) ||
      (activeTab === 'top-users' && isLoadingTop)) {
    return (
      <RatingsContainer>
        <ContentCard>
          <LoadingSpinner />
        </ContentCard>
      </RatingsContainer>
    );
  }

  return (
    <RatingsContainer>
      <ContentCard $maxWidth="1200px">
        <FlexContainer $justify="center" $align="center" $wrap>
          <SectionTitle style={{ color: 'black', textAlign: 'center', marginBottom: '10px' }}>
            <TrophyIcon />
            Система рейтинга
          </SectionTitle>
        </FlexContainer>
        <p style={{ textAlign: 'center', color: 'black', marginBottom: '30px' }}>
          Следите за рейтингом пользователей и своими достижениями
        </p>

        <TabsContainer>
          <Tab
            $active={activeTab === 'leaderboard'}
            onClick={() => setActiveTab('leaderboard')}
          >
            <TrophyIcon />
            Рейтинг
          </Tab>
          <Tab
            $active={activeTab === 'my-rating'}
            onClick={() => setActiveTab('my-rating')}
          >
            <StarIcon />
            Мой рейтинг
          </Tab>
          <Tab
            $active={activeTab === 'top-users'}
            onClick={() => setActiveTab('top-users')}
          >
            <CrownIcon />
            Топ пользователи
          </Tab>
        </TabsContainer>

        {/* Общий рейтинг */}
        {activeTab === 'leaderboard' && (
          <div>
            <FilterContainer>
              <div className="filter-row">
                <div className="filter-group">
                  <Label>Период</Label>
                  <select
                    value={filter.period}
                    onChange={(e) => handleFilterChange('period', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  >
                    <option value="week">Неделя</option>
                    <option value="month">Месяц</option>
                    <option value="year">Год</option>
                    <option value="all">Все время</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <Label>Категория</Label>
                  <select
                    value={filter.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  >
                    <option value="overall">Общий</option>
                    <option value="activity">Активность</option>
                    <option value="popularity">Популярность</option>
                    <option value="engagement">Вовлеченность</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <Label>Город</Label>
                  <Input
                    type="text"
                    placeholder="Фильтр по городу"
                    value={filter.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                  />
                </div>
              </div>
            </FilterContainer>

            {leaderboard?.users?.length > 0 ? (
              <div>
                {leaderboard.users.map((user, index) => (
                  <RankingCard
                    key={user.id}
                    $rank={index + 1}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <RankBadge $rank={index + 1}>
                      {renderRankIcon(index + 1)}
                    </RankBadge>
                    
                    <UserInfo>
                      <div className="name">
                        {user.name}
                        {user.vip_level && (
                          <VipBadge $vipLevel={user.vip_level}>
                            {user.vip_level}
                          </VipBadge>
                        )}
                      </div>
                      <div className="stats">
                        <div className="stat">
                          👁️ {user.profile_views || 0}
                        </div>
                        <div className="stat">
                          ❤️ {user.likes_received || 0}
                        </div>
                        <div className="stat">
                          📍 {user.city || 'Не указан'}
                        </div>
                      </div>
                    </UserInfo>
                    
                    <RatingValue>
                      <div className="rating">
                        <StarIcon />
                        {user.rating_score || 0}
                      </div>
                      {user.rating_change !== undefined && (
                        <div className={`change ${renderChangeClass(user.rating_change)}`}>
                          {renderChangeIcon(user.rating_change)}
                          {Math.abs(user.rating_change)}
                        </div>
                      )}
                    </RatingValue>
                  </RankingCard>
                ))}
              </div>
            ) : (
              <EmptyState>
                <div className="icon">🏆</div>
                <h3>Нет данных рейтинга</h3>
                <p>Рейтинг пользователей пока не сформирован</p>
              </EmptyState>
            )}
          </div>
        )}

        {/* Мой рейтинг */}
        {activeTab === 'my-rating' && (
          <div>
            <StatsGrid $columns="repeat(auto-fit, minmax(250px, 1fr))" $gap="20px">
              <StatCard $color="linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)">
                <div className="icon">
                  <StarIcon />
                </div>
                <div className="value">{myStats?.current_rating || 0}</div>
                <div className="label">Текущий рейтинг</div>
              </StatCard>
              
              <StatCard $color="linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)">
                <div className="icon">
                  <TrophyIcon />
                </div>
                <div className="value">#{myStats?.current_position || '-'}</div>
                <div className="label">Позиция в рейтинге</div>
              </StatCard>
              
              <StatCard $color="linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)">
                <div className="icon">
                  📈
                </div>
                <div className="value">
                  {myStats?.rating_change > 0 ? '+' : ''}{myStats?.rating_change || 0}
                </div>
                <div className="label">Изменение за месяц</div>
              </StatCard>
              
              <StatCard $color="linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)">
                <div className="icon">
                  🎯
                </div>
                <div className="value">{myStats?.max_rating || 0}</div>
                <div className="label">Максимальный рейтинг</div>
              </StatCard>
            </StatsGrid>

            {myStats?.rating_history?.length > 0 && (
              <ContentCard>
                <h3 style={{ marginBottom: '20px', color: '#2d3748' }}>
                  История рейтинга
                </h3>
                <div style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto',
                  padding: '10px'
                }}>
                  {myStats.rating_history.map((entry, index) => (
                    <div 
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: '1px solid #e2e8f0'
                      }}
                    >
                      <div>
                        <strong>{entry.reason || 'Обновление рейтинга'}</strong>
                        <div style={{ fontSize: '12px', color: '#718096' }}>
                          {apiUtils.formatDate(entry.created_at)}
                        </div>
                      </div>
                      <div style={{
                        color: entry.change > 0 ? '#4caf50' : '#f44336',
                        fontWeight: '600'
                      }}>
                        {entry.change > 0 ? '+' : ''}{entry.change}
                      </div>
                    </div>
                  ))}
                </div>
              </ContentCard>
            )}
          </div>
        )}

        {/* Топ пользователи */}
        {activeTab === 'top-users' && (
          <div>
            <FilterContainer>
              <div className="filter-row">
                <div className="filter-group">
                  <Label>Период</Label>
                  <select
                    value={filter.period}
                    onChange={(e) => handleFilterChange('period', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                  >
                    <option value="week">Неделя</option>
                    <option value="month">Месяц</option>
                    <option value="year">Год</option>
                  </select>
                </div>
              </div>
            </FilterContainer>

            <Grid $columns="repeat(auto-fit, minmax(300px, 1fr))" $gap="20px">
              {['most_active', 'most_popular', 'most_gifts'].map((category, index) => {
                const categoryData = topUsers?.[category] || [];
                const categoryTitles = {
                  most_active: 'Самые активные',
                  most_popular: 'Самые популярные', 
                  most_gifts: 'Больше всего подарков'
                };
                
                return (
                  <ContentCard key={category}>
                    <h3 style={{ marginBottom: '20px', color: '#2d3748', textAlign: 'center' }}>
                      {categoryTitles[category]}
                    </h3>
                    
                    {categoryData.length > 0 ? (
                      <div>
                        {categoryData.slice(0, 5).map((user, userIndex) => (
                          <div 
                            key={user.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '15px',
                              padding: '10px 0',
                              borderBottom: userIndex < 4 ? '1px solid #e2e8f0' : 'none'
                            }}
                          >
                            <div style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              background: userIndex === 0 ? '#ffd700' : userIndex === 1 ? '#c0c0c0' : userIndex === 2 ? '#cd7f32' : '#e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: userIndex <= 2 ? '#2d3748' : '#718096'
                            }}>
                              {userIndex + 1}
                            </div>
                            
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', color: '#2d3748' }}>
                                {user.name}
                                {user.vip_level && (
                                  <VipBadge $vipLevel={user.vip_level} style={{ marginLeft: '8px' }}>
                                    {user.vip_level}
                                  </VipBadge>
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: '#718096' }}>
                                {user.score || 0} {category === 'most_active' ? 'действий' : 
                                                   category === 'most_popular' ? 'лайков' : 
                                                   'подарков'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#718096', padding: '20px' }}>
                        Нет данных
                      </div>
                    )}
                  </ContentCard>
                );
              })}
            </Grid>
          </div>
        )}
      </ContentCard>
    </RatingsContainer>
  );
};

export default Ratings;