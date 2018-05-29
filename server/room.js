const Player = require('./player.js');

module.exports = class Room {
    static get State() {
        return {
            LOBBY: 'lobby',
            IN_GAME: 'in-game'
        };
    }

    constructor(id) {
        this.id = id;
        this.players = [];
        this.state = Room.State.LOBBY;
        this.admin = undefined;
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

    giveLinesToRandomPlayer(senderName, lines) {
        const playersNotSender = this.players.filter(it => it.name !== senderName);
        playersNotSender[~~(playersNotSender.length * Math.random())].socket.emit('client.gotLines', lines);
    }

    getAdmin() {
        return this.players.length === 0 ? undefined : this.players[0].name;
    }

    startGame() {
        this.state = Room.State.IN_GAME;
        this.players.filter(x => x.state === Player.State.QUEUED).forEach(x => {
            x.state = Player.State.PLAYING;
            x.resetBoard();
            x.socket.emit('client.startGame');
        });
        this.pushSpectatorState();
    }

    onPlayerLose() {
        const stillPlaying = this.players.filter(x => x.state === Player.State.PLAYING);
        if (stillPlaying.length === 1) {
            this.players.forEach(player => {
                // TODO(felixguo): Push post game stats
                player.socket.emit('client.gameOver', stillPlaying[0].name);
            });
        }
        if (stillPlaying.length <= 1) {
            // Requeue all playing players
            this.state = Room.State.LOBBY;
            this.players.filter(x => x.state === Player.State.PLAYING || x.state === Player.State.LOST).forEach(x => {
                console.log(x.name + " has been requeued.");
                x.state = Player.State.QUEUED;
            });
            this.pushSpectatorState();   
        }
    }

    queue(name) {
        console.log('Queueing ' + name);
        if (this.players.filter(x => x.state === Player.State.QUEUED || x.state === Player.State.PLAYING).length >= 8) {
            return false;
        }
        const p = this.players.find(x => x.name === name);
        if (!p) return false;
        p.state = Player.State.QUEUED;
        this.pushSpectatorState();
        return true;
    }

    unqueue(name) {
        console.log('Unqueueing ' + name);
        const p = this.players.find(x => x.name === name);
        if (!p) return false;
        p.state = Player.State.SPECTATING;
        this.pushSpectatorState();
        return true;
    }

    getSpectatorState() {
        return {
            admin: this.getAdmin(),
            state: this.state,
            players: this.players.map(player => {
                return {
                    name: player.name,
                    board: player.board,
                    state: player.state
                };
            })
        };
    }
};
