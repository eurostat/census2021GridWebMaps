//default color for not available data
const naColor = "#ccc";

// default stroke style
const strokeStyle = new gridviz.StrokeStyle({ strokeColor: () => "#fff8", visible: (z) => z < 15, blendOperation: () => "source-over" });

//default color
const col = "#e54f37";


const styles = {}

// color style

styles.color = [(() => {
    const colors = []
    const classNumber = 8;
    for (let i = 0; i <= (classNumber - 1); i++) colors.push(d3.interpolateYlOrRd(0.85 * i / (classNumber - 1)))
    const scaleTPop = gridviz.exponentialScale(7)
    const popCols = { ...colors }; popCols.na = naColor

    return new gridviz.SquareColorCategoryWebGLStyle({
        viewScale: (cells, r) => {
            const max = d3.max(cells, c => c.p)
            const rr = r * r / 1000000
            const breaks = []
            for (let i = 1; i < classNumber; i++) {
                let t = i / classNumber
                t = scaleTPop(t)
                breaks.push(max * t / rr)
            }
            return gridviz.classifier(breaks)
        },
        code: (c, r, z, classifier) => {
            const v = c.p
            if (v == -1 || v == undefined) return "na"
            return classifier(1000000 * v / r / r)
        },
        color: popCols,
    })
})(), strokeStyle]

// dark color style

styles.colorDark = [(() => {
    const colors = []
    const classNumber = 8;
    for (let i = 0; i <= (classNumber - 1); i++) colors.push(d3.interpolateMagma(0.85 * i / (classNumber - 1)))
    const scaleTPop = gridviz.exponentialScale(7)
    const popCols = { ...colors }; popCols.na = naColor

    return new gridviz.SquareColorCategoryWebGLStyle({
        viewScale: (cells, r) => {
            const max = d3.max(cells, c => c.p)
            const rr = r * r / 1000000
            const breaks = []
            for (let i = 1; i < classNumber; i++) {
                let t = i / classNumber
                t = scaleTPop(t)
                breaks.push(max * t / rr)
            }
            return gridviz.classifier(breaks)
        },
        code: (c, r, z, classifier) => {
            const v = c.p
            if (v == -1 || v == undefined) return "na"
            return classifier(1000000 * v / r / r)
        },
        color: popCols,
    })
})(), strokeStyle]



// size

const bertinPointsStyle = new gridviz.Style({
    drawFun: (cells, cg, r) => {
        //keep only cells with population
        cells = cells.filter((c) => c.p);
        if (cells.length == 0) return;

        //get max population
        const max = d3.max(cells, (c) => +c.p);
        if (!max) return;

        //sort cells by decreasing x and increasing y
        cells.sort((c1, c2) => (c2.y == c1.y ? c1.x - c2.x : c2.y - c1.y));

        //set colors and line width
        const ctx = cg.offscreenCtx
        ctx.fillStyle = col //+ "bb";
        ctx.strokeStyle = "white"//"#666"
        ctx.lineWidth = 2 * cg.view.z;

        //const scalePopulation = gridviz.logarithmicScale(-3)
        const scalePopulation = gridviz.powerScale(0.3)
        //gviz.sPow(v / s.max, 0.3),

        for (let c of cells) {
            const sG = 1.6 * r * scalePopulation(c.p / max);
            ctx.beginPath();
            ctx.arc(c.x + r / 2, c.y + r / 2, sG * 0.5, 0, 2 * Math.PI, false);
            ctx.stroke();
            ctx.fill();
        }
    }
})
bertinPointsStyle.blendOperation = () => "source-over"
styles.size = [bertinPointsStyle]


// dots

styles.dots = [new gridviz.DotDensityStyle({
    viewScale: (cells) => d3.max(cells, c => c.p),
    dotNumber: (c, r, z, max) => 10 * r * r / (z * z) * c.p / max,
    dotSize: (r, z) => 1.2 * z,
    color: () => col,
})]


// pillar

const scalePillar =  gridviz.logarithmicScale(-5)
styles.pillar = [new gridviz.PillarStyle({
    viewScale: (cells) => d3.max(cells, (cell) => +cell.p),
    height: (cell, resolution, z, max) => (300 * z * cell.p) / max,
    simple: () => true,
    color: () => col,
    viewHeightFactor: 5,
    width: (cell, resolution) => 0.3 * resolution,
    viewSX: -0.7,
    viewSY: -3,
    shadowDirection: (21 * Math.PI) / 180.0,
    shadowFactor: 0.5,
    /*viewScale: (cells) => d3.max(cells, (cell) => +cell.p),
    height: (c, r, z, max) => 10 * r * scalePillar(c.p / max),
    simple: () => true,
    color: () => col, // + "aa",
    viewHeightFactor: 5,
    width: (c, r) => 0.3 * r,
    viewSX: -0.7,
    viewSY: -3,
    shadowDirection: (21 * Math.PI) / 180.0,
    shadowFactor: 0.5,*/
})]
