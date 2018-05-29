let canvas, context, screenWidth, screenHeight;

const MAX_WIDTH = 1500;
const MAX_HEIGHT = 720;
const BLOCK_SIZE = 30;

/*
 * To prevent issues with different screen sizes, the entire interface resides
 * in a 16 x 9 area, defined in here by 1600 x 900. The user can then resize
 * their browser window to get their desired zoom level.
 */
var PIXEL_RATIO = (function() {
    var ctx = document.createElement('canvas').getContext('2d'),
        dpr = window.devicePixelRatio || 1,
        bsr =
            ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio ||
            1;

    return dpr / bsr;
})();

$(document).ready(function() {
    canvas = $('canvas')[0];
    context = canvas.getContext('2d');
    canvas.width = MAX_WIDTH * PIXEL_RATIO;
    canvas.height = MAX_HEIGHT * PIXEL_RATIO;
    canvas.style.width = MAX_WIDTH + 'px';
    canvas.style.height = MAX_HEIGHT + 'px';
    context.setTransform(PIXEL_RATIO, 0, 0, PIXEL_RATIO, 0, 0);
    // TODO(felixguo): Probably not a good idea to use spread operator here
    $.when(...loadResources()).then(function() {
        console.log('Resources loaded!');
        // Start Graphics Loop When All Resources Loaded
        setInterval(draw, 16.6666666);
    });
});

function createGradient(x, y, width, height, color1, color2) {
    var grd = context.createLinearGradient(x, y, width, height);
    grd.addColorStop(0, color1);
    grd.addColorStop(1, color2);
    return grd;
}

function drawCircle(x, y, r) {
    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.fill();
    context.closePath();
}

function drawCircleWithOutline(x, y, r) {
    drawCircle(x, y, r);
    context.stroke();
}

function drawBlock(index, x, y, scale) {
    // img, sx, sy, sw, sh, dx, dy, dw, dh
    context.drawImage(
        resources[RESOURCE_BLOCKS],
        index * BLOCK_SIZE,
        0,
        BLOCK_SIZE,
        BLOCK_SIZE,
        x,
        y,
        BLOCK_SIZE * scale,
        BLOCK_SIZE * scale
    );
}

function drawPiece(game, pieceIndex, x, y, scale) {
    const piece = game.getPieceByIndex(pieceIndex);
    if (piece === undefined) {
        console.log(pieceIndex);
        return;
    }
    for (let i = 0; i < piece.startPosition.length; i++) {
        const pos = piece.startPosition[i];
        const r_x = pos[0];
        const r_y = pos[1];
        drawBlock(pieceIndex, x + 32 * r_x * scale, y + 32 * r_y * scale, scale);
    }
}

function drawText(text, font, x, y) {
    context.font = font;
    context.fillStyle = '#FFF';
    context.fillText(text, x, y);
}

function drawTetris(board, scale, x, y) {
    const resourceGrid = resources[RESOURCE_GRID];
    const offset = MAX_HEIGHT - resourceGrid.height;
    context.drawImage(resourceGrid, x, y, resourceGrid.width * scale, resourceGrid.height * scale);

    for (let row = 0; row < GAME_ROWS - 2; row++) {
        for (let col = 0; col < GAME_COLS; col++) {
            const block = board[row + 2][col];
            const blockIndex = block - 1;
            if (block != 0) {
                drawBlock(blockIndex, x + (2 + 32 * col) * scale, y + (2 + 32 * row) * scale, scale);
            }
        }
    }
}

function drawScaledImage(image, x, y, scale) {
    context.drawImage(image, x, y, image.width * scale, image.height * scale);
}

function drawGame() {
    const MAIN_GAME_SCALE = 0.75;
    const resourceGrid = resources[RESOURCE_GRID];
    const offset = (MAX_HEIGHT - resourceGrid.height * MAIN_GAME_SCALE) / 2;
    drawTetris(game.board, MAIN_GAME_SCALE, 15, offset + 15);
    // Also draw the currently falling piece
    const piece = game.getCurrentPiece();
    const rotationalMatrix = piece.rotationalMatrix;
    const rotation = rotationalMatrix[game.rotation % rotationalMatrix.length];
    for (let i = 0; i < 4; i++) {
        const block = piece.startPosition[i];
        // Apply Rotational and Transformational Offset
        const x = block[0] + rotation[i][0] + game.currentPieceXOffset;
        const y = block[1] + rotation[i][1] + game.currentPieceYOffset;
        if (y >= 2) {
            drawBlock(
                game.currentPiece,
                15 + (2 + 32 * x) * MAIN_GAME_SCALE,
                offset + 15 + (2 + 32 * (y - 2)) * MAIN_GAME_SCALE,
                MAIN_GAME_SCALE
            );
        }
    }

    const sidebarXOffset = resourceGrid.width * MAIN_GAME_SCALE - 40;
    if (game.upcoming.length !== 0) {
        drawPiece(game, game.upcoming[0], sidebarXOffset, offset + 60, MAIN_GAME_SCALE);
    }
    drawPiece(game, game.holdingPiece, sidebarXOffset, offset + 150, MAIN_GAME_SCALE);
}

function drawSpectator() {
    const SPECTATOR_GAME_SCALE = 0.75 / 2;
    const resourceGrid = resources[RESOURCE_GRID];
    const width = resourceGrid.width * SPECTATOR_GAME_SCALE;
    const height = resourceGrid.height * SPECTATOR_GAME_SCALE;
    const xBaseOffset = (MAX_WIDTH - (width * 4 + 60)) / 2;
    const yOffsets = [MAX_HEIGHT / 2 - height - 20, MAX_HEIGHT - height - 20];
    const playersToDraw = spectatorState.inGame.filter(player => player.name != game.name);
    let i = 0;
    for (i = 0; i < playersToDraw.length; i++) {
        const player = playersToDraw[i];
        $('.names .' + (i + 1)).text(player.name);
        drawTetris(
            player.board,
            SPECTATOR_GAME_SCALE,
            xBaseOffset + (i % 4) * (width + 20),
            yOffsets[Math.floor(i / 4)]
        );
    }
    // Set remaining to empty
    for (; i < 8; i++) {
        $('.names .' + (i + 1)).text('');
    }
}

function draw() {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    context.clearRect(0, 0, MAX_WIDTH, MAX_HEIGHT);
    drawGame();
    if (spectatorState) drawSpectator();
}
