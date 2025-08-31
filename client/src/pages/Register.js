import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { authAPI, apiUtils } from '../services/api';
import { LocationSelector } from '../components/Geography';

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

// Иконки для глаза (показать/скрыть пароль)
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const RegisterContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  
  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const RegisterCard = styled.div`
  width: 100%;
  max-width: 900px;
  background: white;
  border-radius: 20px;
  padding: 40px;
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
    padding: 20px;
    max-width: 100%;
    border-radius: 15px;
  }
`;

const LogoSection = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Logo = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  border-radius: 20px;
  color: white;
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 15px;
  box-shadow: 0 10px 30px rgba(220, 53, 34, 0.3);
  
  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }
`;

const Title = styled.h2`
  text-align: center;
  margin: 0 0 10px 0;
  color: #2d3748;
  font-size: 28px;
  font-weight: 700;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const Subtitle = styled.p`
  text-align: center;
  color: #718096;
  font-size: 14px;
  margin-bottom: 30px;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 25%;
    right: 25%;
    height: 2px;
    background: #e2e8f0;
    transform: translateY(-50%);
    z-index: 0;
  }
`;

const Step = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${props => props.$active ? 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)' : '#e2e8f0'};
  color: ${props => props.$active ? 'white' : '#a0aec0'};
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  margin: 0 40px;
  box-shadow: ${props => props.$active ? '0 4px 15px rgba(220, 53, 34, 0.3)' : 'none'};
  
  @media (max-width: 480px) {
    width: 30px;
    height: 30px;
    font-size: 12px;
    margin: 0 25px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormSection = styled.div`
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

const SectionTitle = styled.h3`
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

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
`;

const Label = styled.label`
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

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
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

const PasswordToggle = styled.button`
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  
  &:hover {
    color: #dc3522;
  }
  
  &:focus {
    outline: none;
  }
`;

const Select = styled.select`
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

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  min-height: 100px;
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

const ErrorText = styled.span`
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

const Button = styled.button`
  padding: 14px 28px;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(220, 53, 34, 0.3);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(220, 53, 34, 0.4);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    background: linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%);
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
  
  @media (max-width: 768px) {
    padding: 12px 24px;
    font-size: 15px;
  }
`;

const SecondaryButton = styled(Button)`
  background: white;
  color: #dc3522;
  border: 2px solid #dc3522;
  box-shadow: none;
  padding: 10px 20px;
  font-size: 14px;
  
  &:hover:not(:disabled) {
    background: #fff5f5;
    transform: none;
    box-shadow: 0 2px 10px rgba(220, 53, 34, 0.2);
  }
  
  &:disabled {
    background: #f7fafc;
    border-color: #cbd5e0;
    color: #a0aec0;
  }
  
  @media (max-width: 768px) {
    padding: 8px 16px;
    font-size: 13px;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const LoginLink = styled.div`
  text-align: center;
  margin-top: 25px;
  color: #718096;
  font-size: 14px;
  
  a {
    color: #dc3522;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s ease;
    
    &:hover {
      text-decoration: underline;
      color: #ff6b58;
    }
  }
`;

const StatusOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-top: 12px;
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`;

const StatusOption = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  position: relative;
  overflow: hidden;
  
  &:hover {
    border-color: #dc3522;
    background: #fff5f5;
  }
  
  &.selected {
    border-color: #dc3522;
    background: linear-gradient(135deg, rgba(220, 53, 34, 0.05) 0%, rgba(255, 107, 88, 0.05) 100%);
    
    &::after {
      content: '✓';
      position: absolute;
      top: 8px;
      right: 12px;
      color: #dc3522;
      font-weight: bold;
      font-size: 16px;
    }
  }
  
  input[type="radio"] {
    width: 0;
    height: 0;
    opacity: 0;
    position: absolute;
  }
  
  span {
    font-size: 14px;
    color: #4a5568;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    padding: 10px 14px;
    
    span {
      font-size: 13px;
    }
  }
`;

const EmailCodeSection = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  
  .email-input-wrapper {
    flex: 1;
  }
  
  .code-button-wrapper {
    padding-top: 0;
  }
  
  @media (max-width: 576px) {
    flex-direction: column;
    
    .code-button-wrapper {
      width: 100%;
      
      button {
        width: 100%;
      }
    }
  }
`;

const CodeInputSection = styled.div`
  max-width: 250px;
  
  @media (max-width: 576px) {
    max-width: 100%;
  }
`;

const CodeTimer = styled.div`
  color: #718096;
  font-size: 13px;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &::before {
    content: '⏱';
    font-size: 14px;
  }
`;

const ProgressBar = styled.div`
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  margin: 20px 0;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.$progress}%;
    background: linear-gradient(90deg, #dc3522 0%, #ff6b58 100%);
    transition: width 0.3s ease;
  }
`;

const Register = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [codeTimer, setCodeTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  
  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    clearErrors,
    formState: { errors }
  } = useForm({
    defaultValues: {
      country: 'Россия',
      city: ''
    }
  });

  const password = watch('password');
  const email = watch('email');
  const allFields = watch();

  // Вычисление прогресса заполнения формы
  useEffect(() => {
    let requiredFields = ['login', 'email', 'password', 'confirmPassword', 'searchStatus', 'searchAge', 'city'];
    
    // Добавляем поля в зависимости от статуса
    if (selectedStatus === 'Семейная пара(М+Ж)' || selectedStatus === 'Несемейная пара(М+Ж)') {
      requiredFields.push('manBirthday', 'womanBirthday');
    } else if (selectedStatus === 'Мужчина') {
      requiredFields.push('manBirthday');
    } else if (selectedStatus === 'Женщина') {
      requiredFields.push('womanBirthday');
    }
    
    // Проверяем, что выбрано хотя бы одно место для встреч
    if (allFields.location && Array.isArray(allFields.location) && allFields.location.length > 0) {
      requiredFields.push('location');
    }
    
    const filledFields = requiredFields.filter(field => {
      if (field === 'location') {
        return allFields.location && Array.isArray(allFields.location) && allFields.location.length > 0;
      }
      return allFields[field];
    });
    
    const progress = (filledFields.length / requiredFields.length) * 100;
    setFormProgress(progress);
  }, [allFields, selectedStatus]);

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

    // Формируем данные в зависимости от статуса
    let individualData = {};
    
    if (selectedStatus === 'Семейная пара(М+Ж)' || selectedStatus === 'Несемейная пара(М+Ж)') {
      // Для пар - объединяем данные через подчеркивание
      individualData = {
        date: `${data.manBirthday}_${data.womanBirthday}`,
        height: `${data.manHeight || ''}_${data.womanHeight || ''}`,
        weight: `${data.manWeight || ''}_${data.womanWeight || ''}`,
        smoking: `${data.manSmoking || 'no_matter'}_${data.womanSmoking || 'no_matter'}`,
        alko: `${data.manAlko || 'no_matter'}_${data.womanAlko || 'no_matter'}`
      };
    } else {
      // Для одиночек - только мужские или женские данные
      if (selectedStatus === 'Мужчина') {
        individualData = {
          date: data.manBirthday,
          height: data.manHeight || '',
          weight: data.manWeight || '',
          smoking: data.manSmoking || 'no_matter',
          alko: data.manAlko || 'no_matter'
        };
      } else if (selectedStatus === 'Женщина') {
        individualData = {
          date: data.womanBirthday,
          height: data.womanHeight || '',
          weight: data.womanWeight || '',
          smoking: data.womanSmoking || 'no_matter',
          alko: data.womanAlko || 'no_matter'
        };
      }
    }

    // Обработка поля location (массив чекбоксов)
    const locationArray = Array.isArray(data.location) ? data.location : [];
    const locationString = locationArray.join('&&');

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
        location: locationString,
        mobile: data.mobile || '',
        info: data.info || ''
      },
      individual: individualData
    };

    registerMutation.mutate(submitData);
  };

  const statusTypes = [
    { value: 'Семейная пара(М+Ж)', label: 'Семейная пара(М+Ж)' },
    { value: 'Несемейная пара(М+Ж)', label: 'Несемейная пара(М+Ж)' },
    { value: 'Мужчина', label: 'Мужчина' },
    { value: 'Женщина', label: 'Женщина' }
  ];

  const searchStatusTypes = [
    { value: 'Семейная пара(М+Ж)', label: 'Семейную пару(М+Ж)' },
    { value: 'Несемейная пара(М+Ж)', label: 'Несемейную пару(М+Ж)' },
    { value: 'Мужчина', label: 'Мужчину' },
    { value: 'Женщина', label: 'Женщину' }
  ];

  const ageRanges = [
    { value: 'Возраст значения не имеет', label: 'Возраст значения не имеет' },
    { value: 'С ровестниками', label: 'С ровестниками' },
    { value: 'С ровестниками или с разницей +/- 5 лет', label: 'С ровестниками или с разницей +/- 5 лет' },
    { value: 'С ровестниками или с разницей +/- 10 лет', label: 'С ровестниками или с разницей +/- 10 лет' }
  ];

  const smokingOptions = [
    { value: 'Не курю и не переношу табачного дыма', label: 'Не курю и не переношу табачного дыма' },
    { value: 'Не курю, но терпимо отношусь к табачному дыму', label: 'Не курю, но терпимо отношусь к табачному дыму' },
    { value: 'Курю, но могу обойтись какое-то время без сигарет', label: 'Курю, но могу обойтись какое-то время без сигарет' },
    { value: 'Не могу отказаться от курения ни при каких обстоятельствах', label: 'Не могу отказаться от курения ни при каких обстоятельствах' }
  ];

  const alkoOptions = [
    { value: 'Не употребляю вообще', label: 'Не употребляю вообще' },
    { value: 'В незначительных дозах, количество выпитого не отражается на моем поведении', label: 'В незначительных дозах, количество выпитого не отражается на моем поведении' },
    { value: 'Умеренно, до легкого опьянения, контролирую свое поведение', label: 'Умеренно, до легкого опьянения, контролирую свое поведение' },
    { value: 'Могу напиться, потерять контроль над своим поведением', label: 'Могу напиться, потерять контроль над своим поведением' }
  ];

  // Определение текущего шага на основе заполненных полей
  useEffect(() => {
    if (allFields.searchStatus && allFields.searchAge && selectedStatus) {
      // Проверяем, что заполнены все необходимые поля для выбранного статуса
      let canProceed = true;
      
      if (selectedStatus === 'Семейная пара(М+Ж)' || selectedStatus === 'Несемейная пара(М+Ж)') {
        canProceed = allFields.manBirthday && allFields.womanBirthday;
      } else if (selectedStatus === 'Мужчина') {
        canProceed = allFields.manBirthday;
      } else if (selectedStatus === 'Женщина') {
        canProceed = allFields.womanBirthday;
      }
      
      if (canProceed) {
        setCurrentStep(3);
      } else {
        setCurrentStep(2);
      }
    } else if (allFields.login && allFields.email && allFields.password) {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
    }
  }, [allFields, selectedStatus]);

  return (
    <RegisterContainer style={{ position: 'relative', overflow: 'hidden' }}>
      <DecorativeCircle className="circle-1" />
      <DecorativeCircle className="circle-2" />
      <RegisterCard>
        <LogoSection>
          <Logo>SF</Logo>
          <Title>Присоединиться к SwingFox</Title>
          <Subtitle>Создайте аккаунт и найдите единомышленников</Subtitle>
        </LogoSection>
        
        <StepIndicator>
          <Step $active={currentStep >= 1}>1</Step>
          <Step $active={currentStep >= 2}>2</Step>
          <Step $active={currentStep >= 3}>3</Step>
        </StepIndicator>

        <ProgressBar $progress={formProgress} />

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
                  autoComplete="username"
                />
                {errors.login && <ErrorText>{errors.login.message}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label>Email <span className="required">*</span></Label>
                <EmailCodeSection>
                  <div className="email-input-wrapper">
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
                      autoComplete="email"
                    />
                    {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
                  </div>
                  <div className="code-button-wrapper">
                    <SecondaryButton
                      type="button"
                      onClick={handleSendCode}
                      disabled={!email || sendCodeMutation.isLoading || codeTimer > 0}
                    >
                      {sendCodeMutation.isLoading ? 'Отправка...' : 
                       codeTimer > 0 ? `${codeTimer}с` : 'Код'}
                    </SecondaryButton>
                  </div>
                </EmailCodeSection>
                {codeTimer > 0 && (
                  <CodeTimer>
                    Повторная отправка через {codeTimer} секунд
                  </CodeTimer>
                )}
              </FormGroup>
            </FormRow>

            <FormRow>
              <CodeInputSection>
                <FormGroup>
                  <Label>Код из email <span className="required">*</span></Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={emailCode}
                    onChange={(e) => {
                      // Разрешаем только цифры и максимум 6 символов
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setEmailCode(value);
                    }}
                    placeholder="123456"
                    disabled={!isCodeSent}
                    maxLength="6"
                    style={{
                      textAlign: 'center',
                      letterSpacing: '8px',
                      fontWeight: 'bold',
                      fontSize: '18px',
                      fontFamily: 'monospace'
                    }}
                  />
                  {!isCodeSent && (
                    <ErrorText>Сначала отправьте код на email</ErrorText>
                  )}
                  {emailCode.length > 0 && emailCode.length < 6 && isCodeSent && (
                    <ErrorText>Код должен содержать 6 цифр</ErrorText>
                  )}
                </FormGroup>
              </CodeInputSection>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>Пароль <span className="required">*</span></Label>
                <InputWrapper>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', {
                      required: 'Пароль обязателен',
                      minLength: {
                        value: 6,
                        message: 'Минимум 6 символов'
                      }
                    })}
                    className={errors.password ? 'error' : ''}
                    placeholder="Пароль"
                    autoComplete="new-password"
                  />
                  <PasswordToggle
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </PasswordToggle>
                </InputWrapper>
                {errors.password && <ErrorText>{errors.password.message}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label>Подтверждение пароля <span className="required">*</span></Label>
                <InputWrapper>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword', {
                      required: 'Подтвердите пароль',
                      validate: value =>
                        value === password || 'Пароли не совпадают'
                    })}
                    className={errors.confirmPassword ? 'error' : ''}
                    placeholder="Повторите пароль"
                    autoComplete="new-password"
                  />
                  <PasswordToggle
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </PasswordToggle>
                </InputWrapper>
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
                <Label>Дата рождения {selectedStatus && (selectedStatus === 'Семейная пара(М+Ж)' || selectedStatus === 'Несемейная пара(М+Ж)') ? '(Мужчина)' : ''} <span className="required">*</span></Label>
                <Input
                  type="date"
                  {...register('manBirthday', {
                    required: 'Дата рождения обязательна',
                    validate: value => {
                      const today = new Date();
                      const birthDate = new Date(value);
                      const age = today.getFullYear() - birthDate.getFullYear();
                      return age >= 18 || 'Вам должно быть больше 18 лет';
                    }
                  })}
                  className={errors.manBirthday ? 'error' : ''}
                />
                {errors.manBirthday && <ErrorText>{errors.manBirthday.message}</ErrorText>}
              </FormGroup>

              {selectedStatus && (selectedStatus === 'Семейная пара(М+Ж)' || selectedStatus === 'Несемейная пара(М+Ж)') && (
                <FormGroup>
                  <Label>Дата рождения (Женщина) <span className="required">*</span></Label>
                  <Input
                    type="date"
                    {...register('womanBirthday', {
                      required: 'Дата рождения партнера обязательна',
                      validate: value => {
                        const today = new Date();
                        const birthDate = new Date(value);
                        const age = today.getFullYear() - birthDate.getFullYear();
                        return age >= 18 || 'Партнеру должно быть больше 18 лет';
                      }
                    })}
                    className={errors.womanBirthday ? 'error' : ''}
                  />
                  {errors.womanBirthday && <ErrorText>{errors.womanBirthday.message}</ErrorText>}
                </FormGroup>
              )}

              <LocationSelector
                countryValue={watch('country')}
                cityValue={watch('city')}
                onCountryChange={(value) => {
                  setValue('country', value);
                  clearErrors('country');
                  // Сброс города при смене страны
                  if (watch('city')) {
                    setValue('city', '');
                    clearErrors('city');
                  }
                }}
                onCityChange={(value) => {
                  setValue('city', value);
                  clearErrors('city');
                }}
                countryError={errors.country?.message}
                cityError={errors.city?.message}
                required={true}
                showValidation={true}
                layout="stacked"
              />
              
              {/* Скрытые поля для react-hook-form валидации */}
              <input
                type="hidden"
                {...register('country', { required: 'Страна обязательна' })}
              />
              <input
                type="hidden"
                {...register('city', { required: 'Город обязателен' })}
              />
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>Мобильный телефон</Label>
                <Input
                  type="tel"
                  {...register('mobile')}
                  placeholder="+7 (999) 123-45-67"
                />
              </FormGroup>

              <FormGroup>
                <Label>Предпочитаемые места для встреч</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'У себя дома (пригласим к себе)', label: 'У себя дома (пригласим к себе)' },
                    { id: 'У вас дома (примем приглашение)', label: 'У вас дома (примем приглашение)' },
                    { id: 'В свинг-клубе или на закрытой вечеринке', label: 'В свинг-клубе или на закрытой вечеринке' },
                    { id: 'В сауне', label: 'В сауне' },
                    { id: 'В гостинице или на съемной квартире', label: 'В гостинице или на съемной квартире' }
                  ].map(option => (
                    <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        value={option.id}
                        {...register('location')}
                      />
                      <span style={{ fontSize: '14px' }}>{option.label}</span>
                    </label>
                  ))}
                </div>
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>Рост (см) {selectedStatus && (selectedStatus === 'Семейная пара(М+Ж)' || selectedStatus === 'Несемейная пара(М+Ж)') ? '(Мужчина)' : ''}</Label>
                <Input
                  type="number"
                  {...register('manHeight')}
                  placeholder="175"
                  min="140"
                  max="220"
                />
              </FormGroup>

              {selectedStatus && (selectedStatus === 'Семейная пара(М+Ж)' || selectedStatus === 'Несемейная пара(М+Ж)') && (
                <FormGroup>
                  <Label>Рост (см) (Женщина)</Label>
                  <Input
                    type="number"
                    {...register('womanHeight')}
                    placeholder="165"
                    min="140"
                    max="200"
                  />
                </FormGroup>
              )}
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>Вес (кг) {selectedStatus && (selectedStatus === 'Семейная пара(М+Ж)' || selectedStatus === 'Несемейная пара(М+Ж)') ? '(Мужчина)' : ''}</Label>
                <Input
                  type="number"
                  {...register('manWeight')}
                  placeholder="70"
                  min="40"
                  max="200"
                />
              </FormGroup>

              {selectedStatus && (selectedStatus === 'Семейная пара(М+Ж)' || selectedStatus === 'Несемейная пара(М+Ж)') && (
                <FormGroup>
                  <Label>Вес (кг) (Женщина)</Label>
                  <Input
                    type="number"
                    {...register('womanWeight')}
                    placeholder="55"
                    min="40"
                    max="150"
                  />
                </FormGroup>
              )}
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>Отношение к курению {selectedStatus && (selectedStatus === 'Семейная пара(М+Ж)' || selectedStatus === 'Несемейная пара(М+Ж)') ? '(Мужчина)' : ''}</Label>
                <Select {...register('manSmoking')}>
                  {smokingOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>

              {selectedStatus && (selectedStatus === 'Семейная пара(М+Ж)' || selectedStatus === 'Несемейная пара(М+Ж)') && (
                <FormGroup>
                  <Label>Отношение к курению (Женщина)</Label>
                  <Select {...register('womanSmoking')}>
                    {smokingOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
              )}
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label>Отношение к алкоголю {selectedStatus && (selectedStatus === 'Семейная пара(М+Ж)' || selectedStatus === 'Несемейная пара(М+Ж)') ? '(Мужчина)' : ''}</Label>
                <Select {...register('manAlko')}>
                  {alkoOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormGroup>

              {selectedStatus && (selectedStatus === 'Семейная пара(М+Ж)' || selectedStatus === 'Несемейная пара(М+Ж)') && (
                <FormGroup>
                  <Label>Отношение к алкоголю (Женщина)</Label>
                  <Select {...register('womanAlko')}>
                    {alkoOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
              )}
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
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '15px',
            flexWrap: 'wrap'
          }}>
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
          </div>
        </div>
      </RegisterCard>
    </RegisterContainer>
  );
};

export default Register;