import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { authAPI, apiUtils } from '../services/api';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dc3522 0%, #b8291e 100%);
  padding: ${props => props.theme.spacing.md};
`;

const LoginForm = styled.form`
  background: white;
  padding: ${props => props.theme.spacing.xl};
  border-radius: ${props => props.theme.borderRadius};
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  
  h1 {
    color: ${props => props.theme.colors.primary};
    font-size: ${props => props.theme.fonts.sizes.xxlarge};
    margin-bottom: ${props => props.theme.spacing.sm};
  }
  
  p {
    color: ${props => props.theme.colors.textLight};
    margin: 0;
  }
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.fonts.sizes.small};
  margin-top: ${props => props.theme.spacing.xs};
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius};
  font-size: ${props => props.theme.fonts.sizes.large};
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #b8291e;
  }
  
  &:disabled {
    background: ${props => props.theme.colors.textLight};
    cursor: not-allowed;
  }
`;

const FooterLinks = styled.div`
  text-align: center;
  margin-top: ${props => props.theme.spacing.lg};
  
  a {
    color: ${props => props.theme.colors.primary};
    margin: 0 ${props => props.theme.spacing.sm};
  }
`;

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  // Проверяем, не авторизован ли уже пользователь
  React.useEffect(() => {
    if (apiUtils.isAuthenticated()) {
      navigate('/', { replace: true });
    }
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
    <LoginContainer>
      <LoginForm onSubmit={handleSubmit(onSubmit)}>
        <Logo>
          <h1>SwingFox</h1>
          <p>Добро пожаловать!</p>
        </Logo>

        <div className="form-group">
          <label htmlFor="login">Логин или Email</label>
          <input
            type="text"
            id="login"
            placeholder="Введите логин или email"
            {...register('login', {
              required: 'Логин или email обязателен',
              minLength: {
                value: 3,
                message: 'Минимум 3 символа'
              }
            })}
          />
          {errors.login && (
            <ErrorMessage>{errors.login.message}</ErrorMessage>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password">Пароль</label>
          <input
            type="password"
            id="password"
            placeholder="Введите пароль"
            {...register('password', {
              required: 'Пароль обязателен',
              minLength: {
                value: 6,
                message: 'Минимум 6 символов'
              }
            })}
          />
          {errors.password && (
            <ErrorMessage>{errors.password.message}</ErrorMessage>
          )}
        </div>

        <SubmitButton type="submit" disabled={isLoading}>
          {isLoading ? 'Вход...' : 'Войти'}
        </SubmitButton>

        <FooterLinks>
          <Link to="/register">Регистрация</Link>
          <Link to="/forgot-password">Забыли пароль?</Link>
        </FooterLinks>
      </LoginForm>
    </LoginContainer>
  );
};

export default Login;