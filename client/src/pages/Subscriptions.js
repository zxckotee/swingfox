import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { subscriptionsAPI, apiUtils } from '../services/api';
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
  CrownIcon,
  CheckIcon,
  CloseIcon,
  StarIcon
} from '../components/UI';

const SubscriptionsContainer = styled(PageContainer)`
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

const PlanCard = styled(motion.div)`
  background: white;
  border-radius: 25px;
  padding: 35px;
  text-align: center;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  ${props => props.$featured && `
    transform: scale(1.05);
    border: 3px solid #ffd700;
    box-shadow: 0 20px 60px rgba(255, 215, 0, 0.3);
    
    &::before {
      content: 'ПОПУЛЯРНЫЙ';
      position: absolute;
      top: 15px;
      right: -30px;
      background: linear-gradient(135deg, #ffd700 0%, #ffed4a 100%);
      color: #2d3748;
      padding: 8px 40px;
      font-size: 12px;
      font-weight: 700;
      transform: rotate(45deg);
      box-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
    }
  `}
  
  &:hover {
    transform: ${props => props.$featured ? 'scale(1.08)' : 'scale(1.02)'};
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  }
  
  @media (max-width: 768px) {
    padding: 25px;
    transform: none !important;
    
    &:hover {
      transform: none !important;
    }
  }
`;

const PlanIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 20px;
  background: ${props => props.$color};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  box-shadow: 0 10px 30px ${props => props.$color}40;
  
  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    font-size: 28px;
  }
`;

const PlanTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 700;
  color: #2d3748;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const PlanPrice = styled.div`
  margin-bottom: 25px;
  
  .price {
    font-size: 48px;
    font-weight: 700;
    color: ${props => props.$color};
    line-height: 1;
  }
  
  .currency {
    font-size: 24px;
    margin-left: 5px;
  }
  
  .period {
    font-size: 14px;
    color: #718096;
    margin-top: 5px;
  }
  
  @media (max-width: 768px) {
    .price {
      font-size: 36px;
    }
    
    .currency {
      font-size: 18px;
    }
  }
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 30px 0;
  text-align: left;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  color: #4a5568;
  font-size: 15px;
  
  .icon {
    color: #4caf50;
    flex-shrink: 0;
  }
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const CurrentStatusCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  
  .status-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    border-radius: 20px;
    background: ${props => props.$statusColor};
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
  }
  
  .status-title {
    font-size: 24px;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 10px;
  }
  
  .status-info {
    color: #4a5568;
    font-size: 16px;
    margin-bottom: 20px;
    line-height: 1.5;
  }
  
  @media (max-width: 768px) {
    padding: 20px;
    
    .status-icon {
      width: 60px;
      height: 60px;
      font-size: 28px;
    }
    
    .status-title {
      font-size: 20px;
    }
    
    .status-info {
      font-size: 14px;
    }
  }
`;

const HistoryCard = styled.div`
  background: white;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .payment-info {
    .plan {
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 5px;
    }
    
    .date {
      font-size: 12px;
      color: #718096;
    }
  }
  
  .payment-amount {
    font-size: 18px;
    font-weight: 700;
    color: #4caf50;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    
    .payment-amount {
      font-size: 16px;
    }
  }
`;

const PromoSection = styled.div`
  background: linear-gradient(135deg, rgba(220, 53, 34, 0.1) 0%, rgba(255, 107, 88, 0.1) 100%);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  
  .promo-title {
    font-size: 16px;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 10px;
  }
  
  .promo-input {
    display: flex;
    gap: 10px;
    
    input {
      flex: 1;
      padding: 10px 15px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      
      &:focus {
        outline: none;
        border-color: #dc3522;
      }
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

// Конфигурация планов
const PLAN_CONFIGS = {
  VIP: {
    icon: '👑',
    color: '#ffd700',
    price: 299,
    features: [
      'Безлимитные лайки',
      'Просмотр всех профилей',
      'Суперлайки (5 в день)',
      'Приоритет в поиске',
      'Скрытие рекламы',
      'Расширенные фильтры'
    ]
  },
  PREMIUM: {
    icon: '💎',
    color: '#9b59b6',
    price: 599,
    featured: true,
    features: [
      'Все возможности VIP',
      'Безлимитные суперлайки',
      'Просмотр лайков',
      'Невидимый режим',
      'Приоритетная поддержка',
      'Эксклюзивные события',
      'Расширенная статистика'
    ]
  }
};

const Subscriptions = () => {
  const [activeTab, setActiveTab] = useState('plans');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const queryClient = useQueryClient();

  // Queries
  const { data: subscriptionStatus, isLoading: isLoadingStatus } = useQuery(
    'subscription-status',
    subscriptionsAPI.getStatus,
    {
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  const { data: subscriptionHistory, isLoading: isLoadingHistory } = useQuery(
    'subscription-history',
    subscriptionsAPI.getHistory,
    {
      enabled: activeTab === 'history',
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  // Mutations
  const subscribeMutation = useMutation(subscriptionsAPI.subscribe, {
    onSuccess: () => {
      toast.success('Подписка успешно оформлена!');
      setShowPaymentModal(false);
      setSelectedPlan(null);
      queryClient.invalidateQueries('subscription-status');
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const cancelMutation = useMutation(subscriptionsAPI.cancel, {
    onSuccess: () => {
      toast.success('Подписка отменена');
      queryClient.invalidateQueries('subscription-status');
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const promoMutation = useMutation(subscriptionsAPI.usePromoCode, {
    onSuccess: (data) => {
      toast.success(`Промокод применен! Скидка: ${data.discount}%`);
      setPromoCode('');
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  // Handlers
  const handleSubscribe = (planType) => {
    setSelectedPlan(planType);
    setShowPaymentModal(true);
  };

  const handlePayment = (e) => {
    e.preventDefault();
    
    if (!selectedPlan) return;

    subscribeMutation.mutate({
      plan: selectedPlan.toLowerCase(),
      duration: 1,
      promo_code: promoCode.trim() || undefined
    });
  };

  const handleCancel = () => {
    if (window.confirm('Вы уверены, что хотите отменить подписку?')) {
      const reason = prompt('Причина отмены (необязательно):');
      cancelMutation.mutate(reason || '');
    }
  };

  const handlePromoApply = () => {
    if (!promoCode.trim()) {
      toast.error('Введите промокод');
      return;
    }
    
    promoMutation.mutate(promoCode.trim());
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'vip': return '#ffd700';
      case 'premium': return '#9b59b6';
      default: return '#4a5568';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'vip': return '👑';
      case 'premium': return '💎';
      default: return '👤';
    }
  };

  if (isLoadingStatus) {
    return (
      <SubscriptionsContainer>
        <ContentCard>
          <LoadingSpinner />
        </ContentCard>
      </SubscriptionsContainer>
    );
  }

  return (
    <SubscriptionsContainer>
      <ContentCard $maxWidth="1200px">
        <FlexContainer $justify="center" $align="center" $wrap>
          <SectionTitle style={{ color: 'white', textAlign: 'center', marginBottom: '10px' }}>
            <CrownIcon />
            VIP & PREMIUM подписки
          </SectionTitle>
        </FlexContainer>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.9)', marginBottom: '30px' }}>
          Получите максимум от SwingFox с премиум возможностями
        </p>

        <TabsContainer>
          <Tab
            $active={activeTab === 'plans'}
            onClick={() => setActiveTab('plans')}
          >
            <CrownIcon />
            Планы
          </Tab>
          <Tab
            $active={activeTab === 'status'}
            onClick={() => setActiveTab('status')}
          >
            <StarIcon />
            Мой статус
          </Tab>
          <Tab
            $active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
          >
            📋 История
          </Tab>
        </TabsContainer>

        {/* Планы подписки */}
        {activeTab === 'plans' && (
          <div>
            <Grid $columns="repeat(auto-fit, minmax(300px, 1fr))" $gap="30px">
              {Object.entries(PLAN_CONFIGS).map(([planType, config]) => (
                <PlanCard
                  key={planType}
                  $featured={config.featured}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <PlanIcon $color={config.color}>
                    {config.icon}
                  </PlanIcon>
                  
                  <PlanTitle>{planType}</PlanTitle>
                  
                  <PlanPrice $color={config.color}>
                    <div className="price">
                      {config.price}
                      <span className="currency">₽</span>
                    </div>
                    <div className="period">в месяц</div>
                  </PlanPrice>
                  
                  <FeaturesList>
                    {config.features.map((feature, index) => (
                      <FeatureItem key={index}>
                        <div className="icon">
                          <CheckIcon />
                        </div>
                        {feature}
                      </FeatureItem>
                    ))}
                  </FeaturesList>
                  
                  <Button
                    onClick={() => handleSubscribe(planType)}
                    disabled={subscriptionStatus?.plan === planType.toLowerCase()}
                    style={{
                      background: subscriptionStatus?.plan === planType.toLowerCase() 
                        ? '#e2e8f0' 
                        : `linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%)`,
                      width: '100%'
                    }}
                  >
                    {subscriptionStatus?.plan === planType.toLowerCase() 
                      ? 'Текущий план' 
                      : 'Выбрать план'
                    }
                  </Button>
                </PlanCard>
              ))}
            </Grid>
          </div>
        )}

        {/* Статус подписки */}
        {activeTab === 'status' && (
          <div>
            <CurrentStatusCard $statusColor={getStatusColor(subscriptionStatus?.plan)}>
              <div className="status-icon">
                {getStatusIcon(subscriptionStatus?.plan)}
              </div>
              <div className="status-title">
                {subscriptionStatus?.plan?.toUpperCase() || 'БАЗОВЫЙ'} план
              </div>
              <div className="status-info">
                {subscriptionStatus?.plan ? (
                  <>
                    Активна до: {apiUtils.formatDate(subscriptionStatus.expires_at)}
                    <br />
                    Автопродление: {subscriptionStatus.auto_renew ? 'Включено' : 'Отключено'}
                  </>
                ) : (
                  'У вас базовый план. Оформите премиум подписку для получения дополнительных возможностей!'
                )}
              </div>
              
              {subscriptionStatus?.plan && (
                <FlexContainer $gap="15px" $justify="center">
                  <Button $variant="secondary">
                    Изменить план
                  </Button>
                  <Button 
                    $variant="danger" 
                    onClick={handleCancel}
                    disabled={cancelMutation.isLoading}
                  >
                    Отменить подписку
                  </Button>
                </FlexContainer>
              )}
            </CurrentStatusCard>

            {/* Промокоды */}
            <PromoSection>
              <div className="promo-title">Есть промокод?</div>
              <div className="promo-input">
                <input
                  type="text"
                  placeholder="Введите промокод"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                />
                <Button 
                  $size="small" 
                  onClick={handlePromoApply}
                  disabled={promoMutation.isLoading || !promoCode.trim()}
                >
                  Применить
                </Button>
              </div>
            </PromoSection>
          </div>
        )}

        {/* История платежей */}
        {activeTab === 'history' && (
          <div>
            {isLoadingHistory ? (
              <LoadingSpinner />
            ) : subscriptionHistory?.payments?.length > 0 ? (
              <div>
                {subscriptionHistory.payments.map((payment) => (
                  <HistoryCard key={payment.id}>
                    <div className="payment-info">
                      <div className="plan">
                        {payment.plan?.toUpperCase()} подписка
                      </div>
                      <div className="date">
                        {apiUtils.formatDate(payment.created_at)}
                      </div>
                    </div>
                    <div className="payment-amount">
                      +{payment.amount}₽
                    </div>
                  </HistoryCard>
                ))}
              </div>
            ) : (
              <EmptyState>
                <div className="icon">💳</div>
                <h3>Нет истории платежей</h3>
                <p>Здесь будет отображаться история ваших подписок</p>
              </EmptyState>
            )}
          </div>
        )}

        {/* Модал оплаты */}
        {showPaymentModal && selectedPlan && (
          <Modal onClick={() => setShowPaymentModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>Оформление {selectedPlan} подписки</h2>
                <IconButton onClick={() => setShowPaymentModal(false)}>
                  <CloseIcon />
                </IconButton>
              </ModalHeader>

              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <PlanIcon $color={PLAN_CONFIGS[selectedPlan].color}>
                  {PLAN_CONFIGS[selectedPlan].icon}
                </PlanIcon>
                <h3 style={{ margin: '15px 0 5px 0', color: '#2d3748' }}>
                  {selectedPlan} подписка
                </h3>
                <div style={{ fontSize: '24px', fontWeight: '700', color: PLAN_CONFIGS[selectedPlan].color }}>
                  {PLAN_CONFIGS[selectedPlan].price}₽/месяц
                </div>
              </div>

              <Form onSubmit={handlePayment}>
                <FormGroup>
                  <Label>Промокод (необязательно)</Label>
                  <Input
                    type="text"
                    placeholder="Введите промокод для скидки"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  />
                </FormGroup>

                <div style={{ 
                  background: '#f7fafc', 
                  padding: '15px', 
                  borderRadius: '10px', 
                  marginBottom: '20px',
                  fontSize: '14px',
                  color: '#4a5568'
                }}>
                  <strong>Условия:</strong>
                  <ul style={{ margin: '10px 0 0 20px', paddingLeft: 0 }}>
                    <li>Подписка активируется сразу после оплаты</li>
                    <li>Автопродление можно отключить в любое время</li>
                    <li>Возврат средств в течение 7 дней</li>
                  </ul>
                </div>

                <FlexContainer $gap="10px" $justify="flex-end">
                  <Button 
                    $variant="secondary" 
                    onClick={() => setShowPaymentModal(false)} 
                    type="button"
                  >
                    Отмена
                  </Button>
                  <Button type="submit" disabled={subscribeMutation.isLoading}>
                    {subscribeMutation.isLoading ? 'Обработка...' : 'Оплатить'}
                  </Button>
                </FlexContainer>
              </Form>
            </ModalContent>
          </Modal>
        )}
      </ContentCard>
    </SubscriptionsContainer>
  );
};

export default Subscriptions;