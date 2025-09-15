import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { clubApi } from '../services/clubApi';
import toast from 'react-hot-toast';
import '../styles/ClubChat.css';

// Иконки
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
  </svg>
);


const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const ClubChat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Получаем данные чата из location state
  const chatData = location.state?.chatData;

  // Автоматическое обновление сообщений с помощью useQuery
  const { data: messagesData, isLoading: loading, error: messagesError } = useQuery(
    ['club-chat-messages', chatData?.event_id, chatData?.user_id],
    () => clubApi.getChatMessages({
      event_id: chatData.event_id,
      user_id: chatData.user_id
    }),
    {
      enabled: !!chatData?.event_id && !!chatData?.user_id,
      refetchInterval: 2000, // Обновляем каждые 2 секунды, как в пользовательском чате
      refetchOnWindowFocus: false, // Не обновляем при фокусе окна
      staleTime: 1000, // Данные считаются свежими 1 секунду
      onError: (error) => {
        console.error('Ошибка при получении сообщений:', error);
        toast.error('Ошибка при загрузке сообщений');
      }
    }
  );

  // Извлекаем сообщения из ответа API
  const messages = Array.isArray(messagesData?.data?.messages) ? messagesData.data.messages : [];

  useEffect(() => {
    console.log('ClubChat mounted with chatId:', chatId, 'chatData:', chatData);
    
    if (!chatData) {
      console.log('No chatData, redirecting to /club/chats');
      navigate('/club/chats');
      return;
    }
    
    if (!chatId || chatId === 'undefined') {
      console.log('Invalid chatId, redirecting to /club/chats');
      navigate('/club/chats');
      return;
    }
  }, [chatId, chatData, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };



  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      
      const messageData = {
        message: newMessage.trim(),
        to_user: chatData.user_id,
        event_id: chatData.event_id
      };

      const response = await clubApi.sendChatMessage(messageData);
      
      if (response.success) {
        setNewMessage('');
        
        // Обновляем кэш запроса, чтобы сообщения автоматически обновились
        queryClient.invalidateQueries(['club-chat-messages', chatData?.event_id, chatData?.user_id]);
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      toast.error('Ошибка при отправке сообщения');
    } finally {
      setSending(false);
    }
  };


  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    });
  };

  const getMessageClass = (message) => {
    if (message.by_user.startsWith('club_')) return 'message-club';
    return 'message-user';
  };

  if (loading) {
    return (
      <div className="club-chat-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка чата...</p>
      </div>
    );
  }

  return (
    <div className="club-chat">
      {/* Header */}
      <div className="chat-header">
        <button 
          className="back-button"
          onClick={() => navigate('/club/chats')}
        >
          <ArrowLeftIcon />
        </button>
        
        <div className="chat-user-info">
          <div className="user-avatar">
            <img
              src={chatInfo?.user?.ava ? `/uploads/${chatInfo.user.ava}` : '/uploads/no_photo.jpg'}
              alt={chatInfo?.user?.login}
              onError={(e) => {
                e.target.src = '/uploads/no_photo.jpg';
              }}
            />
          </div>
          <div className="user-details">
            <h3>@{chatInfo?.user?.login || 'Пользователь'}</h3>
            <p>{chatInfo?.event_title || 'Мероприятие'}</p>
          </div>
        </div>

      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-icon">💬</div>
            <h3>Начните общение</h3>
            <p>Отправьте первое сообщение участнику мероприятия</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message) => (
              <div key={message.id} className={`message ${getMessageClass(message)}`}>
                <div className="message-avatar">
                  {message.is_from_club ? (
                    <UserIcon />
                  ) : (
                    <img
                      src={chatInfo?.user?.ava ? `/uploads/${chatInfo.user.ava}` : '/uploads/no_photo.jpg'}
                      alt="User"
                      onError={(e) => {
                        e.target.src = '/uploads/no_photo.jpg';
                      }}
                    />
                  )}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-sender">
                      {message.by_user.startsWith('club_') ? 'Клуб' : 
                       message.by_user}
                    </span>
                    <span className="message-time">
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                  <div className="message-text">
                    {message.message}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <form className="message-input" onSubmit={handleSendMessage}>
        <div className="input-container">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Введите сообщение..."
            disabled={sending}
            className="message-field"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="send-button"
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClubChat;
