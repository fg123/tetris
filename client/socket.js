let socket;
let spectatorState = undefined;
let name = undefined;

showWelcome();

function emit(endpoint, data) {
    data.room = roomId;
    socket.emit(endpoint, data);
}

$('#startBtn').click(function() {
    game.name = $('#nameInput').val();
    socket = io();
    setupSocket();
    emit('server.join', { name: game.name });
});

$('#createRoom').onclick = function() {
    socket.emit('server.createRoom');
};

$('.startGame').click(function() {
    socket.emit('server.startGame');
});

$('.leaveRoom').click(function() {
    socket.emit('server.leaveRoom');
});

function hideAll() {
    $('.welcome').hide();
    $('.overlay').hide();
}

function showWelcome() {
    hideAll();
    $('.overlay').show();
    $('.welcome').show();
}

function setupSocket() {
    log('Setting up Connection...');
    socket.on('client.joinSuccess', function() {
        hideAll();
        $('.name').text(game.name);
    });

    socket.on('client.spectator', function(data) {
        console.log(data);
        spectatorState = data;
    });

    // set showingGame to true when starting

    socket.on('client.error', function(data) {
        alert(data.error);
    });

    socket.on('client.roomCreated', function(room) {
        loadRoom(room);
    });

    socket.on('client.newPlayer', function(name) {
        loadRoom(room);
    });

    socket.on('client.receiveShot', function(cueDx, cueDy) {
        ballHasBeenShot(cueDx, cueDy);
    });

    socket.on('client.errorMsg', function(message) {
        alert(message);
    });

    socket.on('client.gameStart', function() {});
}

function loadRoom(room) {
    showRoom();
    var playerList = room.players.reduce(function(acc, curr) {
        return '<li>' + curr + '</li>';
    }, '');

    var spectatorList = room.spectators.reduce(function(acc, curr) {
        return '<li>' + curr + '</li>';
    }, '');

    $('.roomInfo').html(`
		<p>Id: ${room.id}</p>
		<p>Players</p>
		<ul>${playerList}</ul>
		<p>Spectators</p>
		<ul>${spectatorList}</ul>
	`);
}

function log(message) {
    $('.log').append(message + '\n');
}
