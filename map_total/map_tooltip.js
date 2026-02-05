


const tooltipFun = (c, r) =>
    +c[year]
        ? "<b>" +
        c[year] +
        "</b> inhabitant" +
        (+c[year] == 1 ? "" : "s") +
        " per " +
        (r * r) / 1000000 +
        "km²"
        : //+ "<br>" + c.CNTR_ID
        undefined;


const tooltipFunCh = (c) =>
    "2011: " +
    c.TOT_P_2011 +
    "<br>2021: " +
    c.TOT_P_2021 +
    "<br>" +
    "<b>" +
    (c["d2011_2021"] == 0
        ? "No change"
        : (c["d2011_2021"] > 0 ? "+" : "") +
        c["d2011_2021"] +
        " inhabitants") +
    "</b>";

