
const tiledGridsURL = "https://ec.europa.eu/assets/estat/E/E4/gisco/website/census_2021_grid_map/tiles/";
const tiledTotalGridsURL = "https://ec.europa.eu/assets/estat/E/E4/gisco/website/census_2021_grid_map/tiles_total/";
const nuts2jsonURL = "https://ec.europa.eu/assets/estat/E/E4/gisco/pub/nuts2json/v2/";
const euronymURL = "https://ec.europa.eu/assets/estat/E/E4/gisco/pub/euronym/v3/UTF_LATIN/";
const bgLayerURLElevation = 'https://ec.europa.eu/eurostat/cache/GISCO/mbkg/elevation/'
const bgLayerURLRoad = 'https://ec.europa.eu/eurostat/cache/GISCO/mbkg/road/'

//define background layers

const backgroundLayerRoad = new gridviz.BackgroundLayer({
    url: bgLayerURLRoad,
    resolutions: Array.from({ length: 15 }, (_, i) => 114688 / Math.pow(2, i)),
    origin: [0, 6000000],
    nbPix: 512,
    pixelationCoefficient: 0.55,
    filterColor: (z) => z > 200 ? "#fff8" : "#fff4",
})

const backgroundLayerRoad2 = new gridviz.BackgroundLayer(
    gridviz_eurostat.giscoBackgroundLayer('OSMPositronCompositeEN', 19, 'EPSG3035', {
        pixelationCoefficient: 0.55,
    })
);


const backgroundLayerElevation = new gridviz.BackgroundLayer({
    url: bgLayerURLElevation,
    resolutions: Array.from({ length: 13 }, (_, i) => 114688 / Math.pow(2, i)),
    origin: [0, 6000000],
    nbPix: 256,
    pixelationCoefficient: 1,
    filterColor: () => "#fff8",
})

// function to define or refresh background layers visibility based on GUI
const updateBackgroundVisibility = () => {
    if (document.getElementById("background").checked) {
        document.getElementById("background_choice").style.display = "inline-block"
        backgroundLayerRoad.visible = document.getElementById("road").checked ? (z) => z > 11 : () => false
        backgroundLayerRoad2.visible = document.getElementById("road").checked ? (z) => z <= 11 : () => false
        backgroundLayerElevation.visible = document.getElementById("elevation").checked ? () => true : () => false
    } else {
        document.getElementById("background_choice").style.display = "none"
        backgroundLayerRoad.visible = () => false;
        backgroundLayerRoad2.visible = () => false;
        backgroundLayerElevation.visible = () => false;
    }
}



//define boundaries layer
const boundariesLayer = new gridviz.GeoJSONLayer(
    gridviz_eurostat.getEurostatBoundariesLayer({
        baseURL: nuts2jsonURL,
        showOth: false,
        color: (f, zf) => {
            const p = f.properties;
            if (p.id >= 100000) return "#bcbcbc";
            if (p.co === "T") return "#888";
            if (zf < 400) return "#888";
            else if (zf < 1000) return p.lvl >= 3 ? "" : "#888";
            else if (zf < 2000) return p.lvl >= 2 ? "" : "#888";
            else return p.lvl >= 1 ? "" : "#888";
        },
        visible: document.getElementById("boundary").checked ? undefined : () => false,
    })
);

//make label layer
const labelLayer = new gridviz.LabelLayer(
    gridviz_eurostat.getEuronymeLabelLayer("EUR", 20, {
        ccIn: ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "PL", "PT", "MT", "NL", "RO", "SE", "SK", "SI", "CH", "NO", "LI",],
        baseURL: euronymURL,
        //exSize: 1.7,
        visible: document.getElementById("label").checked ? undefined : () => false,
    })
);




//define multi resolution datasets

const dataset = new gridviz.MultiResolutionDataset(
    [1000, 2000, 5000, 10000, 20000, 50000, 100000],
    (resolution) => new gviz_par.TiledParquetGrid(map, tiledGridsURL + resolution + "/"),
    { preprocess: (c) => c.T && +c.T > 0 }
);

const datasetTotal = new gridviz.MultiResolutionDataset(
    [1000, 2000, 5000, 10000, 20000, 50000, 100000],
    (resolution) => new gviz_par.TiledParquetGrid(map, tiledTotalGridsURL + resolution + "/"),
    { preprocess: (c) => c.T && +c.T > 0 }
);

