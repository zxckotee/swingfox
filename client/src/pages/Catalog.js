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

// Функция для преобразования возрастного диапазона в понятное описание
const getAgeDescription = (ageRange) => {
  if (!ageRange) return '';
  
  // Если это диапазон вида "22-40"
  if (ageRange.includes('-')) {
    const [minAge, maxAge] = ageRange.split('-').map(age => parseInt(age.trim()));
    const diff = maxAge - minAge;
    
    if (diff <= 2) {
      return 'ровесники';
    } else if (diff <= 5) {
      return 'сверстники';
    } else if (diff <= 10) {
      return 'какая разница';
    } else if (diff <= 15) {
      return 'не важен возраст';
    } else {
      return 'возраст не важен';
    }
  }
  
  // Если это конкретный возраст
  if (ageRange.includes('+')) {
    const minAge = parseInt(ageRange.replace('+', ''));
    if (minAge <= 25) {
      return 'молодые';
    } else if (minAge <= 35) {
      return 'зрелые';
    } else {
      return 'опытные';
    }
  }
  
  // Если это просто число
  const age = parseInt(ageRange);
  if (!isNaN(age)) {
    if (age <= 25) {
      return 'молодые';
    } else if (age <= 35) {
      return 'зрелые';
    } else {
      return 'опытные';
    }
  }
  
  // Если не удалось распарсить, возвращаем как есть
  return ageRange;
};

// Функция для расчета возраста из даты рождения
const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error('Ошибка при расчете возраста:', error);
    return null;
  }
};

// Функция для правильного склонения слова "год"
const getAgeText = (age) => {
  if (!age) return '';
  
  const lastDigit = age % 10;
  const lastTwoDigits = age % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${age} лет`;
  } else if (lastDigit === 1) {
    return `${age} год`;
  } else if (lastDigit >= 2 && lastDigit <= 4) {
    return `${age} года`;
  } else {
    return `${age} лет`;
  }
};


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
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    max-width: 1200px;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    padding: 0 16px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 0 12px;
  }
`;

const ProfileCard = styled(Card)`
  padding: 0;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(255, 255, 255, 0.8);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #dc3522 0%, #ff6b58 50%, #667eea 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.1),
      0 8px 16px rgba(0, 0, 0, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    
    &::before {
      opacity: 1;
    }
  }
  
  @media (max-width: 768px) {
    border-radius: 16px;
    
    &:hover {
      transform: translateY(-4px) scale(1.01);
    }
  }
`;

const ProfileAvatar = styled(Avatar)`
  margin: 24px auto 20px auto;
  border: 4px solid rgba(255, 255, 255, 0.9);
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 4px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  
  ${ProfileCard}:hover & {
    transform: scale(1.05);
    box-shadow: 
      0 12px 32px rgba(0, 0, 0, 0.16),
      0 6px 12px rgba(0, 0, 0, 0.12);
  }
`;

const ProfileInfo = styled.div`
  padding: 0 24px 24px 24px;
  
  .status {
    background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 12px;
    display: inline-block;
    box-shadow: 0 4px 12px rgba(220, 53, 34, 0.3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: all 0.3s ease;
    
    ${ProfileCard}:hover & {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(220, 53, 34, 0.4);
    }
  }
  
  .age {
    color: #64748b;
    font-size: 14px;
    margin-bottom: 8px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    
    &::before {
      content: '🎂';
      font-size: 12px;
    }
  }
  
  .location {
    color: #475569;
    font-size: 14px;
    margin-bottom: 16px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    
    &::before {
      content: '📍';
      font-size: 12px;
    }
  }
  
  .username {
    font-weight: 700;
    color: #1e293b;
    text-decoration: none;
    font-size: 18px;
    display: inline-block;
    padding: 8px 16px;
    border-radius: 12px;
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    border: 1px solid rgba(226, 232, 240, 0.8);
    transition: all 0.3s ease;
    
    &:hover {
      background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(220, 53, 34, 0.3);
      text-decoration: none;
    }
  }
  
  .compatibility {
    margin: 12px 0;
    padding: 8px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, 
        rgba(255, 255, 255, 0.2) 0%, 
        rgba(255, 255, 255, 0.1) 50%, 
        rgba(255, 255, 255, 0.2) 100%
      );
      animation: shimmer 2s infinite;
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  }
  
  .additional-info {
    margin: 12px 0;
    padding: 8px 12px;
    background: rgba(241, 245, 249, 0.6);
    border-radius: 10px;
    border: 1px solid rgba(226, 232, 240, 0.5);
    font-size: 11px;
    color: #64748b;
    line-height: 1.4;
    
    span {
      display: inline-block;
      margin: 2px 4px;
      padding: 2px 6px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 6px;
      font-weight: 500;
    }
  }
  
  .partner-data {
    margin: 12px 0;
    padding: 12px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(129, 140, 248, 0.08) 100%);
    border-radius: 12px;
    border: 1px solid rgba(102, 126, 234, 0.2);
    font-size: 11px;
    color: #4c51bf;
    line-height: 1.4;
    
    div {
      margin: 2px 0;
      font-weight: 500;
    }
  }
  
  .search-info {
    margin: 12px 0;
    padding: 10px 12px;
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%);
    border-radius: 12px;
    border: 1px solid rgba(34, 197, 94, 0.2);
    font-size: 11px;
    color: #166534;
    line-height: 1.4;
    
    div {
      margin: 2px 0;
      font-weight: 500;
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
                      $size="100px"
                      $fontSize="40px"
                    >
                      {!user.ava && user.login?.charAt(0).toUpperCase()}
                    </ProfileAvatar>
                    
                    <ProfileInfo>
                      <div className="status">{user.status}</div>
                      <div className="age">
                        {user.isCouple ? (
                          user.partnerData ? (
                            // Для пар показываем возраст каждого партнера
                            <>
                              {user.partnerData.manDate && calculateAge(user.partnerData.manDate) && (
                                <span>{getAgeText(calculateAge(user.partnerData.manDate))} (Мужчина)</span>
                              )}
                              {user.partnerData.manDate && user.partnerData.womanDate && calculateAge(user.partnerData.manDate) && calculateAge(user.partnerData.womanDate) && (
                                <span> / </span>
                              )}
                              {user.partnerData.womanDate && calculateAge(user.partnerData.womanDate) && (
                                <span>{getAgeText(calculateAge(user.partnerData.womanDate))} (Женщина)</span>
                              )}
                            </>
                          ) : (
                            // Fallback для пар без partnerData
                            user.age ? getAgeText(parseInt(user.age)) : ''
                          )
                        ) : (
                          // Для одиночных профилей показываем просто возраст
                          user.date && calculateAge(user.date) ? getAgeText(calculateAge(user.date)) : (user.age ? getAgeText(parseInt(user.age)) : '')
                        )}
                      </div>
                      {user.compatibility && (
                        <div className="compatibility" style={{ 
                          background: `linear-gradient(90deg, #4CAF50 ${user.compatibility.percentage}%, #e0e0e0 ${user.compatibility.percentage}%)`,
                          color: 'white'
                        }}>
                          Совместимость: {user.compatibility.percentage}%
                        </div>
                      )}
                      
                      <div className="location">
                        {user.city}, {user.distance}км
                      </div>
                      
                      {/* Дополнительная информация - убираем поля роста, веса, курения и алкоголя для пар */}
                      {user.isCouple ? null : (user.height || user.weight || user.smoking || user.alko) && (
                        <div className="additional-info">
                          {user.height && <span>📏 {user.height}см</span>}
                          {user.weight && <span>⚖️ {user.weight}кг</span>}
                          {user.smoking && <span>🚬 {user.smoking.length > 20 ? user.smoking.substring(0, 20) + '...' : user.smoking}</span>}
                          {user.alko && <span>🍷 {user.alko.length > 20 ? user.alko.substring(0, 20) + '...' : user.alko}</span>}
                        </div>
                      )}
                      
                      {/* Данные пары */}
                      {user.isCouple && user.partnerData && (
                        <div className="partner-data">
                          <div style={{ fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            👫 Данные пары
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {user.partnerData.manDate && user.partnerData.womanDate && calculateAge(user.partnerData.manDate) && calculateAge(user.partnerData.womanDate) && (
                              <div>🎂 Возраст: {getAgeText(calculateAge(user.partnerData.manDate))} (Мужчина) / {getAgeText(calculateAge(user.partnerData.womanDate))} (Женщина)</div>
                            )}
                            {user.partnerData.manHeight && user.partnerData.womanHeight && (
                              <div>📏 Рост: {user.partnerData.manHeight}см / {user.partnerData.womanHeight}см</div>
                            )}
                            {user.partnerData.manWeight && user.partnerData.womanWeight && (
                              <div>⚖️ Вес: {user.partnerData.manWeight}кг / {user.partnerData.womanWeight}кг</div>
                            )}
                            {user.partnerData.manSmoking && user.partnerData.womanSmoking && (
                              <div>🚬 Курение: {user.partnerData.manSmoking} / {user.partnerData.womanSmoking}</div>
                            )}
                            {user.partnerData.manAlko && user.partnerData.womanAlko && (
                              <div>🍷 Алкоголь: {user.partnerData.manAlko} / {user.partnerData.womanAlko}</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Показываем кого ищет пользователь */}
                      {user.searchStatus && (
                        <div className="search-info">
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
                              Возраст: {getAgeDescription(user.searchAge)}
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