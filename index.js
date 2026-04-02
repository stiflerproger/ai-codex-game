const readline = require("readline");

const BOARD_SIZE = 3;
const EMPTY_CELL = " ";
const PLAYERS = ["X", "O"];
const WINS_TO_FINISH = 3;

const board = Array.from({ length: BOARD_SIZE }, () =>
  Array(BOARD_SIZE).fill(EMPTY_CELL)
);

let currentPlayerIndex = 0;
const score = {
  X: 0,
  O: 0,
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function renderBoard() {
  const header = `   1   2   3`;
  const rows = board.map((row, rowIndex) => {
    const cells = row.join(" | ");
    return `${rowIndex + 1}  ${cells}`;
  });

  console.log("\n" + header);
  console.log(`  ---+---+---`);
  console.log(rows.join("\n  ---+---+---\n"));
  console.log("");
}

function renderScore() {
  console.log(`Счет матча: X ${score.X} : ${score.O} O`);
}

function resetBoard() {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      board[row][col] = EMPTY_CELL;
    }
  }
}

function startRound(message) {
  resetBoard();
  currentPlayerIndex = 0;

  if (message) {
    console.log(message);
  }

  renderScore();
  renderBoard();
  askMove();
}

function finishMatch(winner) {
  console.log(`Игрок ${winner} выиграл матч со счетом ${score.X}:${score.O}!`);
  rl.close();
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

  for (let i = 0; i < BOARD_SIZE; i += 1) {
    if (board[i][i] !== symbol) {
      mainDiagonalWin = false;
    }

    if (board[i][BOARD_SIZE - 1 - i] !== symbol) {
      secondaryDiagonalWin = false;
    }
  }

  return mainDiagonalWin || secondaryDiagonalWin;
}

function isDraw() {
  return board.every((row) => row.every((cell) => cell !== EMPTY_CELL));
}

function askMove() {
  const currentPlayer = PLAYERS[currentPlayerIndex];

  rl.question(
    `Игрок ${currentPlayer}, введите координаты строки и столбца через пробел: `,
    (input) => {
      const [rowRaw, colRaw] = input.trim().split(/\s+/);
      const row = Number(rowRaw) - 1;
      const col = Number(colRaw) - 1;

      if (
        Number.isNaN(row) ||
        Number.isNaN(col) ||
        row < 0 ||
        row >= BOARD_SIZE ||
        col < 0 ||
        col >= BOARD_SIZE
      ) {
        console.log("Некорректный ввод. Используйте числа от 1 до 3, например: 2 3");
        askMove();
        return;
      }

      if (board[row][col] !== EMPTY_CELL) {
        console.log("Эта клетка уже занята. Выберите другую.");
        askMove();
        return;
      }

      board[row][col] = currentPlayer;
      renderBoard();

      if (hasWinner(currentPlayer)) {
        score[currentPlayer] += 1;
        renderScore();

        if (score[currentPlayer] === WINS_TO_FINISH) {
          finishMatch(currentPlayer);
          return;
        }

        startRound(`Игрок ${currentPlayer} выиграл раунд! Начинаем следующий.`);
        return;
      }

      if (isDraw()) {
        startRound("Ничья! Очки не начисляются, начинаем новый раунд.");
        return;
      }

      currentPlayerIndex = (currentPlayerIndex + 1) % PLAYERS.length;
      askMove();
    }
  );
}

console.log("Крестики-нолики");
console.log("Матч идет до трех побед.");
console.log("Раунд выигрывает тот, кто соберет линию из трех одинаковых символов.");
console.log("Введите координаты в формате: строка столбец");
startRound();
