


//function to compute the percentage of a cell value
const computePercentage = (c, col, totalFunction) => {
    const total = totalFunction(c);
    if (total == 0 || c[col] == undefined) {
        c["s" + col] = undefined;
        return;
    }
    c["s" + col] = (c[col] / total) * 100;
    c["s" + col] = c["s" + col] > 100 ? 100 : c["s" + col] < 0 ? 0 : c["s" + col];
};


// preprocesses and indicator computation functions
const compute = {
    sex: (c) => {
        if (c.CONFIDENTIALSTATUS && c.F == 0 && c.M == 0) {
            c.F = undefined;
            c.M = undefined;
        }

        if (c.F == undefined || c.M == undefined) {
            c.indMF = undefined;
            return;
        }

        //if (c.F + c.M != c.T) console.error("Error found in sex total", c.F + c.M, c.T)

        //male/female index
        c.indMF = (100 * (c.M - c.F)) / (c.M + c.F);

        //compute percentages
        computePercentage(c, "F", (c) => c.M + c.F);
        computePercentage(c, "M", (c) => c.M + c.F);

        //tag as precomputed
        c.p_sex = true;
    },
    age: (c) => {
        if (c.CONFIDENTIALSTATUS && c.Y_LT15 == 0 && c.Y_1564 == 0 && c.Y_GE65 == 0) {
            c.Y_LT15 = undefined;
            c.Y_1564 = undefined;
            c.Y_GE65 = undefined;
        }

        //compute percentages
        computePercentage(c, "Y_LT15", (c) => c.Y_LT15 + c.Y_1564 + c.Y_GE65);
        computePercentage(c, "Y_1564", (c) => c.Y_LT15 + c.Y_1564 + c.Y_GE65);
        computePercentage(c, "Y_GE65", (c) => c.Y_LT15 + c.Y_1564 + c.Y_GE65);
        //tag as precomputed
        c.p_age = true;
    },
    emp: (c) => {
        if (c.CONFIDENTIALSTATUS && c.EMP == 0) {
            c.EMP = undefined;
        }

        //compute percentages
        computePercentage(c, "EMP", (c) => c.T); //TODO sure?
        //tag as precomputed
        c.p_emp = true;
    },
    pob: (c) => {
        if (c.CONFIDENTIALSTATUS && c.NAT == 0 && c.EU_OTH == 0 && c.OTH == 0) {
            c.NAT = undefined;
            c.EU_OTH = undefined;
            c.OTH = undefined;
        }

        //compute percentages
        computePercentage(c, "NAT", (c) => c.NAT + c.EU_OTH + c.OTH);
        computePercentage(c, "EU_OTH", (c) => c.NAT + c.EU_OTH + c.OTH);
        computePercentage(c, "OTH", (c) => c.NAT + c.EU_OTH + c.OTH);
        //tag as precomputed
        c.p_pob = true;
    },
    mob: (c) => {
        if (c.CONFIDENTIALSTATUS && c.SAME == 0 && c.CHG_IN == 0 && c.CHG_OUT == 0) {
            c.SAME = undefined;
            c.CHG_IN = undefined;
            c.CHG_OUT = undefined;
        }

        //compute percentages
        computePercentage(c, "SAME", (c) => c.SAME + c.CHG_IN + c.CHG_OUT);
        computePercentage(c, "CHG_IN", (c) => c.SAME + c.CHG_IN + c.CHG_OUT);
        computePercentage(c, "CHG_OUT", (c) => c.SAME + c.CHG_IN + c.CHG_OUT);
        //tag as precomputed
        c.p_mob = true;
    },
    ageing: (c) => { c.ageing = (c.Y_LT15 == undefined || c.Y_GE65 == undefined) ? -1 : 100 * c.Y_GE65 / c.Y_LT15 },
    dep_ratio: (c) => { c.dep_ratio = (c.Y_LT15 == undefined || c.Y_1564 == undefined || c.Y_GE65 == undefined) ? -1 : 100 * (c.Y_GE65 + c.Y_LT15) / c.Y_1564 },
    oa_dep_ratio: (c) => { c.oa_dep_ratio = (c.Y_1564 == undefined || c.Y_GE65 == undefined) ? -1 : 100 * c.Y_GE65 / c.Y_1564 },
    y_dep_ratio: (c) => { c.y_dep_ratio = (c.Y_LT15 == undefined || c.Y_1564 == undefined) ? -1 : 100 * c.Y_LT15 / c.Y_1564 },
    median_age: (c) => {
        //median age estimation - grouped median estimation - see Shryock & Siegel – Methods and Materials of Demography
        const y = c.Y_LT15 || 0, m = c.Y_1564 || 0, o = c.Y_GE65 || 0
        //half population
        const half = (y + m + o) / 2
        //yes, this case does happen !
        if (m == 0 && y == o) c.median_age = 40
        else if (half <= y) c.median_age = Math.round(14 * half / y)
        else if (half <= y + m) c.median_age = Math.round(14 + 49 * (half - y) / m)
        else c.median_age = Math.round(64 + 30 * (half - y - m) / o)
    },
}





// class breaks
const breaksDict = {
    F: [40, 45, 49, 50, 51, 55, 60],
    M: [40, 45, 49, 50, 51, 55, 60],
    Y_LT15: [5, 10, 15, 20, 25, 30],
    Y_1564: [50, 60, 65, 70, 75, 80],
    Y_GE65: [10, 20, 30, 40, 50],
    EMP: [30, 40, 45, 50, 55, 60, 70],
    SAME: [70, 80, 90, 95, 99],
    CHG_IN: [0.5, 1, 5, 10, 20],
    CHG_OUT: [0.5, 1, 2, 5, 10],
    NAT: [60, 70, 80, 85, 90, 95, 99],
    EU_OTH: [1, 5, 10, 15, 20, 30],
    OTH: [1, 5, 10, 20, 30, 50],
    ageing: [25, 50, 75, 100, 150, 200, 400],
    dep_ratio: [30, 40, 50, 60, 80, 100, 150],
    oa_dep_ratio: [15, 20, 25, 30, 40, 50, 75],
    y_dep_ratio: [15, 20, 25, 30, 40, 50, 75],
    median_age: [35, 40, 43, 46, 50, 55, 60, 65],
}

//usual residence 12 months before the census date (unchanged, within the reporting country, outside of the reporting country)
//place of birth (in the reporting country, in another EU country, outside the EU)

const legendTitles = {
    F: "Share of women",
    M: "Share of men",
    Y_LT15: "Share - aged under 15",
    Y_1564: "Share - aged 15 to 64 years",
    Y_GE65: "Share - aged 65 years and older",
    EMP: "Share of employed persons",
    SAME: "Share - residence unchanged",
    CHG_IN: "Share - residence change within country",
    CHG_OUT: "Share - residence change from other country",
    NAT: "Share - born in the country",
    EU_OTH: "Share - born in another EU member state",
    OTH: "Share - born outside the EU",
    ageing: "Ageing Index, in seniors (65+) per 100 youth (0-14)",
    dep_ratio: "Dependency ratio, in seniors (65+) and youth (0-14) per 100 active (15-64)",
    oa_dep_ratio: "Old-age dependency ratio, in seniors (65+) per 100 active (15-64)",
    y_dep_ratio: "Youth dependency ratio, in youth (0-14) per 100 active (15-64)",
    median_age: "Median age estimate",
}

