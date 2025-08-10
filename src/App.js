import React, { useState, useEffect } from 'react';
import './styles/App.css';
import Game from './components/Game';
import Header from './components/Header';
import { getStoredLanguage } from './utils/translations';
import { getStoredTheme, applyTheme, setupSystemThemeListener } from './utils/themeUtils';

function App() {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'completed'
  const [language, setLanguage] = useState('ru');
  const [theme, setTheme] = useState('system');

  // Загружаем сохраненные настройки при инициализации
  useEffect(() => {
    const storedLanguage = getStoredLanguage();
    const storedTheme = getStoredTheme();
    
    setLanguage(storedLanguage);
    setTheme(storedTheme);
    
    // Применяем тему
    applyTheme(storedTheme);
    
    // Настраиваем слушатель изменений системной темы
    const cleanup = setupSystemThemeListener(() => {
      if (storedTheme === 'system') {
        applyTheme('system');
      }
    });
    
    return cleanup;
  }, []);

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <div className="App" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Header 
        language={language}
      />
      <main className="main-content">
        <Game 
          gameState={gameState} 
          setGameState={setGameState}
          language={language}
          theme={theme}
          onThemeChange={handleThemeChange}
          onLanguageChange={handleLanguageChange}
        />
      </main>
    </div>
  );
}

export default App; 