import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Иконки
import { 
  ChatIcon, 
  SendIcon, 
  BotIcon,
  UserIcon,
  FilterIcon,
  SearchIcon
} from './UI';

const Container = styled.div`
  padding: 20px 0;
  height: 600px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e2e8f0;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  color: #2d3748;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
`;

const SearchInput = styled.div`
  position: relative;
  
  input {
    padding: 8px 12px 8px 35px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.9rem;
    width: 200px;
    
    &:focus {
      outline: none;
      border-color: #dc3522;
    }
  }
  
  .search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #718096;
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #edf2f7;
  }
`;

const ChatLayout = styled.div`
  display: flex;
  flex: 1;
  gap: 20px;
  min-height: 0;
`;

const ChatList = styled.div`
  width: 300px;
  background: #f7fafc;
  border-radius: 12px;
  padding: 15px;
  overflow-y: auto;
`;

const ChatItem = styled.div`
  padding: 12px;
  background: ${props => props.$active ? 'white' : 'transparent'};
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid ${props => props.$active ? '#dc3522' : 'transparent'};
  
  &:hover {
    background: white;
    transform: translateX(2px);
  }
`;

const ChatItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
`;

const ChatItemName = styled.div`
  font-weight: 600;
  color: #2d3748;
  font-size: 0.9rem;
`;

const ChatItemTime = styled.div`
  font-size: 0.7rem;
  color: #718096;
`;

const ChatItemPreview = styled.div`
  font-size: 0.8rem;
  color: #4a5568;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChatItemStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
`;

const StatusBadge = styled.span`
  background: ${props => {
    switch (props.$status) {
      case 'new': return '#48bb78';
      case 'active': return '#3182ce';
      case 'pending': return '#ed8936';
      default: return '#a0aec0';
    }
  }};
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  padding: 15px 20px;
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChatTitle = styled.h3`
  margin: 0;
  color: #2d3748;
  font-size: 1.1rem;
`;

const ChatStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #718096;
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Message = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 80%;
  align-self: ${props => props.$isBot ? 'flex-start' : 'flex-end'};
  flex-direction: ${props => props.$isBot ? 'row' : 'row-reverse'};
`;

const MessageAvatar = styled.div`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: ${props => props.$isBot ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' : 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  flex-shrink: 0;
`;

const MessageContent = styled.div`
  background: ${props => props.$isBot ? '#f7fafc' : 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)'};
  color: ${props => props.$isBot ? '#2d3748' : 'white'};
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 0.9rem;
  line-height: 1.4;
  max-width: 100%;
  word-wrap: break-word;
`;

const MessageTime = styled.div`
  font-size: 0.7rem;
  color: #718096;
  margin-top: 5px;
  text-align: ${props => props.$isBot ? 'left' : 'right'};
`;

const MessageInput = styled.div`
  padding: 15px 20px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 25px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #dc3522;
  }
`;

const SendButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #718096;
  
  .icon {
    font-size: 4rem;
    margin-bottom: 20px;
    opacity: 0.5;
  }
  
  h3 {
    margin: 0 0 10px 0;
    color: #2d3748;
  }
  
  p {
    margin: 0;
    line-height: 1.6;
  }
`;

const ClubChatInterface = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const chats = [
    {
      id: 1,
      name: 'Анна Петрова',
      lastMessage: 'Спасибо за приглашение на мероприятие!',
      time: '14:30',
      status: 'new',
      unread: 2
    },
    {
      id: 2,
      name: 'Михаил Сидоров',
      lastMessage: 'Когда будет следующая вечеринка?',
      time: '12:15',
      status: 'active',
      unread: 0
    },
    {
      id: 3,
      name: 'Елена Козлова',
      lastMessage: 'Хочу присоединиться к клубу',
      time: '10:45',
      status: 'pending',
      unread: 1
    }
  ];

  const messages = selectedChat ? [
    {
      id: 1,
      text: 'Привет! Добро пожаловать в наш клуб! 👋',
      time: '14:25',
      isBot: true
    },
    {
      id: 2,
      text: 'Спасибо! Очень рада быть здесь!',
      time: '14:26',
      isBot: false
    },
    {
      id: 3,
      text: 'У нас скоро будет отличная вечеринка. Хотите прийти?',
      time: '14:27',
      isBot: true
    },
    {
      id: 4,
      text: 'Конечно! Расскажите подробнее',
      time: '14:28',
      isBot: false
    }
  ] : [];

  const handleSendMessage = () => {
    if (message.trim() && selectedChat) {
      toast.success('Сообщение отправлено');
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container>
      <Header>
        <Title>
          <ChatIcon />
          Чат с участниками
        </Title>
        <Controls>
          <SearchInput>
            <div className="search-icon">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Поиск участников..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchInput>
          <FilterButton>
            <FilterIcon />
            Фильтр
          </FilterButton>
        </Controls>
      </Header>

      <ChatLayout>
        <ChatList>
          {filteredChats.map((chat) => (
            <ChatItem
              key={chat.id}
              $active={selectedChat?.id === chat.id}
              onClick={() => setSelectedChat(chat)}
            >
              <ChatItemHeader>
                <ChatItemName>{chat.name}</ChatItemName>
                <ChatItemTime>{chat.time}</ChatItemTime>
              </ChatItemHeader>
              <ChatItemPreview>{chat.lastMessage}</ChatItemPreview>
              <ChatItemStatus>
                <StatusBadge $status={chat.status}>
                  {chat.status === 'new' && 'Новый'}
                  {chat.status === 'active' && 'Активный'}
                  {chat.status === 'pending' && 'Ожидает'}
                </StatusBadge>
                {chat.unread > 0 && (
                  <span style={{ color: '#dc3522', fontSize: '0.8rem' }}>
                    {chat.unread} новых
                  </span>
                )}
              </ChatItemStatus>
            </ChatItem>
          ))}
        </ChatList>

        <ChatArea>
          {selectedChat ? (
            <>
              <ChatHeader>
                <ChatTitle>{selectedChat.name}</ChatTitle>
                <ChatStatus>
                  <StatusBadge $status={selectedChat.status}>
                    {selectedChat.status === 'new' && 'Новый участник'}
                    {selectedChat.status === 'active' && 'Активный'}
                    {selectedChat.status === 'pending' && 'Ожидает подтверждения'}
                  </StatusBadge>
                </ChatStatus>
              </ChatHeader>

              <MessagesContainer>
                {messages.map((msg) => (
                  <Message key={msg.id} $isBot={msg.isBot}>
                    <MessageAvatar $isBot={msg.isBot}>
                      {msg.isBot ? <BotIcon /> : <UserIcon />}
                    </MessageAvatar>
                    <div>
                      <MessageContent $isBot={msg.isBot}>
                        {msg.text}
                      </MessageContent>
                      <MessageTime $isBot={msg.isBot}>
                        {msg.time}
                      </MessageTime>
                    </div>
                  </Message>
                ))}
              </MessagesContainer>

              <MessageInput>
                <Input
                  type="text"
                  placeholder="Введите сообщение..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <SendButton
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                >
                  <SendIcon />
                </SendButton>
              </MessageInput>
            </>
          ) : (
            <EmptyState>
              <div className="icon">💬</div>
              <h3>Выберите участника для начала чата</h3>
              <p>Здесь вы можете общаться с участниками ваших мероприятий</p>
            </EmptyState>
          )}
        </ChatArea>
      </ChatLayout>
    </Container>
  );
};

export default ClubChatInterface;
