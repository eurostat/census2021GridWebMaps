
//fix tooltip bug
//euronym - fix marseille 14e !!!
//update background URL
//add road background layer - add tomtom copyright
//new indicators
//live update url
//use interpolator ?
//add chernoff faces ?
//sea level rise ?
//true age pyramid
//debug interpolation: negative values !!!

/*
Aging Index
The indicator based on the ratio of individuals aged 65+ to those aged 0-15

Dependency Ratios:
Youth Dependency Ratio: This is the ratio of individuals aged 0-15 to those aged 16-64. It indicates the burden on the working-age population to support the youth.
Old-Age Dependency Ratio: The ratio of individuals aged 65+ to those aged 16-64. It reflects the pressure on the working-age population to support the elderly.
Total Dependency Ratio: Combines both youth and old-age dependency ratios.

median age estimation
Calculate Total Population: total_population = pop_0_15 + pop_16_64 + pop_65_plus
Find Median Position: median_position = total_population / 2
Determine median age group
if median_position < pop_0_15
                median_age = 15 * (median_position / pop_0_15)
else if median_position < pop_16_64
                offset_in_16_64 = median_position - pop_0_15
                median_age = 16 + 48 * (offset_in_16_64 / pop_16_64)
else ...
                offset_in_65_plus = median_position - (pop_0_15 + pop_16_64)
                median_age = 65 + 15 * (offset_in_65_plus / pop_65_plus)
                (with 15 years for dispersion)
year of maximum population
 */


//urls for production
const tiledGridsURL = "https://ec.europa.eu/assets/estat/E/E4/gisco/website/census_2021_grid_map/tiles/";
const tiledTotalGridsURL = "https://ec.europa.eu/assets/estat/E/E4/gisco/website/census_2021_grid_map/tiles_total/";
const nuts2jsonURL = "https://ec.europa.eu/assets/estat/E/E4/gisco/pub/nuts2json/v2/";
const euronymURL = "https://ec.europa.eu/assets/estat/E/E4/gisco/pub/euronym/v3/UTF_LATIN/";
const bgLayerURL = "https://ec.europa.eu/eurostat/cache/GISCO/mbkg/elevation_shading/";

/*/urls for development
  const tiledGridsURL = "http://127.0.0.1:5500/"
  const nuts2jsonURL = undefined
  const euronymURL = undefined
  const bgLayerURL = 'https://raw.githubusercontent.com/jgaffuri/mbxyz/main/pub/elevation_shading/'
*/

const DEFAULTMAPSETTINGS = { x: 4096489, y: 2829097, z: 2000, backgroundColor: "white" };

/*
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

//define map with initial view
const map = new gridviz.Map(document.getElementById("map"), {
    x: DEFAULTMAPSETTINGS.x,
    y: DEFAULTMAPSETTINGS.y,
    z: DEFAULTMAPSETTINGS.z,
    zoomExtent: [10, 10000],
})
    .addZoomButtons()
    //.addFullscreenButton()
    .setViewFromURL();

const backgroundLayer1 = new gridviz.BackgroundLayer({
    url: bgLayerURL,
    resolutions: Array.from({ length: 9 }, (_, i) => 28.00132289714475 * Math.pow(2, 10 - i)),
    origin: [0, 6000000],
    filterColor: () => "#ffffffc0",
    visible: (z) => z > 50,
});

const backgroundLayer2 = new gridviz.BackgroundLayer(
    gridviz_eurostat.giscoBackgroundLayer("OSMPositronBackground", 18, "EPSG3035", {
        visible: (z) => z <= 50,
    })
);

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
    })
);

//make label layer
const labelLayer = new gridviz.LabelLayer(
    gridviz_eurostat.getEuronymeLabelLayer("EUR", 20, {
        ccIn: ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "PL", "PT", "MT", "NL", "RO", "SE", "SK", "SI", "CH", "NO", "LI",],
        baseURL: euronymURL,
        //exSize: 1.7,
    })
);



//make grid layer
const gridLayer = new gridviz.GridLayer(undefined, []);


//set map layers
map.layers = [backgroundLayer1, backgroundLayer2, gridLayer, boundariesLayer, labelLayer];


//function to compute the percentage of a cell value
const computePercentage = (c, col, totalFunction) => {
    const total = totalFunction(c);
    if (total == 0 || c[col] == undefined) {
        c["s" + col] = undefined;
        return;
    }
    c["s" + col] = (c[col] / total) * 100;
    c["s" + col] = c["s" + col] > 100 ? 100 : c["s" + col] < 0 ? 0 : c["s" + col];
};

//'x', 'y', 'T', 'M', 'F', 'Y_LT15', 'Y_1564', 'Y_GE65', 'EMP', 'NAT', 'EU_OTH', 'OTH', 'SAME', 'CHG_IN', 'CHG_OUT', 'CONFIDENTIALSTATUS'

const preprocessSex = (c) => {
    if (c.CONFIDENTIALSTATUS && c.F == 0 && c.M == 0) {
        c.F = undefined;
        c.M = undefined;
    }

    if (c.F == undefined || c.M == undefined) {
        c.indMF = undefined;
        return;
    }

    //if (c.F + c.M != c.T) console.error("Error found in sex total", c.F + c.M, c.T)

    //male/female index
    c.indMF = (100 * (c.M - c.F)) / (c.M + c.F);

    //compute percentages
    computePercentage(c, "F", (c) => c.M + c.F);
    computePercentage(c, "M", (c) => c.M + c.F);

    //tag as precomputed
    c.p_sex = true;
};

const preprocessAge = (c) => {
    if (c.CONFIDENTIALSTATUS && c.Y_LT15 == 0 && c.Y_1564 == 0 && c.Y_GE65 == 0) {
        c.Y_LT15 = undefined;
        c.Y_1564 = undefined;
        c.Y_GE65 = undefined;
    }

    //compute percentages
    computePercentage(c, "Y_LT15", (c) => c.Y_LT15 + c.Y_1564 + c.Y_GE65);
    computePercentage(c, "Y_1564", (c) => c.Y_LT15 + c.Y_1564 + c.Y_GE65);
    computePercentage(c, "Y_GE65", (c) => c.Y_LT15 + c.Y_1564 + c.Y_GE65);
    //tag as precomputed
    c.p_age = true;
};

const preprocessEmp = (c) => {
    if (c.CONFIDENTIALSTATUS && c.EMP == 0) {
        c.EMP = undefined;
    }

    //compute percentages
    computePercentage(c, "EMP", (c) => c.T); //TODO sure?
    //tag as precomputed
    c.p_emp = true;
};

const preprocessPob = (c) => {
    if (c.CONFIDENTIALSTATUS && c.NAT == 0 && c.EU_OTH == 0 && c.OTH == 0) {
        c.NAT = undefined;
        c.EU_OTH = undefined;
        c.OTH = undefined;
    }

    //compute percentages
    computePercentage(c, "NAT", (c) => c.NAT + c.EU_OTH + c.OTH);
    computePercentage(c, "EU_OTH", (c) => c.NAT + c.EU_OTH + c.OTH);
    computePercentage(c, "OTH", (c) => c.NAT + c.EU_OTH + c.OTH);
    //tag as precomputed
    c.p_pob = true;
};

const preprocessMob = (c) => {
    if (c.CONFIDENTIALSTATUS && c.SAME == 0 && c.CHG_IN == 0 && c.CHG_OUT == 0) {
        c.SAME = undefined;
        c.CHG_IN = undefined;
        c.CHG_OUT = undefined;
    }

    //compute percentages
    computePercentage(c, "SAME", (c) => c.SAME + c.CHG_IN + c.CHG_OUT);
    computePercentage(c, "CHG_IN", (c) => c.SAME + c.CHG_IN + c.CHG_OUT);
    computePercentage(c, "CHG_OUT", (c) => c.SAME + c.CHG_IN + c.CHG_OUT);
    //tag as precomputed
    c.p_mob = true;
};

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


//default blend operation
const blendOp = (z) => (z < 50 ? "multiply" : "source-over")

// default stroke style
const strokeStyle = new gridviz.StrokeStyle({ strokeColor:()=> "#ccc", visible: (z) => z < 50, blendOperation: blendOp });



// total population style
let interpolate = gridviz.getParameterByName("interpolate")

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
            breaks.push(min + (max - min) * t)
        }
        return gridviz.classifier(breaks)
    },
    code: (c, r, z, classifier) => classifier(c.T),
    color: { ...colors },
    blendOperation: blendOp,
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
    //read GUI selection
    const layCode = document.querySelector('input[name="layer"]:checked').value;

    //enable/disable GUI components
    if (layCode != "share") {
        document.getElementById("share_select").disabled = true;
        document.getElementById("sbtp").disabled = true;
    }
    if (layCode != "ternary") {
        document.getElementById("ternary_select").disabled = true;
        document.getElementById("sbtp_tri").disabled = true;
    }

    // set gridlayer dataset
    gridLayer.dataset = layCode === "pop" ? datasetTotal : dataset

    //set gridlayer style
    if (layCode === "pop") {
        //total population

        // update legend width
        totPopLegend.width = Math.min(window.innerWidth - 40, 400)

        // link legend, style and layer
        //gridLayer.styles = [interpTotPopStyle, strokeStyle,];
        gridLayer.styles = [totPopStyle];
        if(!interpolate) gridLayer.styles.push(strokeStyle)

        //set layer parameters
        gridLayer.minPixelsPerCell = interpolate ? 1.7 : 0.7;
        gridLayer.cellInfoHTML = (c) => "<b>" + formatLarge(c.T) + "</b> person" + (c.T == 1 ? "" : "s");

    } else if (layCode === "share") {
        //unfreeze GUI
        document.getElementById("share_select").disabled = false;
        document.getElementById("sbtp").disabled = false;

        //get gui info
        const shareA = document.querySelector("#share_select").value;
        const shareB = "s" + shareA;
        const sbtp = document.getElementById("sbtp").checked;

        //define style

        //define style breaks
        let breaks = undefined;
        switch (shareA) {
            case "F": breaks = [40, 45, 49, 50, 51, 55, 60]; break;
            case "M": breaks = [40, 45, 49, 50, 51, 55, 60]; break;
            case "Y_LT15": breaks = [5, 10, 15, 20, 30]; break;
            case "Y_1564": breaks = [50, 60, 65, 70, 80]; break;
            case "Y_GE65": breaks = [10, 20, 30, 40, 50]; break;
            case "EMP": breaks = [30, 40, 45, 50, 55, 60, 70]; break;
            case "SAME": breaks = [70, 80, 90, 95, 99]; break;
            case "CHG_IN": breaks = [0.5, 1, 5, 10, 20]; break;
            case "CHG_OUT": breaks = [0.5, 1, 2, 5, 10]; break;
            case "NAT": breaks = [60, 70, 80, 85, 90, 95, 99]; break;
            case "EU_OTH": breaks = [1, 5, 10, 15, 20, 30]; break;
            case "OTH": breaks = [1, 5, 10, 20, 30, 50]; break;
            default: breaks = [30, 40, 45, 50, 55, 60, 70];
        }

        const classNumberColor = breaks.length + 1; //6
        const palette = shareA == "M" || shareA == "F" ? d3.schemeSpectral : d3.schemeYlOrRd;
        const colors = palette[classNumberColor];
        const classNumberSize = 4;

        if (sbtp) {
            const colorClassifier = gridviz.colorClassifier(breaks, colors);
            gridLayer.styles = [
                new gridviz.ShapeColorSizeStyle({
                    color: (c) => {
                        if (!c.p_sex && ["F", "M"].includes(shareA)) preprocessSex(c);
                        else if (!c.p_age && ["Y_LT15", "Y_1564", "Y_GE65"].includes(shareA)) preprocessAge(c);
                        else if (!c.p_emp && ["EMP"].includes(shareA)) preprocessEmp(c);
                        else if (!c.p_mob && ["SAME", "CHG_IN", "CHG_OUT"].includes(shareA)) preprocessMob(c);
                        else if (!c.p_pob && ["NAT", "EU_OTH", "OTH"].includes(shareA)) preprocessPob(c);
                        return c[shareB] == undefined ? naColor : colorClassifier(c[shareB]);
                    },
                    viewScale: gridviz.viewScaleQuantile({
                        valueFunction: (c) => +c.T,
                        classNumber: classNumberSize,
                        minSizePix: 2.5,
                        maxSizeFactor: 1.2,
                    }),
                    size: (c, r, z, viewScale) => viewScale(c.T),
                    shape: () => "circle",
                    blendOperation: blendOp,
                })
            ];
            gridLayer.minPixelsPerCell = 3;
        } else {
            const classifier = gridviz.classifier(breaks)
            const colDict = { ...colors }; colDict["na"] = naColor
            gridLayer.styles = [
                new gridviz.SquareColorCategoryWebGLStyle({
                    code: (c) => {
                        if (!c.p_sex && ["F", "M"].includes(shareA)) preprocessSex(c);
                        else if (!c.p_age && ["Y_LT15", "Y_1564", "Y_GE65"].includes(shareA)) preprocessAge(c);
                        else if (!c.p_emp && ["EMP"].includes(shareA)) preprocessEmp(c);
                        else if (!c.p_mob && ["SAME", "CHG_IN", "CHG_OUT"].includes(shareA)) preprocessMob(c);
                        else if (!c.p_pob && ["NAT", "EU_OTH", "OTH"].includes(shareA)) preprocessPob(c);
                        return c[shareB] == undefined ? "na" : classifier(c[shareB])
                    },
                    color: colDict,
                    blendOperation: blendOp,
                }),
                strokeStyle
            ];
            gridLayer.minPixelsPerCell = 0.7;
        }

        const style = gridLayer.styles[0];

        //share color legend
        style.addLegends([
            new gridviz.ColorDiscreteLegend({
                title: "Share, in percentage",
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

        //tooltip text
        gridLayer.cellInfoHTML = (c) => {
            const pop_ = "<br>" + formatLarge(c.T) + " person" + (c.T == 1 ? "" : "s");
            if (c[shareA] == undefined || c[shareB] == undefined)
                return "Data not available" + (c.CONFIDENTIALSTATUS ? " (confidential)" : "") + pop_;
            return "<b>" + formatPercentage(c[shareB]) + " %</b><br>" + formatLarge(c[shareA]) + pop_;
        };

    } else if (layCode === "ternary") {

        //unfreeze GUI
        document.getElementById("ternary_select").disabled = false;
        document.getElementById("sbtp_tri").disabled = false;

        //get gui info
        const theme = document.querySelector("#ternary_select").value;
        //age, mobility, pob
        const sbtp = document.getElementById("sbtp_tri").checked;

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
        else if (theme == "mobility")
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
                        if (theme == "age" && !c.p_age) preprocessAge(c);
                        else if (theme == "mobility" && !c.p_mob) preprocessMob(c);
                        else if (theme == "pob" && !c.p_pob) preprocessPob(c);
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
                    blendOperation: blendOp,
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
            else if (theme == "mobility")
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
                "m01": "rgb(79, 150, 133)", "m20": "rgb(174, 127, 48)", "m12": "rgb(171, 96, 106)",
                "na": naColor
            };

            //pixel style
            gridLayer.styles = [
                new gridviz.SquareColorCategoryWebGLStyle({
                    code: (c) => {
                        if (theme == "age" && !c.p_age) preprocessAge(c);
                        else if (theme == "mobility" && !c.p_mob) preprocessMob(c);
                        else if (theme == "pob" && !c.p_pob) preprocessPob(c);
                        const cl = ternaryFun(c)
                        //console.log(cl)
                        return cl == undefined ? "na" : cl;
                    },
                    color: colDict,
                    blendOperation: blendOp,
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
        else if (theme == "mobility")
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
        else if (theme == "mobility")
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

    } else if (layCode === "sex") {
        //sex - color classifier
        const breaks = [-20, -7, -2, -0.5, 0.5, 2, 7, 20];
        const sexColorClassifier = gridviz.colorClassifier(breaks, d3.schemeSpectral[breaks.length + 1]);

        const classNumberSize = 4;
        const style = new gridviz.ShapeColorSizeStyle({
            color: (c, r, z, viewScale) => (c.indMF == undefined ? naColor : sexColorClassifier(c.indMF)),
            size: (c, r, z, viewScale) => viewScale(c.T),
            viewScale: gridviz.viewScaleQuantile({
                valueFunction: (c) => {
                    if (!c.p_sex) preprocessSex(c);
                    return +c.T;
                },
                classNumber: classNumberSize,
                minSizePix: 2.5,
                maxSizeFactor: 1.2,
            }),
            shape: () => "circle",
            blendOperation: blendOp,
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

    } else if (layCode === "age") {
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
                blendOperation: blendOp,
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
    } else if (layCode === "mobility") {
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
                blendOperation: blendOp,
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
    } else if (layCode === "pob") {
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
                blendOperation: blendOp,
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


    } else if (layCode === "chernoff") {
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
            blendOperation: blendOp,
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
    } else console.error("Unexpected layer code: " + layCode);

    //redraw
    map.redraw();
};

//home button
document.getElementById("home-button").addEventListener("click", (event) => {
    event.stopPropagation();
    map.setView(DEFAULTMAPSETTINGS.x, DEFAULTMAPSETTINGS.y);
    map.setZoom(DEFAULTMAPSETTINGS.z);
    map.redraw();
});

//layer update
document.querySelector("#layer-control").addEventListener("change", update);

// show/hide labels
document.querySelector("#label").addEventListener("change", function () {
    labelLayer.visible = () => this.checked;
    map.redraw();
});

// show/hide boundaries
document.querySelector("#boundary").addEventListener("change", function () {
    boundariesLayer.visible = () => this.checked;
    map.redraw();
});

// show/hide background layer
document.querySelector("#background").addEventListener("change", function () {
    if (this.checked) {
        backgroundLayer1.visible = (z) => z > 50;
        backgroundLayer2.visible = (z) => z <= 50;
    } else {
        backgroundLayer1.visible = () => false;
        backgroundLayer2.visible = () => false;
    }
    map.redraw();
});

//set selected layer from URL param
const layerParam = gridviz.getParameterByName("lay");
if (layerParam) {
    // Total population : pop
    // Share: share
    // Ternary: ternary
    // Sex: sex
    // Employment: emp
    // Age: age
    // Mobility: mobility
    // Birth place: pob
    const input = document.querySelector("#" + layerParam);
    if (input) {
        input.checked = true;
        if (layerParam == "share") {
            const dropdownSelection = gridviz.getParameterByName("share_selection");
            document.getElementById("share_select").value = dropdownSelection;
        } else if (layerParam == "ternary") {
            const dropdownSelection = gridviz.getParameterByName("ternary_selection");
            document.getElementById("ternary_select").value = dropdownSelection;
        }
    }
}

//toggle options panel collapse from URL param
const collapsed = gridviz.getParameterByName("collapsed");
if (collapsed) {
    const collapseButton = document.getElementById("expand-toggle-button");
    collapseButton.click();
}

//initialise
update();

