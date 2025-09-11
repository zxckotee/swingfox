import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { ratingAPI, apiUtils } from '../services/api';

const RatingContainer = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 15px;
  padding: 20px;
  margin: 15px 0;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #dc3522;
    box-shadow: 0 4px 15px rgba(220, 53, 34, 0.1);
  }
`;

const RatingHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
`;

const RatingTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RatingScore = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #dc3522;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const RatingActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
`;

const VoteButton = styled(motion.button)`
  background: ${props => {
    if (props.$voted === 1) return 'linear-gradient(135deg, #48bb78 0%, #68d391 100%)';
    if (props.$voted === -1) return 'linear-gradient(135deg, #f56565 0%, #fc8181 100%)';
    return 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)';
  }};
  color: ${props => {
    if (props.$voted === 1) return 'white';
    if (props.$voted === -1) return 'white';
    return '#4a5568';
  }};
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const RatingStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  margin-top: 15px;
`;

const StatItem = styled.div`
  background: white;
  border-radius: 10px;
  padding: 12px;
  text-align: center;
  border: 1px solid #e2e8f0;
`;

const StatValue = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #718096;
  text-transform: uppercase;
  font-weight: 500;
`;

const ActivityBreakdown = styled.div`
  margin-top: 15px;
  padding: 15px;
  background: white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
`;

const ActivityTitle = styled.h4`
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
`;

const ActivityItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
  
  &:not(:last-child) {
    border-bottom: 1px solid #f7fafc;
  }
`;

const ActivityLabel = styled.span`
  color: #718096;
`;

const ActivityValue = styled.span`
  color: #2d3748;
  font-weight: 500;
`;

const ProfileRating = ({ 
  targetUser, 
  currentUser, 
  initialRating = null, 
  canVote = true 
}) => {
  const [userVote, setUserVote] = useState(initialRating?.user_vote || null);
  const [isVoting, setIsVoting] = useState(false);
  const queryClient = useQueryClient();

  const voteMutation = useMutation(
    ({ username, value }) => ratingAPI.rateUser(username, value),
    {
      onSuccess: (data) => {
        setUserVote(data.rating.value);
        toast.success(data.message);
        
        // Обновляем кэш
        queryClient.invalidateQueries(['profile', targetUser]);
        queryClient.invalidateQueries(['rating', targetUser]);
        queryClient.invalidateQueries(['leaderboard']);
      },
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      },
      onSettled: () => {
        setIsVoting(false);
      }
    }
  );

  const deleteVoteMutation = useMutation(
    (username) => ratingAPI.deleteRating(username),
    {
      onSuccess: () => {
        setUserVote(null);
        toast.success('Оценка удалена');
        
        // Обновляем кэш
        queryClient.invalidateQueries(['profile', targetUser]);
        queryClient.invalidateQueries(['rating', targetUser]);
        queryClient.invalidateQueries(['leaderboard']);
      },
      onError: (error) => {
        toast.error(apiUtils.handleError(error));
      },
      onSettled: () => {
        setIsVoting(false);
      }
    }
  );

  const handleVote = async (value) => {
    if (!canVote || isVoting) return;
    
    setIsVoting(true);
    
    try {
      if (userVote === value) {
        // Если пользователь голосует повторно за то же, удаляем оценку
        await deleteVoteMutation.mutateAsync(targetUser);
      } else {
        // Голосуем за новое значение
        await voteMutation.mutateAsync({ username: targetUser, value });
      }
    } catch (error) {
      console.error('Vote error:', error);
    }
  };

  if (!initialRating) {
    return (
      <RatingContainer>
        <RatingTitle>📊 Рейтинг</RatingTitle>
        <div style={{ textAlign: 'center', color: '#718096', padding: '20px' }}>
          Загрузка рейтинга...
        </div>
      </RatingContainer>
    );
  }

  const { rating } = initialRating;
  const comprehensiveScore = rating.comprehensive_score || 0;
  const totalActivity = rating.total_activity || 0;

  return (
    <RatingContainer>
      <RatingHeader>
        <RatingTitle>
          📊 Рейтинг
        </RatingTitle>
        <RatingScore>
          {comprehensiveScore > 0 ? '+' : ''}{comprehensiveScore}
        </RatingScore>
      </RatingHeader>

      {canVote && (
        <RatingActions>
          <VoteButton
            $voted={userVote === 1 ? 1 : 0}
            onClick={() => handleVote(1)}
            disabled={isVoting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            👍 Голосовать за
          </VoteButton>
          
          <VoteButton
            $voted={userVote === -1 ? -1 : 0}
            onClick={() => handleVote(-1)}
            disabled={isVoting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            👎 Голосовать против
          </VoteButton>
        </RatingActions>
      )}

      <RatingStats>
        <StatItem>
          <StatValue>{rating.direct_rating?.votes || 0}</StatValue>
          <StatLabel>Голосов</StatLabel>
        </StatItem>
        
        <StatItem>
          <StatValue>{totalActivity}</StatValue>
          <StatLabel>Активность</StatLabel>
        </StatItem>
        
        <StatItem>
          <StatValue>{rating.direct_rating?.percentage_positive || 0}%</StatValue>
          <StatLabel>Положительных</StatLabel>
        </StatItem>
        
        <StatItem>
          <StatValue>{rating.comments?.total_comments || 0}</StatValue>
          <StatLabel>Комментариев</StatLabel>
        </StatItem>
      </RatingStats>

      {totalActivity > 0 && (
        <ActivityBreakdown>
          <ActivityTitle>Детальная активность:</ActivityTitle>
          
          <ActivityItem>
            <ActivityLabel>Прямые оценки:</ActivityLabel>
            <ActivityValue>{rating.direct_rating?.votes || 0}</ActivityValue>
          </ActivityItem>
          
          <ActivityItem>
            <ActivityLabel>Реакции на фото:</ActivityLabel>
            <ActivityValue>{rating.photo_reactions?.count || 0}</ActivityValue>
          </ActivityItem>
          
          <ActivityItem>
            <ActivityLabel>Реакции на профиль:</ActivityLabel>
            <ActivityValue>{rating.profile_reactions?.count || 0}</ActivityValue>
          </ActivityItem>
          
          <ActivityItem>
            <ActivityLabel>Комментарии к профилю:</ActivityLabel>
            <ActivityValue>{rating.comments?.profile_comments || 0}</ActivityValue>
          </ActivityItem>
          
          <ActivityItem>
            <ActivityLabel>Комментарии к фото:</ActivityLabel>
            <ActivityValue>{rating.comments?.photo_comments || 0}</ActivityValue>
          </ActivityItem>
          
          <ActivityItem>
            <ActivityLabel>Лайки фото:</ActivityLabel>
            <ActivityValue>{rating.photo_likes || 0}</ActivityValue>
          </ActivityItem>
        </ActivityBreakdown>
      )}
    </RatingContainer>
  );
};

export default ProfileRating;
