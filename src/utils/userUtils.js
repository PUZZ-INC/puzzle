// Утилиты для работы с данными пользователя

// Получение данных пользователя из URL параметров или localStorage
export const getUserData = () => {
  // Сначала проверяем URL параметры (если пользователь пришел с Django)
  const urlParams = new URLSearchParams(window.location.search);
  const username = urlParams.get('username');
  const email = urlParams.get('email');
  
  if (username) {
    const avatar = urlParams.get('avatar');
    const userData = {
      username,
      email: email || null,
      avatar: avatar || null
    };
    
    // Сохраняем в localStorage
    localStorage.setItem('userData', JSON.stringify(userData));
    return userData;
  }
  
  // Если нет URL параметров, берем из localStorage
  const storedUser = localStorage.getItem('userData');
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }
  
  return null;
};

// Проверка авторизации пользователя
export const isUserAuthenticated = () => {
  return getUserData() !== null;
};

// Очистка данных пользователя
export const clearUserData = () => {
  localStorage.removeItem('userData');
};

// Обновление данных пользователя
export const updateUserData = (newData) => {
  const currentData = getUserData() || {};
  const updatedData = { ...currentData, ...newData };
  localStorage.setItem('userData', JSON.stringify(updatedData));
  return updatedData;
};

// Синхронизация с Django (проверка сессии)
export const syncWithDjango = async () => {
  try {
    // Здесь можно добавить API запрос к Django для проверки сессии
    // Пока просто возвращаем текущие данные
    return getUserData();
  } catch (error) {
    console.error('Error syncing with Django:', error);
    return null;
  }
}; 