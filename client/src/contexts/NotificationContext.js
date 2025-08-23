import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { notificationsAPI } from '../services/api';
import MatchPopup from '../components/MatchPopup';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [activePopups, setActivePopups] = useState([]);
  const [lastChecked, setLastChecked] = useState(Date.now());
  const [unreadCount, setUnreadCount] = useState(0);

  // Проверяем новые уведомления каждые 15 секунд
  const { data: notificationsCount } = useQuery(
    'unread-notifications-count',
    () => notificationsAPI.getUnreadCount(),
    {
      refetchInterval: 15000,
      onSuccess: (data) => {
        setUnreadCount(data?.total_unread || 0);
      }
    }
  );

  // Проверяем новые уведомления для попапов
  const { data: latestNotifications } = useQuery(
    ['latest-notifications', lastChecked],
    () => notificationsAPI.getNotifications({
      unread: true,
      limit: 10
    }),
    {
      refetchInterval: 10000,
      onSuccess: (data) => {
        if (data?.notifications) {
          checkForNewMatchNotifications(data.notifications);
        }
      }
    }
  );

  const checkForNewMatchNotifications = (notifications) => {
    const now = Date.now();
    const recentTime = now - (2 * 60 * 1000); // Последние 2 минуты
    
    const newMatchNotifications = notifications.filter(notification => {
      const notificationTime = new Date(notification.created_at).getTime();
      return (
        notification.type === 'match' &&
        notificationTime > recentTime &&
        notificationTime > lastChecked &&
        !activePopups.find(popup => popup.id === notification.id)
      );
    });

    if (newMatchNotifications.length > 0) {
      newMatchNotifications.forEach(notification => {
        showMatchPopup(notification);
      });
      setLastChecked(now);
    }
  };

  const showMatchPopup = (notification) => {
    const popup = {
      id: notification.id,
      notification,
      timestamp: Date.now()
    };

    setActivePopups(prev => [...prev, popup]);

    // Автоматически убираем попап через 8 секунд
    setTimeout(() => {
      removePopup(notification.id);
    }, 8000);
  };

  const removePopup = (notificationId) => {
    setActivePopups(prev => prev.filter(popup => popup.id !== notificationId));
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      removePopup(notificationId);
      // Обновляем счетчик
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const showCustomMatchPopup = (matchData) => {
    const notification = {
      id: `custom-${Date.now()}`,
      type: 'match',
      title: 'Взаимная симпатия!',
      message: `У вас взаимная симпатия с ${matchData.username}!`,
      from_user: matchData.username,
      from_user_data: matchData.userData,
      data: { match_user: matchData.username },
      created_at: new Date().toISOString(),
      priority: 'high'
    };

    showMatchPopup(notification);
  };

  const contextValue = {
    unreadCount,
    activePopups,
    showMatchPopup: showCustomMatchPopup,
    removePopup,
    markNotificationAsRead
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Рендерим активные попапы */}
      {activePopups.map(popup => (
        <MatchPopup
          key={popup.id}
          notification={popup.notification}
          onClose={() => removePopup(popup.id)}
          onStartChat={(username) => {
            markNotificationAsRead(popup.id);
            // Навигация происходит в самом компоненте
          }}
          autoCloseDelay={8000}
        />
      ))}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;