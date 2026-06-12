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
import layerList from "./layers_list.json";
layerList.sort((a, b) => Number(a.label) - Number(b.label));

const mousePosition = new MousePosition({
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

let base = new Tile({
  source: new TileWMS({
    url: layerList[0].urlService,
    params: { LAYERS: layerList[0].layerId, TILED: true },
  }),
});

let visor = new Tile({
  source: new TileWMS({
    url: layerList[layerList.length - 1].urlService,
    params: { LAYERS: layerList[layerList.length - 1].layerId, TILED: true },
  }),
});

const container = document.getElementById("popup");
const content = document.getElementById("popup-content");
const closer = document.getElementById("popup-closer");

const overlay = new Overlay({
  element: container,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
  // Permite que el raton haga zoom aun encima del popup
  stopEvent: false,
});

const map = new Map({
  target: "map",
  controls: defaultControls().extend([
    new ScaleLine(),
    new FullScreen(),
    mousePosition,
    zoomToExtent,
  ]),
  view: new View({
    zoom: 12,
    center: [475000, 4850000],
  }),
  layers: new Collection([base, visor]),
  overlays: [overlay],
});

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
  const min = slider.min !== "" ? Number(slider.min) : 0;
  const max = slider.max !== "" ? Number(slider.max) : 100;

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

function funcionalidadSlider(slider, thumb, moveMap = false) {
  let isDragging = false;
  thumb.style.left = `${thumbPosition(slider)}%`; // Posición inicial del icono

  slider.addEventListener("input", (e) => {
    if (!isDragging) return; // Solo actualiza la posición del icono si se está arrastrando el thumb

    if (slider.id !== "slider") changeLayer(slider); // En caso de no ser slider principal cambiamos los mapas

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
  const mapList = document.getElementById("map-list");
  console.log(layerList.length);
  baseSelector.setAttribute("max", layerList.length - 1);
  layerSelector.setAttribute("max", layerList.length - 1);
  layerSelector.setAttribute("value", layerList.length - 1);
  for (let layer of layerList) {
    mapList.innerHTML += `<span>${layer.label}</span>`;
  }
}

function initSliders() {
  setLayerLabels();
  funcionalidadSlider(slider, thumbIcon, true);
  funcionalidadSlider(baseSelector, thumbBase);
  funcionalidadSlider(layerSelector, thumbLayer);
}

initSliders();

function changeLayer(slider) {
  const layer = layerList[slider.value];
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
    map.getLayers().pop();
    visor = new Tile({ source });
    map.getLayers().push(visor);
    assingLayerFuncionality(visor);
  }
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
//// Cambiar icono del zoom-extent por una casa
document.querySelector(".ol-zoom-extent button").innerHTML =
  `<svg class="ol-zoom-extent-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M277.8 8.6c-12.3-11.4-31.3-11.4-43.5 0l-224 208c-9.6 9-12.8 22.9-8 35.1S18.8 272 32 272l16 0 0 176c0 35.3 28.7 64 64 64l288 0c35.3 0 64-28.7 64-64l0-176 16 0c13.2 0 25-8.1 29.8-20.3s1.6-26.2-8-35.1l-224-208zM240 320l32 0c26.5 0 48 21.5 48 48l0 96-128 0 0-96c0-26.5 21.5-48 48-48z"/></svg>`;

const fullScreen = document.querySelector(".ol-full-screen > button");

fullScreen.addEventListener("click", () => {
  if (fullScreen.hasAttribute("id")) {
    fullScreen.removeAttribute("id");
  } else {
    fullScreen.id = "ol-full-screen-active";
  }
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

map.on("singleclick", function (e) {
  if (stopPopup) return; // Ignora el click si vino de cerrar el popup

  const coordinate = e.coordinate;
  const hdms = toStringHDMS(toLonLat(coordinate));

  content.innerHTML = `<code>${hdms}</code>`;
  overlay.setPosition(coordinate);
});
