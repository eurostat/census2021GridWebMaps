//TODO
//fix tooltip location bug
//reorganise code based on demography
//true age pyramid
//update x,y,z on view change
// revamp breaks ?

//generalise interpolation
//add chernoff faces - as GUI element, hidden
//sea level rise ?

/*
  Notes on data

  "T" >= Total population

  "F" >= Women
  "M" >= Men

  "EMP" >= Employed (working population)

  "Y_LT15" >= Age under 15 years
  "Y_1564" >= Age 15 to 64 years
  "Y_GE65" >= Age 65 years and older

  "SAME" >= Residence unchanged (as of January 1, 2021, compared to January 1, 2020)
  "CHG_IN" >= Moved within the country (as of January 1, 2021, compared to January 1, 2020)
  "CHG_OUT" >= Moved from outside the country (as of January 1, 2021, compared to January 1, 2020)

  "NAT" >= Born in the country
  "EU_OTH" >= Born in another EU member state
  "OTH" >= Born outside the EU
  */


const tiledGridsURL = "https://ec.europa.eu/assets/estat/E/E4/gisco/website/census_2021_grid_map/tiles/";
const tiledTotalGridsURL = "https://ec.europa.eu/assets/estat/E/E4/gisco/website/census_2021_grid_map/tiles_total/";
const nuts2jsonURL = "https://ec.europa.eu/assets/estat/E/E4/gisco/pub/nuts2json/v2/";
const euronymURL = "https://ec.europa.eu/assets/estat/E/E4/gisco/pub/euronym/v3/UTF_LATIN/";
const bgLayerURLElevation = 'https://ec.europa.eu/eurostat/cache/GISCO/mbkg/elevation/'
const bgLayerURLRoad = 'https://ec.europa.eu/eurostat/cache/GISCO/mbkg/road/'

const DEFAULTMAPSETTINGS = { x: 4096489, y: 2829097, z: 2000, backgroundColor: "white" };


//define map with initial view
const map = new gridviz.Map(document.getElementById("map"), {
    x: DEFAULTMAPSETTINGS.x,
    y: DEFAULTMAPSETTINGS.y,
    z: DEFAULTMAPSETTINGS.z,
    zoomExtent: [5, 10000],
})
    .addZoomButtons()
    .setViewFromURL()
//.addFullscreenButton()



// initialise map using URL parameters

//set selected layer from URL param
const urlParams = new URLSearchParams(window.location.search);

// read map code from URL
const sel = urlParams.get("map");
if (sel) document.getElementById("map").value = sel

// background theme bt
const btParam = urlParams.get("bt");
if (btParam) {
    const a = document.getElementById(btParam)
    if (a) a.checked = true; else console.warn("bt param invalid:", btParam)
}

// toggle options panel collapse from URL param
if (urlParams.get("collapsed")) document.getElementById("expand-toggle-button").click();

for (let cb of ["sbtp", "label", "boundary", "background"]) {
    const sel = urlParams.get(cb);
    if (sel == undefined) continue;
    document.getElementById(cb).checked = sel != "" && sel != "false" && +sel != 0
}

// interpolate
let interpolate = urlParams.get("interpolate")
interpolate = interpolate != "" && interpolate != "false" && +interpolate != 0


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
updateBackgroundVisibility()


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



//make grid layer
const gridLayer = new gridviz.GridLayer(undefined, []);
gridLayer.blendOperation = () => "multiply"


//set map layers
map.layers = [backgroundLayerElevation, backgroundLayerRoad, backgroundLayerRoad2, gridLayer, boundariesLayer, labelLayer];



//define multi resolution dataset
const dataset = new gridviz.MultiResolutionDataset(
    [1000, 2000, 5000, 10000, 20000, 50000, 100000],
    (resolution) => new gviz_par.TiledParquetGrid(map, tiledGridsURL + resolution + "/"),
    { preprocess: (c) => c.T && +c.T > 0 }
);

//define multi resolution dataset
const datasetTotal = new gridviz.MultiResolutionDataset(
    [1000, 2000, 5000, 10000, 20000, 50000, 100000],
    (resolution) => new gviz_par.TiledParquetGrid(map, tiledTotalGridsURL + resolution + "/"),
    { preprocess: (c) => c.T && +c.T > 0 }
);


//format function for percentages
const formatPercentage = d3.format(".1f");

//format function for large numbers
const _f = d3.format(",.0f");
const formatLarge = (v) => _f(v).replace(/,/g, " ");

//default color for not available data
const naColor = "#ccc";

//define not available legend
const naLegend = new gridviz.ColorCategoryLegend({
    colorLabel: [[naColor, "Data not available"]],
    shape: "square",
});

/*/use that style to show when a cell has some confidentiality
const confidentialStyle =
    new gridviz.ShapeColorSizeStyle({
          color: (c) => (c.CONFIDENTIALSTATUS ? '#666' : false),
          shape: () => 'circle',
          size: (c, r) => 0.25 * r,
          visible: z => z < 150
    })*/

//

// default stroke style
const strokeStyle = new gridviz.StrokeStyle({ strokeColor: () => "#fff8", visible: (z) => z < 70, blendOperation: () => "source-over" });

// total population style

//get colors
const colors = []
const classNumber = 8;
for (let i = 0; i <= (classNumber - 1); i++) colors.push(d3.interpolateYlOrRd(i / (classNumber - 1)))
const scaleTPop = interpolate ? gridviz.logarithmicScale(7) : gridviz.exponentialScale(7) //exponentialScale logarithmicScale

//style
let totPopStyle = new gridviz.SquareColorCategoryWebGLStyle({
    viewScale: cells => {
        [min, max] = d3.extent(cells, c => c.T)
        const breaks = []
        for (let i = 1; i < classNumber; i++) {
            let t = i / classNumber
            t = scaleTPop(t)
            //breaks.push(min + (max - min) * t)
            breaks.push(max * t)
        }
        return gridviz.classifier(breaks)
    },
    code: (c, r, z, classifier) => classifier(c.T),
    color: { ...colors },
})

//legend
const totPopLegend = new gridviz.ColorDiscreteLegend({
    title: "Population",
    width: Math.min(window.innerWidth - 40, 400),
    colors: () => colors,
    breaks: (viewScale) => viewScale?.breaks.map((b) => gridviz.nice(b)),
    labelFormat: formatLarge,
})
totPopStyle.legends = [totPopLegend];

if (interpolate) {
    //define interpolator
    const interpTotPopStyle = new gridviz.Interpolator({
        value: (c) => c.T,
        targetResolution: (r, z) => z,
        interpolatedProperty: 'T',
    })
    interpTotPopStyle.styles = [totPopStyle]
    totPopStyle = interpTotPopStyle
}



const update = () => {

    // get selected map code
    const mapCode = document.getElementById("map_select").value;
    const sbtp = document.getElementById("sbtp").checked;

    //enable/disable show/hide GUI components
    //TODO
    //document.getElementById("sbtp_div").style.display = layCode == "share" || layCode == "ternary" || layCode == "demography" ? 'inline-block' : 'none'

    //show/hide copyright html components
    const egCopyright = document.getElementById('eurogeographics-copyright');
    if (egCopyright) egCopyright.style.display = document.getElementById("boundary").checked ? 'inline-block' : 'none';
    const tomtomCopyright = document.getElementById('tomtom-copyright');
    if (tomtomCopyright) tomtomCopyright.style.display = document.getElementById("road").checked ? 'inline-block' : 'none';

    // set gridlayer dataset
    gridLayer.dataset = mapCode === "pop" ? datasetTotal : dataset

    //set gridlayer style
    if (mapCode === "pop") {
        //total population

        // update legend width
        totPopLegend.width = Math.min(window.innerWidth - 40, 400)

        // link legend, style and layer
        //gridLayer.styles = [interpTotPopStyle, strokeStyle,];
        gridLayer.styles = [totPopStyle];
        if (!interpolate) gridLayer.styles.push(strokeStyle)

        //set layer parameters
        gridLayer.minPixelsPerCell = interpolate ? 1.7 : 0.7;
        gridLayer.cellInfoHTML = (c) => "<b>" + formatLarge(c.T) + "</b> person" + (c.T == 1 ? "" : "s");

    } else if (["Y_LT15", "Y_1564", "Y_GE65", "F", "M", "EMP", "SAME", "CHG_IN", "CHG_OUT", "NAT", "EU_OTH", "OTH"].includes(mapCode)) {

        //get gui info
        const shareCode = "s" + mapCode;

        // get theme
        const theme = ["F", "M"].includes(mapCode) ? "sex"
            : ["Y_LT15", "Y_1564", "Y_GE65"].includes(mapCode) ? "age"
                : ["EMP"].includes(mapCode) ? "emp"
                    : ["SAME", "CHG_IN", "CHG_OUT"].includes(mapCode) ? "mob"
                        : ["NAT", "EU_OTH", "OTH"].includes(mapCode) ? "pob"
                            : undefined

        //define style breaks
        let breaks = breaksDict[mapCode];
        const classNumberColor = breaks.length + 1;
        const palette = theme == "sex" ? d3.schemeSpectral : d3.schemeYlOrRd;
        const colors = palette[classNumberColor];
        const classNumberSize = 4;

        if (sbtp) {
            const colorClassifier = gridviz.colorClassifier(breaks, colors);
            gridLayer.styles = [
                new gridviz.ShapeColorSizeStyle({
                    color: (c) => {
                        if (!c["p_" + theme]) compute[theme](c)
                        return c[shareCode] == undefined ? naColor : colorClassifier(c[shareCode]);
                    },
                    viewScale: gridviz.viewScaleQuantile({
                        valueFunction: (c) => +c.T,
                        classNumber: classNumberSize,
                        minSizePix: 2.5,
                        maxSizeFactor: 1.2,
                    }),
                    size: (c, r, z, viewScale) => viewScale(c.T),
                    shape: () => "circle",
                })
            ];
            gridLayer.minPixelsPerCell = 3;
        } else {
            const classifier = gridviz.classifier(breaks)
            const colDict = { ...colors }; colDict["na"] = naColor
            gridLayer.styles = [
                new gridviz.SquareColorCategoryWebGLStyle({
                    code: (c) => {
                        if (!c["p_" + theme]) compute[theme](c)
                        return c[shareCode] == undefined ? "na" : classifier(c[shareCode])
                    },
                    color: colDict,
                }),
                strokeStyle
            ];
            gridLayer.minPixelsPerCell = 0.7;
        }

        const style = gridLayer.styles[0];

        //share color legend
        style.addLegends([
            new gridviz.ColorDiscreteLegend({
                title: legendTitles[mapCode],
                width: 250,
                colors: () => colors,
                breaks: () => breaks,
                labelFormat: (v, i) => v + (i == 1 || i == breaks.length ? "%" : ""),
            }),
        ]);

        //na legend
        style.legends.push(naLegend);

        //population size legend
        if (sbtp)
            style.addLegends(
                gridviz.sizeDiscreteViewScaleLegend(classNumberSize, {
                    title: "Population",
                    fillColor: "#666",
                    labelFormat: (v) => formatLarge(gridviz.nice(v)),
                })
            );

        //tooltip text
        gridLayer.cellInfoHTML = (c) => {
            const pop_ = "<br>" + formatLarge(c.T) + " person" + (c.T == 1 ? "" : "s");
            if (c[mapCode] == undefined || c[shareCode] == undefined)
                return "Data not available" + (c.CONFIDENTIALSTATUS ? " (confidential)" : "") + pop_;
            return "<b>" + formatPercentage(c[shareCode]) + " %</b><br>" + formatLarge(c[mapCode]) + pop_;
        };

    } else if (["ter_age", "ter_mob", "ter_pob"].includes(mapCode)) {

        //get gui info
        const theme = mapCode.replace("ter_", "");

        const classNumberSize = 4;

        // get color ternary classifier
        let colorTernaryFun;
        if (theme == "age")
            colorTernaryFun = gridviz.ternaryColorClassifier(
                ["sY_LT15", "sY_1564", "sY_GE65"],
                () => 100,
                ["#4daf4a", "#377eb8", "#e41a1c"],
                {
                    center: [0.15, 0.64, 0.21],
                    centerColor: "#999",
                    centerCoefficient: 0.25,
                    defaultColor: naColor,
                }
            );
        else if (theme == "mob")
            colorTernaryFun = gridviz.ternaryColorClassifier(
                ["sCHG_OUT", "sSAME", "sCHG_IN"],
                () => 100,
                ["#4daf4a", "#377eb8", "#e41a1c"],
                {
                    center: [0.05, 0.85, 0.1],
                    centerColor: "#999",
                    centerCoefficient: 0.25,
                    defaultColor: naColor,
                }
            );
        else if (theme == "pob")
            colorTernaryFun = gridviz.ternaryColorClassifier(
                ["sOTH", "sNAT", "sEU_OTH"],
                () => 100,
                ["#4daf4a", "#377eb8", "#e41a1c"],
                {
                    center: [0.25, 0.6, 0.15],
                    centerColor: "#999",
                    centerCoefficient: 0.25,
                    defaultColor: naColor,
                }
            );


        if (sbtp) {

            // prop circles
            gridLayer.styles = [
                new gridviz.ShapeColorSizeStyle({
                    color: (c) => {
                        if (theme == "age" && !c.p_age) compute.age(c);
                        else if (theme == "mob" && !c.p_mob) compute.mob(c);
                        else if (theme == "pob" && !c.p_pob) compute.pob(c);
                        return colorTernaryFun(c) || naColor;
                    },
                    viewScale: gridviz.viewScaleQuantile({
                        valueFunction: (c) => +c.T,
                        classNumber: classNumberSize,
                        minSizePix: 2.5,
                        maxSizeFactor: 1.2,
                    }),
                    size: (c, r, z, viewScale) => viewScale(c.T),
                    shape: () => "circle",
                })
            ];
            gridLayer.minPixelsPerCell = 3;
        } else {

            // get ternary classifier
            let ternaryFun;
            if (theme == "age")
                ternaryFun = gridviz.ternaryClassifier(
                    ["sY_LT15", "sY_1564", "sY_GE65"],
                    () => 100,
                    { center: [0.15, 0.64, 0.21], centerCoefficient: 0.25 }
                );
            else if (theme == "mob")
                ternaryFun = gridviz.ternaryClassifier(
                    ["sCHG_OUT", "sSAME", "sCHG_IN"],
                    () => 100,
                    { center: [0.05, 0.85, 0.1], centerCoefficient: 0.25 }
                );
            else if (theme == "pob")
                ternaryFun = gridviz.ternaryClassifier(
                    ["sOTH", "sNAT", "sEU_OTH"],
                    () => 100,
                    { center: [0.25, 0.6, 0.15], centerCoefficient: 0.25 }
                );

            // colors
            const colDict = {
                center: "#999",
                "0": "#4daf4a", "1": "#377eb8", "2": "#e41a1c",
                "m01": "rgb(79, 150, 133)", "m02": "rgb(174, 127, 48)", "m12": "rgb(171, 96, 106)",
                "unknown": naColor,
            };

            //pixel style
            gridLayer.styles = [
                new gridviz.SquareColorCategoryWebGLStyle({
                    code: (c) => {
                        if (theme == "age" && !c.p_age) compute.age(c);
                        else if (theme == "mob" && !c.p_mob) compute.mob(c);
                        else if (theme == "pob" && !c.p_pob) compute.pob(c);
                        return ternaryFun(c)
                    },
                    color: colDict,
                }),
                strokeStyle
            ];
            gridLayer.minPixelsPerCell = 0.7;
        }

        //legends

        const style = gridLayer.styles[0];
        const legendWidth = 150;
        if (theme == "age")
            style.legends = [
                new gridviz.TernaryLegend({
                    title: "Age",
                    classifier: colorTernaryFun,
                    width: legendWidth,
                    tooltip: map.tooltip,
                    texts: {
                        0: "Over-representation of persons aged <15",
                        1: "Over-representation of persons aged 15 to 64",
                        2: "Over-representation of persons aged >=65",
                        12: "Under-representation of persons aged <15",
                        "02": "Under-representation of<br>persons aged 15 to 64",
                        "01": "Under-representation of persons aged >=65",
                        center: "Balanced representation of age groups",
                    },
                    leftText: "Under 15",
                    topText: "15 to 64",
                    rightText: "65 and older",
                    centerCoefficient: 0.5,
                }),
            ];
        else if (theme == "mob")
            style.legends = [
                new gridviz.TernaryLegend({
                    title: "Mobility (2020-2021)",
                    classifier: colorTernaryFun,
                    width: legendWidth,
                    tooltip: map.tooltip,
                    texts: {
                        0: "Over-representation of persons<br>that moved from outside the country",
                        1: "Over-representation of persons<br>with residence unchanged",
                        2: "Over-representation of persons<br>that moved within the country",
                        12: "Under-representation of persons<br>that moved from outside the country",
                        "02": "Under-representation of persons<br>with residence unchanged",
                        "01": "Under-representation of persons<br>that moved within the country",
                        center: "Balanced representation of mobility groups",
                    },
                    leftText: "Outside",
                    topText: "No change",
                    rightText: "Inside country",
                    centerCoefficient: 0.5,
                }),
            ];
        else if (theme == "pob")
            style.legends = [
                new gridviz.TernaryLegend({
                    title: "Birth place",
                    classifier: colorTernaryFun,
                    width: legendWidth,
                    tooltip: map.tooltip,
                    texts: {
                        0: "Over-representation of persons<br>born outside the EU",
                        1: "Over-representation of persons<br>born in the country",
                        2: "Over-representation of persons<br>born in another EU member state",
                        12: "Under-representation of persons<br>born outside the EU",
                        "02": "Under-representation of persons<br>born in the country",
                        "01": "Under-representation of persons<br>born in another EU member state",
                        center: "Balanced representation",
                    },
                    leftText: "Rest of the world",
                    topText: "Same country",
                    rightText: "EU",
                    centerCoefficient: 0.5,
                }),
            ];

        //na legend
        style.legends.push(naLegend);

        //population legend
        if (sbtp)
            style.addLegends(
                gridviz.sizeDiscreteViewScaleLegend(classNumberSize, {
                    title: "Population",
                    fillColor: "#666",
                    labelFormat: (v) => formatLarge(gridviz.nice(v)), //Math.round,
                })
            );

        //tooltip text
        if (theme == "age")
            gridLayer.cellInfoHTML = (c) => {
                let total = c.Y_LT15 + c.Y_1564 + c.Y_GE65;
                if (isNaN(total)) total = c.T;
                const tot_ = "<b>" + formatLarge(total) + "</b> person" + (total == 1 ? "" : "s") + "<br>";
                if (c.Y_LT15 == undefined || c.Y_1564 == undefined || c.Y_GE65 == undefined)
                    return tot_ + "Decomposition data not available" + (c.CONFIDENTIALSTATUS ? "<br>(confidential)" : "");
                return (
                    tot_ +
                    formatPercentage(c.sY_LT15) +
                    "% under 15 years<br>" +
                    formatPercentage(c["sY_1564"]) +
                    "% 15 to 64 years<br>" +
                    formatPercentage(c.sY_GE65) +
                    "% 65 years and older"
                );
            };
        else if (theme == "mob")
            gridLayer.cellInfoHTML = (c) => {
                let total = c.CHG_IN + c.SAME + c.CHG_OUT;
                if (isNaN(total)) total = c.T;
                const tot_ = "<b>" + formatLarge(total) + "</b> person" + (total == 1 ? "" : "s") + "<br>";
                if (c.CHG_IN == undefined || c.SAME == undefined || c.CHG_OUT == undefined)
                    return tot_ + "Decomposition data not available" + (c.CONFIDENTIALSTATUS ? "<br>(confidential)" : "");
                return (
                    tot_ +
                    formatPercentage(c.sSAME) +
                    "% residence unchanged<br>" +
                    formatPercentage(c.sCHG_IN) +
                    "% moved within the country<br>" +
                    formatPercentage(c.sCHG_OUT) +
                    "% moved from outside the country"
                );
            };
        else if (theme == "pob")
            gridLayer.cellInfoHTML = (c) => {
                let total = c.NAT + c.EU_OTH + c.OTH;
                if (isNaN(total)) total = c.T;
                const tot_ = "<b>" + formatLarge(total) + "</b> person" + (total == 1 ? "" : "s") + "<br>";
                if (c.NAT == undefined || c.EU_OTH == undefined || c.OTH == undefined)
                    return tot_ + "Decomposition data not available" + (c.CONFIDENTIALSTATUS ? "<br>(confidential)" : "");
                return (
                    tot_ +
                    formatPercentage(c.sNAT) +
                    "% born in the country<br>" +
                    formatPercentage(c.sEU_OTH) +
                    "% born in another EU member state<br>" +
                    formatPercentage(c.sOTH) +
                    "% born outside the EU"
                );
            };

    } else if (["ageing","dep_ratio","oa_dep_ratio","y_dep_ratio","median_age"].includes(mapCode)) {

        //get gui info
        const theme = mapCode

        //define style
        const breaks = breaksDict[theme]
        const classNumberColor = breaks.length + 1;
        const palette = d3.schemeSpectral //: d3.schemeYlOrRd;
        const colors = palette[classNumberColor].slice().reverse()
        const classNumberSize = 4;

        if (sbtp) {
            const colorClassifier = gridviz.colorClassifier(breaks, colors);

            gridLayer.styles = [
                new gridviz.ShapeColorSizeStyle({
                    color: (c) => {
                        if (c[theme] == undefined) compute[theme](c)
                        return c[theme] < 0 ? naColor : colorClassifier(c[theme]);
                    },
                    viewScale: gridviz.viewScaleQuantile({
                        valueFunction: (c) => +c.T,
                        classNumber: classNumberSize,
                        minSizePix: 2.5,
                        maxSizeFactor: 1.2,
                    }),
                    size: (c, r, z, viewScale) => viewScale(c.T),
                    shape: () => "circle",
                })
            ];
            gridLayer.minPixelsPerCell = 3;
        } else {
            const classifier = gridviz.classifier(breaks)
            const colDict = { ...colors }; colDict["na"] = naColor

            gridLayer.styles = [
                new gridviz.SquareColorCategoryWebGLStyle({
                    code: (c) => {
                        if (c[theme] == undefined) compute[theme](c)
                        return c[theme] < 0 ? "na" : classifier(c[theme]);
                    },
                    color: colDict,
                }),
                strokeStyle
            ];
            gridLayer.minPixelsPerCell = 0.7;
        }

        const style = gridLayer.styles[0]

        //demography color legend
        style.addLegends([
            new gridviz.ColorDiscreteLegend({
                title: legendTitles[theme],
                width: 250,
                colors: () => colors,
                breaks: () => breaks,
            }),
        ]);

        //na legend
        style.legends.push(naLegend);

        //population size legend
        if (sbtp)
            style.addLegends(
                gridviz.sizeDiscreteViewScaleLegend(classNumberSize, {
                    title: "Population",
                    fillColor: "#666",
                    labelFormat: (v) => formatLarge(gridviz.nice(v)), //Math.round,
                })
            );


        //tooltip
        gridLayer.cellInfoHTML = (c) => {
            const buf = []
            let line = "<b>" + c[theme].toFixed(0) + "</b>"
            if (theme == "ageing") line += " seniors (65+) per 100 young (0-14)"
            if (theme == "dep_ratio") line += " seniors (65+) and young (0-14) per 100 active (15-64)"
            if (theme == "oa_dep_ratio") line += " seniors (65+) per 100 active (15-64)"
            if (theme == "y_dep_ratio") line += " in young (0-14) per 100 active (15-64)"
            if (theme == "median_age") line += " years"
            buf.push(line)

            let total = c.Y_LT15 + c.Y_1564 + c.Y_GE65;
            if (isNaN(total)) total = c.T;
            const tot_ = formatLarge(total) + " person" + (total == 1 ? "" : "s");
            buf.push(tot_)

            buf.push(c.Y_LT15 + " - under 15 years")
            if (theme != "ageing") buf.push(c.Y_1564 + " - 15 to 64 years")
            buf.push(c.Y_GE65 + " - 65 years and older")
            return buf.join("<br>");
        };





    } else if (mapCode === "sex_balance") {
        //sex - color classifier
        const breaks = [-20, -7, -2, -0.5, 0.5, 2, 7, 20];
        const sexColorClassifier = gridviz.colorClassifier(breaks, d3.schemeSpectral[breaks.length + 1]);

        const classNumberSize = 4;
        const style = new gridviz.ShapeColorSizeStyle({
            color: (c) => (c.indMF == undefined ? naColor : sexColorClassifier(c.indMF)),
            size: (c, r, z, viewScale) => viewScale(c.T),
            viewScale: gridviz.viewScaleQuantile({
                valueFunction: (c) => {
                    if (!c.p_sex) compute.sex(c);
                    return +c.T;
                },
                classNumber: classNumberSize,
                minSizePix: 2.5,
                maxSizeFactor: 1.2,
            }),
            shape: () => "circle",
        });
        gridLayer.styles = [style];

        gridLayer.minPixelsPerCell = 3;

        style.legends = [];

        //sex color legend
        style.legends.push(
            new gridviz.ColorDiscreteLegend({
                title: "Women / men balance, in %",
                width: 300,
                colors: () => sexColorClassifier.colors,
                breaks: () => sexColorClassifier.breaks,
            })
        );

        //na legend
        style.legends.push(naLegend);

        //population size legend
        style.addLegends(
            gridviz.sizeDiscreteViewScaleLegend(classNumberSize, {
                title: "Population",
                fillColor: "#666",
                labelFormat: (v) => formatLarge(gridviz.nice(v)), //Math.round,
            })
        );

        gridLayer.cellInfoHTML = (c) => {
            let tot = c.F + c.M;
            if (isNaN(tot)) tot = c.T;
            const pop_ = "<b>" + formatLarge(tot) + "</b> person" + (tot == 1 ? "" : "s") + "<br>";
            if (c.F == undefined || c.M == undefined)
                return "Data not available" + (c.CONFIDENTIALSTATUS ? " (confidential)" : "") + "<br>" + pop_;
            return (
                pop_ +
                formatLarge(c.M) +
                " m" +
                (c.M == 1 ? "a" : "e") +
                "n<br>" +
                formatLarge(c.F) +
                " wom" +
                (c.F == 1 ? "a" : "e") +
                "n<br>" +
                "Difference: <b>" +
                (c.indMF > 0 ? "+" : "") +
                formatPercentage(c.indMF) +
                " % men</b>"
            );
        };

    } else if (mapCode === "age_pyramid") {
        const colAge = d3.interpolateSpectral;
        const classNumberSize = 4;
        gridLayer.styles = [
            new gridviz.CompositionStyle({
                color: {
                    Y_LT15: colAge(0.2),
                    Y_1564: colAge(0.4),
                    Y_GE65: colAge(0.9),
                },
                type: () => "flag", //flag, piechart, ring, segment, radar, agepyramid, halftone
                size: (c, r, z, scale) => scale(c.T),
                viewScale: gridviz.viewScaleQuantile({
                    valueFunction: (c) => +c.T,
                    classNumber: classNumberSize,
                    minSizePix: 8,
                    maxSizeFactor: 0.9,
                }),
                //viewScale: gridviz.sizeScale({ valueFunction: (c) => +c.T, exponent: 0.1 }),
                //stripesOrientation: () => 90,
            }),
        ];

        gridLayer.minPixelsPerCell = 12;

        //age
        gridLayer.styles[0].legends = [
            new gridviz.ColorCategoryLegend({
                title: "Age",
                colorLabel: [
                    [colAge(0.2), "Under 15 years"],
                    [colAge(0.4), "15 to 64 years"],
                    [colAge(0.9), "65 years and older"],
                ],
            }),
        ];

        //population
        gridLayer.styles[0].addLegends(
            gridviz.sizeDiscreteViewScaleLegend(classNumberSize, {
                title: "Population",
                shape: "square",
                fillColor: "#666",
                labelFormat: (v) => formatLarge(gridviz.nice(v)), //Math.round,
            })
        );

        gridLayer.cellInfoHTML = (c) =>
            c.Y_LT15 == undefined || c.Y_1564 == undefined || c.Y_GE65 == undefined
                ? undefined
                : "<b>" +
                formatLarge(c.Y_LT15 + c.Y_1564 + c.Y_GE65) +
                "</b> person" +
                (c.Y_LT15 + c.Y_1564 + c.Y_GE65 == 1 ? "" : "s") +
                "<br>" +
                formatLarge(c.Y_LT15) +
                " - under 15 years<br>" +
                formatLarge(c.Y_1564) +
                " - 15 to 64 years<br>" +
                formatLarge(c.Y_GE65) +
                " - 65 years and older";
    } else if (mapCode === "mobility_pc") {
        const classNumberSize = 5;
        gridLayer.styles = [
            new gridviz.CompositionStyle({
                color: {
                    SAME: "#fed9a6", //light mostard
                    CHG_IN: "#7570b3", //blueish
                    CHG_OUT: "#d95f02", //orange
                },
                type: () => "piechart", //flag, piechart, ring, segment, radar, agepyramid, halftone
                size: (c, r, z, scale) => scale(c.T),
                viewScale: gridviz.viewScaleQuantile({
                    valueFunction: (c) => +c.T,
                    classNumber: classNumberSize,
                    minSizePix: 6,
                    maxSizeFactor: 1.2,
                }),
            }),
        ];

        gridLayer.minPixelsPerCell = 12;

        //mobility
        gridLayer.styles[0].legends = [
            new gridviz.ColorCategoryLegend({
                title: "Mobility, compared to January 1, 2020",
                colorLabel: [
                    ["#fed9a6", "Residence unchanged"],
                    ["#7570b3", "Moved within the country"],
                    ["#d95f02", "Moved from outside the country"],
                ],
            }),
        ];

        //population
        gridLayer.styles[0].addLegends(
            gridviz.sizeDiscreteViewScaleLegend(classNumberSize, {
                title: "Population",
                fillColor: "#666",
                labelFormat: (v) => formatLarge(gridviz.nice(v)), //Math.round,
            })
        );

        gridLayer.cellInfoHTML = (c) =>
            c.SAME == undefined || c.CHG_IN == undefined || c.CHG_OUT == undefined
                ? undefined
                : "<b>" +
                formatLarge(c.SAME + c.CHG_IN + c.CHG_OUT) +
                "</b> person" +
                (c.SAME + c.CHG_IN + c.CHG_OUT == 1 ? "" : "s") +
                "<br>" +
                formatLarge(c.SAME) +
                " residence unchanged<br>" +
                formatLarge(c.CHG_IN) +
                " moved within the country<br>" +
                formatLarge(c.CHG_OUT) +
                " moved from outside the country";

    } else if (mapCode === "pob_pc") {
        const classNumberSize = 5;
        gridLayer.styles = [
            new gridviz.CompositionStyle({
                color: {
                    NAT: "#fed9a6", //light mostard
                    EU_OTH: "#7570b3", //blueish
                    OTH: "#d95f02", //orange
                },
                type: () => "halftone", //flag, piechart, ring, segment, radar, agepyramid, halftone
                size: (c, r, z, scale) => scale(c.T),
                viewScale: gridviz.viewScaleQuantile({
                    valueFunction: (c) => +c.T,
                    classNumber: classNumberSize,
                    minSizePix: 8,
                }),
            }),
        ];

        gridLayer.minPixelsPerCell = 12;

        //place of birth
        gridLayer.styles[0].legends = [
            new gridviz.ColorCategoryLegend({
                title: "Place of birth",
                colorLabel: [
                    ["#fed9a6", "Born in the country"],
                    ["#7570b3", "Born in another EU member state"],
                    ["#d95f02", "Born outside the EU"],
                ],
            }),
        ];

        //population
        gridLayer.styles[0].addLegends(
            gridviz.sizeDiscreteViewScaleLegend(classNumberSize, {
                title: "Population",
                fillColor: "#666",
                labelFormat: (v) => formatLarge(gridviz.nice(v)), //Math.round,
            })
        );

        gridLayer.cellInfoHTML = (c) =>
            c.NAT == undefined || c.EU_OTH == undefined || c.OTH == undefined
                ? undefined
                : "<b>" +
                formatLarge(c.NAT + c.EU_OTH + c.OTH) +
                "</b> person" +
                (c.NAT + c.EU_OTH + c.OTH == 1 ? "" : "s") +
                "<br>" +
                formatLarge(c.NAT) +
                " born in the country<br>" +
                formatLarge(c.EU_OTH) +
                " born in another EU member state<br>" +
                formatLarge(c.OTH) +
                " born outside the EU";


    } else if (mapCode === "chernoff") {
        if (!chernoffImages) return;

        //age color - 3/4 classes
        const ageClassifier = gridviz.ternaryClassifier(["sY_LT15", "sY_1564", "sY_GE65"], (c) => 100, {
            center: [0.15, 0.64, 0.21],
            withMixedClasses: false,
        });

        //sex code
        const sexClassifier = (c) => (c.indMF <= 0 ? "f" : "m");

        //employment class
        const breaks = [45, 55];
        const empClassifier = gridviz.classifier(breaks);

        const classNumberSize = 3;
        const style = new gridviz.ImageStyle({
            imageCode: (c) => {
                const a = +ageClassifier(c);
                const ageCode = a == 0 ? "y" : a == 1 ? "m" : "o";
                const sexCode = sexClassifier(c);
                const empCode = empClassifier(c.sEMP);
                return sexCode + ageCode + empCode;
            },
            images: chernoffImages,
            size: (c, r, z, viewScale) => viewScale(c.T),
            viewScale: gridviz.viewScaleQuantile({
                valueFunction: (c) => +c.T,
                classNumber: classNumberSize,
                minSizePix: 30,
                maxSizeFactor: 0.9,
            }),
        });
        gridLayer.styles = [style];

        gridLayer.minPixelsPerCell = 40;

        gridLayer.cellInfoHTML = (c) => {
            const a = ageClassifier(c);
            const s = sexClassifier(c);
            const e = empClassifier(c.sEMP);
            return (
                "" +
                c.T +
                " person" +
                (c.T ? "s" : "") +
                "<br>Over-representation of <b>" +
                (s == "m" ? "men" : "women") +
                "</b>" +
                "<br>" +
                (a == "0"
                    ? "younger than <b>15</b>"
                    : a == "1"
                        ? "aged between <b>15 and 64</b>"
                        : "aged <b>65</b> and older") +
                "<br>with <b>" +
                (e == 0 ? "low" : e == 1 ? "average" : "high") +
                "</b> employment"
            );
        };
    } else console.error("Unexpected layer code: " + mapCode);

    //redraw
    map.redraw();
    updateURL();
};

//home button
document.getElementById("home-button").addEventListener("click", (event) => {
    event.stopPropagation();
    map.setView(DEFAULTMAPSETTINGS.x, DEFAULTMAPSETTINGS.y);
    map.setZoom(DEFAULTMAPSETTINGS.z);
    map.redraw();
    updateURL();
});

//map update
document.getElementById("map_select").addEventListener("change", update);
document.getElementById("sbtp").addEventListener("change", update);

// show/hide labels
document.getElementById("label").addEventListener("change", function () {
    labelLayer.visible = this.checked ? undefined : () => false;
    map.redraw();
    updateURL();
});

// show/hide boundaries
document.getElementById("boundary").addEventListener("change", function () {
    boundariesLayer.visible = this.checked ? undefined : () => false;
    map.redraw();
    updateURL();
});

// show/hide background layer
document.getElementById("background").addEventListener("change", function () {
    updateBackgroundVisibility()
    map.redraw();
    updateURL();
});

// show/hide road background layer
document.getElementById("road").addEventListener("change", function () {
    updateBackgroundVisibility()
    map.redraw();
    updateURL();
});

// show/hide elevation background layer
document.getElementById("elevation").addEventListener("change", function () {
    updateBackgroundVisibility()
    map.redraw();
    updateURL();
});


// update URL with map parameters
//TODO should be trigerred also on map move end event
const updateURL = () => {
    //get parameters
    const p = new URLSearchParams(window.location.search);

    // map viewport
    const v = map.getView();
    p.set("x", v.x.toFixed(0)); p.set("y", v.y.toFixed(0)); p.set("z", v.z.toFixed(0));

    // handle dropdowns selection
    p.set("map", document.getElementById("map").value);

    // handle checkboxes
    for (let cb of ["sbtp", "label", "boundary", "background"])
        p.set(cb, document.getElementById(cb).checked ? "1" : "");

    // handle background theme selection
    p.set("bt", document.querySelector('input[name="background_theme"]:checked').value);

    // handle collapse
    //TODO
    //document.getElementById("expandable-content").classList.contains("collapsed")
    //p.set("collapsed", document.getElementById("sidebar").classList.contains("collapsed") ? "1" : "");
    //if (urlParams.get("collapsed")) document.getElementById("expand-toggle-button").click();

    //interpolate
    p.set("interpolate", interpolate ? "1" : "");

    //set URL with map parameters
    const newURL = `${window.location.pathname}?${p.toString()}`;
    window.history.replaceState({}, '', newURL);
};

//initialise
update();
