import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { Button } from './index.js';

const UploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  transition: all 0.3s ease;

  &:hover {
    border-color: #667eea;
    background: #f0f4ff;
  }

  &.dragover {
    border-color: #667eea;
    background: #e6f3ff;
  }
`;

const UploadArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
`;

const UploadIcon = styled.div`
  font-size: 2rem;
  color: #667eea;
`;

const UploadText = styled.div`
  color: #4a5568;
  font-size: 14px;
`;

const FileInput = styled.input`
  display: none;
`;

const PreviewContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  margin-top: 15px;
`;

const PreviewItem = styled.div`
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 8px;
  overflow: hidden;
  background: #e2e8f0;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: rgba(220, 53, 34, 0.8);
  color: white;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(220, 53, 34, 1);
  }
`;

const UploadButton = styled(Button)`
  margin-top: 10px;
  align-self: center;
`;

const EventImageUploader = ({ 
  eventId, 
  onUpload, 
  onRemove, 
  existingImages = [], 
  maxFiles = 10 
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('Пожалуйста, выберите только изображения');
      return;
    }

    if (existingImages.length + selectedFiles.length + imageFiles.length > maxFiles) {
      alert(`Максимум ${maxFiles} изображений разрешено`);
      return;
    }

    setSelectedFiles(prev => [...prev, ...imageFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    handleFileSelect(files);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await onUpload(eventId, formData);
      
      if (response.success) {
        setSelectedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка при загрузке изображений');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveExisting = async (filename) => {
    try {
      await onRemove(eventId, filename);
    } catch (error) {
      console.error('Remove error:', error);
      alert('Ошибка при удалении изображения');
    }
  };

  return (
    <UploadContainer 
      className={isDragging ? 'dragover' : ''}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <UploadArea onClick={() => fileInputRef.current?.click()}>
        <UploadIcon>📷</UploadIcon>
        <UploadText>
          {isDragging 
            ? 'Отпустите файлы для загрузки' 
            : 'Перетащите изображения сюда или нажмите для выбора'
          }
        </UploadText>
        <UploadText style={{ fontSize: '12px', color: '#718096' }}>
          Максимум {maxFiles} изображений, до 10MB каждое
        </UploadText>
      </UploadArea>

      <FileInput
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
      />

      {/* Предварительный просмотр выбранных файлов */}
      {selectedFiles.length > 0 && (
        <div>
          <h4>Выбранные файлы ({selectedFiles.length}):</h4>
          <PreviewContainer>
            {selectedFiles.map((file, index) => (
              <PreviewItem key={index}>
                <PreviewImage 
                  src={URL.createObjectURL(file)} 
                  alt={`Preview ${index + 1}`}
                />
                <RemoveButton onClick={() => removeSelectedFile(index)}>
                  ×
                </RemoveButton>
              </PreviewItem>
            ))}
          </PreviewContainer>
          <UploadButton 
            onClick={handleUpload} 
            disabled={isUploading}
          >
            {isUploading ? 'Загрузка...' : `Загрузить ${selectedFiles.length} изображений`}
          </UploadButton>
        </div>
      )}

      {/* Существующие изображения */}
      {existingImages.length > 0 && (
        <div>
          <h4>Загруженные изображения ({existingImages.length}):</h4>
          <PreviewContainer>
            {existingImages.map((image, index) => (
              <PreviewItem key={index}>
                <PreviewImage 
                  src={`/uploads/${image}`} 
                  alt={`Event image ${index + 1}`}
                />
                <RemoveButton onClick={() => handleRemoveExisting(image)}>
                  ×
                </RemoveButton>
              </PreviewItem>
            ))}
          </PreviewContainer>
        </div>
      )}
    </UploadContainer>
  );
};

export default EventImageUploader;

