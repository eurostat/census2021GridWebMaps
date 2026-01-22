
//format function for percentages
const fp___ = d3.format(".1f")
const formatPercentage = (v, conf = true) => {
    let out = (v == -1 || v == undefined) ? "NA" : fp___(v)
    return out + " %" + (v == -1 && conf ? " (confidential)" : "")
}

//format function for large numbers
const _f = d3.format(",.0f");
const formatLarge = (v) => _f(v).replace(/,/g, " ");
const formatLargeNA = (v, conf = true) => {
    if (v == -1 || v == undefined) return "NA" + (v == -1 && conf ? " (confidential)" : "")
    return formatLarge(v)
}

//function to compute the percentage of a cell value
const computePercentage = (c, col, totalFunction) => {
    let v = c[col]
    //confidential case
    if (v == -1) { c["s" + col] = -1; return }
    //undefined case
    if (v == undefined) { c["s" + col] = undefined; return }

    //zero case
    if (v == 0) { c["s" + col] = 0; return }

    const total = totalFunction(c);
    if (!total || isNaN(total)) { c["s" + col] = undefined; return; }

    //compute percentage
    v = (100 * v) / total;
    //clamp to [0,100]
    c["s" + col] = v > 100 ? 100 : v < 0 ? 0 : v;
};


// a function to compute total function from category figures
const computeTotal = cats => c => {
    let s = 0
    for (let cat of cats) {
        if (c[cat] == undefined || c[cat] == -1) return c.T
        s += c[cat]
    }
    return s
}


// preprocesses and indicator computation functions
const preprocess = {
    total: () => { },
    all: (c) => { console.log("TODO: preprocess all") },
    sex: (c) => {
        //male/female index
        if (c.F == -1 || c.M == -1)
            c.indMF = -1
        else if (c.F == undefined || c.M == undefined)
            c.indMF = undefined
        else if (c.F == 0 && c.M == 0)
            c.indMF = undefined //could be 0
        else
            //if (c.F + c.M != c.T) console.error("Error found in sex total", c.F + c.M, c.T)
            c.indMF = (100 * (c.M - c.F)) / (c.M + c.F);

        //compute percentages
        const ct = computeTotal(["M", "F"])
        computePercentage(c, "F", ct)
        computePercentage(c, "M", ct)
    },
    age: (c) => {
        //compute percentages
        const ct = computeTotal(["Y_LT15", "Y_1564", "Y_GE65"])
        computePercentage(c, "Y_LT15", ct)
        computePercentage(c, "Y_1564", ct)
        computePercentage(c, "Y_GE65", ct)

        //unknown category, for pie chart
        if (c.Y_LT15 != -1 && c.Y_1564 != -1 && c.Y_GE65 != -1 && c.Y_LT15 != undefined && c.Y_1564 != undefined && c.Y_GE65 != undefined)
            c.unknown = 0
        else {
            c.unknown = c.T
            for (let p of ["Y_LT15", "Y_1564", "Y_GE65"])
                if (c[p] != -1 && c[p] != undefined)
                    c.unknown -= c[p]
            if (c.unknown < 0) c.unknown = 0
        }
    },
    emp: (c) => {
        //compute percentages
        computePercentage(c, "EMP", (c) => c.T); //TODO sure?
    },
    pob: (c) => {
        //compute percentages
        const ct = computeTotal(["NAT", "EU_OTH", "OTH"])
        computePercentage(c, "NAT", ct)
        computePercentage(c, "EU_OTH", ct)
        computePercentage(c, "OTH", ct)
    },
    mob: (c) => {
        //compute percentages
        const ct = computeTotal(["SAME", "CHG_IN", "CHG_OUT"])
        computePercentage(c, "SAME", ct)
        computePercentage(c, "CHG_IN", ct)
        computePercentage(c, "CHG_OUT", ct)
    },
    ageing: (c) => {
        if (c.Y_LT15 == -1 || c.Y_GE65 == -1) c.ageing = -1
        else if (c.Y_LT15 == undefined || c.Y_GE65 == undefined) c.ageing = undefined
        else c.ageing = 100 * c.Y_GE65 / c.Y_LT15
    },
    dep_ratio: (c) => {
        if (c.Y_LT15 == -1 || c.Y_1564 == -1 || c.Y_GE65 == -1) c.dep_ratio = -1
        else if (c.Y_LT15 == undefined || c.Y_1564 == undefined || c.Y_GE65 == undefined) c.dep_ratio = undefined
        else c.dep_ratio = 100 * (c.Y_GE65 + c.Y_LT15) / c.Y_1564
    },
    oa_dep_ratio: (c) => {
        if (c.Y_1564 == -1 || c.Y_GE65 == -1) c.oa_dep_ratio = -1
        else if (c.Y_1564 == undefined || c.Y_GE65 == undefined) c.oa_dep_ratio = undefined
        else c.oa_dep_ratio = 100 * c.Y_GE65 / c.Y_1564
    },
    y_dep_ratio: (c) => {
        if (c.Y_LT15 == -1 || c.Y_1564 == -1) c.y_dep_ratio = -1
        else if (c.Y_LT15 == undefined || c.Y_1564 == undefined) c.y_dep_ratio = undefined
        else c.y_dep_ratio = 100 * c.Y_LT15 / c.Y_1564
    },
    median_age: (c) => {
        if (c.Y_LT15 == -1 || c.Y_1564 == -1 || c.Y_GE65 == -1) c.median_age = -1
        else if (c.Y_LT15 == undefined || c.Y_1564 == undefined || c.Y_GE65 == undefined) c.median_age = undefined
        else {
            //median age estimation - grouped median estimation - see Shryock & Siegel – Methods and Materials of Demography
            const y = c.Y_LT15, m = c.Y_1564, o = c.Y_GE65
            //half population
            const half = (y + m + o) / 2
            //yes, this case does happen !
            if (m == 0 && y == o) c.median_age = 40
            else if (half <= y) c.median_age = Math.round(14 * half / y)
            else if (half <= y + m) c.median_age = Math.round(14 + 49 * (half - y) / m)
            else c.median_age = Math.round(64 + 30 * (half - y - m) / o)
        }
    },
}




// update URL with map parameters
//TODO should be trigerred also on map move end event
const updateURL = (map) => {
    //get parameters
    const p = new URLSearchParams(window.location.search);

    // map viewport
    const v = map.getView();
    p.set("x", v.x.toFixed(0)); p.set("y", v.y.toFixed(0)); p.set("z", v.z.toFixed(0));

    // handle dropdowns selection
    p.set("map", document.getElementById("map_select").value);

    // handle checkboxes
    for (let cb of ["sbtp", "label", "boundary", "background"])
        p.set(cb, document.getElementById(cb).checked ? "1" : "");

    // handle background theme selection
    p.set("bt", document.querySelector('input[name="background_theme"]:checked').value);

    // handle collapse
    //TODO
    //document.getElementById("expandable-content").classList.contains("collapsed")
    //p.set("collapsed", document.getElementById("sidebar").classList.contains("collapsed") ? "1" : "");
    //if (urlParams.get("collapsed")) document.getElementById("expand-toggle-button").click();

    //interpolate
    p.set("interpolate", interpolate ? "1" : "");

    //set URL with map parameters
    const newURL = `${window.location.pathname}?${p.toString()}`;
    window.history.replaceState({}, '', newURL);
};
