
//define not available legend
const naLegend = new gridviz.ColorCategoryLegend({
    colorLabel: [[naColor, "Data not available"]],
    shape: "square",
});
const naLegendC = new gridviz.ColorCategoryLegend({
    colorLabel: [[naColor, "Data not available"]],
    shape: "circle",
});



// color style
//console.log(colors)
styles.color[0].legends = [
    new gridviz.ColorDiscreteLegend({
        title: "Population density, in persons/km2",
        width: Math.min(window.innerWidth - 40, 450),
        colors: () => colors,
        breaks: (viewScale) => viewScale?.breaks.map((b) => gridviz.nice(b)),
    })
]

// dark color style
styles.colorDark[0].legends = [
    new gridviz.ColorDiscreteLegend({
        title: "Population density, in persons/km2",
        width: Math.min(window.innerWidth - 40, 450),
        colors: () => colorsDark,
        breaks: (viewScale) => viewScale?.breaks.map((b) => gridviz.nice(b)),
    })
]

// size
styles.size[0].legends = gridviz.sizeLegendViewScale((c) => c.p, {
    k: [0.8, 0.25, 0.05],
    title: 'Population',
    fillColor: col,
    labelFormat: d3.format(',.2r'),
})


// dots
//styles.dots.legends = []

// pillar
//styles.pillar.legends = []

// joyplot
//styles.joyplot.legends = []



// color change
styles.colorCh[0].legends = [
    new gridviz.ColorDiscreteLegend({
        title: "Population change (number of persons)",
        width: Math.min(window.innerWidth - 40, 450),
        colors: () => colorsCh,
        breaks: (viewScale) => viewScale?.breaks.map((b) => Math.round(b)),
    })
]

// size change
styles.sizeCh[0].legends = []

// segment change
styles.segmentCh[0].legends = []

