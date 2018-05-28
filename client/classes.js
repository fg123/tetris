class Game {
    constructor() {
        this.board = Array.from(Array(GAME_ROWS), () =>
            Array.from(Array(GAME_COLS), () => Math.floor(Math.random() * 7))
        );
        this.currentPiece = -1;
        this.holdingPiece = 0;

        this.currentPieceYOffset = 0;
        this.currentPieceXOffset = 0;

        /* The client holds the next n (probably 5) pieces, each time a block is placed, the client sends a message to the server, who will give it the next upcoming piece(s) */
        this.upcoming = [];
        this.name = undefined;
        this.inGame = true;
    }

    tick() {
        this.currentPieceYOffset += 1;
    }

    start(firstPieceIndex, upcoming) {
        this.currentPiece = Game.blockList[firstPieceIndex];
        this.updateUpcoming(upcoming);
        this.currentPieceYOffset = 0;
        this.currentPieceXOffset = 0;
    }

    updateUpcoming(newUpcoming) {
        this.upcoming = this.upcoming.concat(newUpcoming);
    }

    getUpcomingPiece() {
        if (this.upcoming.length === 0) {
            return undefined;
        }
        return this.getPieceByIndex(this.upcoming[0]);
    }

    getCurrentPiece() {
        return this.getPieceByIndex(this.currentPiece);
    }

    getHoldingPiece() {
        return this.getPieceByIndex(this.holdingPiece);
    }

    getPieceByIndex(index) {
        if (index < 0 || index >= Game.blockList.length) {
            return undefined;
        }
        return Game.blockList[index];
    }

    static get blockList() {
        return [
            new Piece(
                'I_BLOCK',
                [[3, 1], [4, 1], [5, 1], [6, 1]],
                [[[0, 0], [0, 0], [0, 0], [0, 0]], [[1, -1], [0, 0], [-1, 1], [-2, 2]]]
            ),
            new Piece(
                'T_BLOCK',
                [[3, 1], [4, 1], [5, 1], [4, 0]],
                [
                    [[0, 0], [0, 0], [0, 0], [0, 0]],
                    [[1, 1], [0, 0], [0, 0], [0, 0]],
                    [[0, 0], [0, 0], [0, 0], [0, 2]],
                    [[0, 0], [0, 0], [-1, 1], [0, 0]]
                ]
            ),
            new Piece(
                'J_BLOCK',
                [[3, 1], [4, 1], [5, 1], [3, 0]],
                [
                    [[0, 0], [0, 0], [0, 0], [0, 0]],
                    [[1, 1], [0, 0], [0, 1], [-1, 0]],
                    [[0, 0], [0, 0], [0, 0], [-2, 2]],
                    [[0, -1], [0, 0], [-1, 1], [-1, 0]]
                ]
            ),
            new Piece(
                'L_BLOCK',
                [[3, 1], [4, 1], [5, 1], [5, 0]],
                [
                    [[0, 0], [0, 0], [0, 0], [0, 0]],
                    [[1, 1], [0, 0], [0, -1], [1, 0]],
                    [[0, 0], [0, 0], [0, 0], [2, 2]],
                    [[1, 1], [0, 0], [-1, -1], [0, 2]]
                ]
            ),
            new Piece(
                'S_BLOCK',
                [[3, 1], [4, 1], [4, 0], [5, 0]],
                [[[0, 0], [0, 0], [0, 0], [0, 0]], [[0, 0], [0, 1], [0, 1], [-2, 0]]]
            ),
            new Piece(
                'Z_BLOCK',
                [[5, 1], [6, 1], [4, 0], [5, 0]],
                [[[0, 0], [0, 0], [0, 0], [0, 0]], [[0, 1], [0, 0], [2, 0], [0, 1]]]
            ),
            new Piece('O_BLOCK', [[4, 0], [4, 1], [5, 1], [5, 0]], [])
        ];
    }
}

class Piece {
    /*
	 * Pieces are all represented with [x, y] pairs.
	 * The start position is where the block will be placed in the top two rows
	 * before it appears to the player. The rotational matrix defines the
	 * delta [dx, dy] applied to each square of a piece.
	 */
    constructor(name, startPosition, rotationalMatrix) {
        this.name = name;
        this.startPosition = startPosition;
        this.rotationalMatrix = rotationalMatrix;
    }
}
