"""Connect Four rules and the computer's three-rule algorithm."""

ROWS = 6
COLS = 7

EMPTY = 0
HUMAN = 1
COMPUTER = 2

# Rule numbers, shown on the page when the computer moves
RULE_WIN = 1
RULE_BLOCK = 2
RULE_CENTRE = 3

CENTRE_FIRST = [3, 2, 4, 1, 5, 0, 6]

# Right, down, down-right and up-right. The opposite directions aren't needed,
# because every line is found when starting from its other end.
DIRECTIONS = [(0, 1), (1, 0), (1, 1), (-1, 1)]


def new_board():
    return [[EMPTY] * COLS for _ in range(ROWS)]


def find_row(board, col):
    """Return the row a disc would land on, or None if the column is full."""
    for row in range(ROWS - 1, -1, -1):
        if board[row][col] == EMPTY:
            return row
    return None


def is_full(board):
    return all(cell != EMPTY for cell in board[0])


def belongs_to(board, row, col, player):
    on_board = 0 <= row < ROWS and 0 <= col < COLS
    return on_board and board[row][col] == player


def winning_line(board, player):
    """Return the four cells of a winning line, or None if there isn't one."""
    for row in range(ROWS):
        for col in range(COLS):
            for row_step, col_step in DIRECTIONS:
                line = [(row + i * row_step, col + i * col_step) for i in range(4)]
                if all(belongs_to(board, r, c, player) for r, c in line):
                    return line
    return None


def find_winning_move(board, player):
    """Try every column, then undo the move. Return a column that wins, or None."""
    for col in range(COLS):
        row = find_row(board, col)
        if row is not None:
            board[row][col] = player
            wins = winning_line(board, player) is not None
            board[row][col] = EMPTY
            if wins:
                return col
    return None


def choose_move(board):
    """Return the computer's column and the number of the rule that picked it."""
    # Rule 1: win if possible
    col = find_winning_move(board, COMPUTER)
    if col is not None:
        return col, RULE_WIN

    # Rule 2: block the human's winning move
    col = find_winning_move(board, HUMAN)
    if col is not None:
        return col, RULE_BLOCK

    # Rule 3: take the open column closest to the centre
    for col in CENTRE_FIRST:
        if find_row(board, col) is not None:
            return col, RULE_CENTRE

    return None, None
