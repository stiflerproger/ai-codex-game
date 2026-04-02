const BOARD_SIZE = 3;
const EMPTY_CELL = "";
const PLAYERS = ["X", "O"];
const WINS_TO_FINISH = 3;

const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const scoreXElement = document.getElementById("score-x");
const scoreOElement = document.getElementById("score-o");
const resetRoundButton = document.getElementById("reset-round");
const resetMatchButton = document.getElementById("reset-match");
const modeHumanButton = document.getElementById("mode-human");
const modeBotButton = document.getElementById("mode-bot");
const toggleSoundButton = document.getElementById("toggle-sound");

const board = Array.from({ length: BOARD_SIZE }, () =>
  Array(BOARD_SIZE).fill(EMPTY_CELL)
);

const score = {
  X: 0,
  O: 0,
};

let currentPlayerIndex = 0;
let matchFinished = false;
let gameMode = "human";
let botMoveTimeoutId = null;
let soundEnabled = true;
let audioContext = null;

const STATUS_MESSAGES = {
  botTurn: "Ход бота O",
  humanTurn: (player) => `Ход игрока ${player}`,
  userTurnVsBot: (player) => `Ваш ход: ${player}`,
  botModeSelected: "Режим: игра против бота",
  humanModeSelected: "Режим: 2 игрока",
  matchResetBot: "Матч сброшен. Ваш ход",
  matchResetHuman: "Матч сброшен. Ход X",
  roundResetBot: "Раунд сброшен. Ваш ход",
  roundResetHuman: "Раунд сброшен. Ход X",
  draw: "Ничья. Новый раунд",
  roundWin: (player) => `Раунд за ${player}. Новый раунд`,
  matchWinHuman: (player, xScore, oScore) =>
    `Матч за ${player}. Счет ${xScore}:${oScore}`,
  matchWinBot: (xScore, oScore) => `Матч за ботом. Счет ${xScore}:${oScore}`,
};

function getCurrentPlayer() {
  return PLAYERS[currentPlayerIndex];
}

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    audioContext = new AudioContextClass();
  }

  return audioContext;
}

async function unlockAudio() {
  const context = getAudioContext();

  if (!context) {
    return null;
  }

  if (context.state === "suspended") {
    await context.resume();
  }

  return context;
}

function playTone({
  frequency,
  duration,
  type = "square",
  volume = 0.035,
  delay = 0,
}) {
  if (!soundEnabled) {
    return;
  }

  const context = getAudioContext();

  if (!context) {
    return;
  }

  const startAt = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

function playMoveSound(player) {
  playTone({
    frequency: player === "X" ? 520 : 420,
    duration: 0.12,
    type: player === "X" ? "square" : "triangle",
    volume: 0.04,
  });
}

function playWinSound() {
  playTone({ frequency: 523.25, duration: 0.12, delay: 0 });
  playTone({ frequency: 659.25, duration: 0.12, delay: 0.12 });
  playTone({ frequency: 783.99, duration: 0.2, delay: 0.24, volume: 0.05 });
}

function playDrawSound() {
  playTone({ frequency: 330, duration: 0.12, delay: 0, type: "sawtooth" });
  playTone({ frequency: 294, duration: 0.12, delay: 0.12, type: "sawtooth" });
}

function playResetSound() {
  playTone({ frequency: 460, duration: 0.08, delay: 0 });
  playTone({ frequency: 360, duration: 0.08, delay: 0.08 });
}

function playModeSound() {
  playTone({ frequency: 620, duration: 0.08, delay: 0 });
  playTone({ frequency: 740, duration: 0.08, delay: 0.08 });
}

function isBotTurn() {
  return gameMode === "bot" && getCurrentPlayer() === "O";
}

function clearBotTimeout() {
  if (botMoveTimeoutId !== null) {
    window.clearTimeout(botMoveTimeoutId);
    botMoveTimeoutId = null;
  }
}

function renderBoard() {
  const cells = boardElement.querySelectorAll(".cell");

  cells.forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    cell.textContent = board[row][col];
    cell.disabled =
      matchFinished || isBotTurn() || board[row][col] !== EMPTY_CELL;
  });
}

function renderScore() {
  scoreXElement.textContent = String(score.X);
  scoreOElement.textContent = String(score.O);
}

function setStatus(message) {
  statusElement.textContent = message;
}

function updateSoundButton() {
  toggleSoundButton.textContent = `Звук: ${soundEnabled ? "ON" : "OFF"}`;
}

function updateModeButtons() {
  modeHumanButton.classList.toggle("active", gameMode === "human");
  modeBotButton.classList.toggle("active", gameMode === "bot");
}

function resetBoard() {
  clearBotTimeout();

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      board[row][col] = EMPTY_CELL;
    }
  }

  currentPlayerIndex = 0;
  renderBoard();
}

function startRound(message) {
  resetBoard();

  if (message) {
    setStatus(message);
    window.setTimeout(() => {
      if (!matchFinished) {
        setTurnStatus();
        scheduleBotMoveIfNeeded();
      }
    }, 1200);
    return;
  }

  setTurnStatus();
  scheduleBotMoveIfNeeded();
}

function hasWinner(symbol) {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    if (board[row].every((cell) => cell === symbol)) {
      return true;
    }
  }

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    let columnWin = true;

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      if (board[row][col] !== symbol) {
        columnWin = false;
        break;
      }
    }

    if (columnWin) {
      return true;
    }
  }

  let mainDiagonalWin = true;
  let secondaryDiagonalWin = true;

  for (let index = 0; index < BOARD_SIZE; index += 1) {
    if (board[index][index] !== symbol) {
      mainDiagonalWin = false;
    }

    if (board[index][BOARD_SIZE - 1 - index] !== symbol) {
      secondaryDiagonalWin = false;
    }
  }

  return mainDiagonalWin || secondaryDiagonalWin;
}

function isDraw() {
  return board.every((row) => row.every((cell) => cell !== EMPTY_CELL));
}

function finishMatch(winner) {
  clearBotTimeout();
  matchFinished = true;
  renderBoard();
  playWinSound();
  setStatus(
    gameMode === "bot" && winner === "O"
      ? STATUS_MESSAGES.matchWinBot(score.X, score.O)
      : STATUS_MESSAGES.matchWinHuman(winner, score.X, score.O)
  );
}

function getEmptyCells() {
  const emptyCells = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (board[row][col] === EMPTY_CELL) {
        emptyCells.push({ row, col });
      }
    }
  }

  return emptyCells;
}

function pickBotMove() {
  const emptyCells = getEmptyCells();
  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  return emptyCells[randomIndex];
}

function setTurnStatus() {
  if (isBotTurn()) {
    setStatus(STATUS_MESSAGES.botTurn);
    return;
  }

  if (gameMode === "bot") {
    setStatus(STATUS_MESSAGES.userTurnVsBot(getCurrentPlayer()));
    return;
  }

  setStatus(STATUS_MESSAGES.humanTurn(getCurrentPlayer()));
}

function scheduleBotMoveIfNeeded() {
  renderBoard();

  if (!isBotTurn() || matchFinished) {
    return;
  }

  clearBotTimeout();
  botMoveTimeoutId = window.setTimeout(() => {
    botMoveTimeoutId = null;
    const move = pickBotMove();

    if (move) {
      makeMove(move.row, move.col);
    }
  }, 500);
}

function makeMove(row, col) {
  if (matchFinished || board[row][col] !== EMPTY_CELL) {
    return;
  }

  clearBotTimeout();

  const currentPlayer = getCurrentPlayer();
  board[row][col] = currentPlayer;
  playMoveSound(currentPlayer);
  renderBoard();

  if (hasWinner(currentPlayer)) {
    score[currentPlayer] += 1;
    renderScore();

    if (score[currentPlayer] === WINS_TO_FINISH) {
      finishMatch(currentPlayer);
      return;
    }

    startRound(STATUS_MESSAGES.roundWin(currentPlayer));
    return;
  }

  if (isDraw()) {
    playDrawSound();
    startRound(STATUS_MESSAGES.draw);
    return;
  }

  currentPlayerIndex = (currentPlayerIndex + 1) % PLAYERS.length;
  setTurnStatus();
  scheduleBotMoveIfNeeded();
}

function createBoard() {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cell";
      button.dataset.row = String(row);
      button.dataset.col = String(col);
      button.setAttribute("aria-label", `Клетка ${row + 1}, ${col + 1}`);
      button.addEventListener("click", () => makeMove(row, col));
      boardElement.appendChild(button);
    }
  }
}

function setGameMode(mode) {
  clearBotTimeout();
  gameMode = mode;
  matchFinished = false;
  score.X = 0;
  score.O = 0;
  playModeSound();
  renderScore();
  updateModeButtons();
  startRound(
    mode === "bot"
      ? STATUS_MESSAGES.botModeSelected
      : STATUS_MESSAGES.humanModeSelected
  );
}

function resetMatch() {
  score.X = 0;
  score.O = 0;
  matchFinished = false;
  playResetSound();
  renderScore();
  startRound(
    gameMode === "bot"
      ? STATUS_MESSAGES.matchResetBot
      : STATUS_MESSAGES.matchResetHuman
  );
}

resetRoundButton.addEventListener("click", () => {
  if (matchFinished) {
    return;
  }

  playResetSound();
  startRound(
    gameMode === "bot"
      ? STATUS_MESSAGES.roundResetBot
      : STATUS_MESSAGES.roundResetHuman
  );
});

resetMatchButton.addEventListener("click", resetMatch);
modeHumanButton.addEventListener("click", async () => {
  await unlockAudio();
  setGameMode("human");
});
modeBotButton.addEventListener("click", async () => {
  await unlockAudio();
  setGameMode("bot");
});
toggleSoundButton.addEventListener("click", async () => {
  await unlockAudio();
  soundEnabled = !soundEnabled;
  updateSoundButton();

  if (soundEnabled) {
    playTone({ frequency: 680, duration: 0.08 });
  }
});

boardElement.addEventListener("pointerdown", unlockAudio, { once: true });
resetRoundButton.addEventListener("pointerdown", unlockAudio, { once: true });
resetMatchButton.addEventListener("pointerdown", unlockAudio, { once: true });

createBoard();
renderScore();
updateModeButtons();
updateSoundButton();
startRound();
