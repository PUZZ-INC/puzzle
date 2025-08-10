import React, { useState, useEffect } from 'react';
import '../styles/Game.css';
import GameMenu from './GameMenu';
import PuzzleBoard from './PuzzleBoard';
import GameStats from './GameStats';
import ThemeSelector from './ThemeSelector';
import LanguageSelector from './LanguageSelector';
import BestResults from './BestResults';
import { createPuzzle, shufflePuzzle, isPuzzleCompleted } from '../utils/puzzleLogic';
import { createDefaultImage, splitImageIntoTiles, saveBestResult, extractDominantColor } from '../utils/imageUtils';
import { t } from '../utils/translations';

const Game = ({ gameState, setGameState, language, theme, onThemeChange, onLanguageChange }) => {
  const [puzzle, setPuzzle] = useState(null);
  const [imageTiles, setImageTiles] = useState([]);
  const [gameSettings, setGameSettings] = useState({
    size: 3,
    difficulty: 'medium',
    customImage: null
  });
  const [gameStats, setGameStats] = useState({
    moves: 0,
    startTime: null,
    elapsedTime: 0,
    isCompleted: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showBestResults, setShowBestResults] = useState(false);
  const [backgroundStyle, setBackgroundStyle] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleDropdownOpen = (dropdownType) => {
    if (openDropdown === dropdownType) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(null);
    }
  };

  // Инициализация игры
  const initializeGame = async (settings) => {
    console.log('Game: initializeGame called with settings:', settings);
    setIsLoading(true);
    
    try {
      // Создаем головоломку
      const newPuzzle = createPuzzle(settings.size);
      
      // Загружаем или создаем изображение
      let image;
      if (settings.customImage) {
        console.log('Game: Using custom image:', settings.customImage);
        image = settings.customImage;
        // Если у изображения есть serverUrl, используем его для загрузки
        if (settings.customImage.serverUrl) {
          console.log('Game: Loading image from server URL:', settings.customImage.serverUrl);
          const serverImage = new Image();
          serverImage.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            serverImage.onload = resolve;
            serverImage.onerror = reject;
            serverImage.src = settings.customImage.serverUrl;
          });
          image = serverImage;
        }
      } else {
        console.log('Game: Creating default image');
        image = await createDefaultImage(settings.size);
      }
      
      // Разделяем изображение на плитки
      const tiles = await splitImageIntoTiles(image, settings.size);
      
      // Извлекаем доминирующий цвет для фона
      const dominantColor = await extractDominantColor(image);
      setBackgroundStyle({
        backgroundColor: dominantColor.dark,
        backgroundImage: `radial-gradient(circle at 30% 70%, ${dominantColor.rgba} 0%, transparent 50%)`,
      });
      
      // Сразу перемешиваем головоломку
      const shuffledPuzzle = shufflePuzzle(newPuzzle, settings.difficulty);
      
      setPuzzle(shuffledPuzzle);
      setImageTiles(tiles);
      setGameSettings(settings);
      setGameStats({
        moves: 0,
        startTime: Date.now(),
        elapsedTime: 0,
        isCompleted: false
      });
      setGameState('playing');
    } catch (error) {
      console.error('Ошибка инициализации игры:', error);
      alert('Ошибка при загрузке изображения. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  // Перемешивание во время игры
  const reshuffleGame = () => {
    if (!puzzle) return;
    
    const shuffledPuzzle = shufflePuzzle(puzzle, gameSettings.difficulty);
    setPuzzle(shuffledPuzzle);
    setGameStats(prev => ({
      ...prev,
      startTime: Date.now(),
      moves: 0,
      elapsedTime: 0,
      isCompleted: false
    }));
  };

  // Обработка хода
  const handleTileClick = (tileIndex) => {
    if (!puzzle || gameStats.isCompleted) return;
    
    const newPuzzle = { ...puzzle };
    const { size, emptyIndex } = newPuzzle;
    
    // Проверяем, можно ли переместить плитку
    const row = Math.floor(tileIndex / size);
    const col = tileIndex % size;
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;
    
    const canMove = (
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow)
    );
    
    if (canMove) {
      // Перемещаем плитку
      const newTiles = [...newPuzzle.tiles];
      const temp = newTiles[tileIndex];
      newTiles[tileIndex] = newTiles[emptyIndex];
      newTiles[emptyIndex] = temp;
      
      newPuzzle.tiles = newTiles;
      newPuzzle.emptyIndex = tileIndex;
      
      setPuzzle(newPuzzle);
      
      // Обновляем статистику
      setGameStats(prev => ({
        ...prev,
        moves: prev.moves + 1
      }));
      
      // Проверяем завершение
      if (isPuzzleCompleted(newPuzzle)) {
        const finalTime = Date.now() - gameStats.startTime;
        const finalMoves = gameStats.moves + 1;
        
        // Обновляем статистику с финальным временем
        setGameStats(prev => ({
          ...prev,
          moves: finalMoves,
          elapsedTime: finalTime,
          isCompleted: true
        }));
        
        // Сохраняем лучший результат
        const isNewRecord = saveBestResult(gameSettings.size, gameSettings.difficulty, finalTime, finalMoves);
        
        if (isNewRecord) {
          setTimeout(() => {
            alert(t('newRecord', language));
          }, 500);
        }
      }
    }
  };

  // Сброс игры
  const resetGame = () => {
    setGameState('menu');
    setPuzzle(null);
    setImageTiles([]);
    setGameStats({
      moves: 0,
      startTime: null,
      elapsedTime: 0,
      isCompleted: false
    });
  };

  // Обновление времени
  useEffect(() => {
    let interval;
    if (gameStats.startTime && !gameStats.isCompleted) {
      interval = setInterval(() => {
        setGameStats(prev => ({
          ...prev,
          elapsedTime: Date.now() - prev.startTime
        }));
      }, 100); // Обновляем чаще для более точного отображения
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStats.startTime, gameStats.isCompleted]);

  // Рендер компонентов в зависимости от состояния игры
  if (gameState === 'menu') {
    return (
      <div className="game-layout fade-in">
        <div className="game-sidebar">
          <div className="sidebar-controls">

            <ThemeSelector 
              currentTheme={theme}
              onThemeChange={onThemeChange}
              language={language}
              onDropdownOpen={handleDropdownOpen}
            />
            <LanguageSelector 
              currentLanguage={language}
              onLanguageChange={onLanguageChange}
              onDropdownOpen={handleDropdownOpen}
            />
          </div>
        </div>
        
        <div className="game-container">
          {console.log('Game: Rendering GameMenu with onStartGame:', !!initializeGame)}
          <GameMenu 
            onStartGame={initializeGame}
            isLoading={isLoading}
            language={language}
          />
        </div>
      </div>
    );
  }

  if (gameState === 'playing' || gameState === 'completed') {
    return (
      <div className="game-container fade-in">
          <div className="game-header">
            <h2>{t('gameInProgress', language)}</h2>
            <GameStats 
              stats={gameStats}
              onReset={resetGame}
              size={gameSettings.size}
              difficulty={gameSettings.difficulty}
              language={language}
            />
            <div className="game-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowBestResults(true)}
              >
                {t('bestResults', language)}
              </button>
            </div>
          </div>
          
          <PuzzleBoard
            puzzle={puzzle}
            imageTiles={imageTiles}
            onTileClick={handleTileClick}
            isCompleted={gameStats.isCompleted}
            backgroundStyle={backgroundStyle}
            language={language}
            gameStats={gameStats}
          />
          
          <div className="game-controls">
            <button 
              className="btn btn-primary"
              onClick={reshuffleGame}
              disabled={isLoading || gameStats.isCompleted}
            >
              {t('reshuffle', language)}
            </button>
          </div>
          
          {gameStats.isCompleted && (
            <div className="completion-message">
              <h3>{t('congratulations', language)}</h3>
              <p>{t('puzzleCompleted', language, {
                time: Math.floor(gameStats.elapsedTime / 1000),
                moves: gameStats.moves
              })}</p>
              <div className="completion-actions">
                <button className="btn btn-primary" onClick={reshuffleGame}>
                  {t('playAgain', language)}
                </button>
                <button className="btn btn-secondary" onClick={resetGame}>
                  {t('mainMenu', language)}
                </button>
              </div>
            </div>
          )}
          
          <BestResults 
            isOpen={showBestResults}
            onClose={() => setShowBestResults(false)}
            language={language}
          />
        </div>
    );
  }

  return null;
};

export default Game; 