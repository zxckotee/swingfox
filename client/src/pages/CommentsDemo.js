import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import PhotoComments from '../components/PhotoComments';
import ProfileComments from '../components/ProfileComments';
import Reactions from '../components/Reactions';
import {
  PageContainer,
  ContentCard,
  Title,
  Subtitle,
  Button,
  Card,
  Grid
} from '../components/UI';

const DemoContainer = styled(PageContainer)`
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const DemoSection = styled(Card)`
  margin-bottom: 30px;
  
  h3 {
    color: #2d3748;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #dc3522;
  }
`;

const ImagePreview = styled.div`
  width: 200px;
  height: 150px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const TabContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Tab = styled.button`
  padding: 10px 20px;
  border: 2px solid ${props => props.$active ? '#dc3522' : '#e2e8f0'};
  background: ${props => props.$active ? '#dc3522' : 'white'};
  color: ${props => props.$active ? 'white' : '#4a5568'};
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #dc3522;
    background: ${props => props.$active ? '#dc3522' : '#fff5f5'};
  }
`;

const CommentsDemo = () => {
  const [activeTab, setActiveTab] = useState('photo');
  const [currentUser, setCurrentUser] = useState('demo_user');
  const [demoImage] = useState('demo_photo.jpg');
  const [demoProfile] = useState('demo_profile');

  const handleUserChange = (newUser) => {
    setCurrentUser(newUser);
  };

  return (
    <DemoContainer>
      <ContentCard $maxWidth="1200px">
        <Title>Демонстрация системы комментариев и реакций</Title>
        <Subtitle>
          Тестируйте все новые возможности: комментарии к фотографиям, комментарии к профилям и систему реакций
        </Subtitle>

        {/* Переключатель пользователя */}
        <DemoSection>
          <h3>Переключение пользователя</h3>
          <p style={{ marginBottom: '15px', color: '#718096' }}>
            Переключайтесь между пользователями для тестирования различных сценариев
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              $variant={currentUser === 'demo_user' ? 'primary' : 'secondary'}
              onClick={() => handleUserChange('demo_user')}
            >
              Demo User
            </Button>
            <Button
              $variant={currentUser === 'another_user' ? 'primary' : 'secondary'}
              onClick={() => handleUserChange('another_user')}
            >
              Another User
            </Button>
            <Button
              $variant={currentUser === 'guest' ? 'primary' : 'secondary'}
              onClick={() => handleUserChange('guest')}
            >
              Гость
            </Button>
          </div>
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#718096' }}>
            Текущий пользователь: <strong>{currentUser}</strong>
          </p>
        </DemoSection>

        {/* Навигация по демо */}
        <TabContainer>
          <Tab
            $active={activeTab === 'photo'}
            onClick={() => setActiveTab('photo')}
          >
            Комментарии к фото
          </Tab>
          <Tab
            $active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          >
            Комментарии к профилю
          </Tab>
          <Tab
            $active={activeTab === 'reactions'}
            onClick={() => setActiveTab('reactions')}
          >
            Система реакций
          </Tab>
        </TabContainer>

        {/* Демо комментариев к фотографиям */}
        {activeTab === 'photo' && (
          <DemoSection>
            <h3>💬 Комментарии к фотографиям</h3>
            <p style={{ marginBottom: '20px', color: '#718096' }}>
              Оставляйте комментарии к фотографиям, редактируйте и удаляйте их
            </p>
            
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
              <div>
                <ImagePreview>📸</ImagePreview>
                <p style={{ fontSize: '14px', color: '#718096', textAlign: 'center' }}>
                  Демо фотография
                </p>
              </div>
              
              <div style={{ flex: 1, minWidth: '300px' }}>
                <PhotoComments 
                  filename={demoImage} 
                  currentUser={currentUser}
                />
              </div>
            </div>
          </DemoSection>
        )}

        {/* Демо комментариев к профилю */}
        {activeTab === 'profile' && (
          <DemoSection>
            <h3>👤 Комментарии к профилю</h3>
            <p style={{ marginBottom: '20px', color: '#718096' }}>
              Оставляйте публичные и приватные комментарии к профилям пользователей
            </p>
            
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
              <div>
                <div style={{
                  width: '120px',
                  height: '120px',
                  background: 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '48px',
                  marginBottom: '15px'
                }}>
                  👤
                </div>
                <p style={{ fontSize: '14px', color: '#718096', textAlign: 'center' }}>
                  Демо профиль
                </p>
              </div>
              
              <div style={{ flex: 1, minWidth: '300px' }}>
                <ProfileComments 
                  username={demoProfile} 
                  currentUser={currentUser}
                  isOwnProfile={currentUser === demoProfile}
                />
              </div>
            </div>
          </DemoSection>
        )}

        {/* Демо системы реакций */}
        {activeTab === 'reactions' && (
          <DemoSection>
            <h3>😊 Система реакций</h3>
            <p style={{ marginBottom: '20px', color: '#718096' }}>
              Ставьте различные реакции на контент: лайки, любовь, смех, удивление и другие
            </p>
            
            <Grid $columns="repeat(auto-fit, minmax(300px, 1fr))" $gap="30px">
              {/* Реакции на фотографию */}
              <Card>
                <h4 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>
                  📸 Реакции на фотографию
                </h4>
                <ImagePreview style={{ width: '100%', height: '120px' }}>📸</ImagePreview>
                <Reactions 
                  objectType="image" 
                  objectId="demo_photo_reactions" 
                  currentUser={currentUser}
                />
              </Card>
              
              {/* Реакции на профиль */}
              <Card>
                <h4 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>
                  👤 Реакции на профиль
                </h4>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '32px',
                  marginBottom: '15px'
                }}>
                  👤
                </div>
                <Reactions 
                  objectType="profile" 
                  objectId="demo_profile_reactions" 
                  currentUser={currentUser}
                />
              </Card>
              
              {/* Реакции на комментарий */}
              <Card>
                <h4 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>
                  💬 Реакции на комментарий
                </h4>
                <div style={{
                  padding: '15px',
                  background: '#f7fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '15px'
                }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#4a5568' }}>
                    <strong>Demo User:</strong> Отличный комментарий! 👍
                  </p>
                  <span style={{ fontSize: '12px', color: '#718096' }}>
                    2 минуты назад
                  </span>
                </div>
                <Reactions 
                  objectType="comment" 
                  objectId="demo_comment_reactions" 
                  currentUser={currentUser}
                />
              </Card>
            </Grid>
          </DemoSection>
        )}

        {/* Информация о возможностях */}
        <DemoSection>
          <h3>🚀 Возможности системы</h3>
          <Grid $columns="repeat(auto-fit, minmax(250px, 1fr))" $gap="20px">
            <Card>
              <h4 style={{ color: '#2d3748', marginBottom: '10px' }}>💬 Комментарии</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#4a5568' }}>
                <li>Создание комментариев</li>
                <li>Редактирование</li>
                <li>Удаление</li>
                <li>Пагинация</li>
                <li>Приватность</li>
              </ul>
            </Card>
            
            <Card>
              <h4 style={{ color: '#2d3748', marginBottom: '10px' }}>😊 Реакции</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#4a5568' }}>
                <li>6 типов реакций</li>
                <li>Быстрые действия</li>
                <li>Статистика</li>
                <li>Анимации</li>
                <li>Модальные окна</li>
              </ul>
            </Card>
            
            <Card>
              <h4 style={{ color: '#2d3748', marginBottom: '10px' }}>🔒 Безопасность</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#4a5568' }}>
                <li>Проверка прав</li>
                <li>Валидация данных</li>
                <li>Логирование</li>
                <li>Защита от спама</li>
                <li>Модерация</li>
              </ul>
            </Card>
          </Grid>
        </DemoSection>
      </ContentCard>
    </DemoContainer>
  );
};

export default CommentsDemo;
