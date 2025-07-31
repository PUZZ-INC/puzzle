import React from 'react';
import '../styles/PuzzleBoard.css';
import { canMoveTile } from '../utils/puzzleLogic';
import { t } from '../utils/translations';

const PuzzleBoard = ({ puzzle, imageTiles, onTileClick, isCompleted, backgroundStyle = {}, language = 'ru', gameStats = null }) => {
  const { tiles, size } = puzzle;

  const handleTileClick = (tileIndex) => {
    if (isCompleted) return;
    onTileClick(tileIndex);
  };

  const renderTile = (tileValue, tileIndex) => {
    const isMovable = canMoveTile(puzzle, tileIndex);
    const isEmpty = tileValue === 0;
    
    if (isEmpty) {
      return (
        <div
          key={tileIndex}
          className="puzzle-tile empty-tile"
          style={{
            gridColumn: (tileIndex % size) + 1,
            gridRow: Math.floor(tileIndex / size) + 1,
            ...backgroundStyle
          }}
        >
          <div className="empty-tile-indicator">
            <span className="empty-icon">⬜</span>
          </div>
        </div>
      );
    }

    const imageIndex = tileValue - 1; // Индексы изображений начинаются с 0
    const imageUrl = imageTiles[imageIndex];

    return (
      <div
        key={tileIndex}
        className={`puzzle-tile ${isMovable ? 'movable' : ''} ${isCompleted ? 'completed' : ''}`}
        onClick={() => handleTileClick(tileIndex)}
        style={{
          gridColumn: (tileIndex % size) + 1,
          gridRow: Math.floor(tileIndex / size) + 1,
          backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {!imageUrl && (
          <span className="tile-number">{tileValue}</span>
        )}
      </div>
    );
  };

  return (
    <div className="puzzle-board-container">
      <div 
        className="puzzle-board"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
          background: backgroundStyle.backgroundColor || 'rgba(255, 255, 255, 0.1)',
          backgroundImage: backgroundStyle.backgroundImage || 'none'
        }}
      >
        {tiles.map((tile, index) => renderTile(tile, index))}
      </div>
      
      {isCompleted && (
        <div className="completion-overlay">
          <div className="completion-content">
            <span className="completion-icon">🎉</span>
            <p>{gameStats ? t('puzzleCompleted', language, {
              time: Math.floor(gameStats.elapsedTime / 1000),
              moves: gameStats.moves
            }) : t('puzzleCompleted', language)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PuzzleBoard; 