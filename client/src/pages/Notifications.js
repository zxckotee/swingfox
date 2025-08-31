import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI, apiUtils } from '../services/api';
import MatchNotification from '../components/MatchNotification';
import {
  PageContainer,
  ContentCard,
  SectionTitle,
  Button,
  IconButton,
  FlexContainer,
  Grid,
  LoadingSpinner,
  BellIcon,
  CheckIcon,
  TrashIcon,
  FilterIcon,
  MessageIcon,
  HeartIcon,
  GiftIcon,
  StarIcon,
  UsersIcon,
  EyeIcon,
  CrownIcon
} from '../components/UI';

// Иконки для типов уведомлений
const getNotificationIcon = (type) => {
  const iconMap = {
    message: MessageIcon,
    like: HeartIcon,
    visit: EyeIcon,
    gift: GiftIcon,
    match: HeartIcon,
    event: UsersIcon,
    club: UsersIcon,
    subscription: CrownIcon,
    admin: BellIcon,
    system: BellIcon,
    rating: StarIcon,
    photo: EyeIcon,
    comment: MessageIcon,
    invitation: UsersIcon,
    reminder: BellIcon,
    warning: BellIcon,
    promotion: CrownIcon
  };
  
  const IconComponent = iconMap[type] || BellIcon;
  return <IconComponent />;
};

// Цвета для типов уведомлений
const getNotificationColor = (type) => {
  const colorMap = {
    message: '#4299e1',
    like: '#e53e3e',
    visit: '#38a169',
    gift: '#d69e2e',
    match: '#e53e3e',
    event: '#805ad5',
    club: '#805ad5',
    subscription: '#d69e2e',
    admin: '#dc3522',
    system: '#4a5568',
    rating: '#ed8936',
    photo: '#38a169',
    comment: '#4299e1',
    invitation: '#805ad5',
    reminder: '#4a5568',
    warning: '#f56565',
    promotion: '#d69e2e'
  };
  
  return colorMap[type] || '#4a5568';
};

const NotificationsContainer = styled(PageContainer)`
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const NotificationsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

const FilterTab = styled.button`
  padding: 10px 20px;
  border: none;
  background: ${props => props.$active ? 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#4a5568'};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover:not(:disabled) {
    background: ${props => props.$active ? 
      'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)' : 
      'linear-gradient(135deg, rgba(220, 53, 34, 0.1) 0%, rgba(255, 107, 88, 0.1) 100%)'
    };
    color: ${props => props.$active ? 'white' : '#dc3522'};
  }
  
  ${props => props.$count > 0 && `
    &::after {
      content: '${props.$count}';
      position: absolute;
      top: -5px;
      right: -5px;
      background: #f56565;
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
  `}
  
  @media (max-width: 768px) {
    padding: 8px 16px;
    font-size: 13px;
  }
`;

const BulkActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const NotificationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const NotificationItem = styled(motion.div)`
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-left: 4px solid ${props => props.$color};
  transition: all 0.3s ease;
  position: relative;
  
  ${props => !props.$isRead && css`
    background: linear-gradient(135deg, rgba(220, 53, 34, 0.02) 0%, rgba(255, 107, 88, 0.02) 100%);
    border-left-color: #dc3522;
    
    &::before {
      content: '';
      position: absolute;
      top: 15px;
      right: 15px;
      width: 8px;
      height: 8px;
      background: #dc3522;
      border-radius: 50%;
    }
  `}
  
  &:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const NotificationContent = styled.div`
  display: flex;
  gap: 15px;
  align-items: flex-start;
`;

const NotificationIcon = styled.div`
  width: 45px;
  height: 45px;
  border-radius: 12px;
  background: ${props => props.$color};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }
`;

const NotificationDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationTitle = styled.h4`
  margin: 0 0 5px 0;
  color: #2d3748;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  
  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

const NotificationMessage = styled.p`
  margin: 0 0 10px 0;
  color: #4a5568;
  font-size: 14px;
  line-height: 1.4;
  
  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const NotificationMeta = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
`;

const NotificationTime = styled.span`
  font-size: 12px;
  color: #718096;
`;

const NotificationPriority = styled.span`
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  
  ${props => {
    switch (props.$priority) {
      case 'high':
        return 'background: #fed7d7; color: #c53030;';
      case 'normal':
        return 'background: #bee3f8; color: #2b6cb0;';
      case 'low':
        return 'background: #e2e8f0; color: #4a5568;';
      default:
        return 'background: #e2e8f0; color: #4a5568;';
    }
  }}
`;

const NotificationActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

// Кнопка для перехода в профиль
const ProfileButton = styled(IconButton)`
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
  border: 2px solid #3182ce;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #3182ce 0%, #2c5aa0 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(66, 153, 225, 0.4);
  }
  
  &:active {
    transform: translateY(0);
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
  
  @media (max-width: 768px) {
    padding: 40px 20px;
    
    .icon {
      font-size: 48px;
    }
    
    h3 {
      font-size: 18px;
    }
    
    p {
      font-size: 14px;
    }
  }
`;

const Notifications = () => {
  const [filter, setFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [animatingOut, setAnimatingOut] = useState(new Set());
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Получение уведомлений
  const { data: notificationsData, isLoading, refetch } = useQuery(
    ['notifications', filter],
    () => {
      const filters = {};
      if (filter === 'unread') filters.unread = true;
      if (filter !== 'all' && filter !== 'unread') filters.type = filter;
      return notificationsAPI.getNotifications(filters);
    },
    {
      refetchInterval: 30000, // Обновление каждые 30 секунд
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unread_count || 0;



  // Фильтруем уведомления в зависимости от выбранного фильтра
  const filteredNotifications = useMemo(() => {
    if (!notifications || notifications.length === 0) {
      return [];
    }
    
    if (filter === 'unread') {
      return notifications.filter(notif => !notif.is_read);
    } else if (filter !== 'all') {
      return notifications.filter(notif => notif.type === filter);
    }
    return notifications;
  }, [notifications, filter]);

  // Подсчитаем количество по типам для фильтров
  const countByType = useMemo(() => {
    if (!notifications || notifications.length === 0) {
      return {};
    }
    
    return notifications.reduce((acc, notif) => {
      acc[notif.type] = (acc[notif.type] || 0) + 1;
      return acc;
    }, {});
  }, [notifications]);

  // Подсчитаем количество непрочитанных
  const currentUnreadCount = useMemo(() => {
    if (!notifications || notifications.length === 0) {
      return 0;
    }
    
    return notifications.filter(notif => !notif.is_read).length;
  }, [notifications]);

  // Мутации
  const markAsReadMutation = useMutation(notificationsAPI.markAsRead, {
    onSuccess: (data, variables) => {
      // Обновляем данные в queryClient для всех активных запросов
      queryClient.setQueryData(['notifications', filter], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.map(notif => 
            notif.id === variables 
              ? { ...notif, is_read: true }
              : notif
          ),
          unread_count: Math.max(0, (oldData.unread_count || 0) - 1)
        };
      });
      
      // Также обновляем данные для фильтра 'all'
      queryClient.setQueryData(['notifications', 'all'], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.map(notif => 
            notif.id === variables 
              ? { ...notif, is_read: true }
              : notif
          ),
          unread_count: Math.max(0, (oldData.unread_count || 0) - 1)
        };
      });
      
      toast.success('Уведомление отмечено как прочитанное');
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const markAllAsReadMutation = useMutation(notificationsAPI.markAllAsRead, {
    onSuccess: () => {
      // Обновляем данные в queryClient для всех активных запросов
      queryClient.setQueryData(['notifications', filter], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.map(notif => ({ ...notif, is_read: true })),
          unread_count: 0
        };
      });
      
      // Также обновляем данные для фильтра 'all'
      queryClient.setQueryData(['notifications', 'all'], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.map(notif => ({ ...notif, is_read: true })),
          unread_count: 0
        };
      });
      
      toast.success('Все уведомления отмечены как прочитанные');
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const deleteNotificationMutation = useMutation(notificationsAPI.deleteNotification, {
    onSuccess: (data, variables) => {
      // Удаляем уведомление из queryClient
      queryClient.setQueryData(['notifications', filter], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.filter(notif => notif.id !== variables)
        };
      });
      
      // Также обновляем данные для фильтра 'all'
      queryClient.setQueryData(['notifications', 'all'], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.filter(notif => notif.id !== variables)
        };
      });
      
      toast.success('Уведомление удалено');
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const deleteReadNotificationsMutation = useMutation(notificationsAPI.deleteReadNotifications, {
    onSuccess: () => {
      // Удаляем прочитанные уведомления из queryClient
      queryClient.setQueryData(['notifications', filter], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.filter(notif => !notif.is_read)
        };
      });
      
      // Также обновляем данные для фильтра 'all'
      queryClient.setQueryData(['notifications', 'all'], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.filter(notif => !notif.is_read)
        };
      });
      
      toast.success('Прочитанные уведомления удалены');
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  // Функция для перехода в профиль пользователя
  const handleViewProfile = (username) => {
    if (username) {
      navigate(`/profile/${username}`);
    }
  };

  // Функция для определения, можно ли перейти в профиль
  const canViewProfile = (notification) => {
    // Можно перейти в профиль для уведомлений, где есть информация о пользователе
    return notification.from_user && 
           ['like', 'superlike', 'gift', 'profile_visit', 'image_like', 'rating', 'comment'].includes(notification.type);
  };

  // Обработчики
  const handleMarkAsRead = (id) => {
    // Добавляем ID в множество анимирующих уведомлений
    setAnimatingOut(prev => new Set(prev).add(id));
    
    // Запускаем мутацию
    markAsReadMutation.mutate(id);
    
    // Если фильтр "Непрочитанные", то скрываем уведомление через анимацию
    if (filter === 'unread') {
      setTimeout(() => {
        setAnimatingOut(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 300); // Время анимации
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Удалить это уведомление?')) {
      deleteNotificationMutation.mutate(id);
    }
  };

  const handleMarkAllAsRead = () => {
    if (window.confirm('Отметить все уведомления как прочитанные?')) {
      markAllAsReadMutation.mutate();
    }
  };

  const handleDeleteRead = () => {
    if (window.confirm('Удалить все прочитанные уведомления?')) {
      deleteReadNotificationsMutation.mutate();
    }
  };

  // Фильтры
  const filterTabs = useMemo(() => [
    { key: 'all', label: 'Все', count: notifications.length },
    { key: 'unread', label: 'Непрочитанные', count: currentUnreadCount },
    { key: 'match', label: '💕 Мэтчи', count: countByType.match || 0 },
    { key: 'message', label: 'Сообщения', count: countByType.message || 0 },
    { key: 'like', label: 'Лайки', count: countByType.like || 0 },
    { key: 'gift', label: 'Подарки', count: countByType.gift || 0 },
    { key: 'system', label: 'Системные', count: countByType.system || 0 }
  ], [notifications.length, currentUnreadCount, countByType]);

  if (isLoading) {
    return (
      <NotificationsContainer>
        <ContentCard>
          <LoadingSpinner />
        </ContentCard>
      </NotificationsContainer>
    );
  }

  return (
    <NotificationsContainer>
      <ContentCard $maxWidth="1000px">
        <FlexContainer $justify="space-between" $align="center" $wrap>
          <SectionTitle>
            <BellIcon />
            Уведомления
          </SectionTitle>
          <Button $size="small" onClick={() => refetch()}>
            Обновить
          </Button>
        </FlexContainer>

        <NotificationsHeader>
          <FilterTabs>
            {filterTabs.map(tab => (
              <FilterTab
                key={tab.key}
                $active={filter === tab.key}
                $count={tab.key === 'unread' ? unreadCount : 0}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
              </FilterTab>
            ))}
          </FilterTabs>

          <BulkActions>
            {currentUnreadCount > 0 && (
              <Button
                $size="small"
                $variant="secondary"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isLoading}
              >
                <CheckIcon />
                Отметить все
              </Button>
            )}
            
            <Button
              $size="small"
              $variant="danger"
              onClick={handleDeleteRead}
              disabled={deleteReadNotificationsMutation.isLoading}
            >
              <TrashIcon />
              Удалить прочитанные
            </Button>
          </BulkActions>
        </NotificationsHeader>

        {filteredNotifications.length === 0 ? (
          <EmptyState>
            <div className="icon">🔔</div>
            <h3>Нет уведомлений</h3>
            <p>
              {filter === 'unread' 
                ? 'У вас нет непрочитанных уведомлений'
                : 'Здесь будут отображаться ваши уведомления'
              }
            </p>
          </EmptyState>
        ) : (
          <NotificationsList>
            <AnimatePresence>
              {filteredNotifications.map((notification) => {
                // Специальная обработка для мэтч-уведомлений
                if (notification.type === 'match') {
                  return (
                    <MatchNotification
                      key={notification.id}
                      notification={notification}
                      onDismiss={() => handleMarkAsRead(notification.id)}
                      onStartChat={(username) => {
                        // Перенаправляем в чат
                        window.location.href = `/chat/${username}`;
                      }}
                      isAnimatingOut={animatingOut.has(notification.id)}
                    />
                  );
                }

                // Обычные уведомления
                return (
                  <NotificationItem
                    key={notification.id}
                    $color={getNotificationColor(notification.type)}
                    $isRead={notification.is_read}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: animatingOut.has(notification.id) ? 0 : 1, 
                      y: animatingOut.has(notification.id) ? -20 : 0,
                      scale: animatingOut.has(notification.id) ? 0.8 : 1
                    }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <NotificationContent>
                      <NotificationIcon $color={getNotificationColor(notification.type)}>
                        {getNotificationIcon(notification.type)}
                      </NotificationIcon>
                      
                      <NotificationDetails>
                        <NotificationTitle>
                          {notification.title}
                        </NotificationTitle>
                        
                        <NotificationMessage>
                          {notification.type === 'like' && (
                            <span>
                              <strong 
                                style={{ 
                                  color: '#dc3522', 
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => handleViewProfile(notification.from_user)}
                                title="Кликните, чтобы перейти в профиль"
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'scale(1.05)';
                                  e.target.style.color = '#ff6b58';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'scale(1)';
                                  e.target.style.color = '#dc3522';
                                }}
                              >
                                {notification.from_user}
                              </strong> лайкнул вашу анкету!
                            </span>
                          )}
                          {notification.type === 'superlike' && (
                            <span>
                              <strong 
                                style={{ 
                                  color: '#dc3522', 
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => handleViewProfile(notification.from_user)}
                                title="Кликните, чтобы перейти в профиль"
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'scale(1.05)';
                                  e.target.style.color = '#ff6b58';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'scale(1)';
                                  e.target.style.color = '#dc3522';
                                }}
                              >
                                {notification.from_user}
                              </strong> отправил вам суперлайк
                              {notification.data?.message && (
                                <span>: <i>«{notification.data.message}»</i></span>
                              )}
                            </span>
                          )}
                          {notification.type === 'gift' && (
                            <span>
                              <strong 
                                style={{ 
                                  color: '#dc3522', 
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => handleViewProfile(notification.from_user)}
                                title="Кликните, чтобы перейти в профиль"
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'scale(1.05)';
                                  e.target.style.color = '#ff6b58';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'scale(1)';
                                  e.target.style.color = '#dc3522';
                                }}
                              >
                                {notification.from_user}
                              </strong> отправил вам подарок
                              {notification.data?.gift_type && (
                                <span>: {notification.data.gift_type}</span>
                              )}
                            </span>
                          )}
                          {notification.type === 'profile_visit' && (
                            <span>
                              <strong 
                                style={{ 
                                  color: '#dc3522', 
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => handleViewProfile(notification.from_user)}
                                title="Кликните, чтобы перейти в профиль"
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'scale(1.05)';
                                  e.target.style.color = '#ff6b58';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'scale(1)';
                                  e.target.style.color = '#dc3522';
                                }}
                              >
                                {notification.from_user}
                              </strong> посмотрел ваш профиль
                            </span>
                          )}
                          {notification.type === 'image_like' && (
                            <span>
                              <strong 
                                style={{ 
                                  color: '#dc3522', 
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => handleViewProfile(notification.from_user)}
                                title="Кликните, чтобы перейти в профиль"
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'scale(1.05)';
                                  e.target.style.color = '#ff6b58';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'scale(1)';
                                  e.target.style.color = '#dc3522';
                                }}
                              >
                                {notification.from_user}
                              </strong> лайкнул ваше фото
                            </span>
                          )}
                          {notification.type === 'rating' && (
                            <span>
                              <strong 
                                style={{ 
                                  color: '#dc3522', 
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => handleViewProfile(notification.from_user)}
                                title="Кликните, чтобы перейти в профиль"
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'scale(1.05)';
                                  e.target.style.color = '#ff6b58';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'scale(1)';
                                  e.target.style.color = '#dc3522';
                                }}
                              >
                                {notification.from_user}
                              </strong> оценил ваш профиль
                            </span>
                          )}
                          {notification.type === 'comment' && (
                            <span>
                              <strong 
                                style={{ 
                                  color: '#dc3522', 
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onClick={() => handleViewProfile(notification.from_user)}
                                title="Кликните, чтобы перейти в профиль"
                                onMouseEnter={(e) => {
                                  e.target.style.transform = 'scale(1.05)';
                                  e.target.style.color = '#ff6b58';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.transform = 'scale(1)';
                                  e.target.style.color = '#dc3522';
                                }}
                              >
                                {notification.from_user}
                              </strong> оставил комментарий
                            </span>
                          )}
                          {!['like', 'superlike', 'gift', 'profile_visit', 'image_like', 'rating', 'comment'].includes(notification.type) && (
                            notification.message
                          )}
                        </NotificationMessage>
                        
                        <NotificationMeta>
                          <NotificationTime>
                            {apiUtils.formatTimeAgo(notification.created_at)}
                          </NotificationTime>
                          
                          <NotificationPriority $priority={notification.priority}>
                            {notification.priority}
                          </NotificationPriority>
                          
                          {notification.from_user && (
                            <span 
                              style={{ 
                                fontSize: '12px', 
                                color: '#dc3522', 
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => handleViewProfile(notification.from_user)}
                              title="Кликните, чтобы перейти в профиль"
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.05)';
                                e.target.style.color = '#ff6b58';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.color = '#dc3522';
                              }}
                            >
                              от {notification.from_user}
                            </span>
                          )}
                        </NotificationMeta>
                      </NotificationDetails>
                      
                      <NotificationActions>
                        {/* Кнопка для перехода в профиль */}
                        {canViewProfile(notification) && (
                          <ProfileButton
                            $size="35px"
                            $variant="secondary"
                            onClick={() => handleViewProfile(notification.from_user)}
                            title="Посмотреть профиль"
                          >
                            👤
                          </ProfileButton>
                        )}
                        
                        {!notification.is_read && (
                          <IconButton
                            $size="35px"
                            $variant="secondary"
                            onClick={() => handleMarkAsRead(notification.id)}
                            title="Отметить как прочитанное"
                          >
                            <CheckIcon />
                          </IconButton>
                        )}
                        
                        <IconButton
                          $size="35px"
                          $variant="secondary"
                          onClick={() => handleDelete(notification.id)}
                          title="Удалить уведомление"
                        >
                          <TrashIcon />
                        </IconButton>
                      </NotificationActions>
                    </NotificationContent>
                  </NotificationItem>
                );
              })}
            </AnimatePresence>
          </NotificationsList>
        )}
      </ContentCard>
    </NotificationsContainer>
  );
};

export default Notifications;