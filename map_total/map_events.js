
//home button
document.getElementById("home-button").addEventListener("click", (event) => {
    event.stopPropagation();
    map.setView(DEFAULTMAPSETTINGS.x, DEFAULTMAPSETTINGS.y);
    map.setZoom(DEFAULTMAPSETTINGS.z);
    map.redraw();
    updateURL(map);
});

//map update
const radioButtons = document.querySelectorAll('input[name="style"]');
radioButtons.forEach(radio => { radio.addEventListener('change', update); });
document.getElementById("year").addEventListener("change", update);
document.getElementById("sigmaSM").addEventListener("input", update);

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

    //show/hide copyright html components
    document.getElementById('eurogeographics-copyright').style.display = document.getElementById("boundary").checked ? 'inline-block' : 'none';

    updateURL(map);
});

// show/hide grid
document.getElementById("grid").addEventListener("change", function () {
    gridLayer.visible = this.checked ? undefined : () => false;
    map.redraw();
    updateURL(map);
});

// background
const bckEvent = () => {
    updateLayersVisibility()
    map.redraw();

    //show/hide copyright html components
    document.getElementById('tomtom-copyright').style.display =
        document.getElementById("road").checked && document.getElementById("background").checked ? 'inline-block' : 'none';

    updateURL(map);
}

document.getElementById("background").addEventListener("change", bckEvent);
document.getElementById("road").addEventListener("change", bckEvent);
document.getElementById("elevation").addEventListener("change", bckEvent);

