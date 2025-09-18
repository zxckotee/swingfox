import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { clubApi, clubAuth } from '../services/clubApi';
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

const ClubLogin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  // Проверяем, не авторизован ли уже клуб
  React.useEffect(() => {
    const checkExistingAuth = async () => {
      if (clubAuth.isAuthenticated()) {
        try {
          // Проверяем валидность токена
          await clubApi.getProfile();
          navigate('/club/dashboard', { replace: true });
        } catch (error) {
          // Токен невалиден, очищаем
          console.warn('Токен клуба невалиден при входе в ClubLogin');
          clubAuth.removeToken();
        }
      }
    };

    checkExistingAuth();
  }, [navigate]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const response = await clubApi.login({
        login: data.login,
        password: data.password
      });
      
      if (response.token) {
        toast.success('Успешная авторизация клуба!');
        navigate('/club/dashboard', { replace: true });
      }
    } catch (error) {
      const errorMessage = error.message || 'Ошибка авторизации';
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
            <img src="/logo.jpg" alt="SwingFox Club Logo" />
          </Logo>
          <Title>SwingFox Club</Title>
          <Subtitle>Добро пожаловать! Войдите в аккаунт клуба</Subtitle>
        </LogoSection>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <FormGroup>
            <Label htmlFor="login">Логин или Email</Label>
            <Input
              type="text"
              id="login"
              placeholder="Введите логин или email клуба"
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
            {isLoading ? 'Вход...' : 'Войти в клуб'}
          </Button>
        </Form>

        <FlexContainer $justify="center" $gap="20px" style={{ marginTop: '25px' }}>
          <Link 
            to="/club/register" 
            style={{ 
              color: '#dc3522', 
              textDecoration: 'none', 
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            Регистрация клуба
          </Link>
          <span style={{ color: '#cbd5e0' }}>|</span>
          <Link 
            to="/club/forgot-password" 
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

        <FlexContainer $justify="center" style={{ marginTop: '20px' }}>
          <Link 
            to="/login" 
            style={{ 
              color: '#718096', 
              textDecoration: 'none', 
              fontWeight: '500',
              fontSize: '13px'
            }}
          >
            ← Вернуться к входу пользователей
          </Link>
        </FlexContainer>
      </ContentCard>
    </PageContainer>
  );
};

export default ClubLogin;
