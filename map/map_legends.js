
//define not available legend
const naLegend = new gridviz.ColorCategoryLegend({
    colorLabel: [[naColor, "Data not available"]],
    shape: "square",
});

//population size legend
const popSizeLegend = (classNumberSize, shape="circle") => gridviz.sizeDiscreteViewScaleLegend(classNumberSize, {
    title: "Population",
    fillColor: "#666",
    shape: shape,
    labelFormat: (v) => formatLarge(gridviz.nice(v)),
})

//total population legend
const totPopLegend = new gridviz.ColorDiscreteLegend({
    title: "Population",
    width: Math.min(window.innerWidth - 40, 400),
    colors: () => colors,
    breaks: (viewScale) => viewScale?.breaks.map((b) => gridviz.nice(b)),
    labelFormat: formatLarge,
})

//share legend
const shareLegend = (mapCode, colors, breaks) =>
    new gridviz.ColorDiscreteLegend({
        title: legendTitles[mapCode],
        width: 250,
        colors: () => colors,
        breaks: () => breaks,
        labelFormat: (v, i) => v + (i == 1 || i == breaks.length ? "%" : ""),
    })

