import React, { useState, useEffect } from 'react';
import '../styles/LanguageSelector.css';
import { translations, saveLanguage } from '../utils/translations';

const LanguageSelector = ({ currentLanguage, onLanguageChange, onDropdownOpen }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageSelect = (languageCode) => {
    saveLanguage(languageCode);
    onLanguageChange(languageCode);
    setIsOpen(false);
    if (onDropdownOpen) {
      onDropdownOpen(null);
    }
  };

  // Слушаем события открытия других dropdown'ов
  useEffect(() => {
    if (isOpen && onDropdownOpen) {
      onDropdownOpen('language');
    }
  }, [isOpen, onDropdownOpen]);

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen) {
        const languageSelector = event.target.closest('.language-selector');
        if (!languageSelector) {
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

  const languageFlags = {
    ru: '🇷🇺',
    en: '🇺🇸',
    zh: '🇨🇳',
    hi: '🇮🇳',
    es: '🇪🇸',
    fr: '🇫🇷',
    ar: '🇸🇦',
    bn: '🇧🇩',
    pt: '🇧🇷',
    ja: '🇯🇵'
  };

  const currentLanguageName = translations[currentLanguage]?.languages[currentLanguage] || 'Русский';

  return (
    <div className="language-selector">
      <button 
        className="language-button"
        onClick={() => {
          const newState = !isOpen;
          setIsOpen(newState);
          if (onDropdownOpen) {
            onDropdownOpen(newState ? 'language' : null);
          }
        }}
        aria-label="Select language"
      >
        <span className="language-flag">{languageFlags[currentLanguage]}</span>
        <span className="language-name">{currentLanguageName}</span>
        <span className={`language-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="language-dropdown">
          {Object.keys(translations).map((languageCode) => (
            <button
              key={languageCode}
              className={`language-option ${currentLanguage === languageCode ? 'active' : ''}`}
              onClick={() => handleLanguageSelect(languageCode)}
            >
              <span className="language-flag">{languageFlags[languageCode]}</span>
              <span className="language-name">
                {translations[languageCode].languages[languageCode]}
              </span>
              {currentLanguage === languageCode && (
                <span className="check-mark">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
      
      {isOpen && (
        <div 
          className="language-overlay" 
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

export default LanguageSelector; 