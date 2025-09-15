import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    // Определяем URL для WebSocket
    const isProduction = process.env.NODE_ENV === 'production';
    let wsUrl = process.env.REACT_APP_WS_URL;
    
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      REACT_APP_WS_URL: process.env.REACT_APP_WS_URL,
      isProduction
    });
    
    // Fallback для неправильных URL или если переменная не загружена
    if (!wsUrl || wsUrl.includes('/ws') || wsUrl.includes('/socket.io') || wsUrl.includes('localhost')) {
      wsUrl = isProduction ? 'http://88.218.121.216:3001' : 'http://localhost:3001';
    }
    
    // Принудительно используем правильный URL для production
    if (window.location.hostname === '88.218.121.216' || window.location.hostname.includes('88.218.121.216')) {
      // Используем HTTPS если страница загружена по HTTPS
      const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
      wsUrl = `${protocol}://88.218.121.216:3001`;
    }
    
    console.log('Connecting to WebSocket:', wsUrl);
    
    this.socket = io(wsUrl, {
      transports: ['polling', 'websocket'], // Сначала polling, потом websocket
      timeout: 10000, // Уменьшаем timeout
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      maxReconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Сервер принудительно отключил клиента
        console.log('🔄 Server disconnected, attempting to reconnect...');
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      console.error('Error details:', {
        message: error.message,
        type: error.type,
        description: error.description,
        context: error.context,
        transport: error.transport
      });
      this.isConnected = false;
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;
        console.log(`🔄 Attempting to reconnect in ${delay}ms... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        setTimeout(() => {
          this.socket.connect();
        }, delay);
      } else {
        console.error('❌ Max reconnection attempts reached');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('✅ WebSocket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 WebSocket reconnection attempt:', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ WebSocket reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket reconnection failed');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Присоединиться к комнате клубного чата
  joinClubChat(clubId, eventId, userId) {
    if (!this.socket) {
      console.log('🔄 WebSocket not initialized, connecting...');
      this.connect();
    }
    
    if (!this.isConnected) {
      console.log('⏳ WebSocket not connected, waiting for connection...');
      // Ждем подключения
      this.socket.once('connect', () => {
        console.log('✅ WebSocket connected, joining club chat room');
        this.socket.emit('join-club-chat', {
          clubId,
          eventId,
          userId
        });
      });
      return;
    }
    
    console.log('🏛️ Joining club chat room:', { clubId, eventId, userId });
    this.socket.emit('join-club-chat', {
      clubId,
      eventId,
      userId
    });
  }

  // Присоединиться к комнате обычного чата между пользователями
  joinUserChat(fromUser, toUser) {
    if (!this.socket) {
      console.log('🔄 WebSocket not initialized, connecting...');
      this.connect();
    }
    
    if (!this.isConnected) {
      console.log('⏳ WebSocket not connected, waiting for connection...');
      // Ждем подключения
      this.socket.once('connect', () => {
        console.log('✅ WebSocket connected, joining user chat room');
        this.socket.emit('join-user-chat', {
          fromUser,
          toUser
        });
      });
      return;
    }
    
    console.log('💬 Joining user chat room:', { fromUser, toUser });
    this.socket.emit('join-user-chat', {
      fromUser,
      toUser
    });
  }

  // Отправить сообщение в клубном чате
  sendClubChatMessage(data) {
    if (!this.socket || !this.isConnected) {
      console.error('WebSocket not connected');
      return;
    }
    
    this.socket.emit('club-chat-message', data);
  }

  // Отправить сообщение в обычном чате между пользователями
  sendUserChatMessage(data) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ WebSocket not connected, cannot send message');
      return;
    }
    
    // Преобразуем данные в правильный формат для сервера
    const messageData = {
      fromUser: data.from_user,
      toUser: data.to_user,
      message: data.message,
      messageId: data.messageId || Date.now().toString()
    };
    
    console.log('📤 Sending user chat message via WebSocket:', messageData);
    this.socket.emit('user-chat-message', messageData);
  }

  // Подписаться на сообщения клубного чата
  onClubChatMessage(callback) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.on('club-chat-message', callback);
  }

  // Подписаться на сообщения обычного чата между пользователями
  onUserChatMessage(callback) {
    if (!this.socket) {
      this.connect();
    }
    
    console.log('🔔 Subscribing to user-chat-message events');
    this.socket.on('user-chat-message', (data) => {
      console.log('📨 Received user-chat-message event:', data);
      callback(data);
    });
  }

  // Отписаться от сообщений клубного чата
  offClubChatMessage(callback) {
    if (this.socket) {
      this.socket.off('club-chat-message', callback);
    }
  }

  // Отписаться от сообщений обычного чата между пользователями
  offUserChatMessage(callback) {
    if (this.socket) {
      console.log('🔕 Unsubscribing from user-chat-message events');
      this.socket.off('user-chat-message', callback);
    }
  }

  // Проверить статус подключения
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null
    };
  }
}

// Создаем единственный экземпляр сервиса
const websocketService = new WebSocketService();

export default websocketService;
