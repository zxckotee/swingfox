import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { chatAPI, apiUtils } from '../services/api';

const ChatContainer = styled.div`
  display: flex;
  height: 100vh;
  background: ${props => props.theme.colors.background};
`;

const ChatList = styled.div`
  width: 350px;
  background: white;
  border-right: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    width: ${props => props.selectedChat ? '0' : '100%'};
    overflow: hidden;
  }
`;

const ChatListHeader = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.primary};
  color: white;
  
  h3 {
    margin: 0;
    font-size: ${props => props.theme.fonts.sizes.large};
  }
`;

const ChatsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ChatItem = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  
  &:hover {
    background: ${props => props.theme.colors.background};
  }
  
  &.active {
    background: ${props => props.theme.colors.primary}10;
    border-right: 3px solid ${props => props.theme.colors.primary};
  }
  
  .avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-image: url(${props => props.avatar});
    background-size: cover;
    background-position: center;
    background-color: ${props => props.theme.colors.border};
    position: relative;
    
    &.online::after {
      content: '';
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: #4caf50;
      border-radius: 50%;
      border: 2px solid white;
    }
  }
  
  .chat-info {
    flex: 1;
    min-width: 0;
    
    .name {
      font-weight: bold;
      margin-bottom: 2px;
      color: ${props => props.theme.colors.text};
    }
    
    .last-message {
      color: ${props => props.theme.colors.textLight};
      font-size: ${props => props.theme.fonts.sizes.small};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .time {
      font-size: ${props => props.theme.fonts.sizes.small};
      color: ${props => props.theme.colors.textLight};
    }
  }
  
  .unread {
    background: ${props => props.theme.colors.primary};
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${props => props.theme.fonts.sizes.small};
    font-weight: bold;
  }
`;

const ChatWindow = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    width: ${props => props.selectedChat ? '100%' : '0'};
    overflow: hidden;
  }
`;

const ChatHeader = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background: white;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  
  .back-button {
    display: none;
    @media (max-width: 768px) {
      display: block;
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
    }
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-image: url(${props => props.avatar});
    background-size: cover;
    background-position: center;
    background-color: ${props => props.theme.colors.border};
  }
  
  .user-info {
    flex: 1;
    
    .name {
      font-weight: bold;
      margin-bottom: 2px;
    }
    
    .status {
      font-size: ${props => props.theme.fonts.sizes.small};
      color: ${props => props.theme.colors.textLight};
    }
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const MessageGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
  gap: ${props => props.theme.spacing.xs};
`;

const Message = styled.div`
  max-width: 70%;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: 18px;
  background: ${props => props.isOwn ? props.theme.colors.primary : '#f1f1f1'};
  color: ${props => props.isOwn ? 'white' : props.theme.colors.text};
  word-wrap: break-word;
  
  .message-text {
    margin-bottom: ${props => props.theme.spacing.xs};
  }
  
  .message-file {
    margin-bottom: ${props => props.theme.spacing.xs};
    
    img {
      max-width: 200px;
      border-radius: 8px;
    }
    
    .file-link {
      color: ${props => props.isOwn ? 'white' : props.theme.colors.primary};
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
  
  .message-time {
    font-size: ${props => props.theme.fonts.sizes.small};
    opacity: 0.7;
    margin-top: ${props => props.theme.spacing.xs};
  }
`;

const TypingIndicator = styled.div`
  padding: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.textLight};
  font-style: italic;
  font-size: ${props => props.theme.fonts.sizes.small};
`;

const MessageInput = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.border};
  background: white;
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  align-items: flex-end;
`;

const InputContainer = styled.div`
  flex: 1;
  position: relative;
`;

const TextInput = styled.textarea`
  width: 100%;
  min-height: 40px;
  max-height: 120px;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 20px;
  resize: none;
  font-family: inherit;
  font-size: ${props => props.theme.fonts.sizes.medium};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ActionButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: ${props => props.theme.colors.primary};
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primaryDark};
    transform: scale(1.1);
  }
  
  &:disabled {
    background: ${props => props.theme.colors.border};
    cursor: not-allowed;
    transform: none;
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
  color: ${props => props.theme.colors.textLight};
  
  h3 {
    margin-bottom: ${props => props.theme.spacing.md};
  }
`;

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(chatId || null);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  
  const currentUser = apiUtils.getCurrentUser();

  // Получение списка чатов
  const { data: chats = [] } = useQuery(
    'chats',
    chatAPI.getChats,
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
      queryClient.invalidateQueries('chats');
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const sendFileMutation = useMutation(chatAPI.sendFile, {
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedChat]);
      queryClient.invalidateQueries('chats');
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

  // Обработчики
  const handleChatSelect = (chatUser) => {
    setSelectedChat(chatUser);
    navigate(`/chat/${chatUser}`);
  };

  const handleSendMessage = () => {
    if (messageText.trim() && selectedChat) {
      sendMessageMutation.mutate({
        to: selectedChat,
        message: messageText.trim()
      });
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
      formData.append('file', file);
      formData.append('to', selectedChat);
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

  const selectedChatData = chats.find(chat => chat.user === selectedChat);

  return (
    <ChatContainer>
      <ChatList selectedChat={selectedChat}>
        <ChatListHeader>
          <h3>Сообщения</h3>
        </ChatListHeader>
        
        <ChatsContainer>
          {chats.map(chat => (
            <ChatItem
              key={chat.user}
              className={selectedChat === chat.user ? 'active' : ''}
              onClick={() => handleChatSelect(chat.user)}
              avatar={chat.avatar ? `/uploads/${chat.avatar}` : ''}
            >
              <div className={`avatar ${chat.online ? 'online' : ''}`} />
              <div className="chat-info">
                <div className="name">@{chat.user}</div>
                <div className="last-message">
                  {chat.lastMessage || 'Начните общение'}
                </div>
                <div className="time">
                  {chat.lastMessageTime && formatTime(chat.lastMessageTime)}
                </div>
              </div>
              {chat.unreadCount > 0 && (
                <div className="unread">{chat.unreadCount}</div>
              )}
            </ChatItem>
          ))}
        </ChatsContainer>
      </ChatList>

      <ChatWindow selectedChat={selectedChat}>
        {selectedChat ? (
          <>
            <ChatHeader avatar={selectedChatData?.avatar ? `/uploads/${selectedChatData.avatar}` : ''}>
              <button 
                className="back-button"
                onClick={() => {
                  setSelectedChat(null);
                  navigate('/chat');
                }}
              >
                ←
              </button>
              <div className="avatar" />
              <div className="user-info">
                <div className="name">@{selectedChat}</div>
                <div className="status">
                  {selectedChatData?.online ? 'онлайн' : 'не в сети'}
                </div>
              </div>
            </ChatHeader>

            <MessagesContainer>
              {messages.map((message, index) => {
                const isOwn = message.from_user === currentUser.login;
                const prevMessage = messages[index - 1];
                const isNewGroup = !prevMessage || 
                  prevMessage.from_user !== message.from_user ||
                  (new Date(message.timestamp) - new Date(prevMessage.timestamp)) > 300000;

                return (
                  <MessageGroup key={message.id} isOwn={isOwn}>
                    <Message isOwn={isOwn}>
                      {message.message && (
                        <div className="message-text">{message.message}</div>
                      )}
                      {message.file && (
                        <div className="message-file">
                          {message.file.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                            <img src={`/uploads/${message.file}`} alt="Вложение" />
                          ) : (
                            <a 
                              href={`/uploads/${message.file}`} 
                              className="file-link"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              📎 {message.file}
                            </a>
                          )}
                        </div>
                      )}
                      <div className="message-time">
                        {formatTime(message.timestamp)}
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
              
              <ActionButton onClick={() => fileInputRef.current?.click()}>
                📎
              </ActionButton>
              
              <ActionButton
                onClick={handleSendMessage}
                disabled={!messageText.trim() || sendMessageMutation.isLoading}
              >
                ➤
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
            <div>
              <h3>Выберите чат</h3>
              <p>Выберите диалог из списка, чтобы начать общение</p>
            </div>
          </EmptyState>
        )}
      </ChatWindow>
    </ChatContainer>
  );
};

export default Chat;