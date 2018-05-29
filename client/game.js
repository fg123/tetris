// This handles the actual Tetris game
const GAME_COLS = 10;
// Top two rows are hidden
const GAME_ROWS = 22;

const game = new Game();

const upcoming = [];
for (let i = 0; i < 1000; i++) upcoming.push(Math.floor(Math.random() * 7));
game.start(upcoming.shift(), upcoming);
console.log(game.board);
console.log(Game.blockList);
