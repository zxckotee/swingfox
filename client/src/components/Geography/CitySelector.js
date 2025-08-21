import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Input, Label, ErrorText, LoadingSpinner } from '../UI';

const SelectorContainer = styled.div`
  position: relative;
  width: 100%;
`;

const DropdownContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: white;
  border: 2px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 10px 10px;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: ${props => props.$show ? 'block' : 'none'};
`;

const DropdownItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 15px;
  border-bottom: 1px solid #f7fafc;
  
  &:hover {
    background: #f7fafc;
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  &.selected {
    background: #dc3522;
    color: white;
  }
  
  .city-name {
    font-weight: 500;
  }
  
  .region-name {
    font-size: 13px;
    color: #718096;
    margin-top: 2px;
  }
  
  &.selected .region-name {
    color: rgba(255, 255, 255, 0.8);
  }
  
  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 14px;
    
    .region-name {
      font-size: 12px;
    }
  }
`;

const LoadingContainer = styled.div`
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #718096;
  font-size: 14px;
  gap: 8px;
`;

const NoResultsText = styled.div`
  padding: 20px 16px;
  text-align: center;
  color: #718096;
  font-size: 14px;
  font-style: italic;
`;

const DisabledText = styled.div`
  padding: 12px 16px;
  color: #a0aec0;
  font-size: 14px;
  font-style: italic;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
`;

const CitySelector = ({
  country = '',
  value = '',
  onChange,
  onSelect,
  error,
  placeholder = 'Выберите город...',
  label,
  required = false,
  disabled = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(value);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Обновление поискового значения при изменении value извне
  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  // Загрузка городов при изменении страны
  useEffect(() => {
    if (country) {
      fetchCities(country);
    } else {
      setCities([]);
      setFilteredCities([]);
      setSearchValue('');
      if (onChange) {
        onChange('');
      }
    }
  }, [country]);

  // Фильтрация городов при изменении поискового значения
  useEffect(() => {
    if (cities.length > 0) {
      const filtered = cities.filter(city =>
        city.city.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredCities(filtered);
      setSelectedIndex(-1);
    }
  }, [searchValue, cities]);

  // Закрытие выпадающего списка при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCities = async (selectedCountry) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/geo/cities/${encodeURIComponent(selectedCountry)}?limit=500`);
      if (!response.ok) {
        throw new Error('Ошибка загрузки городов');
      }
      const data = await response.json();
      setCities(data.data || []);
      setFilteredCities(data.data || []);
    } catch (error) {
      console.error('Ошибка загрузки городов:', error);
      setCities([]);
      setFilteredCities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    setIsOpen(true);
    
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleInputFocus = () => {
    if (country) {
      setIsOpen(true);
    }
  };

  const handleCitySelect = (city) => {
    setSearchValue(city.city);
    setIsOpen(false);
    setSelectedIndex(-1);
    
    if (onChange) {
      onChange(city.city);
    }
    
    if (onSelect) {
      onSelect(city);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || !country) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCities.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredCities[selectedIndex]) {
          handleCitySelect(filteredCities[selectedIndex]);
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      
      default:
        break;
    }
  };

  // Прокрутка к выбранному элементу
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  const isDisabledByCountry = !country;
  const isFullyDisabled = disabled || isDisabledByCountry;

  return (
    <SelectorContainer ref={containerRef} className={className}>
      {label && (
        <Label>
          {label} {required && <span className="required">*</span>}
        </Label>
      )}
      
      {isDisabledByCountry ? (
        <DisabledText>
          Сначала выберите страну
        </DisabledText>
      ) : (
        <>
          <Input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isFullyDisabled}
            className={error ? 'error' : ''}
            autoComplete="off"
          />
          
          <DropdownContainer $show={isOpen && !isFullyDisabled} ref={dropdownRef}>
            {isLoading ? (
              <LoadingContainer>
                <LoadingSpinner />
                Загрузка городов...
              </LoadingContainer>
            ) : filteredCities.length > 0 ? (
              filteredCities.map((city, index) => (
                <DropdownItem
                  key={`${city.city}-${city.region || 'no-region'}`}
                  onClick={() => handleCitySelect(city)}
                  className={index === selectedIndex ? 'selected' : ''}
                >
                  <div className="city-name">{city.city}</div>
                  {city.region && (
                    <div className="region-name">{city.region}</div>
                  )}
                </DropdownItem>
              ))
            ) : (
              <NoResultsText>
                {searchValue ? 'Города не найдены' : country ? 'Загрузка...' : 'Выберите страну'}
              </NoResultsText>
            )}
          </DropdownContainer>
        </>
      )}
      
      {error && <ErrorText>{error}</ErrorText>}
    </SelectorContainer>
  );
};

export default CitySelector;