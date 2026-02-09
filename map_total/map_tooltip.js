


const tooltipFun = (c, r) =>
    c.p ? "<b>" + formatLarge(c.p) + "</b> person" + (+c.p == 1 ? "" : "s") +
        " per " + Math.round((r * r) / 1000000) + " km²" : undefined
//+ "<br>" + c.CNTR_ID


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

