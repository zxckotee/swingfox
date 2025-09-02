import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { clubApi } from '../services/clubApi';
import { authAPI } from '../services/api';
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
  TextArea,
  Button,
  ErrorText,
  FlexContainer,
  EyeIcon,
  EyeOffIcon,
  IconButton
} from '../components/UI';
import '../styles/AuthPages.css';

const ClubRegister = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [codeTimer, setCodeTimer] = useState(0);
  const [isCodeSent, setIsCodeSent] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password');
  const email = watch('email');

  // Мутация для отправки кода
  const sendCodeMutation = useMutation(authAPI.sendCode, {
    onSuccess: () => {
      toast.success('Код подтверждения отправлен на ваш email');
      setIsCodeSent(true);
      setCodeTimer(60);
      const interval = setInterval(() => {
        setCodeTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    onError: (error) => {
      toast.error('Ошибка отправки кода: ' + (error.message || 'Неизвестная ошибка'));
    }
  });

  // Мутация для регистрации клуба
  const registerMutation = useMutation(clubApi.register, {
    onSuccess: (response) => {
      if (response.success || response.token) {
        toast.success('Клуб успешно зарегистрирован!');
        navigate('/club/login');
      }
    },
    onError: (error) => {
      const errorMessage = error.message || 'Ошибка регистрации';
      toast.error(errorMessage);
    }
  });

  const handleSendCode = () => {
    if (!email) {
      toast.error('Сначала введите email');
      return;
    }
    sendCodeMutation.mutate(email);
  };

  const onSubmit = async (data) => {
    if (!emailCode) {
      toast.error('Введите код подтверждения из email');
      return;
    }

    registerMutation.mutate({
      name: data.name,
      login: data.login,
      email: data.email,
      password: data.password,
      description: data.description,
      location: data.location,
      contact_info: data.contact_info,
      website: data.website,
      type: 'general', // Заглушка - всегда "Общий"
      mail_code: emailCode
    });
  };

  return (
    <PageContainer $gradient>
      {/* Декоративные круги */}
      <div className="auth-decoration auth-decoration-top-right"></div>
      <div className="auth-decoration auth-decoration-bottom-left"></div>
      
      <ContentCard $maxWidth="600px">
        <LogoSection>
          <Logo>CF</Logo>
          <Title>Регистрация клуба</Title>
          <Subtitle>Создайте аккаунт клуба для управления мероприятиями</Subtitle>
        </LogoSection>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <FormGroup>
            <Label htmlFor="name">Название клуба *</Label>
            <Input
              type="text"
              id="name"
              placeholder="Введите название клуба"
              {...register('name', {
                required: 'Название клуба обязательно',
                minLength: {
                  value: 2,
                  message: 'Минимум 2 символа'
                },
                maxLength: {
                  value: 100,
                  message: 'Максимум 100 символов'
                }
              })}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <ErrorText>{errors.name.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="login">Логин *</Label>
            <Input
              type="text"
              id="login"
              placeholder="Введите логин клуба"
              {...register('login', {
                required: 'Логин обязателен',
                minLength: {
                  value: 3,
                  message: 'Минимум 3 символа'
                },
                maxLength: {
                  value: 50,
                  message: 'Максимум 50 символов'
                },
                pattern: {
                  value: /^[a-zA-Z0-9_-]+$/,
                  message: 'Только буквы, цифры, дефис и подчеркивание'
                }
              })}
              className={errors.login ? 'error' : ''}
            />
            {errors.login && <ErrorText>{errors.login.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="email">Email *</Label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <Input
                  type="email"
                  id="email"
                  placeholder="Введите email клуба"
                  {...register('email', {
                    required: 'Email обязателен',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Некорректный email'
                    }
                  })}
                  className={errors.email ? 'error' : ''}
                />
              </div>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={!email || sendCodeMutation.isLoading || codeTimer > 0}
                style={{
                  background: codeTimer > 0 ? '#e2e8f0' : '#dc3522',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: codeTimer > 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {sendCodeMutation.isLoading ? 'Отправка...' : 
                 codeTimer > 0 ? `${codeTimer}с` : 'Код'}
              </button>
            </div>
            {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
            {codeTimer > 0 && (
              <div style={{ 
                fontSize: '12px', 
                color: '#718096', 
                marginTop: '5px' 
              }}>
                Повторная отправка через {codeTimer} секунд
              </div>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="emailCode">Код из email *</Label>
            <Input
              type="text"
              id="emailCode"
              placeholder="Введите 6-значный код"
              value={emailCode}
              onChange={(e) => {
                // Разрешаем только цифры и максимум 6 символов
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setEmailCode(value);
              }}
              style={{
                fontFamily: 'monospace',
                fontSize: '18px',
                letterSpacing: '2px',
                textAlign: 'center'
              }}
            />
            {emailCode.length > 0 && emailCode.length < 6 && isCodeSent && (
              <ErrorText>Код должен содержать 6 цифр</ErrorText>
            )}
            {!isCodeSent && emailCode.length > 0 && (
              <ErrorText>Сначала отправьте код на email</ErrorText>
            )}
          </FormGroup>



          <FormGroup>
            <Label htmlFor="location">Местоположение (необязательно)</Label>
            <Input
              type="text"
              id="location"
              placeholder="Город, адрес или оставьте пустым"
              {...register('location', {
                maxLength: {
                  value: 200,
                  message: 'Максимум 200 символов'
                }
              })}
              className={errors.location ? 'error' : ''}
            />
            {errors.location && <ErrorText>{errors.location.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="website">Веб-сайт (необязательно)</Label>
            <Input
              type="text"
              id="website"
              placeholder="Адрес сайта или оставьте пустым"
              {...register('website')}
              className={errors.website ? 'error' : ''}
            />
            {errors.website && <ErrorText>{errors.website.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="contact_info">Контактная информация (необязательно)</Label>
            <TextArea
              id="contact_info"
              placeholder="Телефон, социальные сети, дополнительная информация или оставьте пустым"
              $minHeight="80px"
              {...register('contact_info', {
                maxLength: {
                  value: 500,
                  message: 'Максимум 500 символов'
                }
              })}
              className={errors.contact_info ? 'error' : ''}
            />
            {errors.contact_info && <ErrorText>{errors.contact_info.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="description">Описание клуба *</Label>
            <TextArea
              id="description"
              placeholder="Расскажите о вашем клубе, мероприятиях, правилах"
              $minHeight="120px"
              {...register('description', {
                required: 'Описание клуба обязательно',
                maxLength: {
                  value: 1000,
                  message: 'Максимум 1000 символов'
                }
              })}
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <ErrorText>{errors.description.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Пароль *</Label>
            <InputWrapper>
              <Input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Введите пароль (минимум 8 символов)"
                {...register('password', {
                  required: 'Пароль обязателен',
                  minLength: {
                    value: 8,
                    message: 'Минимум 8 символов'
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
            <div style={{ 
              fontSize: '12px', 
              color: '#718096', 
              marginTop: '5px' 
            }}>
              Рекомендуется: буквы и цифры для большей безопасности
            </div>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="confirmPassword">Подтвердите пароль *</Label>
            <InputWrapper>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="Повторите пароль"
                {...register('confirmPassword', {
                  required: 'Подтвердите пароль',
                  validate: value => value === password || 'Пароли не совпадают'
                })}
                className={errors.confirmPassword ? 'error' : ''}
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
            {errors.confirmPassword && <ErrorText>{errors.confirmPassword.message}</ErrorText>}
          </FormGroup>

          <Button 
            type="submit" 
            disabled={registerMutation.isLoading || !emailCode || emailCode.length !== 6} 
            style={{ width: '100%' }}
          >
            {registerMutation.isLoading ? 'Регистрация...' : 'Зарегистрировать клуб'}
          </Button>
        </Form>

        <FlexContainer $justify="center" $gap="20px" style={{ marginTop: '25px' }}>
          <Link 
            to="/club/login" 
            style={{ 
              color: '#dc3522', 
              textDecoration: 'none', 
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            Уже есть аккаунт? Войти
          </Link>
        </FlexContainer>

        <FlexContainer $justify="center" style={{ marginTop: '20px' }}>
          <Link 
            to="/register" 
            style={{ 
              color: '#718096', 
              textDecoration: 'none', 
              fontWeight: '500',
              fontSize: '13px'
            }}
          >
            ← Регистрация пользователя
          </Link>
        </FlexContainer>
      </ContentCard>
    </PageContainer>
  );
};

export default ClubRegister;
