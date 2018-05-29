class Game {
    constructor() {
        this.board = Array.from(Array(GAME_ROWS), () => Array.from(Array(GAME_COLS), () => 0));
        this.currentPiece = -1;
        this.holdingPiece = 0;

        this.reset();

        /* The client holds the next n (probably 5) pieces, each time a block is placed, the client sends a message to the server, who will give it the next upcoming piece(s) */
        this.upcoming = [];
        this.name = undefined;
        this.inGame = true;
    }

    hold() {
        if (!this.hasHold) {
            this.reset();
            this.hasHold = true;
            const tmp = this.holdingPiece;
            this.holdingPiece = this.currentPiece;
            this.currentPiece = tmp;
        }
    }

    reset() {
        this.currentPieceYOffset = 0;
        this.currentPieceXOffset = 0;
        this.rotation = 0;
        this.hasHold = false;
    }

    settle() {
        // TODO(anyone): This rotational calculation code appears in 3 places,
        // we should probably extract it into some function somehow
        const piece = this.getCurrentPiece();
        const rotationalMatrix = piece.rotationalMatrix;
        const rotation = rotationalMatrix[this.rotation % rotationalMatrix.length];
        for (let i = 0; i < 4; i++) {
            const block = piece.startPosition[i];
            // Apply Rotational and Transformational Offset
            const x = block[0] + rotation[i][0] + this.currentPieceXOffset;
            const y = block[1] + rotation[i][1] + this.currentPieceYOffset;
            // TODO(anyone): should probably assert the below somehow
            //assert(this.board[y][x] == 0);
            // +1 because currentPiece is indexed on 0
            this.board[y][x] = this.currentPiece + 1;
        }
        this.reset();
        // TODO(anyone): Add check if no more upcoming
        this.currentPiece = this.upcoming.shift();

        let rowsCleared = 0;
        for (let row = GAME_ROWS - 1; row >= 0; row--) {
            if (this.board[row].every(x => x !== 0)) {
                this.board.splice(row, 1);
                this.board.unshift(Array.from(Array(GAME_COLS), () => 0));
                // Shift pointer back down
                row++;
                rowsCleared++;
            }
        }
    }

    tick() {
        if (!this.down()) {
            this.settle();
        }
    }

    isCollidingOrOutOfBounds(col, row) {
        return col < 0 || row < 0 || col >= GAME_COLS || row >= GAME_ROWS || this.board[row][col] != 0;
    }

    isValidState(newXOffset, newYOffset, newRotation) {
        const piece = this.getCurrentPiece();
        const rotationalMatrix = piece.rotationalMatrix;
        const rotation = rotationalMatrix[newRotation % rotationalMatrix.length];
        for (let i = 0; i < 4; i++) {
            const block = piece.startPosition[i];
            // Apply Rotational and Transformational Offset
            const x = block[0] + rotation[i][0] + newXOffset;
            const y = block[1] + rotation[i][1] + newYOffset;
            if (this.isCollidingOrOutOfBounds(x, y)) return false;
        }
        return true;
    }

    left() {
        if (this.isValidState(this.currentPieceXOffset - 1, this.currentPieceYOffset, this.rotation)) {
            this.currentPieceXOffset -= 1;
            return true;
        }
        return false;
    }

    right() {
        if (this.isValidState(this.currentPieceXOffset + 1, this.currentPieceYOffset, this.rotation)) {
            this.currentPieceXOffset += 1;
            return true;
        }
        return false;
    }

    down() {
        if (this.isValidState(this.currentPieceXOffset, this.currentPieceYOffset + 1, this.rotation)) {
            this.currentPieceYOffset += 1;
            return true;
        }
        return false;
    }

    rotate() {
        if (this.isValidState(this.currentPieceXOffset, this.currentPieceYOffset, this.rotation + 1)) {
            this.rotation += 1;
            return true;
        }
        return false;
    }

    hardDrop() {
        while (this.down());
        this.settle();
    }

    start(firstPieceIndex, upcoming) {
        this.currentPiece = firstPieceIndex;
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
                    [[1, 1], [0, 0], [0, -1], [1, 0]],
                    [[0, 0], [0, 0], [0, 0], [2, 2]],
                    [[1, 1], [0, 0], [-1, -1], [0, 2]]
                ]
            ),
            new Piece(
                'L_BLOCK',
                [[3, 1], [4, 1], [5, 1], [5, 0]],
                [
                    [[0, 0], [0, 0], [0, 0], [0, 0]],
                    [[1, 1], [0, 0], [0, 1], [-1, 0]],
                    [[0, 0], [0, 0], [0, 0], [-2, 2]],
                    [[0, -1], [0, 0], [-1, 1], [-1, 0]]
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
            new Piece('O_BLOCK', [[4, 0], [4, 1], [5, 1], [5, 0]], [[[0, 0], [0, 0], [0, 0], [0, 0]]])
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
