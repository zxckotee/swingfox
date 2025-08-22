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

// Дополнительные иконки
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

const ChatContainer = styled(PageContainer)`
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 0;
`;

const ChatSidebar = styled.div`
  width: 380px;
  background: white;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  
  @media (max-width: 768px) {
    width: ${props => props.$selectedChat ? '0' : '100%'};
    position: ${props => props.$selectedChat ? 'absolute' : 'relative'};
    left: ${props => props.$selectedChat ? '-100%' : '0'};
    transition: all 0.3s ease;
    z-index: 10;
  }
`;

const ChatHeader = styled.div`
  padding: 25px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  color: white;
  
  h3 {
    margin: 0 0 5px 0;
    font-size: 24px;
    font-weight: 700;
  }
  
  p {
    margin: 0;
    opacity: 0.9;
    font-size: 14px;
  }
  
  @media (max-width: 768px) {
    padding: 20px 15px;
    
    h3 {
      font-size: 20px;
    }
  }
`;

const SearchContainer = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
`;

const SearchInput = styled.div`
  position: relative;
  
  input {
    width: 100%;
    padding: 12px 16px 12px 45px;
    border: 2px solid #e2e8f0;
    border-radius: 25px;
    font-size: 14px;
    background: #f7fafc;
    transition: all 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: #dc3522;
      background: white;
      box-shadow: 0 0 0 3px rgba(220, 53, 34, 0.1);
    }
    
    &::placeholder {
      color: #a0aec0;
    }
  }
  
  .search-icon {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #a0aec0;
  }
`;

const ChatsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
  }
`;

const ChatItem = styled.div`
  padding: 16px 20px;
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
      margin-bottom: 4px;
      color: #2d3748;
      font-size: 15px;
    }
    
    .last-message {
      color: #718096;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.3;
    }
    
    .time {
      font-size: 12px;
      color: #a0aec0;
      margin-top: 2px;
    }
  }
  
  .unread-badge {
    background: #dc3522;
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
    top: 12px;
    right: 15px;
  }
  
  @media (max-width: 768px) {
    padding: 12px 15px;
    
    .chat-info {
      .name {
        font-size: 14px;
      }
      
      .last-message {
        font-size: 12px;
      }
    }
  }
`;

const ChatWindow = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  
  @media (max-width: 768px) {
    width: ${props => props.$selectedChat ? '100%' : '0'};
    position: ${props => props.$selectedChat ? 'relative' : 'absolute'};
    right: ${props => props.$selectedChat ? '0' : '-100%'};
    transition: all 0.3s ease;
  }
`;

const ChatWindowHeader = styled.div`
  padding: 20px 25px;
  border-bottom: 1px solid #e2e8f0;
  background: white;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  
  .back-button {
    display: none;
    @media (max-width: 768px) {
      display: flex;
    }
  }
  
  .user-info {
    flex: 1;
    
    .name {
      font-weight: 600;
      margin-bottom: 2px;
      color: #2d3748;
      font-size: 18px;
    }
    
    .status {
      font-size: 13px;
      color: #718096;
      display: flex;
      align-items: center;
      gap: 6px;
      
      .online-dot {
        width: 8px;
        height: 8px;
        background: #48bb78;
        border-radius: 50%;
      }
    }
  }
  
  @media (max-width: 768px) {
    padding: 15px 20px;
    
    .user-info .name {
      font-size: 16px;
    }
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 3px;
  }
  
  @media (max-width: 768px) {
    padding: 15px;
    gap: 12px;
  }
`;

const MessageGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isOwn ? 'flex-end' : 'flex-start'};
  gap: 4px;
  max-width: 80%;
  align-self: ${props => props.$isOwn ? 'flex-end' : 'flex-start'};
`;

const Message = styled.div`
  padding: 12px 16px;
  border-radius: 18px;
  background: ${props => props.$isOwn ? 
    'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)' : 
    'white'
  };
  color: ${props => props.$isOwn ? 'white' : '#2d3748'};
  word-wrap: break-word;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  animation: messageSlide 0.3s ease-out;
  
  @keyframes messageSlide {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .message-text {
    margin-bottom: 4px;
    line-height: 1.4;
    font-size: 15px;
  }
  
  .message-file {
    margin-bottom: 8px;
    
    img {
      max-width: 250px;
      border-radius: 12px;
      cursor: pointer;
    }
    
    .file-link {
      color: ${props => props.$isOwn ? 'rgba(255,255,255,0.9)' : '#dc3522'};
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: ${props => props.$isOwn ? 'rgba(255,255,255,0.1)' : '#f7fafc'};
      border-radius: 8px;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
  
  .message-time {
    font-size: 11px;
    opacity: 0.7;
    margin-top: 4px;
  }
  
  @media (max-width: 768px) {
    padding: 10px 14px;
    
    .message-text {
      font-size: 14px;
    }
  }
`;

const TypingIndicator = styled.div`
  padding: 12px 16px;
  color: #718096;
  font-style: italic;
  font-size: 14px;
  background: white;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  align-self: flex-start;
  animation: typing 1.5s infinite;
  
  @keyframes typing {
    0%, 60%, 100% {
      opacity: 1;
    }
    30% {
      opacity: 0.5;
    }
  }
`;

const MessageInput = styled.div`
  padding: 20px 25px;
  border-top: 1px solid #e2e8f0;
  background: white;
  display: flex;
  gap: 12px;
  align-items: flex-end;
  
  @media (max-width: 768px) {
    padding: 15px 20px;
    gap: 10px;
  }
`;

const InputContainer = styled.div`
  flex: 1;
  position: relative;
`;

const TextInput = styled.textarea`
  width: 100%;
  min-height: 44px;
  max-height: 120px;
  padding: 12px 50px 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 22px;
  resize: none;
  font-family: inherit;
  font-size: 15px;
  background: #f7fafc;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #dc3522;
    background: white;
    box-shadow: 0 0 0 3px rgba(220, 53, 34, 0.1);
  }
  
  &::placeholder {
    color: #a0aec0;
  }
  
  @media (max-width: 768px) {
    font-size: 14px;
    padding: 10px 45px 10px 14px;
  }
`;

const ActionButton = styled(IconButton)`
  width: 44px;
  height: 44px;
  box-shadow: 0 4px 15px rgba(220, 53, 34, 0.3);
  
  &.attach {
    background: #718096;
    
    &:hover:not(:disabled) {
      background: #4a5568;
    }
  }
  
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #718096;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  
  .content {
    max-width: 300px;
  }
  
  .icon {
    font-size: 64px;
    margin-bottom: 20px;
    opacity: 0.5;
  }
  
  h3 {
    margin: 0 0 10px 0;
    color: #2d3748;
    font-size: 20px;
  }
  
  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
  }
  
  @media (max-width: 768px) {
    .icon {
      font-size: 48px;
    }
    
    h3 {
      font-size: 18px;
    }
  }
`;

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(chatId || null);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  
  const currentUser = apiUtils.getCurrentUser();

  // Получение списка чатов
  const { data: chats = [] } = useQuery(
    'conversations',
    chatAPI.getConversations,
    {
      refetchInterval: 5000 // Обновляем каждые 5 секунд
    }
  );

  // Получение сообщений текущего чата
  const { data: messages = [] } = useQuery(
    ['messages', selectedChat],
    () => chatAPI.getMessages(selectedChat),
    {
      enabled: !!selectedChat,
      refetchInterval: 2000 // Обновляем каждые 2 секунды
    }
  );

  // Мутации
  const sendMessageMutation = useMutation(chatAPI.sendMessage, {
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries(['messages', selectedChat]);
      queryClient.invalidateQueries('conversations');
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const sendFileMutation = useMutation(chatAPI.sendMessage, {
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedChat]);
      queryClient.invalidateQueries('conversations');
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  // Эффекты
  useEffect(() => {
    if (chatId && chatId !== selectedChat) {
      setSelectedChat(chatId);
    }
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Фильтрация чатов по поиску
  const filteredChats = (chats?.conversations || []).filter(chat =>
    chat.companion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Обработчики
  const handleChatSelect = (chatUser) => {
    setSelectedChat(chatUser);
    navigate(`/chat/${chatUser}`);
  };

  const handleSendMessage = () => {
    if (messageText.trim() && selectedChat) {
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

  const selectedChatData = (chats?.conversations || []).find(chat => chat.companion === selectedChat);

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
                  {chat.last_message || 'Начните общение'}
                </div>
                <div className="time">
                  {chat.last_message_date && formatTime(chat.last_message_date)}
                </div>
              </div>
              
              {chat.unread_count > 0 && (
                <div className="unread-badge">{chat.unread_count}</div>
              )}
            </ChatItem>
          ))}
          
          {filteredChats.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#718096' }}>
              {searchTerm ? 'Чаты не найдены' : 'Пока нет активных чатов'}
            </div>
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

            <MessagesContainer>
              {(messages?.messages || []).map((message, index) => {
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
              })}
              
              {isTyping && (
                <TypingIndicator>
                  @{selectedChat} печатает...
                </TypingIndicator>
              )}
              
              <div ref={messagesEndRef} />
            </MessagesContainer>

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
                disabled={!messageText.trim() || sendMessageMutation.isLoading}
              >
                <SendIcon />
              </ActionButton>
              
              <HiddenInput
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
              />
            </MessageInput>
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