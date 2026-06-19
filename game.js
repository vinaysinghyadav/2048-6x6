const SIZE = 6;
let board, score, best;

const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');

function init() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  score = 0;
  best = parseInt(localStorage.getItem('2048-6x6-best') || '0');
  gameOverEl.classList.remove('show');
  updateScore();
  spawnTile();
  spawnTile();
  render();
}

function spawnTile() {
  const empty = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (board[r][c] === 0) empty.push([r, c]);
  if (!empty.length) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function compress(row) {
  const nums = row.filter(v => v !== 0);
  const merged = [];
  let gained = 0;
  let i = 0;
  while (i < nums.length) {
    if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
      const val = nums[i] * 2;
      merged.push(val);
      gained += val;
      i += 2;
    } else {
      merged.push(nums[i]);
      i++;
    }
  }
  while (merged.length < SIZE) merged.push(0);
  return { row: merged, gained };
}

function move(dir) {
  let changed = false;
  let totalGained = 0;

  const rotated = (b) => b[0].map((_, c) => b.map(r => r[c]));
  const reversed = (b) => b.map(r => [...r].reverse());

  let b = board.map(r => [...r]);

  // Normalize: always compress left
  if (dir === 'right') b = reversed(b);
  if (dir === 'up') b = rotated(b);
  if (dir === 'down') b = reversed(rotated(b));

  b = b.map(row => {
    const { row: newRow, gained } = compress(row);
    if (newRow.join() !== row.join()) changed = true;
    totalGained += gained;
    return newRow;
  });

  // Denormalize
  if (dir === 'right') b = reversed(b);
  if (dir === 'up') b = rotated(rotated(rotated(b)));
  if (dir === 'down') b = rotated(rotated(rotated(reversed(b))));

  if (changed) {
    board = b;
    score += totalGained;
    if (score > best) {
      best = score;
      localStorage.setItem('2048-6x6-best', best);
    }
    updateScore();
    spawnTile();
    render();
    if (isGameOver()) showGameOver();
  }
}

function isGameOver() {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return false;
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return false;
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return false;
    }
  return true;
}

function showGameOver() {
  finalScoreEl.textContent = score;
  gameOverEl.classList.add('show');
}

function updateScore() {
  scoreEl.textContent = score;
  bestEl.textContent = best;
}

function tileClass(val) {
  if (val === 0) return 'tile tile-0';
  if (val > 8192) return 'tile tile-high';
  return `tile tile-${val}`;
}

function render() {
  boardEl.innerHTML = '';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const div = document.createElement('div');
      div.className = tileClass(board[r][c]);
      div.textContent = board[r][c] !== 0 ? board[r][c] : '';
      boardEl.appendChild(div);
    }
  }
}

// Keyboard controls
document.addEventListener('keydown', e => {
  const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
  if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
});

// Swipe controls
let touchStartX, touchStartY;
document.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
  else move(dy > 0 ? 'down' : 'up');
});

document.getElementById('new-game').addEventListener('click', init);
document.getElementById('restart').addEventListener('click', init);

init();
