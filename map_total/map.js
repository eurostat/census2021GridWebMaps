/* TODO

https://ec.europa.eu/assets/estat/E/E4/gisco/website/grid_map/index.html
fix styles - backgrounds adaptation
fix GUI layout

map year of max population
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
}).setViewFromURL().addZoomButtons()
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

// show JRC 100m
let jrc100 = urlParams.get("jrc100")


//
updateLayersVisibility()


//show/hide copyright html components
document.getElementById('eurogeographics-copyright').style.display = document.getElementById("boundary").checked ? 'inline-block' : 'none';
document.getElementById('tomtom-copyright').style.display =
    document.getElementById("road").checked && document.getElementById("background").checked ? 'inline-block' : 'none';



//define multi resolution datasets
const dataset = {}
for (let year of ["2006", "2011", "2018", "2021"]) {
    dataset[year] = new gridviz.MultiResolutionDataset(
        [1000, 2000, 5000, 10000, 20000, 50000, 100000],
        (resolution) => new gviz_par.TiledParquetGrid(map, tilesUrl + year + "/" + resolution + "/"), {
        /*preprocess: c => {}*/
    })
}

// use 100m jrc dataset
if (jrc100) {
    const tilesURL = "https://ec.europa.eu/assets/estat/E/E4/gisco/website/census_2021_grid_map/tiles/";
    dataset["2021"] = new gridviz.MultiResolutionDataset(
        [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000],
        (resolution) => new gviz_par.TiledParquetGrid(map, tilesURL + "tiles_total/" + resolution + "/"), {
        preprocess: c => {
            if (!c.T) return false
            //c.p = c.T
            //delete c.T
        }
    })
    styles.pillar[0].simple = (r, z) => z > 6
}


dataset.change = new gridviz.MultiResolutionDataset(
    [1000, 2000, 5000, 10000, 20000, 50000, 100000],
    (resolution) => new gviz_par.TiledParquetGrid(map, tilesUrl + "change/" + resolution + "/"), {
    preprocess: c => {
        // filter out those cases
        if (c.T2011 == undefined || c.T2021 == undefined) return false
        if (c.T2011 == 0 && c.T2021 == 0) return false

        // compute change
        c.d2011_2021 = c.T2021 - c.T2011;
        // compute change ratio
        c.p2011_2021 = c.T2011 == 0 ? 999 : c.d2011_2021 / c.T2011;
    }
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
    const change = mapCode.includes("Ch")
    const sig = +document.getElementById('sigmaSM').value

    //console.log(mapCode, year)

    // test that, for smoothing
    //console.log(styles.color[0])
    styles.color[0].x = undefined
    styles.colorDark[0].x = undefined
    styles.colorCh[0].x = undefined

    // set dataset
    gridLayer.dataset = change ? dataset.change : dataset[year]

    // set resolution
    gridLayer.minPixelsPerCell = mapCode == "segmentCh" ? 10 : ["size", "sizeCh", "lego"].includes(mapCode) ? 7 : mapCode == "pillar" ? 2.5 : mapCode == "joyplot" ? 3.5 : mapCode == "dots" ? 5 : 0.7;

    // set style
    const styles_ = styles[mapCode]
    if (sig && mapCode != "segmentCh") {
        //smoothing
        const prop = change ? "d2011_2021" : "T"
        gridLayer.styles = [new gridviz_smoothing.KernelSmoothingStyle({
            value: (c) => +c[prop],
            smoothedProperty: prop,
            sigma: (r, z) => (r * (sig + 1.5)) / 10,
            resolutionSmoothed: mapCode.includes("color") ? (r, z) => 1.5 * z : r => r,
            filterSmoothed: /*change ? undefined :*/ (v) => Math.abs(v) > 0.0001,
            styles: styles_,
        })]
        if (mapCode.includes("color")) gridLayer.minPixelsPerCell *= 2
    } else gridLayer.styles = styles_

    //gridLayer.blendOperation = ["size"].includes(mapCode) ? "source-over" : () => "multiply"

    strokeStyle.visible = sig || jrc100 ? () => false : (z) => z < 15

    // set backgorund to dark if necessary
    map.setBackgroundColor(mapCode == "colorDark" ? "black" : "white")
    for (let bck of [/*backgroundLayerRoad, backgroundLayerRoad2,*/ backgroundLayerElevation])
        bck.filterColor = mapCode == "colorDark" ? () => "#000000c0" : () => "#ffffffa0"

    gridLayer.blendOperation = ["colorDark"].includes(mapCode) ? () => "source-over" : (z) => z > 11 ? "source-over" : "multiply"


    // change label color for dark mode
    labelLayer.color = mapCode == "colorDark" ? () => "white" : () => "black"
    labelLayer.haloColor = mapCode == "colorDark" ? () => "black" : () => "white"
    // change boundaries color for dark mode
    boundariesLayer.color = mapCode == "colorDark" ? colorBND("#777") : colorBND("#cc6699")


    // set tooltip
    gridLayer.cellInfoHTML = change ? tooltipFunCh : tooltipFun

    //redraw
    map.redraw();
    updateURL(map);
}

//initialise
update();

