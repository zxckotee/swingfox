import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom'; // Добавляем импорт Link
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { swipeAPI, apiUtils } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';
// Убираем импорт getStatusDisplayName, так как теперь статусы уже русские
import {
  PageContainer,
  Avatar,
  Button,
  IconButton,
  LoadingSpinner,
  FlexContainer,
  Card,
  HeartIcon,
  Modal,
  ModalContent,
  ModalHeader,
  CloseIcon,
  TextArea
} from '../components/UI';

// Иконки для действий
const DislikeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SuperlikeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12,2 15.09,8.26 22,9 17,14.74 18.18,21.02 12,17.77 5.82,21.02 7,14.74 2,9 8.91,8.26 12,2"/>
  </svg>
);

const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H6m6-7l-7 7 7 7"/>
  </svg>
);

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const HomeContainer = styled(PageContainer)`
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Header = styled.div`
  background: white;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e2e8f0;
  
  /* Большие экраны */
  @media (min-width: 1440px) {
    padding: 25px;
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
  }
  
  /* Средние экраны */
  @media (max-width: 1200px) {
    padding: 20px;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
  }
  
  /* Планшеты в альбомной ориентации */
  @media (max-width: 1024px) {
    padding: 18px;
    box-shadow: 0 3px 16px rgba(0, 0, 0, 0.08);
  }
  
  /* Планшеты в портретной ориентации */
  @media (max-width: 768px) {
    padding: 15px;
    box-shadow: 0 3px 15px rgba(0, 0, 0, 0.08);
  }
  
  /* Большие мобильные */
  @media (max-width: 576px) {
    padding: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
  
  /* Мобильные */
  @media (max-width: 480px) {
    padding: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  }
  
  /* Маленькие мобильные */
  @media (max-width: 360px) {
    padding: 8px;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);
  }
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  /* Большие экраны */
  @media (min-width: 1440px) {
    max-width: 1400px;
  }
  
  /* Средние экраны */
  @media (max-width: 1200px) {
    max-width: 100%;
  }
  
  /* Планшеты */
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  /* Мобильные */
  @media (max-width: 480px) {
    gap: 12px;
  }
`;

const WelcomeText = styled.div`
  h1 {
    margin: 0 0 5px 0;
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  p {
    margin: 0;
    color: #718096;
    font-size: 14px;
  }
  
  /* Большие экраны */
  @media (min-width: 1440px) {
    h1 {
      font-size: 32px;
    }
    
    p {
      font-size: 16px;
    }
  }
  
  /* Средние экраны */
  @media (max-width: 1200px) {
    h1 {
      font-size: 28px;
    }
    
    p {
      font-size: 14px;
    }
  }
  
  /* Планшеты в альбомной ориентации */
  @media (max-width: 1024px) {
    h1 {
      font-size: 26px;
    }
    
    p {
      font-size: 14px;
    }
  }
  
  /* Планшеты в портретной ориентации */
  @media (max-width: 768px) {
    h1 {
      font-size: 24px;
    }
    
    p {
      font-size: 13px;
    }
  }
  
  /* Большие мобильные */
  @media (max-width: 576px) {
    h1 {
      font-size: 22px;
    }
    
    p {
      font-size: 13px;
    }
  }
  
  /* Мобильные */
  @media (max-width: 480px) {
    h1 {
      font-size: 20px;
    }
    
    p {
      font-size: 12px;
    }
  }
  
  /* Маленькие мобильные */
  @media (max-width: 360px) {
    h1 {
      font-size: 18px;
    }
    
    p {
      font-size: 11px;
    }
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  .user-details {
    text-align: right;
    
    .username {
      font-weight: 600;
      color: #2d3748;
      margin: 0;
    }
    
    .status {
      font-size: 12px;
      color: #718096;
      margin: 0;
    }
  }
  
  /* Большие экраны */
  @media (min-width: 1440px) {
    gap: 15px;
    
    .user-details .username {
      font-size: 16px;
    }
    
    .user-details .status {
      font-size: 13px;
    }
  }
  
  /* Средние экраны */
  @media (max-width: 1200px) {
    gap: 12px;
  }
  
  /* Планшеты в альбомной ориентации */
  @media (max-width: 1024px) {
    gap: 10px;
    
    .user-details .username {
      font-size: 15px;
    }
    
    .user-details .status {
      font-size: 12px;
    }
  }
  
  /* Планшеты в портретной ориентации */
  @media (max-width: 768px) {
    gap: 8px;
    
    .user-details .username {
      font-size: 14px;
    }
    
    .user-details .status {
      font-size: 11px;
    }
  }
  
  /* Большие мобильные */
  @media (max-width: 576px) {
    gap: 6px;
    
    .user-details .username {
      font-size: 13px;
    }
    
    .user-details .status {
      font-size: 10px;
    }
  }
  
  /* Мобильные */
  @media (max-width: 480px) {
    .user-details {
      display: none;
    }
  }
`;

const SwipeContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  position: relative;
  max-width: 500px;
  margin: 0 auto;
  width: 100%;
  
  @media (max-width: 768px) {
    padding: 20px 15px;
  }
  
  /* Десктопная версия */
  @media (min-width: 1024px) {
    max-width: 900px;
    padding: 40px;
  }
`;

const ProfileCard = styled(motion.div)`
  width: 100%;
  max-width: 400px;
  height: 650px;
  background: white;
  border-radius: 25px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  position: relative;
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }
  
  @media (max-width: 768px) {
    height: 650px; /* Увеличиваем высоту для мобильной версии */
    max-width: 100%;
  }
  
  @media (max-width: 480px) {
    height: 600px; /* Оптимальная высота для маленьких экранов */
  }
  
  /* Десктопная версия */
  @media (min-width: 1024px) {
    max-width: 800px;
    height: 500px;
    display: flex;
    flex-direction: row;
  }
`;

const ProfileImage = styled.div`
  width: 100%;
  height: 65%;
  background-image: url(${props => props.$src});
  background-size: cover;
  background-position: center;
  background-color: #f7fafc;
  position: relative;
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      transparent 40%,
      rgba(0,0,0,0.2) 70%,
      rgba(0,0,0,0.8) 100%
    );
    transition: all 0.3s ease;
  }
  
  ${props => !props.$src && `
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
    color: #a0aec0;
    font-size: 48px;
    font-weight: bold;
    
    &::before {
      display: none;
    }
  `}
  
  @media (max-width: 768px) {
    height: 60%; /* Уменьшаем высоту изображения в мобильной версии */
  }
  
  @media (max-width: 480px) {
    height: 55%; /* Еще больше уменьшаем для маленьких экранов */
  }
  
  /* Десктопная версия */
  @media (min-width: 1024px) {
    width: 50%;
    height: 100%;
    
    &::before {
      background: linear-gradient(
        to right,
        transparent 0%,
        transparent 60%,
        rgba(0,0,0,0.2) 80%,
        rgba(0,0,0,0.8) 100%
      );
    }
  }
`;

const ProfileOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  color: white;
  z-index: 2;
  transition: all 0.3s ease;
  
  .username {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 6px 0;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
  }
  
  .location {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    opacity: 0.9;
    margin-bottom: 3px;
    transition: all 0.3s ease;
  }
  
  .age {
    font-size: 14px;
    opacity: 0.9;
    transition: all 0.3s ease;
  }
  
  @media (max-width: 768px) {
    padding: 16px;
    
    .username {
      font-size: 20px;
    }
    
    .location, .age {
      font-size: 12px;
    }
  }
  
  /* Десктопная версия */
  @media (min-width: 1024px) {
    padding: 30px;
    
    .username {
      font-size: 28px;
    }
    
    .location, .age {
      font-size: 16px;
    }
  }
`;

const ProfileDetails = styled.div`
  padding: 20px;
  height: 35%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow-y: auto; /* Добавляем вертикальный скролл */
  overflow-x: hidden; /* Предотвращаем горизонтальный скролл */
  transition: all 0.3s ease;
  
  /* Стили для скроллбара */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
  
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
    color: white;
    padding: 6px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 10px;
    align-self: flex-start;
    box-shadow: 0 4px 12px rgba(220, 53, 34, 0.3);
    transition: all 0.3s ease;
  }
  
  .compatibility-badge {
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    border-radius: 16px;
    padding: 12px 16px;
    color: white;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
    margin: 8px 0;
    transition: all 0.3s ease;
    
    .percentage {
      font-weight: bold;
      font-size: 13px;
    }
    
    .progress-bar {
      flex: 1;
      height: 6px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
      overflow: hidden;
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #ffffff 0%, #e6fffa 100%);
        border-radius: 3px;
        transition: width 0.3s ease;
      }
    }
  }
  
  .partner-info {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 8px 12px;
    color: white;
    font-size: 12px;
    margin: 8px 0;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
    
    .title {
      font-weight: bold;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .details {
      opacity: 0.9;
      font-size: 11px;
    }
  }
  
  .additional-info {
    display: grid;
    grid-template-columns: 1fr; /* В мобильной версии всегда одна колонка */
    gap: 6px;
    margin: 8px 0;
    
    .info-item {
      display: flex;
      align-items: flex-start; /* Выравниваем по верху для многострочного текста */
      gap: 8px;
      font-size: 11px;
      color: #4a5568;
      padding: 8px 10px;
      background: #f7fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      transition: all 0.3s ease;
      
      .emoji {
        font-size: 14px;
        flex-shrink: 0; /* Эмодзи не сжимается */
        margin-top: 1px; /* Небольшое выравнивание по верху */
      }
      
      .text {
        font-weight: 500;
        flex: 1; /* Текст занимает все доступное место */
        line-height: 1.4;
        
        /* Стили для вложенных элементов (для пар) */
        div {
          display: flex;
          flex-direction: column;
          gap: 4px;
          
          span {
            font-size: 11px;
            line-height: 1.3;
            color: #4a5568;
          }
        }
      }
      
      &:hover {
        background: #edf2f7;
        border-color: #cbd5e0;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }
  
  .info {
    color: #4a5568;
    font-size: 13px;
    line-height: 1.4;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    margin-top: 12px;
    transition: all 0.3s ease;
  }
  
  @media (max-width: 768px) {
    padding: 16px;
    height: 40%; /* Увеличиваем высоту в мобильной версии */
    
    .status-badge {
      font-size: 11px;
      padding: 5px 10px;
    }
    
    .compatibility-badge, .partner-info {
      font-size: 11px;
      padding: 6px 10px;
    }
    
    .additional-info {
      gap: 4px;
      
      .info-item {
        font-size: 10px;
        padding: 6px 8px;
        
        .emoji {
          font-size: 12px;
        }
        
        .text {
          font-size: 10px;
          
          div {
            span {
              font-size: 10px;
            }
          }
        }
      }
    }
    
    .info {
      font-size: 12px;
      -webkit-line-clamp: 2;
    }
  }
  
  @media (max-width: 480px) {
    padding: 12px;
    height: 45%; /* Еще больше увеличиваем высоту для маленьких экранов */
    
    .additional-info {
      gap: 3px;
      
      .info-item {
        padding: 5px 6px;
        
        .emoji {
          font-size: 11px;
        }
        
        .text {
          font-size: 9px;
          
          div {
            span {
              font-size: 9px;
            }
          }
        }
      }
    }
  }
  
  /* Десктопная версия */
  @media (min-width: 1024px) {
    width: 50%;
    height: 100%;
    padding: 30px;
    overflow-y: auto; /* Сохраняем скролл для десктопа */
    
    .status-badge {
      font-size: 14px;
      padding: 8px 16px;
    }
    
    .compatibility-badge {
      font-size: 14px;
      padding: 16px 20px;
      
      .percentage {
        font-size: 15px;
      }
    }
    
    .partner-info {
      font-size: 14px;
      padding: 12px 16px;
      
      .details {
        font-size: 13px;
      }
    }
    
    .additional-info {
      grid-template-columns: 1fr 1fr; /* В десктопной версии делаем две колонки */
      gap: 8px;
      
      .info-item {
        font-size: 13px;
        padding: 8px 12px;
        
        .text {
          font-size: 11px;
          line-height: 1.4;
          
          /* Стили для вложенных элементов */
          div {
            span {
              font-size: 11px;
              line-height: 1.3;
            }
          }
        }
      }
    }
    
    .info {
      font-size: 15px;
      -webkit-line-clamp: 4;
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 25px;
  padding: 30px 20px 40px;
  transition: all 0.3s ease;
  
  @media (max-width: 768px) {
    gap: 20px;
    padding: 25px 15px 35px;
  }
  
  /* Десктопная версия */
  @media (min-width: 1024px) {
    gap: 30px;
    padding: 40px;
  }
`;

const ActionButton = styled(IconButton)`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }
  
  &:hover::before {
    transform: translateX(100%);
  }
  
  &.dislike {
    background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
    
    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
      transform: scale(1.15) translateY(-5px);
      box-shadow: 0 15px 40px rgba(245, 101, 101, 0.5);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
  
  &.like {
    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
    
    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
      transform: scale(1.15) translateY(-5px);
      box-shadow: 0 15px 40px rgba(72, 187, 120, 0.5);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
  
  &.superlike {
    background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%);
    
    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
      transform: scale(1.15) translateY(-5px);
      box-shadow: 0 15px 40px rgba(246, 173, 85, 0.5);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
  
  &.back {
    background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
    
    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
      transform: scale(1.15) translateY(-5px);
      box-shadow: 0 15px 40px rgba(160, 174, 192, 0.5);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
    
  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
  }
  
  @media (max-width: 480px) {
    width: 55px;
    height: 55px;
  }
  
  /* Десктопная версия */
  @media (min-width: 1024px) {
    width: 80px;
    height: 80px;
  }
`;

const NoMoreProfiles = styled.div`
  text-align: center;
  color: #718096;
  padding: 60px 20px;
  animation: fadeInUp 0.6s ease-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  
  .icon {
    font-size: 72px;
    margin-bottom: 54px; /* Увеличиваем с 24px до 54px (24 + 30) */
    opacity: 0.7;
    animation: bounce 2s ease-in-out infinite;
    line-height: 1;
    display: block;
    text-align: center;
    width: 100%;
    transform: translateX(-2px);
  }
  
  h3 {
    margin: 0 0 16px 0;
    font-size: 28px;
    color: #2d3748;
    font-weight: 700;
    animation: slideInUp 0.8s ease-out 0.2s both;
    line-height: 1.2;
    text-align: center;
    width: 100%;
  }
  
  p {
    margin: 0 0 32px 0;
    font-size: 16px;
    line-height: 1.6;
    max-width: 320px;
    margin-left: auto;
    margin-right: auto;
    animation: slideInUp 0.8s ease-out 0.4s both;
    color: #718096;
    text-align: center;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0) translateX(-2px);
    }
    40% {
      transform: translateY(-10px) translateX(-2px);
    }
    60% {
      transform: translateY(-5px) translateX(-2px);
    }
  }
  
  @media (max-width: 768px) {
    padding: 40px 20px;
    min-height: 300px;
    
    .icon {
      font-size: 56px;
      margin-bottom: 50px; /* Увеличиваем с 20px до 50px (20 + 30) */
      transform: translateX(-1px);
    }
    
    h3 {
      font-size: 24px;
      margin-bottom: 14px;
    }
    
    p {
      font-size: 15px;
      margin-bottom: 28px;
      max-width: 280px;
    }
  }
  
  @media (max-width: 480px) {
    padding: 30px 16px;
    min-height: 250px;
    
    .icon {
      font-size: 48px;
      margin-bottom: 48px; /* Увеличиваем с 18px до 48px (18 + 30) */
      transform: translateX(-1px);
    }
    
    h3 {
      font-size: 22px;
      margin-bottom: 12px;
    }
    
    p {
      font-size: 14px;
      margin-bottom: 24px;
      max-width: 260px;
    }
  }
`;

const SwipeHint = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px 25px;
  border-radius: 15px;
  font-size: 14px;
  text-align: center;
  pointer-events: none;
  opacity: ${props => props.$show ? 1 : 0};
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  /* Красивая анимация появления */
  ${props => props.$show && `
    animation: hintPulse 2s ease-in-out infinite;
  `}
  
  @keyframes hintPulse {
    0%, 100% {
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      transform: translate(-50%, -50%) scale(1.05);
    }
  }
  
  @media (max-width: 768px) {
    padding: 12px 20px;
    font-size: 13px;
  }
`;

// Добавляем стилизованный компонент для кликабельного никнейма
const ClickableUsername = styled(Link)`
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 6px 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  color: white;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: block;
  
  &:hover {
    color: #ffd700;
    text-shadow: 0 2px 8px rgba(255, 215, 0, 0.5);
    transform: scale(1.02);
  }
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const Home = () => {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showSuperlikeModal, setShowSuperlikeModal] = useState(false);
  const [superlikeMessage, setSuperlikeMessage] = useState('');
  const [swipeDirection, setSwipeDirection] = useState(null); // 'left' для дизлайка, 'right' для лайка
  const [profileQueue, setProfileQueue] = useState([]); // Очередь предзагруженных профилей
  const [isPreloading, setIsPreloading] = useState(false); // Флаг предзагрузки
  
  // Добавляем состояние для истории профилей
  const [profileHistory, setProfileHistory] = useState([]); // История предыдущих профилей (максимум 3)
  const [historyIndex, setHistoryIndex] = useState(-1); // Индекс в истории (-1 = нет истории)
  
  // ДОБАВИТЬ ЭТО: уникальный ключ для каждого показа профиля
  const [profileShowKey, setProfileShowKey] = useState(0);
  
  const queryClient = useQueryClient();
  const currentUser = apiUtils.getCurrentUser();
  const { showMatchPopup } = useNotifications();

  // Функция для форматирования возраста партнеров
  const formatPartnerAge = (dateString) => {
    if (!dateString) return 'Возраст не указан';
    
    try {
      const birthDate = new Date(dateString);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1;
      }
      
      return age;
    } catch (error) {
      return 'Возраст не указан';
    }
  };

  // Функция для парсинга дат из поля date (формат: "2000-02-12_2000-01-02")
  const parseDateField = (dateField) => {
    console.log('parseDateField вызвана с:', dateField);
    
    if (!dateField) {
      console.log('dateField пустой');
      return null;
    }
    
    if (!dateField.includes('_')) {
      console.log('dateField не содержит "_"');
      return null;
    }
    
    const [manDate, womanDate] = dateField.split('_');
    console.log('Разделено на:', { manDate, womanDate });
    
    return {
      manDate: manDate.trim(),
      womanDate: womanDate.trim()
    };
  };

  // Функция для получения возраста из поля date
  const getAgeFromDate = (dateField) => {
    console.log('getAgeFromDate вызвана с:', dateField);
    
    const dates = parseDateField(dateField);
    console.log('parseDateField результат:', dates);
    
    if (!dates) {
      console.log('parseDateField вернул null');
      return null;
    }
    
    
    const manAge = formatPartnerAge(dates.manDate);
    const womanAge = formatPartnerAge(dates.womanDate);
    
    
    return {
      manAge,
      womanAge
    };
  };

  // Функция для добавления профиля в историю
  const addToHistory = (profile) => {
    if (!profile) return;
    
    setProfileHistory(prev => {
      const newHistory = [...prev, profile];
      // Ограничиваем историю 3 профилями
      if (newHistory.length > 3) {
        return newHistory.slice(-3);
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 2)); // Максимум индекс 2 (3 профиля)
    
    // Отладочная информация
    console.log('Добавлен в историю:', profile.login, 'История:', profileHistory.length + 1);
  };

  // Функция предзагрузки профилей
  const preloadProfiles = async (count = 10) => {
    if (isPreloading) return;
    
    setIsPreloading(true);
    
    try {
      // Не исключаем уже просмотренные анкеты, разрешаем дублирование
      
      console.log('🔄 === ПРЕДЗАГРУЗКА ПРОФИЛЕЙ ===');
      console.log('📊 Запрашиваем профили:', { count, currentQueueLength: profileQueue.length });
      
      // Загружаем профили одним batch запросом
      const newProfiles = await swipeAPI.getProfilesBatch(count, []);
      
      console.log('📥 === ПРОФИЛИ ПОЛУЧЕНЫ С БЭКЕНДА ===');
      console.log('📋 Общее количество полученных профилей:', newProfiles?.length || 0);
      
      if (newProfiles && newProfiles.length > 0) {
        // Логируем каждый полученный профиль
        newProfiles.forEach((profile, index) => {
          console.log(`👤 Профиль ${index + 1}:`, {
            id: profile.id,
            login: profile.login,
            ava: profile.ava,
            status: profile.status,
            city: profile.city,
            distance: profile.distance,
            age: profile.age,
            viptype: profile.viptype,
            isCouple: profile.isCouple,
            height: profile.height,
            weight: profile.weight,
            smoking: profile.smoking,
            alko: profile.alko
          });
        });
        
        if (profileQueue.length === 0 && !currentProfile) {
          // Если нет текущего профиля, первый становится текущим
          console.log('🎯 Устанавливаем первый профиль как текущий:', newProfiles[0].login);
          setCurrentProfile(newProfiles[0]);
          setProfileQueue(newProfiles.slice(1));
          console.log('📚 Остальные профили добавлены в очередь:', newProfiles.slice(1).map(p => p.login));
        } else {
          // Иначе добавляем в очередь
          console.log('📚 Добавляем профили в существующую очередь');
          const oldQueueLength = profileQueue.length;
          setProfileQueue(prev => [...prev, ...newProfiles]);
          console.log(`📊 Размер очереди: ${oldQueueLength} → ${oldQueueLength + newProfiles.length}`);
        }
      } else {
        console.warn('⚠️ Получен пустой массив профилей или null');
      }
      
      console.log('✅ === ПРЕДЗАГРУЗКА ЗАВЕРШЕНА ===');
      
    } catch (error) {
      // Игнорируем ошибки предзагрузки, но логируем для отладки
      console.error('❌ Ошибка предзагрузки профилей:', error);
    } finally {
      setIsPreloading(false);
    }
  };

  // Функция получения следующего профиля
  const getNextProfile = () => {
    console.log('🔄 === ПОЛУЧЕНИЕ СЛЕДУЮЩЕГО ПРОФИЛЯ ===');
    console.log('📊 Текущее состояние:', {
      currentProfile: currentProfile?.login || 'null',
      profileQueueLength: profileQueue.length,
      historyLength: profileHistory.length,
      historyIndex
    });
    
    if (profileQueue.length > 0) {
      // Сохраняем текущий профиль в историю
      if (currentProfile) {
        console.log('📚 Добавляем в историю:', currentProfile.login);
        addToHistory(currentProfile);
      }
      
      // Берем профиль из очереди
      const nextProfile = profileQueue[0];
      console.log('👉 Следующий профиль из очереди:', nextProfile.login);
      
      // Мгновенно обновляем состояние
      setProfileQueue(prev => prev.slice(1));
      setCurrentProfile(nextProfile);
      
      // ДОБАВИТЬ ЭТО: генерируем новый уникальный ключ
      setProfileShowKey(prev => prev + 1);
      
      console.log('📊 Обновленное состояние:', {
        newCurrentProfile: nextProfile.login,
        newQueueLength: profileQueue.length - 1,
        newProfileShowKey: profileShowKey + 1
      });
      
      // Если в очереди осталось 3 профиля, подгружаем еще 10
      if (profileQueue.length <= 3) {
        console.log('🔄 Запускаем предзагрузку (очередь <= 3)');
        preloadProfiles(10);
      }
      
      console.log('✅ === ПРОФИЛЬ УСПЕШНО ПОЛУЧЕН ===');
      return nextProfile;
    } else {
      // Если очередь пуста, загружаем новую партию
      console.log('⚠️ Очередь пуста, запускаем предзагрузку');
      preloadProfiles(10);
      
      // ВАЖНО: возвращаем текущий профиль, чтобы анимация не сломалась
      // Это позволит показать ту же анкету снова (что нормально для пары)
      console.log('🔄 Возвращаем текущий профиль для предотвращения дергания:', currentProfile?.login);
      console.log('✅ === ПРОФИЛЬ ВОЗВРАЩЕН (ДУБЛИРОВАНИЕ) ===');
      return currentProfile;
    }
  };

  // Получение профилей - теперь загружаем batch сразу
  const { data: initialProfiles, isLoading, refetch } = useQuery(
    'initial-profiles',
    () => swipeAPI.getProfilesBatch(10, []), // Не исключаем анкеты
    {
      onSuccess: (data) => {
        if (data && data.length > 0) {
          // Первый профиль становится текущим
          setCurrentProfile(data[0]);
          // Остальные идут в очередь
          setProfileQueue(data.slice(1));
          // ДОБАВИТЬ ЭТО: устанавливаем начальный ключ
          setProfileShowKey(1);
          // Запускаем предзагрузку следующей партии
          preloadProfiles(10);
        } else {
          setCurrentProfile(null);
        }
        setSwipeDirection(null);
      },
      onError: (error) => {
        console.error('Error loading initial profiles:', error);
        if (error.response?.data?.error === 'no_profiles') {
          setCurrentProfile(null);
        } else {
          toast.error(apiUtils.handleError(error));
        }
        setSwipeDirection(null);
      }
    }
  );

  // Мутации для лайков
  const likeMutation = useMutation(
    ({ targetUser, source }) => swipeAPI.like(targetUser, source),
    {
      onSuccess: async (data) => {
        if (data.result === 'reciprocal_like' || data.match_created) {
          // Проверяем, не было ли уже мэтча с этим пользователем
          if (currentProfile) {
            try {
              const matchStatus = await swipeAPI.checkExistingMatch(currentProfile.login);
              
              // Показываем попап только если мэтча еще не было
              if (!matchStatus.hasMatch) {
                showMatchPopup({
                  username: currentProfile.login,
                  userData: {
                    avatar: currentProfile.ava,
                    login: currentProfile.login
                  }
                });
                toast.success('Взаимная симпатия! 💕', { duration: 6000 });
              } else {
                toast.success('Лайк отправлен! 💖');
              }
            } catch (error) {
              console.error('Error checking existing match:', error);
              // В случае ошибки показываем попап для безопасности
              showMatchPopup({
                username: currentProfile.login,
                userData: {
                  avatar: currentProfile.ava,
                  login: currentProfile.login
                }
              });
              toast.success('Взаимная симпатия! 💕', { duration: 6000 });
            }
          }
        } else {
          toast.success('Лайк отправлен! 💖');
        }
        // Мгновенно получаем следующий профиль
        setSwipeDirection(null);
        getNextProfile(); // Теперь всегда возвращает валидный профиль
        
        if (!currentProfile) {
          // Если нет следующего профиля, показываем состояние загрузки
          setCurrentProfile(null);
          // Или можно показать спиннер загрузки
        }
      },
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
        setSwipeDirection(null);
      }
    }
  );

  const dislikeMutation = useMutation(
    ({ targetUser, source }) => swipeAPI.dislike(targetUser, source),
    {
      onSuccess: () => {
        // Мгновенно получаем следующий профиль
        setSwipeDirection(null);
        getNextProfile(); // Теперь всегда возвращает валидный профиль
      },
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
        setSwipeDirection(null);
      }
    }
  );

  const superlikeMutation = useMutation(
    ({ targetUser, message }) => swipeAPI.superlike({ targetUser, message }),
    {
      onSuccess: async (data) => {
        setShowSuperlikeModal(false);
        setSuperlikeMessage('');
        
        // Суперлайки часто создают мэтчи - показываем попап если есть
        if (currentProfile && (data.result === 'reciprocal_like' || data.match_created)) {
          try {
            const matchStatus = await swipeAPI.checkExistingMatch(currentProfile.login);
            
            // Показываем попап только если мэтча еще не было
            if (!matchStatus.hasMatch) {
              showMatchPopup({
                username: currentProfile.login,
                userData: {
                  avatar: currentProfile.ava,
                  login: currentProfile.login
                }
              });
              toast.success('Взаимная симпатия! 💕', { duration: 6000 });
            } else {
              toast.success('Суперлайк отправлен! ⭐');
            }
          } catch (error) {
            console.error('Error checking existing match:', error);
            // В случае ошибки показываем попап для безопасности
            showMatchPopup({
              username: currentProfile.login,
              userData: {
                avatar: currentProfile.ava,
                login: currentProfile.login
              }
            });
            toast.success('Взаимная симпатия! 💕', { duration: 6000 });
          }
        } else {
          toast.success('Суперлайк отправлен! ⭐');
        }
        
        // Мгновенно получаем следующий профиль
        setSwipeDirection(null);
        getNextProfile(); // Теперь всегда возвращает валидный профиль
      },
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  // Показать подсказку для новых пользователей
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('swipe-hint-seen');
    if (!hasSeenHint && currentProfile) {
      setShowHint(true);
      setTimeout(() => {
        setShowHint(false);
        localStorage.setItem('swipe-hint-seen', 'true');
      }, 3000);
    }
  }, [currentProfile]);

  // Автоматическая предзагрузка при инициализации
  useEffect(() => {
    if (currentProfile && profileQueue.length === 0) {
      preloadProfiles(5);
    }
  }, [currentProfile]);

  // Обработчики действий
  const handleLike = () => {
    if (currentProfile) {
      setSwipeDirection('right');
      // Мгновенно отправляем лайк
      likeMutation.mutate({
        targetUser: currentProfile.login,
        source: 'button'
      });
    }
  };

  const handleDislike = () => {
    if (currentProfile) {
      setSwipeDirection('left');
      // Мгновенно отправляем дизлайк
      dislikeMutation.mutate({
        targetUser: currentProfile.login,
        source: 'button'
      });
    }
  };

  const handleSuperlike = () => {
    if (currentProfile) {
      setShowSuperlikeModal(true);
    }
  };

  const handleSendSuperlike = () => {
    if (currentProfile && superlikeMessage.trim()) {
      superlikeMutation.mutate({
        targetUser: currentProfile.login,
        message: superlikeMessage.trim()
      });
    }
  };

  const handleCloseSuperlikeModal = () => {
    setShowSuperlikeModal(false);
    setSuperlikeMessage('');
  };

  const handleBack = () => {
    if (historyIndex >= 0 && profileHistory.length > 0) {
      // Сохраняем текущий профиль в начало очереди
      if (currentProfile) {
        setProfileQueue(prev => [currentProfile, ...prev]);
      }
      
      // Берем предыдущий профиль из истории
      const previousProfile = profileHistory[historyIndex];
      setCurrentProfile(previousProfile);
      
      // Уменьшаем индекс истории
      setHistoryIndex(prev => prev - 1);
      
      // Удаляем профиль из истории (так как он теперь текущий)
      setProfileHistory(prev => prev.slice(0, historyIndex));
      
      // Отладочная информация
      console.log('Возврат к профилю:', previousProfile.login, 'Индекс истории:', historyIndex - 1);
    } else {
      toast.error('Нет предыдущих профилей');
      console.log('Попытка вернуться назад, но история пуста. Индекс:', historyIndex, 'История:', profileHistory.length);
    }
  };

  // Обработка свайпов
  const handleDragEnd = (event, info) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      // Свайп вправо - лайк
      if (currentProfile) {
        setSwipeDirection('right');
        // Мгновенно отправляем лайк
        likeMutation.mutate({
          targetUser: currentProfile.login,
          source: 'gesture'
        });
      }
    } else if (info.offset.x < -threshold) {
      // Свайп влево - дизлайк
      if (currentProfile) {
        setSwipeDirection('left');
        // Мгновенно отправляем дизлайк
        dislikeMutation.mutate({
          targetUser: currentProfile.login,
          source: 'gesture'
        });
      }
    }
  };

  if (isLoading) {
    return (
      <HomeContainer>
        <Header>
          <HeaderContent>
            <WelcomeText>
              <h1>SwingFox</h1>
              <p>Загружаем профили...</p>
            </WelcomeText>
          </HeaderContent>
        </Header>
        <LoadingSpinner />
      </HomeContainer>
    );
  }

  return (
    <HomeContainer>
      <Header>
        <HeaderContent>
          <WelcomeText>
            <h1>Найдите свою пару</h1>
            <p>Свайпайте и знакомьтесь с интересными людьми</p>
          </WelcomeText>
          <UserInfo>
            <div className="user-details">
              <p className="username">@{currentUser?.login}</p>
              <p className="status">Онлайн</p>
            </div>
            <Avatar
              $src={currentUser?.ava ? `/uploads/${currentUser.ava}` : ''}
              $size="50px"
              $fontSize="20px"
            >
              {!currentUser?.ava && currentUser?.login?.charAt(0).toUpperCase()}
            </Avatar>
          </UserInfo>
        </HeaderContent>
      </Header>

      <SwipeContainer>
        <SwipeHint $show={showHint}>
          Свайпайте влево/вправо или используйте кнопки ниже
        </SwipeHint>
        
        <AnimatePresence mode="wait">
          {currentProfile ? (
            <ProfileCard
              // ИЗМЕНИТЬ ЭТО: использовать комбинацию login + profileShowKey
              key={`${currentProfile.login}-${profileShowKey}`}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              initial={{ scale: 0, opacity: 0, rotateY: 90 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                rotateY: 0,
                x: swipeDirection === 'left' ? -400 : swipeDirection === 'right' ? 400 : 0,
                rotate: swipeDirection === 'left' ? -20 : swipeDirection === 'right' ? 20 : 0
              }}
              exit={{ 
                scale: 0, 
                opacity: 0, 
                rotateY: swipeDirection === 'left' ? -90 : 90,
                x: swipeDirection === 'left' ? -400 : 400,
                rotate: swipeDirection === 'left' ? -20 : 20
              }}
              transition={{ 
                duration: swipeDirection ? 0.1 : 0.2,
                type: swipeDirection ? "tween" : "spring",
                stiffness: swipeDirection ? undefined : 200
              }}
              whileDrag={{ scale: 1.02, rotate: 2 }}
              onLoad={() => {
                console.log('=== ПРОФИЛЬ ЗАГРУЖЕН ===');
                console.log('Основные данные:', {
                  login: currentProfile.login,
                  date: currentProfile.date,
                  age: currentProfile.age,
                  height: currentProfile.height,
                  weight: currentProfile.weight,
                  smoking: currentProfile.smoking,
                  alko: currentProfile.alko,
                  isCouple: currentProfile.isCouple,
                  partnerData: currentProfile.partnerData
                });
                
                
                
                // Парсим даты если есть
                if (currentProfile.date && currentProfile.date.includes('_')) {
                  const ages = getAgeFromDate(currentProfile.date);
                  console.log('Возраст из date:', ages);
                }
                
                console.log('=== КОНЕЦ ПРОФИЛЯ ===');
              }}
            >
              <ProfileImage $src={currentProfile.ava ? `/uploads/${currentProfile.ava}` : ''}>
                {!currentProfile.ava && '👤'}
                <ProfileOverlay>
                  <ClickableUsername to={`/profile/${currentProfile.login}`}>
                    @{currentProfile.login}
                  </ClickableUsername>
                  <div className="location">
                    <LocationIcon />
                    {currentProfile.city}, {currentProfile.distance}км
                  </div>
                  <div className="age">
                    {(() => {
                      console.log('Возраст для парсинга:', { 
                        date: currentProfile.date, 
                        age: currentProfile.age,
                        hasUnderscore: currentProfile.date && currentProfile.date.includes('_')
                      });
                      
                      if (currentProfile.date && currentProfile.date.includes('_')) {
                        const ages = getAgeFromDate(currentProfile.date);
                        console.log('Возраст разделен:', ages);
                        if (ages) {
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '12px', color: 'white' }}>Мужчина: {ages.manAge} лет</span>
                              <span style={{ fontSize: '12px', color: 'white' }}>Женщина: {ages.womanAge} лет</span>
                            </div>
                          );
                        }
                        return 'Возраст не указан';
                      }
                      return `${currentProfile.age || '?'} лет`;
                    })()}
                  </div>
                </ProfileOverlay>
              </ProfileImage>
              
              <ProfileDetails>
                <div>
                  <div className="status-badge">
                    <InfoIcon />
                    {currentProfile.status}
                  </div>
                  
                  {/* Отображение совместимости */}
                  {currentProfile.compatibility && (
                    <div className="compatibility-badge">
                      <span style={{ fontSize: '14px' }}>💚</span>
                      <span>Совместимость:</span>
                      <span className="percentage">
                        {Math.round(currentProfile.compatibility.totalScore * 100)}%
                      </span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${Math.round(currentProfile.compatibility.totalScore * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Информация о паре */}
                  {(() => {
                    const isCouple = currentProfile.date && currentProfile.date.includes('_');
                    console.log('Проверка на пару:', { 
                      date: currentProfile.date, 
                      isCouple,
                      hasUnderscore: currentProfile.date && currentProfile.date.includes('_')
                    });
                    
                    if (isCouple) {
                      const ages = getAgeFromDate(currentProfile.date);
                      console.log('Возраст пары:', ages);
                      if (ages) {
                        return (
                          <div className="partner-info">
                            <div className="title">👫 Семейная пара (М+Ж)</div>
                            <div className="details">
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '11px', color: 'white' }}>Мужчина: {ages.manAge} лет</span>
                                <span style={{ fontSize: '11px', color: 'white' }}>Женщина: {ages.womanAge} лет</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="partner-info">
                          <div className="title">👫 Семейная пара (М+Ж)</div>
                          <div className="details">Возраст не указан</div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* Дополнительная информация */}
                  <div className="additional-info">
                    {currentProfile.height && (
                      <div className="info-item">
                        <span className="emoji">📏</span>
                        <span className="text">
                          {(() => {
                           
                            if (currentProfile.height.includes('_')) {
                              const [manHeight, womanHeight] = currentProfile.height.split('_');

                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontSize: '11px', color: '#4a5568' }}>Мужчина: {manHeight}см</span>
                                  <span style={{ fontSize: '11px', color: '#4a5568' }}>Женщина: {womanHeight}см</span>
                                </div>
                              );
                            }
                            return `${currentProfile.height}см`;
                          })()}
                        </span>
                      </div>
                    )}
                    {currentProfile.weight && (
                      <div className="info-item">
                        <span className="emoji">⚖️</span>
                        <span className="text">
                          {(() => {
                      
                            if (currentProfile.weight.includes('_')) {
                              const [manWeight, womanWeight] = currentProfile.weight.split('_');
                             
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontSize: '11px', color: '#4a5568' }}>Мужчина: {manWeight}кг</span>
                                  <span style={{ fontSize: '11px', color: '#4a5568' }}>Женщина: {womanWeight}кг</span>
                                </div>
                              );
                            }
                            return `${currentProfile.weight}кг`;
                          })()}
                        </span>
                      </div>
                    )}
                    {currentProfile.smoking && (
                      <div className="info-item">
                        <span className="emoji">🚬</span>
                        <span className="text">
                          {(() => {
                        
                            if (currentProfile.smoking.includes('_')) {
                              const [manSmoking, womanSmoking] = currentProfile.smoking.split('_');
                  
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontSize: '11px', color: '#4a5568' }}>
                                    <strong>М:</strong> {manSmoking.length > 25 ? manSmoking.substring(0, 25) + '...' : manSmoking}
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#4a5568' }}>
                                    <strong>Ж:</strong> {womanSmoking.length > 25 ? womanSmoking.substring(0, 25) + '...' : womanSmoking}
                                  </span>
                                </div>
                              );
                            }
                            return currentProfile.smoking.length > 20 
                              ? currentProfile.smoking.substring(0, 20) + '...' 
                              : currentProfile.smoking;
                          })()}
                        </span>
                      </div>
                    )}
                    {currentProfile.alko && (
                      <div className="info-item">
                        <span className="emoji">🍷</span>
                        <span className="text">
                          {(() => {
                            
                            if (currentProfile.alko.includes('_')) {
                              const [manAlko, womanAlko] = currentProfile.alko.split('_');
                            
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontSize: '11px', color: '#4a5568' }}>
                                    <strong>М:</strong> {manAlko.length > 25 ? manAlko.substring(0, 25) + '...' : manAlko}
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#4a5568' }}>
                                    <strong>Ж:</strong> {womanAlko.length > 25 ? womanAlko.substring(0, 25) + '...' : womanAlko}
                                  </span>
                                </div>
                              );
                            }
                            return currentProfile.alko.length > 20 
                              ? currentProfile.alko.substring(0, 20) + '...' 
                              : currentProfile.alko;
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Основная информация */}
                  <div className="info">
                    {currentProfile.info ? 
                      (currentProfile.info.length > 120 ? currentProfile.info.substring(0, 120) + '...' : currentProfile.info) 
                      : 'Информация не указана'
                    }
                  </div>
                </div>
              </ProfileDetails>
            </ProfileCard>
          ) : (
            <NoMoreProfiles>
              <div className="icon">🎯</div>
              <h3>Профили закончились!</h3>
              <p>Попробуйте позже или расширьте критерии поиска в настройках</p>
              <Button onClick={() => refetch()}>
                Обновить
              </Button>
            </NoMoreProfiles>
          )}
        </AnimatePresence>
      </SwipeContainer>

      {currentProfile && (
        <ActionButtons>
          <ActionButton 
            className="back" 
            onClick={handleBack} 
            title="Вернуться к предыдущему профилю"
            disabled={historyIndex < 0} // Отключаем, если нет истории
          >
            <BackIcon />
          </ActionButton>
          
          <ActionButton 
            className="dislike" 
            onClick={handleDislike} 
            title="Не нравится"
            disabled={dislikeMutation.isLoading}
          >
            <DislikeIcon />
          </ActionButton>
          
          <ActionButton 
            className="superlike" 
            onClick={handleSuperlike} 
            title="Суперлайк с сообщением"
            disabled={superlikeMutation.isLoading}
          >
            <SuperlikeIcon />
          </ActionButton>
          
          <ActionButton 
            className="like" 
            onClick={handleLike} 
            title="Нравится"
            disabled={likeMutation.isLoading}
          >
            <HeartIcon />
          </ActionButton>
        </ActionButtons>
      )}

      {/* Модальное окно для суперлайка */}
      {showSuperlikeModal && (
        <Modal onClick={handleCloseSuperlikeModal}>
          <ModalContent $maxWidth="500px" onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>Отправить суперлайк</h2>
              <IconButton
                $variant="secondary"
                onClick={handleCloseSuperlikeModal}
              >
                <CloseIcon />
              </IconButton>
            </ModalHeader>
            
            <div style={{ padding: '20px' }}>
              <p style={{
                marginBottom: '20px',
                color: '#4a5568',
                lineHeight: '1.5'
              }}>
                Суперлайк поможет выделиться среди других пользователей.
                Напишите сообщение для <strong>@{currentProfile?.login}</strong>:
              </p>
              
              <TextArea
                value={superlikeMessage}
                onChange={(e) => setSuperlikeMessage(e.target.value)}
                placeholder="Привет! Ты мне очень понравился(лась)..."
                $minHeight="120px"
                style={{ marginBottom: '20px' }}
                maxLength={500}
              />
              
              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'flex-end'
              }}>
                <Button
                  $variant="secondary"
                  onClick={handleCloseSuperlikeModal}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleSendSuperlike}
                  disabled={!superlikeMessage.trim() || superlikeMutation.isLoading}
                >
                  {superlikeMutation.isLoading ? 'Отправляем...' : 'Отправить суперлайк'}
                </Button>
              </div>
              
              <p style={{
                marginTop: '15px',
                fontSize: '12px',
                color: '#718096',
                textAlign: 'center'
              }}>
                У вас осталось суперлайков: ∞
              </p>
            </div>
          </ModalContent>
        </Modal>
      )}
    </HomeContainer>
  );
};

export default Home;