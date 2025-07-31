// Утилиты для работы с темами

export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system',
  BLUE: 'blue',
  GREEN: 'green',
  PURPLE: 'purple',
  SUNSET: 'sunset'
};

// Получение системной темы
export const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark'; // По умолчанию темная тема
};

// Получение сохраненной темы
export const getStoredTheme = () => {
  try {
    return localStorage.getItem('theme') || THEMES.SYSTEM;
  } catch (error) {
    return THEMES.SYSTEM;
  }
};

// Сохранение темы
export const setStoredTheme = (theme) => {
  try {
    localStorage.setItem('theme', theme);
  } catch (error) {
    console.error('Ошибка сохранения темы:', error);
  }
};

// Получение активной темы (с учетом системных настроек)
export const getActiveTheme = (storedTheme) => {
  if (storedTheme === THEMES.SYSTEM) {
    return getSystemTheme();
  }
  return storedTheme;
};

// CSS переменные для разных тем
export const themeStyles = {
  [THEMES.DARK]: {
    '--bg-primary': '#121212',
    '--bg-secondary': '#1a1a1a',
    '--bg-gradient': 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)',
    '--text-primary': '#ffffff',
    '--text-secondary': '#b0b0b0',
    '--accent-color': '#4a9eff',
    '--accent-color-rgb': '74, 158, 255',
    '--border-color': 'rgba(255, 255, 255, 0.1)',
    '--shadow-color': 'rgba(0, 0, 0, 0.3)'
  },
  [THEMES.LIGHT]: {
    '--bg-primary': '#f5f5f5',
    '--bg-secondary': '#ffffff',
    '--bg-gradient': 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
    '--text-primary': '#333333',
    '--text-secondary': '#666666',
    '--accent-color': '#2196f3',
    '--accent-color-rgb': '33, 150, 243',
    '--border-color': 'rgba(0, 0, 0, 0.1)',
    '--shadow-color': 'rgba(0, 0, 0, 0.1)'
  },
  [THEMES.BLUE]: {
    '--bg-primary': '#0a1929',
    '--bg-secondary': '#132f4c',
    '--bg-gradient': 'linear-gradient(135deg, #0a1929 0%, #132f4c 100%)',
    '--text-primary': '#ffffff',
    '--text-secondary': '#b0b0b0',
    '--accent-color': '#4a9eff',
    '--accent-color-rgb': '74, 158, 255',
    '--border-color': 'rgba(74, 158, 255, 0.2)',
    '--shadow-color': 'rgba(0, 0, 0, 0.4)'
  },
  [THEMES.GREEN]: {
    '--bg-primary': '#0a1f0a',
    '--bg-secondary': '#1a3d1a',
    '--bg-gradient': 'linear-gradient(135deg, #0a1f0a 0%, #1a3d1a 100%)',
    '--text-primary': '#ffffff',
    '--text-secondary': '#b0b0b0',
    '--accent-color': '#4caf50',
    '--accent-color-rgb': '76, 175, 80',
    '--border-color': 'rgba(76, 175, 80, 0.2)',
    '--shadow-color': 'rgba(0, 0, 0, 0.4)'
  },
  [THEMES.PURPLE]: {
    '--bg-primary': '#1a0a2e',
    '--bg-secondary': '#2d1b4e',
    '--bg-gradient': 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)',
    '--text-primary': '#ffffff',
    '--text-secondary': '#b0b0b0',
    '--accent-color': '#9c27b0',
    '--accent-color-rgb': '156, 39, 176',
    '--border-color': 'rgba(156, 39, 176, 0.2)',
    '--shadow-color': 'rgba(0, 0, 0, 0.4)'
  },
  [THEMES.SUNSET]: {
    '--bg-primary': '#2d1b1b',
    '--bg-secondary': '#4a2c2c',
    '--bg-gradient': 'linear-gradient(135deg, #2d1b1b 0%, #4a2c2c 100%)',
    '--text-primary': '#ffffff',
    '--text-secondary': '#b0b0b0',
    '--accent-color': '#ff6b35',
    '--accent-color-rgb': '255, 107, 53',
    '--border-color': 'rgba(255, 107, 53, 0.2)',
    '--shadow-color': 'rgba(0, 0, 0, 0.4)'
  }
};

// Применение темы к документу
export const applyTheme = (theme) => {
  const activeTheme = getActiveTheme(theme);
  const styles = themeStyles[activeTheme];
  
  if (styles) {
    Object.entries(styles).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
    
    // Устанавливаем data-theme атрибут для CSS селекторов
    document.documentElement.setAttribute('data-theme', activeTheme);
  }
};

// Слушатель изменений системной темы
export const setupSystemThemeListener = (callback) => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => callback();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }
  return () => {};
}; 