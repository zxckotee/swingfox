import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { usersAPI, apiUtils } from '../services/api';

const ProfileContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.lg};
`;

const ProfileCard = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: ${props => props.theme.borderRadius};
  overflow: hidden;
  box-shadow: ${props => props.theme.shadow};
`;

const ProfileHeader = styled.div`
  position: relative;
  padding: ${props => props.theme.spacing.xl};
  background: linear-gradient(135deg, ${props => props.theme.colors.primary}, ${props => props.theme.colors.primaryDark});
  color: white;
  text-align: center;
`;

const AvatarSection = styled.div`
  position: relative;
  display: inline-block;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  background-color: rgba(255,255,255,0.2);
  border: 4px solid white;
  position: relative;
  cursor: pointer;
  
  &::after {
    content: '📷';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 30px;
    height: 30px;
    background: ${props => props.theme.colors.primary};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    border: 2px solid white;
  }
`;

const UserInfo = styled.div`
  h2 {
    margin: 0 0 ${props => props.theme.spacing.xs} 0;
    font-size: ${props => props.theme.fonts.sizes.xlarge};
  }
  
  p {
    margin: 0;
    opacity: 0.9;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const Tab = styled.button`
  flex: 1;
  padding: ${props => props.theme.spacing.md};
  border: none;
  background: none;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  
  &.active {
    color: ${props => props.theme.colors.primary};
    border-bottom: 2px solid ${props => props.theme.colors.primary};
  }
  
  &:hover {
    background: ${props => props.theme.colors.background};
  }
`;

const TabContent = styled.div`
  padding: ${props => props.theme.spacing.xl};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  font-weight: bold;
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.fonts.sizes.small};
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  font-size: ${props => props.theme.fonts.sizes.medium};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
  
  &.error {
    border-color: ${props => props.theme.colors.error};
  }
`;

const TextArea = styled.textarea`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  font-size: ${props => props.theme.fonts.sizes.medium};
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Button = styled.button`
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius};
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primaryDark};
  }
  
  &:disabled {
    background: ${props => props.theme.colors.border};
    cursor: not-allowed;
  }
  
  &.danger {
    background: ${props => props.theme.colors.error};
    
    &:hover:not(:disabled) {
      background: #d32f2f;
    }
  }
`;

const ErrorText = styled.span`
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.fonts.sizes.small};
`;

const ImageGallery = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
`;

const ImageItem = styled.div`
  position: relative;
  aspect-ratio: 1;
  border-radius: ${props => props.theme.borderRadius};
  overflow: hidden;
  background: ${props => props.theme.colors.border};
  cursor: pointer;
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  ${ImageItem}:hover & {
    opacity: 1;
  }
`;

const DeleteButton = styled.button`
  background: ${props => props.theme.colors.error};
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 16px;
`;

const UploadArea = styled.div`
  border: 2px dashed ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.primary}05;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
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

  if (isLoading) {
    return <div className="loading">Загрузка профиля...</div>;
  }

  return (
    <ProfileContainer>
      <ProfileCard>
        <ProfileHeader>
          <AvatarSection>
            <Avatar
              src={profile?.ava ? `/uploads/${profile.ava}` : ''}
              onClick={() => avatarInputRef.current?.click()}
            />
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
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            Профиль
          </Tab>
          <Tab
            className={activeTab === 'photos' ? 'active' : ''}
            onClick={() => setActiveTab('photos')}
          >
            Фотографии
          </Tab>
          <Tab
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            Настройки
          </Tab>
        </TabsContainer>

        <TabContent>
          {activeTab === 'profile' && (
            <Form onSubmit={handleSubmit(onSubmit)}>
              <FormRow>
                <FormGroup>
                  <Label>Имя</Label>
                  <Input
                    {...register('name')}
                    placeholder="Ваше имя"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Город</Label>
                  <Input
                    {...register('city', { required: 'Город обязателен' })}
                    className={errors.city ? 'error' : ''}
                  />
                  {errors.city && <ErrorText>{errors.city.message}</ErrorText>}
                </FormGroup>
              </FormRow>

              <FormGroup>
                <Label>О себе</Label>
                <TextArea
                  {...register('info')}
                  placeholder="Расскажите о себе..."
                />
              </FormGroup>

              <FormGroup>
                <Label>Что ищете</Label>
                <TextArea
                  {...register('looking_for')}
                  placeholder="Опишите, кого или что вы ищете..."
                />
              </FormGroup>

              <Button
                type="submit"
                disabled={updateProfileMutation.isLoading}
              >
                {updateProfileMutation.isLoading ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </Form>
          )}

          {activeTab === 'photos' && (
            <div>
              <UploadArea onClick={() => imagesInputRef.current?.click()}>
                <p>📸 Нажмите, чтобы загрузить фотографии</p>
                <small>Поддерживаются JPG, PNG. Максимум 5MB на файл.</small>
              </UploadArea>
              
              <HiddenInput
                ref={imagesInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />

              <ImageGallery>
                {profile?.images?.map((image, index) => (
                  <ImageItem key={index}>
                    <Image src={`/uploads/${image}`} alt={`Фото ${index + 1}`} />
                    <ImageOverlay>
                      <DeleteButton onClick={() => handleDeleteImage(image)}>
                        ×
                      </DeleteButton>
                    </ImageOverlay>
                  </ImageItem>
                ))}
              </ImageGallery>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <FormGroup>
                <Label>Email уведомления</Label>
                <label>
                  <input
                    type="checkbox"
                    defaultChecked={profile?.email_notifications}
                  />
                  Получать уведомления на email
                </label>
              </FormGroup>

              <FormGroup>
                <Label>Приватность</Label>
                <label>
                  <input
                    type="checkbox"
                    defaultChecked={profile?.show_online}
                  />
                  Показывать когда я онлайн
                </label>
              </FormGroup>

              <FormGroup>
                <Label>Опасная зона</Label>
                <Button className="danger">
                  Удалить аккаунт
                </Button>
              </FormGroup>
            </div>
          )}
        </TabContent>
      </ProfileCard>
    </ProfileContainer>
  );
};

export default Profile;