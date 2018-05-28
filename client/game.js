// This handles the actual Tetris game
const GAME_COLS = 10;
// Top two rows are hidden
const GAME_ROWS = 22;

const game = new Game();

game.start(0, [5, 3, 1, 2, 3, 3, 2, 4]);
console.log(game.board);
console.log(Game.blockList);
