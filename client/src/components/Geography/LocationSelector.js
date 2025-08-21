import React, { useState } from 'react';
import styled from 'styled-components';
import { FormGroup, FormRow } from '../UI';
import CountrySelector from './CountrySelector';
import CitySelector from './CitySelector';

const LocationContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
`;

const LocationRow = styled.div`
  display: grid;
  grid-template-columns: ${props => props.$layout === 'stacked' ? '1fr' : '1fr 1fr'};
  gap: 15px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const ValidationInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${props => props.$valid ? '#38a169' : '#718096'};
  margin-top: 5px;
  
  &::before {
    content: '${props => props.$valid ? '✓' : 'ⓘ'}';
    font-size: 12px;
    color: ${props => props.$valid ? '#38a169' : '#a0aec0'};
  }
`;

const LocationSelector = ({
  // Значения
  countryValue = '',
  cityValue = '',
  
  // Обработчики
  onCountryChange,
  onCityChange,
  onCountrySelect,
  onCitySelect,
  onLocationChange, // Callback когда изменяется полное местоположение
  
  // Ошибки валидации
  countryError,
  cityError,
  
  // Настройки отображения
  layout = 'side-by-side', // 'side-by-side' | 'stacked'
  countryLabel = 'Страна',
  cityLabel = 'Город',
  countryPlaceholder = 'Выберите страну...',
  cityPlaceholder = 'Выберите город...',
  
  // Флаги
  required = false,
  disabled = false,
  showValidation = false,
  
  // Стили
  className
}) => {
  const [isValidLocation, setIsValidLocation] = useState(false);

  const handleCountryChange = (country) => {
    // Сбрасываем город при смене страны
    if (onCityChange && cityValue) {
      onCityChange('');
    }
    
    if (onCountryChange) {
      onCountryChange(country);
    }
    
    // Вызываем общий callback изменения местоположения
    if (onLocationChange) {
      onLocationChange({
        country,
        city: '', // Сбрасываем город
        isComplete: false
      });
    }
    
    setIsValidLocation(false);
  };

  const handleCityChange = (city) => {
    if (onCityChange) {
      onCityChange(city);
    }
    
    // Проверяем полноту местоположения
    const isComplete = !!(countryValue && city);
    setIsValidLocation(isComplete);
    
    // Вызываем общий callback изменения местоположения
    if (onLocationChange) {
      onLocationChange({
        country: countryValue,
        city,
        isComplete
      });
    }
  };

  const handleCountrySelect = (countryData) => {
    if (onCountrySelect) {
      onCountrySelect(countryData);
    }
  };

  const handleCitySelect = (cityData) => {
    // Проверяем полноту местоположения
    const isComplete = !!(countryValue && cityData.city);
    setIsValidLocation(isComplete);
    
    if (onCitySelect) {
      onCitySelect(cityData);
    }
    
    // Вызываем общий callback с полными данными
    if (onLocationChange) {
      onLocationChange({
        country: countryValue,
        city: cityData.city,
        region: cityData.region,
        isComplete,
        fullData: {
          country: countryValue,
          city: cityData.city,
          region: cityData.region
        }
      });
    }
  };

  const renderValidationInfo = () => {
    if (!showValidation) return null;
    
    if (isValidLocation) {
      return (
        <ValidationInfo $valid={true}>
          Местоположение подтверждено
        </ValidationInfo>
      );
    }
    
    if (countryValue && !cityValue) {
      return (
        <ValidationInfo $valid={false}>
          Выберите город для завершения
        </ValidationInfo>
      );
    }
    
    if (!countryValue) {
      return (
        <ValidationInfo $valid={false}>
          Начните с выбора страны
        </ValidationInfo>
      );
    }
    
    return null;
  };

  return (
    <LocationContainer className={className}>
      <LocationRow $layout={layout}>
        <CountrySelector
          value={countryValue}
          onChange={handleCountryChange}
          onSelect={handleCountrySelect}
          error={countryError}
          label={countryLabel}
          placeholder={countryPlaceholder}
          required={required}
          disabled={disabled}
        />
        
        <CitySelector
          country={countryValue}
          value={cityValue}
          onChange={handleCityChange}
          onSelect={handleCitySelect}
          error={cityError}
          label={cityLabel}
          placeholder={cityPlaceholder}
          required={required}
          disabled={disabled}
        />
      </LocationRow>
      
      {renderValidationInfo()}
    </LocationContainer>
  );
};

// Хук для удобного использования LocationSelector в формах
export const useLocationSelector = (initialCountry = '', initialCity = '') => {
  const [country, setCountry] = useState(initialCountry);
  const [city, setCity] = useState(initialCity);
  const [isComplete, setIsComplete] = useState(!!(initialCountry && initialCity));

  const handleLocationChange = ({ country: newCountry, city: newCity, isComplete: complete }) => {
    setCountry(newCountry);
    setCity(newCity);
    setIsComplete(complete);
  };

  const reset = () => {
    setCountry('');
    setCity('');
    setIsComplete(false);
  };

  const setLocation = (newCountry, newCity) => {
    setCountry(newCountry);
    setCity(newCity);
    setIsComplete(!!(newCountry && newCity));
  };

  return {
    country,
    city,
    isComplete,
    handleLocationChange,
    reset,
    setLocation,
    // Для удобного использования в react-hook-form
    setValue: (field, value) => {
      if (field === 'country') {
        setCountry(value);
        if (value !== country) {
          setCity(''); // Сброс города при смене страны
          setIsComplete(false);
        }
      } else if (field === 'city') {
        setCity(value);
        setIsComplete(!!(country && value));
      }
    }
  };
};

export default LocationSelector;