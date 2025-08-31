import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Иконки
import { 
  ChartIcon, 
  UsersIcon, 
  EyeIcon,
  HeartIcon,
  CalendarIcon,
  TrendingUpIcon
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
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PeriodSelector = styled.div`
  display: flex;
  gap: 10px;
`;

const PeriodButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  background: ${props => props.$active ? '#dc3522' : 'white'};
  color: ${props => props.$active ? 'white' : '#4a5568'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  
  &:hover {
    background: ${props => props.$active ? '#dc3522' : '#f7fafc'};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
`;

const StatCard = styled(motion.div)`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  text-align: center;
`;

const StatIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${props => props.$color || 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  color: white;
  font-size: 1.5rem;
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #718096;
  margin-bottom: 10px;
`;

const StatChange = styled.div`
  font-size: 0.8rem;
  color: ${props => props.$positive ? '#48bb78' : '#e53e3e'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
`;

const ChartCard = styled(motion.div)`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
`;

const ChartTitle = styled.h3`
  font-size: 1.2rem;
  color: #2d3748;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ChartPlaceholder = styled.div`
  height: 200px;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #718096;
  font-size: 1.1rem;
  border: 2px dashed #cbd5e0;
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
`;

const TableTitle = styled.h3`
  font-size: 1.2rem;
  color: #2d3748;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px;
  background: #f7fafc;
  color: #2d3748;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  color: #4a5568;
`;

const StatusBadge = styled.span`
  background: ${props => {
    switch (props.$status) {
      case 'active': return '#48bb78';
      case 'pending': return '#ed8936';
      case 'inactive': return '#a0aec0';
      default: return '#a0aec0';
    }
  }};
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
`;

const ClubAnalyticsInterface = () => {
  const [period, setPeriod] = useState('week');

  const stats = {
    totalMembers: 156,
    activeMembers: 89,
    totalViews: 2347,
    totalLikes: 567,
    eventsCreated: 12,
    avgEventAttendance: 23,
    memberGrowth: 12.5,
    engagementRate: 8.7
  };

  const topEvents = [
    {
      id: 1,
      name: 'Вечеринка в стиле 80-х',
      date: '2024-02-15',
      participants: 45,
      views: 234,
      likes: 67,
      status: 'active'
    },
    {
      id: 2,
      name: 'Ужин для пар',
      date: '2024-02-20',
      participants: 12,
      views: 156,
      likes: 34,
      status: 'pending'
    },
    {
      id: 3,
      name: 'Нетворкинг вечер',
      date: '2024-02-25',
      participants: 28,
      views: 189,
      likes: 45,
      status: 'active'
    }
  ];

  const memberActivity = [
    {
      name: 'Анна Петрова',
      joinDate: '2024-01-15',
      eventsAttended: 5,
      lastActivity: '2024-02-10',
      status: 'active'
    },
    {
      name: 'Михаил Сидоров',
      joinDate: '2024-01-20',
      eventsAttended: 3,
      lastActivity: '2024-02-08',
      status: 'active'
    },
    {
      name: 'Елена Козлова',
      joinDate: '2024-02-01',
      eventsAttended: 1,
      lastActivity: '2024-02-05',
      status: 'inactive'
    }
  ];

  return (
    <Container>
      <Header>
        <Title>
          <ChartIcon />
          Аналитика клуба
        </Title>
        <PeriodSelector>
          <PeriodButton
            $active={period === 'week'}
            onClick={() => setPeriod('week')}
          >
            Неделя
          </PeriodButton>
          <PeriodButton
            $active={period === 'month'}
            onClick={() => setPeriod('month')}
          >
            Месяц
          </PeriodButton>
          <PeriodButton
            $active={period === 'quarter'}
            onClick={() => setPeriod('quarter')}
          >
            Квартал
          </PeriodButton>
        </PeriodSelector>
      </Header>

      {/* Основная статистика */}
      <StatsGrid>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <StatIcon $color="linear-gradient(135deg, #48bb78 0%, #38a169 100%)">
            <UsersIcon />
          </StatIcon>
          <StatNumber>{stats.totalMembers}</StatNumber>
          <StatLabel>Всего участников</StatLabel>
          <StatChange $positive={stats.memberGrowth > 0}>
            <TrendingUpIcon />
            +{stats.memberGrowth}% за период
          </StatChange>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <StatIcon $color="linear-gradient(135deg, #3182ce 0%, #2c5aa0 100%)">
            <EyeIcon />
          </StatIcon>
          <StatNumber>{stats.totalViews}</StatNumber>
          <StatLabel>Просмотров объявлений</StatLabel>
          <StatChange $positive={true}>
            <TrendingUpIcon />
            +15.3% за период
          </StatChange>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <StatIcon $color="linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)">
            <HeartIcon />
          </StatIcon>
          <StatNumber>{stats.totalLikes}</StatNumber>
          <StatLabel>Лайков получено</StatLabel>
          <StatChange $positive={true}>
            <TrendingUpIcon />
            +8.7% за период
          </StatChange>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <StatIcon $color="linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)">
            <CalendarIcon />
          </StatIcon>
          <StatNumber>{stats.eventsCreated}</StatNumber>
          <StatLabel>Мероприятий создано</StatLabel>
          <StatChange $positive={true}>
            <TrendingUpIcon />
            +25% за период
          </StatChange>
        </StatCard>
      </StatsGrid>

      {/* Графики */}
      <ChartsGrid>
        <ChartCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <ChartTitle>
            <TrendingUpIcon />
            Рост участников
          </ChartTitle>
          <ChartPlaceholder>
            График роста участников по времени
          </ChartPlaceholder>
        </ChartCard>

        <ChartCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <ChartTitle>
            <HeartIcon />
            Вовлеченность
          </ChartTitle>
          <ChartPlaceholder>
            График вовлеченности участников
          </ChartPlaceholder>
        </ChartCard>

        <ChartCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <ChartTitle>
            <CalendarIcon />
            Посещаемость мероприятий
          </ChartTitle>
          <ChartPlaceholder>
            График посещаемости мероприятий
          </ChartPlaceholder>
        </ChartCard>

        <ChartCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          <ChartTitle>
            <EyeIcon />
            Просмотры объявлений
          </ChartTitle>
          <ChartPlaceholder>
            График просмотров объявлений
          </ChartPlaceholder>
        </ChartCard>
      </ChartsGrid>

      {/* Топ мероприятий */}
      <TableContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      >
        <TableTitle>
          <CalendarIcon />
          Топ мероприятий
        </TableTitle>
        <Table>
          <thead>
            <tr>
              <Th>Название</Th>
              <Th>Дата</Th>
              <Th>Участники</Th>
              <Th>Просмотры</Th>
              <Th>Лайки</Th>
              <Th>Статус</Th>
            </tr>
          </thead>
          <tbody>
            {topEvents.map((event) => (
              <tr key={event.id}>
                <Td>{event.name}</Td>
                <Td>{new Date(event.date).toLocaleDateString('ru-RU')}</Td>
                <Td>{event.participants}</Td>
                <Td>{event.views}</Td>
                <Td>{event.likes}</Td>
                <Td>
                  <StatusBadge $status={event.status}>
                    {event.status === 'active' && 'Активное'}
                    {event.status === 'pending' && 'Ожидает'}
                    {event.status === 'inactive' && 'Неактивное'}
                  </StatusBadge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      {/* Активность участников */}
      <TableContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.9 }}
        style={{ marginTop: '30px' }}
      >
        <TableTitle>
          <UsersIcon />
          Активность участников
        </TableTitle>
        <Table>
          <thead>
            <tr>
              <Th>Участник</Th>
              <Th>Дата вступления</Th>
              <Th>Мероприятий посещено</Th>
              <Th>Последняя активность</Th>
              <Th>Статус</Th>
            </tr>
          </thead>
          <tbody>
            {memberActivity.map((member, index) => (
              <tr key={index}>
                <Td>{member.name}</Td>
                <Td>{new Date(member.joinDate).toLocaleDateString('ru-RU')}</Td>
                <Td>{member.eventsAttended}</Td>
                <Td>{new Date(member.lastActivity).toLocaleDateString('ru-RU')}</Td>
                <Td>
                  <StatusBadge $status={member.status}>
                    {member.status === 'active' && 'Активный'}
                    {member.status === 'inactive' && 'Неактивный'}
                  </StatusBadge>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default ClubAnalyticsInterface;
