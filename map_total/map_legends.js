

// color style
styles.color.legends = [
    new gridviz.ColorDiscreteLegend({
        title: "Population density, in persons/km2",
        width: Math.min(window.innerWidth - 40, 450),
        colors: () => colors,
        breaks: (viewScale) => viewScale?.breaks.map((b) => gridviz.nice(b)),
        //labelFormat: formatLarge,
    })
]

// dark color style
styles.colorDark.legends = []

// size
styles.size.legends = []

// dots
//styles.dots.legends = []

// pillar
//styles.pillar.legends = []

// joyplot
//styles.joyplot.legends = []



// color change
styles.colorCh.legends = []

// size change
styles.sizeCh.legends = []

// segment change
styles.segmentCh.legends = []
