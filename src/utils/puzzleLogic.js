// Создание начального состояния головоломки
export const createPuzzle = (size) => {
  const totalTiles = size * size;
  const tiles = Array.from({ length: totalTiles - 1 }, (_, i) => i + 1);
  tiles.push(0); // 0 представляет пустую плитку
  
  return {
    tiles: tiles,
    size: size,
    emptyIndex: totalTiles - 1,
    isCompleted: false
  };
};

// Проверка, можно ли переместить плитку
export const canMoveTile = (puzzle, tileIndex) => {
  const { size, emptyIndex } = puzzle;
  const row = Math.floor(tileIndex / size);
  const col = tileIndex % size;
  const emptyRow = Math.floor(emptyIndex / size);
  const emptyCol = emptyIndex % size;
  
  // Плитка может быть перемещена, если она находится рядом с пустой плиткой
  return (
    (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
    (Math.abs(col - emptyCol) === 1 && row === emptyRow)
  );
};

// Перемещение плитки
export const moveTile = (puzzle, tileIndex) => {
  if (!canMoveTile(puzzle, tileIndex)) {
    return puzzle;
  }
  
  const newTiles = [...puzzle.tiles];
  const temp = newTiles[tileIndex];
  newTiles[tileIndex] = newTiles[puzzle.emptyIndex];
  newTiles[puzzle.emptyIndex] = temp;
  
  return {
    ...puzzle,
    tiles: newTiles,
    emptyIndex: tileIndex
  };
};

// Проверка завершения головоломки
export const isPuzzleCompleted = (puzzle) => {
  const { tiles, size } = puzzle;
  const totalTiles = size * size;
  
  for (let i = 0; i < totalTiles - 1; i++) {
    if (tiles[i] !== i + 1) {
      return false;
    }
  }
  
  return tiles[totalTiles - 1] === 0;
};

// Перемешивание головоломки с гарантией решаемости
export const shufflePuzzle = (puzzle, difficulty = 'medium') => {
  const { size } = puzzle;
  let shuffledPuzzle = { ...puzzle };
  
  // Определяем количество ходов для перемешивания в зависимости от сложности
  const shuffleMoves = {
    'easy': size * 15,
    'medium': size * 30,
    'hard': size * 60
  };
  
  const moves = shuffleMoves[difficulty] || shuffleMoves.medium;
  
  // Перемешиваем с гарантией решаемости
  for (let i = 0; i < moves; i++) {
    const currentPuzzle = { ...shuffledPuzzle };
    const movableTiles = currentPuzzle.tiles
      .map((tile, index) => ({ tile, index }))
      .filter(({ index }) => canMoveTile(currentPuzzle, index));
    
    if (movableTiles.length > 0) {
      const randomTile = movableTiles[Math.floor(Math.random() * movableTiles.length)];
      const newPuzzle = moveTile(currentPuzzle, randomTile.index);
      
      // Проверяем решаемость после каждого хода
      if (isSolvable(newPuzzle)) {
        shuffledPuzzle = newPuzzle;
      }
    }
  }
  
  // Если головоломка не решаема, делаем дополнительные ходы
  let attempts = 0;
  while (!isSolvable(shuffledPuzzle) && attempts < 100) {
    const currentPuzzle = { ...shuffledPuzzle };
    const movableTiles = currentPuzzle.tiles
      .map((tile, index) => ({ tile, index }))
      .filter(({ index }) => canMoveTile(currentPuzzle, index));
    
    if (movableTiles.length > 0) {
      const randomTile = movableTiles[Math.floor(Math.random() * movableTiles.length)];
      shuffledPuzzle = moveTile(currentPuzzle, randomTile.index);
    }
    attempts++;
  }
  
  return shuffledPuzzle;
};

// Проверка решаемости головоломки
export const isSolvable = (puzzle) => {
  const { tiles, size } = puzzle;
  let inversions = 0;
  
  // Подсчет инверсий
  for (let i = 0; i < tiles.length - 1; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i] !== 0 && tiles[j] !== 0 && tiles[i] > tiles[j]) {
        inversions++;
      }
    }
  }
  
  // Для головоломки 3x3: количество инверсий должно быть четным
  if (size % 2 === 1) {
    return inversions % 2 === 0;
  }
  
  // Для головоломки 4x4: количество инверсий + позиция пустой плитки должна быть четной
  const emptyRow = Math.floor(puzzle.emptyIndex / size);
  return (inversions + emptyRow) % 2 === 0;
};

// Получение координат плитки для отображения
export const getTilePosition = (index, size) => {
  const row = Math.floor(index / size);
  const col = index % size;
  return { row, col };
};

// Получение индекса по координатам
export const getTileIndex = (row, col, size) => {
  return row * size + col;
}; 