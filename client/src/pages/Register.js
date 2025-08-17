import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { authAPI, apiUtils } from '../services/api';

const RegisterContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.md};
`;

const RegisterCard = styled.div`
  width: 100%;
  max-width: 800px;
  background: white;
  border-radius: ${props => props.theme.borderRadius};
  padding: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadow};
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.primary};
  font-size: ${props => props.theme.fonts.sizes.xlarge};
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${props => props.theme.spacing.lg};
  gap: ${props => props.theme.spacing.md};
`;

const Step = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.active ? props.theme.colors.primary : props.theme.colors.border};
  color: ${props => props.active ? 'white' : props.theme.colors.textLight};
  font-weight: bold;
  transition: all 0.3s ease;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const FormSection = styled.div`
  background: ${props => props.theme.colors.background}50;
  padding: ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const SectionTitle = styled.h3`
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  color: ${props => props.theme.colors.primary};
  font-size: ${props => props.theme.fonts.sizes.large};
  border-bottom: 2px solid ${props => props.theme.colors.primary};
  padding-bottom: ${props => props.theme.spacing.xs};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const Label = styled.label`
  font-weight: bold;
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.fonts.sizes.small};
  
  .required {
    color: ${props => props.theme.colors.error};
  }
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  font-size: ${props => props.theme.fonts.sizes.medium};
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
  
  &.error {
    border-color: ${props => props.theme.colors.error};
  }
`;

const Select = styled.select`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  font-size: ${props => props.theme.fonts.sizes.medium};
  background: white;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
  
  &.error {
    border-color: ${props => props.theme.colors.error};
  }
`;

const TextArea = styled.textarea`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  font-size: ${props => props.theme.fonts.sizes.medium};
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
  
  &.error {
    border-color: ${props => props.theme.colors.error};
  }
`;

const ErrorText = styled.span`
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.fonts.sizes.small};
`;

const Button = styled.button`
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius};
  font-size: ${props => props.theme.fonts.sizes.medium};
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primaryDark};
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: ${props => props.theme.colors.border};
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryButton = styled(Button)`
  background: ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text};
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.textLight};
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing.md};
`;

const LoginLink = styled.div`
  text-align: center;
  margin-top: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.textLight};
  
  a {
    color: ${props => props.theme.colors.primary};
    text-decoration: none;
    font-weight: bold;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const StatusOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.xs};
`;

const StatusOption = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
  
  input[type="radio"] {
    margin: 0;
  }
  
  &.selected {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.primary}10;
  }
`;

const EmailCodeSection = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  align-items: flex-end;
`;

const CodeTimer = styled.div`
  color: ${props => props.theme.colors.textLight};
  font-size: ${props => props.theme.fonts.sizes.small};
  margin-top: ${props => props.theme.spacing.xs};
`;

const Register = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [codeTimer, setCodeTimer] = useState(0);
  
  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors }
  } = useForm();

  const password = watch('password');
  const email = watch('email');

  // Таймер для повторной отправки кода
  useEffect(() => {
    let interval;
    if (codeTimer > 0) {
      interval = setInterval(() => {
        setCodeTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [codeTimer]);

  // Мутация для отправки кода
  const sendCodeMutation = useMutation(authAPI.sendCode, {
    onSuccess: () => {
      toast.success('Код отправлен на ваш email');
      setIsCodeSent(true);
      setCodeTimer(120); // 2 минуты
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  // Мутация для регистрации
  const registerMutation = useMutation(authAPI.register, {
    onSuccess: (data) => {
      toast.success('Регистрация успешна! Добро пожаловать в SwingFox!');
      navigate('/');
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const handleSendCode = () => {
    if (!email) {
      toast.error('Введите email адрес');
      return;
    }
    sendCodeMutation.mutate(email);
  };

  const onSubmit = (data) => {
    if (!emailCode) {
      toast.error('Введите код подтверждения из email');
      return;
    }

    if (!selectedStatus) {
      toast.error('Выберите ваш статус');
      return;
    }

    const submitData = {
      email: data.email,
      mail_code: emailCode,
      login: data.login,
      password: data.password,
      about: {
        status: selectedStatus,
        country: data.country || 'Россия',
        city: data.city,
        search_status: data.searchStatus,
        search_age: data.searchAge,
        location: data.location || '',
        mobile: data.mobile || '',
        info: data.info || ''
      },
      individual: {
        date: data.birthday,
        height: data.height || '',
        weight: data.weight || '',
        smoking: data.smoking || 'no_matter',
        alko: data.alko || 'no_matter'
      }
    };

    registerMutation.mutate(submitData);
  };

  const statusTypes = [
    { value: 'single_man', label: 'Одинокий мужчина' },
    { value: 'single_woman', label: 'Одинокая женщина' },
    { value: 'couple_mf', label: 'Пара М+Ж' },
    { value: 'couple_mm', label: 'Пара М+М' },
    { value: 'couple_ff', label: 'Пара Ж+Ж' },
    { value: 'open_relationship', label: 'Открытые отношения' }
  ];

  const searchStatusTypes = [
    { value: 'single_man', label: 'Одинокого мужчину' },
    { value: 'single_woman', label: 'Одинокую женщину' },
    { value: 'couple_mf', label: 'Пару М+Ж' },
    { value: 'couple_mm', label: 'Пару М+М' },
    { value: 'couple_ff', label: 'Пару Ж+Ж' },
    { value: 'any', label: 'Любых' }
  ];

  const ageRanges = [
    { value: '18-25', label: '18-25 лет' },
    { value: '25-30', label: '25-30 лет' },
    { value: '30-35', label: '30-35 лет' },
    { value: '35-40', label: '35-40 лет' },
    { value: '40-45', label: '40-45 лет' },
    { value: '45-50', label: '45-50 лет' },
    { value: '50+', label: '50+ лет' }
  ];

  const smokingOptions = [
    { value: 'never', label: 'Не курю' },
    { value: 'sometimes', label: 'Иногда' },
    { value: 'regular', label: 'Регулярно' },
    { value: 'no_matter', label: 'Не важно' }
  ];

  const alkoOptions = [
    { value: 'never', label: 'Не пью' },
    { value: 'sometimes', label: 'Иногда' },
    { value: 'regular', label: 'Регулярно' },
    { value: 'no_matter', label: 'Не важно' }
  ];

  return (
    <RegisterContainer>
      <RegisterCard>
        <Title>Присоединиться к SwingFox</Title>
        
        <StepIndicator>
          <Step active={currentStep >= 1}>1</Step>
          <Step active={currentStep >= 2}>2</Step>
          <Step active={currentStep >= 3}>3</Step>
        </StepIndicator>

        <Form onSubmit={handleSubmit(onSubmit)}>
          {/* Основная информация */}
          <FormSection>
            <SectionTitle>Основная информация</SectionTitle>
            
            <FormRow>
              <FormGroup>
                <Label>Логин <span className="required">*</span></Label>
                <Input
                  {...register('login', {
                    required: 'Логин обязателен',
                    minLength: {
                      value: 3,
                      message: 'Минимум 3 символа'
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_-]+$/,
                      message: 'Только латинские буквы, цифры, _ и -'
                    }
                  })}
                  className={errors.login ? 'error' : ''}
                  placeholder="Ваш логин"
                />
                {errors.login && <ErrorText>{errors.login.message}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label>Email <span className="required">*</span></Label>
                <EmailCodeSection>
                  <div style={{ flex: 1 }}>
                    <Input
                      type="email"
                      {...register('email', {
                        required: 'Email обязателен',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Неверный формат email'
                        }
                      })}
                      className={errors.email ? 'error' : ''}
                      placeholder="your@email.com"
                    />
                    {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
                  </div>
                  <SecondaryButton
                    type="button"
                    onClick={handleSendCode}
                    disabled={!email || sendCodeMutation.isLoading || codeTimer > 0}
                  >
                    {sendCodeMutation.isLoading ? 'Отправка...' : 
                     codeTimer > 0 ? `${codeTimer}с` : 'Отправить код'}
                  </SecondaryButton>
                </EmailCodeSection>
                {codeTimer > 0 && (
                  <CodeTimer>
                    Повторная отправка через {codeTimer} секунд
                  </CodeTimer>
                )}
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>Код из email <span className="required">*</span></Label>
                <Input
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value)}
                  placeholder="Введите код из письма"
                  disabled={!isCodeSent}
                />
                {!isCodeSent && (
                  <ErrorText>Сначала отправьте код на email</ErrorText>
                )}
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>Пароль <span className="required">*</span></Label>
                <Input
                  type="password"
                  {...register('password', {
                    required: 'Пароль обязателен',
                    minLength: {
                      value: 6,
                      message: 'Минимум 6 символов'
                    }
                  })}
                  className={errors.password ? 'error' : ''}
                  placeholder="Пароль"
                />
                {errors.password && <ErrorText>{errors.password.message}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label>Подтверждение пароля <span className="required">*</span></Label>
                <Input
                  type="password"
                  {...register('confirmPassword', {
                    required: 'Подтвердите пароль',
                    validate: value =>
                      value === password || 'Пароли не совпадают'
                  })}
                  className={errors.confirmPassword ? 'error' : ''}
                  placeholder="Повторите пароль"
                />
                {errors.confirmPassword && <ErrorText>{errors.confirmPassword.message}</ErrorText>}
              </FormGroup>
            </FormRow>
          </FormSection>

          {/* Статус и поиск */}
          <FormSection>
            <SectionTitle>Ваш статус и предпочтения</SectionTitle>
            
            <FormGroup>
              <Label>Ваш статус <span className="required">*</span></Label>
              <StatusOptions>
                {statusTypes.map(status => (
                  <StatusOption
                    key={status.value}
                    className={selectedStatus === status.value ? 'selected' : ''}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={status.value}
                      checked={selectedStatus === status.value}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      required
                    />
                    <span>{status.label}</span>
                  </StatusOption>
                ))}
              </StatusOptions>
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label>Кого ищете <span className="required">*</span></Label>
                <Select
                  {...register('searchStatus', {
                    required: 'Выберите кого ищете'
                  })}
                  className={errors.searchStatus ? 'error' : ''}
                >
                  <option value="">Выберите...</option>
                  {searchStatusTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
                {errors.searchStatus && <ErrorText>{errors.searchStatus.message}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label>Возрастной диапазон <span className="required">*</span></Label>
                <Select
                  {...register('searchAge', {
                    required: 'Выберите возрастной диапазон'
                  })}
                  className={errors.searchAge ? 'error' : ''}
                >
                  <option value="">Выберите...</option>
                  {ageRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </Select>
                {errors.searchAge && <ErrorText>{errors.searchAge.message}</ErrorText>}
              </FormGroup>
            </FormRow>
          </FormSection>

          {/* Личная информация */}
          <FormSection>
            <SectionTitle>Личная информация</SectionTitle>
            
            <FormRow>
              <FormGroup>
                <Label>Дата рождения <span className="required">*</span></Label>
                <Input
                  type="date"
                  {...register('birthday', {
                    required: 'Дата рождения обязательна',
                    validate: value => {
                      const today = new Date();
                      const birthDate = new Date(value);
                      const age = today.getFullYear() - birthDate.getFullYear();
                      return age >= 18 || 'Вам должно быть больше 18 лет';
                    }
                  })}
                  className={errors.birthday ? 'error' : ''}
                />
                {errors.birthday && <ErrorText>{errors.birthday.message}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label>Страна</Label>
                <Input
                  {...register('country')}
                  placeholder="Россия"
                  defaultValue="Россия"
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>Город <span className="required">*</span></Label>
                <Input
                  {...register('city', {
                    required: 'Город обязателен'
                  })}
                  className={errors.city ? 'error' : ''}
                  placeholder="Ваш город"
                />
                {errors.city && <ErrorText>{errors.city.message}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label>Мобильный телефон</Label>
                <Input
                  type="tel"
                  {...register('mobile')}
                  placeholder="+7 (999) 123-45-67"
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>Рост (см)</Label>
                <Input
                  type="number"
                  {...register('height')}
                  placeholder="175"
                  min="140"
                  max="220"
                />
              </FormGroup>

              <FormGroup>
                <Label>Вес (кг)</Label>
                <Input
                  type="number"
                  {...register('weight')}
                  placeholder="70"
                  min="40"
                  max="200"
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>Отношение к курению</Label>
                <Select {...register('smoking')}>
                  {smokingOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Отношение к алкоголю</Label>
                <Select {...register('alko')}>
                  {alkoOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>О себе</Label>
              <TextArea
                {...register('info')}
                placeholder="Расскажите о себе, ваших интересах и предпочтениях..."
              />
            </FormGroup>
          </FormSection>

          <Button
            type="submit"
            disabled={registerMutation.isLoading || !emailCode}
          >
            {registerMutation.isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
        </Form>

        <LoginLink>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </LoginLink>
      </RegisterCard>
    </RegisterContainer>
  );
};

export default Register;