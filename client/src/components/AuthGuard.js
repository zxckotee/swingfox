import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { apiUtils } from '../services/api';

const AuthGuard = ({ children, requireUserAuth = true }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isValidating, setIsValidating] = useState(true);
  const [authType, setAuthType] = useState(null); // 'user' или 'club'
  const location = useLocation();
  
  console.log('🔍 AuthGuard: Компонент рендерится, requireUserAuth =', requireUserAuth);
  console.log('🔍 AuthGuard: Текущий путь =', location?.pathname);
  
  // Проверяем токены прямо в рендере
  const userToken = localStorage.getItem('swingfox_token');
  const clubToken = localStorage.getItem('clubToken');
  console.log('🔍 AuthGuard: Токены в localStorage:', {
    userToken: userToken ? 'есть (' + userToken.substring(0, 20) + '...)' : 'нет',
    clubToken: clubToken ? 'есть (' + clubToken.substring(0, 20) + '...)' : 'нет'
  });

  useEffect(() => {
    console.log('🔍 AuthGuard: useEffect сработал, location.pathname =', location?.pathname);
    
    const checkAuth = async () => {
      console.log('🔍 AuthGuard: Начинаем проверку авторизации...');
      setIsValidating(true);
      
      try {
        // Проверяем токен пользователя
        const userToken = localStorage.getItem('swingfox_token');
        const clubToken = localStorage.getItem('clubToken');
        
        console.log('🔍 AuthGuard: Токены найдены:', {
          userToken: userToken ? 'есть' : 'нет',
          clubToken: clubToken ? 'есть' : 'нет'
        });
        
        if (userToken) {
          // Пользователь авторизован
          console.log('🔍 AuthGuard: Проверяем токен пользователя...');
          console.log('🔍 AuthGuard: Токен пользователя:', userToken.substring(0, 20) + '...');
          try {
            console.log('🔍 AuthGuard: Вызываем apiUtils.refreshCurrentUser()...');
            await apiUtils.refreshCurrentUser();
            console.log('🔍 AuthGuard: refreshCurrentUser() успешно выполнен');
            setIsAuthenticated(true);
            setAuthType('user');
            console.log('🔍 AuthGuard: Пользователь аутентифицирован');
          } catch (error) {
            console.error('🔍 AuthGuard: Ошибка refreshCurrentUser():', error);
            console.warn('🔍 AuthGuard: Токен пользователя невалиден, очищаем авторизацию');
            apiUtils.logout();
            setIsAuthenticated(false);
            setAuthType(null);
          }
        } else if (clubToken && !userToken) {
          // Клуб авторизован
          console.log('🔍 AuthGuard: Проверяем токен клуба:', clubToken.substring(0, 20) + '...');
          try {
            // Проверяем валидность токена клуба через простой запрос
            console.log('🔍 AuthGuard: Делаем запрос к /api/clubs/profile...');
            const response = await fetch('/api/clubs/profile', {
              headers: {
                'Authorization': `Bearer ${clubToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log('🔍 AuthGuard: Ответ от /api/clubs/profile:', response.status, response.statusText);
            
            if (response.ok) {
              const data = await response.json();
              console.log('🔍 AuthGuard: Данные клуба:', data);
              setIsAuthenticated(true);
              setAuthType('club');
              console.log('🔍 AuthGuard: Клуб аутентифицирован');
            } else {
              // Токен клуба невалиден
              console.warn('🔍 AuthGuard: Токен клуба невалиден, очищаем авторизацию');
              localStorage.removeItem('clubToken');
              setIsAuthenticated(false);
              setAuthType(null);
            }
          } catch (error) {
            console.error('🔍 AuthGuard: Ошибка проверки токена клуба:', error);
            localStorage.removeItem('clubToken');
            setIsAuthenticated(false);
            setAuthType(null);
          }
        } else {
          // Нет токенов
          console.log('🔍 AuthGuard: Нет токенов, пользователь не аутентифицирован');
          setIsAuthenticated(false);
          setAuthType(null);
        }
      } catch (error) {
        console.error('🔍 AuthGuard: Ошибка проверки авторизации:', error);
        setIsAuthenticated(false);
        setAuthType(null);
      } finally {
        setIsValidating(false);
        console.log('🔍 AuthGuard: Проверка завершена');
      }
    };

    console.log('🔍 AuthGuard: Вызываем checkAuth()...');
    checkAuth();

    // Слушаем события разлогина
    const handleAuthLogout = () => {
      console.log('🔍 AuthGuard: Обрабатываем событие разлогина');
      setIsAuthenticated(false);
      setAuthType(null);
    };

    // Проверяем авторизацию при изменении localStorage
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('auth-logout', handleAuthLogout);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location?.pathname]);

  // Простая синхронная проверка токенов при монтировании
  useEffect(() => {
    console.log('🔍 AuthGuard: useEffect для инициализации сработал');
    
    const userToken = localStorage.getItem('swingfox_token');
    const clubToken = localStorage.getItem('clubToken');
    
    console.log('🔍 AuthGuard: Проверяем токены при инициализации:', {
      userToken: userToken ? 'есть' : 'нет',
      clubToken: clubToken ? 'есть' : 'нет'
    });
    
    if (userToken) {
      console.log('🔍 AuthGuard: Найден токен пользователя, устанавливаем авторизацию');
      setIsAuthenticated(true);
      setAuthType('user');
      setIsValidating(false);
    } else if (clubToken) {
      console.log('🔍 AuthGuard: Найден токен клуба, устанавливаем авторизацию');
      setIsAuthenticated(true);
      setAuthType('club');
      setIsValidating(false);
    } else {
      console.log('🔍 AuthGuard: Токены не найдены, пользователь не авторизован');
      setIsAuthenticated(false);
      setAuthType(null);
      setIsValidating(false);
    }
  }, []); // Пустой массив зависимостей - срабатывает только при монтировании

  // Показываем загрузку пока проверяем авторизацию
  if (isValidating) {
    console.log('🔍 AuthGuard: Показываем загрузку, isValidating =', isValidating);
    return (
      <div className="loading">
        Проверка авторизации...
      </div>
    );
  }

  console.log('🔍 AuthGuard: Проверка завершена, isAuthenticated =', isAuthenticated, 'authType =', authType);

  // Если не авторизован, перенаправляем на логин
  if (!isAuthenticated) {
    console.log('🔍 AuthGuard: Пользователь не авторизован, перенаправляем на /login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Если требуется аутентификация пользователя, но авторизован клуб
  if (requireUserAuth && authType === 'club') {
    // Перенаправляем на страницу клубов
    return <Navigate to="/clubs" replace />;
  }



  // Если авторизован (пользователь или клуб), показываем защищенный контент
  return children;
};

export default AuthGuard;