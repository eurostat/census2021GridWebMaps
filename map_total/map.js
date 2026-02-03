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

//TODO
const updateURL = (map) => { }


// initialise map using URL parameters
//TODO


//
updateLayersVisibility()


//define multi resolution datasets
const dataset = {}
for (let year of ["2006", "2011", "2018", "2021"]) {
    dataset[year] = new gridviz.MultiResolutionDataset(
        [1000, 2000, 5000, 10000, 20000, 50000, 100000],
        (resolution) => new gviz_par.TiledParquetGrid(map, tilesUrl + year + "/" + resolution + "/"), {
        /*preprocess: c => {}*/
    })
}

dataset.change = new gridviz.MultiResolutionDataset(
    [1000, 2000, 5000, 10000, 20000, 50000, 100000],
    (resolution) => new gviz_par.TiledParquetGrid(map, tilesUrl + "change/" + resolution + "/"), {
    /*preprocess: c => {}*/
})


//make grid layer
const gridLayer = new gridviz.GridLayer(undefined, [], {
    visible: document.getElementById("grid").checked ? undefined : () => false,
    blendOperation: () => "multiply",
})

//set map layers
map.layers = [backgroundLayerElevation, backgroundLayerRoad2, gridLayer, backgroundLayerRoad, boundariesLayer, labelLayer];




const update = () => {


    //redraw
    map.redraw();
    updateURL(map);
}

//initialise
update();

