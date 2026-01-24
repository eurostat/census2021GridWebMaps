//TODO

// add expalanation message ?

// age pyramid size: size by bar length only ?
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


T - Total population
M - Male Population
F - Female Population 
Y_LT15 - Age Under 15 years
Y_1564 - Age 15 to 64 years
Y_GE65 - Age 65 years and over
EMP - Employed persons
NAT -  Place of birth in reporting country
EU_OTH Place of birth in other EU Member State
OTH - Place of birth elsewhere
SAME - Place of usual residence one year prior to the census unchanged
CHG_IN - Place of usual residence one year prior to the census: move within reporting country
CHG_OUT - Place of usual residence one year prior to the census: move from outside of the reporting country

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

for (let cb of ["sbtp", "label", "grid", "boundary", "background"]) {
    const sel = urlParams.get(cb);
    if (sel == undefined) continue;
    document.getElementById(cb).checked = sel != "" && sel != "false" && +sel != 0
}

const hb = urlParams.get("hb");
if (!hb) map.addZoomButtons(); else {
    document.getElementById("expand-toggle-button").style.display = "none"
    document.getElementById("home-button").style.display = "none"
    document.getElementsByClassName("footer-links").style.display = "none"
}


// interpolate
let interpolate = urlParams.get("interpolate")
interpolate = interpolate != "" && interpolate != "false" && +interpolate != 0


//
updateLayersVisibility()



//define multi resolution datasets
const dataset = {}
for (let theme of ["total", "age", "sex", "emp", "mob", "pob", "all"]) {
    dataset[theme] = new gridviz.MultiResolutionDataset(
        [1000, 2000, 5000, 10000, 20000, 50000, 100000],
        (resolution) => new gviz_par.TiledParquetGrid(map, tilesURL + "tiles_" + theme + "/" + resolution + "/"), {
        preprocess: c => {
            if (!c.T) return false
            preprocess[theme](c)
        }
    })
}

//make grid layer
const gridLayer = new gridviz.GridLayer(undefined, [], {
    visible: document.getElementById("grid").checked ? undefined : () => false,
    blendOperation: () => "multiply",
})

//set map layers
map.layers = [backgroundLayerElevation, backgroundLayerRoad, backgroundLayerRoad2, gridLayer, boundariesLayer, labelLayer];


// total population style

//get colors
const colors = []
const classNumber = 8;
for (let i = 0; i <= (classNumber - 1); i++) colors.push(d3.interpolateYlOrRd(0.85 * i / (classNumber - 1)))
const scaleTPop = gridviz.exponentialScale(7) //exponentialScale logarithmicScale
const popCols = { ...colors }; popCols.na = naColor

//style
let totPopStyle = new gridviz.SquareColorCategoryWebGLStyle({
    viewScale: cells => {
        const max = d3.max(cells, c => c.T)
        const breaks = []
        for (let i = 1; i < classNumber; i++) {
            let t = i / classNumber
            t = scaleTPop(t)
            breaks.push(max * t)
        }
        return gridviz.classifier(breaks)
    },
    code: (c, r, z, classifier) => {
        const v = c.T
        if (v == -1 || v == undefined) return "na"
        return classifier(v)
    },
    color: popCols,
})

//link legend
totPopStyle.legends = [totPopLegend];


const update = () => {

    // get selected map code
    const mapCode = document.getElementById("map_select").value;
    const sbtp = document.getElementById("sbtp").checked;

    //show/hide GUI components
    document.getElementById("sbtp_div").style.display = ["pop", /*"pob_pc"*/].includes(mapCode) ? 'none' : 'inline-block'

    //change gridlayer blend mode
    gridLayer.blendOperation = sbtp ? (z) => z < 75 ? "multiply" : "source-over" : () => "multiply"

    //set gridlayer style
    if (mapCode === "pop") {
        //total population
        gridLayer.dataset = dataset.total //all

        // update legend width
        totPopLegend.width = Math.min(window.innerWidth - 40, 400)

        // link legend, style and layer
        gridLayer.styles = [totPopStyle];
        if (interpolate) gridLayer.styles = interpolateStyles(gridLayer.styles, 'T');
        else gridLayer.styles.push(strokeStyle)

        //set layer parameters
        gridLayer.minPixelsPerCell = interpolate ? 1.7 : 0.7;
        //gridLayer.cellInfoHTML = gridviz.GridLayer.defaultCellInfoHTML;
        gridLayer.cellInfoHTML = totPopTooltip;

    } else if (["Y_LT15", "Y_1564", "Y_GE65", "F", "M", "EMP", "SAME", "CHG_IN", "CHG_OUT", "NAT", "EU_OTH", "OTH"].includes(mapCode)) {

        // get theme
        const theme = ["F", "M"].includes(mapCode) ? "sex"
            : ["Y_LT15", "Y_1564", "Y_GE65"].includes(mapCode) ? "age"
                : ["EMP"].includes(mapCode) ? "emp"
                    : ["SAME", "CHG_IN", "CHG_OUT"].includes(mapCode) ? "mob"
                        : ["NAT", "EU_OTH", "OTH"].includes(mapCode) ? "pob"
                            : undefined

        gridLayer.dataset = dataset[theme]

        //get gui info
        const shareCode = "s" + mapCode;

        //define style breaks
        let breaks = breaksDict[mapCode];
        let colors = undefined
        const classNumberColor = breaks.length + 1;
        if (theme == "sex")
            // use spectral diverging
            colors = d3.schemeSpectral[classNumberColor];
        else {
            // use ylorrd but remove too dark reds
            colors = []
            for (let i = 0; i <= (classNumberColor - 1); i++)
                colors.push(d3.interpolateYlOrRd(0.8 * i / (classNumberColor - 1)))
        }
        const classNumberSize = 4;

        if (sbtp) {
            const colorClassifier = gridviz.colorClassifier(breaks, colors);
            gridLayer.styles = [
                new gridviz.ShapeColorSizeStyle({
                    color: (c) => {
                        const v = c[shareCode]
                        return v == undefined || v == -1 ? naColor : colorClassifier(v);
                    },
                    viewScale: gridviz.viewScaleQuantile({
                        valueFunction: (c) => +c.T,
                        classNumber: classNumberSize,
                        minSizePix: 2.5,
                        maxSizeFactor: 1.2,
                    }),
                    size: (c, r, z, viewScale) => viewScale(c.T),
                    shape: () => "circle",
                    filter: c => c[shareCode] != 0
                })
            ];
            gridLayer.minPixelsPerCell = 4;
        } else {
            const classifier = gridviz.classifier(breaks)
            const colDict = { ...colors }; colDict["na"] = naColor
            gridLayer.styles = [
                new gridviz.SquareColorCategoryWebGLStyle({
                    code: (c) => {
                        const v = c[shareCode]
                        return v == undefined || v == -1 ? "na" : classifier(v)
                    },
                    color: colDict,
                    filter: c => c[shareCode] != 0
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
        const codes = ternaryData[mapCode].codes.map(c => c.replace("s", ""))
        gridLayer.dataset = dataset[mapCode2]

        const classNumberSize = 4;

        if (sbtp) {

            // prop circles
            gridLayer.styles = [
                new gridviz.ShapeColorSizeStyle({
                    color: (c) => {
                        for (p of codes) if (c[p] == -1 || c[p] == undefined) return naColor
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
            gridLayer.minPixelsPerCell = 4;

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
                        for (p of codes) if (c[p] == -1 || c[p] == undefined) return "unknown"
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
        gridLayer.dataset = dataset.age

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
                        if (c[mapCode] == undefined) preprocess[mapCode](c)
                        const v = c[mapCode]
                        return v == -1 || v == undefined ? naColor : colorClassifier(v);
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
            gridLayer.minPixelsPerCell = 4;
        } else {
            const classifier = gridviz.classifier(breaks)
            const colDict = { ...colors }; colDict["na"] = naColor

            gridLayer.styles = [
                new gridviz.SquareColorCategoryWebGLStyle({
                    code: (c) => {
                        if (c[mapCode] == undefined) preprocess[mapCode](c)
                        const v = c[mapCode]
                        return v == -1 || v == undefined ? "na" : classifier(v);
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
        gridLayer.dataset = dataset.age

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

                            // height of the bar
                            const hG = w[cat] * sizeG / 90

                            //get value
                            let v = cell[cat]
                            if (!v || v == -1) { cumulHg += hG; continue }

                            //set category color
                            ctx.fillStyle = agePyramidColors[cat]

                            //get category value
                            const catPop = v / w[cat]

                            //compute category length - in geo
                            /** @type {number} */
                            const wG = sizeG * catPop / maxCatPop

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

        gridLayer.minPixelsPerCell = 14
        gridLayer.styles[0].legends = [agePyramidLegend(agePyramidColors)]
        if (sbtp) gridLayer.styles[0].legends.push(popSizeLegend(classNumberSize, "square"))
        gridLayer.cellInfoHTML = agePyramidTooltip

    } else if (mapCode === "sex_balance") {
        gridLayer.dataset = dataset.sex

        //sex - color classifier
        const breaks = [-20, -7, -2, -0.5, 0.5, 2, 7, 20];
        const sexColorClassifier = gridviz.colorClassifier(breaks, d3.schemeSpectral[breaks.length + 1]);

        const classNumberSize = 4;
        gridLayer.styles = [new gridviz.ShapeColorSizeStyle({
            color: (c) => {
                //if (c.p_sex == undefined) compute.sex(c)
                return (c.indMF == undefined || c.indMF == -1 ? naColor : sexColorClassifier(c.indMF))
            },
            size: sbtp ? (c, r, z, viewScale) => viewScale(c.T) : undefined,
            viewScale: sbtp ? gridviz.viewScaleQuantile({
                valueFunction: (c) => +c.T,
                classNumber: classNumberSize,
                minSizePix: 2.5,
                maxSizeFactor: 1.2,
            }) : undefined,
            shape: sbtp ? () => "circle" : undefined,
        })];

        gridLayer.minPixelsPerCell = sbtp ? 4 : 1.7;

        //legends
        gridLayer.styles[0].legends = [
            colDiscreteLegend(mapCode, sexColorClassifier.colors, sexColorClassifier.breaks, undefined, 300),
            naLegend,
        ]
        if (sbtp) gridLayer.styles[0].legends.push(popSizeLegend(classNumberSize))

        gridLayer.cellInfoHTML = sexBalanceTooltip

    } else if (mapCode === "mobility_pc") {
        gridLayer.dataset = dataset.mob

        const classNumberSize = 5;
        gridLayer.styles = [
            new gridviz.CompositionStyle({
                color: {
                    pcSAME: "#fed9a6", //light mostard
                    pcCHG_IN: "#7570b3", //blueish
                    pcCHG_OUT: "#d95f02", //orange
                    unknown: naColor,
                },
                type: () => "piechart", //flag, piechart, ring, segment, radar, agepyramid, halftone
                size: sbtp ? (c, r, z, scale) => scale(c.T) : undefined,
                viewScale: sbtp ? gridviz.viewScaleQuantile({
                    valueFunction: (c) => c.T,
                    classNumber: classNumberSize,
                    minSizePix: 6,
                    maxSizeFactor: 1.2,
                }) : undefined,
            }),
        ];

        gridLayer.minPixelsPerCell = 14;
        gridLayer.styles[0].legends = [mobLegend, naLegendC];
        if (sbtp) gridLayer.styles[0].addLegends(popSizeLegend(classNumberSize))
        gridLayer.cellInfoHTML = mobilityPCTooltip

    } else if (mapCode === "pob_pc") {
        gridLayer.dataset = dataset.pob

        const classNumberSize = 4;
        gridLayer.styles = [
            new gridviz.CompositionStyle({
                color: {
                    pcNAT: "#fed9a6", //light mostard
                    pcEU_OTH: "#7570b3", //blueish
                    unknown: naColor,
                    pcOTH: "#d95f02", //orange
                },
                type: () => "halftone", //flag, piechart, ring, segment, radar, agepyramid, halftone
                size: sbtp ? (c, r, z, scale) => scale(c.T) : undefined,
                viewScale: sbtp ? gridviz.viewScaleQuantile({
                    valueFunction: (c) => +c.T,
                    classNumber: classNumberSize,
                    minSizePix: 8,
                }) : undefined,
            }),
        ];

        gridLayer.minPixelsPerCell = 12;
        gridLayer.styles[0].legends = [pobLegend, naLegendC];
        if (sbtp) gridLayer.styles[0].legends.push(popSizeLegend(classNumberSize))
        gridLayer.cellInfoHTML = pobPCTooltip

    } else if (mapCode === "chernoff") {
        console.log(mapCode)

        /*
        gridLayer.dataset = dataset.all
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

