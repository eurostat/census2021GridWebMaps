
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
