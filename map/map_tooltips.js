

const totPopTooltip = (c) => {
    const v = c.T
    if (v == -1) return "Data not available (confidential)"
    else return "<b>" + formatLarge(v) + "</b> person" + (v == 1 ? "" : "s")
}


const shareTooltip = (shareCode, mapCode) => (c) => {
    const buf = []

    //title
    buf.push(legendTitles[mapCode])

    //percentage
    if (c[mapCode] == undefined || c[shareCode] == undefined)
        buf.push("Data not available")
    else if (c[mapCode] == -1 || c[shareCode] == -1)
        buf.push("Data not available (confidential)")
    else
        buf.push("<b>" + formatPercentage(c[shareCode]) + "</b>")

    //totals
    const p1 = formatLargeNA(c[mapCode], false)
    const p2 = formatLargeNA(c.T, false) + " person" + (c.T == 1 ? "" : "s");
    buf.push((p1 == "NA" ? "" : p1 + " in ") + p2)

    return buf.join("<br>")

    /*const pop_ = "<br>" + formatLarge(c.T) + " person" + (c.T == 1 ? "" : "s");
    if (c[mapCode] == undefined || c[shareCode] == undefined)
        return "Data not available" + pop_;
    if (c[mapCode] == -1 || c[shareCode] == -1)
        return "Data not available (confidential)" + pop_;
    return "<b>" + formatPercentage(c[shareCode]) + "</b><br>" + formatLarge(c[mapCode]) + pop_;*/
};



const terToo___ = (c, p) => {
    const v = c[p]
    if (v == undefined) return 'NA'
    if (v == -1) return "NA (confidential)"
    return formatLargeNA(v, false) + " - " + formatPercentage(c["s" + p], false)
}

const ternaryTooltip = {
    "ter_age": (c) => {
        const total = (c.Y_LT15 == undefined || c.Y_1564 == undefined || c.Y_GE65 == undefined || c.Y_LT15 == -1 || c.Y_1564 == -1 || c.Y_GE65 == -1) ? c.T : c.Y_LT15 + c.Y_1564 + c.Y_GE65;
        const percpart =
            "Age under 15 years: " + terToo___(c, "Y_LT15") + "<br>" +
            "Age 15 to 64 years: " + terToo___(c, "Y_1564") + "<br>" +
            "Age 65 years and older: " + terToo___(c, "Y_GE65")
        return "<b>" + formatLarge(total) + "</b> person" + (total == 1 ? "" : "s") + "<br>" + percpart
    },
    "ter_mob": (c) => {
        const total = (c.SAME == undefined || c.CHG_IN == undefined || c.CHG_OUT == undefined || c.SAME == -1 || c.CHG_IN == -1 || c.CHG_OUT == -1) ? c.T : c.SAME + c.CHG_IN + c.CHG_OUT;
        const percpart =
            "Residence unchanged: " + terToo___(c, "SAME") + "<br>" +
            "Moved within the country: " + terToo___(c, "CHG_IN") + "<br>" +
            "Moved from outside the country: " + terToo___(c, "CHG_OUT")
        return "<b>" + formatLarge(total) + "</b> person" + (total == 1 ? "" : "s") + "<br>" + percpart
    },
    "ter_pob": (c) => {
        const total = (c.NAT == undefined || c.EU_OTH == undefined || c.OTH == undefined || c.NAT == -1 || c.EU_OTH == -1 || c.OTH == -1) ? c.T : c.NAT + c.EU_OTH + c.OTH;
        const percpart =
            "Born in the country: " + terToo___(c, "NAT") + "<br>" +
            "Born in another EU member state: " + terToo___(c, "EU_OTH") + "<br>" +
            "Born outside the EU: " + terToo___(c, "OTH")
        return "<b>" + formatLarge(total) + "</b> person" + (total == 1 ? "" : "s") + "<br>" + percpart
    }
}




const getTooltipDemography = (mapCode) => {
    return (c) => {
        const v = c[mapCode]
        if (v == undefined) return "Data not available"
        if (v == -1) return "Data not available (confidential)"
        const buf = []
        let line = "<b>" + v.toFixed(0) + "</b>"
        if (mapCode == "ageing") line += " age (65+) per 100 age (0-14)"
        if (mapCode == "dep_ratio") line += " age (65+) or (0-14) per 100 age (15-64)"
        if (mapCode == "oa_dep_ratio") line += " age (65+) per 100 age (15-64)"
        if (mapCode == "y_dep_ratio") line += " age (0-14) per 100 age (15-64)"
        if (mapCode == "median_age") line += " years (median age estimate)"
        buf.push(line)

        let total = c.Y_LT15 + c.Y_1564 + c.Y_GE65;
        const tot_ = formatLarge(total) + " person" + (total == 1 ? "" : "s in total");
        buf.push(tot_)

        if (mapCode != "oa_dep_ratio") buf.push("Age under 15 years: " + c.Y_LT15)
        if (mapCode != "ageing") buf.push("Age 15 to 64 years: " + c.Y_1564)
        if (mapCode != "y_dep_ratio") buf.push("Age 65 years and older: " + c.Y_GE65)
        return buf.join("<br>");
    }
}


const agePyramidTooltip = ternaryTooltip.ter_age

const sexBalanceTooltip = (c) => {
    if (c.F == undefined || c.F == undefined) return "Data not available"
    if (c.F == -1 || c.F == -1) return "Data not available (confidential)"
    let tot = c.F + c.M;
    const pop_ = "<b>" + formatLarge(tot) + "</b> person" + (tot == 1 ? "" : "s") + "<br>";
    if (c.F == undefined || c.M == undefined)
        return "Data not available" /*+ (c.CONFIDENTIALSTATUS ? " (confidential)" : "")*/ + "<br>" + pop_;
    return (
        pop_ +
        formatLarge(c.M) +
        " m" +
        (c.M == 1 ? "a" : "e") +
        "n<br>" +
        formatLarge(c.F) +
        " wom" +
        (c.F == 1 ? "a" : "e") +
        "n<br>" +
        "Difference: <b>" +
        (c.indMF > 0 ? "+" : "") +
        formatPercentage(c.indMF) +
        " men</b>"
    );
};

const mobilityPCTooltip = ternaryTooltip.ter_mob

const pobPCTooltip = ternaryTooltip.ter_pob

const chernoffTooltip = (ageClassifier, sexClassifier, empClassifier) => (c) => {
    const a = ageClassifier(c);
    const s = sexClassifier(c);
    const e = empClassifier(c.sEMP);
    return (
        "" +
        c.T +
        " person" +
        (c.T ? "s" : "") +
        "<br>Over-representation of <b>" +
        (s == "m" ? "men" : "women") +
        "</b>" +
        "<br>" +
        (a == "0"
            ? "younger than <b>15</b>"
            : a == "1"
                ? "aged between <b>15 and 64</b>"
                : "aged <b>65</b> and older") +
        "<br>with <b>" +
        (e == 0 ? "low" : e == 1 ? "average" : "high") +
        "</b> employment"
    );
}
