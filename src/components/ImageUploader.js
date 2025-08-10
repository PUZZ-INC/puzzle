import React, { useState, useRef } from 'react';
import '../styles/ImageUploader.css';
import { loadImageFromFile, cropImageToSquare, saveImageToStorage, loadImageFromStorage } from '../utils/imageUtils';
import { t } from '../utils/translations';

// Функция для загрузки изображения на сервер
const uploadImageToServer = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch('http://localhost:8000/accounts/api/upload-image/', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!response.ok) {
      let errorMessage = 'Ошибка загрузки изображения';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // Если не удалось прочитать JSON, используем статус
        if (response.status === 401) {
          errorMessage = 'Необходимо войти в систему';
        } else if (response.status === 400) {
          errorMessage = 'Некорректный файл';
        } else if (response.status === 500) {
          errorMessage = 'Ошибка сервера';
        }
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.image_url;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Не удается подключиться к серверу. Убедитесь, что Django-сервер запущен на порту 8000.');
    }
    throw new Error(`Ошибка загрузки на сервер: ${error.message}`);
  }
};

const ImageUploader = ({ onImageUpload, language = 'ru' }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoLoadImage, setAutoLoadImage] = useState(true); // Новое состояние
  const fileInputRef = useRef(null);
  
  // Используем useRef для хранения актуального значения autoLoadImage
  const autoLoadImageRef = useRef(autoLoadImage);
  
  // Обновляем ref при изменении состояния
  React.useEffect(() => {
    autoLoadImageRef.current = autoLoadImage;
  }, [autoLoadImage]);

  // Добавляем отладочную информацию
  console.log('ImageUploader render:', { selectedImage, previewUrl, isLoading, error, language });

  // Отдельная функция для загрузки сохраненного изображения (без useCallback)
  const loadSavedImage = () => {
    console.log('=== loadSavedImage START ===');
    console.log('loadSavedImage called, autoLoadImage:', autoLoadImageRef.current);
    console.log('Current state - selectedImage:', !!selectedImage, 'previewUrl:', !!previewUrl);
    console.log('localStorage autoLoadImage:', localStorage.getItem('autoLoadImage'));
    
    // Загружаем изображение только если включена автоматическая загрузка
    if (!autoLoadImageRef.current) {
      console.log('Auto-load disabled, skipping image restoration');
      console.log('=== loadSavedImage END (disabled) ===');
      return;
    }
    
    // Проверяем, что изображение еще не загружено
    if (selectedImage !== null || previewUrl !== null) {
      console.log('Image already loaded, skipping restoration');
      console.log('=== loadSavedImage END (already loaded) ===');
      return;
    }
    
    const savedImage = loadImageFromStorage('customImage');
    const savedServerUrl = loadImageFromStorage('customImageServerUrl');
    
    console.log('Loaded from storage:', { 
      savedImage: !!savedImage, 
      savedServerUrl: !!savedServerUrl,
      hasImage: !!savedImage,
      hasServerUrl: !!savedServerUrl
    });
    
    if (savedImage) {
      console.log('Creating image from saved data');
      const img = new Image();
      img.onload = () => {
        console.log('Image loaded successfully, setting state');
        // Восстанавливаем URL сервера
        if (savedServerUrl) {
          img.serverUrl = savedServerUrl;
        }
        
        setSelectedImage(img);
        setPreviewUrl(savedImage);
        onImageUpload(img);
        console.log('State updated, image restored');
        console.log('=== loadSavedImage END (success) ===');
      };
      img.onerror = (error) => {
        console.error('Error loading saved image:', error);
        console.log('=== loadSavedImage END (error) ===');
      };
      img.src = savedImage;
    } else {
      console.log('No saved image found in storage');
      console.log('=== loadSavedImage END (no saved image) ===');
    }
  };

  // Загружаем сохраненное изображение при инициализации
  React.useEffect(() => {
    console.log('ImageUploader useEffect triggered');
    
    // Загружаем настройку автоматической загрузки из localStorage
    const savedAutoLoad = localStorage.getItem('autoLoadImage');
    console.log('Raw savedAutoLoad from localStorage:', savedAutoLoad);
    
    if (savedAutoLoad !== null) {
      const shouldAutoLoad = savedAutoLoad === 'true';
      console.log('Setting autoLoadImage from localStorage:', shouldAutoLoad);
      setAutoLoadImage(shouldAutoLoad);
      
      // Если автоматическая загрузка включена, загружаем изображение
      if (shouldAutoLoad) {
        console.log('Auto-load is true, calling loadSavedImage');
        // Используем setTimeout, чтобы дать React время обновить состояние
        setTimeout(() => {
          loadSavedImage();
        }, 100);
      } else {
        console.log('Auto-load is false, not loading saved image');
      }
    } else {
      // Если настройка не найдена, устанавливаем по умолчанию true
      console.log('No saved autoLoadImage setting, defaulting to true');
      setAutoLoadImage(true);
      // Загружаем изображение только после установки состояния
      setTimeout(() => {
        console.log('Timeout callback: calling loadSavedImage with autoLoadImage = true');
        loadSavedImage();
      }, 100);
    }
  }, []); // Убираем зависимости, чтобы useEffect сработал только один раз

  // Отдельная функция для загрузки сохраненного изображения (с useCallback для других мест)
  const loadSavedImageCallback = React.useCallback(() => {
    loadSavedImage();
  }, []); // Убираем зависимости, так как используем ref

  // useEffect для отслеживания изменений autoLoadImage
  React.useEffect(() => {
    console.log('autoLoadImage changed to:', autoLoadImage);
    
    // Если включили автоматическую загрузку и нет текущего изображения, загружаем сохраненное
    if (autoLoadImage && !selectedImage && !previewUrl) {
      console.log('Auto-load enabled, attempting to load saved image');
      // Используем setTimeout, чтобы дать React время обновить состояние
      setTimeout(() => {
        loadSavedImage();
      }, 100);
    }
  }, [autoLoadImage, selectedImage, previewUrl]); // Убираем loadSavedImage из зависимостей

  const handleFileSelect = async (event) => {
    console.log('handleFileSelect called with:', event.target.files);
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // Сначала загружаем изображение на сервер
      const serverImageUrl = await uploadImageToServer(file);
      
      // Загружаем изображение из файла для обработки
      const image = await loadImageFromFile(file);
      
      // Обрезаем в квадрат
      const croppedImage = await cropImageToSquare(image, 400);
      
      // Создаем предварительный просмотр
      const previewImage = await cropImageToSquare(image, 200);
      
      // Сохраняем URL сервера в croppedImage для передачи в игру
      croppedImage.serverUrl = serverImageUrl;
      
      setSelectedImage(croppedImage);
      setPreviewUrl(previewImage.src);
      
      // Сохраняем в localStorage
      saveImageToStorage('customImage', croppedImage.src);
      saveImageToStorage('customImageServerUrl', serverImageUrl);
      
      onImageUpload(croppedImage);
    } catch (error) {
      console.error('Error in handleFileSelect:', error);
      const errorMessage = error.message.includes('не является изображением') 
        ? t('notAnImage', language)
        : error.message.includes('не выбран')
        ? t('fileNotSelected', language)
        : error.message.includes('загрузки')
        ? t('imageLoadError', language)
        : error.message.includes('чтения')
        ? t('fileReadError', language)
        : error.message.includes('сервер')
        ? `Ошибка загрузки на сервер: ${error.message}`
        : error.message;
      
      setError(errorMessage);
      setSelectedImage(null);
      setPreviewUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (event) => {
    console.log('handleDrop called');
    event.preventDefault();
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Создаем событие для обработки файла
      const fakeEvent = {
        target: { files: [file] }
      };
      
      await handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleRemoveImage = () => {
    console.log('handleRemoveImage called');
    
    // Сначала сбрасываем состояние
    setSelectedImage(null);
    setPreviewUrl(null);
    setError(null);
    onImageUpload(null);
    
    // Очищаем localStorage только для изображения, НЕ для настройки autoLoadImage
    localStorage.removeItem('customImage');
    localStorage.removeItem('customImageServerUrl');
    
    // НЕ удаляем настройку autoLoadImage - оставляем пользовательский выбор
    // localStorage.removeItem('autoLoadImage');
    
    // НЕ сбрасываем состояние чекбокса - оставляем пользовательский выбор
    // setAutoLoadImage(true);
    
    // Очищаем input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    console.log('Image removed, autoLoadImage setting preserved:', autoLoadImage);
  };





  // Добавляем проверку, что компонент рендерится
  if (!onImageUpload) {
    console.error('ImageUploader: onImageUpload prop is missing!');
  }

  return (
    <div className="image-uploader">
      <div className="upload-area">
        {!selectedImage ? (
          <div
            className="upload-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => {
              console.log('Upload zone clicked, fileInput:', fileInputRef.current);
              fileInputRef.current?.click();
            }}
          >
            <div className="upload-content">
              <div className="upload-icon">📁</div>
              <p className="upload-text">
                {t('uploadHint', language)}
              </p>
              <p className="upload-hint">
                {t('supportedFormats', language)}
              </p>
            </div>
          </div>
        ) : (
          <div className="image-preview">
            <img src={previewUrl} alt="Предварительный просмотр" />
            <div className="image-actions">
              <button
                className="btn btn-secondary"
                onClick={handleRemoveImage}
              >
                {t('remove', language)}
              </button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>{t('loadingImage', language)}</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}


      
      {/* Опция автоматической загрузки */}
      <div className="auto-load-option">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={autoLoadImage}
            onChange={(e) => {
              const newValue = e.target.checked;
              console.log('=== Checkbox changed ===');
              console.log('Checkbox changed to:', newValue);
              console.log('Current selectedImage:', !!selectedImage);
              console.log('Current previewUrl:', !!previewUrl);
              console.log('localStorage before change:', localStorage.getItem('autoLoadImage'));
              
              setAutoLoadImage(newValue);
              localStorage.setItem('autoLoadImage', newValue);
              
              console.log('localStorage after change:', localStorage.getItem('autoLoadImage'));
              
              // Если включили автоматическую загрузку и нет текущего изображения, загружаем сохраненное
              if (newValue && !selectedImage && !previewUrl) {
                console.log('Auto-load enabled via checkbox, loading saved image');
                // Используем setTimeout, чтобы дать React время обновить состояние
                setTimeout(() => {
                  console.log('Timeout callback: calling loadSavedImage');
                  loadSavedImage();
                }, 100);
              } else {
                console.log('Not loading saved image because:', {
                  newValue,
                  hasSelectedImage: !!selectedImage,
                  hasPreviewUrl: !!previewUrl
                });
              }
              console.log('=== Checkbox change END ===');
            }}
          />
          <span className="checkbox-text">
            {t('autoLoadImage', language)}
          </span>
        </label>
      </div>
    </div>
  );
};

export default ImageUploader; 