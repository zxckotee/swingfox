import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Иконки
import { 
  PlusIcon, 
  EditIcon, 
  DeleteIcon, 
  EyeIcon,
  CalendarIcon,
  UsersIcon,
  MapPinIcon
} from './UI';

const Container = styled.div`
  padding: 20px 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  color: #2d3748;
  margin: 0;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(220, 53, 34, 0.3);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
  margin-top: 20px;
`;

const AdCard = styled(motion.div)`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }
`;

const AdHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
`;

const AdTitle = styled.h3`
  font-size: 1.3rem;
  color: #2d3748;
  margin: 0 0 8px 0;
`;

const AdType = styled.span`
  background: ${props => props.$isEvent ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const AdContent = styled.div`
  margin-bottom: 20px;
`;

const AdDescription = styled.p`
  color: #4a5568;
  line-height: 1.6;
  margin: 0 0 15px 0;
`;

const AdDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #718096;
  font-size: 0.9rem;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const AdStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f7fafc;
  border-radius: 10px;
  margin-bottom: 20px;
`;

const StatItem = styled.div`
  text-align: center;
  
  .number {
    font-size: 1.2rem;
    font-weight: 700;
    color: #2d3748;
  }
  
  .label {
    font-size: 0.8rem;
    color: #718096;
    margin-top: 2px;
  }
`;

const AdActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.edit {
    background: #edf2f7;
    color: #4a5568;
    
    &:hover {
      background: #e2e8f0;
    }
  }
  
  &.delete {
    background: #fed7d7;
    color: #c53030;
    
    &:hover {
      background: #feb2b2;
    }
  }
  
  &.view {
    background: #e6fffa;
    color: #2c7a7b;
    
    &:hover {
      background: #b2f5ea;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #718096;
  
  .icon {
    font-size: 4rem;
    margin-bottom: 20px;
    opacity: 0.5;
  }
  
  h3 {
    margin: 0 0 10px 0;
    color: #2d3748;
  }
  
  p {
    margin: 0 0 30px 0;
    line-height: 1.6;
  }
`;

const ClubAdsInterface = () => {
  const [ads, setAds] = useState([
    {
      id: 1,
      title: 'Вечеринка в стиле 80-х',
      type: 'event',
      description: 'Ночь ретро-музыки, диско-атмосфера и незабываемые знакомства!',
      date: '2024-02-15',
      location: 'Москва, ул. Тверская, 15',
      participants: 45,
      maxParticipants: 60,
      views: 234,
      likes: 67
    },
    {
      id: 2,
      title: 'Ужин для пар',
      type: 'ad',
      description: 'Романтический ужин в уютном ресторане для знакомства пар',
      date: '2024-02-20',
      location: 'Санкт-Петербург, Невский пр., 28',
      participants: 12,
      maxParticipants: 20,
      views: 156,
      likes: 34
    }
  ]);

  const handleCreateAd = () => {
    toast.success('Функция создания объявления будет добавлена');
  };

  const handleEditAd = (adId) => {
    toast.success(`Редактирование объявления ${adId}`);
  };

  const handleDeleteAd = (adId) => {
    if (window.confirm('Вы уверены, что хотите удалить это объявление?')) {
      setAds(ads.filter(ad => ad.id !== adId));
      toast.success('Объявление удалено');
    }
  };

  const handleViewAd = (adId) => {
    toast.success(`Просмотр объявления ${adId}`);
  };

  return (
    <Container>
      <Header>
        <Title>Мои объявления</Title>
        <CreateButton onClick={handleCreateAd}>
          <PlusIcon />
          Создать объявление
        </CreateButton>
      </Header>

      {ads.length === 0 ? (
        <EmptyState>
          <div className="icon">📢</div>
          <h3>У вас пока нет объявлений</h3>
          <p>Создайте первое объявление, чтобы привлечь участников к вашим мероприятиям</p>
          <CreateButton onClick={handleCreateAd}>
            <PlusIcon />
            Создать первое объявление
          </CreateButton>
        </EmptyState>
      ) : (
        <Grid>
          {ads.map((ad) => (
            <AdCard
              key={ad.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AdHeader>
                <div>
                  <AdTitle>{ad.title}</AdTitle>
                  <AdType $isEvent={ad.type === 'event'}>
                    {ad.type === 'event' ? 'Мероприятие' : 'Объявление'}
                  </AdType>
                </div>
              </AdHeader>

              <AdContent>
                <AdDescription>{ad.description}</AdDescription>
                
                <AdDetails>
                  <DetailItem>
                    <CalendarIcon />
                    {new Date(ad.date).toLocaleDateString('ru-RU')}
                  </DetailItem>
                  <DetailItem>
                    <MapPinIcon />
                    {ad.location}
                  </DetailItem>
                  <DetailItem>
                    <UsersIcon />
                    {ad.participants}/{ad.maxParticipants} участников
                  </DetailItem>
                </AdDetails>

                <AdStats>
                  <StatItem>
                    <div className="number">{ad.views}</div>
                    <div className="label">Просмотров</div>
                  </StatItem>
                  <StatItem>
                    <div className="number">{ad.likes}</div>
                    <div className="label">Лайков</div>
                  </StatItem>
                  <StatItem>
                    <div className="number">{Math.round((ad.participants / ad.maxParticipants) * 100)}%</div>
                    <div className="label">Заполненность</div>
                  </StatItem>
                </AdStats>
              </AdContent>

              <AdActions>
                <ActionButton className="view" onClick={() => handleViewAd(ad.id)}>
                  <EyeIcon />
                  Просмотр
                </ActionButton>
                <ActionButton className="edit" onClick={() => handleEditAd(ad.id)}>
                  <EditIcon />
                  Редактировать
                </ActionButton>
                <ActionButton className="delete" onClick={() => handleDeleteAd(ad.id)}>
                  <DeleteIcon />
                  Удалить
                </ActionButton>
              </AdActions>
            </AdCard>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ClubAdsInterface;
