import React from 'react';
import styled from 'styled-components';

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 8px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  @media (max-width: 480px) {
    gap: 8px;
  }
`;

const CheckboxOption = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: ${props => props.$checked ? 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)' : '#ffffff'};
  border: 2px solid ${props => props.$checked ? '#dc3522' : '#e2e8f0'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  position: relative;
  overflow: hidden;
  
  &:hover {
    border-color: #dc3522;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(220, 53, 34, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    padding: 14px 16px;
    gap: 10px;
  }
  
  @media (max-width: 480px) {
    padding: 12px 14px;
    gap: 8px;
  }
`;

const CheckboxInput = styled.input`
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 100%;
  width: 100%;
  margin: 0;
  z-index: 1;
`;

const CustomCheckbox = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${props => props.$checked ? '#ffffff' : '#dc3522'};
  border-radius: 6px;
  background: ${props => props.$checked ? '#ffffff' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  pointer-events: none;
  
  &::after {
    content: '';
    width: 6px;
    height: 10px;
    border: solid ${props => props.$checked ? '#dc3522' : 'transparent'};
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    transition: all 0.2s ease;
  }
  
  @media (max-width: 480px) {
    width: 18px;
    height: 18px;
    
    &::after {
      width: 5px;
      height: 8px;
    }
  }
`;

const CheckboxLabel = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.$checked ? '#ffffff' : '#2d3748'};
  line-height: 1.4;
  transition: color 0.2s ease;
  pointer-events: none;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
  
  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const ErrorText = styled.div`
  color: #ef4444;
  font-size: 14px;
  margin-top: 8px;
  font-weight: 500;
  
  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const SearchStatusCheckboxes = ({ 
  options = [], 
  selectedValues = [], 
  onChange, 
  error,
  name = 'searchStatus'
}) => {
  const handleChange = (value) => {
    console.log('SearchStatusCheckboxes handleChange called with:', value);
    console.log('Current selectedValues:', selectedValues);
    
    if (!onChange) {
      console.log('No onChange function provided');
      return;
    }
    
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    console.log('New values:', newValues);
    onChange(newValues);
  };

  return (
    <div>
      <CheckboxGroup>
        {options.map((option) => {
          const isChecked = selectedValues.includes(option.value);
          
          return (
            <CheckboxOption 
              key={option.value} 
              $checked={isChecked}
            >
              <CheckboxInput
                type="checkbox"
                name={name}
                value={option.value}
                checked={isChecked}
                onChange={() => handleChange(option.value)}
              />
              <CustomCheckbox $checked={isChecked} />
              <CheckboxLabel $checked={isChecked}>
                {option.label}
              </CheckboxLabel>
            </CheckboxOption>
          );
        })}
      </CheckboxGroup>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
};

export default SearchStatusCheckboxes;
