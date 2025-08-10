// Разделение изображения на плитки
export const splitImageIntoTiles = (image, size) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Определяем оптимальный размер для плиток
    // Используем размер, который будет хорошо масштабироваться
    const optimalSize = Math.min(400, Math.max(200, Math.min(image.width, image.height)));
    const tileSize = optimalSize / size;
    
    // Устанавливаем размер canvas
    canvas.width = optimalSize;
    canvas.height = optimalSize;
    
    // Рисуем изображение на canvas с оптимальным размером
    ctx.drawImage(image, 0, 0, optimalSize, optimalSize);
    
    const tiles = [];
    
    // Разрезаем изображение на плитки
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const tileCanvas = document.createElement('canvas');
        const tileCtx = tileCanvas.getContext('2d');
        
        tileCanvas.width = tileSize;
        tileCanvas.height = tileSize;
        
        // Вырезаем часть изображения
        tileCtx.drawImage(
          canvas,
          col * tileSize,
          row * tileSize,
          tileSize,
          tileSize,
          0,
          0,
          tileSize,
          tileSize
        );
        
        tiles.push(tileCanvas.toDataURL());
      }
    }
    
    resolve(tiles);
  });
};

// Загрузка изображения из файла
export const loadImageFromFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Файл не выбран'));
      return;
    }
    
    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      reject(new Error('Выбранный файл не является изображением'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        resolve(img);
      };
      
      img.onerror = () => {
        reject(new Error('Ошибка загрузки изображения'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Ошибка чтения файла'));
    };
    
    reader.readAsDataURL(file);
  });
};

// Обрезка изображения в квадрат
export const cropImageToSquare = (image, size = 400) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = size;
    canvas.height = size;
    
    // Вычисляем размеры для обрезки
    const minDimension = Math.min(image.width, image.height);
    const sourceX = (image.width - minDimension) / 2;
    const sourceY = (image.height - minDimension) / 2;
    
    // Рисуем обрезанное изображение
    ctx.drawImage(
      image,
      sourceX, sourceY, minDimension, minDimension,
      0, 0, size, size
    );
    
    const croppedImage = new Image();
    croppedImage.onload = () => {
      resolve(croppedImage);
    };
    
    croppedImage.src = canvas.toDataURL();
  });
};

// Изменение размера изображения
export const resizeImage = (image, maxWidth, maxHeight) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    let { width, height } = image;
    
    // Вычисляем новые размеры, сохраняя пропорции
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Рисуем изображение с новым размером
    ctx.drawImage(image, 0, 0, width, height);
    
    const resizedImage = new Image();
    resizedImage.onload = () => {
      resolve(resizedImage);
    };
    
    resizedImage.src = canvas.toDataURL();
  });
};

// Создание стандартного изображения
export const createDefaultImage = (size) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const width = 400;
    const height = 400;
    
    canvas.width = width;
    canvas.height = height;
    
    // Создаем градиентный фон
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#4CAF50');
    gradient.addColorStop(0.5, '#2196F3');
    gradient.addColorStop(1, '#9C27B0');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Добавляем узор
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < size; i++) {
      const x = (i + 1) * (width / (size + 1));
      const y = (i + 1) * (height / (size + 1));
      
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, 2 * Math.PI);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(i + 1, x, y + 5);
    }
    
    const defaultImage = new Image();
    defaultImage.onload = () => {
      resolve(defaultImage);
    };
    
    defaultImage.src = canvas.toDataURL();
  });
};

// Сохранение изображения в localStorage
export const saveImageToStorage = (key, imageData) => {
  try {
    localStorage.setItem(key, imageData);
    return true;
  } catch (error) {
    console.error('Ошибка сохранения изображения:', error);
    return false;
  }
};

// Загрузка изображения из localStorage
export const loadImageFromStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Ошибка загрузки изображения:', error);
    return null;
  }
};

// Сохранение лучших результатов
export const saveBestResult = (size, difficulty, time, moves) => {
  try {
    const key = `bestResult_${size}_${difficulty}`;
    const existing = localStorage.getItem(key);
    const result = { time, moves, date: new Date().toISOString() };
    
    if (!existing || time < JSON.parse(existing).time) {
      localStorage.setItem(key, JSON.stringify(result));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Ошибка сохранения результата:', error);
    return false;
  }
};

// Загрузка лучших результатов
export const loadBestResult = (size, difficulty) => {
  try {
    const key = `bestResult_${size}_${difficulty}`;
    const result = localStorage.getItem(key);
    return result ? JSON.parse(result) : null;
  } catch (error) {
    console.error('Ошибка загрузки результата:', error);
    return null;
  }
};

// Получение всех лучших результатов
export const getAllBestResults = () => {
  try {
    const results = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bestResult_')) {
        const [, size, difficulty] = key.split('_');
        if (!results[size]) results[size] = {};
        results[size][difficulty] = JSON.parse(localStorage.getItem(key));
      }
    }
    return results;
  } catch (error) {
    console.error('Ошибка загрузки всех результатов:', error);
    return {};
  }
};

// Удаление всех лучших результатов
export const clearAllBestResults = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bestResult_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error('Ошибка удаления результатов:', error);
    return false;
  }
};

// Создание размытого фона из изображения
export const createBlurredBackground = (image, blurAmount = 20) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 400;
    canvas.height = 400;
    
    // Рисуем изображение
    ctx.drawImage(image, 0, 0, 400, 400);
    
    // Применяем размытие через CSS filter
    ctx.filter = `blur(${blurAmount}px)`;
    ctx.globalAlpha = 0.3; // Делаем полупрозрачным
    ctx.drawImage(image, 0, 0, 400, 400);
    
    resolve(canvas.toDataURL());
  });
};

// Извлечение доминирующего цвета из изображения
export const extractDominantColor = (image) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Уменьшаем размер для быстрого анализа
    canvas.width = 50;
    canvas.height = 50;
    
    ctx.drawImage(image, 0, 0, 50, 50);
    
    const imageData = ctx.getImageData(0, 0, 50, 50);
    const data = imageData.data;
    
    let r = 0, g = 0, b = 0;
    let pixelCount = 0;
    
    // Анализируем каждый пиксель
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      pixelCount++;
    }
    
    // Вычисляем средний цвет
    r = Math.floor(r / pixelCount);
    g = Math.floor(g / pixelCount);
    b = Math.floor(b / pixelCount);
    
    // Затемняем цвет для фона
    const darkR = Math.floor(r * 0.3);
    const darkG = Math.floor(g * 0.3);
    const darkB = Math.floor(b * 0.3);
    
    resolve({
      original: `rgb(${r}, ${g}, ${b})`,
      dark: `rgb(${darkR}, ${darkG}, ${darkB})`,
      rgba: `rgba(${r}, ${g}, ${b}, 0.1)`
    });
  });
}; 