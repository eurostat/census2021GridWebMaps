
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

