import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { clubAuthAPI } from '../services/api';
import { LocationSelector, CitySelector } from '../components/Geography';
import { 
  PageContainer, 
  ContentCard, 
  Button, 
  Input, 
  Select, 
  TextArea, 
  Form, 
  FormGroup, 
  Label, 
  ErrorText, 
  LoadingSpinner,
  InputWrapper,
  EyeIcon,
  EyeOffIcon,
  IconButton
} from '../components/UI';

// Контейнер страницы с градиентным фоном
const ClubRegisterContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.03)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    pointer-events: none;
  }
`;

// Главная карточка с эффектами
const RegisterCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 800px;
  position: relative;
  z-index: 10;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    padding: 30px 20px;
    margin: 10px;
    border-radius: 20px;
    width: calc(100% - 20px);
  }
`;

// Заголовок с анимацией
const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: #dc3522;
  margin: 0;
  text-align: center;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 20px;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
  font-weight: 500;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

// Улучшенная форма
const StyledForm = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 32px;
  width: 100%;
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
    margin-top: 24px;
  }
`;

const FullWidthSection = styled.div`
  grid-column: 1 / -1;
  width: 100%;
  box-sizing: border-box;
`;

const StyledFormGroup = styled(FormGroup)`
  position: relative;
`;

const StyledLabel = styled(Label)`
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: '';
    width: 6px;
    height: 6px;
    background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
    border-radius: 50%;
  }
`;

const StyledInput = styled(Input)`
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px 20px;
  font-size: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fafafa;
  
  &:focus {
    border-color: #dc3522;
    background: white;
    box-shadow: 0 0 0 4px rgba(220, 53, 34, 0.1);
    transform: translateY(-2px);
  }
  
  &:hover:not(:focus) {
    border-color: #d1d5db;
    background: white;
  }
  
  ${props => props.error && `
    border-color: #ef4444;
    background: #fef2f2;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
  `}
`;

const StyledSelect = styled(Select)`
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px 20px;
  font-size: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fafafa;
  
  &:focus {
    border-color: #dc3522;
    background: white;
    box-shadow: 0 0 0 4px rgba(220, 53, 34, 0.1);
    transform: translateY(-2px);
  }
  
  &:hover:not(:focus) {
    border-color: #d1d5db;
    background: white;
  }
  
  ${props => props.error && `
    border-color: #ef4444;
    background: #fef2f2;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
  `}
`;

const StyledTextArea = styled(TextArea)`
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px 20px;
  font-size: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fafafa;
  min-height: 120px;
  
  &:focus {
    border-color: #dc3522;
    background: white;
    box-shadow: 0 0 0 4px rgba(220, 53, 34, 0.1);
    transform: translateY(-2px);
  }
  
  &:hover:not(:focus) {
    border-color: #d1d5db;
    background: white;
  }
  
  ${props => props.error && `
    border-color: #ef4444;
    background: #fef2f2;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
  `}
`;

// Красивая кнопка
const SubmitButton = styled(Button)`
  grid-column: 1 / -1;
  width: 100%;
  padding: 20px;
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  border: none;
  border-radius: 16px;
  color: white;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 20px 40px rgba(220, 53, 34, 0.3);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active:not(:disabled) {
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  @media (max-width: 768px) {
    padding: 18px;
    font-size: 18px;
  }
`;

// Ссылки с улучшенным дизайном
const LinksContainer = styled.div`
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const LoginLink = styled.div`
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  
  a {
    color: #dc3522;
    text-decoration: none;
    font-weight: 600;
    font-size: 16px;
    transition: all 0.3s ease;
    
    &:hover {
      color: #991b1b;
      text-decoration: underline;
    }
  }
`;

const BackToUserAuth = styled.div`
  text-align: center;
  
  a {
    color: #6b7280;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    
    &:hover {
      color: #374151;
      transform: translateX(-4px);
    }
    
    &::before {
      content: '←';
      font-size: 18px;
      font-weight: bold;
    }
  }
`;

// Дополнительные декоративные элементы
const DecorativeCircle = styled.div`
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(220, 53, 34, 0.3) 0%, rgba(255, 107, 88, 0.3) 100%) !important;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(220, 53, 34, 0.4) !important;
  z-index: 1;
  
  &.circle-1 {
    width: 200px;
    height: 200px;
    top: -100px;
    right: -100px;
    animation: float 6s ease-in-out infinite;
    background: linear-gradient(135deg, rgba(220, 53, 34, 0.4) 0%, rgba(255, 107, 88, 0.4) 100%) !important;
    border: 3px solid rgba(220, 53, 34, 0.6) !important;
  }
  
  &.circle-2 {
    width: 150px;
    height: 150px;
    bottom: -75px;
    left: -75px;
    animation: float 8s ease-in-out infinite reverse;
    background: linear-gradient(135deg, rgba(220, 53, 34, 0.4) 0%, rgba(255, 107, 88, 0.4) 100%) !important;
    border: 3px solid rgba(220, 53, 34, 0.6) !important;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
  }
  
  @media (max-width: 768px) {
    &.circle-1 {
      width: 150px;
      height: 150px;
      top: -75px;
      right: -75px;
    }
    
    &.circle-2 {
      width: 100px;
      height: 100px;
      bottom: -50px;
      left: -50px;
    }
  }
`;

const ClubRegister = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    login: '',
    password: '',
    confirmPassword: '',
    type: 'public',
    max_members: '',
    membership_fee: '',
    country: '',
    city: '',
    address: '',
    description: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Если изменилась страна, очищаем город
    if (field === 'country') {
      setFormData(prev => ({ ...prev, city: '' }));
    }
    
    // Очищаем ошибку для этого поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Очищаем ошибку города при изменении страны
    if (field === 'country' && errors.city) {
      setErrors(prev => ({ ...prev, city: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Название клуба обязательно';
    }
    
    if (!formData.login.trim()) {
      newErrors.login = 'Логин клуба обязателен';
    } else if (formData.login.length < 3) {
      newErrors.login = 'Логин должен содержать минимум 3 символа';
    }
    
    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен содержать минимум 8 символов';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    
    if (!formData.country.trim()) {
      newErrors.country = 'Страна обязательна';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'Город обязателен';
    } else if (!formData.country.trim()) {
      newErrors.city = 'Сначала выберите страну';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Адрес обязателен';
    }
    
    if (formData.max_members && parseInt(formData.max_members) < 2) {
      newErrors.max_members = 'Минимум 2 участника';
    }
    
    if (formData.membership_fee && parseFloat(formData.membership_fee) < 0) {
      newErrors.membership_fee = 'Взнос не может быть отрицательным';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await clubAuthAPI.register(formData);
      
      toast.success('Клуб успешно зарегистрирован!');
      
      // Перенаправляем на вход
      navigate('/club/login');
      
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка при регистрации';
      toast.error(message);
      
      // Устанавливаем ошибки от сервера
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <ClubRegisterContainer>
      <DecorativeCircle className="circle-1" />
      <DecorativeCircle className="circle-2" />
      
      <RegisterCard>
        <Header>
          <Title>Регистрация клуба</Title>
          <Subtitle>
            Создайте свой клуб и начните организовывать незабываемые мероприятия
          </Subtitle>
        </Header>
        
        <StyledForm onSubmit={handleSubmit}>
          <FullWidthSection>
            <StyledFormGroup>
              <StyledLabel>Название клуба *</StyledLabel>
              <StyledInput
                type="text"
                placeholder="Название клуба"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name || undefined}
              />
              {errors.name && <ErrorText>{errors.name}</ErrorText>}
            </StyledFormGroup>
          </FullWidthSection>
          
          <StyledFormGroup>
            <StyledLabel>Логин клуба *</StyledLabel>
            <StyledInput
              type="text"
              placeholder="Уникальный логин для входа"
              value={formData.login}
              onChange={(e) => handleInputChange('login', e.target.value)}
              error={errors.login || undefined}
            />
            {errors.login && <ErrorText>{errors.login}</ErrorText>}
          </StyledFormGroup>
          
          <StyledFormGroup>
            <StyledLabel>Тип клуба</StyledLabel>
            <StyledSelect
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
            >
              <option value="public">Публичный</option>
              <option value="private">Приватный</option>
              <option value="exclusive">Эксклюзивный</option>
            </StyledSelect>
          </StyledFormGroup>
          
          <StyledFormGroup>
            <StyledLabel>Пароль *</StyledLabel>
            <InputWrapper>
              <StyledInput
                type={showPassword ? 'text' : 'password'}
                placeholder="Минимум 8 символов"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={errors.password || undefined}
              />
              <IconButton
                type="button"
                $variant="secondary"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  color: '#718096'
                }}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </IconButton>
            </InputWrapper>
            {errors.password && <ErrorText>{errors.password}</ErrorText>}
          </StyledFormGroup>
          
          <StyledFormGroup>
            <StyledLabel>Подтверждение пароля *</StyledLabel>
            <InputWrapper>
              <StyledInput
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Повторите пароль"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                error={errors.confirmPassword || undefined}
              />
              <IconButton
                type="button"
                $variant="secondary"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  color: '#718096'
                }}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </IconButton>
            </InputWrapper>
            {errors.confirmPassword && <ErrorText>{errors.confirmPassword}</ErrorText>}
          </StyledFormGroup>
          
          <StyledFormGroup>
            <StyledLabel>Максимум участников</StyledLabel>
            <StyledInput
              type="number"
              placeholder="Необязательно"
              value={formData.max_members}
              onChange={(e) => handleInputChange('max_members', e.target.value)}
              error={errors.max_members || undefined}
            />
            {errors.max_members && <ErrorText>{errors.max_members}</ErrorText>}
          </StyledFormGroup>
          
          <StyledFormGroup>
            <StyledLabel>Взнос за участие</StyledLabel>
            <StyledInput
              type="number"
              placeholder="0.00"
              step="0.01"
              value={formData.membership_fee}
              onChange={(e) => handleInputChange('membership_fee', e.target.value)}
              error={errors.membership_fee || undefined}
            />
            {errors.membership_fee && <ErrorText>{errors.membership_fee}</ErrorText>}
          </StyledFormGroup>
          
          <StyledFormGroup>
            <StyledLabel>Страна *</StyledLabel>
            <LocationSelector
              countryValue={formData.country}
              cityValue={formData.city}
              onCountryChange={(value) => handleInputChange('country', value)}
              onCityChange={(value) => handleInputChange('city', value)}
              countryError={errors.country || undefined}
              cityError={errors.city || undefined}
            />
            {errors.country && <ErrorText>{errors.country}</ErrorText>}
            {errors.city && <ErrorText>{errors.city}</ErrorText>}
          </StyledFormGroup>
          
          <FullWidthSection>
            <StyledFormGroup>
              <StyledLabel>Адрес *</StyledLabel>
              <StyledInput
                type="text"
                placeholder="Полный адрес клуба"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                error={errors.address || undefined}
              />
              {errors.address && <ErrorText>{errors.address}</ErrorText>}
            </StyledFormGroup>
          </FullWidthSection>
          
          <FullWidthSection>
            <StyledFormGroup>
              <StyledLabel>Описание клуба</StyledLabel>
              <StyledTextArea
                placeholder="Расскажите о вашем клубе, правилах, атмосфере..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                error={errors.description || undefined}
              />
              {errors.description && <ErrorText>{errors.description}</ErrorText>}
            </StyledFormGroup>
          </FullWidthSection>
          
          <SubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoadingSpinner size="20px" />
                Регистрация...
              </>
            ) : (
              'Создать клуб'
            )}
          </SubmitButton>
        </StyledForm>
        
        <LinksContainer>
          <LoginLink>
            Уже есть клуб? <Link to="/club/login">Войти в систему</Link>
          </LoginLink>
          
          <BackToUserAuth>
            <Link to="/register">Вернуться к регистрации пользователей</Link>
          </BackToUserAuth>
        </LinksContainer>
      </RegisterCard>
    </ClubRegisterContainer>
  );
};

export default ClubRegister;
