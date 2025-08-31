import React from 'react';
import styled from 'styled-components';
import { useQuery } from 'react-query';
import BalanceTopUp from '../components/UI/BalanceTopUp';
import { LoadingSpinner } from '../components/UI';
import Navigation from '../components/Navigation';
import { api } from '../services/api';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
`;



const ContentWrapper = styled.div`
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const BalanceTopUpPage = () => {

  // Получаем данные пользователя для отображения текущего баланса
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.get('/auth/me'),
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  const handleTopUpSuccess = () => {
    // Обновляем данные пользователя после успешного пополнения
    window.location.reload();
  };

  const handleClose = () => {
    // Возвращаемся на предыдущую страницу
    navigate(-1);
  };

  if (isLoadingUser) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  return (
    <>
      <Navigation />
      <PageContainer>
        <ContentWrapper>
          <BalanceTopUp
            onClose={handleClose}
            currentBalance={userData?.balance || 0}
            onSuccess={handleTopUpSuccess}
          />
        </ContentWrapper>
      </PageContainer>
    </>
  );
};

export default BalanceTopUpPage;
