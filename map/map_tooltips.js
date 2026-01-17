

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

