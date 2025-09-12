import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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

const BotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
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
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatInfo, setChatInfo] = useState(null);
  const [botConfig, setBotConfig] = useState(null);

  // Получаем данные чата из location state
  const chatData = location.state?.chatData;

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
    
    loadChatData();
  }, [chatId, chatData]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatData = async () => {
    try {
      setLoading(true);
      
      // Загружаем сообщения чата с параметрами
      const messagesData = await clubApi.getChatMessages({
        event_id: chatData.event_id,
        user_id: chatData.user_id
      });
      setMessages(Array.isArray(messagesData.messages) ? messagesData.messages : []);

      // Загружаем конфигурацию бота клуба
      const botData = await clubApi.getBotConfig();
      setBotConfig(botData);

      setChatInfo(chatData);
    } catch (error) {
      console.error('Ошибка загрузки чата:', error);
      toast.error('Ошибка при загрузке чата');
    } finally {
      setLoading(false);
    }
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
        // Добавляем сообщение в локальное состояние
        const newMsg = {
          id: response.data.id,
          message: newMessage.trim(),
          by_user: `club_${chatData.club_id}`,
          created_at: new Date().toISOString(),
          is_from_club: true
        };
        
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        
        // Если бот настроен, отправляем сообщение боту
        if (botConfig && botConfig.auto_reply_enabled) {
          setTimeout(() => {
            handleBotResponse(newMessage.trim());
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      toast.error('Ошибка при отправке сообщения');
    } finally {
      setSending(false);
    }
  };

  const handleBotResponse = async (userMessage) => {
    try {
      // Отправляем сообщение боту для обработки
      const botResponse = await clubApi.sendToBot({
        user_message: userMessage,
        user_id: chatData.user_id,
        event_id: chatData.event_id
      });

      if (botResponse.success && botResponse.message) {
        // Добавляем ответ бота в чат
        const botMsg = {
          id: `bot_${Date.now()}`,
          message: botResponse.message,
          by_user: 'bot',
          created_at: new Date().toISOString(),
          is_from_bot: true
        };
        
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (error) {
      console.error('Ошибка обработки ботом:', error);
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
    if (message.is_from_bot) return 'message-bot';
    if (message.is_from_club) return 'message-club';
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

        <div className="chat-actions">
          {botConfig && (
            <div className="bot-status">
              <BotIcon />
              <span>{botConfig.auto_reply_enabled ? 'Бот активен' : 'Бот отключен'}</span>
            </div>
          )}
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
                  {message.is_from_bot ? (
                    <BotIcon />
                  ) : message.is_from_club ? (
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
                      {message.is_from_bot ? 'Бот' : 
                       message.is_from_club ? 'Клуб' : 
                       chatInfo?.user?.login}
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
        
        {botConfig && botConfig.auto_reply_enabled && (
          <div className="bot-indicator">
            <BotIcon />
            <span>Автоответчик активен</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default ClubChat;
