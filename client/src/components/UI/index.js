import styled from 'styled-components';

// Иконки
export const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

export const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

export const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22,2 15,22 11,13 2,9 22,2"/>
  </svg>
);

export const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

export const MessageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

export const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

export const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

export const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

export const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

export const FilterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
  </svg>
);

export const GiftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,12 20,22 4,22 4,12"/>
    <rect x="2" y="7" width="20" height="5"/>
    <line x1="12" y1="22" x2="12" y2="7"/>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
);

export const StarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12,2 15.09,8.26 22,9 17,14.74 18.18,21.02 12,17.77 5.82,21.02 7,14.74 2,9 8.91,8.26 12,2"/>
  </svg>
);

export const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

export const CrownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 6l6-4 6 4"/>
    <path d="M6 6v14h12V6"/>
    <circle cx="12" cy="13" r="2"/>
  </svg>
);

export const ChevronUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="18,15 12,9 6,15"/>
  </svg>
);

export const ChevronDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6,9 12,15 18,9"/>
  </svg>
);

export const TrophyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
    <path d="M5.7 8H2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h3.7"/>
    <path d="M18.3 8H22a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-3.7"/>
    <path d="M5.7 8v5.7C5.7 17 8.3 19 12 19s6.3-2 6.3-5.3V8"/>
  </svg>
);

// Контейнеры
export const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.$gradient ? 
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
    props.theme.colors.background
  };
  padding: ${props => props.$noPadding ? '0' : '20px'};
  
  @media (max-width: 768px) {
    padding: ${props => props.$noPadding ? '0' : '10px'};
  }
`;

export const ContentCard = styled.div`
  width: 100%;
  max-width: ${props => props.$maxWidth || '900px'};
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  padding: ${props => props.$padding || '40px'};
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.4s ease-out;
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (max-width: 768px) {
    padding: ${props => props.$mobilePadding || '20px'};
    max-width: 100%;
    border-radius: 15px;
  }
`;

// Секции и заголовки
export const LogoSection = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

export const Logo = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${props => props.$size || '80px'};
  height: ${props => props.$size || '80px'};
  background: white;
  border-radius: 20px;
  margin-bottom: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 8px;
  }
  
  @media (max-width: 768px) {
    width: ${props => props.$mobileSize || '60px'};
    height: ${props => props.$mobileSize || '60px'};
  }
`;

export const Title = styled.h1`
  text-align: center;
  margin: 0 0 10px 0;
  color: #2d3748;
  font-size: ${props => props.$size === 'large' ? '32px' : '28px'};
  font-weight: 700;
  
  @media (max-width: 768px) {
    font-size: ${props => props.$size === 'large' ? '28px' : '24px'};
  }
`;

export const Subtitle = styled.p`
  text-align: center;
  color: #718096;
  font-size: 14px;
  margin-bottom: 30px;
`;

export const SectionTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #2d3748;
  font-size: 18px;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 2px solid #dc3522;
  display: inline-block;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

// Формы
export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const FormSection = styled.div`
  background: #f7fafc;
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  }
  
  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
`;

export const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(${props => props.$minWidth || '240px'}, 1fr));
  gap: 20px;
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

export const Label = styled.label`
  font-weight: 500;
  color: #4a5568;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  .required {
    color: #dc3522;
    font-weight: bold;
  }
  
  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

// Поля ввода
export const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

export const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.3s ease;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #dc3522;
    box-shadow: 0 0 0 3px rgba(220, 53, 34, 0.1);
  }
  
  &:hover:not(:focus) {
    border-color: #cbd5e0;
  }
  
  &.error {
    border-color: #f56565;
    background: #fff5f5;
  }
  
  &:disabled {
    background: #f7fafc;
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  &[type="password"] {
    padding-right: 45px;
  }
  
  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 14px;
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%234A5568' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 40px;
  
  &:focus {
    outline: none;
    border-color: #dc3522;
    box-shadow: 0 0 0 3px rgba(220, 53, 34, 0.1);
  }
  
  &:hover:not(:focus) {
    border-color: #cbd5e0;
  }
  
  &.error {
    border-color: #f56565;
    background-color: #fff5f5;
  }
  
  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 14px;
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  min-height: ${props => props.$minHeight || '100px'};
  resize: vertical;
  font-family: inherit;
  transition: all 0.3s ease;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #dc3522;
    box-shadow: 0 0 0 3px rgba(220, 53, 34, 0.1);
  }
  
  &:hover:not(:focus) {
    border-color: #cbd5e0;
  }
  
  &.error {
    border-color: #f56565;
    background: #fff5f5;
  }
  
  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 14px;
    min-height: 80px;
  }
`;

// Кнопки
export const Button = styled.button`
  padding: ${props => props.$size === 'small' ? '8px 16px' : '14px 28px'};
  background: ${props => {
    if (props.$variant === 'secondary') return 'white';
    if (props.$variant === 'danger') return '#f56565';
    return 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)';
  }};
  color: ${props => props.$variant === 'secondary' ? '#dc3522' : 'white'};
  border: ${props => props.$variant === 'secondary' ? '2px solid #dc3522' : 'none'};
  border-radius: 10px;
  font-size: ${props => props.$size === 'small' ? '14px' : '16px'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${props => props.$variant === 'secondary' ? 'none' : '0 4px 15px rgba(220, 53, 34, 0.3)'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover:not(:disabled) {
    transform: ${props => props.$variant === 'secondary' ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => {
      if (props.$variant === 'secondary') return '0 2px 10px rgba(220, 53, 34, 0.2)';
      if (props.$variant === 'danger') return '0 6px 20px rgba(245, 101, 101, 0.4)';
      return '0 6px 20px rgba(220, 53, 34, 0.4)';
    }};
    background: ${props => {
      if (props.$variant === 'secondary') return '#fff5f5';
      if (props.$variant === 'danger') return '#e53e3e';
      return 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)';
    }};
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    background: linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%);
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
    border-color: ${props => props.$variant === 'secondary' ? '#cbd5e0' : 'transparent'};
    color: ${props => props.$variant === 'secondary' ? '#a0aec0' : 'white'};
  }
  
  @media (max-width: 768px) {
    padding: ${props => props.$size === 'small' ? '6px 12px' : '12px 24px'};
    font-size: ${props => props.$size === 'small' ? '13px' : '15px'};
  }
`;

export const IconButton = styled.button`
  width: ${props => props.$size || '40px'};
  height: ${props => props.$size || '40px'};
  border-radius: 50%;
  border: none;
  background: ${props => props.$variant === 'secondary' ? '#f7fafc' : '#dc3522'};
  color: ${props => props.$variant === 'secondary' ? '#4a5568' : 'white'};
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.$variant === 'secondary' ? '#e2e8f0' : '#ff6b58'};
    transform: scale(1.1);
  }
  
  &:focus {
    outline: none;
  }
  
  &:disabled {
    background: #e2e8f0;
    color: #a0aec0;
    cursor: not-allowed;
    transform: none;
  }
`;

// Элементы ошибок
export const ErrorText = styled.span`
  color: #f56565;
  font-size: 13px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &::before {
    content: '⚠';
    font-size: 12px;
  }
`;

// Карточки и контейнеры
export const Card = styled.div`
  background: white;
  border-radius: 15px;
  padding: ${props => props.$padding || '20px'};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
  
  &:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
`;

export const Avatar = styled.div`
  width: ${props => props.$size || '40px'};
  height: ${props => props.$size || '40px'};
  border-radius: 50%;
  background-image: url(${props => props.$src});
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  background-color: ${props => props.$bgColor || '#dc3522'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: ${props => props.$fontSize || '16px'};
  border: ${props => props.$border || '2px solid #e2e8f0'};
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    ${props => props.$clickable && `
      border-color: #dc3522;
      transform: scale(1.05);
    `}
  }
  
  ${props => props.$online && `
    &::after {
      content: '';
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: #4caf50;
      border-radius: 50%;
      border: 2px solid white;
    }
  `}
  
  /* Адаптивные размеры для разных экранов */
  /* Большие экраны - аватарка 50px */
  @media (min-width: 1440px) {
    ${props => props.$size === '45px' && `
      width: 50px;
      height: 50px;
      font-size: 20px;
      border-width: 2px;
    `}
  }
  
  /* Средне-большие экраны - аватарка 47px */
  @media (min-width: 1240px) and (max-width: 1439px) {
    ${props => props.$size === '45px' && `
      width: 47px;
      height: 47px;
      font-size: 19px;
      border-width: 2px;
    `}
  }
  
  /* Средние экраны - аватарка 45px */
  @media (max-width: 1200px) {
    ${props => props.$size === '45px' && `
      width: 45px;
      height: 45px;
      font-size: 18px;
      border-width: 2px;
    `}
  }
  
  /* Планшеты в альбомной ориентации - аватарка 42px */
  @media (max-width: 1024px) {
    ${props => props.$size === '45px' && `
      width: 42px;
      height: 42px;
      font-size: 17px;
      border-width: 2px;
    `}
  }
  
  /* Планшеты в портретной ориентации - аватарка 40px */
  @media (max-width: 768px) {
    ${props => props.$size === '45px' && `
      width: 40px;
      height: 40px;
      font-size: 16px;
      border-width: 1.5px;
    `}
  }
  
  /* Большие мобильные - аватарка 38px */
  @media (max-width: 576px) {
    ${props => props.$size === '45px' && `
      width: 38px;
      height: 38px;
      font-size: 15px;
      border-width: 1.5px;
    `}
  }
  
  /* Маленькие мобильные - аватарка 34px */
  @media (max-width: 360px) {
    ${props => props.$size === '45px' && `
      width: 34px;
      height: 34px;
      font-size: 13px;
      border-width: 1px;
    `}
  }
`;

// Модальные окна
export const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(5px);
`;

export const ModalContent = styled.div`
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: ${props => props.$maxWidth || '500px'};
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideUp 0.3s ease-out;
  
  @keyframes modalSlideUp {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h2 {
    margin: 0;
    color: #2d3748;
    font-size: 24px;
    font-weight: 700;
  }
`;

// Утилиты
export const FlexContainer = styled.div`
  display: flex;
  align-items: ${props => props.$align || 'center'};
  justify-content: ${props => props.$justify || 'flex-start'};
  gap: ${props => props.$gap || '10px'};
  flex-direction: ${props => props.$direction || 'row'};
  flex-wrap: ${props => props.$wrap ? 'wrap' : 'nowrap'};
  
  @media (max-width: 768px) {
    flex-direction: ${props => props.$mobileDirection || props.$direction || 'row'};
    gap: ${props => props.$mobileGap || props.$gap || '10px'};
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: ${props => props.$columns || 'repeat(auto-fit, minmax(250px, 1fr))'};
  gap: ${props => props.$gap || '20px'};
  
  @media (max-width: 768px) {
    grid-template-columns: ${props => props.$mobileColumns || '1fr'};
    gap: ${props => props.$mobileGap || '15px'};
  }
`;

export const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  
  &::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #dc3522;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const ProgressBar = styled.div`
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  margin: 20px 0;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.$progress || 0}%;
    background: linear-gradient(90deg, #dc3522 0%, #ff6b58 100%);
    transition: width 0.3s ease;
  }
`;

export const ThumbsUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
  </svg>
);

export const ThumbsDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(180)">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
  </svg>
);

export const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <circle cx="12" cy="16" r="1"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export const CreditCardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

export const WalletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v-6Z"/>
  </svg>
);

export { default as Checkbox } from './Checkbox';

export { default as BalanceTopUp } from './BalanceTopUp';
export { default as AvatarCropper } from './AvatarCropper';