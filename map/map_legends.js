
//define not available legend
const naLegend = new gridviz.ColorCategoryLegend({
    colorLabel: [[naColor, "Data not available"]],
    shape: "square",
});

//population size legend
const popSizeLegend = (classNumberSize, shape = "circle") => gridviz.sizeDiscreteViewScaleLegend(classNumberSize, {
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
        width: Math.min(window.innerWidth - 40, 250),
        colors: () => colors,
        breaks: () => breaks,
        labelFormat: (v, i) => v + (i == 1 || i == breaks.length ? "%" : ""),
    })


//ternary legends

const legendWidth = Math.min(window.innerWidth - 40, 150);

const ternaryLegends = {
    ter_age: new gridviz.TernaryLegend({
        title: "Age",
        classifier: colorTernaryClassifiers["ter_age"],
        width: legendWidth,
        tooltip: map.tooltip,
        texts: {
            0: "Over-representation of persons aged <15",
            1: "Over-representation of persons aged 15 to 64",
            2: "Over-representation of persons aged >=65",
            12: "Under-representation of persons aged <15",
            "02": "Under-representation of<br>persons aged 15 to 64",
            "01": "Under-representation of persons aged >=65",
            center: "Balanced representation of age groups",
        },
        leftText: "Under 15",
        topText: "15 to 64",
        rightText: "65 and older",
        centerCoefficient: 0.5,
    }),
    ter_mob: new gridviz.TernaryLegend({
        title: "Mobility (2020-2021)",
        classifier: colorTernaryClassifiers["ter_mob"],
        width: legendWidth,
        tooltip: map.tooltip,
        texts: {
            0: "Over-representation of persons<br>that moved from outside the country",
            1: "Over-representation of persons<br>with residence unchanged",
            2: "Over-representation of persons<br>that moved within the country",
            12: "Under-representation of persons<br>that moved from outside the country",
            "02": "Under-representation of persons<br>with residence unchanged",
            "01": "Under-representation of persons<br>that moved within the country",
            center: "Balanced representation of mobility groups",
        },
        leftText: "Outside",
        topText: "No change",
        rightText: "Inside country",
        centerCoefficient: 0.5,
    }),
    ter_pob: new gridviz.TernaryLegend({
        title: "Birth place",
        classifier: colorTernaryClassifiers["ter_pob"],
        width: legendWidth,
        tooltip: map.tooltip,
        texts: {
            0: "Over-representation of persons<br>born outside the EU",
            1: "Over-representation of persons<br>born in the country",
            2: "Over-representation of persons<br>born in another EU member state",
            12: "Under-representation of persons<br>born outside the EU",
            "02": "Under-representation of persons<br>born in the country",
            "01": "Under-representation of persons<br>born in another EU member state",
            center: "Balanced representation",
        },
        leftText: "Rest of the world",
        topText: "Same country",
        rightText: "EU",
        centerCoefficient: 0.5,
    })
}
