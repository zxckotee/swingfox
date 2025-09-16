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
  const [attachedFiles, setAttachedFiles] = useState([]); // Прикрепленные файлы
  const [selectedImage, setSelectedImage] = useState(null); // Выбранное изображение для модального окна
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
    
    if ((!newMessage.trim() && attachedFiles.length === 0) || sending) return;

    try {
      setSending(true);
      
      // Используем FormData для отправки файлов
      const formData = new FormData();
      formData.append('message', newMessage.trim() || '');
      formData.append('to_user', chatData.user_id);
      formData.append('event_id', chatData.event_id);
      
      // Добавляем прикрепленные файлы
      attachedFiles.forEach(fileObj => {
        formData.append('images', fileObj.file);
      });

      const response = await clubApi.sendChatMessage(formData);
      
      if (response.success) {
        setNewMessage('');
        
        // Очищаем прикрепленные файлы после отправки
        attachedFiles.forEach(fileObj => {
          URL.revokeObjectURL(fileObj.preview);
        });
        setAttachedFiles([]);
        
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
    const files = Array.from(event.target.files);
    if (files.length > 0 && chatData) {
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

  const handleImageClick = (imageSrc) => {
    setSelectedImage(imageSrc);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };


  const formatMessageTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Неизвестно';
      }
      return date.toLocaleString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short'
      });
    } catch (error) {
      console.error('Error formatting time:', error, timestamp);
      return 'Неизвестно';
    }
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
                    {(message.file || (message.images && message.images.length > 0)) && (
                      <div className="message-file">
                        {message.file ? (
                          <img
                            src={`/uploads/${message.file}`}
                            alt="Прикрепленное изображение"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleImageClick(`/uploads/${message.file}`)}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          message.images.map((image, idx) => (
                            <img
                              key={`${message.id}-image-${idx}`}
                              src={`/uploads/${image}`}
                              alt="Вложение"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleImageClick(`/uploads/${image}`)}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ))
                        )}
                      </div>
                    )}
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
        {attachedFiles.length > 0 && (
          <div className="attached-files-container">
            {attachedFiles.map((fileObj) => (
              <div key={fileObj.id} className="attached-file-item">
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
                  className="remove-file-btn"
                  onClick={() => removeAttachedFile(fileObj.id)}
                  title="Удалить файл"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
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
            disabled={(!newMessage.trim() && attachedFiles.length === 0) || sending}
            className="send-button"
          >
            <SendIcon />
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </form>
      
      {/* Модальное окно для просмотра изображений */}
      {selectedImage && (
        <div className="image-modal" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closeImageModal}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <img src={selectedImage} alt="Увеличенное изображение" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubChat;
