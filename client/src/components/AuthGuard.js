import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { apiUtils } from '../services/api';

const AuthGuard = ({ children, requireUserAuth = true }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isValidating, setIsValidating] = useState(true);
  const [authType, setAuthType] = useState(null); // 'user' или 'club'
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 AuthGuard: Начинаем проверку авторизации...');
      setIsValidating(true);
      
      try {
        // Проверяем токен пользователя
        const userToken = localStorage.getItem('token');
        const clubToken = localStorage.getItem('clubToken');
        
        console.log('🔍 AuthGuard: Токены найдены:', {
          userToken: userToken ? 'есть' : 'нет',
          clubToken: clubToken ? 'есть' : 'нет'
        });
        
        if (userToken) {
          // Пользователь авторизован
          console.log('🔍 AuthGuard: Проверяем токен пользователя...');
          try {
            await apiUtils.refreshCurrentUser();
            setIsAuthenticated(true);
            setAuthType('user');
            console.log('🔍 AuthGuard: Пользователь аутентифицирован');
          } catch (error) {
            console.warn('🔍 AuthGuard: Токен пользователя невалиден, очищаем авторизацию');
            apiUtils.logout();
            setIsAuthenticated(false);
            setAuthType(null);
          }
        } else if (clubToken) {
          // Клуб авторизован
          console.log('🔍 AuthGuard: Проверяем токен клуба:', clubToken.substring(0, 20) + '...');
          try {
            // Проверяем валидность токена клуба
            console.log('🔍 AuthGuard: Делаем запрос к /api/club/auth/verify...');
            const response = await fetch('/api/club/auth/verify', {
              headers: {
                'Authorization': `Bearer ${clubToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log('🔍 AuthGuard: Ответ от /api/club/auth/verify:', response.status, response.statusText);
            
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

    checkAuth();

    // Слушаем события разлогина
    const handleAuthLogout = () => {
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
  }, [location.pathname]);

  // Показываем загрузку пока проверяем авторизацию
  if (isValidating) {
    return (
      <div className="loading">
        Проверка авторизации...
      </div>
    );
  }

  // Если не авторизован, перенаправляем на логин
  if (!isAuthenticated) {
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