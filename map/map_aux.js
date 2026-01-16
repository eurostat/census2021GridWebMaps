

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


