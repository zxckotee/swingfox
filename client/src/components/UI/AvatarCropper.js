import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Modal, ModalContent, ModalHeader, Button, CloseIcon } from './index.js';

const CropperContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  touch-action: none;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: 768px) {
    gap: 15px;
  }
`;

const ImagePreview = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
  height: ${props => props.$height || '400px'};
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  background: #f7fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  -webkit-overflow-scrolling: touch;
  
  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    pointer-events: none;
  }
  
  @media (max-width: 768px) {
    max-width: 100%;
    height: ${props => props.$mobileHeight || '300px'};
    border-radius: 8px;
  }
  
  @media (max-width: 480px) {
    height: ${props => props.$mobileHeight || '250px'};
    border-radius: 6px;
  }
`;

const CropArea = styled.div`
  position: absolute;
  border: 2px solid #dc3522;
  background: rgba(220, 53, 34, 0.1);
  cursor: move;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  user-select: none;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    background: #dc3522;
  }
  
  &::before {
    top: 50%;
    left: -2px;
    right: -2px;
    height: 2px;
    transform: translateY(-50%);
  }
  
  &::after {
    left: 50%;
    top: -2px;
    bottom: -2px;
    width: 2px;
    transform: translateX(-50%);
  }
  
  @media (max-width: 768px) {
    border-width: 3px;
    
    &::before,
    &::after {
      background: #dc3522;
    }
  }
`;

const CropHandle = styled.div`
  position: absolute;
  width: 12px;
  height: 12px;
  background: #dc3522;
  border: 2px solid white;
  border-radius: 50%;
  cursor: ${props => props.$cursor || 'nw-resize'};
  z-index: 10;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  
  &.top-left { top: -6px; left: -6px; cursor: nw-resize; }
  &.top-right { top: -6px; right: -6px; cursor: ne-resize; }
  &.bottom-left { bottom: -6px; left: -6px; cursor: sw-resize; }
  &.bottom-right { bottom: -6px; right: -6px; cursor: se-resize; }
  
  &:hover {
    background: #ff6b58;
    transform: scale(1.2);
  }
  
  @media (max-width: 768px) {
    width: 16px;
    height: 16px;
    border-width: 3px;
    
    &.top-left { top: -8px; left: -8px; }
    &.top-right { top: -8px; right: -8px; }
    &.bottom-left { bottom: -8px; left: -8px; }
    &.bottom-right { bottom: -8px; right: -8px; }
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
  
  @media (max-width: 768px) {
    gap: 10px;
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }
`;

const Instructions = styled.div`
  text-align: center;
  color: #718096;
  font-size: 14px;
  line-height: 1.5;
  max-width: 600px;
  margin-bottom: 10px;
  
  @media (max-width: 768px) {
    font-size: 13px;
    margin-bottom: 15px;
    padding: 0 10px;
  }
`;

const AvatarCropper = ({ 
  isOpen, 
  onClose, 
  imageFile, 
  onCrop, 
  aspectRatio = 1,
  minSize = 100 
}) => {
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imageUrl, setImageUrl] = useState('');
  const [containerSize, setContainerSize] = useState({ width: 400, height: 400 });
  const [isMobile, setIsMobile] = useState(false);
  
  const imageRef = useRef();
  const containerRef = useRef();

  // Определяем мобильное устройство
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Инициализация изображения
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        setImageSize({ width, height });
        
        // Вычисляем размеры контейнера на основе пропорций изображения
        const maxContainerSize = isMobile ? 400 : 600;
        let containerWidth, containerHeight;
        
        if (width > height) {
          // Горизонтальное изображение
          containerWidth = maxContainerSize;
          containerHeight = (height / width) * maxContainerSize;
        } else {
          // Вертикальное или квадратное изображение
          containerHeight = maxContainerSize;
          containerWidth = (width / height) * maxContainerSize;
        }
        
        // Ограничиваем минимальные размеры
        containerWidth = Math.max(containerWidth, isMobile ? 250 : 300);
        containerHeight = Math.max(containerHeight, isMobile ? 200 : 300);
        
        setContainerSize({ width: containerWidth, height: containerHeight });
        
        // Инициализируем область кропа по центру
        const cropSize = Math.min(
          isMobile ? 150 : 200, 
          Math.min(containerWidth, containerHeight) * 0.8
        );
        
        setCropArea({
          x: (containerWidth - cropSize) / 2,
          y: (containerHeight - cropSize) / 2,
          width: cropSize,
          height: cropSize
        });
      };
      img.src = url;
      
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile, isMobile]);

  // Получаем координаты события (мышь или touch)
  const getEventCoordinates = useCallback((e) => {
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
    return {
      x: e.clientX,
      y: e.clientY
    };
  }, []);

  // Обработчики событий мыши и touch
  const handleStart = useCallback((e, type = 'move') => {
    // Для touch событий preventDefault может не работать
    if (e.type === 'touchstart') {
      e.preventDefault();
    } else {
      e.preventDefault();
    }
    e.stopPropagation();
    
    const coords = getEventCoordinates(e);
    
    if (type === 'move') {
      setIsDragging(true);
      setDragStart({
        x: coords.x - cropArea.x,
        y: coords.y - cropArea.y
      });
    } else {
      setIsResizing(true);
      setResizeHandle(type);
      setDragStart({
        x: coords.x,
        y: coords.y
      });
    }
  }, [cropArea.x, cropArea.y, getEventCoordinates]);

  const handleMove = useCallback((e) => {
    if (!isDragging && !isResizing) return;
    
    // Для touch событий preventDefault может не работать
    if (e.type === 'touchmove') {
      e.preventDefault();
    }
    
    const coords = getEventCoordinates(e);
    
    if (isDragging) {
      const newX = coords.x - dragStart.x;
      const newY = coords.y - dragStart.y;
      
      // Ограничиваем область кропа в пределах контейнера
      const maxX = containerSize.width - cropArea.width;
      const maxY = containerSize.height - cropArea.height;
      
      setCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      }));
    } else if (isResizing) {
      const deltaX = coords.x - dragStart.x;
      const deltaY = coords.y - dragStart.y;
      
      setCropArea(prev => {
        let newWidth = prev.width;
        let newHeight = prev.height;
        let newX = prev.x;
        let newY = prev.y;
        
        switch (resizeHandle) {
          case 'top-left':
            newWidth = Math.max(minSize, prev.width - deltaX);
            newHeight = Math.max(minSize, prev.height - deltaY);
            newX = prev.x + prev.width - newWidth;
            newY = prev.y + prev.height - newHeight;
            break;
          case 'top-right':
            newWidth = Math.max(minSize, prev.width + deltaX);
            newHeight = Math.max(minSize, prev.height - deltaY);
            newY = prev.y + prev.height - newHeight;
            break;
          case 'bottom-left':
            newWidth = Math.max(minSize, prev.width - deltaX);
            newHeight = Math.max(minSize, prev.height + deltaY);
            newX = prev.x + prev.width - newWidth;
            break;
          case 'bottom-right':
            newWidth = Math.max(minSize, prev.width + deltaX);
            newHeight = Math.max(minSize, prev.height + deltaY);
            break;
          default:
            return prev;
        }
        
        // Поддерживаем квадратную форму
        const size = Math.min(newWidth, newHeight);
        
        // Проверяем, что новая область не выходит за пределы контейнера
        const maxX = containerSize.width - size;
        const maxY = containerSize.height - size;
        
        return {
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
          width: size,
          height: size
        };
      });
      
      setDragStart({ x: coords.x, y: coords.y });
    }
  }, [isDragging, isResizing, cropArea, dragStart, resizeHandle, containerSize, minSize, getEventCoordinates]);

  const handleEnd = useCallback((e) => {
    // Для touch событий preventDefault может не работать
    if (e && e.type === 'touchend') {
      e.preventDefault();
    }
    
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Глобальные обработчики событий
  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMove(e);
    const handleGlobalMouseUp = () => handleEnd();
    const handleGlobalTouchMove = (e) => {
      // Важно: preventDefault должен быть вызван до handleMove
      e.preventDefault();
      handleMove(e);
    };
    const handleGlobalTouchEnd = (e) => handleEnd(e);
    
    // Предотвращаем скролл на мобильных устройствах
    const preventScroll = (e) => {
      if (isDragging || isResizing) {
        e.preventDefault();
      }
    };
    
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      // Добавляем passive: false для touchmove, чтобы можно было вызвать preventDefault
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd, { passive: false });
      // Предотвращаем скролл страницы
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('touchmove', preventScroll);
      document.body.style.overflow = '';
    };
  }, [isDragging, isResizing, handleMove, handleEnd]);

  // Добавляем touch event listeners напрямую через refs
  useEffect(() => {
    const cropAreaElement = containerRef.current;
    if (!cropAreaElement) return;

    const handleTouchStart = (e) => {
      e.preventDefault();
      handleStart(e, 'move');
    };

    const handleTouchStartTopLeft = (e) => {
      e.preventDefault();
      handleStart(e, 'top-left');
    };

    const handleTouchStartTopRight = (e) => {
      e.preventDefault();
      handleStart(e, 'top-right');
    };

    const handleTouchStartBottomLeft = (e) => {
      e.preventDefault();
      handleStart(e, 'bottom-left');
    };

    const handleTouchStartBottomRight = (e) => {
      e.preventDefault();
      handleStart(e, 'bottom-right');
    };

    // Предотвращаем скролл на контейнере
    const preventScroll = (e) => {
      e.preventDefault();
    };

    // Добавляем touch event listeners с passive: false
    cropAreaElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    cropAreaElement.addEventListener('touchmove', preventScroll, { passive: false });
    
    // Находим и добавляем обработчики для маркеров
    const handles = cropAreaElement.querySelectorAll('.crop-handle');
    handles.forEach((handle, index) => {
      const handler = [handleTouchStartTopLeft, handleTouchStartTopRight, handleTouchStartBottomLeft, handleTouchStartBottomRight][index];
      handle.addEventListener('touchstart', handler, { passive: false });
    });

    return () => {
      cropAreaElement.removeEventListener('touchstart', handleTouchStart);
      cropAreaElement.removeEventListener('touchmove', preventScroll);
      handles.forEach((handle, index) => {
        const handler = [handleTouchStartTopLeft, handleTouchStartTopRight, handleTouchStartBottomLeft, handleTouchStartBottomRight][index];
        handle.removeEventListener('touchstart', handler);
      });
    };
  }, [handleStart]);

  // Предотвращаем скролл на всем документе во время работы с кропом
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      };
    }
  }, [isOpen]);

  // Функция кропа
  const handleCrop = useCallback(() => {
    if (!imageRef.current) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Устанавливаем размер канваса равным размеру области кропа
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    
    // Вычисляем масштаб между отображаемым изображением и оригиналом
    const scaleX = imageSize.width / containerSize.width;
    const scaleY = imageSize.height / containerSize.height;
    
    // Вычисляем координаты в оригинальном изображении
    const sourceX = cropArea.x * scaleX;
    const sourceY = cropArea.y * scaleY;
    const sourceWidth = cropArea.width * scaleX;
    const sourceHeight = cropArea.height * scaleY;
    
    // Рисуем обрезанное изображение
    ctx.drawImage(
      imageRef.current,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, cropArea.width, cropArea.height
    );
    
    // Конвертируем в Blob
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        onCrop(croppedFile);
        onClose();
      }
    }, 'image/jpeg', 0.9);
  }, [cropArea, imageSize, containerSize, onCrop, onClose]);

  // Сброс области кропа
  const handleReset = useCallback(() => {
    const cropSize = Math.min(
      isMobile ? 150 : 200, 
      Math.min(containerSize.width, containerSize.height) * 0.8
    );
    
    setCropArea({
      x: (containerSize.width - cropSize) / 2,
      y: (containerSize.height - cropSize) / 2,
      width: cropSize,
      height: cropSize
    });
  }, [containerSize, isMobile]);

  if (!isOpen || !imageFile) return null;

  return (
    <Modal>
      <ModalContent $maxWidth={isMobile ? "95vw" : "800px"}>
        <ModalHeader>
          <h2>Обрезка аватарки</h2>
          <Button $variant="secondary" onClick={onClose}>
            <CloseIcon />
          </Button>
        </ModalHeader>
        
        <CropperContainer>
          <Instructions>
            {isMobile 
              ? "Перетащите область выделения или используйте угловые маркеры для изменения размера. Аватарка будет квадратной формы."
              : "Перетащите область выделения или используйте угловые маркеры для изменения размера. Аватарка будет квадратной формы."
            }
          </Instructions>
          
          <ImagePreview
            ref={containerRef}
            $height={`${containerSize.height}px`}
            $mobileHeight={`${Math.min(containerSize.height, 300)}px`}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Предварительный просмотр"
              draggable={false}
            />
            
            <CropArea
              style={{
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.width,
                height: cropArea.height
              }}
              onMouseDown={(e) => handleStart(e, 'move')}
            >
              <CropHandle 
                className="crop-handle top-left" 
                $cursor="nw-resize"
                onMouseDown={(e) => handleStart(e, 'top-left')}
              />
              <CropHandle 
                className="crop-handle top-right" 
                $cursor="ne-resize"
                onMouseDown={(e) => handleStart(e, 'top-right')}
              />
              <CropHandle 
                className="crop-handle bottom-left" 
                $cursor="sw-resize"
                onMouseDown={(e) => handleStart(e, 'bottom-left')}
              />
              <CropHandle 
                className="crop-handle bottom-right" 
                $cursor="se-resize"
                onMouseDown={(e) => handleStart(e, 'bottom-right')}
              />
            </CropArea>
          </ImagePreview>
          
          <Controls>
            <Button $variant="secondary" onClick={handleReset}>
              Сбросить
            </Button>
            <Button onClick={handleCrop}>
              Обрезать и сохранить
            </Button>
          </Controls>
        </CropperContainer>
      </ModalContent>
    </Modal>
  );
};

export default AvatarCropper;
