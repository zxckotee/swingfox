import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  CreditCardIcon, 
  CheckIcon
} from './index';

const TopUpContainer = styled.div`
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(220, 53, 34, 0.15);
  max-width: 600px;
  width: 100%;
  border: 2px solid #fce8e8;
  
  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 15px;
  }
`;

const TopUpHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const TopUpTitle = styled.h2`
  color: #2d3748;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 10px 0;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const TopUpSubtitle = styled.p`
  color: #718096;
  font-size: 16px;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const AmountSection = styled.div`
  margin-bottom: 30px;
`;

const AmountLabel = styled.label`
  display: block;
  color: #2d3748;
  font-weight: 600;
  margin-bottom: 10px;
  font-size: 16px;
`;

const AmountInput = styled.input`
  width: 100%;
  padding: 15px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  background: #f7fafc;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #a0aec0;
  }
  
  @media (max-width: 768px) {
    padding: 12px;
    font-size: 16px;
  }
`;

const QuickAmounts = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 15px;
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const QuickAmountButton = styled.button`
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #4a5568;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #667eea;
    color: #667eea;
    transform: translateY(-1px);
  }
  
  &.selected {
    border-color: #667eea;
    background: #667eea;
    color: white;
  }
  
  @media (max-width: 768px) {
    padding: 10px;
    font-size: 14px;
  }
`;

const PaymentMethodSection = styled.div`
  margin-bottom: 30px;
`;

const PaymentMethodLabel = styled.label`
  display: block;
  color: #2d3748;
  font-weight: 600;
  margin-bottom: 15px;
  font-size: 16px;
`;

const PaymentMethodOption = styled.div`
  display: flex;
  align-items: center;
  padding: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #667eea;
    background: #f0f4ff;
  }
`;

const PaymentMethodInfo = styled.div`
  flex: 1;
`;

const PaymentMethodName = styled.div`
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 4px;
  font-size: 18px;
`;

const PaymentMethodDescription = styled.div`
  font-size: 14px;
  color: #718096;
`;

const PaymentMethodIcon = styled.div`
  color: #667eea;
  margin-left: 15px;
  font-size: 24px;
`;

// Реалистичная карта
const CardPreview = styled.div`
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  border-radius: 15px;
  padding: 20px;
  color: white;
  position: relative;
  margin-bottom: 20px;
  box-shadow: 0 10px 30px rgba(220, 53, 34, 0.3);
  
  @media (max-width: 768px) {
    height: 180px;
    padding: 15px;
  }
`;

const CardLogo = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  font-size: 24px;
  font-weight: bold;
  
  @media (max-width: 768px) {
    font-size: 20px;
    top: 15px;
    left: 15px;
  }
`;

const CardNumberInput = styled.input`
  position: absolute;
  bottom: 80px;
  left: 20px;
  width: 280px;
  background: transparent;
  border: none;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 2px;
  font-family: 'Courier New', monospace;
  color: white;
  outline: none;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
  
  @media (max-width: 768px) {
    font-size: 16px;
    bottom: 70px;
    left: 15px;
    width: 240px;
  }
`;

const CardDetails = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  gap: 30px;
  
  @media (max-width: 768px) {
    bottom: 15px;
    left: 15px;
    gap: 20px;
  }
`;

const CardDetail = styled.div`
  font-size: 14px;
  
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const CardDetailLabel = styled.div`
  opacity: 0.8;
  margin-bottom: 2px;
`;

const CardDetailInput = styled.input`
  background: transparent;
  border: none;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  color: white;
  outline: none;
  font-size: 14px;
  width: 120px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
  
  @media (max-width: 768px) {
    font-size: 12px;
    width: 100px;
  }
`;

const CardCvvSection = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  
  @media (max-width: 768px) {
    top: 15px;
    right: 15px;
  }
`;

const CardCvvLabel = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 10px;
  }
`;

const CardCvvInput = styled.input`
  width: 60px;
  height: 30px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 6px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  outline: none;
  
  &::placeholder {
    color: #a0aec0;
  }
  
  @media (max-width: 768px) {
    width: 50px;
    height: 25px;
    font-size: 12px;
  }
`;

const CardForm = styled.div`
  margin-top: 20px;
  padding: 25px;
  background: #f8fafc;
  border-radius: 15px;
  border: 1px solid #e2e8f0;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const CardFormTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #2d3748;
  font-size: 18px;
  font-weight: 600;
`;

const CardFormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const CardInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  color: #2d3748;
  background: white;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #a0aec0;
  }
  
  @media (max-width: 768px) {
    padding: 10px;
    font-size: 14px;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 14px;
    font-size: 16px;
  }
`;

const SuccessMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  background: #f0fff4;
  border: 2px solid #68d391;
  border-radius: 12px;
  color: #22543d;
  font-weight: 600;
  margin-bottom: 20px;
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px;
  background: #fff5f5;
  border: 2px solid #f56565;
  border-radius: 12px;
  color: #742a2a;
  font-weight: 600;
  margin-bottom: 20px;
  font-size: 14px;
`;

const BalanceTopUp = ({ onClose, currentBalance = 0, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const quickAmounts = [100, 300, 500, 1000, 2000, 5000];

  const handleAmountChange = (value) => {
    setAmount(value);
    
    // Очищаем ошибку если поле пустое
    if (!value || value === '') {
      setError('');
      return;
    }
    
    const numValue = parseFloat(value);
    
    // Проверяем что это валидное число
    if (isNaN(numValue)) {
      setError('Пожалуйста, введите корректное число');
      return;
    }
    
    // Проверяем минимальную сумму
    if (numValue > 0 && numValue < 100) {
      setError('Минимальная сумма пополнения 100 рублей');
    } else {
      setError('');
    }
  };

  const handleQuickAmount = (quickAmount) => {
    setError('');
    setAmount(quickAmount.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Пожалуйста, введите сумму пополнения');
      return;
    }
    
    if (parseFloat(amount) < 100) {
      setError('Минимальная сумма пополнения 100 рублей');
      return;
    }

    if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
      setError('Пожалуйста, заполните все поля карты');
      return;
    }

    setError('');
    setIsSubmitting(true);
    
    // Имитация отправки запроса
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Сброс формы через 3 секунды
      setTimeout(() => {
        setIsSuccess(false);
        if (onClose) {
          onClose();
        }
      }, 3000);
    }, 2000);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };



  if (isSuccess) {
    return (
      <TopUpContainer>
        <SuccessMessage>
          <CheckIcon />
          Баланс успешно пополнен на {amount} 🦊!
        </SuccessMessage>
      </TopUpContainer>
    );
  }

  return (
    <TopUpContainer>
      <TopUpHeader>
        <TopUpTitle>Пополнение баланса</TopUpTitle>
        <TopUpSubtitle>Текущий баланс: {currentBalance} 🦊</TopUpSubtitle>
      </TopUpHeader>

      <form onSubmit={handleSubmit}>
        <AmountSection>
          <AmountLabel>Сумма пополнения (🦊)</AmountLabel>
          <AmountInput
            type="number"
            placeholder="Введите сумму"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            min="1"
            step="1"
          />

          {error && <ErrorMessage>{error}</ErrorMessage>}
          <QuickAmounts>
            {quickAmounts.map((quickAmount) => (
              <QuickAmountButton
                key={quickAmount}
                type="button"
                className={amount === quickAmount.toString() ? 'selected' : ''}
                onClick={() => handleQuickAmount(quickAmount)}
              >
                {quickAmount}
              </QuickAmountButton>
            ))}
          </QuickAmounts>
        </AmountSection>

        <PaymentMethodSection>
          <PaymentMethodLabel>Способ оплаты</PaymentMethodLabel>
          <PaymentMethodOption>
            <PaymentMethodInfo>
              <PaymentMethodName>Банковская карта</PaymentMethodName>
              <PaymentMethodDescription>Visa, MasterCard, МИР</PaymentMethodDescription>
            </PaymentMethodInfo>
            <PaymentMethodIcon>
              <CreditCardIcon />
            </PaymentMethodIcon>
          </PaymentMethodOption>
        </PaymentMethodSection>

        {/* Интерактивная карта с полями ввода */}
        <CardPreview>
          <CardLogo>💳</CardLogo>
          
          {/* Поле для номера карты */}
          <CardNumberInput
            type="text"
            placeholder="**** **** **** ****"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            maxLength="19"
          />
          
          {/* Поля для имени и срока действия */}
          <CardDetails>
            <CardDetail>
              <CardDetailLabel>ВЛАДЕЛЕЦ</CardDetailLabel>
              <CardDetailInput
                type="text"
                placeholder="ИМЯ ФАМИЛИЯ"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
            </CardDetail>
            <CardDetail>
              <CardDetailLabel>СРОК ДЕЙСТВИЯ</CardDetailLabel>
              <CardDetailInput
                type="text"
                placeholder="MM/YY"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                maxLength="5"
              />
            </CardDetail>
          </CardDetails>
          
          {/* Поле для CVV (справа от карты) */}
          <CardCvvSection>
            <CardCvvLabel>CVV</CardCvvLabel>
            <CardCvvInput
              type="text"
              placeholder="123"
              value={cardCvv}
              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
              maxLength="4"
            />
          </CardCvvSection>
        </CardPreview>

        <SubmitButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Обработка...' : `Пополнить на ${amount || 0} 🦊`}
        </SubmitButton>
      </form>
    </TopUpContainer>
  );
};

export default BalanceTopUp;
