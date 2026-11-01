"""Plays the three-rule computer against a random player and prints the results."""

import random

from game import (
    COLS, COMPUTER, HUMAN,
    choose_move, find_row, is_full, new_board, winning_line,
)

GAMES = 1000


def random_column(board):
    open_columns = [col for col in range(COLS) if find_row(board, col) is not None]
    return random.choice(open_columns)


def play_game():
    """Play one game with the random player going first. Return the result."""
    board = new_board()
    while True:
        col = random_column(board)
        board[find_row(board, col)][col] = HUMAN
        if winning_line(board, HUMAN):
            return "random"
        if is_full(board):
            return "draw"

        col, _ = choose_move(board)
        board[find_row(board, col)][col] = COMPUTER
        if winning_line(board, COMPUTER):
            return "computer"
        if is_full(board):
            return "draw"


results = {"computer": 0, "random": 0, "draw": 0}
for _ in range(GAMES):
    results[play_game()] += 1

print(f"Games played: {GAMES}")
for name, wins in results.items():
    print(f"{name}: {wins} ({wins / GAMES:.1%})")
