import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { chatAPI, apiUtils } from '../services/api';
import {
  PageContainer,
  Avatar,
  IconButton,
  FlexContainer,
  SearchIcon,
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
      padding: 15px 20px 15px 50px;
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
  
  .search-icon {
    position: absolute;
    left: 18px;
    top: 50%;
    transform: translateY(-50%);
    color: #a0aec0;
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
    opacity: 0.7;
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
  
  .content {
    max-width: 400px;
    
    .icon {
      font-size: 80px;
      margin-bottom: 20px;
      opacity: 0.5;
    }
    
    h3 {
      font-size: 24px;
      font-weight: 600;
      color: #2d3748;
      margin: 0 0 10px 0;
    }
    
    p {
      font-size: 16px;
      line-height: 1.6;
      margin: 0;
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

const Chat = () => {
  const { username: chatId } = useParams();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(chatId || null);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchStatus, setMatchStatus] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  
  const currentUser = apiUtils.getCurrentUser();

  // Получение списка чатов
  const { data: chats = [], error: chatsError, isLoading: chatsLoading } = useQuery(
    'conversations',
    () => chatAPI.getConversations(50, 0), // Увеличим лимит для лучшего UX
    {
      refetchInterval: 5000, // Обновляем каждые 5 секунд
      onError: (error) => {
        console.error('Ошибка при получении списка чатов:', error);
        toast.error('Не удалось загрузить список чатов');
      }
    }
  );

  // Создаем виртуальный чат для нового мэтча, если перешли через уведомления
  const existingChat = chats?.conversations?.find(chat => chat.companion === chatId);
  const virtualChat = chatId && !existingChat ? {
    companion: chatId,
    last_message: null,
    last_message_date: null,
    last_message_by: null,
    unread_count: 0,
    has_images: false,
    companion_info: {
      login: chatId,
      ava: 'no_photo.jpg',
      status: 'Новый мэтч',
      online: null,
      viptype: 'FREE'
    }
  } : null;

  // Принудительно создаем виртуальный чат, если есть chatId и нет чатов
  const forceVirtualChat = chatId && (!chats?.conversations || chats.conversations.length === 0) ? {
    companion: chatId,
    last_message: null,
    last_message_date: null,
    last_message_by: null,
    unread_count: 0,
    has_images: false,
    companion_info: {
      login: chatId,
      ava: 'no_photo.jpg',
      status: 'Новый мэтч',
      online: null,
      viptype: 'FREE'
    }
  } : null;

  // Объединяем реальные чаты с виртуальным
  const allChats = (virtualChat || forceVirtualChat)
    ? [(virtualChat || forceVirtualChat), ...(chats?.conversations || [])]
    : (chats?.conversations || []);

  // Отладочная информация
  console.log('Chat Debug:', {
    chatId,
    chats: chats?.conversations,
    existingChat,
    virtualChat,
    forceVirtualChat,
    allChats,
    selectedChat,
    userInfo
  });


  // Получение сообщений текущего чата
  const { data: messages = [], error: messagesError, isLoading: messagesLoading } = useQuery(
    ['messages', selectedChat],
    () => chatAPI.getMessages(selectedChat, 100, 0), // Увеличим лимит сообщений
    {
      enabled: !!selectedChat,
      refetchInterval: 2000, // Обновляем каждые 2 секунды
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

  // Получение статуса мэтча для текущего чата
  const { data: matchData } = useQuery(
    ['match-status', selectedChat],
    () => chatAPI.getMatchStatus(selectedChat),
    {
      enabled: !!selectedChat,
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

  // Получение информации о пользователе для виртуального чата
  const { data: userInfo } = useQuery(
    ['user-info', chatId],
    () => apiUtils.getUserInfo(chatId),
    {
      enabled: !!chatId && !!virtualChat,
      onError: (error) => {
        console.error('Ошибка при получении информации о пользователе:', error);
      }
    }
  );

  // Обновляем виртуальный чат с информацией о пользователе
  useEffect(() => {
    if (virtualChat && userInfo) {
      virtualChat.companion_info = {
        login: userInfo.login,
        ava: userInfo.ava || 'no_photo.jpg',
        status: userInfo.status || 'Новый мэтч',
        online: userInfo.online,
        viptype: userInfo.viptype || 'FREE'
      };
    }
  }, [virtualChat, userInfo]);

  // Мутации
  const sendMessageMutation = useMutation(chatAPI.sendMessage, {
    onSuccess: (data) => {
      setMessageText('');
      queryClient.invalidateQueries(['messages', selectedChat]);
      queryClient.invalidateQueries('conversations');
      
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
  });

  const sendFileMutation = useMutation(chatAPI.sendMessage, {
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedChat]);
      queryClient.invalidateQueries('conversations');
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
    if (chatId && chatId !== selectedChat) {
      setSelectedChat(chatId);
    }
  }, [chatId, selectedChat]);

  // Автоматически выбираем виртуальный чат, если перешли через уведомления
  useEffect(() => {
    if ((virtualChat || forceVirtualChat) && !selectedChat) {
      setSelectedChat(chatId);
    }
  }, [virtualChat, forceVirtualChat, selectedChat, chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Фильтрация чатов по поиску
  const filteredChats = allChats.filter(chat =>
    chat.companion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Обработчики
  const handleChatSelect = (chatUser) => {
    setSelectedChat(chatUser);
    navigate(`/chat/${chatUser}`);
  };

  const handleSendMessage = () => {
    if (messageText.trim() && selectedChat) {
      // Проверяем статус мэтча перед отправкой
      if (matchStatus && !matchStatus.canChat && matchStatus.status !== 'unknown') {
        toast.error(`${matchStatus.message} ${matchStatus.icon}`);
        return;
      }

      const formData = new FormData();
      formData.append('to_user', selectedChat);
      formData.append('message', messageText.trim());
      sendMessageMutation.mutate(formData);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && selectedChat) {
      // Проверяем статус мэтча перед отправкой файла
      if (matchStatus && !matchStatus.canChat && matchStatus.status !== 'unknown') {
        toast.error(`${matchStatus.message} ${matchStatus.icon}`);
        return;
      }

      const formData = new FormData();
      formData.append('images', file);
      formData.append('to_user', selectedChat);
      sendFileMutation.mutate(formData);
    }
  };

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
            <SearchIcon className="search-icon" />
            <input
              type="text"
              placeholder="Поиск чатов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                  key={forceVirtualChat.companion}
                  className={selectedChat === forceVirtualChat.companion ? 'active' : ''}
                  onClick={() => handleChatSelect(forceVirtualChat.companion)}
                >
                  <Avatar
                    $src={forceVirtualChat.companion_info?.ava ? `/uploads/${forceVirtualChat.companion_info.ava}` : ''}
                    $size="50px"
                    $fontSize="20px"
                    $online={forceVirtualChat.companion_info?.online}
                  >
                    {!forceVirtualChat.companion_info?.ava && forceVirtualChat.companion.charAt(0).toUpperCase()}
                  </Avatar>
                  
                  <div className="chat-info">
                    <div className="name">@{forceVirtualChat.companion}</div>
                    <div className="last-message">
                      <span className="new-match-indicator">💕 Новый мэтч - начните общение</span>
                    </div>
                    <div className="time">Сейчас</div>
                  </div>
                  
                  <div className="new-match-badge">💕</div>
                </ChatItem>
              )}
              
                            {/* Показываем остальные чаты */}
              {filteredChats.map(chat => (
                <ChatItem
                  key={chat.companion}
                  className={selectedChat === chat.companion ? 'active' : ''}
                  onClick={() => handleChatSelect(chat.companion)}
                >
                  <Avatar
                    $src={chat.companion_info?.ava ? `/uploads/${chat.companion_info.ava}` : ''}
                    $size="50px"
                    $fontSize="20px"
                    $online={chat.companion_info?.online}
                  >
                    {!chat.companion_info?.ava && chat.companion.charAt(0).toUpperCase()}
                  </Avatar>
                  
                  <div className="chat-info">
                    <div className="name">@{chat.companion}</div>
                    <div className="last-message">
                      {chat.last_message ? (
                        chat.last_message
                      ) : (
                        <span className="new-match-indicator">💕 Новый мэтч - начните общение</span>
                      )}
                    </div>
                    <div className="time">
                      {chat.last_message_date ? formatTime(chat.last_message_date) : 'Сейчас'}
                    </div>
                  </div>
                  
                  {chat.unread_count > 0 ? (
                    <div className="unread-badge">{chat.unread_count}</div>
                  ) : !chat.last_message && (
                    <div className="new-match-badge">💕</div>
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
                <div className="name">@{selectedChat}</div>
                <div className="status">
                  {selectedChatData?.companion_info?.online && <div className="online-dot" />}
                  {selectedChatData?.companion_info?.online ? 'онлайн' : 'не в сети'}
                </div>
              </div>
              
              <IconButton $variant="secondary">
                <MoreIcon />
              </IconButton>
            </ChatWindowHeader>

            {/* Баннер статуса мэтча */}
            {matchStatus && matchStatus.status !== 'unknown' && (
              <MatchStatusBanner $status={matchStatus.status}>
                <span className="icon">{matchStatus.icon}</span>
                <span className="message">{matchStatus.message}</span>
              </MatchStatusBanner>
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
              ) : (messages?.messages || []).length > 0 ? (
                (messages?.messages || []).map((message, index) => {
                  const isOwn = message.by_user === currentUser.login;
                  const prevMessage = messages.messages[index - 1];
                  const isNewGroup = !prevMessage ||
                    prevMessage.by_user !== message.by_user ||
                    (new Date(message.date) - new Date(prevMessage.date)) > 300000;

                  return (
                    <MessageGroup key={message.id} $isOwn={isOwn}>
                      <Message $isOwn={isOwn}>
                        {message.message && (
                          <div className="message-text">{message.message}</div>
                        )}
                        {message.images && message.images.length > 0 && (
                          <div className="message-file">
                            {message.images.map((image, idx) => (
                              <img
                                key={idx}
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
                    <div className="match-icon">💕</div>
                    <h3>Взаимная симпатия!</h3>
                    <p>У вас совпадение с @{selectedChat}</p>
                    <p className="subtitle">Начните общение первым сообщением</p>
                    
                    <div className="suggestions">
                      <h4>Идеи для первого сообщения:</h4>
                      <div className="suggestion-buttons">
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

            <MessageInputWrapper $disabled={matchStatus && !matchStatus.canChat && matchStatus.status !== 'unknown'}>
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
                  !messageText.trim() ||
                  sendMessageMutation.isLoading ||
                  (matchStatus && !matchStatus.canChat && matchStatus.status !== 'unknown')
                }
              >
                <SendIcon />
              </ActionButton>
              
              <HiddenInput
                ref={fileInputRef}
                type="file"
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