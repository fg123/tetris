const TIME_BETWEEN_FRAMES = 16;
const TETRIS_FRAME_TIME = 500;
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_SPACE = 32;
const KEY_SHIFT = 16;

let DELTA_TIME = 1000 / TIME_BETWEEN_FRAMES;
let PREV_TIME = Date.now();

let cumulativeCounter = 0;
let millisPast = 0;

function update() {
    const now = Date.now();
    DELTA_TIME = 1000 / (now - PREV_TIME);
    cumulativeCounter += now - PREV_TIME;
    millisPast += now - PREV_TIME;
    if (cumulativeCounter > Math.max(200, TETRIS_FRAME_TIME - millisPast / 480)) {
        cumulativeCounter = 0;
        game.tick();
    }
    PREV_TIME = now;
}

$(document).ready(function() {
    $(document).keydown(function(e) {
        if (event.which == KEY_DOWN) {
            game.down();
        } else if (event.which == KEY_UP) {
            game.rotate();
        } else if (event.which == KEY_LEFT) {
            game.left();
        } else if (event.which == KEY_RIGHT) {
            game.right();
        } else if (event.which == KEY_SPACE) {
            game.hardDrop();
        } else if (event.which == KEY_SHIFT) {
            game.hold();
        }
    });
    $(document).mousedown(function(e) {});
    $(document).mousemove(function(e) {});
    $(document).mouseup(function(e) {});

    $('.cta').click(function(e) {
        spectatorState.onCtaButtonClick(game.name);
    });

    $('.start.button').click(function(e) {
        spectatorState.onStartButtonClicked(game.name);
    });
});

setInterval(update, TIME_BETWEEN_FRAMES);
