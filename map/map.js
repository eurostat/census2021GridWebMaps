//TODO
// check new dataset version ?
//revamp tooltips, legends
// check NaN, confidential
//fix tooltip location bug
//update x,y,z on view change
//add chernoff faces

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
updateLayersVisibility()



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
    //console.log(mapCode, sbtp)

    //show/hide GUI components
    document.getElementById("sbtp_div").style.display = ["pop", "pob_pc"].includes(mapCode) ? 'none' : 'inline-block'

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
        style.addLegends([
            colDiscreteLegend(mapCode, colors, breaks, (v, i) => v + (i == 1 || i == breaks.length ? "%" : "")),
            naLegend]);
        if (sbtp) style.addLegends(popSizeLegend(classNumberSize));

        //tooltip text
        gridLayer.cellInfoHTML = shareTooltip(shareCode, mapCode)

    } else if (["ter_age", "ter_mob", "ter_pob"].includes(mapCode)) {

        const mapCode2 = mapCode.replace("ter_", "")
        const classNumberSize = 4;

        if (sbtp) {

            // prop circles
            gridLayer.styles = [
                new gridviz.ShapeColorSizeStyle({
                    color: (c) => {
                        if (!c["p_" + mapCode2]) compute[mapCode2](c);
                        return colorTernaryClassifiers[mapCode](c) || naColor;
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

            //pixel style
            gridLayer.styles = [
                new gridviz.SquareColorCategoryWebGLStyle({
                    code: (c) => {
                        if (!c["p_" + mapCode2]) compute[mapCode2](c);
                        return ternaryFun(c)
                    },
                    color: ternaryColorsDict,
                }),
                strokeStyle
            ];
            gridLayer.minPixelsPerCell = 0.7;
        }

        const style = gridLayer.styles[0];

        //legends
        style.legends = [ternaryLegends[mapCode], naLegend];

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
        style.addLegends([colDiscreteLegend(mapCode, colors, breaks), naLegend]);
        if (sbtp) style.addLegends(popSizeLegend(classNumberSize))

        //tooltip
        gridLayer.cellInfoHTML = getTooltipDemography(mapCode);

    } else if (mapCode === "age_pyramid") {

        const agePyramidColors = { Y_LT15: d3.interpolateSpectral(0.2), Y_1564: d3.interpolateSpectral(0.4), Y_GE65: d3.interpolateSpectral(0.9) }
        const w = { Y_LT15: 15, Y_1564: 50, Y_GE65: 25 }
        const cats = Object.keys(w) //["Y_LT15","Y_1564","Y_GE65"]

        const classNumberSize = 4;
        const sizeVS = gridviz.viewScaleQuantile({
            valueFunction: (c) => +c.T,
            classNumber: classNumberSize,
            minSizePix: 8,
            maxSizeFactor: 0.9
        })
        //viewScale: gridviz.sizeScale({ valueFunction: (c) => +c.T, exponent: 0.1 }),

        gridLayer.styles = [
            new gridviz.Style({
                drawFun: (cells, geoCanvas, resolution) => {

                    //
                    const z = geoCanvas.view.z
                    const ctx = geoCanvas.offscreenCtx
                    const marginG = 2 * z //2 pixels margin

                    //get max length
                    //const maxCatPop = d3.max(cells, c => d3.max(cats, p => c[p] / w[p]))

                    const vs = sbtp ? sizeVS(cells, resolution, z) : undefined

                    //draw calls
                    for (let cell of cells) {

                        // symbol size, depending on total population
                        const sizeG = (sbtp ? vs(cell.T) : resolution) - 2 * marginG

                        // max width
                        const maxCatPop = d3.max(cats, p => cell[p] / w[p])

                        let cumulHg = marginG + (resolution - sizeG) / 2
                        for (cat of cats) {

                            //set category color
                            ctx.fillStyle = agePyramidColors[cat]

                            //get category value
                            const catPop = cell[cat] / w[cat]

                            //compute category length - in geo
                            /** @type {number} */
                            const wG = sizeG * catPop / maxCatPop
                            const hG = w[cat] * sizeG / 90

                            //draw bar
                            ctx.fillRect(cell.x + (resolution - wG) / 2, cell.y + cumulHg, wG, hG)

                            cumulHg += hG
                        }
                    }
                    //update legend
                    gridLayer.styles[0].updateLegends({ style: gridLayer.styles[0], resolution: resolution, z: z, viewScale: vs })
                }
            })
        ]

        gridLayer.minPixelsPerCell = 12
        gridLayer.styles[0].legends = [agePyramidLegend(agePyramidColors)]
        if (sbtp) gridLayer.styles[0].legends.push(popSizeLegend(classNumberSize, "square"))
        gridLayer.cellInfoHTML = agePyramidTooltip

    } else if (mapCode === "sex_balance") {
        //sex - color classifier
        const breaks = [-20, -7, -2, -0.5, 0.5, 2, 7, 20];
        const sexColorClassifier = gridviz.colorClassifier(breaks, d3.schemeSpectral[breaks.length + 1]);

        const classNumberSize = 4;
        gridLayer.styles = [new gridviz.ShapeColorSizeStyle({
            color: (c) => {
                if (c.p_sex == undefined) compute.sex(c)
                return (c.indMF == undefined ? naColor : sexColorClassifier(c.indMF))
            },
            size: sbtp ? (c, r, z, viewScale) => viewScale(c.T) : undefined,
            viewScale: sbtp ? gridviz.viewScaleQuantile({
                valueFunction: (c) => {
                    if (!c.p_sex) compute.sex(c);
                    return +c.T;
                },
                classNumber: classNumberSize,
                minSizePix: 2.5,
                maxSizeFactor: 1.2,
            }) : undefined,
            shape: sbtp ? () => "circle" : undefined,
        })];

        gridLayer.minPixelsPerCell = 3;

        //legends
        gridLayer.styles[0].legends = [
            colDiscreteLegend(mapCode, sexColorClassifier.colors, sexColorClassifier.breaks, undefined, 300),
            naLegend,
        ]
        if (sbtp) gridLayer.styles[0].legends.push(popSizeLegend(classNumberSize))

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
                size: sbtp ? (c, r, z, scale) => scale(c.T) : undefined,
                viewScale: sbtp ? gridviz.viewScaleQuantile({
                    valueFunction: (c) => +c.T,
                    classNumber: classNumberSize,
                    minSizePix: 6,
                    maxSizeFactor: 1.2,
                }) : undefined,
            }),
        ];

        gridLayer.minPixelsPerCell = 12;
        gridLayer.styles[0].legends = [mobLegend];
        if (sbtp) gridLayer.styles[0].addLegends(popSizeLegend(classNumberSize))
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
                size: sbtp? (c, r, z, scale) => scale(c.T) : undefined,
                viewScale: sbtp? gridviz.viewScaleQuantile({
                    valueFunction: (c) => +c.T,
                    classNumber: classNumberSize,
                    minSizePix: 8,
                }) : undefined,
            }),
        ];

        gridLayer.minPixelsPerCell = 12;
        gridLayer.styles[0].legends = [pobLegend,];
        //if (sbtp) gridLayer.styles[0].legends.push(popSizeLegend(classNumberSize))
        gridLayer.cellInfoHTML = pobPCTooltip

    } else if (mapCode === "chernoff") {
        console.log(mapCode)

        /*
        //age color - 3/4 classes
        const ageClassifier = gridviz.ternaryClassifier(["sY_LT15", "sY_1564", "sY_GE65"], (c) => 100, {
            center: [0.15, 0.64, 0.21],
            withMixedClasses: false,
        });

        //sex code
        const sexClassifier = (c) => {
            console.log(c.indMF)
            return c.indMF <= 0 ? "f" : "m"
        };

        //employment class
        const breaks = [45, 55];
        const empClassifier = gridviz.classifier(breaks);

        const classNumberSize = 3;
        const style = new gridviz.ImageStyle({
            image: (c) => {
                console.log("aaa")
                const a = +ageClassifier(c)
                const ageCode = a == 0 ? 'y' : a == 1 ? 'm' : 'o'
                const sexCode = sexClassifier(c)
                const empCode = empClassifier(c.sEMP)
                return 'https://jgaffuri.github.io/chernoff-faces/out/v1/' + sexCode + ageCode + empCode + '.png'
            },
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
*/

    } else console.error("Unexpected map code: " + mapCode);

    //redraw
    map.redraw();
    updateURL(map);
};

//initialise
update();

