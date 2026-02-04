//default color for not available data
const naColor = "#ccc";

// default stroke style
const strokeStyle = new gridviz.StrokeStyle({ strokeColor: () => "#fff8", visible: (z) => z < 15, blendOperation: () => "source-over" });
