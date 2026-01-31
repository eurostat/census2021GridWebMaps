//TODO

// https://ec.europa.eu/assets/estat/E/E4/gisco/website/grid_map/index.html

//sea level rise ?
//generalise interpolation



//define map with initial view
const DEFAULTMAPSETTINGS = { x: 4096489, y: 2829097, z: 2000, backgroundColor: "white" };
const map = new gridviz.Map(document.getElementById("map"), {
    x: DEFAULTMAPSETTINGS.x,
    y: DEFAULTMAPSETTINGS.y,
    z: DEFAULTMAPSETTINGS.z,
    zoomExtent: [5, 10000],
    onZoomFun: (e) => { updateURL(map) },
}).setViewFromURL()
//.addFullscreenButton()



// initialise map using URL parameters
//TODO


//define multi resolution datasets
//TODO

//https://raw.githubusercontent.com/jgaffuri/tiled-popgrid/main/pub/v1/2018/1000/info.json
//p


//https://raw.githubusercontent.com/jgaffuri/tiled-popgrid/main/pub/v1/change/1000/info.json
//p2006


