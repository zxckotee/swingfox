import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { usersAPI, apiUtils } from '../services/api';
import { LocationSelector } from '../components/Geography';
import {
  PageContainer,
  ContentCard,
  Avatar,
  Button,
  IconButton,
  Form,
  FormGroup,
  FormRow,
  Label,
  Input,
  TextArea,
  ErrorText,
  LoadingSpinner,
  FlexContainer,
  Grid,
  Card,
  Modal,
  ModalContent,
  ModalHeader,
  CloseIcon,
  EditIcon,
  PlusIcon
} from '../components/UI';

// Дополнительные иконки
const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const ProfileContainer = styled(PageContainer)`
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const ProfileHeader = styled.div`
  position: relative;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  padding: 60px 40px 40px;
  border-radius: 25px 25px 0 0;
  color: white;
  text-align: center;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
    opacity: 0.3;
  }
  
  @media (max-width: 768px) {
    padding: 40px 20px 30px;
  }
`;

const AvatarSection = styled.div`
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
  z-index: 1;
`;

const AvatarOverlay = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: white;
    transform: scale(1.1);
  }
`;

const UserInfo = styled.div`
  position: relative;
  z-index: 1;
  
  h2 {
    margin: 0 0 8px 0;
    font-size: 32px;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  p {
    margin: 0;
    opacity: 0.9;
    font-size: 16px;
  }
  
  @media (max-width: 768px) {
    h2 {
      font-size: 28px;
    }
    
    p {
      font-size: 14px;
    }
  }
`;

const TabsContainer = styled.div`
  display: flex;
  background: white;
  border-radius: 0;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Tab = styled.button`
  flex: 1;
  padding: 20px;
  border: none;
  background: ${props => props.$active ? 'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)' : 'white'};
  color: ${props => props.$active ? 'white' : '#4a5568'};
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
  border-bottom: ${props => props.$active ? 'none' : '1px solid #e2e8f0'};
  
  &:hover:not(:disabled) {
    background: ${props => props.$active ? 
      'linear-gradient(135deg, #dc3522 0%, #ff6b58 100%)' : 
      'linear-gradient(135deg, rgba(220, 53, 34, 0.1) 0%, rgba(255, 107, 88, 0.1) 100%)'
    };
    color: ${props => props.$active ? 'white' : '#dc3522'};
  }
  
  @media (max-width: 768px) {
    padding: 15px;
    font-size: 14px;
  }
`;

const TabContent = styled.div`
  padding: 40px;
  background: white;
  border-radius: 0 0 25px 25px;
  min-height: 400px;
  
  @media (max-width: 768px) {
    padding: 25px 20px;
  }
`;

const ImageGallery = styled(Grid)`
  margin-top: 30px;
`;

const ImageCard = styled(Card)`
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
  }
`;

const ImageWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  
  ${ImageCard}:hover & {
    transform: scale(1.1);
  }
`;

const ImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(220, 53, 34, 0.8) 0%, rgba(255, 107, 88, 0.8) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  ${ImageCard}:hover & {
    opacity: 1;
  }
`;

const UploadArea = styled.div`
  border: 3px dashed #cbd5e0;
  border-radius: 15px;
  padding: 60px 30px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  
  &:hover {
    border-color: #dc3522;
    background: linear-gradient(135deg, rgba(220, 53, 34, 0.05) 0%, rgba(255, 107, 88, 0.05) 100%);
  }
  
  .icon {
    font-size: 48px;
    margin-bottom: 15px;
    opacity: 0.6;
  }
  
  h4 {
    margin: 0 0 8px 0;
    color: #2d3748;
    font-size: 18px;
  }
  
  p {
    margin: 0;
    color: #718096;
    font-size: 14px;
  }
  
  @media (max-width: 768px) {
    padding: 40px 20px;
    
    .icon {
      font-size: 36px;
    }
    
    h4 {
      font-size: 16px;
    }
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const SettingsSection = styled.div`
  margin-bottom: 30px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingsTitle = styled.h4`
  margin: 0 0 15px 0;
  color: #2d3748;
  font-size: 18px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 15px;
  background: #f7fafc;
  border-radius: 10px;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, rgba(220, 53, 34, 0.1) 0%, rgba(255, 107, 88, 0.1) 100%);
  }
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #dc3522;
  }
  
  span {
    font-size: 15px;
    color: #4a5568;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    padding: 12px;
    
    span {
      font-size: 14px;
    }
  }
`;

const DangerZone = styled.div`
  background: linear-gradient(135deg, rgba(245, 101, 101, 0.1) 0%, rgba(229, 62, 62, 0.1) 100%);
  border: 2px solid #fed7d7;
  border-radius: 15px;
  padding: 25px;
  margin-top: 30px;
  
  h4 {
    margin: 0 0 15px 0;
    color: #f56565;
    font-size: 18px;
    font-weight: 600;
  }
  
  p {
    margin: 0 0 20px 0;
    color: #4a5568;
    font-size: 14px;
    line-height: 1.5;
  }
`;

const StatsCard = styled(Card)`
  text-align: center;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  
  .number {
    font-size: 32px;
    font-weight: 700;
    color: #dc3522;
    margin-bottom: 5px;
  }
  
  .label {
    font-size: 14px;
    color: #718096;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    .number {
      font-size: 24px;
    }
    
    .label {
      font-size: 13px;
    }
  }
`;

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const queryClient = useQueryClient();
  const avatarInputRef = useRef();
  const imagesInputRef = useRef();
  
  const currentUser = apiUtils.getCurrentUser();

  // Получение профиля
  const { data: profile, isLoading } = useQuery(
    ['profile', currentUser?.login],
    () => usersAPI.getProfile(currentUser.login),
    {
      enabled: !!currentUser
    }
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
    reset
  } = useForm({
    values: profile
  });

  // Мутации
  const updateProfileMutation = useMutation(usersAPI.updateProfile, {
    onSuccess: () => {
      toast.success('Профиль обновлен!');
      queryClient.invalidateQueries(['profile']);
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const uploadAvatarMutation = useMutation(usersAPI.uploadAvatar, {
    onSuccess: () => {
      toast.success('Аватар обновлен!');
      queryClient.invalidateQueries(['profile']);
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const uploadImageMutation = useMutation(usersAPI.uploadImages, {
    onSuccess: () => {
      toast.success('Фото добавлено!');
      queryClient.invalidateQueries(['profile']);
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const deleteImageMutation = useMutation(usersAPI.deleteImage, {
    onSuccess: () => {
      toast.success('Фото удалено!');
      queryClient.invalidateQueries(['profile']);
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  // Обработчики
  const onSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('avatar', file);
      uploadAvatarMutation.mutate(formData);
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      const formData = new FormData();
      formData.append('image', file);
      uploadImageMutation.mutate(formData);
    });
  };

  const handleDeleteImage = (imageId) => {
    if (window.confirm('Удалить это фото?')) {
      deleteImageMutation.mutate(imageId);
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  if (isLoading) {
    return (
      <ProfileContainer>
        <LoadingSpinner />
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      <ContentCard $maxWidth="1000px" $padding="0">
        <ProfileHeader>
          <AvatarSection>
            <Avatar
              $src={profile?.ava ? `/uploads/${profile.ava}` : ''}
              $size="120px"
              $fontSize="48px"
              $clickable
            >
              {!profile?.ava && profile?.login?.charAt(0).toUpperCase()}
            </Avatar>
            <AvatarOverlay onClick={() => avatarInputRef.current?.click()}>
              <CameraIcon />
            </AvatarOverlay>
            <HiddenInput
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
            />
          </AvatarSection>
          
          <UserInfo>
            <h2>@{profile?.login}</h2>
            <p>{profile?.city} • {profile?.status}</p>
          </UserInfo>
        </ProfileHeader>

        <TabsContainer>
          <Tab
            $active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          >
            <EditIcon />
            Профиль
          </Tab>
          <Tab
            $active={activeTab === 'photos'}
            onClick={() => setActiveTab('photos')}
          >
            <CameraIcon />
            Фотографии
          </Tab>
          <Tab
            $active={activeTab === 'stats'}
            onClick={() => setActiveTab('stats')}
          >
            📊 Статистика
          </Tab>
          <Tab
            $active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Настройки
          </Tab>
        </TabsContainer>

        <TabContent>
          {activeTab === 'profile' && (
            <Form onSubmit={handleSubmit(onSubmit)}>
              <FormGroup>
                <Label>Имя</Label>
                <Input
                  {...register('name')}
                  placeholder="Ваше имя"
                />
              </FormGroup>

              <LocationSelector
                countryValue={watch('country') || ''}
                cityValue={watch('city') || ''}
                onCountryChange={(value) => {
                  setValue('country', value);
                  clearErrors('country');
                  // Сброс города при смене страны
                  if (watch('city')) {
                    setValue('city', '');
                    clearErrors('city');
                  }
                }}
                onCityChange={(value) => {
                  setValue('city', value);
                  clearErrors('city');
                }}
                countryError={errors.country?.message}
                cityError={errors.city?.message}
                required={true}
                showValidation={true}
                layout="side-by-side"
              />
              
              {/* Скрытые поля для react-hook-form валидации */}
              <input
                type="hidden"
                {...register('country')}
              />
              <input
                type="hidden"
                {...register('city', { required: 'Город обязателен' })}
              />

              <FormGroup>
                <Label>О себе</Label>
                <TextArea
                  {...register('info')}
                  placeholder="Расскажите о себе..."
                  $minHeight="120px"
                />
              </FormGroup>

              <FormGroup>
                <Label>Что ищете</Label>
                <TextArea
                  {...register('looking_for')}
                  placeholder="Опишите, кого или что вы ищете..."
                  $minHeight="120px"
                />
              </FormGroup>

              <Button
                type="submit"
                disabled={updateProfileMutation.isLoading}
              >
                {updateProfileMutation.isLoading ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </Form>
          )}

          {activeTab === 'photos' && (
            <div>
              <UploadArea onClick={() => imagesInputRef.current?.click()}>
                <div className="icon">📸</div>
                <h4>Загрузить фотографии</h4>
                <p>Нажмите, чтобы выбрать файлы. Поддерживаются JPG, PNG. Максимум 5MB на файл.</p>
              </UploadArea>
              
              <HiddenInput
                ref={imagesInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />

              <ImageGallery $columns="repeat(auto-fill, minmax(200px, 1fr))" $gap="20px">
                {profile?.images?.map((image, index) => (
                  <ImageCard key={index} onClick={() => handleImageClick(image)}>
                    <ImageWrapper>
                      <Image src={`/uploads/${image}`} alt={`Фото ${index + 1}`} />
                      <ImageOverlay>
                        <IconButton
                          $variant="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(image);
                          }}
                        >
                          <TrashIcon />
                        </IconButton>
                      </ImageOverlay>
                    </ImageWrapper>
                  </ImageCard>
                ))}
              </ImageGallery>
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <Grid $columns="repeat(auto-fit, minmax(150px, 1fr))" $gap="20px">
                <StatsCard>
                  <div className="number">127</div>
                  <div className="label">Просмотры</div>
                </StatsCard>
                <StatsCard>
                  <div className="number">23</div>
                  <div className="label">Лайки</div>
                </StatsCard>
                <StatsCard>
                  <div className="number">5</div>
                  <div className="label">Взаимные</div>
                </StatsCard>
                <StatsCard>
                  <div className="number">12</div>
                  <div className="label">Сообщения</div>
                </StatsCard>
              </Grid>
              
              <p style={{ textAlign: 'center', marginTop: '30px', color: '#718096' }}>
                Статистика за последние 30 дней
              </p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <SettingsSection>
                <SettingsTitle>Уведомления</SettingsTitle>
                <CheckboxGroup>
                  <CheckboxItem>
                    <input
                      type="checkbox"
                      defaultChecked={profile?.email_notifications}
                    />
                    <span>Получать уведомления на email</span>
                  </CheckboxItem>
                  <CheckboxItem>
                    <input
                      type="checkbox"
                      defaultChecked={profile?.push_notifications}
                    />
                    <span>Push-уведомления в браузере</span>
                  </CheckboxItem>
                </CheckboxGroup>
              </SettingsSection>

              <SettingsSection>
                <SettingsTitle>Приватность</SettingsTitle>
                <CheckboxGroup>
                  <CheckboxItem>
                    <input
                      type="checkbox"
                      defaultChecked={profile?.show_online}
                    />
                    <span>Показывать когда я онлайн</span>
                  </CheckboxItem>
                  <CheckboxItem>
                    <input
                      type="checkbox"
                      defaultChecked={profile?.show_distance}
                    />
                    <span>Показывать расстояние до меня</span>
                  </CheckboxItem>
                </CheckboxGroup>
              </SettingsSection>

              <DangerZone>
                <h4>⚠️ Опасная зона</h4>
                <p>
                  Удаление аккаунта приведет к безвозвратной потере всех данных, 
                  включая сообщения, фотографии и настройки.
                </p>
                <Button $variant="danger">
                  Удалить аккаунт
                </Button>
              </DangerZone>
            </div>
          )}
        </TabContent>
      </ContentCard>

      {/* Модальное окно для просмотра изображений */}
      {showImageModal && selectedImage && (
        <Modal onClick={() => setShowImageModal(false)}>
          <ModalContent $maxWidth="800px" onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>Просмотр фотографии</h2>
              <IconButton 
                $variant="secondary" 
                onClick={() => setShowImageModal(false)}
              >
                <CloseIcon />
              </IconButton>
            </ModalHeader>
            <img 
              src={`/uploads/${selectedImage}`} 
              alt="Просмотр" 
              style={{ 
                width: '100%', 
                borderRadius: '15px',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          </ModalContent>
        </Modal>
      )}
    </ProfileContainer>
  );
};

export default Profile;