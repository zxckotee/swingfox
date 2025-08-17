import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { adsAPI, apiUtils } from '../services/api';

const AdsContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.lg};
`;

const Header = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.primary};
  margin: 0;
`;

const Button = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius};
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primaryDark};
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: ${props => props.theme.colors.border};
    cursor: not-allowed;
  }
  
  &.secondary {
    background: transparent;
    color: ${props => props.theme.colors.primary};
    border: 1px solid ${props => props.theme.colors.primary};
    
    &:hover {
      background: ${props => props.theme.colors.primary};
      color: white;
    }
  }
  
  &.danger {
    background: ${props => props.theme.colors.error};
    
    &:hover {
      background: #d32f2f;
    }
  }
`;

const AdsGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${props => props.theme.spacing.lg};
`;

const AdCard = styled.div`
  background: white;
  border-radius: ${props => props.theme.borderRadius};
  overflow: hidden;
  box-shadow: ${props => props.theme.shadow};
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const AdImage = styled.div`
  width: 100%;
  height: 200px;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  background-color: ${props => props.theme.colors.border};
  position: relative;
  
  .ad-type {
    position: absolute;
    top: ${props => props.theme.spacing.sm};
    left: ${props => props.theme.spacing.sm};
    background: ${props => props.theme.colors.primary};
    color: white;
    padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
    border-radius: 12px;
    font-size: ${props => props.theme.fonts.sizes.small};
    font-weight: bold;
  }
`;

const AdContent = styled.div`
  padding: ${props => props.theme.spacing.md};
`;

const AdTitle = styled.h3`
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.fonts.sizes.large};
`;

const AdDescription = styled.p`
  color: ${props => props.theme.colors.textLight};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  font-size: ${props => props.theme.fonts.sizes.medium};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const AdMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${props => props.theme.fonts.sizes.small};
  color: ${props => props.theme.colors.textLight};
  margin-bottom: ${props => props.theme.spacing.sm};
  
  .author {
    font-weight: bold;
    color: ${props => props.theme.colors.primary};
  }
  
  .date {
    font-style: italic;
  }
`;

const AdActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  
  .contact-btn {
    flex: 1;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${props => props.theme.spacing.md};
`;

const ModalContent = styled.div`
  background: white;
  border-radius: ${props => props.theme.borderRadius};
  padding: ${props => props.theme.spacing.xl};
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
  
  h2 {
    margin: 0;
    color: ${props => props.theme.colors.primary};
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: ${props => props.theme.colors.textLight};
  }
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

const Select = styled.select`
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  font-size: ${props => props.theme.fonts.sizes.medium};
  background: white;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
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

const ErrorText = styled.span`
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.fonts.sizes.small};
`;

const Filters = styled.div`
  max-width: 1200px;
  margin: 0 auto ${props => props.theme.spacing.lg} auto;
  background: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius};
  box-shadow: ${props => props.theme.shadow};
  display: flex;
  gap: ${props => props.theme.spacing.md};
  align-items: center;
  flex-wrap: wrap;
`;

const NoAds = styled.div`
  text-align: center;
  color: ${props => props.theme.colors.textLight};
  padding: ${props => props.theme.spacing.xl};
  
  h3 {
    margin-bottom: ${props => props.theme.spacing.md};
  }
`;

const Ads = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    city: ''
  });
  
  const queryClient = useQueryClient();
  const currentUser = apiUtils.getCurrentUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  // Получение объявлений
  const { data: ads = [], isLoading } = useQuery(
    ['ads', filters],
    () => adsAPI.getAds(filters),
    {
      keepPreviousData: true
    }
  );

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
    if (editingAd) {
      updateAdMutation.mutate({ id: editingAd.id, data });
    } else {
      createAdMutation.mutate(data);
    }
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    reset(ad);
    setShowModal(true);
  };

  const handleDelete = (adId) => {
    if (window.confirm('Удалить объявление?')) {
      deleteAdMutation.mutate(adId);
    }
  };

  const handleContact = (authorLogin) => {
    // Переход к чату с автором объявления
    window.open(`/chat/${authorLogin}`, '_blank');
  };

  const adTypes = [
    { value: 'party', label: 'Вечеринка' },
    { value: 'meeting', label: 'Встреча' },
    { value: 'event', label: 'Мероприятие' },
    { value: 'service', label: 'Услуга' },
    { value: 'other', label: 'Другое' }
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <AdsContainer>
      <Header>
        <Title>Объявления</Title>
        <Button onClick={() => setShowModal(true)}>
          Создать объявление
        </Button>
      </Header>

      <Filters>
        <Select
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
        >
          <option value="">Все типы</option>
          {adTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>

        <Input
          type="text"
          placeholder="Поиск по городу..."
          value={filters.city}
          onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
        />
      </Filters>

      {isLoading ? (
        <div className="loading">Загрузка объявлений...</div>
      ) : ads.length > 0 ? (
        <AdsGrid>
          {ads.map(ad => (
            <AdCard key={ad.id}>
              <AdImage src={ad.image ? `/uploads/${ad.image}` : ''}>
                <div className="ad-type">
                  {adTypes.find(t => t.value === ad.type)?.label}
                </div>
              </AdImage>
              
              <AdContent>
                <AdMeta>
                  <span className="author">@{ad.author}</span>
                  <span className="date">{formatDate(ad.created_at)}</span>
                </AdMeta>
                
                <AdTitle>{ad.title}</AdTitle>
                <AdDescription>{ad.description}</AdDescription>
                
                <AdActions>
                  {ad.author !== currentUser?.login ? (
                    <Button 
                      className="contact-btn"
                      onClick={() => handleContact(ad.author)}
                    >
                      Написать
                    </Button>
                  ) : (
                    <>
                      <Button 
                        className="secondary"
                        onClick={() => handleEdit(ad)}
                      >
                        Редактировать
                      </Button>
                      <Button 
                        className="danger"
                        onClick={() => handleDelete(ad.id)}
                      >
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
          <h3>Объявлений пока нет</h3>
          <p>Станьте первым, кто разместит объявление!</p>
        </NoAds>
      )}

      {showModal && (
        <Modal onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowModal(false);
            setEditingAd(null);
            reset();
          }
        }}>
          <ModalContent>
            <ModalHeader>
              <h2>{editingAd ? 'Редактировать объявление' : 'Новое объявление'}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  setEditingAd(null);
                  reset();
                }}
              >
                ×
              </button>
            </ModalHeader>

            <Form onSubmit={handleSubmit(onSubmit)}>
              <FormGroup>
                <Label>Заголовок</Label>
                <Input
                  {...register('title', { required: 'Заголовок обязателен' })}
                  className={errors.title ? 'error' : ''}
                  placeholder="Введите заголовок объявления"
                />
                {errors.title && <ErrorText>{errors.title.message}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label>Тип объявления</Label>
                <Select
                  {...register('type', { required: 'Выберите тип' })}
                  className={errors.type ? 'error' : ''}
                >
                  <option value="">Выберите тип</option>
                  {adTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
                {errors.type && <ErrorText>{errors.type.message}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label>Описание</Label>
                <TextArea
                  {...register('description', { required: 'Описание обязательно' })}
                  className={errors.description ? 'error' : ''}
                  placeholder="Подробно опишите ваше объявление..."
                />
                {errors.description && <ErrorText>{errors.description.message}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label>Город</Label>
                <Input
                  {...register('city', { required: 'Город обязателен' })}
                  className={errors.city ? 'error' : ''}
                  placeholder="В каком городе?"
                />
                {errors.city && <ErrorText>{errors.city.message}</ErrorText>}
              </FormGroup>

              <Button
                type="submit"
                disabled={createAdMutation.isLoading || updateAdMutation.isLoading}
              >
                {editingAd 
                  ? (updateAdMutation.isLoading ? 'Сохранение...' : 'Сохранить') 
                  : (createAdMutation.isLoading ? 'Создание...' : 'Создать объявление')
                }
              </Button>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </AdsContainer>
  );
};

export default Ads;