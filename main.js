import "ol/ol.css";
import { Collection, Map, Overlay, View } from "ol";
import { Tile } from "ol/layer";
import { getRenderPixel } from "ol/render";
import { OSM, TileWMS, XYZ } from "ol/source";
import { toLonLat, transformExtent } from "ol/proj";
import {
  defaults as defaultControls,
  ScaleLine,
  FullScreen,
  MousePosition,
  ZoomToExtent,
  Zoom,
} from "ol/control";
import { toStringHDMS } from "ol/coordinate";
import mapList from "../map-list.json";
mapList.sort((a, b) => Number(a.label) - Number(b.label));
import layerList from "../layer-list.json";
layerList.sort((a, b) => a.label.localeCompare(b.label));

const mousePosition = new MousePosition({
  placeholder: "Ponga el raton sobre el mapa para ver las coordenadas",
  coordinateFormat: (coord) => {
    const lonLat = toLonLat(coord);
    return `X: ${lonLat[0].toFixed(4)}, Y: ${lonLat[1].toFixed(4)}`;
  },
});

const extent = transformExtent(
  [3.7, 39.78, 4.4, 40.14],
  "EPSG:4326",
  "EPSG:3857",
);
const zoomToExtent = new ZoomToExtent({
  tipLabel: "Ir a extension inicial",
  extent,
  label: "",
});

const defaultCtrl = new defaultControls({
  zoomOptions: {
    zoomInTipLabel: "Acercar",
    zoomOutTipLabel: "Alejar",
  },
});

// Funcionalidad rueda de carga
const loader = document.getElementById("loader");
let tilesLoading = 0;
function loadingListeners(source) {
  source.on("tileloadstart", () => {
    tilesLoading++;
    showLoader();
  });

  source.on("tileloadend", () => {
    tilesLoading--;
    if (tilesLoading == 0) hideLoader();
  });

  source.on("tileloaderror", () => {
    tilesLoading--;
    if (tilesLoading == 0) hideLoader();
    showError();
  });
}

function showLoader() {
  loader.classList.add("active");
}

function hideLoader() {
  loader.classList.remove("active");
}

let base = new Tile({
  source: new TileWMS({
    url: mapList[0].urlService,
    params: { LAYERS: mapList[0].layerId, TILED: true },
  }),
});
loadingListeners(base.getSource());

let visor = new Tile({
  source: new TileWMS({
    url: mapList[mapList.length - 1].urlService,
    params: { LAYERS: mapList[mapList.length - 1].layerId, TILED: true },
  }),
});
loadingListeners(visor.getSource());

const container = document.getElementById("popup");
const content = document.getElementById("popup-content");
const closer = document.getElementById("popup-closer");






// Funcionalidad para el slider separador de mapas
const slider = document.getElementById("slider");

function onPrerender(evt) {
  const ctx = evt.context;
  const mapSize = map.getSize();
  const width = mapSize[0] * (Number(slider.value) / 100);
  const tl = getRenderPixel(evt, [width, 0]);
  const tr = getRenderPixel(evt, [mapSize[0], 0]);
  const bl = getRenderPixel(evt, [width, mapSize[1]]);
  const br = getRenderPixel(evt, mapSize);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tl[0], tl[1]);
  ctx.lineTo(bl[0], bl[1]);
  ctx.lineTo(br[0], br[1]);
  ctx.lineTo(tr[0], tr[1]);
  ctx.closePath();
  ctx.clip();
}

function onPostrender(evt) {
  evt.context.restore();
}

function assingLayerFuncionality(layer) {
  layer.on("prerender", onPrerender);
  layer.on("postrender", onPostrender);
}

assingLayerFuncionality(visor);

slider.addEventListener("input", () => map.render());
// Funcionalidad para los sliders
//// Funcionalidad para el poisicionamiento del icono del slider
const baseSelector = document.getElementById("base-selector");
const layerSelector = document.getElementById("layer-selector");
const thumbBase = document.getElementById("thumb-base");
const thumbLayer = document.getElementById("thumb-layer");
const thumbIcon = document.getElementById("thumb-icon");
const viewport = map.getViewport();

function thumbPosition(slider, thumbSize = 20) {
  const min = Number(slider.min) || 0;
  const max = Number(slider.max) || 100;

  if (slider.id === "slider")
    return ((Number(slider.value) - min) / (max - min)) * 100;

  const ratio = (Number(slider.value) - min) / (max - min);
  const rect = slider.getBoundingClientRect();

  if (rect.width === 0) return ratio * 100; // fallback si aún no está pintado

  // Arreglo del posicionamiento del thumb para que no sobrepase el slider
  const trackWidth = rect.width - thumbSize;
  const offsetPx = thumbSize / 2 + ratio * trackWidth;
  return (offsetPx / rect.width) * 100;
}

function sliderFunctionality(slider, thumb, moveMap = false) {
  let isDragging = false;
  thumb.style.left = `${thumbPosition(slider)}%`; // Posición inicial del icono

  slider.addEventListener("input", (e) => {
    if (!isDragging) return; // Solo actualiza la posición del icono si se está arrastrando el thumb

    if (slider.id !== "slider") changeMap(slider); // En caso de no ser slider principal cambiamos los mapas

    thumb.style.left = `${thumbPosition(slider)}%`; // Actualizacion del thumb
  });

  slider.addEventListener("pointerdown", (e) => {
    const rect = slider.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const thumbX = (thumbPosition(slider) / 100) * rect.width;

    // Si el raton no esta sobre el thumb del slider pasa el evento al mapa para que pueda moverlo
    if (Math.abs(clickX - thumbX) > 20) {
      e.preventDefault();
      if (moveMap) viewport.dispatchEvent(new PointerEvent("pointerdown", e));
    } else {
      slider.style.zIndex = 5;
      isDragging = true;
    }
  });

  slider.addEventListener("pointermove", (e) => {
    if (!isDragging) viewport.dispatchEvent(new PointerEvent("pointermove", e));
  });

  slider.addEventListener("pointerup", (e) => {
    if (!isDragging) viewport.dispatchEvent(new PointerEvent("pointerup", e));
    isDragging = false;
    slider.style.zIndex = 3;
  });

  //// Permitir hacer zoom con el raton aun encima del slider
  slider.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      viewport.dispatchEvent(new WheelEvent("wheel", e));
    },
    { passive: false },
  );
}

document.getElementById("map-list-container").addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    viewport.dispatchEvent(new WheelEvent("wheel", e));
  },
  { passive: false },
);

function setLayerLabels() {
  const map = document.getElementById("map-list");
  baseSelector.setAttribute("max", mapList.length - 1);
  layerSelector.setAttribute("max", mapList.length - 1);
  layerSelector.value = mapList.length - 1;
  for (let layer of mapList) {
    map.innerHTML += `<span>${layer.label}</span>`;
  }
}

function initSliders() {
  setLayerLabels();
  sliderFunctionality(slider, thumbIcon, true);
  sliderFunctionality(baseSelector, thumbBase);
  sliderFunctionality(layerSelector, thumbLayer);
}

initSliders();

function changeMap(slider) {
  const layer = mapList[slider.value];
  tilesLoading = 0;
  const source = new TileWMS({
    url: layer.urlService,
    params: { LAYERS: layer.layerId, TILED: true },
  });

  if (slider.id === "base-selector") {
    map.getLayers().remove(base);
    base = new Tile({ source });
    map.getLayers().insertAt(0, base);
  } else {
    visor.un("prerender", onPrerender);
    visor.un("postrender", onPostrender);
    map.getLayers().remove(visor);
    visor = new Tile({ source });
    map.getLayers().insertAt(1, visor);
    assingLayerFuncionality(visor);
  }
  loadingListeners(source);
}

//// Mostrar y ocultar slider de mapas
const dropdown = document.getElementById("map-list-dropdown");
dropdown.onclick = function () {
  dropdown.classList.toggle("fa-angle-down");
  dropdown.classList.toggle("fa-angle-up");
  dropdown.classList.toggle("dropdown-active");
  const mapContainer = document.getElementById("map-list-container");
  mapContainer.classList.toggle("hidden");
};

// Funcionalidad controles OpenLayers de mapa
//// Meto los botones de op en un contenedor custom para mas facilidad con css
const olBtnContainer = document.getElementById("ol-control-container");
const olControlBtn = document.querySelectorAll(".ol-control");
const captionBtnDiv = document.getElementById("caption-container");

for (let btn of olControlBtn) {
  olBtnContainer.insertBefore(btn, captionBtnDiv);
}

//// Cambiar icono del zoom-extent por una casa
document.querySelector(".ol-zoom-extent button").innerHTML =
  `<svg class="ol-zoom-extent-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M277.8 8.6c-12.3-11.4-31.3-11.4-43.5 0l-224 208c-9.6 9-12.8 22.9-8 35.1S18.8 272 32 272l16 0 0 176c0 35.3 28.7 64 64 64l288 0c35.3 0 64-28.7 64-64l0-176 16 0c13.2 0 25-8.1 29.8-20.3s1.6-26.2-8-35.1l-224-208zM240 320l32 0c26.5 0 48 21.5 48 48l0 96-128 0 0-96c0-26.5 21.5-48 48-48z"/></svg>`;

function changeActiveBackground(btn) {
  btn.classList.toggle("ol-btn-active");
  btn.style.background = btn.classList.contains("ol-btn-active")
    ? "var(--c-control-icon-active) !important"
    : "";
}
const fullScreen = document.querySelector(".ol-full-screen > button");
fullScreen.addEventListener("click", () => changeActiveBackground(fullScreen));

//// Controles de la leyenda
const captionBtn = document.getElementById("caption-btn");
const caption = document.getElementById("caption");

captionBtn.addEventListener("click", () => {
  changeActiveBackground(captionBtn);
  caption.classList.toggle("active");
  captionBtn.classList = caption.classList.contains("active")
    ? "fa-chisel fa-regular fa-xmark"
    : "fa-regular fa-square-info";
  olBtnContainer.classList.toggle("active");
});

// Funcionalidad popup
//// Cerrar el popup al hacer click
let stopPopup = false;

closer.onclick = function (e) {
  stopPopup = true;
  e.stopPropagation();
  overlay.setPosition(undefined);
  closer.blur();
  setTimeout(() => (stopPopup = false), 300);
  return false;
};

map.on("singleclick", async function (e) {
  if (stopPopup) return; // Ignora el click si vino de cerrar el popup

  const [lon, lat] = toLonLat(e.coordinate);
  content.innerHTML = "<code>Cargando...</code>";
  overlay.setPosition(e.coordinate);

  // setTimeout(() => overlay.setPosition(e.coordinate), 1000);

  const response = await fetch(
    `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`,
  );
  const data = await response.json();
  const elevation = data.elevation[0];
  content.innerHTML = `<code>Lon: ${lon.toFixed(4)} Lat: ${lat.toFixed(4)} Alt: ${elevation}m</code>`;
  overlay.setPosition(e.coordinate);

  const info = document.getElementById("popup-info");
  info.innerHTML = "";
  const viewResolution = view.getResolution();

  const inUseLayers = map.getLayers().getArray().slice(2);
  for (let layer of inUseLayers) {
    const source = layer.getSource();
    if (!(source instanceof TileWMS)) continue;

    const url = source.getFeatureInfoUrl(
      e.coordinate,
      viewResolution,
      "EPSG:3857",
      { INFO_FORMAT: "text/html" },
    );

    if (url) {
      fetch(url)
        .then((response) => response.text())
        .then((html) => {
          info.innerHTML = html;
          try {
            // Coje el ultimo titulo añadido
            const title = info.children[info.children.length - 2];
            if (!title) return;
            const text = title.textContent.split(":")[1];
            title.textContent = text.slice(2, text.length - 1);

            overlay.setPosition(e.coordinate);
          } catch (TypeError) {
            // Escondemos el error, porque no es importante.
            // Ocurre cuando clicamos en un lugar sin informacion en un layer.
          }
        });
    }
  }
});

map.on("pointermove", function (e) {
  if (e.dragging) return;
  const inUseLayers = map.getLayers().getArray().slice(2);
  const hit = inUseLayers.some((layer) => {
    const data = layer.getData(e.pixel);
    return data && data[3] > 0;
  });
  map.getTargetElement().style.cursor = hit ? "pointer" : "";
});

// Funcionalidad capas (group-layer)
const glContainer = document.getElementById("group-layer-container");
const glBtn = document.getElementById("group-layer-btn");

glBtn.addEventListener("click", () => {
  glBtn.classList.toggle("fa-layer-group");
  glBtn.classList.toggle("fa-arrow-right-to-line");
  glBtn.classList.toggle("gl-inactive");
  glContainer.classList.toggle("gl-inactive");
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const fragment = document.createDocumentFragment();

for (let layer of layerList) {
  const li = document.createElement("li");
  li.id = layer.id;
  li.className = "group-layer";
  li.innerHTML = `${capitalize(layer.label)}<i class="fa-light fa-square"></i>`;
  fragment.appendChild(li);
}
glContainer.appendChild(fragment);

glContainer.addEventListener("click", (e) => {
  const li = e.target.closest(".group-layer"); // Li más cercano al click
  if (!li) return;

  if (!li.children[0].classList.contains("fa-square-check")) {
    document.querySelectorAll(".group-layer").forEach((lay) => {
      lay.children[0].classList = "fa-light fa-square";
    });
    changeLayer(li);
  } else {
    clearLayers();
    li.children[0].classList = "fa-light fa-square";
  }
});

function changeLayer(layer) {
  const found = layerList.find((l) => l.id === layer.id);
  if (found) setLayer(found.layers);
  layer.children[0].classList = "fa-light fa-square-check";
}

function setLayer(layers) {
  if (map.getLayers().getLength() > 2) clearLayers();

  for (let layer of layers) {
    const source = new TileWMS({
      url: layer.urlService,
      params: { LAYERS: layer.layerId, TILED: true },
      serverType: layer.server,
      crossOrigin: layer.crossOrigin || "anonymous",
    });
    loadingListeners(source);
    map.getLayers().push(new Tile({ source }));
  }
}

//// Quita todas las capas menos las dos primeras, que son la base y el visor
function clearLayers() {
  for (let i = map.getLayers().getLength() - 1; i > 1; i--) {
    map.getLayers().pop();
  }
}

// Mostrar mensaje en caso de que algo vaya mal
function showError() {
  const error = document.getElementById("error");
  // TODO
}
