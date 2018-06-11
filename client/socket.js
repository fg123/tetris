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
        $('.playerStatus h4').text(spectatorState.getStatusText(game.name));
        if (spectatorState.shouldShowStartbutton(game.name)) {
            $('.start.button').show();
        } else {
            $('.start.button').hide();
        }
    });

    socket.on('client.gameOver', function(name) {
        game.inGame = false;
        if (confirm(name + ' has won the match! Requeue?')) {
            emit('server.queue');
        }
    });

    socket.on('client.startGame', function(data) {
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }
        // TODO(anyone): Maybe have the server pass the upcoming array
        const pieces = [0, 1, 2, 3, 4, 5, 6];
        const upcoming = [];
        for (let i = 0; i < 150; i++) {
            const shuffled = pieces.slice();
            shuffleArray(shuffled);
            Array.prototype.push.apply(upcoming, shuffled);
        }
        millisPast = 0;
        game.start(upcoming.shift(), upcoming);
    });

    // set showingGame to true when starting

    socket.on('client.error', function(data) {
        alert(data.error);
    });

    socket.on('client.gotLines', function(lines) {
        game.addLines(lines);
    });

    socket.on('disconnect', function() {
        alert('Server disconnected.');
        window.location.reload();
    });
}

function log(message) {
    $('.log').append(message + '\n');
}
