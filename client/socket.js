let socket;
let spectatorState = new SpectatorState();
let name = undefined;

showWelcome();

function emit(endpoint, data) {
    if (!data) data = {};
    console.log('Emitting ' + endpoint);
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
        spectatorState.updateSpectatorState(data);
        $('.roomStatus').html(spectatorState.getStatusDisplay());
        $('.title h1').text(spectatorState.getTitleText());
        $('.cta').text(spectatorState.getCtaButtonText(game.name));
        if (spectatorState.shouldShowStartbutton(game.name)) {
            $('.start.button').show();
        } else {
            $('.start.button').hide();
        }
    });

    socket.on('client.startGame', function(data) {
        game.inGame = true;
    });

    // set showingGame to true when starting

    socket.on('client.error', function(data) {
        alert(data.error);
    });

    socket.on('client.gotLines', function(lines) {
        game.addLines(lines);
    });
}

function log(message) {
    $('.log').append(message + '\n');
}
