const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const HUMAN = 1;
const COMPUTER = 2;

const statusText = document.getElementById("status");
const detailText = document.getElementById("detail");
const discs = document.getElementById("discs");
const preview = document.getElementById("preview");
const newGameButton = document.getElementById("new-game");
const columns = document.querySelectorAll(".column");
const rules = document.querySelectorAll("#rules li");

const scores = { human: 0, draw: 0, computer: 0 };

let board = emptyBoard();
let busy = false;
let gameOver = false;
let hoveredColumn = null;

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setStatus(status, detail = "") {
  statusText.textContent = status;
  detailText.textContent = detail;
}

function isOpen(col) {
  return board[0][col] === EMPTY;
}

/* Keeps the column buttons and the waiting disc in step with the game */
function updateControls() {
  const canPlay = !busy && !gameOver;

  columns.forEach((button, col) => {
    button.setAttribute("aria-disabled", String(!canPlay || !isOpen(col)));
  });

  const showPreview = canPlay && hoveredColumn !== null && isOpen(hoveredColumn);
  preview.classList.toggle("visible", showPreview);
  if (showPreview) {
    preview.style.setProperty("--col", hoveredColumn);
  }
}

async function dropDisc(row, col, player) {
  const disc = document.createElement("div");
  const dropTime = 300 + row * 70;

  disc.className = `disc ${player === HUMAN ? "red" : "yellow"}`;
  disc.dataset.cell = `${row}-${col}`;
  disc.style.setProperty("--row", row);
  disc.style.setProperty("--col", col);
  disc.style.setProperty("--drop-time", `${dropTime}ms`);

  discs.append(disc);
  board[row][col] = player;
  await wait(dropTime);
}

/* Walks through the rules in order, stopping at the one that picked the move */
async function showRuleCheck(firedRule) {
  for (const rule of rules) {
    const number = Number(rule.dataset.rule);
    rule.classList.add("checking");
    await wait(420);
    rule.classList.remove("checking");
    rule.classList.add(number === firedRule ? "fired" : "passed");
    if (number === firedRule) {
      break;
    }
  }
}

function clearRules() {
  rules.forEach((rule) => rule.classList.remove("checking", "passed", "fired"));
}

function explainMove(rule, col) {
  const column = col + 1;
  if (rule === 1) return `It found a winning move in column ${column}.`;
  if (rule === 2) return `It blocked your winning move in column ${column}.`;
  return `No threats, so it played column ${column}, near the centre.`;
}

function finishGame(data) {
  gameOver = true;
  scores[data.winner] += 1;
  document.getElementById(`score-${data.winner}`).textContent = scores[data.winner];
  newGameButton.classList.add("ready");

  if (data.line) {
    discs.classList.add("finished");
    data.line.forEach(([row, col]) => {
      discs.querySelector(`[data-cell="${row}-${col}"]`).classList.add("winning");
    });
  }

  if (data.winner === "human") {
    setStatus("You win!", "You got four in a row.");
  } else if (data.winner === "computer") {
    setStatus("Computer wins.", detailText.textContent);
  } else {
    setStatus("It's a draw.", "The board is full.");
  }
}

async function playColumn(col) {
  if (busy || gameOver || !isOpen(col)) {
    return;
  }

  busy = true;
  clearRules();
  updateControls();

  let data;
  try {
    const response = await fetch("/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ board, column: col }),
    });
    data = await response.json();
    if (!response.ok) {
      throw new Error(data.error);
    }
  } catch (error) {
    setStatus("Something went wrong.", "Check that the Flask server is running, then try again.");
    busy = false;
    updateControls();
    return;
  }

  await dropDisc(data.human_row, col, HUMAN);

  if (data.computer_col !== undefined) {
    setStatus("Computer's turn.", "Checking its rules in order.");
    await showRuleCheck(data.rule);
    await dropDisc(data.computer_row, data.computer_col, COMPUTER);
    setStatus("Your move.", explainMove(data.rule, data.computer_col));
  }

  if (data.winner) {
    finishGame(data);
  }

  busy = false;
  updateControls();
}

async function startNewGame() {
  if (busy) {
    return;
  }

  busy = true;
  updateControls();
  clearRules();
  newGameButton.classList.remove("ready");
  discs.classList.remove("finished");

  if (discs.querySelector(".disc:not(.preview)")) {
    discs.classList.add("emptying");
    await wait(600);
    discs.classList.remove("emptying");
    discs.querySelectorAll(".disc:not(.preview)").forEach((disc) => disc.remove());
  }

  board = emptyBoard();
  gameOver = false;
  busy = false;
  setStatus("Your move.", "You are red. Click a column to drop a disc.");
  updateControls();
}

columns.forEach((button, col) => {
  const showColumn = () => {
    hoveredColumn = col;
    updateControls();
  };
  const hideColumn = () => {
    hoveredColumn = null;
    updateControls();
  };

  button.addEventListener("click", () => playColumn(col));
  button.addEventListener("pointerenter", showColumn);
  button.addEventListener("pointerleave", hideColumn);
  button.addEventListener("focus", showColumn);
  button.addEventListener("blur", hideColumn);
});

newGameButton.addEventListener("click", startNewGame);
updateControls();
