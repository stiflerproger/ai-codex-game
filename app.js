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

const board = Array.from({ length: BOARD_SIZE }, () =>
  Array(BOARD_SIZE).fill(EMPTY_CELL)
);

const score = {
  X: 0,
  O: 0,
};

let currentPlayerIndex = 0;
let matchFinished = false;

function renderBoard() {
  const cells = boardElement.querySelectorAll(".cell");

  cells.forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    cell.textContent = board[row][col];
    cell.disabled = matchFinished || board[row][col] !== EMPTY_CELL;
  });
}

function renderScore() {
  scoreXElement.textContent = String(score.X);
  scoreOElement.textContent = String(score.O);
}

function setStatus(message) {
  statusElement.textContent = message;
}

function resetBoard() {
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
        setStatus(`Ход игрока ${PLAYERS[currentPlayerIndex]}`);
      }
    }, 1200);
    return;
  }

  setStatus(`Ход игрока ${PLAYERS[currentPlayerIndex]}`);
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
  matchFinished = true;
  renderBoard();
  setStatus(`Игрок ${winner} выиграл матч со счетом ${score.X}:${score.O}`);
}

function handleMove(row, col) {
  if (matchFinished || board[row][col] !== EMPTY_CELL) {
    return;
  }

  const currentPlayer = PLAYERS[currentPlayerIndex];
  board[row][col] = currentPlayer;
  renderBoard();

  if (hasWinner(currentPlayer)) {
    score[currentPlayer] += 1;
    renderScore();

    if (score[currentPlayer] === WINS_TO_FINISH) {
      finishMatch(currentPlayer);
      return;
    }

    startRound(`Игрок ${currentPlayer} выиграл раунд. Новый раунд начинается.`);
    return;
  }

  if (isDraw()) {
    startRound("Ничья. Очки не начисляются, начинается новый раунд.");
    return;
  }

  currentPlayerIndex = (currentPlayerIndex + 1) % PLAYERS.length;
  setStatus(`Ход игрока ${PLAYERS[currentPlayerIndex]}`);
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
      button.addEventListener("click", () => handleMove(row, col));
      boardElement.appendChild(button);
    }
  }
}

function resetMatch() {
  score.X = 0;
  score.O = 0;
  matchFinished = false;
  renderScore();
  startRound("Матч сброшен. Ход игрока X.");
}

resetRoundButton.addEventListener("click", () => {
  if (matchFinished) {
    return;
  }

  startRound("Раунд сброшен. Ход снова у игрока X.");
});

resetMatchButton.addEventListener("click", resetMatch);

createBoard();
renderScore();
startRound();
