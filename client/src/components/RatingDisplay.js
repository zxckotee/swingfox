import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ratingAPI } from '../services/api';
import { StarIcon, ThumbsUpIcon, ThumbsDownIcon } from './UI';

const RatingContainer = styled.div`
  background: white;
  border-radius: 15px;
  padding: 20px;
  margin: 15px 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }
`;

const RatingHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  
  .title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: #2d3748;
  }
  
  .total-rating {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 24px;
    font-weight: 700;
    color: #dc3522;
  }
`;

const RatingStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  
  .stat {
    text-align: center;
    padding: 10px;
    background: #f7fafc;
    border-radius: 10px;
    
    .value {
      font-size: 20px;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 5px;
    }
    
    .label {
      font-size: 12px;
      color: #718096;
      text-transform: uppercase;
      font-weight: 600;
    }
  }
`;

const VotingButtons = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  
  .vote-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &.positive {
      background: ${props => props.$userVote === 1 ? '#4caf50' : 'linear-gradient(135deg, #e8f5e8 0%, #f0f9f0 100%)'};
      color: ${props => props.$userVote === 1 ? 'white' : '#4caf50'};
      border: 2px solid #4caf50;
      
      &:hover:not(:disabled) {
        background: #4caf50;
        color: white;
        transform: translateY(-2px);
      }
    }
    
    &.negative {
      background: ${props => props.$userVote === -1 ? '#f44336' : 'linear-gradient(135deg, #fdeaea 0%, #fef2f2 100%)'};
      color: ${props => props.$userVote === -1 ? 'white' : '#f44336'};
      border: 2px solid #f44336;
      
      &:hover:not(:disabled) {
        background: #f44336;
        color: white;
        transform: translateY(-2px);
      }
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin: 10px 0;
  
  .fill {
    height: 100%;
    background: linear-gradient(90deg, #f44336 0%, #ff9800 50%, #4caf50 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
    width: ${props => props.$percentage}%;
  }
`;

const DisabledMessage = styled.div`
  text-align: center;
  padding: 15px;
  background: #f7fafc;
  border-radius: 10px;
  color: #718096;
  font-style: italic;
`;

const RatingDisplay = ({ targetUser, rating, userVote, canVote }) => {
  const [isVoting, setIsVoting] = useState(false);
  const queryClient = useQueryClient();

  const voteMutation = useMutation(
    (value) => ratingAPI.rateUser(targetUser, value),
    {
      onMutate: () => {
        setIsVoting(true);
      },
      onSuccess: (data) => {
        toast.success(data.message || 'Оценка отправлена');
        // Инвалидируем связанные запросы
        queryClient.invalidateQueries(['profile', targetUser]);
        queryClient.invalidateQueries(['leaderboard']);
        queryClient.invalidateQueries(['my-rating-stats']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Ошибка при оценке');
      },
      onSettled: () => {
        setIsVoting(false);
      }
    }
  );

  const deleteVoteMutation = useMutation(
    () => ratingAPI.deleteRating(targetUser),
    {
      onSuccess: () => {
        toast.success('Оценка удалена');
        queryClient.invalidateQueries(['profile', targetUser]);
        queryClient.invalidateQueries(['leaderboard']);
        queryClient.invalidateQueries(['my-rating-stats']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Ошибка при удалении оценки');
      }
    }
  );

  const handleVote = (value) => {
    if (userVote === value) {
      // Если голосуем повторно тем же значением - удаляем оценку
      deleteVoteMutation.mutate();
    } else {
      // Иначе ставим новую оценку
      voteMutation.mutate(value);
    }
  };

  if (!rating) {
    return null;
  }

  const {
    total_rating = 0,
    total_votes = 0,
    positive_votes = 0,
    negative_votes = 0,
    percentage_positive = 0
  } = rating;

  return (
    <RatingContainer>
      <RatingHeader>
        <div className="title">
          <StarIcon />
          Рейтинг пользователя
        </div>
        <div className="total-rating">
          <StarIcon />
          {total_rating}
        </div>
      </RatingHeader>

      <RatingStats>
        <div className="stat">
          <div className="value">{total_votes}</div>
          <div className="label">Всего оценок</div>
        </div>
        <div className="stat">
          <div className="value">{positive_votes}</div>
          <div className="label">Положительных</div>
        </div>
        <div className="stat">
          <div className="value">{negative_votes}</div>
          <div className="label">Отрицательных</div>
        </div>
        <div className="stat">
          <div className="value">{percentage_positive}%</div>
          <div className="label">Позитивность</div>
        </div>
      </RatingStats>

      {total_votes > 0 && (
        <ProgressBar $percentage={percentage_positive}>
          <div className="fill" />
        </ProgressBar>
      )}

      {canVote ? (
        <VotingButtons $userVote={userVote}>
          <motion.button
            className="vote-btn positive"
            onClick={() => handleVote(1)}
            disabled={isVoting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ThumbsUpIcon />
            {userVote === 1 ? 'Убрать лайк' : 'Нравится'}
          </motion.button>
          
          <motion.button
            className="vote-btn negative"
            onClick={() => handleVote(-1)}
            disabled={isVoting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ThumbsDownIcon />
            {userVote === -1 ? 'Убрать дизлайк' : 'Не нравится'}
          </motion.button>
        </VotingButtons>
      ) : (
        <DisabledMessage>
          {targetUser === 'self' 
            ? 'Нельзя оценивать собственный профиль' 
            : 'Войдите в систему, чтобы оценить пользователя'
          }
        </DisabledMessage>
      )}
    </RatingContainer>
  );
};

export default RatingDisplay;