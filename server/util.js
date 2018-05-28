Array.prototype.contains = function(fn) {
    for (var i = 0; i < this.length; i++) {
        if (fn(this[i])) {
            return true;
        }
    }
    return false;
};
