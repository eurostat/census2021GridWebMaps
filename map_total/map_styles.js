//default color for not available data
const naColor = "#ccc";

// default stroke style
const strokeStyle = new gridviz.StrokeStyle({ strokeColor: () => "#fff8", visible: (z) => z < 15, blendOperation: () => "source-over" });


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
