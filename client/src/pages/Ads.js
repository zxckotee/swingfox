import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { adsAPI, apiUtils, clubsAPI } from '../services/api';
import { LocationSelector, CitySelector } from '../components/Geography';
import {
  PageContainer,
  ContentCard,
  Button,
  Input,
  Select,
  TextArea,
  Form,
  FormGroup,
  Label,
  ErrorText,
  Grid,
  Card,
  Modal,
  ModalContent,
  ModalHeader,
  Avatar,
  FlexContainer,
  LoadingSpinner,
  SearchIcon,
  PlusIcon,
  CloseIcon,
  EditIcon,
  MessageIcon
} from '../components/UI';

// Дополнительные иконки
const FilterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
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

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const AdsContainer = styled(PageContainer)`
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (max-width: 768px) {
    font-size: 28px;
    text-align: center;
  }
`;

const Filters = styled(ContentCard)`
  margin-bottom: 30px;
  padding: 25px;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const FiltersTitle = styled.h3`
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #2d3748;
  font-size: 18px;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const FiltersGrid = styled(Grid)`
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const SearchInputWrapper = styled.div`
  position: relative;
  
  input {
    padding-left: 45px;
  }
  
  .search-icon {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #a0aec0;
    z-index: 1;
  }
`;

const AdsGrid = styled(Grid)`
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const AdCard = styled(Card)`
  overflow: hidden;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
    border-color: #dc3522;
  }
`;

const AdImage = styled.div`
  width: 100%;
  height: 200px;
  background-image: url(${props => props.$src});
  background-size: cover;
  background-position: center;
  background-color: #f7fafc;
  position: relative;
  
  ${props => !props.$src && `
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
    color: #a0aec0;
    font-size: 48px;
  `}
`;

const AdTypeBadge = styled.div`
  position: absolute;
  top: 15px;
  left: 15px;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 15px rgba(220, 53, 34, 0.3);
`;

const AdContent = styled.div`
  padding: 25px;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const AdMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  
  .author {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    color: #dc3522;
    font-size: 14px;
  }
  
  .date {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #718096;
  }
`;

const AdTitle = styled.h3`
  margin: 0 0 12px 0;
  color: #2d3748;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const AdDescription = styled.p`
  color: #4a5568;
  margin: 0 0 20px 0;
  font-size: 15px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  
  @media (max-width: 768px) {
    font-size: 14px;
    -webkit-line-clamp: 2;
  }
`;

const AdActions = styled(FlexContainer)`
  gap: 10px;
  
  .contact-btn {
    flex: 1;
  }
  
  @media (max-width: 576px) {
    flex-direction: column;
    
    .contact-btn {
      width: 100%;
    }
  }
`;

const NoAds = styled.div`
  text-align: center;
  color: #718096;
  padding: 80px 20px;
  
  .icon {
    font-size: 64px;
    margin-bottom: 20px;
    opacity: 0.5;
  }
  
  h3 {
    margin: 0 0 15px 0;
    font-size: 24px;
    color: #2d3748;
  }
  
  p {
    margin: 0 0 30px 0;
    font-size: 16px;
    line-height: 1.5;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
  
  @media (max-width: 768px) {
    padding: 60px 20px;
    
    .icon {
      font-size: 48px;
    }
    
    h3 {
      font-size: 20px;
    }
    
    p {
      font-size: 14px;
    }
  }
`;

const StatsCard = styled(Card)`
  text-align: center;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  padding: 20px;
  
  .number {
    font-size: 28px;
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
    padding: 15px;
    
    .number {
      font-size: 24px;
    }
    
    .label {
      font-size: 13px;
    }
  }
`;

// Компонент для загрузки изображения
const ImageUpload = ({ image, onImageChange, error }) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(image ? `/uploads/${image}` : null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Создаем превью
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
      
      onImageChange(file);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <FormGroup>
      <Label>Изображение объявления</Label>
      <div style={{ marginBottom: '10px' }}>
        {preview && (
          <div style={{ 
            position: 'relative', 
            display: 'inline-block',
            marginBottom: '10px'
          }}>
            <img 
              src={preview} 
              alt="Превью" 
              style={{ 
                maxWidth: '200px', 
                maxHeight: '200px', 
                borderRadius: '8px',
                border: '2px solid #e2e8f0'
              }} 
            />
            <Button
              type="button"
              $variant="danger"
              $size="small"
              onClick={handleRemoveImage}
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                padding: '0',
                fontSize: '12px'
              }}
            >
              ×
            </Button>
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      <Button
        type="button"
        $variant="secondary"
        onClick={() => fileInputRef.current?.click()}
        style={{ width: '100%' }}
      >
        {preview ? 'Изменить изображение' : 'Выбрать изображение'}
      </Button>
      
      {error && <ErrorText>{error}</ErrorText>}
      
      <div style={{ 
        fontSize: '12px', 
        color: '#718096', 
        marginTop: '5px' 
      }}>
        Поддерживаемые форматы: JPEG, PNG, WebP. Максимальный размер: 5MB.
      </div>
    </FormGroup>
  );
};

const Ads = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    country: '',
    city: ''
  });
  
  const queryClient = useQueryClient();
  const currentUser = apiUtils.getCurrentUser();

  // Проверка владения клубом
  const { data: clubOwnership } = useQuery(
    ['club-ownership'],
    clubsAPI.checkClubOwnership,
    {
      retry: false,
      onError: () => {
        // Пользователь не владеет клубом
      }
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
    defaultValues: {
      country: '',
      city: ''
    }
  });

  // Валидация изображения
  const validateImage = (file) => {
    if (!file) return true;
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (file.size > maxSize) {
      return 'Размер файла не должен превышать 5MB';
    }
    
    if (!allowedTypes.includes(file.type)) {
      return 'Поддерживаются только форматы: JPEG, PNG, WebP';
    }
    
    return true;
  };

  // Получение объявлений
  const { data: adsResponse, isLoading } = useQuery(
    ['ads', filters],
    () => adsAPI.getAds(filters),
    {
      keepPreviousData: true
    }
  );

  // Извлекаем массив объявлений и трансформируем данные
  const ads = useMemo(() => {
    if (!adsResponse?.ads) return [];
    
    return adsResponse.ads.map(ad => ({
      ...ad,
      // Трансформируем поля для соответствия ожиданиям компонента
      author: ad.author?.login || ad.author,
      author_avatar: ad.author?.ava || null,
      title: ad.title || ad.description, // Используем title если есть, иначе description
      created_at: ad.created_at
    }));
  }, [adsResponse]);

  // Мутации
  const createAdMutation = useMutation(adsAPI.createAd, {
    onSuccess: () => {
      toast.success('Объявление создано!');
      setShowModal(false);
      reset();
      queryClient.invalidateQueries('ads');
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  const updateAdMutation = useMutation(
    ({ id, data }) => adsAPI.updateAd(id, data),
    {
      onSuccess: () => {
        toast.success('Объявление обновлено!');
        setShowModal(false);
        setEditingAd(null);
        reset();
        queryClient.invalidateQueries('ads');
      },
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      }
    }
  );

  const deleteAdMutation = useMutation(adsAPI.deleteAd, {
    onSuccess: () => {
      toast.success('Объявление удалено!');
      queryClient.invalidateQueries('ads');
    },
    onError: (error) => {
      toast.error(apiUtils.handleError(error));
    }
  });

  // Обработчики
  const onSubmit = (data) => {
    // Валидируем изображение
    const imageValidation = validateImage(selectedImage);
    if (imageValidation !== true) {
      toast.error(imageValidation);
      return;
    }

    // Добавляем изображение к данным
    const formData = {
      ...data,
      image: selectedImage
    };

    if (editingAd) {
      updateAdMutation.mutate({ id: editingAd.id, data: formData });
    } else {
      createAdMutation.mutate(formData);
    }
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setSelectedImage(null); // Сбрасываем выбранное изображение
    reset(ad);
    setShowModal(true);
  };

  const handleDelete = (adId) => {
    if (window.confirm('Удалить объявление?')) {
      deleteAdMutation.mutate(adId);
    }
  };

  const handleContact = (authorLogin) => {
    window.open(`/chat/${authorLogin}`, '_blank');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAd(null);
    setSelectedImage(null);
    reset();
  };

  const handleImageChange = (file) => {
    setSelectedImage(file);
  };

  // Фильтрация типов объявлений на основе прав пользователя
  const adTypes = useMemo(() => {
    const baseTypes = [
      { value: 'Встречи', label: 'Встречи', icon: '👥' },
      { value: 'Знакомства', label: 'Знакомства', icon: '💕' },
      { value: 'Вечеринки', label: 'Вечеринки', icon: '🎉' },
      { value: 'Общение', label: 'Общение', icon: '💬' }
    ];
    
    // Добавляем "Мероприятия" только если пользователь владеет активным клубом
    if (clubOwnership?.hasActiveClub) {
      baseTypes.push({ value: 'Мероприятия', label: 'Мероприятия', icon: '🎪' });
    }
    
    // Добавляем "Все" в конец
    baseTypes.push({ value: 'Все', label: 'Все', icon: '📋' });
    
    return baseTypes;
  }, [clubOwnership]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTypeIcon = (type) => {
    return adTypes.find(t => t.value === type)?.icon || '📋';
  };

  const getTypeLabel = (type) => {
    return adTypes.find(t => t.value === type)?.label || 'Другое';
  };

  // Статистика
  const stats = {
    total: ads.length,
    myAds: ads.filter(ad => ad.author === currentUser?.login).length,
    parties: ads.filter(ad => ad.type === 'Вечеринки').length,
    meetings: ads.filter(ad => ad.type === 'Встречи').length
  };

  if (isLoading) {
    return (
      <AdsContainer>
        <LoadingSpinner />
      </AdsContainer>
    );
  }

  return (
    <AdsContainer>
      <ContentCard $maxWidth="1200px">
        <Header>
          <HeaderContent>
            <Title>Объявления</Title>
            <Button onClick={() => setShowModal(true)}>
              <PlusIcon />
              Создать объявление
            </Button>
          </HeaderContent>

          {/* Статистика */}
          <Grid $columns="repeat(auto-fit, minmax(120px, 1fr))" $gap="15px" style={{ marginBottom: '20px' }}>
            <StatsCard>
              <div className="number">{stats.total}</div>
              <div className="label">Всего</div>
            </StatsCard>
            <StatsCard>
              <div className="number">{stats.myAds}</div>
              <div className="label">Мои</div>
            </StatsCard>
            <StatsCard>
              <div className="number">{stats.parties}</div>
              <div className="label">Вечеринки</div>
            </StatsCard>
            <StatsCard>
              <div className="number">{stats.meetings}</div>
              <div className="label">Встречи</div>
            </StatsCard>
          </Grid>
        </Header>

        <Filters>
          <FiltersTitle>
            <FilterIcon />
            Фильтры
          </FiltersTitle>
          <FiltersGrid>
            <FormGroup>
              <Label>Тип объявления</Label>
              <Select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="">Все типы</option>
                {adTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Поиск по локации</Label>
              <LocationSelector
                countryValue={filters.country}
                cityValue={filters.city}
                onCountryChange={(value) => {
                  setFilters(prev => ({ ...prev, country: value }));
                  // Сброс города при смене страны
                  if (filters.city) {
                    setFilters(prev => ({ ...prev, city: '' }));
                  }
                }}
                onCityChange={(value) => {
                  setFilters(prev => ({ ...prev, city: value }));
                }}
                required={false}
                showValidation={false}
                layout="side-by-side"
                countryPlaceholder="Все страны"
                cityPlaceholder="Все города"
              />
            </FormGroup>
          </FiltersGrid>
        </Filters>

        {ads.length > 0 ? (
          <AdsGrid>
            {ads.map(ad => (
              <AdCard key={ad.id}>
                <AdImage $src={ad.image ? `/uploads/${ad.image}` : ''}>
                  {!ad.image && '📸'}
                  <AdTypeBadge>
                    {getTypeIcon(ad.type)} {getTypeLabel(ad.type)}
                  </AdTypeBadge>
                </AdImage>
                
                <AdContent>
                  <AdMeta>
                    <div className="author">
                      <Avatar 
                        $size="24px" 
                        $fontSize="12px"
                        $src={ad.author_avatar ? `/uploads/${ad.author_avatar}` : ''}
                      >
                        {!ad.author_avatar && ad.author.charAt(0).toUpperCase()}
                      </Avatar>
                      @{ad.author}
                    </div>
                    <div className="date">
                      <CalendarIcon />
                      {formatDate(ad.created_at)}
                    </div>
                  </AdMeta>
                  
                  <AdTitle>{ad.title}</AdTitle>
                  <AdDescription>{ad.description}</AdDescription>
                  
                  <AdActions>
                    {ad.author !== currentUser?.login ? (
                      <Button 
                        className="contact-btn"
                        onClick={() => handleContact(ad.author)}
                      >
                        <MessageIcon />
                        Написать
                      </Button>
                    ) : (
                      <>
                        <Button 
                          $variant="secondary"
                          onClick={() => handleEdit(ad)}
                          style={{ flex: 1 }}
                        >
                          <EditIcon />
                          Изменить
                        </Button>
                        <Button 
                          $variant="danger"
                          onClick={() => handleDelete(ad.id)}
                          style={{ flex: 1 }}
                        >
                          <TrashIcon />
                          Удалить
                        </Button>
                      </>
                    )}
                  </AdActions>
                </AdContent>
              </AdCard>
            ))}
          </AdsGrid>
        ) : (
          <NoAds>
            <div className="icon">📢</div>
            <h3>Объявлений пока нет</h3>
            <p>
              {filters.type || filters.city 
                ? 'По вашим фильтрам ничего не найдено. Попробуйте изменить параметры поиска.'
                : 'Станьте первым, кто разместит объявление и найдет интересных людей!'
              }
            </p>
            {!filters.type && !filters.city && (
              <Button onClick={() => setShowModal(true)}>
                <PlusIcon />
                Создать первое объявление
              </Button>
            )}
          </NoAds>
        )}
      </ContentCard>

      {/* Модальное окно создания/редактирования */}
      {showModal && (
        <Modal onClick={handleCloseModal}>
          <ModalContent $maxWidth="600px" onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>{editingAd ? 'Редактировать объявление' : 'Новое объявление'}</h2>
              <Button $variant="secondary" $size="small" onClick={handleCloseModal}>
                <CloseIcon />
              </Button>
            </ModalHeader>

            <Form onSubmit={handleSubmit(onSubmit)}>
              <FormGroup>
                <Label>Заголовок <span className="required">*</span></Label>
                <Input
                  {...register('title', { 
                    required: 'Заголовок обязателен',
                    minLength: { value: 5, message: 'Заголовок должен содержать минимум 5 символов' },
                    maxLength: { value: 200, message: 'Заголовок не должен превышать 200 символов' }
                  })}
                  className={errors.title ? 'error' : ''}
                  placeholder="Введите заголовок объявления"
                />
                {errors.title && <ErrorText>{errors.title.message}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label>Тип объявления <span className="required">*</span></Label>
                <Select
                  {...register('type', { required: 'Выберите тип' })}
                  className={errors.type ? 'error' : ''}
                >
                  <option value="">Выберите тип</option>
                  {adTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </Select>
                {errors.type && <ErrorText>{errors.type.message}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label>Описание <span className="required">*</span></Label>
                <TextArea
                  {...register('description', { 
                    required: 'Описание обязательно',
                    minLength: { value: 20, message: 'Описание должно содержать минимум 20 символов' },
                    maxLength: { value: 5000, message: 'Описание не должно превышать 5000 символов' }
                  })}
                  className={errors.description ? 'error' : ''}
                  placeholder="Подробно опишите ваше объявление..."
                  $minHeight="120px"
                />
                {errors.description && <ErrorText>{errors.description.message}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label>Цена (необязательно)</Label>
                <Input
                  {...register('price', {
                    min: { value: 0, message: 'Цена не может быть отрицательной' },
                    pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Введите корректную цену (например: 100 или 100.50)' }
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={errors.price ? 'error' : ''}
                />
                {errors.price && <ErrorText>{errors.price.message}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label>Контактная информация (необязательно)</Label>
                <TextArea
                  {...register('contact_info', {
                    maxLength: { value: 1000, message: 'Контактная информация не должна превышать 1000 символов' }
                  })}
                  placeholder="Телефон, email или другие способы связи..."
                  $minHeight="80px"
                  className={errors.contact_info ? 'error' : ''}
                />
                {errors.contact_info && <ErrorText>{errors.contact_info.message}</ErrorText>}
              </FormGroup>

              <LocationSelector
                countryValue={watch('country')}
                cityValue={watch('city')}
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
              
              {/* Отображение ошибок для полей страны и города */}
              {errors.country && <ErrorText style={{ marginTop: '-15px', marginBottom: '15px' }}>{errors.country.message}</ErrorText>}
              {errors.city && <ErrorText style={{ marginTop: '-15px', marginBottom: '15px' }}>{errors.city.message}</ErrorText>}
              
              {/* Скрытые поля для react-hook-form валидации */}
              <input
                type="hidden"
                {...register('country', { required: 'Страна обязательна' })}
              />
              <input
                type="hidden"
                {...register('city', { required: 'Город обязателен' })}
              />

              {/* Компонент загрузки изображения */}
              <ImageUpload
                image={editingAd?.image}
                onImageChange={handleImageChange}
                error={errors.image?.message}
              />

              <FlexContainer $gap="15px" style={{ marginTop: '30px' }}>
                <Button
                  type="submit"
                  disabled={createAdMutation.isLoading || updateAdMutation.isLoading}
                  style={{ flex: 1 }}
                >
                  {editingAd 
                    ? (updateAdMutation.isLoading ? 'Сохранение...' : 'Сохранить изменения') 
                    : (createAdMutation.isLoading ? 'Создание...' : 'Создать объявление')
                  }
                </Button>
                <Button $variant="secondary" type="button" onClick={handleCloseModal}>
                  Отмена
                </Button>
              </FlexContainer>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </AdsContainer>
  );
};

export default Ads;