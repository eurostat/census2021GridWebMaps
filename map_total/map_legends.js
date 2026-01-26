//usual residence 12 months before the census date (unchanged, within the reporting country, outside of the reporting country)
//place of birth (in the reporting country, in another EU country, outside the EU)

const legendTitles = {
    Y_LT15: "Age under 15",
    Y_1564: "Age 15 to 64 years",
    Y_GE65: "Age 65 years and older",
    F: "Women",
    M: "Men",
    EMP: "Employed persons",
    SAME: "Residence unchanged 2020-2021",
    CHG_IN: "Residence change 2020-2021 within the country",
    CHG_OUT: "Residence change 2020-2021 from other country",
    NAT: "Born in the country",
    EU_OTH: "Born in another EU member state",
    OTH: "Born outside the EU",
    ageing: "Ageing Index", //, in seniors (65+) per 100 young (0-14)",
    dep_ratio: "Dependency ratio", //, in seniors (65+) and young (0-14) per 100 active (15-64)",
    oa_dep_ratio: "Old-age dependency ratio", //, in seniors (65+) per 100 active (15-64)",
    y_dep_ratio: "Youth dependency ratio", //, in young (0-14) per 100 active (15-64)",
    median_age: "Median age estimate",
    sex_balance: "Women / men balance, in %",
}

//define not available legend
const naLegend = new gridviz.ColorCategoryLegend({
    colorLabel: [[naColor, "Data not available"]],
    shape: "square",
});
const naLegendC = new gridviz.ColorCategoryLegend({
    colorLabel: [[naColor, "Data not available"]],
    shape: "circle",
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
    width: Math.min(window.innerWidth - 40, 450),
    colors: () => colors,
    breaks: (viewScale) => viewScale?.breaks.map((b) => gridviz.nice(b)),
    //labelFormat: formatLarge,
})

//share and demography legend
const colDiscreteLegend = (mapCode, colors, breaks, labelFormat = undefined, width = 250) =>
    new gridviz.ColorDiscreteLegend({
        title: legendTitles[mapCode],
        width: Math.min(window.innerWidth - 40, width),
        colors: () => colors,
        breaks: () => breaks,
        labelFormat: labelFormat,
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



const agePyramidLegend = agePyramidColors => new gridviz.ColorCategoryLegend({
    title: "Age",
    colorLabel: [
        [agePyramidColors.Y_GE65, "65 years and older"],
        [agePyramidColors.Y_1564, "15 to 64 years"],
        [agePyramidColors.Y_LT15, "Under 15 years"],
    ],
})

const mobLegend = new gridviz.ColorCategoryLegend({
    title: "Mobility, compared to January 1, 2020",
    colorLabel: [
        ["#fed9a6", "Residence unchanged"],
        ["#7570b3", "Moved within the country"],
        ["#d95f02", "Moved from outside the country"],
    ],
})

const pobLegend = new gridviz.ColorCategoryLegend({
    title: "Place of birth",
    colorLabel: [
        ["#fed9a6", "Born in the country"],
        ["#7570b3", "Born in another EU member state"],
        ["#d95f02", "Born outside the EU"],
    ],
})
