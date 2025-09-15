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

    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
    
    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Сервер принудительно отключил клиента
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          this.socket.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
      }
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
    if (!this.socket || !this.isConnected) {
      this.connect();
    }
    
    this.socket.emit('join-club-chat', {
      clubId,
      eventId,
      userId
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

  // Подписаться на сообщения клубного чата
  onClubChatMessage(callback) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.on('club-chat-message', callback);
  }

  // Отписаться от сообщений клубного чата
  offClubChatMessage(callback) {
    if (this.socket) {
      this.socket.off('club-chat-message', callback);
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
