from flask import Flask, jsonify, render_template, request

from game import (
    COLS, COMPUTER, EMPTY, HUMAN, ROWS,
    choose_move, find_row, is_full, winning_line,
)

app = Flask(__name__, static_folder="public", static_url_path="")


def is_valid_board(board):
    if not isinstance(board, list) or len(board) != ROWS:
        return False
    for row in board:
        if not isinstance(row, list) or len(row) != COLS:
            return False
        if any(cell not in (EMPTY, HUMAN, COMPUTER) for cell in row):
            return False
    return True


@app.route("/")
def index():
    return render_template("index.html", rows=ROWS, cols=COLS)


@app.route("/move", methods=["POST"])
def move():
    data = request.get_json(silent=True) or {}
    board = data.get("board")
    col = data.get("column")

    if not is_valid_board(board) or type(col) is not int or not 0 <= col < COLS:
        return jsonify(error="Invalid move"), 400

    human_row = find_row(board, col)
    if human_row is None:
        return jsonify(error="That column is full"), 400

    # The human's move
    board[human_row][col] = HUMAN
    result = {"human_row": human_row, "winner": None, "line": None}

    line = winning_line(board, HUMAN)
    if line:
        result.update(winner="human", line=line)
        return jsonify(result)
    if is_full(board):
        result.update(winner="draw")
        return jsonify(result)

    # The computer's move
    computer_col, rule = choose_move(board)
    computer_row = find_row(board, computer_col)
    board[computer_row][computer_col] = COMPUTER
    result.update(computer_row=computer_row, computer_col=computer_col, rule=rule)

    line = winning_line(board, COMPUTER)
    if line:
        result.update(winner="computer", line=line)
    elif is_full(board):
        result.update(winner="draw")

    return jsonify(result)


if __name__ == "__main__":
    app.run(port=5000)
