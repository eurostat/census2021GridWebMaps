// class breaks
const breaksDict = {
    F: [40, 45, 49, 50, 51, 55, 60],
    M: [40, 45, 49, 50, 51, 55, 60],
    Y_LT15: [5, 10, 15, 20, 25, 30],
    Y_1564: [50, 60, 65, 70, 75, 80],
    Y_GE65: [10, 20, 30, 40, 50],
    EMP: [30, 40, 45, 50, 55, 60, 70],
    SAME: [80, 90, 92, 94, 96, 98],
    CHG_IN: [0.5, 1, 5, 10, 20],
    CHG_OUT: [0.5, 1, 2, 5, 10],
    NAT: [60, 70, 80, 85, 90, 95, 99],
    EU_OTH: [1, 5, 10, 15, 20, 30],
    OTH: [1, 5, 10, 20, 30, 50],
    ageing: [25, 50, 75, 100, 150, 200, 400],
    dep_ratio: [20, 30, 40, 50, 75, 100, 150],
    oa_dep_ratio: [15, 20, 25, 30, 40, 50, 75],
    y_dep_ratio: [15, 20, 25, 30, 40, 50, 75],
    median_age: [35, 40, 43, 46, 50, 55, 60, 65],
}



//default color for not available data
const naColor = "#ccc";

// default stroke style
const strokeStyle = new gridviz.StrokeStyle({ strokeColor: () => "#fff8", visible: (z) => z < 70, blendOperation: () => "source-over" });

/*/use that style to show when a cell has some confidentiality
const confidentialStyle =
    new gridviz.ShapeColorSizeStyle({
          color: (c) => (c.CONFIDENTIALSTATUS ? '#666' : false),
          shape: () => 'circle',
          size: (c, r) => 0.25 * r,
          visible: z => z < 150
    })*/


// interoplator function
const interpolateStyles = (styles, prop) => {
    //define interpolator
    const interpTotPopStyle = new gridviz.Interpolator({
        value: (c) => c[prop],
        targetResolution: (r, z) => z,
        interpolatedProperty: prop,
    })
    //apply styles
    interpTotPopStyle.styles = styles
    return [interpTotPopStyle]
}



const ternaryColorsDict = {
    center: "#999",
    "0": "#4daf4a", "1": "#377eb8", "2": "#e41a1c",
    "m01": "rgb(79, 150, 133)", "m02": "rgb(174, 127, 48)", "m12": "rgb(171, 96, 106)",
    "unknown": naColor,
};



const colorTernaryClassifierFun = (mapCode) => gridviz.ternaryColorClassifier(
    ternaryData[mapCode].codes,
    () => 100,
    [ternaryColorsDict["0"], ternaryColorsDict["1"], ternaryColorsDict["2"]],
    {
        center: ternaryData[mapCode].center,
        centerColor: ternaryColorsDict.center,
        centerCoefficient: 0.25,
        defaultColor: naColor,
    })

const colorTernaryClassifiers = {}
for(let mapCode of ["ter_age", "ter_mob", "ter_pob"])
    colorTernaryClassifiers[mapCode] = colorTernaryClassifierFun(mapCode)
