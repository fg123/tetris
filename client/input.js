var TIME_BETWEEN_FRAMES = 1;
var DELTA_TIME = 1000 / TIME_BETWEEN_FRAMES;
var PREV_TIME = Date.now();
var DRAG = 0.995;
var BALL_RADIUS = 2.8575;
var MAX_CUE_BALL_VEL = 5;

function update() {
    var now = Date.now();
    DELTA_TIME = 1000 / (now - PREV_TIME);

    PREV_TIME = now;
}

$(document).ready(function() {
    $(document).mousedown(function(e) {});
    $(document).mousemove(function(e) {});
    $(document).mouseup(function(e) {});
});

setInterval(update, TIME_BETWEEN_FRAMES);
