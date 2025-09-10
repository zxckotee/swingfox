import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { catalogAPI, apiUtils } from '../services/api';
// Убираем импорт функций маппинга, так как теперь статусы уже русские
import {
  PageContainer,
  Avatar,
  Button,
  LoadingSpinner,
  FlexContainer,
  Card
} from '../components/UI';

const CatalogContainer = styled(PageContainer)`
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  background: white;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 30px;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  
  h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: center;
  }
  
  p {
    margin: 10px 0 0 0;
    color: #718096;
    text-align: center;
    font-size: 16px;
  }
`;

const FiltersContainer = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  margin: 0 auto 30px auto;
  max-width: 800px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
`;

const FilterSection = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FilterLabel = styled.h3`
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 10px;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f7fafc;
  }
  
  input[type="checkbox"] {
    accent-color: #dc3522;
  }
  
  span {
    font-size: 14px;
    color: #4a5568;
  }
`;

const InputGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InputField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  label {
    font-size: 14px;
    font-weight: 500;
    color: #4a5568;
  }
  
  select, input {
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.2s;
    
    &:focus {
      outline: none;
      border-color: #dc3522;
      box-shadow: 0 0 0 3px rgba(220, 53, 34, 0.1);
    }
  }
`;

const FilterActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
`;

const ProfilesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const ProfileCard = styled(Card)`
  padding: 20px;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  }
`;

const ProfileAvatar = styled(Avatar)`
  margin: 0 auto 15px auto;
`;

const ProfileInfo = styled.div`
  .status {
    background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
    color: white;
    padding: 6px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 10px;
    display: inline-block;
  }
  
  .age {
    color: #718096;
    font-size: 14px;
    margin-bottom: 8px;
  }
  
  .location {
    color: #4a5568;
    font-size: 14px;
    margin-bottom: 15px;
  }
  
  .username {
    font-weight: 600;
    color: #dc3522;
    text-decoration: none;
    font-size: 16px;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #718096;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px; /* Увеличиваем с 300px до 400px как в NoMoreProfiles */
  
  .icon {
    font-size: 72px;
    margin-bottom: 54px;
    opacity: 0.7;
    line-height: 1;
    display: block;
    text-align: center;
    width: 100%;
    transform: translateX(-2px);
  }
  
  h3 {
    margin: 0 0 16px 0;
    font-size: 28px;
    color: #2d3748;
    font-weight: 700;
    line-height: 1.2;
    text-align: center;
    width: 100%;
  }
  
  p {
    margin: 0;
    font-size: 16px;
    max-width: 320px;
    margin-left: auto;
    margin-right: auto;
    color: #718096;
    text-align: center;
    line-height: 1.6;
  }
  
  @media (max-width: 768px) {
    padding: 40px 20px;
    min-height: 300px; /* Увеличиваем с 250px до 300px */
    
    .icon {
      font-size: 56px;
      margin-bottom: 50px;
      transform: translateX(-1px);
    }
    
    h3 {
      font-size: 24px;
      margin-bottom: 14px;
    }
    
    p {
      font-size: 15px;
      max-width: 280px;
    }
  }
  
  @media (max-width: 480px) {
    padding: 30px 16px;
    min-height: 250px; /* Увеличиваем с 200px до 250px */
    
    .icon {
      font-size: 48px;
      margin-bottom: 48px;
      transform: translateX(-1px);
    }
    
    h3 {
      font-size: 22px;
      margin-bottom: 12px;
    }
    
    p {
      font-size: 14px;
      max-width: 260px;
    }
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin: 30px 0;
  
  .page-info {
    color: #718096;
    font-size: 14px;
  }
`;

const Catalog = () => {
  const [filters, setFilters] = useState({
    status: [],
    country: '',
    city: '',
    limit: 14,
    offset: 0
  });

  const [availableFilters, setAvailableFilters] = useState({
    statuses: [],
    countries: [],
    cities: {}
  });

  // Получение доступных фильтров
  const { data: filtersData } = useQuery(
    'catalog-filters',
    catalogAPI.getFilters,
    {
      onSuccess: (data) => {
        setAvailableFilters(data);
      },
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  // Обработчики фильтров
  const handleStatusChange = (status, checked) => {
    setFilters(prev => ({
      ...prev,
      status: checked 
        ? [...prev.status, status]
        : prev.status.filter(s => s !== status),
      offset: 0 // Сбрасываем пагинацию при изменении фильтров
    }));
  };



  // Функция для преобразования фильтров перед отправкой на сервер
  const getServerFilters = () => {
    const serverFilters = { ...filters };
    
    // Статусы уже на русском языке, преобразование не нужно
    return serverFilters;
  };

  // Получение профилей с преобразованными фильтрами
  const { data: profilesData, isLoading, refetch } = useQuery(
    ['catalog-profiles', filters],
    () => catalogAPI.getProfiles(getServerFilters()),
    {
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  const handleCountryChange = (country) => {
    setFilters(prev => ({
      ...prev,
      country,
      city: '', // Сбрасываем город при смене страны
      offset: 0
    }));
  };

  const handleCityChange = (city) => {
    setFilters(prev => ({
      ...prev,
      city,
      offset: 0
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: [],
      country: '',
      city: '',
      limit: 14,
      offset: 0
    });
  };

  const handlePageChange = (newOffset) => {
    setFilters(prev => ({
      ...prev,
      offset: newOffset
    }));
    // Скролл вверх при смене страницы
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Получение городов для выбранной страны
  const availableCities = filters.country && availableFilters.cities[filters.country] 
    ? availableFilters.cities[filters.country] 
    : [];

  return (
    <CatalogContainer>
      <Header>
        <HeaderContent>
          <h1>Каталог анкет</h1>
          <p>Умная система рекомендаций на основе совместимости</p>
          <p style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>
            Показываем всех, но сортируем по вероятности совместимости
          </p>
        </HeaderContent>
      </Header>

      <FiltersContainer>
        <FilterSection>
          <FilterLabel>С кем хотите познакомиться?</FilterLabel>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px', fontStyle: 'italic' }}>
            Фильтры помогают сузить поиск, но система покажет всех подходящих
          </p>
          <p style={{ fontSize: '12px', color: '#888', marginBottom: '15px', fontStyle: 'italic' }}>
            Сортировка по совместимости: статус, возраст, география, образ жизни
          </p>
          <CheckboxGroup>
            {availableFilters.statuses.map(status => (
              <CheckboxItem key={status}>
                <input
                  type="checkbox"
                  checked={filters.status.includes(status)}
                  onChange={(e) => handleStatusChange(status, e.target.checked)}
                />
                <span>{status}</span>
              </CheckboxItem>
            ))}
          </CheckboxGroup>
        </FilterSection>



        <FilterSection>
          <FilterLabel>Местоположение</FilterLabel>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px', fontStyle: 'italic' }}>
            Варианты загружаются из базы географических данных
          </p>
          <InputGroup>
            <InputField>
              <label>Страна</label>
              <select
                value={filters.country}
                onChange={(e) => handleCountryChange(e.target.value)}
              >
                <option value="">Все страны</option>
                {availableFilters.countries.map(country => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </InputField>

            <InputField>
              <label>Город</label>
              <select
                value={filters.city}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={!filters.country}
              >
                <option value="">Все города</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </InputField>
          </InputGroup>
        </FilterSection>

        <FilterActions>
          <Button onClick={() => refetch()}>
            Обновить результаты
          </Button>
          <Button variant="secondary" onClick={handleClearFilters}>
            Очистить фильтры
          </Button>
        </FilterActions>
      </FiltersContainer>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {profilesData?.users && profilesData.users.length > 0 ? (
            <>
              <ProfilesGrid>
                {profilesData.users.map(user => (
                  <ProfileCard key={user.login}>
                    <ProfileAvatar
                      $src={user.ava ? `/uploads/${user.ava}` : ''}
                      $size="80px"
                      $fontSize="32px"
                    >
                      {!user.ava && user.login?.charAt(0).toUpperCase()}
                    </ProfileAvatar>
                    
                    <ProfileInfo>
                                    <div className="status">{user.status}</div>
              <div className="age">{user.age}</div>
              {user.compatibility && (
                <div className="compatibility" style={{ 
                  background: `linear-gradient(90deg, #4CAF50 ${user.compatibility.percentage}%, #e0e0e0 ${user.compatibility.percentage}%)`,
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginTop: '5px'
                }}>
                  Совместимость: {user.compatibility.percentage}%
                </div>
              )}
                      
                      <div className="location">
                        {user.city}, {user.distance}км
                      </div>
                      
                      {/* Дополнительная информация */}
                      <div className="additional-info" style={{ fontSize: '11px', marginTop: '5px', color: '#666' }}>
                        {user.height && <span>📏 {user.height}см </span>}
                        {user.smoking && <span>🚬 {user.smoking.length > 20 ? user.smoking.substring(0, 20) + '...' : user.smoking} </span>}
                      </div>
                      
                      {/* Показываем кого ищет пользователь */}
                      {user.searchStatus && (
                        <div className="search-info" style={{ 
                          fontSize: '11px', 
                          marginTop: '5px', 
                          padding: '5px', 
                          background: 'rgba(34, 197, 94, 0.1)', 
                          borderRadius: '5px',
                          border: '1px solid rgba(34, 197, 94, 0.2)',
                          color: '#166534'
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>🔍 Кого ищет</div>
                          <div>
                            {user.searchStatus.split('&&').map((status, index) => (
                              <div key={index} style={{ marginBottom: '1px' }}>
                                • {status.trim()}
                              </div>
                            ))}
                          </div>
                          {user.searchAge && (
                            <div style={{ fontSize: '10px', marginTop: '3px', opacity: 0.8 }}>
                              Возраст: {user.searchAge}
                            </div>
                          )}
                          <div style={{ fontSize: '10px', marginTop: '3px', opacity: 0.7, fontStyle: 'italic' }}>
                            ✅ Взаимно совместимы
                          </div>
                        </div>
                      )}
                      
                      <Link
                        to={`/profile/${user.login}`}
                        className="username"
                      >
                        @{user.login}
                      </Link>
                    </ProfileInfo>
                  </ProfileCard>
                ))}
              </ProfilesGrid>

              {profilesData.pagination && (
                <Pagination>
                  <Button
                    variant="secondary"
                    disabled={profilesData.pagination.offset === 0}
                    onClick={() => handlePageChange(Math.max(0, profilesData.pagination.offset - profilesData.pagination.limit))}
                  >
                    ← Назад
                  </Button>
                  
                  <div className="page-info">
                    {profilesData.pagination.offset + 1} - {Math.min(profilesData.pagination.offset + profilesData.pagination.limit, profilesData.pagination.total)} из {profilesData.pagination.total}
                  </div>
                  
                  <Button
                    variant="secondary"
                    disabled={!profilesData.pagination.hasMore}
                    onClick={() => handlePageChange(profilesData.pagination.offset + profilesData.pagination.limit)}
                  >
                    Вперед →
                  </Button>
                </Pagination>
              )}
            </>
          ) : (
            <NoResults>
              <div className="icon">🔍</div>
              <h3>Нет результатов</h3>
              <p>Попробуйте изменить критерии поиска или очистить фильтры</p>
            </NoResults>
          )}
        </>
      )}
    </CatalogContainer>
  );
};

export default Catalog;