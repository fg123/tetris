const util = require('./util.js');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io').listen(http);
const uuidv4 = require('uuid/v4');
const path = require('path');

const Room = require('./room.js');
const Player = require('./player.js');

const port = process.env.PORT || 5000;
const ID_LEN = 20;

http.listen(port, function() {
    console.log('listening on port ' + port);
});

// Rooms is a dict of room ids to room objects
const rooms = {};

app.use('/static', express.static(path.join(__dirname, '/../static')));
app.use('/client', express.static(path.join(__dirname, '/../client')));
app.get('/room/*', function(request, result) {
    // TODO(felixguo): This is super arbitrary, probably is a better way
    const id = request.path.split('/')[2];
    if (request.path.endsWith('id.js')) {
        result.type('application/javascript');
        result.send(`var roomId = '${id}';`);
    } else {
        result.sendFile(path.join(__dirname, '/../client/index.html'));
    }
    if (!rooms[id]) {
        rooms[id] = new Room(id);
    }
});
app.get('/', function(request, result) {
    // Redirect to a random, non-taken room
    var id;
    do {
        id = uuidv4();
    } while (id in rooms);
    result.redirect(307, '/room/' + id + '/');
});

const players = {};

io.on('connection', function(socket) {
    console.log('Connected');
    socket.on('server.join', function(data) {
        // Check for Limits here if necessary
        if (rooms[data.room].players.contains(it => it.name == data.name)) {
            socket.emit('client.error', { error: 'Name is already taken!' });
            return;
        }
        const player = new Player(socket, data.name, rooms[data.room]);
        rooms[data.room].addPlayer(player);
        socket.emit('client.joinSuccess');
        rooms[data.room].pushSpectatorState();
        players[socket.id] = player;
    });

    socket.on('disconnect', function() {
        if (players[socket.id] !== undefined) {
            removePlayerFromRoom(players[socket.id]);
        }
    });
});

function removePlayerFromRoom(player) {
    const room = player.room;
    room.removePlayer(player);
    if (room.isEmpty()) {
        // Remove room if it's empty
        delete rooms[room.id];
    } else {
        // Notify rest of players someone left
        room.pushSpectatorState();
    }
}

function generateRoomId() {
    var newId = (Math.random() * 1000) | 0;
    while (rooms[newId]) newId = (Math.random() * 1000) | 0;
    return newId;
}

function getAvailableRooms() {
    return rooms.reduce(function(acc, r) {
        acc.push({
            id: r.id,
            numPlayers: r.players.length,
            numSpecs: r.spectators.length
        });
        return acc;
    }, []);
}
