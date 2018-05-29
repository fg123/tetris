const GAME_COLS = 10;
const GAME_ROWS = 20;

module.exports = class Player {
    static get State() {
        return {
            SPECTATING: 'spectating',
            QUEUED: 'queued',
            PLAYING: 'playing'
            // TODO(felixguo): Add more here for post game
        };
    }

    constructor(socket, name, room) {
        this.socket = socket;
        this.name = name;
        this.state = Player.State.SPECTATING;
        this.room = room;
        this.board = Array.from(Array(GAME_ROWS), () => Array.from(Array(GAME_COLS), () => 0));
    }
};
