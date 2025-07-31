import React, { useState } from 'react';
import '../styles/Header.css';
import LanguageSelector from './LanguageSelector';
import ThemeSelector from './ThemeSelector';
import { t } from '../utils/translations';

const Header = ({ language, onLanguageChange, theme, onThemeChange }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const handleDropdownOpen = (dropdownType) => {
    if (openDropdown === dropdownType) {
      // Если тот же dropdown уже открыт, закрываем его
      setOpenDropdown(null);
    } else {
      // Открываем новый dropdown, закрывая предыдущий
      setOpenDropdown(dropdownType);
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-top">
          <div className="header-left">
            <h1 className="game-title">
              <span className="puzzle-icon">🧩</span>
              {t('gameTitle', language)}
            </h1>
          </div>
          <div className="header-right">
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
        <p className="game-subtitle">{t('gameSubtitle', language)}</p>
      </div>
    </header>
  );
};

export default Header; 