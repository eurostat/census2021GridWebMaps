

const totPopTooltip = (c) => "<b>" + formatLarge(c.T) + "</b> person" + (c.T == 1 ? "" : "s")


const shareTooltip = (shareCode, mapCode) => (c) => {
    const pop_ = "<br>" + formatLarge(c.T) + " person" + (c.T == 1 ? "" : "s");
    if (c[mapCode] == undefined || c[shareCode] == undefined)
        return "Data not available" + (c.CONFIDENTIALSTATUS ? " (confidential)" : "") + pop_;
    return "<b>" + formatPercentage(c[shareCode]) + " %</b><br>" + formatLarge(c[mapCode]) + pop_;
};




const ternaryTooltip = {
    "ter_age": (c) => {
        let total = c.Y_LT15 + c.Y_1564 + c.Y_GE65;
        if (isNaN(total)) total = c.T;
        const tot_ = "<b>" + formatLarge(total) + "</b> person" + (total == 1 ? "" : "s") + "<br>";
        if (c.Y_LT15 == undefined || c.Y_1564 == undefined || c.Y_GE65 == undefined)
            return tot_ + "Decomposition data not available" + (c.CONFIDENTIALSTATUS ? "<br>(confidential)" : "");
        return (
            tot_ +
            formatPercentage(c.sY_LT15) +
            "% under 15 years<br>" +
            formatPercentage(c["sY_1564"]) +
            "% 15 to 64 years<br>" +
            formatPercentage(c.sY_GE65) +
            "% 65 years and older"
        );
    },
    "ter_mob": (c) => {
        let total = c.CHG_IN + c.SAME + c.CHG_OUT;
        if (isNaN(total)) total = c.T;
        const tot_ = "<b>" + formatLarge(total) + "</b> person" + (total == 1 ? "" : "s") + "<br>";
        if (c.CHG_IN == undefined || c.SAME == undefined || c.CHG_OUT == undefined)
            return tot_ + "Decomposition data not available" + (c.CONFIDENTIALSTATUS ? "<br>(confidential)" : "");
        return (
            tot_ +
            formatPercentage(c.sSAME) +
            "% residence unchanged<br>" +
            formatPercentage(c.sCHG_IN) +
            "% moved within the country<br>" +
            formatPercentage(c.sCHG_OUT) +
            "% moved from outside the country"
        )
    },
    "ter_pob": (c) => {
        let total = c.NAT + c.EU_OTH + c.OTH;
        if (isNaN(total)) total = c.T;
        const tot_ = "<b>" + formatLarge(total) + "</b> person" + (total == 1 ? "" : "s") + "<br>";
        if (c.NAT == undefined || c.EU_OTH == undefined || c.OTH == undefined)
            return tot_ + "Decomposition data not available" + (c.CONFIDENTIALSTATUS ? "<br>(confidential)" : "");
        return (
            tot_ +
            formatPercentage(c.sNAT) +
            "% born in the country<br>" +
            formatPercentage(c.sEU_OTH) +
            "% born in another EU member state<br>" +
            formatPercentage(c.sOTH) +
            "% born outside the EU"
        );
    }
}




const getTooltipDemography = (mapCode) => {
    return (c) => {
        const buf = []
        let line = "<b>" + c[mapCode].toFixed(0) + "</b>"
        if (mapCode == "ageing") line += " age (65+) per 100 age (0-14)"
        if (mapCode == "dep_ratio") line += " age (65+) or (0-14) per 100 age (15-64)"
        if (mapCode == "oa_dep_ratio") line += " age (65+) per 100 age (15-64)"
        if (mapCode == "y_dep_ratio") line += " age (0-14) per 100 age (15-64)"
        if (mapCode == "median_age") line += " years"
        buf.push(line)

        let total = c.Y_LT15 + c.Y_1564 + c.Y_GE65;
        if (isNaN(total)) total = c.T;
        const tot_ = formatLarge(total) + " person" + (total == 1 ? "" : "s");
        buf.push(tot_)

        buf.push(c.Y_LT15 + " - under 15 years")
        if (mapCode != "ageing") buf.push(c.Y_1564 + " - 15 to 64 years")
        buf.push(c.Y_GE65 + " - 65 years and older")
        return buf.join("<br>");
    }
}



const agePyramidTooltip = (c) =>
    c.Y_LT15 == undefined || c.Y_1564 == undefined || c.Y_GE65 == undefined
        ? undefined
        : "<b>" +
        formatLarge(c.Y_LT15 + c.Y_1564 + c.Y_GE65) +
        "</b> person" +
        (c.Y_LT15 + c.Y_1564 + c.Y_GE65 == 1 ? "" : "s") +
        "<br>" +
        formatLarge(c.Y_LT15) +
        " - under 15 years<br>" +
        formatLarge(c.Y_1564) +
        " - 15 to 64 years<br>" +
        formatLarge(c.Y_GE65) +
        " - 65 years and older"


const sexBalanceTooltip = (c) => {
    let tot = c.F + c.M;
    if (isNaN(tot)) tot = c.T;
    const pop_ = "<b>" + formatLarge(tot) + "</b> person" + (tot == 1 ? "" : "s") + "<br>";
    if (c.F == undefined || c.M == undefined)
        return "Data not available" + (c.CONFIDENTIALSTATUS ? " (confidential)" : "") + "<br>" + pop_;
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
        " % men</b>"
    );
};

const mobilityPCTooltip = (c) =>
    c.SAME == undefined || c.CHG_IN == undefined || c.CHG_OUT == undefined
        ? undefined
        : "<b>" +
        formatLarge(c.SAME + c.CHG_IN + c.CHG_OUT) +
        "</b> person" +
        (c.SAME + c.CHG_IN + c.CHG_OUT == 1 ? "" : "s") +
        "<br>" +
        formatLarge(c.SAME) +
        " residence unchanged<br>" +
        formatLarge(c.CHG_IN) +
        " moved within the country<br>" +
        formatLarge(c.CHG_OUT) +
        " moved from outside the country";


const pobPCTooltip = (c) =>
    c.NAT == undefined || c.EU_OTH == undefined || c.OTH == undefined
        ? undefined
        : "<b>" +
        formatLarge(c.NAT + c.EU_OTH + c.OTH) +
        "</b> person" +
        (c.NAT + c.EU_OTH + c.OTH == 1 ? "" : "s") +
        "<br>" +
        formatLarge(c.NAT) +
        " born in the country<br>" +
        formatLarge(c.EU_OTH) +
        " born in another EU member state<br>" +
        formatLarge(c.OTH) +
        " born outside the EU";
