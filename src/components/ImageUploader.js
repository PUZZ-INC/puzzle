import React, { useState, useRef } from 'react';
import '../styles/ImageUploader.css';
import { loadImageFromFile, cropImageToSquare, saveImageToStorage, loadImageFromStorage } from '../utils/imageUtils';
import { t } from '../utils/translations';

const ImageUploader = ({ onImageUpload, language = 'ru' }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Загружаем сохраненное изображение при инициализации
  React.useEffect(() => {
    const savedImage = loadImageFromStorage('customImage');
    if (savedImage) {
      const img = new Image();
      img.onload = () => {
        setSelectedImage(img);
        setPreviewUrl(savedImage);
        onImageUpload(img);
      };
      img.src = savedImage;
    }
  }, [onImageUpload]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // Загружаем изображение
      const image = await loadImageFromFile(file);
      
      // Обрезаем в квадрат
      const croppedImage = await cropImageToSquare(image, 400);
      
      // Создаем предварительный просмотр
      const previewImage = await cropImageToSquare(image, 200);
      
      setSelectedImage(croppedImage);
      setPreviewUrl(previewImage.src);
      
      // Сохраняем в localStorage
      saveImageToStorage('customImage', croppedImage.src);
      
      onImageUpload(croppedImage);
    } catch (error) {
      const errorMessage = error.message.includes('не является изображением') 
        ? t('notAnImage', language)
        : error.message.includes('не выбран')
        ? t('fileNotSelected', language)
        : error.message.includes('загрузки')
        ? t('imageLoadError', language)
        : error.message.includes('чтения')
        ? t('fileReadError', language)
        : error.message;
      
      setError(errorMessage);
      setSelectedImage(null);
      setPreviewUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (event) => {
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
    setSelectedImage(null);
    setPreviewUrl(null);
    setError(null);
    onImageUpload(null);
    
    // Очищаем input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUseDefault = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setError(null);
    onImageUpload(null);
  };

  return (
    <div className="image-uploader">
      <div className="upload-area">
        {!selectedImage ? (
          <div
            className="upload-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
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

      <div className="image-options">
        <button
          className="btn btn-secondary"
          onClick={handleUseDefault}
          disabled={!selectedImage}
        >
          {t('useDefault', language)}
        </button>
      </div>
    </div>
  );
};

export default ImageUploader; 