import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { apiUtils } from '../services/api';

const AuthGuard = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isValidating, setIsValidating] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      setIsValidating(true);
      
      try {
        const authenticated = apiUtils.isAuthenticated();
        
        if (!authenticated) {
          setIsAuthenticated(false);
          setIsValidating(false);
          return;
        }

        // Дополнительная проверка валидности токена
        try {
          await apiUtils.refreshCurrentUser();
          setIsAuthenticated(true);
        } catch (error) {
          // Токен невалиден
          console.warn('Токен невалиден, очищаем авторизацию');
          apiUtils.logout();
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        setIsAuthenticated(false);
      } finally {
        setIsValidating(false);
      }
    };

    checkAuth();

    // Слушаем события разлогина
    const handleAuthLogout = () => {
      setIsAuthenticated(false);
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

  // Если авторизован, показываем защищенный контент
  return children;
};

export default AuthGuard;