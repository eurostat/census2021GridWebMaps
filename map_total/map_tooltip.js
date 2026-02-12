


const tooltipFun = (c, r) =>
    c.T ? "<b>" + formatLarge(c.T) + "</b> person" + (+c.T == 1 ? "" : "s") +
        " per " + ((r * r) / 1000000) + " km²" : undefined
//+ "<br>" + c.CNTR_ID


const tooltipFunCh = (c) =>
    c.T2021 || c.T2011 ?
        "2011: " + c.T2011 +
        "<br>2021: " + c.T2021 +
        "<br>" + "<b>" +
        (c.d2011_2021 == 0
            ? "No change"
            : (c.d2011_2021 > 0 ? "+" : "") +
            c.d2011_2021 +
            " inhabitants") +
        "</b>" : undefined;

