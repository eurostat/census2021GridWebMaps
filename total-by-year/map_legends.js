
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
styles.size[0].legends = gridviz.sizeLegendViewScale((c) => c.T, {
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

const schleg = gridviz.sizeLegendViewScale((c) => c.d2011_2021, {
  k: [0.9, 0.2, 0.01],
  fillColor: "gray",
  shape: "circle",
  labelFormat: d3.format(',.2r'),
})
const lgCat = new gridviz.ColorCategoryLegend({
  title: 'Population change',
  colorLabel: [["#d13c4b", "Increase"], ["#4288b5", "Decrease"],],
  shape: "square",
});
schleg.unshift(lgCat)

styles.sizeCh[0].legends = schleg



// segment change
lleg = (r, z) => Math.min(20 * z, r)
wleg = (r, z) => 4 * z
styles.segmentCh[0].legends = [
  new gridviz.OrientationLegend({
    title: "Population change",
    label: "Strong increase",
    color: () => "#d13c4b",
    orientation: 60,
    length: lleg,
    width: wleg
  }),
  new gridviz.OrientationLegend({
    label: "Weak increase",
    color: () => "#d13c4b",
    orientation: 30,
    length: lleg,
    width: wleg
  }),
  new gridviz.OrientationLegend({
    label: "Stability (<1%)",
    color: () => "gray",
    orientation: 0,
    length: lleg,
    width: wleg
  }),
  new gridviz.OrientationLegend({
    label: "Weak decrease",
    color: () => "#4288b5",
    orientation: -30,
    length: lleg,
    width: wleg
  }),
  new gridviz.OrientationLegend({
    label: "Strong decrease",
    color: () => "#4288b5",
    orientation: -60,
    length: lleg,
    width: wleg
  })
]
styles.segmentCh[0].legends.push(...gridviz.sizeLegendViewScale((cell) => +cell.T2021, {
  k: [0.8, 0.3, 0.03],
  title: 'Population in 2021',
  shape: 'line',
  color: 'black',
  length: (r, z) => Math.min(2 * r, 50 * z),
  labelFormat: d3.format(',.2r'),
}))
