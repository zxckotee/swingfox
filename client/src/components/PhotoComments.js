import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { usersAPI } from '../services/api';
import {
  Button,
  IconButton,
  Form,
  FormGroup,
  Label,
  TextArea,
  Avatar,
  LoadingSpinner,
  CloseIcon,
  EditIcon,
  TrashIcon,
  SendIcon
} from './UI';

const CommentsContainer = styled.div`
  background: white;
  border-radius: 15px;
  padding: 20px;
  margin: 15px 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const CommentsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  
  .title {
    font-size: 18px;
    font-weight: 600;
    color: #2d3748;
  }
  
  .count {
    background: #dc3522;
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }
`;

const CommentForm = styled(Form)`
  margin-bottom: 20px;
  
  .form-row {
    display: flex;
    gap: 10px;
    align-items: flex-end;
  }
  
  .comment-input {
    flex: 1;
  }
`;

const CommentsList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const CommentItem = styled(motion.div)`
  display: flex;
  gap: 12px;
  padding: 15px;
  border-radius: 12px;
  background: #f7fafc;
  margin-bottom: 10px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #edf2f7;
  }
  
  .comment-avatar {
    flex-shrink: 0;
  }
  
  .comment-content {
    flex: 1;
    min-width: 0;
  }
  
  .comment-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
  }
  
  .comment-author {
    font-weight: 600;
    color: #2d3748;
    font-size: 14px;
  }
  
  .comment-time {
    font-size: 12px;
    color: #718096;
  }
  
  .comment-text {
    color: #4a5568;
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: 8px;
  }
  
  .comment-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  .edit-indicator {
    font-size: 11px;
    color: #718096;
    font-style: italic;
  }
`;

const EditForm = styled.div`
  margin-top: 10px;
  
  .edit-row {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }
  
  .edit-input {
    flex: 1;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #718096;
  
  .icon {
    font-size: 48px;
    margin-bottom: 15px;
    opacity: 0.5;
  }
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #2d3748;
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
`;

const LoadMoreButton = styled(Button)`
  width: 100%;
  margin-top: 15px;
`;

const PhotoComments = ({ filename, currentUser }) => {
  // Проверяем, что filename передан
  if (!filename) {
    return (
      <CommentsContainer>
        <div style={{ textAlign: 'center', padding: '20px', color: '#718096' }}>
          Ошибка: не указано имя файла для комментариев
        </div>
      </CommentsContainer>
    );
  }
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Получение комментариев
  const { data: commentsData, isLoading, error } = useQuery(
    ['photo-comments', filename, page],
    () => usersAPI.getPhotoComments(filename, page, 10),
    {
      keepPreviousData: true,
      enabled: !!filename, // Запрос выполняется только если есть filename
      onError: (error) => {
        toast.error('Ошибка при загрузке комментариев');
      }
    }
  );

  // Мутации
  const createCommentMutation = useMutation(
    async (data) => {
      console.log('Mutation function called with data:', data);
      console.log('Data types:', {
        filename: typeof data.filename,
        commentText: typeof data.commentText
      });
      
      if (typeof data.filename !== 'string') {
        throw new Error(`Filename must be string, got ${typeof data.filename}: ${data.filename}`);
      }
      
      return await usersAPI.createPhotoComment(data.filename, data.commentText);
    },
    {
    onSuccess: () => {
      toast.success('Комментарий добавлен');
      setCommentText('');
      queryClient.invalidateQueries(['photo-comments', filename]);
      setPage(1); // Сбрасываем на первую страницу
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка при добавлении комментария');
    }
  });

  const updateCommentMutation = useMutation(
    (data) => usersAPI.updatePhotoComment(data.commentId, data.commentText),
    {
    onSuccess: () => {
      toast.success('Комментарий обновлен');
      setEditingComment(null);
      setEditText('');
      queryClient.invalidateQueries(['photo-comments', filename]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка при обновлении комментария');
    }
  });

  const deleteCommentMutation = useMutation(
    (data) => usersAPI.deletePhotoComment(data.commentId),
    {
    onSuccess: () => {
      toast.success('Комментарий удален');
      queryClient.invalidateQueries(['photo-comments', filename]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка при удалении комментария');
    }
  });

  // Обработчики
  const handleSubmitComment = (e) => {
    e.preventDefault();
    
    // Добавляем отладочную информацию
    console.log('Submitting comment:', {
      commentText,
      trimmed: commentText.trim(),
      length: commentText.length,
      trimmedLength: commentText.trim().length
    });
    
    if (!commentText || commentText.trim().length === 0) {
      toast.error('Введите текст комментария');
      return;
    }
    
    const commentData = {
      filename, 
      commentText: commentText.trim() 
    };
    
    console.log('Calling createCommentMutation with:', commentData);
    console.log('CommentData types:', {
      filename: typeof commentData.filename,
      commentText: typeof commentData.commentText
    });
    console.log('Filename value:', commentData.filename);
    
    // Дополнительная проверка
    if (typeof commentData.filename !== 'string') {
      console.error('Filename is not a string in commentData:', commentData.filename);
      toast.error('Ошибка: неправильный формат имени файла');
      return;
    }
    
    createCommentMutation.mutate(commentData);
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment.id);
    setEditText(comment.text);
  };

  const handleUpdateComment = () => {
    if (!editText.trim()) {
      toast.error('Введите текст комментария');
      return;
    }
    updateCommentMutation.mutate({ commentId: editingComment, commentText: editText.trim() });
  };

  const handleDeleteComment = (commentId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const canEditComment = (comment) => {
    return currentUser && comment.user?.login === currentUser;
  };

  const canDeleteComment = (comment) => {
    return currentUser && comment.user?.login === currentUser;
  };

  if (isLoading && page === 1) {
    return (
      <CommentsContainer>
        <LoadingSpinner />
      </CommentsContainer>
    );
  }

  const comments = commentsData?.comments || [];
  const totalComments = commentsData?.pagination?.total || commentsData?.total || 0;
  const hasMore = comments.length < totalComments;

  return (
    <CommentsContainer>
      <CommentsHeader>
        <div className="title">Комментарии</div>
        <div className="count">{totalComments}</div>
      </CommentsHeader>

      {/* Форма добавления комментария */}
      {currentUser && (
        <CommentForm onSubmit={handleSubmitComment}>
          <FormGroup className="comment-input">
            <Label>Добавить комментарий</Label>
            <TextArea
              placeholder="Напишите ваш комментарий..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              $minHeight="80px"
              maxLength={1000}
            />
          </FormGroup>
          <div className="form-row">
            <div style={{ fontSize: '12px', color: '#718096' }}>
              {commentText.length}/1000 символов
            </div>
            <Button 
              type="submit" 
              disabled={createCommentMutation.isLoading || !commentText.trim()}
              $size="small"
            >
              <SendIcon />
              {createCommentMutation.isLoading ? 'Отправка...' : 'Отправить'}
            </Button>
          </div>
        </CommentForm>
      )}

      {/* Список комментариев */}
      <CommentsList>
        {comments.length > 0 ? (
          <AnimatePresence>
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="comment-avatar">
                  <Avatar 
                    src={comment.user?.avatar ? `/uploads/${comment.user.avatar}` : null}
                    alt={comment.user?.name || comment.user?.login}
                    size="40px"
                  />
                </div>
                
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-author">
                      {comment.user?.name || comment.user?.login}
                    </span>
                    <span className="comment-time">
                      {usersAPI.utils?.formatTimeAgo?.(comment.created_at) || 
                       new Date(comment.created_at).toLocaleDateString()}
                    </span>
                    {comment.is_edited && (
                      <span className="edit-indicator">(отредактировано)</span>
                    )}
                  </div>
                  
                  {editingComment === comment.id ? (
                    <EditForm>
                      <TextArea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        $minHeight="60px"
                        maxLength={1000}
                      />
                      <div className="edit-row">
                        <div style={{ fontSize: '12px', color: '#718096' }}>
                          {editText.length}/1000 символов
                        </div>
                        <Button 
                          onClick={handleUpdateComment}
                          disabled={updateCommentMutation.isLoading || !editText.trim()}
                          $size="small"
                        >
                          Сохранить
                        </Button>
                        <Button 
                          onClick={() => setEditingComment(null)}
                          $variant="secondary"
                          $size="small"
                        >
                          Отмена
                        </Button>
                      </div>
                    </EditForm>
                  ) : (
                    <div className="comment-text">{comment.text}</div>
                  )}
                  
                  <div className="comment-actions">
                    {canEditComment(comment) && editingComment !== comment.id && (
                      <IconButton
                        onClick={() => handleEditComment(comment)}
                        $size="small"
                        $variant="secondary"
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    
                    {canDeleteComment(comment) && (
                      <IconButton
                        onClick={() => handleDeleteComment(comment.id)}
                        $size="small"
                        $variant="danger"
                      >
                        <TrashIcon />
                      </IconButton>
                    )}
                  </div>
                </div>
              </CommentItem>
            ))}
          </AnimatePresence>
        ) : (
          <EmptyState>
            <div className="icon">💬</div>
            <h3>Нет комментариев</h3>
            <p>Будьте первым, кто оставит комментарий к этой фотографии</p>
          </EmptyState>
        )}
      </CommentsList>

      {/* Кнопка "Загрузить еще" */}
      {hasMore && (
        <LoadMoreButton
          onClick={handleLoadMore}
          disabled={isLoading}
          $variant="secondary"
        >
          {isLoading ? 'Загрузка...' : 'Загрузить еще'}
        </LoadMoreButton>
      )}
    </CommentsContainer>
  );
};

export default PhotoComments;
