import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { reactionsAPI } from '../services/api';

const ReactionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ReactionsBar = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ReactionButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 2px solid ${props => props.$isActive ? props.$activeColor : '#e2e8f0'};
  border-radius: 20px;
  background: ${props => props.$isActive ? props.$activeColor : 'white'};
  color: ${props => props.$isActive ? 'white' : props.$textColor};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  .emoji {
    font-size: 16px;
  }
  
  .count {
    font-size: 12px;
    opacity: 0.9;
  }
`;

const ReactionsStats = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #718096;
    padding: 4px 8px;
    background: #f7fafc;
    border-radius: 12px;
    
    .emoji {
      font-size: 14px;
    }
  }
`;

const ReactionsModal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ReactionsModalContent = styled.div`
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ReactionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin: 20px 0;
`;

const ReactionOption = styled(motion.button)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 15px;
  border: 2px solid #e2e8f0;
  border-radius: 15px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.$color};
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
  
  .emoji {
    font-size: 32px;
  }
  
  .label {
    font-size: 12px;
    font-weight: 600;
    color: #4a5568;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #718096;
  
  &:hover {
    color: #2d3748;
  }
`;

// Конфигурация реакций
const REACTION_CONFIG = {
  like: {
    emoji: '👍',
    label: 'Нравится',
    color: '#4caf50',
    textColor: '#4caf50'
  },
  love: {
    emoji: '❤️',
    label: 'Любовь',
    color: '#e91e63',
    textColor: '#e91e63'
  },
  laugh: {
    emoji: '😂',
    label: 'Смех',
    color: '#ff9800',
    textColor: '#ff9800'
  },
  wow: {
    emoji: '😮',
    label: 'Удивление',
    color: '#9c27b0',
    textColor: '#9c27b0'
  },
  sad: {
    emoji: '😢',
    label: 'Грусть',
    color: '#2196f3',
    textColor: '#2196f3'
  },
  angry: {
    emoji: '😠',
    label: 'Гнев',
    color: '#f44336',
    textColor: '#f44336'
  }
};

const Reactions = ({ objectType, objectId, currentUser, showStats = true }) => {
  // Проверяем, что все необходимые параметры переданы
  if (!objectType || !objectId) {
    return (
      <ReactionsContainer>
        <div style={{ textAlign: 'center', padding: '10px', color: '#718096', fontSize: '14px' }}>
          Ошибка: не указаны параметры для реакций
        </div>
      </ReactionsContainer>
    );
  }
  const [showModal, setShowModal] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(null);
  const queryClient = useQueryClient();

  // Получение реакций
  const { data: reactionsData, isLoading } = useQuery(
    ['reactions', objectType, objectId],
    () => reactionsAPI.getObjectReactions(objectType, objectId),
    {
      enabled: !!(objectType && objectId), // Запрос выполняется только если есть objectType и objectId
      onError: (error) => {
        console.error('Error fetching reactions:', error);
      }
    }
  );

  // Мутации
  const setReactionMutation = useMutation(
    (data) => reactionsAPI.setReaction(objectType, objectId, data.reactionType, data.value),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reactions', objectType, objectId]);
        toast.success('Реакция добавлена');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Ошибка при установке реакции');
      }
    }
  );

  const removeReactionMutation = useMutation(
    () => reactionsAPI.removeReaction(objectType, objectId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reactions', objectType, objectId]);
        toast.success('Реакция удалена');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Ошибка при удалении реакции');
      }
    }
  );

  // Обработчики
  const handleReactionClick = (reactionType) => {
    if (!currentUser) {
      toast.error('Войдите в систему, чтобы оставить реакцию');
      return;
    }

    const userReaction = reactionsData?.user_reaction;
    
    if (userReaction && userReaction.type === reactionType) {
      // Если нажимаем на ту же реакцию - удаляем её
      removeReactionMutation.mutate();
    } else {
      // Иначе устанавливаем новую реакцию
      setReactionMutation.mutate({
        reactionType,
        value: 1
      });
    }
    
    setShowModal(false);
  };

  const openReactionsModal = () => {
    if (!currentUser) {
      toast.error('Войдите в систему, чтобы оставить реакцию');
      return;
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  if (isLoading) {
    return <ReactionsContainer>Загрузка реакций...</ReactionsContainer>;
  }

  const reactions = reactionsData?.reactions || {};
  const userReaction = reactionsData?.user_reaction;
  const totalReactions = reactions.total || 0;

  // Получаем топ-3 реакции для отображения
  const topReactions = Object.entries(reactions)
    .filter(([key, value]) => key !== 'total' && key !== 'users' && value > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <ReactionsContainer>
      {/* Основная панель реакций */}
      <ReactionsBar>
        {/* Кнопка для открытия модала с реакциями */}
        <ReactionButton
          onClick={openReactionsModal}
          $isActive={!!userReaction}
          $activeColor={userReaction ? REACTION_CONFIG[userReaction.type]?.color : '#e2e8f0'}
          $textColor={userReaction ? 'white' : '#4a5568'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="emoji">
            {userReaction ? REACTION_CONFIG[userReaction.type]?.emoji : '😊'}
          </span>
          <span className="label">
            {userReaction ? REACTION_CONFIG[userReaction.type]?.label : 'Реагировать'}
          </span>
          {totalReactions > 0 && (
            <span className="count">{totalReactions}</span>
          )}
        </ReactionButton>

        {/* Быстрые реакции (топ-3) */}
        {topReactions.map(([reactionType, count]) => (
          <ReactionButton
            key={reactionType}
            onClick={() => handleReactionClick(reactionType)}
            $isActive={userReaction?.type === reactionType}
            $activeColor={REACTION_CONFIG[reactionType]?.color}
            $textColor={REACTION_CONFIG[reactionType]?.textColor}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="emoji">{REACTION_CONFIG[reactionType]?.emoji}</span>
            <span className="count">{count}</span>
          </ReactionButton>
        ))}
      </ReactionsBar>

      {/* Статистика реакций */}
      {showStats && totalReactions > 0 && (
        <ReactionsStats>
          {Object.entries(reactions).map(([reactionType, count]) => {
            if (reactionType === 'total' || reactionType === 'users' || count === 0) return null;
            
            return (
              <div key={reactionType} className="stat-item">
                <span className="emoji">{REACTION_CONFIG[reactionType]?.emoji}</span>
                <span>{count}</span>
              </div>
            );
          })}
        </ReactionsStats>
      )}

      {/* Модал выбора реакции */}
      <AnimatePresence>
        {showModal && (
          <ReactionsModal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <ReactionsModalContent onClick={(e) => e.stopPropagation()}>
              <CloseButton onClick={closeModal}>&times;</CloseButton>
              
              <h3 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>
                Выберите реакцию
              </h3>
              
              <ReactionsGrid>
                {Object.entries(REACTION_CONFIG).map(([type, config]) => (
                  <ReactionOption
                    key={type}
                    onClick={() => handleReactionClick(type)}
                    $color={config.color}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="emoji">{config.emoji}</div>
                    <div className="label">{config.label}</div>
                  </ReactionOption>
                ))}
              </ReactionsGrid>
              
              <p style={{ margin: '20px 0 0 0', fontSize: '14px', color: '#718096' }}>
                Нажмите на реакцию, чтобы поставить её
              </p>
            </ReactionsModalContent>
          </ReactionsModal>
        )}
      </AnimatePresence>
    </ReactionsContainer>
  );
};

export default Reactions;
