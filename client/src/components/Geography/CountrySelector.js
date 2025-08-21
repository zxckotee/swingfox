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
  
  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 14px;
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

const CountrySelector = ({
  value = '',
  onChange,
  onSelect,
  error,
  placeholder = 'Выберите страну...',
  label,
  required = false,
  disabled = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(value);
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Загрузка списка стран при монтировании
  useEffect(() => {
    fetchCountries();
  }, []);

  // Обновление поискового значения при изменении value извне
  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  // Фильтрация стран при изменении поискового значения
  useEffect(() => {
    if (countries.length > 0) {
      const filtered = countries.filter(country =>
        country.country.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredCountries(filtered);
      setSelectedIndex(-1);
    }
  }, [searchValue, countries]);

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

  const fetchCountries = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/geo/countries');
      if (!response.ok) {
        throw new Error('Ошибка загрузки стран');
      }
      const data = await response.json();
      setCountries(data.data || []);
      setFilteredCountries(data.data || []);
    } catch (error) {
      console.error('Ошибка загрузки стран:', error);
      setCountries([]);
      setFilteredCountries([]);
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
    setIsOpen(true);
    if (countries.length === 0) {
      fetchCountries();
    }
  };

  const handleCountrySelect = (country) => {
    setSearchValue(country.country);
    setIsOpen(false);
    setSelectedIndex(-1);
    
    if (onChange) {
      onChange(country.country);
    }
    
    if (onSelect) {
      onSelect(country);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCountries.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredCountries[selectedIndex]) {
          handleCountrySelect(filteredCountries[selectedIndex]);
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

  return (
    <SelectorContainer ref={containerRef} className={className}>
      {label && (
        <Label>
          {label} {required && <span className="required">*</span>}
        </Label>
      )}
      
      <Input
        ref={inputRef}
        type="text"
        value={searchValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={error ? 'error' : ''}
        autoComplete="off"
      />
      
      <DropdownContainer $show={isOpen && !disabled} ref={dropdownRef}>
        {isLoading ? (
          <LoadingContainer>
            <LoadingSpinner />
            Загрузка стран...
          </LoadingContainer>
        ) : filteredCountries.length > 0 ? (
          filteredCountries.map((country, index) => (
            <DropdownItem
              key={country.country}
              onClick={() => handleCountrySelect(country)}
              className={index === selectedIndex ? 'selected' : ''}
            >
              {country.country}
            </DropdownItem>
          ))
        ) : (
          <NoResultsText>
            {searchValue ? 'Страны не найдены' : 'Загрузка...'}
          </NoResultsText>
        )}
      </DropdownContainer>
      
      {error && <ErrorText>{error}</ErrorText>}
    </SelectorContainer>
  );
};

export default CountrySelector;