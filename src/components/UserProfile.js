import React, { useState, useEffect } from 'react';
import '../styles/UserProfile.css';
import { getUserData, clearUserData } from '../utils/userUtils';

const UserProfile = ({ language }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Получаем данные пользователя из утилиты
    const user = getUserData();
    setUserData(user);
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    // Очищаем данные пользователя
    clearUserData();
    setUserData(null);
    setIsDropdownOpen(false);
    
    // Перенаправляем на главную страницу Django
    window.location.href = 'http://localhost:8000/';
  };

  const goToProfile = () => {
    // Перенаправляем на страницу профиля Django
    window.location.href = 'http://localhost:8000/accounts/profile/';
  };

  // Если пользователь не авторизован, показываем кнопку входа
  if (!userData) {
    return (
      <div className="user-profile">
        <a href="http://localhost:8000/accounts/login/" className="login-btn">
          <i className="fas fa-sign-in-alt"></i>
          <span>{language === 'ru' ? 'Войти' : 'Login'}</span>
        </a>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <div className="user-card" onClick={toggleDropdown}>
        <div className="user-avatar">
          {userData.avatar ? (
            <img src={userData.avatar} alt="Avatar" className="avatar-img" />
          ) : (
            <i className="fas fa-user"></i>
          )}
        </div>
        <div className="user-info">
          <div className="user-name">{userData.username || 'Пользователь'}</div>
        </div>
        <i className={`fas fa-chevron-down dropdown-arrow ${isDropdownOpen ? 'active' : ''}`}></i>
        
        {isDropdownOpen && (
          <div className="user-dropdown">
            <div className="dropdown-header">
              <div className="dropdown-user-name">{userData.username || 'Пользователь'}</div>
              {userData.email && (
                <div className="dropdown-user-email">{userData.email}</div>
              )}
            </div>
            <div className="dropdown-menu">
              <button onClick={goToProfile} className="dropdown-item">
                <i className="fas fa-user-circle"></i>
                <span>{language === 'ru' ? 'Мой профиль' : 'My Profile'}</span>
              </button>
              <button onClick={handleLogout} className="dropdown-item logout">
                <i className="fas fa-sign-out-alt"></i>
                <span>{language === 'ru' ? 'Выйти' : 'Logout'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 