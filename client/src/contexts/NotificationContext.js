import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { notificationsAPI, apiUtils } from '../services/api';
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
  const navigate = useNavigate();
  const [activePopups, setActivePopups] = useState([]);
  const [lastChecked, setLastChecked] = useState(Date.now());
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isRouterReady, setIsRouterReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Проверяем авторизацию
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = apiUtils.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      // Сбрасываем счетчик уведомлений при разлогине
      if (!authenticated) {
        setUnreadCount(0);
        setActivePopups([]);
      }
    };

    checkAuth();

    // Слушаем события изменения авторизации
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('auth-logout', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-logout', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  // Проверяем, что Router контекст доступен
  useEffect(() => {
    if (navigate && typeof navigate === 'function') {
      setIsRouterReady(true);
      console.log('Router context is ready in NotificationProvider');
    } else {
      console.log('Router context not ready yet in NotificationProvider');
    }
  }, [navigate]);

  // Проверяем, что navigate доступен
  useEffect(() => {
    if (!navigate) {
      console.warn('Navigation not available in NotificationProvider');
    } else {
      console.log('Navigation is available in NotificationProvider');
    }
  }, [navigate]);

  // Проверяем новые уведомления каждые 15 секунд
  const { data: notificationsCount } = useQuery(
    'unread-notifications-count',
    () => notificationsAPI.getUnreadCount(),
    {
      refetchInterval: 15000,
      enabled: isRouterReady && isAuthenticated, // Не запускаем запросы пока роутер не готов И пользователь авторизован
      onSuccess: (data) => {
        setUnreadCount(data?.total_unread || 0);
      },
      onError: (error) => {
        // Если получаем 401, сбрасываем авторизацию
        if (error.response?.status === 401) {
          console.log('Unauthorized in notifications query, resetting auth state');
          setIsAuthenticated(false);
          setUnreadCount(0);
        }
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
      enabled: isRouterReady && isAuthenticated, // Не запускаем запросы пока роутер не готов И пользователь авторизован
      onSuccess: (data) => {
        if (data?.notifications) {
          checkForNewMatchNotifications(data.notifications);
        }
      },
      onError: (error) => {
        // Если получаем 401, сбрасываем авторизацию
        if (error.response?.status === 401) {
          console.log('Unauthorized in latest notifications query, resetting auth state');
          setIsAuthenticated(false);
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
    // Не показываем попапы пока роутер не готов или пользователь не авторизован
    if (!isRouterReady || !isAuthenticated) {
      console.log('Router not ready or user not authenticated, skipping popup:', notification.id);
      return;
    }

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
    // Не показываем попапы пока роутер не готов или пользователь не авторизован
    if (!isRouterReady || !isAuthenticated) {
      console.log('Router not ready or user not authenticated, skipping custom popup');
      return;
    }

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
      
      {/* Рендерим активные попапы только после монтирования, готовности роутера и авторизации */}
      {isMounted && isRouterReady && isAuthenticated && activePopups.map(popup => (
        <MatchPopup
          key={popup.id}
          notification={popup.notification}
          onClose={() => removePopup(popup.id)}
          onStartChat={(username) => {
            markNotificationAsRead(popup.id);
            if (navigate && typeof navigate === 'function') {
              try {
                navigate(`/chat/${username}`);
              } catch (error) {
                console.error('Navigation error:', error);
                // Fallback: could redirect to a different page or show an error
                window.location.href = `/chat/${username}`;
              }
            } else {
              // Fallback if navigate is not available
              window.location.href = `/chat/${username}`;
            }
          }}
          onViewProfile={(username) => {
            markNotificationAsRead(popup.id);
            if (navigate && typeof navigate === 'function') {
              try {
                navigate(`/profiles/${username}`);
              } catch (error) {
                console.error('Navigation error:', error);
                // Fallback: could redirect to a different page or show an error
                window.location.href = `/profiles/${username}`;
              }
            } else {
              // Fallback if navigate is not available
              window.location.href = `/profiles/${username}`;
            }
          }}
          autoCloseDelay={8000}
        />
      ))}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;