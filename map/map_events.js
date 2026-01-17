
//home button
document.getElementById("home-button").addEventListener("click", (event) => {
    event.stopPropagation();
    map.setView(DEFAULTMAPSETTINGS.x, DEFAULTMAPSETTINGS.y);
    map.setZoom(DEFAULTMAPSETTINGS.z);
    map.redraw();
    updateURL(map);
});

//map update
document.getElementById("map_select").addEventListener("change", update);
document.getElementById("sbtp").addEventListener("change", update);

// show/hide labels
document.getElementById("label").addEventListener("change", function () {
    labelLayer.visible = this.checked ? undefined : () => false;
    map.redraw();
    updateURL(map);
});

// show/hide boundaries
document.getElementById("boundary").addEventListener("change", function () {
    boundariesLayer.visible = this.checked ? undefined : () => false;
    map.redraw();
    updateURL(map);
});

// show/hide background layer
document.getElementById("background").addEventListener("change", function () {
    updateBackgroundVisibility()
    map.redraw();
    updateURL(map);
});

// show/hide road background layer
document.getElementById("road").addEventListener("change", function () {
    updateBackgroundVisibility()
    map.redraw();
    updateURL(map);
});

// show/hide elevation background layer
document.getElementById("elevation").addEventListener("change", function () {
    updateBackgroundVisibility()
    map.redraw();
    updateURL(map);
});
