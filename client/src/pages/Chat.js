import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { chatAPI, clubsAPI, apiUtils } from '../services/api';
import websocketService from '../services/websocket';
import {
  PageContainer,
  Avatar,
  IconButton,
  FlexContainer,
  // SearchIcon, // Убираем этот импорт
  SendIcon,
  PlusIcon
} from '../components/UI';

// Иконки
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H6m6-7l-7 7 7 7"/>
  </svg>
);

const AttachIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
  </svg>
);

const MoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1"/>
    <circle cx="19" cy="12" r="1"/>
    <circle cx="5" cy="12" r="1"/>
  </svg>
);

// Стили
const ChatContainer = styled(PageContainer)`
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  padding: 0;
  overflow: hidden;
`;

const ChatSidebar = styled.div`
  width: 400px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    width: ${props => props.$selectedChat ? '0' : '100%'};
    position: ${props => props.$selectedChat ? 'absolute' : 'relative'};
    left: ${props => props.$selectedChat ? '-100%' : '0'};
    transition: all 0.3s ease;
    z-index: 10;
  }
`;

const ChatHeader = styled.div`
  padding: 30px 25px;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  color: white;
  text-align: center;
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 28px;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  p {
    margin: 0;
    opacity: 0.9;
    font-size: 16px;
    font-weight: 300;
  }
  
  @media (max-width: 768px) {
    padding: 25px 20px;
    
    h3 {
      font-size: 24px;
    }
  }
`;

const SearchContainer = styled.div`
  padding: 20px 25px;
  background: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`;

const SearchInput = styled.div`
  position: relative;
  
  input {
    width: 100%;
    padding: 15px 50px 15px 20px;
    border: 2px solid rgba(220, 53, 34, 0.2);
    border-radius: 25px;
    font-size: 16px;
    background: white;
    transition: all 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: #dc3522;
      box-shadow: 0 0 0 3px rgba(220, 53, 34, 0.1);
    }
    
    &::placeholder {
      color: #a0aec0;
    }
  }
  
  /* Используем псевдоэлемент для иконки */
  &::after {
    content: "🔍";
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
    color: #a0aec0;
    font-size: 18px;
    z-index: 2;
    cursor: pointer;
    pointer-events: none;
  }
`;

const ChatsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  background: white;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const ChatItem = styled.div`
  padding: 20px 25px;
  border-bottom: 1px solid #f7fafc;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
  
  &:hover {
    background: linear-gradient(135deg, rgba(220, 53, 34, 0.05) 0%, rgba(255, 107, 88, 0.05) 100%);
  }
  
  &.active {
    background: linear-gradient(135deg, rgba(220, 53, 34, 0.1) 0%, rgba(255, 107, 88, 0.1) 100%);
    border-right: 4px solid #dc3522;
  }
  
  .chat-info {
    flex: 1;
    min-width: 0;
    
    .name {
      font-weight: 600;
      margin-bottom: 6px;
      color: #2d3748;
      font-size: 16px;
      
      &.clickable {
        color: #dc3522;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          color: #ff6b58;
          text-decoration: underline;
        }
      }
    }
    
    .last-message {
      color: #718096;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
      
              .new-match-indicator {
          color: #dc3522;
          font-weight: 600;
        }
    }
    
    .time {
      font-size: 12px;
      color: #a0aec0;
      margin-top: 4px;
    }
  }
  
  .unread-badge {
    background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
    color: white;
    border-radius: 12px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    position: absolute;
    top: 15px;
    right: 20px;
  }
  
  .new-match-badge {
    background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
    color: white;
    border-radius: 12px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    position: absolute;
    top: 15px;
    right: 20px;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  
  @media (max-width: 768px) {
    padding: 15px 20px;
    
    .chat-info {
      .name {
        font-size: 15px;
      }
      
      .last-message {
        font-size: 13px;
      }
    }
  }
`;

const ChatWindow = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  
  @media (max-width: 768px) {
    width: ${props => props.$selectedChat ? '100%' : '0'};
    position: ${props => props.$selectedChat ? 'relative' : 'absolute'};
    right: ${props => props.$selectedChat ? '0' : '-100%'};
    transition: all 0.3s ease;
  }
`;

const ChatWindowHeader = styled.div`
  padding: 20px 30px;
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  
  .back-button {
    @media (min-width: 769px) {
      display: none;
    }
  }
  
  .user-info {
    flex: 1;
    
    .name {
      font-weight: 600;
      color: #2d3748;
      font-size: 18px;
      margin-bottom: 2px;
    }
    
    .status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #718096;
      
      .online-dot {
        width: 8px;
        height: 8px;
        background: #48bb78;
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
    }
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const MessageGroup = styled.div`
  display: flex;
  justify-content: ${props => props.$isOwn ? 'flex-end' : 'flex-start'};
  margin-bottom: 20px;
`;

const Message = styled.div`
  max-width: 70%;
  padding: 15px 20px;
  border-radius: 20px;
  background: ${props => props.$isOwn 
    ? 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)' 
    : 'white'};
  color: ${props => props.$isOwn ? 'white' : '#2d3748'};
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
  
  .message-text {
    font-size: 16px;
    line-height: 1.5;
    margin-bottom: 8px;
  }
  
  .message-file {
    margin-top: 10px;
    
    img {
      border-radius: 10px;
      max-width: 100%;
      height: auto;
    }
  }
  
  .message-time {
    font-size: 12px;
    color: ${props => props.$isOwn ? 'rgba(255, 255, 255, 0.8)' : '#a0aec0'};
    text-align: right;
    margin-top: 5px;
  }
  
  @media (max-width: 768px) {
    max-width: 85%;
    padding: 12px 16px;
    
    .message-text {
      font-size: 15px;
    }
  }
`;

const TypingIndicator = styled.div`
  padding: 15px 20px;
  background: white;
  border-radius: 20px;
  color: #718096;
  font-style: italic;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const MessageInputWrapper = styled.div`
  padding: 20px 30px;
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  opacity: ${props => props.$disabled ? 0.5 : 1};
  pointer-events: ${props => props.$disabled ? 'none' : 'auto'};
`;

const MessageInput = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background: #f7fafc;
  border-radius: 25px;
  padding: 8px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  
  &:focus-within {
    border-color: #dc3522;
    box-shadow: 0 0 0 3px rgba(220, 53, 34, 0.1);
  }
`;

const InputContainer = styled.div`
  flex: 1;
`;

const AttachedFilesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px;
  background: #f7fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
`;

const AttachedFileItem = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 200px;
  
  .file-preview {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    object-fit: cover;
    background: #f7fafc;
  }
  
  .file-info {
    flex: 1;
    min-width: 0;
    
    .file-name {
      font-size: 12px;
      font-weight: 500;
      color: #2d3748;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .file-size {
      font-size: 10px;
      color: #718096;
    }
  }
  
  .remove-btn {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #e53e3e;
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
    
    &:hover {
      background: #c53030;
      transform: scale(1.1);
    }
  }
`;

const TextInput = styled.textarea`
  width: 100%;
  min-height: 20px;
  max-height: 120px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  font-size: 16px;
  resize: none;
  outline: none;
  font-family: inherit;
  
  &::placeholder {
    color: #a0aec0;
  }
`;

const ActionButton = styled.button`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: ${props => props.$primary 
    ? 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)' 
    : 'rgba(220, 53, 34, 0.1)'};
  color: ${props => props.$primary ? 'white' : '#dc3522'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: scale(1.1);
    box-shadow: 0 4px 15px rgba(220, 53, 34, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #718096;
  padding: 40px 20px;
  min-height: 400px;
  
  .content {
    max-width: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .icon {
      font-size: 80px;
      margin-bottom: 74px; /* Увеличиваем с 54px до 74px - поднимаем эмодзи еще на 20px выше */
      opacity: 0.7;
      line-height: 1;
      display: block;
      text-align: center;
      width: 100%;
      transform: translateX(-2px);
    }
    
    h3 {
      font-size: 28px;
      font-weight: 700;
      color: #2d3748;
      margin: 0 0 16px 0;
      line-height: 1.2;
      text-align: center;
      width: 100%;
    }
    
    p {
      font-size: 16px;
      line-height: 1.6;
      margin: 0;
      max-width: 320px;
      margin-left: auto;
      margin-right: auto;
    }
  }
  
  @media (max-width: 768px) {
    min-height: 300px;
    padding: 30px 16px;
    
    .content {
      .icon {
        font-size: 64px;
        margin-bottom: 70px; /* Увеличиваем с 50px до 70px */
        transform: translateX(-1px);
      }
      
      h3 {
        font-size: 24px;
        margin-bottom: 14px;
      }
      
      p {
        font-size: 15px;
        max-width: 280px;
      }
    }
  }
  
  @media (max-width: 480px) {
    min-height: 250px;
    padding: 25px 12px;
    
    .content {
      .icon {
        font-size: 56px;
        margin-bottom: 68px; /* Увеличиваем с 48px до 68px */
        transform: translateX(-1px);
      }
      
      h3 {
        font-size: 22px;
        margin-bottom: 12px;
      }
      
      p {
        font-size: 14px;
        max-width: 260px;
      }
    }
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #e53e3e;
  padding: 40px 20px;
  
  p {
    font-size: 18px;
    margin-bottom: 20px;
  }
  
      button {
      padding: 12px 24px;
      background: #dc3522;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      
      &:hover {
        background: #b8291e;
      }
    }
`;

const NewChatWelcome = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  
  .welcome-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    max-width: 500px;
  }
  
  .match-icon {
    font-size: 80px;
    animation: bounce 2s infinite;
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }
  
      h3 {
      font-size: 32px;
      font-weight: 700;
      color: #2d3748;
      margin: 0;
      background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  
  p {
    font-size: 18px;
    color: #718096;
    margin: 0;
  }
  
  .subtitle {
    font-size: 16px;
    color: #a0aec0;
  }
  
  .suggestions {
    margin-top: 30px;
    width: 100%;
    
    h4 {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
      margin: 0 0 20px 0;
    }
  }
  
  .suggestion-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .suggestion-btn {
    padding: 15px 20px;
    background: white;
    border: 2px solid rgba(102, 126, 234, 0.2);
    border-radius: 15px;
    font-size: 15px;
    color: #2d3748;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(102, 126, 234, 0.05);
      border-color: #667eea;
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
    }
  }
  
  @media (max-width: 768px) {
    padding: 30px 20px;
    
    .match-icon {
      font-size: 60px;
    }
    
    h3 {
      font-size: 24px;
    }
    
    p {
      font-size: 16px;
    }
    
    .subtitle {
      font-size: 14px;
    }
    
    .suggestion-btn {
      padding: 12px 16px;
      font-size: 14px;
    }
  }
`;

const MatchStatusBanner = styled.div`
  padding: 15px 20px;
  margin: 0 20px 20px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  
  background: ${props => {
    switch (props.$status) {
      case 'match':
        return 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
      case 'liked':
        return 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)';
      case 'liked_by':
        return 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)';
      default:
        return 'linear-gradient(135deg, #a0aec0 0%, #718096 100%)';
    }
  }};
  color: white;
  
  .icon {
    font-size: 16px;
  }
  
  .message {
    flex: 1;
  }
`;

const EventParticipationBanner = styled.div`
  padding: 15px 20px;
  margin: 0 20px 20px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  
  background: ${props => {
    switch (props.$status) {
      case 'confirmed':
        return 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
      case 'invited':
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'declined':
        return 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)';
      case 'maybe':
        return 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)';
      case 'not_participant':
        return 'linear-gradient(135deg, #a0aec0 0%, #718096 100%)';
      default:
        return 'linear-gradient(135deg, #a0aec0 0%, #718096 100%)';
    }
  }};
  color: white;
  
  .icon {
    font-size: 16px;
  }
  
  .message {
    flex: 1;
  }
`;

const Chat = () => {
  const { username: chatId } = useParams();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(chatId || null);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchStatus, setMatchStatus] = useState(null);
  const [eventParticipationStatus, setEventParticipationStatus] = useState(null);
  const [isAdConversation, setIsAdConversation] = useState(false);
  const [isClubChat, setIsClubChat] = useState(false);
  const [clubInfo, setClubInfo] = useState(null);
  const [eventInfo, setEventInfo] = useState(null);
  const [clubsData, setClubsData] = useState({}); // Кэш для хранения информации о клубах
  const [attachedFiles, setAttachedFiles] = useState([]); // Прикрепленные файлы
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const lastSelectedChatRef = useRef(null); // Ref для отслеживания последнего выбранного чата
  
  const currentUser = apiUtils.getCurrentUser();

  // Проверяем, является ли это общением по объявлению или клубным чатом
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source');
    const eventId = urlParams.get('event');
    
    // Устанавливаем isAdConversation только если это новый чат (нет сообщений)
    // или если явно указан source=ad в URL
    const isAdFromUrl = source === 'ad';
    const hasExistingMessages = messages && messages.length > 0;
    
    // Если есть сообщения, то не считаем это новым мэтчем
    // Если нет сообщений и source=ad, то это общение по объявлению
    setIsAdConversation(isAdFromUrl && !hasExistingMessages);
    
    // Проверяем, является ли это клубным чатом
    if (chatId && chatId.startsWith('club_')) {
      setIsClubChat(true);
      const clubId = chatId.replace('club_', '');
      setClubInfo({ id: clubId });
      
      if (eventId) {
        setEventInfo({ id: eventId });
      }
    }
  }, [chatId, messages]);

  // Получение списка чатов
  const { data: chats = [], error: chatsError, isLoading: chatsLoading } = useQuery(
    'conversations',
    () => chatAPI.getConversations(50, 0), // Увеличим лимит для лучшего UX
    {
      refetchInterval: 5000, // Обновляем каждые 5 секунд
      refetchOnWindowFocus: false, // Не обновляем при фокусе окна
      staleTime: 3000, // Данные считаются свежими 3 секунды
      onError: (error) => {
        console.error('Ошибка при получении списка чатов:', error);
        toast.error('Не удалось загрузить список чатов');
      }
    }
  );

  // Создаем виртуальный чат для нового мэтча, если перешли через уведомления
  const existingChat = chats?.conversations?.find(chat => chat.companion === chatId);
  const virtualChat = chatId && !existingChat && !chatsLoading ? {
    companion: chatId,
    last_message: null,
    last_message_date: null,
    last_message_by: null,
    unread_count: 0,
    has_images: false,
    companion_info: {
      login: chatId,
      ava: 'no_photo.jpg',
      status: isAdConversation ? 'Общение по объявлению' : 
               isClubChat ? 'Чат с клубом' : 'Новый мэтч',
      online: null,
      viptype: 'FREE'
    }
  } : null;

  // Принудительно создаем виртуальный чат, если есть chatId и нет чатов
  const forceVirtualChat = chatId && !chatsLoading && (!chats?.conversations || chats.conversations.length === 0) ? {
    companion: chatId,
    last_message: null,
    last_message_date: null,
    last_message_by: null,
    unread_count: 0,
    has_images: false,
    companion_info: {
      login: chatId,
      ava: 'no_photo.jpg',
      status: isAdConversation ? 'Общение по объявлению' : 
               isClubChat ? 'Чат с клубом' : 'Новый мэтч',
      online: null,
      viptype: 'FREE'
    }
  } : null;

  // Объединяем реальные чаты с виртуальным
  const allChats = (virtualChat || forceVirtualChat)
    ? [(virtualChat || forceVirtualChat), ...(chats?.conversations || [])]
    : (chats?.conversations || []);

  // Отладочная информация (только при изменениях)
  useEffect(() => {
    console.log('Chat Debug:', {
      chatId,
      chats: chats?.conversations,
      existingChat,
      virtualChat,
      forceVirtualChat,
      allChats,
      selectedChat,
      lastSelectedChatRef: lastSelectedChatRef.current,
      chatsLoading,
      userInfo,
      timestamp: new Date().toISOString()
    });
  }, [chatId, selectedChat, chatsLoading]); // Убираем проблемные зависимости

  // Загружаем информацию о клубах для клубных чатов
  useEffect(() => {
    const loadClubsData = async () => {
      if (!chats?.conversations) return;
      
      const clubChats = chats.conversations.filter(chat => chat.companion.startsWith('club_'));
      const clubIds = clubChats.map(chat => chat.companion.replace('club_', ''));
      
      // Загружаем только те клубы, которых еще нет в кэше
      const newClubIds = clubIds.filter(id => !clubsData[id]);
      
      if (newClubIds.length > 0) {
        try {
          const clubPromises = newClubIds.map(id => clubsAPI.getClub(id));
          const clubResults = await Promise.allSettled(clubPromises);
          
          const newClubsData = {};
          clubResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              newClubsData[newClubIds[index]] = result.value;
            }
          });
          
          setClubsData(prev => ({ ...prev, ...newClubsData }));
        } catch (error) {
          console.error('Error loading clubs data:', error);
        }
      }
    };
    
    loadClubsData();
  }, [chats?.conversations]);

  // Загружаем информацию о клубе для виртуального клубного чата
  useEffect(() => {
    const loadVirtualClubData = async () => {
      if (!isClubChat || !clubInfo?.id || clubsData[clubInfo.id]) return;
      
      try {
        const clubData = await clubsAPI.getClub(clubInfo.id);
        setClubsData(prev => ({ ...prev, [clubInfo.id]: clubData }));
      } catch (error) {
        console.error('Error loading virtual club data:', error);
      }
    };
    
    loadVirtualClubData();
  }, [isClubChat, clubInfo?.id, clubsData]);

  // Получение сообщений текущего чата
  const { data: messagesData, error: messagesError, isLoading: messagesLoading } = useQuery(
    ['messages', selectedChat, isClubChat, clubInfo?.id, eventInfo?.id],
    () => {
      // Для клубных чатов используем обычный API endpoint
      return chatAPI.getMessages(selectedChat, 100, 0);
    },
    {
      enabled: !!selectedChat && !chatsLoading,
      refetchInterval: 2000, // Обновляем каждые 2 секунды
      refetchOnWindowFocus: false, // Не обновляем при фокусе окна
      staleTime: 1000, // Данные считаются свежими 1 секунду
      onError: (error) => {
        console.error('Ошибка при получении сообщений:', error);
        toast.error('Не удалось загрузить сообщения');
      },
      onSuccess: (data) => {
        // Сохраняем информацию о мэтче из ответа
        if (data?.match_status) {
          setMatchStatus(data.match_status);
        }
      }
    }
  );

  const messages = isClubChat ? (messagesData?.messages || []) : (messagesData?.messages || []);
  
 /* // Логирование для отладки
  console.log('Chat messages data:', {
    isClubChat,
    clubInfo,
    eventInfo,
    messagesData,
    messages: messages.length,
    selectedChat,
    messagesArray: messages
  });*/

  // Получение статуса мэтча для текущего чата (только для обычных чатов, не клубных)
  const { data: matchData } = useQuery(
    ['match-status', selectedChat],
    () => chatAPI.getMatchStatus(selectedChat),
    {
      enabled: !!selectedChat && !chatsLoading && !isClubChat && !isAdConversation,
      refetchOnWindowFocus: false, // Не обновляем при фокусе окна
      staleTime: 30000, // Данные считаются свежими 30 секунд
      onError: (error) => {
        console.error('Ошибка при получении статуса мэтча:', error);
      },
      onSuccess: (data) => {
        if (data) {
          setMatchStatus(data);
        }
      }
    }
  );

  // Получение статуса участия в мероприятии для клубных чатов
  const { data: eventParticipationData } = useQuery(
    ['event-participation-status', clubInfo?.id, eventInfo?.id],
    () => chatAPI.getEventParticipationStatus(clubInfo.id, eventInfo.id),
    {
      enabled: !!isClubChat && !!clubInfo?.id && !!eventInfo?.id,
      refetchOnWindowFocus: false,
      staleTime: 30000,
      onError: (error) => {
        console.error('Ошибка при получении статуса участия в мероприятии:', error);
      },
      onSuccess: (data) => {
        if (data?.success) {
          setEventParticipationStatus(data);
        }
      }
    }
  );

  // Получение информации о пользователе для виртуального чата
  const { data: userInfo } = useQuery(
    ['user-info', chatId],
    () => apiUtils.getUserInfo(chatId),
    {
      enabled: !!chatId && !!virtualChat && !chatsLoading,
      refetchOnWindowFocus: false, // Не обновляем при фокусе окна
      staleTime: 60000, // Данные считаются свежими 1 минуту
      onError: (error) => {
        console.error('Ошибка при получении информации о пользователе:', error);
      }
    }
  );

  // Обновляем виртуальный чат с информацией о пользователе
  useEffect(() => {
    if (virtualChat && userInfo && userInfo.login && !chatsLoading) {
      // Проверяем, не обновляем ли мы уже актуальные данные
      if (virtualChat.companion_info?.login !== userInfo.login ||
          virtualChat.companion_info?.ava !== userInfo.ava ||
          virtualChat.companion_info?.status !== userInfo.status) {
        // Создаем новый объект вместо мутации существующего
        const updatedVirtualChat = {
          ...virtualChat,
          companion_info: {
            login: userInfo.login,
            ava: userInfo.ava || 'no_photo.jpg',
            status: userInfo.status || 'Новый мэтч',
            online: userInfo.online,
            viptype: userInfo.viptype || 'FREE'
          }
        };
        // Обновляем состояние через setState, а не мутируем объект
        setSelectedChat(updatedVirtualChat.companion);
      }
    }
  }, [userInfo, chatsLoading]); // Убираем virtualChat из зависимостей

  // Мутации
  const sendMessageMutation = useMutation(
    (messageData) => {
      return chatAPI.sendMessage(messageData);
    },
    {
      onSuccess: (data) => {
        setMessageText('');
        queryClient.invalidateQueries(['messages', selectedChat]);
        queryClient.invalidateQueries('conversations');
        
        // Отправляем сообщение через WebSocket для real-time обновления
        if (isClubChat && clubInfo?.id && eventInfo?.id) {
          websocketService.sendClubChatMessage({
            club_id: clubInfo.id,
            event_id: eventInfo.id,
            user_id: currentUser.login,
            message: messageText.trim(),
            to_user: selectedChat
          });
        } else if (!isClubChat) {
          websocketService.sendUserChatMessage({
            from_user: currentUser.login,
            to_user: selectedChat,
            message: messageText.trim()
          });
        }
        
        // Показываем предупреждение если есть
        if (data?.match_warning) {
          toast.warning(data.match_warning);
        }
      },
      onError: (error) => {
        console.error('Ошибка отправки сообщения:', error);
        // Обрабатываем ошибки мэтча отдельно
        if (error.response?.data?.error === 'no_match') {
          toast.error('Для отправки сообщений нужен взаимный лайк! 💕');
        } else if (error.response?.status === 404) {
          toast.error('Пользователь не найден или чат недоступен');
        } else if (error.response?.status === 403) {
          toast.error('У вас нет прав для отправки сообщений в этот чат');
        } else {
          toast.error(apiUtils.handleError(error) || 'Ошибка отправки сообщения');
        }
      }
    }
  );

  const sendFileMutation = useMutation(chatAPI.sendMessage, {
    onSuccess: (data) => {
      queryClient.invalidateQueries(['messages', selectedChat]);
      queryClient.invalidateQueries('conversations');
      
      // Отправляем уведомление о файле через WebSocket для real-time обновления
      if (isClubChat && clubInfo?.id && eventInfo?.id) {
        websocketService.sendClubChatMessage({
          club_id: clubInfo.id,
          event_id: eventInfo.id,
          user_id: currentUser.login,
          message: '[Файл отправлен]',
          to_user: selectedChat
        });
      } else if (!isClubChat) {
        websocketService.sendUserChatMessage({
          from_user: currentUser.login,
          to_user: selectedChat,
          message: '[Файл отправлен]'
        });
      }
      
      toast.success('Файл успешно отправлен');
    },
    onError: (error) => {
      console.error('Ошибка отправки файла:', error);
      if (error.response?.data?.error === 'no_match') {
        toast.error('Для отправки файлов нужен взаимный лайк! 💕');
      } else if (error.response?.status === 413) {
        toast.error('Файл слишком большой');
      } else {
        toast.error(apiUtils.handleError(error) || 'Ошибка отправки файла');
      }
    }
  });

  // Эффекты
  useEffect(() => {
    if (chatId && chatId !== selectedChat && chatId !== lastSelectedChatRef.current && !chatsLoading) {
      lastSelectedChatRef.current = chatId;
      setSelectedChat(chatId);
    }
  }, [chatId, chatsLoading]); // Добавляем chatsLoading в зависимости

  // Обновляем информацию о клубе при изменении selectedChat
  useEffect(() => {
    if (selectedChat && selectedChat.startsWith('club_')) {
      setIsClubChat(true);
      const clubId = selectedChat.replace('club_', '');
      setClubInfo({ id: clubId });
      
      // Попробуем найти event_id из данных чата
      const chatData = allChats.find(chat => chat.companion === selectedChat);
      if (chatData?.event_id) {
        setEventInfo({ id: chatData.event_id });
      }
    } else {
      setIsClubChat(false);
      setClubInfo(null);
      setEventInfo(null);
    }
  }, [selectedChat]); // Убираем allChats из зависимостей

  // Автоматически выбираем виртуальный чат, если перешли через уведомления
  useEffect(() => {
    if ((virtualChat || forceVirtualChat) && !selectedChat && chatId && chatId !== lastSelectedChatRef.current && !chatsLoading) {
      lastSelectedChatRef.current = chatId;
      setSelectedChat(chatId);
    }
  }, [chatId, chatsLoading]); // Убираем virtualChat и forceVirtualChat из зависимостей

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket интеграция для real-time сообщений
  useEffect(() => {
    if (!selectedChat) return;

    // Подключаемся к WebSocket комнате для текущего чата
    if (isClubChat && clubInfo?.id && eventInfo?.id) {
      // Клубный чат
      websocketService.joinClubChat(clubInfo.id, eventInfo.id, currentUser.login);
    } else if (!isClubChat) {
      // Обычный чат между пользователями
      websocketService.joinUserChat(currentUser.login, selectedChat);
    }

    // Обработчик для получения сообщений через WebSocket
    const handleWebSocketMessage = (messageData) => {
      console.log('WebSocket message received:', messageData);
      
      // Обновляем кэш сообщений
      queryClient.setQueryData(['messages', selectedChat, isClubChat, clubInfo?.id, eventInfo?.id], (oldData) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          messages: [...oldData.messages, messageData]
        };
      });
      
      // Обновляем список чатов
      queryClient.invalidateQueries('conversations');
    };

    // Подписываемся на сообщения
    if (isClubChat) {
      websocketService.onClubChatMessage(handleWebSocketMessage);
    } else {
      websocketService.onUserChatMessage(handleWebSocketMessage);
    }

    // Очистка при смене чата или размонтировании
    return () => {
      if (isClubChat) {
        websocketService.offClubChatMessage(handleWebSocketMessage);
      } else {
        websocketService.offUserChatMessage(handleWebSocketMessage);
      }
    };
  }, [selectedChat, isClubChat, clubInfo?.id, eventInfo?.id]); // Убираем currentUser.login и queryClient из зависимостей

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      lastSelectedChatRef.current = null;
    };
  }, []);

  // Фильтрация чатов по поиску
  const filteredChats = allChats.filter(chat =>
    chat.companion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Обработчики
  const handleChatSelect = (chatUser) => {
    // Проверяем, не пытаемся ли мы перейти к тому же чату
    if (chatUser === selectedChat || chatUser === lastSelectedChatRef.current || chatsLoading) {
      return;
    }
    
    lastSelectedChatRef.current = chatUser;
    setSelectedChat(chatUser);
    
    // Очищаем прикрепленные файлы при смене чата
    attachedFiles.forEach(fileObj => {
      URL.revokeObjectURL(fileObj.preview);
    });
    setAttachedFiles([]);
    
    // Обновляем информацию о клубе и мероприятии для клубных чатов
    if (chatUser && chatUser.startsWith('club_')) {
      setIsClubChat(true);
      const clubId = chatUser.replace('club_', '');
      setClubInfo({ id: clubId });
      
      // Попробуем найти event_id из данных чата
      const chatData = allChats.find(chat => chat.companion === chatUser);
      if (chatData?.event_id) {
        setEventInfo({ id: chatData.event_id });
      }
    } else {
      setIsClubChat(false);
      setClubInfo(null);
      setEventInfo(null);
    }
    
    // Обновляем URL только если он отличается
    if (chatUser !== chatId) {
      navigate(`/chat/${chatUser}`);
    }
  };

  const handleUsernameClick = (username, event) => {
    event.stopPropagation(); // Предотвращаем открытие чата
    
    // Проверяем, является ли username клубом (начинается с @club_)
    if (username && username.startsWith('@club_')) {
      // Извлекаем ID клуба из username (убираем @club_)
      const clubId = username.replace('@club_', '');
      navigate(`/club-profile/${clubId}`);
    } else {
      // Обычный пользователь
      navigate(`/profile/${username}`);
    }
  };

  const handleSendMessage = () => {
    if ((messageText.trim() || attachedFiles.length > 0) && selectedChat) {
      // Проверяем статус мэтча перед отправкой только для обычных чатов (не клубных и не по объявлениям)
      // Но если диалог уже существует (есть сообщения), то не блокируем отправку
      const hasExistingMessages = messages && messages.length > 0;
      if (!isAdConversation && !isClubChat && matchStatus && !matchStatus.canChat && matchStatus.status !== 'unknown' && !hasExistingMessages) {
        toast.error(`${matchStatus.message} ${matchStatus.icon}`);
        return;
      }

      // Проверяем статус участия в мероприятии для клубных чатов
      if (isClubChat && eventParticipationStatus && !eventParticipationStatus.canChat && eventParticipationStatus.status !== 'unknown') {
        toast.error(`${eventParticipationStatus.message} ${eventParticipationStatus.icon}`);
        return;
      }

      // Используем FormData для всех типов чатов
      const formData = new FormData();
      formData.append('to_user', selectedChat);
      formData.append('message', messageText.trim() || '');
      
      // Добавляем прикрепленные файлы
      attachedFiles.forEach(fileObj => {
        formData.append('images', fileObj.file);
      });
      
      if (isAdConversation) {
        formData.append('source', 'ad');
      }
      
      // Для клубных чатов добавляем event_id
      if (isClubChat && clubInfo?.id && eventInfo?.id) {
        formData.append('event_id', eventInfo.id);
      }
      
      sendMessageMutation.mutate(formData);
      
      // Очищаем прикрепленные файлы после отправки
      attachedFiles.forEach(fileObj => {
        URL.revokeObjectURL(fileObj.preview);
      });
      setAttachedFiles([]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0 && selectedChat) {
      // Проверяем статус мэтча перед прикреплением файлов только если это не общение по объявлению и не клубный чат
      // Но если диалог уже существует (есть сообщения), то не блокируем прикрепление
      const hasExistingMessages = messages && messages.length > 0;
      if (!isAdConversation && !isClubChat && matchStatus && !matchStatus.canChat && matchStatus.status !== 'unknown' && !hasExistingMessages) {
        toast.error(`${matchStatus.message} ${matchStatus.icon}`);
        return;
      }

      // Проверяем общее количество файлов (включая уже прикрепленные)
      const totalFiles = attachedFiles.length + files.length;
      if (totalFiles > 5) {
        toast.error('Можно прикрепить максимум 5 файлов за раз');
        event.target.value = '';
        return;
      }

      // Проверяем размер каждого файла
      const maxSize = 10 * 1024 * 1024; // 10MB
      const oversizedFiles = files.filter(file => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        toast.error('Размер файла не должен превышать 10MB');
        event.target.value = '';
        return;
      }

      // Проверяем тип файлов
      const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
      if (invalidFiles.length > 0) {
        toast.error('Можно загружать только изображения');
        event.target.value = '';
        return;
      }

      // Добавляем файлы к прикрепленным
      const newFiles = files.map(file => ({
        id: Date.now() + Math.random(), // Простой ID для React key
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: URL.createObjectURL(file) // Для предварительного просмотра
      }));
      
      setAttachedFiles(prev => [...prev, ...newFiles]);
      
      // Очищаем input чтобы можно было выбрать те же файлы снова
      event.target.value = '';
    }
  };

  const removeAttachedFile = (fileId) => {
    setAttachedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview); // Освобождаем память
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Мемоизированная функция для получения отображаемого имени чата
  const getChatDisplayName = useCallback((companion) => {
    if (companion.startsWith('club_')) {
      const clubId = companion.replace('club_', '');
      const clubData = clubsData[clubId];
      return clubData?.club?.name || `Клуб ${clubId}`;
    }
    return `@${companion}`;
  }, [clubsData]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedChatData = allChats.find(chat => chat.companion === selectedChat);

  return (
    <ChatContainer>
      <ChatSidebar $selectedChat={selectedChat}>
        <ChatHeader>
          <h3>Сообщения</h3>
          <p>Найдите интересных собеседников</p>
        </ChatHeader>
        
        <SearchContainer>
          <SearchInput>
            <input
              type="text"
              placeholder="Поиск чатов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* Убираем <span className="search-icon">🔍</span> */}
          </SearchInput>
        </SearchContainer>
        
        <ChatsContainer>
          {chatsError ? (
            <ErrorMessage>
              <p>Ошибка загрузки чатов</p>
              <button onClick={() => window.location.reload()}>Попробовать снова</button>
            </ErrorMessage>
          ) : chatsLoading ? (
            <EmptyState>
              <p>Загрузка чатов...</p>
            </EmptyState>
          ) : (filteredChats.length > 0 || forceVirtualChat) ? (
            <>
              {/* Принудительно показываем виртуальный чат, если он есть */}
              {forceVirtualChat && !filteredChats.find(chat => chat.companion === forceVirtualChat.companion) && (
                <ChatItem
                  key={`virtual-${forceVirtualChat.companion}`}
                  className={selectedChat === forceVirtualChat.companion ? 'active' : ''}
                  onClick={() => handleChatSelect(forceVirtualChat.companion)}
                >
                  <Avatar
                    $src={forceVirtualChat.companion.startsWith('club_') 
                      ? (clubsData[forceVirtualChat.companion.replace('club_', '')]?.club?.avatar ? `/uploads/${clubsData[forceVirtualChat.companion.replace('club_', '')].club.avatar}` : '')
                      : (forceVirtualChat.companion_info?.ava ? `/uploads/${forceVirtualChat.companion_info.ava}` : '')
                    }
                    $size="50px"
                    $fontSize="20px"
                    $online={forceVirtualChat.companion_info?.online}
                  >
                    {!forceVirtualChat.companion.startsWith('club_') && !forceVirtualChat.companion_info?.ava && forceVirtualChat.companion.charAt(0).toUpperCase()}
                  </Avatar>
                  
                  <div className="chat-info">
                    <div 
                      className="name clickable"
                      onClick={(e) => handleUsernameClick(forceVirtualChat.companion, e)}
                    >
                      {getChatDisplayName(forceVirtualChat.companion)}
                    </div>
                    <div className="last-message">
                      {messages && messages.length > 0 ? (
                        messages[messages.length - 1]?.message || '[Изображение]'
                      ) : (
                        <span className="new-match-indicator">
                          {isAdConversation ? '📢 Общение по объявлению' : '💕 Новый мэтч - начните общение'}
                        </span>
                      )}
                    </div>
                    <div className="time">Сейчас</div>
                  </div>
                  
                  {!(messages && messages.length > 0) && (
                    <div className="new-match-badge">{isAdConversation ? '📢' : '💕'}</div>
                  )}
                </ChatItem>
              )}
              
                            {/* Показываем остальные чаты */}
              {filteredChats.map((chat, index) => (
                <ChatItem
                  key={`chat-${chat.companion}-${index}`}
                  className={selectedChat === chat.companion ? 'active' : ''}
                  onClick={() => handleChatSelect(chat.companion)}
                >
                  <Avatar
                    $src={chat.companion.startsWith('club_') 
                      ? (clubsData[chat.companion.replace('club_', '')]?.club?.avatar ? `/uploads/${clubsData[chat.companion.replace('club_', '')].club.avatar}` : '')
                      : (chat.companion_info?.ava ? `/uploads/${chat.companion_info.ava}` : '')
                    }
                    $size="50px"
                    $fontSize="20px"
                    $online={chat.companion_info?.online}
                  >
                    {!chat.companion.startsWith('club_') && !chat.companion_info?.ava && chat.companion.charAt(0).toUpperCase()}
                  </Avatar>
                  
                  <div className="chat-info">
                    <div 
                      className="name clickable"
                      onClick={(e) => handleUsernameClick(chat.companion, e)}
                    >
                      {getChatDisplayName(chat.companion)}
                    </div>
                    <div className="last-message">
                      {(chat.last_message && chat.last_message.trim()) || chat.has_images ? (
                        chat.last_message || '[Изображение]'
                      ) : (
                        <span className="new-match-indicator">
                          {chat.companion.startsWith('club_') ? '🏛️ Чат с клубом - начните общение' : 
                           '💕 Новый мэтч - начните общение'}
                        </span>
                      )}
                    </div>
                    <div className="time">
                      {chat.last_message_date ? formatTime(chat.last_message_date) : 'Сейчас'}
                    </div>
                  </div>
                  
                  {chat.unread_count > 0 ? (
                    <div className="unread-badge">{chat.unread_count}</div>
                  ) : !((chat.last_message && chat.last_message.trim()) || chat.has_images) && (
                    <div className="new-match-badge">{chat.companion.startsWith('club_') ? '🏛️' : '💕'}</div>
                  )}
                </ChatItem>
              ))}
            </>
          ) : (
            <EmptyState>
              <p>Нет активных чатов</p>
              <p>Найдите интересных собеседников в каталоге</p>
            </EmptyState>
          )}
        </ChatsContainer>
      </ChatSidebar>

      <ChatWindow $selectedChat={selectedChat}>
        {selectedChat ? (
          <>
            <ChatWindowHeader>
              <IconButton 
                className="back-button"
                $variant="secondary"
                onClick={() => {
                  setSelectedChat(null);
                  navigate('/chat');
                }}
              >
                <BackIcon />
              </IconButton>
              
              <Avatar
                $src={selectedChatData?.companion_info?.ava ? `/uploads/${selectedChatData.companion_info.ava}` : ''}
                $size="45px"
                $fontSize="18px"
              >
                {!selectedChatData?.companion_info?.ava && selectedChat.charAt(0).toUpperCase()}
              </Avatar>
              
              <div className="user-info">
                <div 
                  className="name clickable"
                  onClick={(e) => {
                    if (isClubChat && clubInfo?.id) {
                      e.stopPropagation();
                      navigate(`/club-profile/${clubInfo.id}`);
                    } else {
                      handleUsernameClick(selectedChat, e);
                    }
                  }}
                >
                  {isClubChat ? `🏛️ ${clubInfo?.name || `Клуб ${clubInfo?.id}`}` : `@${selectedChat}`}
                </div>
                <div className="status">
                  {isClubChat ? (
                    eventInfo ? `Мероприятие #${eventInfo.id}` : 'Чат с клубом'
                  ) : (
                    <>
                      {selectedChatData?.companion_info?.online && <div className="online-dot" />}
                      {selectedChatData?.companion_info?.online ? 'онлайн' : 'не в сети'}
                    </>
                  )}
                </div>
              </div>
              
              <IconButton $variant="secondary">
                <MoreIcon />
              </IconButton>
            </ChatWindowHeader>

            {/* Баннер статуса мэтча (только для обычных чатов, не клубных и не по объявлениям) */}
            {!isClubChat && !isAdConversation && matchStatus && matchStatus.status !== 'unknown' && messages.length === 0 && (
              <MatchStatusBanner $status={matchStatus.status}>
                <span className="icon">{matchStatus.icon}</span>
                <span className="message">{matchStatus.message}</span>
              </MatchStatusBanner>
            )}

            {/* Баннер статуса участия в мероприятии */}
            {isClubChat && eventParticipationStatus && eventParticipationStatus.status !== 'unknown' && (
              <EventParticipationBanner $status={eventParticipationStatus.status}>
                <span className="icon">{eventParticipationStatus.icon}</span>
                <span className="message">{eventParticipationStatus.message}</span>
              </EventParticipationBanner>
            )}

            <MessagesContainer>
              {messagesError ? (
                <ErrorMessage>
                  <p>Ошибка загрузки сообщений</p>
                  <button onClick={() => window.location.reload()}>Попробовать снова</button>
                </ErrorMessage>
              ) : messagesLoading ? (
                <EmptyState>
                  <p>Загрузка сообщений...</p>
                </EmptyState>
              ) : messages.length > 0 ? (
                messages.map((message, index) => {
                  const isOwn = message.by_user === currentUser.login;
                  const prevMessage = messages[index - 1];
                  const isNewGroup = !prevMessage ||
                    prevMessage.by_user !== message.by_user ||
                    (new Date(message.date) - new Date(prevMessage.date)) > 300000;

                  return (
                    <MessageGroup key={`${message.id}-${index}`} $isOwn={isOwn}>
                      <Message $isOwn={isOwn}>
                        {message.message && (
                          <div className="message-text">{message.message}</div>
                        )}
                        {message.images && Array.isArray(message.images) && message.images.length > 0 && (
                          <div className="message-file">
                            {message.images.map((image, idx) => (
                              <img
                                key={`${message.id}-image-${idx}`}
                                src={`/uploads/${image}`}
                                alt="Вложение"
                                style={{ margin: '2px', maxWidth: '250px' }}
                              />
                            ))}
                          </div>
                        )}
                        <div className="message-time">
                          {formatTime(message.date)}
                        </div>
                      </Message>
                    </MessageGroup>
                  );
                })
              ) : (
                <NewChatWelcome>
                  <div className="welcome-content">
                    <div className="match-icon">{isAdConversation ? '📢' : isClubChat ? '🏛️' : '💕'}</div>
                    <h3>{isAdConversation ? 'Общение по объявлению' : isClubChat ? 'Чат с клубом' : 'Взаимная симпатия!'}</h3>
                    <p>{isAdConversation ? `Общайтесь с @${selectedChat} по поводу объявления` : isClubChat ? `Общайтесь с клубом по поводу мероприятия` : `У вас совпадение с @${selectedChat}`}</p>
                    <p className="subtitle">Начните общение первым сообщением</p>
                    
                    <div className="suggestions">
                      <h4>Идеи для первого сообщения:</h4>
                      <div className="suggestion-buttons">
                        {isAdConversation ? (
                          <>
                            <button 
                              className="suggestion-btn"
                              onClick={() => setMessageText('Привет! Интересует ваше объявление')}
                            >
                              Привет! Интересует ваше объявление
                            </button>
                            <button 
                              className="suggestion-btn"
                              onClick={() => setMessageText('Здравствуйте! Можно узнать подробности?')}
                            >
                              Здравствуйте! Можно узнать подробности?
                            </button>
                            <button 
                              className="suggestion-btn"
                              onClick={() => setMessageText('Привет! Когда планируете встречу?')}
                            >
                              Привет! Когда планируете встречу?
                            </button>
                            <button 
                              className="suggestion-btn"
                              onClick={() => setMessageText('Добрый день! Есть вопросы по объявлению')}
                            >
                              Добрый день! Есть вопросы по объявлению
                            </button>
                          </>
                        ) : isClubChat ? (
                          <>
                            <button 
                              className="suggestion-btn"
                              onClick={() => setMessageText('Привет! У меня есть вопрос по поводу мероприятия')}
                            >
                              Привет! У меня есть вопрос по поводу мероприятия
                            </button>
                            <button 
                              className="suggestion-btn"
                              onClick={() => setMessageText('Здравствуйте! Можно узнать подробности о мероприятии?')}
                            >
                              Здравствуйте! Можно узнать подробности о мероприятии?
                            </button>
                            <button 
                              className="suggestion-btn"
                              onClick={() => setMessageText('Привет! Когда и где будет мероприятие?')}
                            >
                              Привет! Когда и где будет мероприятие?
                            </button>
                            <button 
                              className="suggestion-btn"
                              onClick={() => setMessageText('Добрый день! Есть вопросы по мероприятию')}
                            >
                              Добрый день! Есть вопросы по мероприятию
                            </button>
                            <button 
                              className="suggestion-btn"
                              onClick={() => setMessageText('Здравствуйте! Хотелось бы уточнить детали участия')}
                            >
                              Здравствуйте! Хотелось бы уточнить детали участия
                            </button>
                            <button 
                              className="suggestion-btn"
                              onClick={() => setMessageText('Привет! Что нужно взять с собой на мероприятие?')}
                            >
                              Привет! Что нужно взять с собой на мероприятие?
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="suggestion-btn"
                              onClick={() => setMessageText('Привет! Рад нашему совпадению 😊')}
                            >
                              Привет! Рад нашему совпадению 😊
                            </button>
                            <button 
                              className="suggestion-btn"
                              onClick={() => setMessageText('Привет! Как дела?')}
                            >
                              Привет! Как дела?
                            </button>
                            <button 
                              className="suggestion-btn"
                              onClick={() => setMessageText('Привет! Интересно познакомиться поближе')}
                            >
                              Интересно познакомиться поближе
                            </button>
                            <button 
                              className="suggestion-btn"
                              onClick={() => setMessageText('Привет! Что планируешь на выходные?')}
                            >
                              Что планируешь на выходные?
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </NewChatWelcome>
              )}
              
              {isTyping && (
                <TypingIndicator>
                  @{selectedChat} печатает...
                </TypingIndicator>
              )}
              
              <div ref={messagesEndRef} />
            </MessagesContainer>

            <MessageInputWrapper $disabled={(!isAdConversation && !isClubChat && matchStatus && !matchStatus.canChat && matchStatus.status !== 'unknown' && !(messages && messages.length > 0)) || (isClubChat && eventParticipationStatus && !eventParticipationStatus.canChat && eventParticipationStatus.status !== 'unknown')}>
              {attachedFiles.length > 0 && (
                <AttachedFilesContainer>
                  {attachedFiles.map((fileObj) => (
                    <AttachedFileItem key={fileObj.id}>
                      <img 
                        src={fileObj.preview} 
                        alt={fileObj.name}
                        className="file-preview"
                      />
                      <div className="file-info">
                        <div className="file-name">{fileObj.name}</div>
                        <div className="file-size">{formatFileSize(fileObj.size)}</div>
                      </div>
                      <button 
                        className="remove-btn"
                        onClick={() => removeAttachedFile(fileObj.id)}
                        title="Удалить файл"
                      >
                        ×
                      </button>
                    </AttachedFileItem>
                  ))}
                </AttachedFilesContainer>
              )}
              <MessageInput>
              <InputContainer>
                <TextInput
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Напишите сообщение..."
                  rows={1}
                />
              </InputContainer>
              
              <ActionButton 
                className="attach"
                onClick={() => fileInputRef.current?.click()}
              >
                <AttachIcon />
              </ActionButton>
              
              <ActionButton
                onClick={handleSendMessage}
                disabled={
                  (!messageText.trim() && attachedFiles.length === 0) ||
                  sendMessageMutation.isLoading ||
                  (!isAdConversation && !isClubChat && matchStatus && !matchStatus.canChat && matchStatus.status !== 'unknown' && !(messages && messages.length > 0)) ||
                  (isClubChat && eventParticipationStatus && !eventParticipationStatus.canChat && eventParticipationStatus.status !== 'unknown')
                }
              >
                <SendIcon />
              </ActionButton>
              
              <HiddenInput
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
              />
            </MessageInput>
            </MessageInputWrapper>
          </>
        ) : (
          <EmptyState>
            <div className="content">
              <div className="icon">💬</div>
              <h3>Выберите чат</h3>
              <p>Выберите диалог из списка, чтобы начать общение, или найдите нового собеседника</p>
            </div>
          </EmptyState>
        )}
      </ChatWindow>
    </ChatContainer>
  );
};

export default Chat;