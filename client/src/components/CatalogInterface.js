import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 20px 0;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  color: #2d3748;
  margin-bottom: 20px;
`;

const Placeholder = styled.div`
  background: #f7fafc;
  border: 2px dashed #cbd5e0;
  border-radius: 15px;
  padding: 60px 20px;
  color: #718096;
  font-size: 1.1rem;
`;

const CatalogInterface = () => {
  return (
    <Container>
      <Title>Каталог пользователей</Title>
      <Placeholder>
        Здесь будет каталог пользователей для просмотра
      </Placeholder>
    </Container>
  );
};

export default CatalogInterface;
