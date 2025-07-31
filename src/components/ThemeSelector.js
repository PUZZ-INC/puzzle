import React, { useState, useRef, useEffect } from 'react';
import '../styles/ThemeSelector.css';
import { THEMES, setStoredTheme } from '../utils/themeUtils';

const ThemeSelector = ({ currentTheme, onThemeChange, language, onDropdownOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen) {
        const themeSelector = event.target.closest('.theme-selector');
        if (!themeSelector) {
          setIsOpen(false);
          if (onDropdownOpen) {
            onDropdownOpen(null);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onDropdownOpen]);

  // Слушаем события открытия других dropdown'ов
  useEffect(() => {
    if (isOpen && onDropdownOpen) {
      onDropdownOpen('theme');
    }
  }, [isOpen, onDropdownOpen]);

  const handleThemeSelect = (theme) => {
    setStoredTheme(theme);
    onThemeChange(theme);
    setIsOpen(false);
  };

  const getThemeIcon = (theme) => {
    switch (theme) {
      case THEMES.DARK:
        return '🌙';
      case THEMES.LIGHT:
        return '☀️';
      case THEMES.SYSTEM:
        return '⚙️';
      case THEMES.BLUE:
        return '🔵';
      case THEMES.GREEN:
        return '🟢';
      case THEMES.PURPLE:
        return '🟣';
      case THEMES.SUNSET:
        return '🌅';
      default:
        return '🎨';
    }
  };

  const getThemeName = (theme) => {
    const themeNames = {
      [THEMES.DARK]: { ru: 'Темная', en: 'Dark', ar: 'داكن' },
      [THEMES.LIGHT]: { ru: 'Светлая', en: 'Light', ar: 'فاتح' },
      [THEMES.SYSTEM]: { ru: 'Системная', en: 'System', ar: 'النظام' },
      [THEMES.BLUE]: { ru: 'Синяя', en: 'Blue', ar: 'أزرق' },
      [THEMES.GREEN]: { ru: 'Зеленая', en: 'Green', ar: 'أخضر' },
      [THEMES.PURPLE]: { ru: 'Фиолетовая', en: 'Purple', ar: 'بنفسجي' },
      [THEMES.SUNSET]: { ru: 'Закат', en: 'Sunset', ar: 'غروب الشمس' }
    };
    return themeNames[theme]?.[language] || themeNames[theme]?.ru || theme;
  };

  const getThemePreview = (theme) => {
    const previews = {
      [THEMES.DARK]: 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)',
      [THEMES.LIGHT]: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
      [THEMES.SYSTEM]: 'linear-gradient(135deg, #666 0%, #999 100%)',
      [THEMES.BLUE]: 'linear-gradient(135deg, #0a1929 0%, #132f4c 100%)',
      [THEMES.GREEN]: 'linear-gradient(135deg, #0a1f0a 0%, #1a3d1a 100%)',
      [THEMES.PURPLE]: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)',
      [THEMES.SUNSET]: 'linear-gradient(135deg, #2d1b1b 0%, #4a2c2c 100%)'
    };
    return previews[theme] || previews[THEMES.DARK];
  };

  return (
    <div className="theme-selector" ref={dropdownRef}>
      <button
        className="theme-button"
        onClick={() => {
          const newState = !isOpen;
          setIsOpen(newState);
          if (onDropdownOpen) {
            onDropdownOpen(newState ? 'theme' : null);
          }
        }}
        aria-label="Выбрать тему"
      >
        <span className="theme-icon">{getThemeIcon(currentTheme)}</span>
        <span className="theme-label">{getThemeName(currentTheme)}</span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="theme-dropdown">
          {Object.values(THEMES).map((theme) => (
            <button
              key={theme}
              className={`theme-option ${currentTheme === theme ? 'active' : ''}`}
              onClick={() => handleThemeSelect(theme)}
            >
              <div 
                className="theme-preview"
                style={{ background: getThemePreview(theme) }}
              />
              <span className="theme-option-icon">{getThemeIcon(theme)}</span>
              <span className="theme-option-name">{getThemeName(theme)}</span>
              {currentTheme === theme && (
                <span className="theme-check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
      
      {isOpen && (
        <div 
          className="theme-overlay" 
          onClick={() => {
            setIsOpen(false);
            if (onDropdownOpen) {
              onDropdownOpen(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default ThemeSelector; 