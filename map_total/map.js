/* TODO

https://ec.europa.eu/assets/estat/E/E4/gisco/website/grid_map/index.html
add styles: colorch
add legends: change color, change size, change segment
fix styles - backgrounds adaptation
smoothing
fix GUI layout
check init copyright messages - in both versions
remove UK, and maybe others
dark color: invert labels black/white. change borders color ?

interpolation
map year of max population
show 2021 JRC 100m resolution ?
sea level rise ?
lego ?
*/


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

//set selected layer from URL param
const urlParams = new URLSearchParams(window.location.search);

// read style selection from URL
const sty_ = urlParams.get("sty");
if (sty_) document.getElementById(sty_).checked = true

// read year from URL
const sel = urlParams.get("year");
if (sel) document.getElementById("year").value = sel

for (let cb of ["label", "grid", "boundary", "background"]) {
    const sel = urlParams.get(cb);
    if (sel == undefined) continue;
    document.getElementById(cb).checked = sel != "" && sel != "false" && +sel != 0
}

// background theme bt
const btParam = urlParams.get("bt");
if (btParam) {
    const a = document.getElementById(btParam)
    if (a) a.checked = true; else console.warn("bt param invalid:", btParam)
}

//smoothing
const dkfh = urlParams.get("sm");
if (dkfh) document.getElementById("sigmaSM").value = dkfh


// toggle options panel collapse from URL param
if (urlParams.get("collapsed")) document.getElementById("expand-toggle-button").click();

// interpolate
let interpolate = urlParams.get("itrp")
interpolate = interpolate != "" && interpolate != "false" && +interpolate != 0


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
    preprocess: c => {
        //prepare 2011 -> 2021 change data
        if (!c.p2011 && !c.p2021) c.d2011_2021 = 0;
        else if (!c.p2011 && c.p2021) c.d2011_2021 = +c.p2021;
        else if (c.p2011 && !c.p2021) c.d2011_2021 = -c.p2011;
        else c.d2011_2021 = c.p2021 - c.p2011;
        //ratio
        c.p2011_2021 = c.p2011 == 0 ? 999 : c.d2011_2021 / c.p2011;
    }
})


//make grid layer
const gridLayer = new gridviz.GridLayer(undefined, [], {
    visible: document.getElementById("grid").checked ? undefined : () => false,
    blendOperation: () => "multiply",
})

//set map layers
map.layers = [backgroundLayerElevation, backgroundLayerRoad2, gridLayer, backgroundLayerRoad, boundariesLayer, labelLayer];


//smoothing
const smooth = (styles) => {
    const sig = +document.getElementById('sigmaSM').value
    if (!sig) return styles
    return [new gridviz_smoothing.KernelSmoothingStyle({
        value: (c) => +c.p,
        smoothedProperty: "p",
        sigma: (r, z) => (r * sig) / 10,
        resolutionSmoothed: (r, z) => r, //z * 2,
        //filterSmoothed: (value) => value > 0.0005,
        styles: styles,
    })]
}


const update = () => {

    // get selection
    const mapCode = document.querySelector('input[name="style"]:checked').value;
    const year = document.getElementById("year").value;
    const change = mapCode.includes("Ch")

    //console.log(mapCode, year)

    // test that, for smoothing
    //console.log(styles.color[0])
    //styles.color[0].cvWGL = undefined

    // set dataset
    gridLayer.dataset = change ? dataset.change : dataset[year]
    // set style
    gridLayer.styles = change ? styles[mapCode] : smooth(styles[mapCode])

    gridLayer.minPixelsPerCell = mapCode == "segmentCh" ? 10 : ["size", "sizeCh", "lego"].includes(mapCode) ? 7 : mapCode == "pillar" ? 2.5 : mapCode == "joyplot" ? 5.5 : mapCode == "dots" ? 5 : 0.7;
    //gridLayer.blendOperation = ["size"].includes(mapCode) ? "source-over" : () => "multiply"

    // set backgorund to dark if necessary
    map.setBackgroundColor(mapCode == "colorDark" ? "black" : "white")
    for (let bck of [/*backgroundLayerRoad, backgroundLayerRoad2,*/ backgroundLayerElevation])
        bck.filterColor = mapCode == "colorDark" ? () => "#000000c0" : () => "#ffffffa0"

    gridLayer.blendOperation = ["colorDark"].includes(mapCode) ? () => "source-over" : (z) => z > 11 ? "source-over" : "multiply"

    // set tooltip
    gridLayer.cellInfoHTML = change ? tooltipFunCh : tooltipFun

    //redraw
    map.redraw();
    updateURL(map);
}

//initialise
update();

