


const tooltipFun = year => (c, r) => {
    const v = c[year]
    if (!v) return
    return "<b>" + c[year] + "</b> inhabitant" + (+c[year] == 1 ? "" : "s") +
        " per " + (r * r) / 1000000 + "km²"
    //+ "<br>" + c.CNTR_ID
}


const tooltipFunCh = (c) =>
    "2011: " + c.p2011 +
    "<br>2021: " + c.p2021 +
    "<br>" + "<b>" +
    (c.d2011_2021 == 0
        ? "No change"
        : (c.d2011_2021 > 0 ? "+" : "") +
        c.d2011_2021 +
        " inhabitants") +
    "</b>";

