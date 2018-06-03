class Game {
    constructor() {
        this.resetBoard();
        this.currentPiece = undefined;

        this.resetPiece();

        /* The client holds the next n (probably 5) pieces, each time a block is placed, the client sends a message to the server, who will give it the next upcoming piece(s) */
        this.upcoming = [];
        this.name = undefined;
        this.inGame = false;
        this.hasJustSent = false;
        this.shouldSettle = false;
    }

    hold() {
        if (!this.hasHold) {
            this.resetPiece();
            this.hasHold = true;
            const tmp = this.holdingPiece;
            this.holdingPiece = this.currentPiece;
            if (tmp !== undefined) {
                this.currentPiece = tmp;
            } else {
                this.currentPiece = this.upcoming.shift();
            }
        }
    }

    resetBoard() {
        this.board = Array.from(Array(GAME_ROWS), () => Array.from(Array(GAME_COLS), () => 0));
        this.hasJustSent = false;
        this.holdingPiece = undefined;
    }

    resetPiece() {
        this.currentPieceYOffset = 0;
        this.currentPieceXOffset = 0;
        this.rotation = 0;
        this.hasHold = false;
    }

    settle() {
        // TODO(anyone): This rotational calculation code appears in 4 places,
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
        this.resetPiece();
        // TODO(anyone): Add check if no more upcoming
        this.currentPiece = this.upcoming.shift();

        let rowsCleared = 0;
        for (let row = GAME_ROWS - 1; row >= 0; row--) {
            if (this.board[row].every(x => !this.isFreeBlock(x))) {
                this.board.splice(row, 1);
                this.board.unshift(Array.from(Array(GAME_COLS), () => 0));
                // Shift pointer back down
                row++;
                rowsCleared++;
            }
        }
        // TODO(anyone): Probably not a good idea for the client to send this,
        // might want the server to validate based on the last received state
        // from the client
        if (this.hasJustSent && rowsCleared === 1) {
            rowsCleared += 1;
        }
        if (rowsCleared !== 0) {
            this.hasJustSent = true;
        } else {
            this.hasJustSent = false;
        }
        emit('server.linesCleared', { lines: rowsCleared });
        this.checkLosingCondition();
    }

    getBoardStateWithCurrentPiece() {
        const newBoard = this.board.map(a => a.slice());
        const piece = this.getCurrentPiece();
        const rotationalMatrix = piece.rotationalMatrix;
        const rotation = rotationalMatrix[this.rotation % rotationalMatrix.length];
        for (let i = 0; i < 4; i++) {
            const block = piece.startPosition[i];
            // Apply Rotational and Transformational Offset
            const x = block[0] + rotation[i][0] + this.currentPieceXOffset;
            const y = block[1] + rotation[i][1] + this.currentPieceYOffset;
            newBoard[y][x] = this.currentPiece + 1;
        }
        return newBoard;
    }

    lose() {
        this.inGame = false;
        this.emitBoard();
        emit('server.lose');
    }

    checkLosingCondition() {
        // Any block in the top 2 counts as a losing position
        for (let row = 0; row < 2; row++) {
            if (this.board[row].some(x => !this.isFreeBlock(x))) {
                this.lose();
                return;
            }
        }
    }

    addLines(lines) {
        for (let i = 0; i < lines; i++) {
            const newRow = Array.from(Array(GAME_COLS), () => 10);
            newRow[~~(newRow.length * Math.random())] = 0;
            this.board.push(newRow);
            this.board.shift();
            this.checkLosingCondition();
        }
    }

    emitBoard() {
        emit('server.board', { board: this.getBoardStateWithCurrentPiece() });
    }

    tick() {
        if (this.inGame) {
            const movedDown = this.down();
            if (!movedDown && this.shouldSettle) {
                this.settle();
            } else if (!movedDown) {
                this.shouldSettle = true;
            } else {
                this.shouldSettle = false;
            }
            this.emitBoard();
        }
    }

    isFreeBlock(block) {
        // Empty or ghost
        return block == 0 || block == 9;
    }

    isCollidingOrOutOfBounds(col, row) {
        return col < 0 || row < 0 || col >= GAME_COLS || row >= GAME_ROWS || !this.isFreeBlock(this.board[row][col]);
    }

    isValidState(piece, newXOffset, newYOffset, newRotation) {
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

    getGhostY() {
        let tmpY = this.currentPieceYOffset;
        while (this.isValidState(this.getCurrentPiece(), this.currentPieceXOffset, tmpY, this.rotation)) tmpY += 1;
        return tmpY - 1;
    }

    left() {
        if (!this.inGame) return false;
        if (
            this.isValidState(
                this.getCurrentPiece(),
                this.currentPieceXOffset - 1,
                this.currentPieceYOffset,
                this.rotation
            )
        ) {
            this.currentPieceXOffset -= 1;
            return true;
        }
        return false;
    }

    right() {
        if (!this.inGame) return false;
        if (
            this.isValidState(
                this.getCurrentPiece(),
                this.currentPieceXOffset + 1,
                this.currentPieceYOffset,
                this.rotation
            )
        ) {
            this.currentPieceXOffset += 1;
            return true;
        }
        return false;
    }

    down() {
        if (!this.inGame) return false;
        if (
            this.isValidState(
                this.getCurrentPiece(),
                this.currentPieceXOffset,
                this.currentPieceYOffset + 1,
                this.rotation
            )
        ) {
            this.currentPieceYOffset += 1;
            return true;
        }
        return false;
    }

    rotate() {
        if (!this.inGame) return false;
        if (
            this.isValidState(
                this.getCurrentPiece(),
                this.currentPieceXOffset,
                this.currentPieceYOffset,
                this.rotation + 1
            )
        ) {
            this.rotation += 1;
            return true;
        }
        return false;
    }

    hardDrop() {
        if (!this.inGame) return false;
        while (this.down());
        this.settle();
    }

    start(firstPieceIndex, upcoming) {
        this.currentPiece = firstPieceIndex;
        this.updateUpcoming(upcoming);
        this.resetPiece();
        this.resetBoard();
        this.inGame = true;
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
        if (index < 0 || index >= Game.blockList.length || index === undefined) {
            return undefined;
        }
        return Game.blockList[index];
    }

    static get blockList() {
        return [
            new Piece(
                'I_BLOCK',
                [[3, 1], [4, 1], [5, 1], [6, 1]],
                [[[0, 0], [0, 0], [0, 0], [0, 0]], [[1, -1], [0, 0], [-1, 1], [-2, -2]]]
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

class SpectatorState {
    constructor() {
        this.spectatorState = undefined;
    }

    updateSpectatorState(newState) {
        this.spectatorState = newState;
    }

    getStatusDisplay() {
        if (!this.spectatorState) return '';
        if (this.spectatorState.players.length === 0) return '';
        return `
			<b>Admin:</b> ${this.spectatorState.players[0].name}
			<br>
			<b>Playing:</b>
			<br>
			${this.getPlayersInGame()
                .map(p => p.name)
                .join('<br>')}
			<br>
			<b>Queued:</b>
			<br>
			${this.getPlayersQueued()
                .map(p => p.name)
                .join('<br>')}
			<br>
			<b>Spectating:</b>
			<br>
			${this.getPlayersSpectating()
                .map(p => p.name)
                .join('<br>')}
			<br>
		`;
    }

    getPlayersQueued() {
        if (!this.spectatorState) {
            return [];
        }
        return this.spectatorState.players.filter(player => player.state === 'queued');
    }

    getPlayersSpectating() {
        if (!this.spectatorState) {
            return [];
        }
        return this.spectatorState.players.filter(player => player.state === 'spectating');
    }

    getPlayersInGame() {
        // TODO(anyone): Get constants between server and client to agree
        if (!this.spectatorState) {
            return [];
        }
        return this.spectatorState.players.filter(player => player.state === 'playing' || player.state === 'lost');
    }

    getTitleText() {
        if (!this.spectatorState) return 'Tetris';
        if (this.spectatorState.state === 'lobby') return 'Tetris - Lobby';
        if (this.spectatorState.state === 'in-game') return 'Tetris - In Game';
    }

    shouldShowStartbutton(name) {
        if (!this.spectatorState) return false;
        if (this.spectatorState.players[0].name !== name) return false;
        return this.spectatorState.state === 'lobby' && this.getPlayersQueued().length >= 2;
    }

    getCtaButtonText(name) {
        if (!this.spectatorState) return 'Loading';
        if (this.getPlayersSpectating().some(p => p.name === name)) return 'Queue for Next Game';
        if (this.getPlayersQueued().some(p => p.name === name)) return 'Unqueue';
        return 'In Game';
    }

    onCtaButtonClick(name) {
        if (!this.spectatorState) return;
        if (this.getPlayersSpectating().some(p => p.name === name)) {
            emit('server.queue');
        } else if (this.getPlayersQueued().some(p => p.name === name)) {
            emit('server.unqueue');
        }
    }

    getStatusText(name) {
        if (!this.spectatorState) return 'Loading...';
        if (this.getPlayersSpectating().some(p => p.name === name)) return 'You are Spectating';
        if (this.getPlayersQueued().some(p => p.name === name)) return 'You are Queued for Next Game';
        return 'You are in game!';
    }

    onStartButtonClicked(name) {
        if (this.shouldShowStartbutton(name)) emit('server.start');
    }
}
