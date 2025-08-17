import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { adminAPI, apiUtils } from '../services/api';

const AdminContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background};
`;

const AdminHeader = styled.div`
  background: ${props => props.theme.colors.primary};
  color: white;
  padding: ${props => props.theme.spacing.lg};
  
  h1 {
    margin: 0;
    font-size: ${props => props.theme.fonts.sizes.xlarge};
  }
  
  p {
    margin: ${props => props.theme.spacing.xs} 0 0 0;
    opacity: 0.9;
  }
`;

const AdminContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.lg};
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: ${props => props.theme.spacing.lg};
  background: white;
  border-radius: ${props => props.theme.borderRadius};
  overflow: hidden;
  box-shadow: ${props => props.theme.shadow};
`;

const Tab = styled.button`
  flex: 1;
  padding: ${props => props.theme.spacing.md};
  border: none;
  background: none;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  
  &.active {
    background: ${props => props.theme.colors.primary};
    color: white;
  }
  
  &:hover:not(.active) {
    background: ${props => props.theme.colors.background};
  }
`;

const Card = styled.div`
  background: white;
  border-radius: ${props => props.theme.borderRadius};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadow};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const CardTitle = styled.h3`
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  color: ${props => props.theme.colors.primary};
  font-size: ${props => props.theme.fonts.sizes.large};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const StatCard = styled.div`
  background: white;
  border-radius: ${props => props.theme.borderRadius};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadow};
  text-align: center;
  
  .number {
    font-size: 2rem;
    font-weight: bold;
    color: ${props => props.theme.colors.primary};
    margin-bottom: ${props => props.theme.spacing.xs};
  }
  
  .label {
    color: ${props => props.theme.colors.textLight};
    font-size: ${props => props.theme.fonts.sizes.small};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    text-align: left;
    padding: ${props => props.theme.spacing.sm};
    border-bottom: 1px solid ${props => props.theme.colors.border};
  }
  
  th {
    background: ${props => props.theme.colors.background};
    font-weight: bold;
    color: ${props => props.theme.colors.text};
  }
  
  tr:hover {
    background: ${props => props.theme.colors.background};
  }
`;

const Button = styled.button`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border: none;
  border-radius: ${props => props.theme.borderRadius};
  cursor: pointer;
  font-size: ${props => props.theme.fonts.sizes.small};
  font-weight: bold;
  transition: all 0.2s ease;
  margin-right: ${props => props.theme.spacing.xs};
  
  &.primary {
    background: ${props => props.theme.colors.primary};
    color: white;
    
    &:hover {
      background: ${props => props.theme.colors.primaryDark};
    }
  }
  
  &.danger {
    background: ${props => props.theme.colors.error};
    color: white;
    
    &:hover {
      background: #d32f2f;
    }
  }
  
  &.warning {
    background: #ff9800;
    color: white;
    
    &:hover {
      background: #f57c00;
    }
  }
  
  &.success {
    background: #4caf50;
    color: white;
    
    &:hover {
      background: #388e3c;
    }
  }
  
  &:disabled {
    background: ${props => props.theme.colors.border};
    cursor: not-allowed;
  }
`;

const StatusBadge = styled.span`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: 12px;
  font-size: ${props => props.theme.fonts.sizes.small};
  font-weight: bold;
  
  &.active {
    background: #4caf50;
    color: white;
  }
  
  &.banned {
    background: ${props => props.theme.colors.error};
    color: white;
  }
  
  &.pending {
    background: #ff9800;
    color: white;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  align-items: center;
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  font-size: ${props => props.theme.fonts.sizes.medium};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Select = styled.select`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  font-size: ${props => props.theme.fonts.sizes.medium};
  background: white;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userFilters, setUserFilters] = useState({
    search: '',
    status: ''
  });
  const [adsFilters, setAdsFilters] = useState({
    search: '',
    status: ''
  });
  
  const queryClient = useQueryClient();
  const currentUser = apiUtils.getCurrentUser();

  // Проверка прав администратора
  if (!currentUser?.is_admin) {
    return (
      <AdminContainer>
        <AdminContent>
          <Card>
            <CardTitle>Доступ запрещен</CardTitle>
            <p>У вас нет прав для доступа к административной панели.</p>
          </Card>
        </AdminContent>
      </AdminContainer>
    );
  }

  // Запросы данных
  const { data: stats } = useQuery('admin-stats', adminAPI.getStats);
  
  const { data: users = [], isLoading: usersLoading } = useQuery(
    ['admin-users', userFilters],
    () => adminAPI.getUsers(userFilters),
    {
      enabled: activeTab === 'users',
      keepPreviousData: true
    }
  );

  const { data: ads = [], isLoading: adsLoading } = useQuery(
    ['admin-ads', adsFilters],
    () => adminAPI.getAds(adsFilters),
    {
      enabled: activeTab === 'ads',
      keepPreviousData: true
    }
  );

  const { data: reports = [] } = useQuery(
    'admin-reports',
    adminAPI.getReports,
    {
      enabled: activeTab === 'reports'
    }
  );

  // Мутации
  const userActionMutation = useMutation(
    ({ userId, action }) => adminAPI.userAction(userId, action),
    {
      onSuccess: (data, variables) => {
        const actionLabels = {
          ban: 'заблокирован',
          unban: 'разблокирован',
          delete: 'удален',
          verify: 'верифицирован'
        };
        toast.success(`Пользователь ${actionLabels[variables.action]}!`);
        queryClient.invalidateQueries('admin-users');
        queryClient.invalidateQueries('admin-stats');
      },
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  const adActionMutation = useMutation(
    ({ adId, action }) => adminAPI.adAction(adId, action),
    {
      onSuccess: (data, variables) => {
        const actionLabels = {
          approve: 'одобрено',
          reject: 'отклонено',
          delete: 'удалено'
        };
        toast.success(`Объявление ${actionLabels[variables.action]}!`);
        queryClient.invalidateQueries('admin-ads');
        queryClient.invalidateQueries('admin-stats');
      },
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  const reportActionMutation = useMutation(
    ({ reportId, action }) => adminAPI.reportAction(reportId, action),
    {
      onSuccess: () => {
        toast.success('Жалоба обработана!');
        queryClient.invalidateQueries('admin-reports');
      },
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  // Обработчики
  const handleUserAction = (userId, action) => {
    const confirmMessages = {
      ban: 'Заблокировать пользователя?',
      unban: 'Разблокировать пользователя?',
      delete: 'Удалить пользователя? Это действие необратимо!',
      verify: 'Верифицировать пользователя?'
    };

    if (window.confirm(confirmMessages[action])) {
      userActionMutation.mutate({ userId, action });
    }
  };

  const handleAdAction = (adId, action) => {
    const confirmMessages = {
      approve: 'Одобрить объявление?',
      reject: 'Отклонить объявление?',
      delete: 'Удалить объявление?'
    };

    if (window.confirm(confirmMessages[action])) {
      adActionMutation.mutate({ adId, action });
    }
  };

  const handleReportAction = (reportId, action) => {
    reportActionMutation.mutate({ reportId, action });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminContainer>
      <AdminHeader>
        <h1>Административная панель</h1>
        <p>Управление платформой SwingFox</p>
      </AdminHeader>

      <AdminContent>
        <TabsContainer>
          <Tab
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Дашборд
          </Tab>
          <Tab
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            Пользователи
          </Tab>
          <Tab
            className={activeTab === 'ads' ? 'active' : ''}
            onClick={() => setActiveTab('ads')}
          >
            Объявления
          </Tab>
          <Tab
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => setActiveTab('reports')}
          >
            Жалобы
          </Tab>
        </TabsContainer>

        {activeTab === 'dashboard' && (
          <>
            <StatsGrid>
              <StatCard>
                <div className="number">{stats?.total_users || 0}</div>
                <div className="label">Всего пользователей</div>
              </StatCard>
              <StatCard>
                <div className="number">{stats?.active_users || 0}</div>
                <div className="label">Активных пользователей</div>
              </StatCard>
              <StatCard>
                <div className="number">{stats?.total_ads || 0}</div>
                <div className="label">Всего объявлений</div>
              </StatCard>
              <StatCard>
                <div className="number">{stats?.pending_reports || 0}</div>
                <div className="label">Новых жалоб</div>
              </StatCard>
            </StatsGrid>

            <Card>
              <CardTitle>Последняя активность</CardTitle>
              <Table>
                <thead>
                  <tr>
                    <th>Время</th>
                    <th>Пользователь</th>
                    <th>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recent_activity?.map((activity, index) => (
                    <tr key={index}>
                      <td>{formatDate(activity.timestamp)}</td>
                      <td>@{activity.user}</td>
                      <td>{activity.action}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </>
        )}

        {activeTab === 'users' && (
          <>
            <SearchContainer>
              <Input
                type="text"
                placeholder="Поиск пользователей..."
                value={userFilters.search}
                onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value }))}
              />
              <Select
                value={userFilters.status}
                onChange={(e) => setUserFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">Все статусы</option>
                <option value="active">Активные</option>
                <option value="banned">Заблокированные</option>
                <option value="verified">Верифицированные</option>
              </Select>
            </SearchContainer>

            <Card>
              <CardTitle>Пользователи</CardTitle>
              {usersLoading ? (
                <div>Загрузка...</div>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <th>Логин</th>
                      <th>Email</th>
                      <th>Регистрация</th>
                      <th>Статус</th>
                      <th>Последний вход</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>@{user.login}</td>
                        <td>{user.email}</td>
                        <td>{formatDate(user.created_at)}</td>
                        <td>
                          <StatusBadge className={user.banned ? 'banned' : 'active'}>
                            {user.banned ? 'Заблокирован' : 'Активен'}
                          </StatusBadge>
                          {user.verified && <StatusBadge className="success">Верифицирован</StatusBadge>}
                        </td>
                        <td>{user.last_seen ? formatDate(user.last_seen) : 'Никогда'}</td>
                        <td>
                          {user.banned ? (
                            <Button 
                              className="success"
                              onClick={() => handleUserAction(user.id, 'unban')}
                            >
                              Разблокировать
                            </Button>
                          ) : (
                            <Button 
                              className="warning"
                              onClick={() => handleUserAction(user.id, 'ban')}
                            >
                              Заблокировать
                            </Button>
                          )}
                          {!user.verified && (
                            <Button 
                              className="primary"
                              onClick={() => handleUserAction(user.id, 'verify')}
                            >
                              Верифицировать
                            </Button>
                          )}
                          <Button 
                            className="danger"
                            onClick={() => handleUserAction(user.id, 'delete')}
                          >
                            Удалить
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          </>
        )}

        {activeTab === 'ads' && (
          <>
            <SearchContainer>
              <Input
                type="text"
                placeholder="Поиск объявлений..."
                value={adsFilters.search}
                onChange={(e) => setAdsFilters(prev => ({ ...prev, search: e.target.value }))}
              />
              <Select
                value={adsFilters.status}
                onChange={(e) => setAdsFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">Все статусы</option>
                <option value="pending">На модерации</option>
                <option value="approved">Одобренные</option>
                <option value="rejected">Отклоненные</option>
              </Select>
            </SearchContainer>

            <Card>
              <CardTitle>Объявления</CardTitle>
              {adsLoading ? (
                <div>Загрузка...</div>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <th>Заголовок</th>
                      <th>Автор</th>
                      <th>Тип</th>
                      <th>Создано</th>
                      <th>Статус</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map(ad => (
                      <tr key={ad.id}>
                        <td>{ad.title}</td>
                        <td>@{ad.author}</td>
                        <td>{ad.type}</td>
                        <td>{formatDate(ad.created_at)}</td>
                        <td>
                          <StatusBadge className={ad.status || 'pending'}>
                            {ad.status === 'approved' ? 'Одобрено' : 
                             ad.status === 'rejected' ? 'Отклонено' : 'На модерации'}
                          </StatusBadge>
                        </td>
                        <td>
                          {(!ad.status || ad.status === 'pending') && (
                            <>
                              <Button 
                                className="success"
                                onClick={() => handleAdAction(ad.id, 'approve')}
                              >
                                Одобрить
                              </Button>
                              <Button 
                                className="warning"
                                onClick={() => handleAdAction(ad.id, 'reject')}
                              >
                                Отклонить
                              </Button>
                            </>
                          )}
                          <Button 
                            className="danger"
                            onClick={() => handleAdAction(ad.id, 'delete')}
                          >
                            Удалить
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>
          </>
        )}

        {activeTab === 'reports' && (
          <Card>
            <CardTitle>Жалобы пользователей</CardTitle>
            <Table>
              <thead>
                <tr>
                  <th>От кого</th>
                  <th>На кого</th>
                  <th>Причина</th>
                  <th>Время</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report.id}>
                    <td>@{report.from_user}</td>
                    <td>@{report.target_user}</td>
                    <td>{report.reason}</td>
                    <td>{formatDate(report.created_at)}</td>
                    <td>
                      <StatusBadge className={report.status || 'pending'}>
                        {report.status === 'resolved' ? 'Решено' : 'Новая'}
                      </StatusBadge>
                    </td>
                    <td>
                      {(!report.status || report.status === 'pending') && (
                        <Button 
                          className="primary"
                          onClick={() => handleReportAction(report.id, 'resolve')}
                        >
                          Закрыть
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
      </AdminContent>
    </AdminContainer>
  );
};

export default Admin;