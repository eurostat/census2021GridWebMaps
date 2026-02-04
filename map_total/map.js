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

    // get selection
    const mapCode = document.querySelector('input[name="style"]:checked').value;
    const year = document.getElementById("year").value;

    console.log(mapCode, year)

    // set dataset
    gridLayer.dataset = dataset[year]

    //get colors
    const colors = []
    const classNumber = 8;
    for (let i = 0; i <= (classNumber - 1); i++) colors.push(d3.interpolateYlOrRd(0.85 * i / (classNumber - 1)))
    const scaleTPop = gridviz.exponentialScale(7)
    const popCols = { ...colors }; popCols.na = naColor

    //style
    let totPopStyle = new gridviz.SquareColorCategoryWebGLStyle({
        viewScale: (cells, r) => {
            const max = d3.max(cells, c => c.p)
            const rr = r * r / 1000000
            const breaks = []
            for (let i = 1; i < classNumber; i++) {
                let t = i / classNumber
                t = scaleTPop(t)
                breaks.push(max * t / rr)
            }
            return gridviz.classifier(breaks)
        },
        code: (c, r, z, classifier) => {
            const v = c.p
            if (v == -1 || v == undefined) return "na"
            return classifier(1000000 * v / r / r)
        },
        color: popCols,
    })

    // set style
    gridLayer.styles = [totPopStyle, strokeStyle]


    //redraw
    map.redraw();
    updateURL(map);
}

//initialise
update();

