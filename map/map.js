//TODO
// factor legends
//true age pyramid
//revamp tooltips
//revamp breaks
//fix tooltip location bug
//update x,y,z on view change

//add chernoff faces - as GUI element, hidden
//sea level rise ?
//generalise interpolation


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



//define map with initial view
const DEFAULTMAPSETTINGS = { x: 4096489, y: 2829097, z: 2000, backgroundColor: "white" };
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
if (sel) document.getElementById("map_select").value = sel

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


//
updateBackgroundVisibility()



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


//make grid layer
const gridLayer = new gridviz.GridLayer(undefined, []);
gridLayer.blendOperation = () => "multiply"


//set map layers
map.layers = [backgroundLayerElevation, backgroundLayerRoad, backgroundLayerRoad2, gridLayer, boundariesLayer, labelLayer];


// total population style

//get colors
const colors = []
const classNumber = 8;
for (let i = 0; i <= (classNumber - 1); i++) colors.push(d3.interpolateYlOrRd(i / (classNumber - 1)))
const scaleTPop = gridviz.exponentialScale(7) //exponentialScale logarithmicScale

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

//link legend
totPopStyle.legends = [totPopLegend];




const update = () => {

    // get selected map code
    const mapCode = document.getElementById("map_select").value;
    const sbtp = document.getElementById("sbtp").checked;

    //show/hide GUI components
    document.getElementById("sbtp_div").style.display = ["pop", "age_pyramid", "sex_balance", "mobility_pc", "pob_pc"].includes(mapCode) ? 'none' : 'inline-block'

    // set gridlayer dataset
    gridLayer.dataset = mapCode === "pop" ? datasetTotal : dataset

    //set gridlayer style
    if (mapCode === "pop") {
        //total population

        // update legend width
        totPopLegend.width = Math.min(window.innerWidth - 40, 400)

        // link legend, style and layer
        gridLayer.styles = [totPopStyle];
        if (interpolate) gridLayer.styles = interpolateStyles(gridLayer.styles, 'T');
        else gridLayer.styles.push(strokeStyle)

        //set layer parameters
        gridLayer.minPixelsPerCell = interpolate ? 1.7 : 0.7;
        gridLayer.cellInfoHTML = totPopTooltip;

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
                })
            ];
            //if (interpolate) gridLayer.styles = interpolateStyles(gridLayer.styles, shareCode);
            /*else*/ gridLayer.styles.push(strokeStyle)
            gridLayer.minPixelsPerCell = interpolate ? 1.7 : 0.7
        }

        const style = gridLayer.styles[0];

        //add legends
        style.addLegends([shareLegend(mapCode, colors, breaks), naLegend]);
        if (sbtp) style.addLegends(popSizeLegend(classNumberSize));

        //tooltip text
        gridLayer.cellInfoHTML = shareTooltip(shareCode, mapCode)

    } else if (["ter_age", "ter_mob", "ter_pob"].includes(mapCode)) {

        const mapCode2 = mapCode.replace("ter_", "")
        const classNumberSize = 4;

        // get color ternary classifier
        const colorTernaryFun = gridviz.ternaryColorClassifier(
            ternaryData[mapCode].codes,
            () => 100,
            ["#4daf4a", "#377eb8", "#e41a1c"],
            {
                center: ternaryData[mapCode].center,
                centerColor: "#999",
                centerCoefficient: 0.25,
                defaultColor: naColor,
            })

        if (sbtp) {

            // prop circles
            gridLayer.styles = [
                new gridviz.ShapeColorSizeStyle({
                    color: (c) => {
                        if (!c["p_" + mapCode2]) compute[mapCode2](c);
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
            const ternaryFun = gridviz.ternaryClassifier(
                ternaryData[mapCode].codes,
                () => 100,
                { center: ternaryData[mapCode].center, centerCoefficient: 0.25 }
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
                        if (!c["p_" + mapCode2]) compute[mapCode2](c);
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
        if (mapCode == "ter_age")
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
        else if (mapCode == "ter_mob")
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
        else if (mapCode == "ter_pob")
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
        if (sbtp) style.addLegends(popSizeLegend(classNumberSize))

        //tooltip text
        gridLayer.cellInfoHTML = ternaryTooltip[mapCode]

    } else if (["ageing", "dep_ratio", "oa_dep_ratio", "y_dep_ratio", "median_age"].includes(mapCode)) {

        //define style
        const breaks = breaksDict[mapCode]
        const classNumberColor = breaks.length + 1;
        const palette = d3.schemeSpectral //: d3.schemeYlOrRd;
        const colors = palette[classNumberColor].slice().reverse()
        const classNumberSize = 4;

        if (sbtp) {
            const colorClassifier = gridviz.colorClassifier(breaks, colors);

            gridLayer.styles = [
                new gridviz.ShapeColorSizeStyle({
                    color: (c) => {
                        if (c[mapCode] == undefined) compute[mapCode](c)
                        return c[mapCode] < 0 ? naColor : colorClassifier(c[mapCode]);
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
                        if (c[mapCode] == undefined) compute[mapCode](c)
                        return c[mapCode] < 0 ? "na" : classifier(c[mapCode]);
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
                title: legendTitles[mapCode],
                width: 250,
                colors: () => colors,
                breaks: () => breaks,
            }),
        ]);

        //na legend
        style.legends.push(naLegend);

        //population size legend
        if (sbtp) style.addLegends(popSizeLegend(classNumberSize))

        //tooltip
        gridLayer.cellInfoHTML = getTooltipDemography(mapCode);

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
        gridLayer.styles[0].addLegends(popSizeLegend(classNumberSize, "square"))

        gridLayer.cellInfoHTML = agePyramidTooltip;

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
        style.addLegends(popSizeLegend(classNumberSize));

        gridLayer.cellInfoHTML = sexBalanceTooltip

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
        gridLayer.styles[0].addLegends(popSizeLegend(classNumberSize))

        gridLayer.cellInfoHTML = mobilityPCTooltip

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
        gridLayer.styles[0].addLegends(popSizeLegend(classNumberSize))

        gridLayer.cellInfoHTML = pobPCTooltip

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

        gridLayer.cellInfoHTML = chernoffTooltip(ageClassifier, sexClassifier, empClassifier)

    } else console.error("Unexpected map code: " + mapCode);

    //redraw
    map.redraw();
    updateURL(map);
};

//initialise
update();

