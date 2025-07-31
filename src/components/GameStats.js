import React from 'react';
import '../styles/GameStats.css';
import { t } from '../utils/translations';

const GameStats = ({ stats, onReset, size, difficulty, language = 'ru' }) => {
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-stats">
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-label">{t('time', language)}</div>
            <div className="stat-value">
              {stats.startTime ? formatTime(stats.elapsedTime) : '00:00'}
            </div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">👆</div>
          <div className="stat-content">
            <div className="stat-label">{t('moves', language)}</div>
            <div className="stat-value">{stats.moves}</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-label">{t('status', language)}</div>
            <div className="stat-value">
              {stats.isCompleted ? t('completed', language) : t('inProgress', language)}
            </div>
          </div>
        </div>

        {/* Лучший результат скрыт */}
      </div>

      <div className="stats-actions">
        <button className="btn btn-danger" onClick={onReset}>
          {t('newGame', language)}
        </button>
      </div>
    </div>
  );
};

export default GameStats; 