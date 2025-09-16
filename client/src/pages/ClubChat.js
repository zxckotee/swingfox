import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from 'react-query';
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

const AttachIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
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
  const fileInputRef = useRef(null);

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

  // Мутация для отправки файлов
  const sendFileMutation = useMutation(
    (formData) => clubApi.sendChatMessage(formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['club-chat-messages', chatData?.event_id, chatData?.user_id]);
        toast.success('Файл отправлен');
      },
      onError: (error) => {
        console.error('Ошибка отправки файла:', error);
        toast.error('Ошибка при отправке файла');
      }
    }
  );

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

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && chatData) {
      const formData = new FormData();
      formData.append('images', file);
      formData.append('to_user', chatData.user_id);
      formData.append('event_id', chatData.event_id);
      
      sendFileMutation.mutate(formData);
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
              src={chatData?.user?.ava ? `/uploads/${chatData.user.ava}` : '/uploads/no_photo.jpg'}
              alt={chatData?.user?.login}
              onError={(e) => {
                e.target.src = '/uploads/no_photo.jpg';
              }}
            />
          </div>
          <div className="user-details">
            <h3>@{chatData?.user?.login || 'Пользователь'}</h3>
            <p>{chatData?.event_title || 'Мероприятие'}</p>
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
                      src={chatData?.user?.ava ? `/uploads/${chatData.user.ava}` : '/uploads/no_photo.jpg'}
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
                  {message.file && (
                    <div className="message-file">
                      <img
                        src={`/uploads/${message.file}`}
                        alt="Прикрепленное изображение"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          borderRadius: '8px',
                          marginTop: '8px'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
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
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || sendFileMutation.isLoading}
            className="attach-button"
            title="Прикрепить изображение"
          >
            <AttachIcon />
          </button>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="send-button"
          >
            <SendIcon />
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </form>
    </div>
  );
};

export default ClubChat;
