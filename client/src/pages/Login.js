import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authAPI, apiUtils } from '../services/api';
import {
  PageContainer,
  ContentCard,
  LogoSection,
  Logo,
  Title,
  Subtitle,
  Form,
  FormGroup,
  Label,
  InputWrapper,
  Input,
  Button,
  ErrorText,
  FlexContainer,
  EyeIcon,
  EyeOffIcon,
  IconButton
} from '../components/UI';
import styled from 'styled-components';

// Декоративные круги
const DecorativeCircle = styled.div`
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(220, 53, 34, 0.3) 0%, rgba(255, 107, 88, 0.3) 100%);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(220, 53, 34, 0.4);
  z-index: 1;
  
  &.circle-1 {
    width: 200px;
    height: 200px;
    top: -100px;
    right: -100px;
    animation: float 6s ease-in-out infinite;
  }
  
  &.circle-2 {
    width: 150px;
    height: 150px;
    bottom: -75px;
    left: -75px;
    animation: float 8s ease-in-out infinite reverse;
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

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  // Проверяем, не авторизован ли уже пользователь
  React.useEffect(() => {
    const checkExistingAuth = async () => {
      if (apiUtils.isAuthenticated()) {
        try {
          // Проверяем валидность токена
          await apiUtils.refreshCurrentUser();
          navigate('/', { replace: true });
        } catch (error) {
          // Токен невалиден, очищаем
          console.warn('Токен невалиден при входе в Login');
          apiUtils.logout();
        }
      }
    };

    checkExistingAuth();
  }, [navigate]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.login({
        login: data.login,
        password: data.password
      });
      
      if (response.success) {
        toast.success('Успешная авторизация!');
        navigate('/', { replace: true });
      }
    } catch (error) {
      const errorMessage = apiUtils.handleError(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer $gradient style={{ position: 'relative', overflow: 'hidden' }}>
      <DecorativeCircle className="circle-1" />
      <DecorativeCircle className="circle-2" />
      <ContentCard $maxWidth="450px">
        <LogoSection>
          <Logo>SF</Logo>
          <Title>SwingFox</Title>
          <Subtitle>Добро пожаловать! Войдите в свой аккаунт</Subtitle>
        </LogoSection>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <FormGroup>
            <Label htmlFor="login">Логин или Email</Label>
            <Input
              type="text"
              id="login"
              placeholder="Введите логин или email"
              autoComplete="username"
              {...register('login', {
                required: 'Логин или email обязателен',
                minLength: {
                  value: 3,
                  message: 'Минимум 3 символа'
                }
              })}
              className={errors.login ? 'error' : ''}
            />
            {errors.login && <ErrorText>{errors.login.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Пароль</Label>
            <InputWrapper>
              <Input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Введите пароль"
                autoComplete="current-password"
                {...register('password', {
                  required: 'Пароль обязателен',
                  minLength: {
                    value: 6,
                    message: 'Минимум 6 символов'
                  }
                })}
                className={errors.password ? 'error' : ''}
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
            {errors.password && <ErrorText>{errors.password.message}</ErrorText>}
          </FormGroup>

          <Button type="submit" disabled={isLoading} style={{ width: '100%' }}>
            {isLoading ? 'Вход...' : 'Войти'}
          </Button>
        </Form>

        <FlexContainer $justify="center" $gap="20px" style={{ marginTop: '25px' }}>
          <Link 
            to="/register" 
            style={{ 
              color: '#dc3522', 
              textDecoration: 'none', 
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            Регистрация
          </Link>
          <span style={{ color: '#cbd5e0' }}>|</span>
          <Link 
            to="/forgot-password" 
            style={{ 
              color: '#dc3522', 
              textDecoration: 'none', 
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            Забыли пароль?
          </Link>
        </FlexContainer>

        {/* Ссылки для клубов */}
        <div style={{ 
          marginTop: '20px', 
          paddingTop: '20px', 
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{ 
            color: '#718096', 
            fontSize: '12px', 
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Для клубов
          </div>
          <FlexContainer $justify="center" $gap="15px">
            <Link 
              to="/club/login" 
              style={{ 
                color: '#805ad5', 
                textDecoration: 'none', 
                fontWeight: '600',
                fontSize: '13px',
                padding: '6px 12px',
                borderRadius: '16px',
                backgroundColor: '#f7fafc',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#edf2f7';
                e.target.style.borderColor = '#cbd5e0';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f7fafc';
                e.target.style.borderColor = '#e2e8f0';
              }}
            >
              🎪 Вход для клубов
            </Link>
            <Link 
              to="/club/register" 
              style={{ 
                color: '#38a169', 
                textDecoration: 'none', 
                fontWeight: '600',
                fontSize: '13px',
                padding: '6px 12px',
                borderRadius: '16px',
                backgroundColor: '#f0fff4',
                border: '1px solid #c6f6d5',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e6fffa';
                e.target.style.borderColor = '#9ae6b4';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f0fff4';
                e.target.style.borderColor = '#c6f6d5';
              }}
            >
              🎪 Регистрация клуба
            </Link>
          </FlexContainer>
        </div>
      </ContentCard>
    </PageContainer>
  );
};

export default Login;