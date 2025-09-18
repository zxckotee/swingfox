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
import '../styles/AuthPages.css';

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
    <PageContainer $gradient>
      {/* Декоративные круги */}
      <div className="auth-decoration auth-decoration-top-right"></div>
      <div className="auth-decoration auth-decoration-bottom-left"></div>
      
      <ContentCard $maxWidth="450px">
        <LogoSection>
          <Logo>
            <img src="/logo.jpg" alt="SwingFox Logo" />
          </Logo>
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

        {/* Кнопки для клубов */}
        <div style={{ 
          marginTop: '30px', 
          paddingTop: '20px', 
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <p style={{ 
            color: '#718096', 
            fontSize: '14px', 
            marginBottom: '15px',
            fontWeight: '500'
          }}>
            Вы представляете клуб?
          </p>
          <FlexContainer $justify="center" $gap="15px">
            <Link 
              to="/club/login" 
              style={{ 
                background: 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)',
                color: 'white',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                padding: '10px 20px',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(220, 53, 34, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(220, 53, 34, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(220, 53, 34, 0.3)';
              }}
            >
              Вход для клубов
            </Link>
            <Link 
              to="/club/register" 
              style={{ 
                background: 'white',
                color: '#dc3522',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                padding: '10px 20px',
                borderRadius: '8px',
                border: '2px solid #dc3522',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#dc3522';
                e.target.style.color = 'white';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.color = '#dc3522';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Регистрация клуба
            </Link>
          </FlexContainer>
        </div>
      </ContentCard>
    </PageContainer>
  );
};

export default Login;