import React from 'react';
import '../styles/Header.css';
import UserProfile from './UserProfile';
import { t } from '../utils/translations';

const Header = ({ language }) => {
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
            <UserProfile language={language} />
          </div>
        </div>
        <p className="game-subtitle">{t('gameSubtitle', language)}</p>
      </div>
    </header>
  );
};

export default Header; 