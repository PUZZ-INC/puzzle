import React, { useState } from 'react';
import '../styles/GameMenu.css';
import ImageUploader from './ImageUploader';
import BestResults from './BestResults';
import { t } from '../utils/translations';

const GameMenu = ({ onStartGame, isLoading, language }) => {
  const [settings, setSettings] = useState({
    size: 3,
    difficulty: 'medium',
    customImage: null
  });
  const [showBestResults, setShowBestResults] = useState(false);

  const handleSizeChange = (size) => {
    setSettings(prev => ({ ...prev, size: parseInt(size) }));
  };

  const handleDifficultyChange = (difficulty) => {
    setSettings(prev => ({ ...prev, difficulty }));
  };

  const handleImageUpload = (image) => {
    setSettings(prev => ({ ...prev, customImage: image }));
  };

  const handleStartGame = () => {
    onStartGame(settings);
  };

  const difficultyLabels = {
    easy: t('easy', language),
    medium: t('medium', language),
    hard: t('hard', language)
  };

  const difficultyDescriptions = {
    easy: t('easyDesc', language),
    medium: t('mediumDesc', language),
    hard: t('hardDesc', language)
  };

  return (
    <div className="game-menu">
      <h2 className="menu-title">{t('gameSettings', language)}</h2>
      
      <div className="menu-section">
        <h3>{t('fieldSize', language)}</h3>
        <div className="size-options">
          {[3, 4, 5, 6, 7].map(size => (
            <button
              key={size}
              className={`size-option ${settings.size === size ? 'active' : ''}`}
              onClick={() => handleSizeChange(size)}
            >
              {size}×{size}
            </button>
          ))}
        </div>
      </div>

      <div className="menu-section">
        <h3>{t('difficulty', language)}</h3>
        <div className="difficulty-options">
          {Object.entries(difficultyLabels).map(([key, label]) => (
            <div
              key={key}
              className={`difficulty-option ${settings.difficulty === key ? 'active' : ''}`}
              onClick={() => handleDifficultyChange(key)}
            >
              <div className="difficulty-header">
                <span className="difficulty-label">{label}</span>
                <span className="difficulty-indicator">
                  {settings.difficulty === key ? '✓' : ''}
                </span>
              </div>
              <p className="difficulty-description">
                {difficultyDescriptions[key]}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="menu-section">
        <h3>{t('image', language)}</h3>
        <ImageUploader onImageUpload={handleImageUpload} language={language} />
      </div>

      <div className="menu-actions">
        <button
          className="btn btn-primary start-game-btn"
          onClick={handleStartGame}
          disabled={isLoading}
        >
          {isLoading ? t('loading', language) : t('startGame', language)}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowBestResults(true)}
        >
          {t('bestResults', language)}
        </button>
      </div>

      <div className="game-instructions">
        <h3>{t('howToPlay', language)}</h3>
        <ul>
          <li>{t('instruction1', language)}</li>
          <li>{t('instruction2', language)}</li>
          <li>{t('instruction3', language)}</li>
          <li>{t('instruction4', language)}</li>
        </ul>
      </div>
      
      <BestResults 
        isOpen={showBestResults}
        onClose={() => setShowBestResults(false)}
        language={language}
      />
    </div>
  );
};

export default GameMenu; 