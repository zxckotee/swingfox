import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { giftsAPI, apiUtils } from '../services/api';
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
  TextArea,
  Avatar,
  GiftIcon,
  SendIcon,
  CloseIcon,
  HeartIcon,
  StarIcon
} from '../components/UI';

// Конфигурация типов подарков
const GIFT_CONFIG = {
  '1': { emoji: '🌹', name: 'Роза', color: 'linear-gradient(135deg, #e53e3e 0%, #ff6b6b 100%)' },
  '2': { emoji: '💐', name: 'Букет цветов', color: 'linear-gradient(135deg, #38a169 0%, #68d391 100%)' },
  '3': { emoji: '🍾', name: 'Шампанское', color: 'linear-gradient(135deg, #d69e2e 0%, #f6e05e 100%)' },
  '4': { emoji: '🎁', name: 'Подарок', color: 'linear-gradient(135deg, #805ad5 0%, #b794f4 100%)' },
  '5': { emoji: '🍽️', name: 'Романтический ужин', color: 'linear-gradient(135deg, #d53f8c 0%, #f687b3 100%)' },
  '6': { emoji: '✈️', name: 'Путешествие', color: 'linear-gradient(135deg, #4299e1 0%, #90cdf4 100%)' },
  '7': { emoji: '💎', name: 'Украшение', color: 'linear-gradient(135deg, #4299e1 0%, #90cdf4 100%)' },
  '8': { emoji: '👑', name: 'VIP статус на месяц', color: 'linear-gradient(135deg, #ffd700 0%, #fbbf24 100%)' },
  '9': { emoji: '⭐', name: 'Premium статус на месяц', color: 'linear-gradient(135deg, #9b59b6 0%, #d6bcfa 100%)' },
  '10': { emoji: '🏆', name: 'Эксклюзивный подарок', color: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)' }
};

const GiftsContainer = styled(PageContainer)`
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
  color: ${props => props.$active ? 'white' : 'transparent'};
  background-image: ${props => props.$active ? 'none' : 'linear-gradient(135deg, #4a5568 0%, #718096 100%)'};
  -webkit-background-clip: ${props => props.$active ? 'unset' : 'text'};
  -webkit-text-fill-color: ${props => props.$active ? 'white' : 'transparent'};
  background-clip: ${props => props.$active ? 'unset' : 'text'};
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
    color: ${props => props.$active ? 'white' : 'transparent'};
    background-image: ${props => props.$active ? 'none' : 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)'};
    -webkit-background-clip: ${props => props.$active ? 'unset' : 'text'};
    -webkit-text-fill-color: ${props => props.$active ? 'white' : 'transparent'};
    background-clip: ${props => props.$active ? 'unset' : 'text'};
  }
  
  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 14px;
  }
`;

const GiftCard = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.$color};
  }
`;

const GiftEmoji = styled.div`
  font-size: 48px;
  margin-bottom: 15px;
  
  @media (max-width: 768px) {
    font-size: 40px;
    margin-bottom: 12px;
  }
`;

const GiftName = styled.h3`
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 18px;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const GiftPrice = styled.div`
  font-size: 24px;
  font-weight: 700;
  background: ${props => props.$color};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 15px;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const HistoryCard = styled.div`
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    padding: 15px;
    gap: 12px;
  }
`;

const HistoryGiftIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: ${props => props.$color};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: 45px;
    height: 45px;
    font-size: 20px;
  }
`;

const HistoryDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const HistoryTitle = styled.h4`
  margin: 0 0 5px 0;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 16px;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const HistoryInfo = styled.p`
  margin: 0 0 5px 0;
  background: linear-gradient(135deg, #4a5568 0%, #718096 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 14px;
  
  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const HistoryMeta = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
  
  span {
    font-size: 12px;
    background: linear-gradient(135deg, #718096 0%, #a0aec0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  @media (max-width: 768px) {
    gap: 10px;
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
  
  .number {
    font-size: 32px;
    font-weight: 700;
    background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 8px;
  }
  
  .label {
    font-size: 14px;
    background: linear-gradient(135deg, #718096 0%, #a0aec0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    padding: 20px;
    
    .number {
      font-size: 24px;
    }
    
    .label {
      font-size: 13px;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  
  .icon {
    font-size: 64px;
    margin-bottom: 20px;
    opacity: 0.5;
  }
  
  h3 {
    margin: 0 0 10px 0;
    font-size: 20px;
    background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  p {
    margin: 0;
    font-size: 16px;
    background: linear-gradient(135deg, #718096 0%, #a0aec0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const Gifts = () => {
  const [activeTab, setActiveTab] = useState('shop');
  const [selectedGift, setSelectedGift] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [recipientUser, setRecipientUser] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [historyType, setHistoryType] = useState('all');
  const queryClient = useQueryClient();

  // Queries
  const { data: giftTypes, isLoading: isLoadingTypes } = useQuery(
    'gift-types',
    giftsAPI.getGiftTypes,
    {
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  const { data: giftHistory, isLoading: isLoadingHistory } = useQuery(
    ['gift-history', historyType],
    () => giftsAPI.getGiftHistory(historyType),
    {
      enabled: activeTab === 'history',
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  const { data: giftStats, isLoading: isLoadingStats } = useQuery(
    'gift-stats',
    giftsAPI.getGiftStats,
    {
      enabled: activeTab === 'stats',
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  // Mutations
  const sendGiftMutation = useMutation(giftsAPI.sendGift, {
    onSuccess: (data) => {
      toast.success('Подарок отправлен!');
      setShowSendModal(false);
      setRecipientUser('');
      setGiftMessage('');
      setSelectedGift(null);
      queryClient.invalidateQueries(['gift-history']);
      queryClient.invalidateQueries('gift-stats');
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  // Handlers
  const handleGiftSelect = (gift) => {
    setSelectedGift(gift);
    setShowSendModal(true);
  };

  const handleSendGift = (e) => {
    e.preventDefault();
    
    if (!recipientUser.trim()) {
      toast.error('Введите логин получателя');
      return;
    }

    if (!selectedGift) {
      toast.error('Выберите подарок');
      return;
    }

    sendGiftMutation.mutate({
      to_user: recipientUser.trim(),
      gift_type: selectedGift.id,
      message: giftMessage.trim()
    });
  };

  const closeModal = () => {
    setShowSendModal(false);
    setSelectedGift(null);
    setRecipientUser('');
    setGiftMessage('');
  };

  if (isLoadingTypes && activeTab === 'shop') {
    return (
      <GiftsContainer>
        <ContentCard>
          <LoadingSpinner />
        </ContentCard>
      </GiftsContainer>
    );
  }

  return (
    <GiftsContainer>
      <ContentCard $maxWidth="1000px">
        <FlexContainer $justify="space-between" $align="center" $wrap>
          <SectionTitle>
            <GiftIcon />
            Подарки
          </SectionTitle>
        </FlexContainer>

        <TabsContainer>
          <Tab
            $active={activeTab === 'shop'}
            onClick={() => setActiveTab('shop')}
          >
            <GiftIcon />
            Магазин
          </Tab>
          <Tab
            $active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
          >
            <HeartIcon />
            История
          </Tab>
          <Tab
            $active={activeTab === 'stats'}
            onClick={() => setActiveTab('stats')}
          >
            <StarIcon />
            Статистика
          </Tab>
        </TabsContainer>

        {/* Магазин подарков */}
        {activeTab === 'shop' && (
          <div>
            <Grid $columns="repeat(auto-fill, minmax(200px, 1fr))" $gap="20px">
              {giftTypes?.gift_types?.map((gift) => {
                const config = GIFT_CONFIG[gift.id] || {};
                return (
                  <GiftCard
                    key={gift.id}
                    $color={config.color || '#dc3522'}
                    onClick={() => handleGiftSelect(gift)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <GiftEmoji>{config.emoji || '🎁'}</GiftEmoji>
                    <GiftName>{config.name || gift.name}</GiftName>
                    <GiftPrice $color={config.color || '#dc3522'}>
                      {gift.cost}₽
                    </GiftPrice>
                    <Button $size="small">
                      <SendIcon />
                      Подарить
                    </Button>
                  </GiftCard>
                );
              })}
            </Grid>
          </div>
        )}

        {/* История подарков */}
        {activeTab === 'history' && (
          <div>
            <FlexContainer $gap="10px" $wrap style={{ marginBottom: '20px' }}>
              <Button
                $size="small"
                $variant={historyType === 'all' ? 'primary' : 'secondary'}
                onClick={() => setHistoryType('all')}
              >
                Все
              </Button>
              <Button
                $size="small"
                $variant={historyType === 'sent' ? 'primary' : 'secondary'}
                onClick={() => setHistoryType('sent')}
              >
                Отправленные
              </Button>
              <Button
                $size="small"
                $variant={historyType === 'received' ? 'primary' : 'secondary'}
                onClick={() => setHistoryType('received')}
              >
                Полученные
              </Button>
            </FlexContainer>

            {isLoadingHistory ? (
              <LoadingSpinner />
            ) : giftHistory?.gifts?.length > 0 ? (
              <div>
                {giftHistory.gifts.map((gift) => {
                  const config = GIFT_CONFIG[gift.gift_type] || {};
                  return (
                    <HistoryCard key={gift.id}>
                      <HistoryGiftIcon $color={config.color || '#dc3522'}>
                        {config.emoji || '🎁'}
                      </HistoryGiftIcon>
                      <HistoryDetails>
                        <HistoryTitle>
                          {config.name || gift.type_name || gift.gift_type}
                        </HistoryTitle>
                        <HistoryInfo>
                          {historyType === 'sent' ? `Кому: ${gift.to_user}` : `От: ${gift.from_user}`}
                        </HistoryInfo>
                        {gift.message && (
                          <HistoryInfo>"{gift.message}"</HistoryInfo>
                        )}
                        <HistoryMeta>
                          <span>{apiUtils.formatTimeAgo(gift.created_at)}</span>
                          <span>{gift.cost}₽</span>
                        </HistoryMeta>
                      </HistoryDetails>
                    </HistoryCard>
                  );
                })}
              </div>
            ) : (
              <EmptyState>
                <div className="icon">🎁</div>
                <h3>Нет подарков</h3>
                <p>
                  {historyType === 'sent' 
                    ? 'Вы еще не отправляли подарки'
                    : historyType === 'received'
                    ? 'Вы еще не получали подарки'
                    : 'История подарков пуста'
                  }
                </p>
              </EmptyState>
            )}
          </div>
        )}

        {/* Статистика */}
        {activeTab === 'stats' && (
          <div>
            {isLoadingStats ? (
              <LoadingSpinner />
            ) : (
              <>
                <StatsGrid $columns="repeat(auto-fit, minmax(150px, 1fr))" $gap="20px">
                  <StatCard>
                    <div className="number">{giftStats?.sent_count || 0}</div>
                    <div className="label">Отправлено</div>
                  </StatCard>
                  <StatCard>
                    <div className="number">{giftStats?.received_count || 0}</div>
                    <div className="label">Получено</div>
                  </StatCard>
                  <StatCard>
                    <div className="number">{giftStats?.total_spent || 0}₽</div>
                    <div className="label">Потрачено</div>
                  </StatCard>
                  <StatCard>
                    <div className="number">{giftStats?.total_received_value || 0}₽</div>
                    <div className="label">Получено на сумму</div>
                  </StatCard>
                </StatsGrid>

                {giftStats?.popular_gifts?.length > 0 && (
                  <div>
                    <SectionTitle>Популярные подарки</SectionTitle>
                    <Grid $columns="repeat(auto-fill, minmax(120px, 1fr))" $gap="15px">
                      {giftStats.popular_gifts.map((gift) => {
                        const config = GIFT_CONFIG[gift.type || gift.gift_type] || {};
                        return (
                          <div
                            key={gift.type || gift.gift_type}
                            style={{
                              background: 'white',
                              borderRadius: '12px',
                              padding: '15px',
                              textAlign: 'center',
                              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                            }}
                          >
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                              {config.emoji || '🎁'}
                            </div>
                            <div style={{ 
                              fontSize: '14px', 
                              fontWeight: '600', 
                              marginBottom: '4px',
                              background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text'
                            }}>
                              {config.name || gift.name || gift.type || gift.gift_type}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              background: 'linear-gradient(135deg, #718096 0%, #a0aec0 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text'
                            }}>
                              {gift.count} раз
                            </div>
                          </div>
                        );
                      })}
                    </Grid>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Модал отправки подарка */}
        {showSendModal && selectedGift && (
          <Modal onClick={closeModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>Отправить подарок</h2>
                <IconButton onClick={closeModal}>
                  <CloseIcon />
                </IconButton>
              </ModalHeader>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                  {GIFT_CONFIG[selectedGift.id]?.emoji || '🎁'}
                </div>
                <h3 style={{ 
                  margin: '0 0 5px 0', 
                  background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {GIFT_CONFIG[selectedGift.id]?.name || selectedGift.name}
                </h3>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  background: 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {selectedGift.cost}₽
                </div>
              </div>

              <Form onSubmit={handleSendGift}>
                <FormGroup>
                  <Label>Получатель</Label>
                  <input
                    type="text"
                    placeholder="Введите логин пользователя"
                    value={recipientUser}
                    onChange={(e) => setRecipientUser(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Сообщение (необязательно)</Label>
                  <TextArea
                    placeholder="Добавьте личное сообщение..."
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    $minHeight="100px"
                  />
                </FormGroup>

                <FlexContainer $gap="10px" $justify="flex-end">
                  <Button $variant="secondary" onClick={closeModal} type="button">
                    Отмена
                  </Button>
                  <Button type="submit" disabled={sendGiftMutation.isLoading}>
                    {sendGiftMutation.isLoading ? 'Отправка...' : 'Отправить подарок'}
                  </Button>
                </FlexContainer>
              </Form>
            </ModalContent>
          </Modal>
        )}
      </ContentCard>
    </GiftsContainer>
  );
};

export default Gifts;