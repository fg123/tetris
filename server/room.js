module.exports = class Room {
    constructor(id) {
        this.id = id;
        this.players = [];
    }

    addPlayer(player) {
        // Called when a player joins a room.
        this.players.push(player);
    }

    removePlayer(player) {
        // Called when a player disconnects from the room.
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].name === player.name) {
                this.players.splice(i, 1);
                return;
            }
        }
    }

    isEmpty() {
        return this.players.length == 0;
    }

    pushSpectatorState() {
        // Sends the spectator state to everyone in the room.
        this.players.forEach(player => {
            player.socket.emit('client.spectator', this.getSpectatorState());
        });
    }

    getSpectatorState() {
        return {
            inGame: this.players.map(player => {
                return {
                    name: player.name,
                    board: player.board
                };
            })
        };
    }
};
