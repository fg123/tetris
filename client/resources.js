const RESOURCE_GRID = '/static/grid.png';
const RESOURCE_BLOCKS = '/static/colors.png';

const resourcesToLoad = [RESOURCE_GRID, RESOURCE_BLOCKS];
const resources = {};

function loadResource(location, key, url, deferArr) {
    const deferred = new $.Deferred();
    location[key] = new Image();
    location[key].onload = function() {
        console.log('Resource loaded: ' + url);
        deferred.resolve();
    };
    location[key].onerror = function() {
        console.error("Couldn't load resource: " + url);
    };
    location[key].src = url;
    deferArr.push(deferred);
}

function loadResources() {
    let deferArr = [];
    for (let i = 0; i < resourcesToLoad.length; i++) {
        loadResource(resources, resourcesToLoad[i], resourcesToLoad[i], deferArr);
    }
    return deferArr;
}
