import React, { useState, useEffect } from 'react';
import '../styles/BestResults.css';
import { getAllBestResults, clearAllBestResults } from '../utils/imageUtils';
import { t } from '../utils/translations';

const BestResults = ({ isOpen, onClose, language = 'ru' }) => {
  const [results, setResults] = useState({});

  useEffect(() => {
    if (isOpen) {
      setResults(getAllBestResults());
    }
  }, [isOpen]);

  const handleClearResults = () => {
    if (window.confirm(t('clearResults', language) + '?')) {
      if (clearAllBestResults()) {
        setResults({});
      }
    }
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const difficultyLabels = {
    easy: t('easy', language),
    medium: t('medium', language),
    hard: t('hard', language)
  };

  if (!isOpen) return null;

  return (
    <div className="best-results-overlay" onClick={onClose}>
      <div className="best-results-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('bestResultsTitle', language)}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {Object.keys(results).length === 0 ? (
            <div className="no-results">
              <p>{t('noResults', language)}</p>
              <p>{t('playToSetRecords', language)}</p>
            </div>
          ) : (
            <div className="results-grid">
              {Object.entries(results).map(([size, difficulties]) => (
                <div key={size} className="size-section">
                  <h3>{size}×{size}</h3>
                  <div className="difficulty-results">
                    {Object.entries(difficulties).map(([difficulty, result]) => (
                      <div key={difficulty} className="result-item">
                        <div className="difficulty-label">
                          {difficultyLabels[difficulty]}
                        </div>
                        <div className="result-details">
                          <div className="result-time">
                            ⏱️ {formatTime(result.time)}
                          </div>
                          <div className="result-moves">
                            👆 {result.moves} ходов
                          </div>
                          <div className="result-date">
                            📅 {formatDate(result.date)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {Object.keys(results).length > 0 && (
            <div className="modal-actions">
              <button 
                className="clear-results-btn"
                onClick={handleClearResults}
              >
                {t('clearResults', language)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BestResults; 