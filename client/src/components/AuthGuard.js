import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiUtils } from '../services/api';

const AuthGuard = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = apiUtils.isAuthenticated();
      setIsAuthenticated(authenticated);
    };

    checkAuth();

    // Проверяем авторизацию при изменении localStorage
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Показываем загрузку пока проверяем авторизацию
  if (isAuthenticated === null) {
    return (
      <div className="loading">
        Проверка авторизации...
      </div>
    );
  }

  // Если не авторизован, перенаправляем на логин
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Если авторизован, показываем защищенный контент
  return children;
};

export default AuthGuard;