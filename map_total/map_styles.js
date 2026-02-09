//default color for not available data
const naColor = "#ccc";

// default stroke style
const strokeStyle = new gridviz.StrokeStyle({ strokeColor: () => "#fff8", visible: (z) => z < 15, blendOperation: () => "source-over" });

//default color
const col = "#e54f37";


// styles library
const styles = {}

// color style

const colors = []
const classNumber = 8;
for (let i = 0; i <= (classNumber - 1); i++) colors.push(d3.interpolateYlOrRd(0.85 * i / (classNumber - 1)))
const scaleTPop = gridviz.exponentialScale(7)
const popCols = { ...colors }; popCols.na = naColor

styles.color = [
    new gridviz.SquareColorCategoryWebGLStyle({
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
    }),
    strokeStyle
]

// dark color style

const colorsDark = []
const classNumberDark = 8;
for (let i = 0; i <= (classNumberDark - 1); i++) colorsDark.push(d3.interpolateMagma(0.85 * i / (classNumberDark - 1)))
const popColsDark = { ...colorsDark }; popColsDark.na = naColor

styles.colorDark = [
    new gridviz.SquareColorCategoryWebGLStyle({
        viewScale: (cells, r) => {
            const max = d3.max(cells, c => c.p)
            const rr = r * r / 1000000
            const breaks = []
            for (let i = 1; i < classNumberDark; i++) {
                let t = i / classNumberDark
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
        color: popColsDark,
    }),
    strokeStyle
]



// size
const scaleSize = gridviz.powerScale(0.3)
styles.size = [
    new gridviz.Style({
        drawFun: (cells, cg, r) => {
            //keep only cells with population
            cells = cells.filter((c) => c.p);
            if (cells.length == 0) return;

            //get view scale
            const z = cg.view.z
            const viewScale = gridviz.viewScale({
                valueFunction: (c) => c.p,
                maxSizeFactor: 1.65,
                stretching: scaleSize,
            })(cells, r, z)

            //get max population
            const max = d3.max(cells, (c) => +c.p);
            if (!max) return;

            //sort cells by decreasing x and increasing y
            cells.sort((c1, c2) => (c2.y == c1.y ? c1.x - c2.x : c2.y - c1.y));

            //set colors and line width
            const ctx = cg.offscreenCtx
            ctx.fillStyle = col //+ "bb";
            ctx.strokeStyle = "white"//"#666"
            ctx.lineWidth = 2 * z;

            for (let c of cells) {
                const sG = viewScale(c.p)
                ctx.beginPath();
                ctx.arc(c.x + r / 2, c.y + r / 2, sG * 0.5, 0, 2 * Math.PI, false);
                ctx.stroke();
                ctx.fill();
            }

            //update legends
            styles.size[0].updateLegends({ viewScale: viewScale, resolution: r, z: z, cells: cells })
        },
        blendOperation: (z) => z <= 11 ? "multiply" : "source-over"
    })
]


// dots

styles.dots = [new gridviz.DotDensityStyle({
    viewScale: (cells) => d3.max(cells, c => c.p),
    dotNumber: (c, r, z, max) => 10 * r * r / (z * z) * c.p / max,
    dotSize: (r, z) => 1.2 * z,
    color: () => col,
})]


// pillar

const scalePillar = gridviz.logarithmicScale(-5)
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

styles.joyplot = [new gridviz.JoyPlotStyle({
    height: (c, r, z, scale) => scale(c.p),
    viewScale: gridviz.viewScale({
        valueFunction: (c) => +c.p,
        maxSizeFactor: 5,
        stretching: gridviz.powerScale(0.4),
    }),
    lineColor: (y, ys, r, z) => {
        const t = 255 - (255 * (y - ys.min)) / (ys.max - ys.min)
        return "rgb(180," + t + "," + t + ")"
    },
    lineWidth: (y, ys, r, z) => 0.1 * r,
    fillColor: (y, ys, r, z) =>
        'rgba(180,0,0,' + (0.0 + (1 - (y - ys.min) / (ys.max - ys.min)) * 0.9) + ')',
})]



styles.lego = gridviz.LegoStyle.get(
    (cell) => cell.p,
    [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000],
    ["#237841", "#4B9F4A", "#3CB371", "#C7D23C", "#F2CD37", "#F8BB3D", "#FFA70B", "#D09168", "#B67B50", "#7C503A", "#582A12"]
)




styles.colorCh = [(() => {
    const colors = []
    const classNumber = 10;
    for (let i = 0; i <= (classNumber - 1); i++) colors.push(d3.interpolateSpectral(i / (classNumber - 1)))
    const scaleTPop = gridviz.powerScale(0.22)
    const popCols = { ...colors }; popCols.na = naColor

    return new gridviz.SquareColorCategoryWebGLStyle({
        viewScale: (cells, r) => {
            const [min, max] = d3.extent(cells, c => c.d2011_2021)
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
            const v = c.d2011_2021
            if (v == -1 || v == undefined) return "na"
            return classifier(1000000 * v / r / r)
        },
        color: popCols,
    })
})(), strokeStyle]


/*
const streC = 0.22;

new gviz.ShapeColorSizeStyle({
                colorCol: "d2011_2021",
                color: (v, r, s) => {
                  const stre = gviz.sPow;
                  let t = 0.5;
                  if (s.min < 0 && v < 0) {
                    t -= stre(v / s.min, streC) / 2;
                  } else {
                    t += stre(v / s.max, streC) / 2;
                  }
                  t = 1 - t;
                  return d3.interpolateSpectral(t);
                },
              }),
              new gviz.StrokeStyle({ maxZoom: 80 }),
*/



// size change

const scaleSizeChange = gridviz.powerScale(0.2)
styles.sizeCh = [
    new gridviz.Style({
        drawFun: (cells, cg, r) => {
            //keep only cells with population change
            cells = cells.filter((c) => c.d2011_2021);
            if (cells.length == 0) return;

            //get max population change
            const max = d3.max(cells, (c) => Math.abs(c.d2011_2021));

            //sort cells by decreasing x and increasing y
            cells.sort((c1, c2) => (c2.y == c1.y ? c1.x - c2.x : c2.y - c1.y));

            //set colors and line width
            const ctx = cg.offscreenCtx
            ctx.strokeStyle = "white"//"#666"
            ctx.lineWidth = 2 * cg.view.z;

            for (let c of cells) {
                // color
                ctx.fillStyle = c.d2011_2021 > 0 ? "#d13c4b" : "#4288b5" // cc
                // size
                const sG = 1.6 * r * scaleSizeChange(Math.abs(c.d2011_2021) / max);

                ctx.beginPath();
                ctx.arc(c.x + r / 2, c.y + r / 2, sG * 0.5, 0, 2 * Math.PI, false);
                ctx.stroke();
                ctx.fill();
            }
        },
        blendOperation: (z) => z <= 11 ? "multiply" : "source-over"
    })
]


// segment change

const maxAngle = 60;
const scaleSegmentChange = gridviz.powerScale(0.25)

styles.segmentCh = [
    new gridviz.SegmentStyle({
        length: (c, r) => r,
        color: (c) =>
            Math.abs(c.p2011_2021) < 0.02
                ? "gray"
                : c.p2011_2021 > 0
                    ? "#d13c4b" //cc
                    : "#4288b5", //cc
        orientation: (c) => {
            let a = (c.p2011_2021 * maxAngle) / 0.3;
            a = a < -maxAngle ? -maxAngle : a > maxAngle ? maxAngle : a;
            return a;
        },
        viewScale: (cells) => d3.max(cells, c => c.p2021),
        width: (c, r, z, max) => 0.8 * r * scaleSegmentChange(c.p2021 / max),
        //width: (v, r, s, zf) => 0.8 * r * gviz.sPow(v / s.max, 0.25),
    })
]
