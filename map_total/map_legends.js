
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

/*
  
          const lgCat = new gviz.ColorCategoryLegend({
            shape: "square",
            colCat: [
              ["#d13c4b", "Increase"],
              ["#4288b5", "Decrease"],
            ],
          });


//legend
          app.layers[0].styles[0].legends.push(
            new gviz.SizeLegend({
              title: "Population change",
              exaggerationFactor: 0.9,
              shape: "circle",
              labelUnitText: "inhabitants",
              fillColor: "gray",
            }).style("padding", "0px 5px")
          );
          app.layers[0].styles[0].legends.push(
            new gviz.SizeLegend({
              exaggerationFactor: 0.2,
              shape: "circle",
              labelUnitText: "",
              fillColor: "gray",
            }).style("padding", "0px 5px")
          );
          app.layers[0].styles[0].legends.push(
            new gviz.SizeLegend({
              exaggerationFactor: 0.01,
              shape: "circle",
              labelUnitText: "",
              fillColor: "gray",
            }).style("padding", "0px 5px")
          );
          const lgCat = new gviz.ColorCategoryLegend({
            shape: "square",
            colCat: [
              ["#d13c4b", "Increase"],
              ["#4288b5", "Decrease"],
            ],
          });
          app.layers[0].styles[0].legends.push(lgCat);
*/



// segment change
styles.segmentCh[0].legends = []

/*
          app.layers[0].styles[0].legends.push(
            new gviz.SegmentWidthLegend({
              title: "Population in " + year_,
              labelUnitText: "inhab.",
            })
          );

          app.layers[0].styles[0].legends.push(
            new gviz.SegmentOrientationLegend({
              title: "Population change",
              labelUnitText: "Strong increase",
              color: "#d13c4b",
              orientation: 60,
            })
          );
          app.layers[0].styles[0].legends.push(
            new gviz.SegmentOrientationLegend({
              labelUnitText: "Weak increase",
              color: "#d13c4b",
              orientation: 30,
            })
          );
          app.layers[0].styles[0].legends.push(
            new gviz.SegmentOrientationLegend({
              labelUnitText: "Stability (<1%)",
              color: "gray",
              orientation: 0,
            })
          );
          app.layers[0].styles[0].legends.push(
            new gviz.SegmentOrientationLegend({
              labelUnitText: "Weak decrease",
              color: "#4288b5",
              orientation: -30,
            })
          );
          app.layers[0].styles[0].legends.push(
            new gviz.SegmentOrientationLegend({
              labelUnitText: "Strong decrease",
              color: "#4288b5",
              orientation: -60,
            })
          );
          //const lgCat = new gviz.ColorCategoryLegend({ title: "Population change", shape: "square", colCat: [["#d13c4b", "Increase"], ["gray", "Stable (<1%)"], ["#4288b5", "Decrease"]] })
          //app.layers[0].styles[0].legends.push(lgCat)
        }
*/