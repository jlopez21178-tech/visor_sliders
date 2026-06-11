import "ol/ol.css";
import { Map, Overlay, View } from "ol";
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
    url: "//ide.cime.es/geoserver2/base_referencia/wms/",
    params: { LAYERS: "base_referencia:base_referencia", TILED: true },
  }),
});

let source = new XYZ({
  url: "https://api.maptiler.com/maps/backdrop-v4/{z}/{x}/{y}.png?key=V1UJJmQhAy6fVv7O5N08",
  maxZoom: 19,
  tileSize: 512,
});

let visor = new Tile({
  source,
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
  layers: [base, visor],
  overlays: [overlay],
});

// const mapsList = document.getElementById("maps-tree");
// mapsList.addEventListener("click", (e) => {
//   if (!e.target.getAttribute("source")) return;

//   visor.un("prerender", onPrerender);
//   visor.un("postrender", onPostrender);
//   map.removeLayer(visor);

//   switch (e.target.getAttribute("source")) {
//     case "maptiler": {
//       source = new XYZ({
//         url: `https://api.maptiler.com/maps/${e.target.getAttribute("map-id")}/{z}/{x}/{y}.png?key=V1UJJmQhAy6fVv7O5N08`,
//         maxZoom: 19,
//         tileSize: 512,
//       });
//       break;
//     }
//     case "silme": {
//       source = new TileWMS({
//         url: "//ide.cime.es/geoserver2/base_referencia/wms/",
//         params: { LAYERS: e.target.getAttribute("map-id"), TILED: true },
//       });
//       break;
//     }
//     case "osm": {
//       source = new OSM();
//       break;
//     }
//     default:
//       return; // En caso de no haber un source valido no añade ninguna capa
//   }

//   visor = new Tile({
//     source: source,
//   });

//   assingLayerFuncionality(visor);
//   map.addLayer(visor);
// });

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

slider.value = 50; // Valor inicial del slider

// function thumbPosition(slider) {
//   const min = slider.min !== "" ? slider.min : 0;
//   const max = slider.max !== "" ? slider.max : 100;
//   return ((Number(slider.value) - min) / (max - min)) * 100;
// }

function thumbPosition(slider, thumbSize = 20) {
  const min = slider.min !== "" ? Number(slider.min) : 0;
  const max = slider.max !== "" ? Number(slider.max) : 100;

  if (slider.id === "slider")
    return ((Number(slider.value) - min) / (max - min)) * 100;

  const ratio = (Number(slider.value) - min) / (max - min);
  const rect = slider.getBoundingClientRect();

  if (rect.width === 0) return ratio * 100; // fallback si aún no está pintado

  const trackWidth = rect.width - thumbSize;
  const offsetPx = thumbSize / 2 + ratio * trackWidth;
  return (offsetPx / rect.width) * 100;
}

function incializarSlider(slider, thumb, moveMap = false) {
  let isDragging = false;
  thumb.style.left = `${thumbPosition(slider)}%`; // Posición inicial del icono

  slider.addEventListener("input", (e) => {
    if (!isDragging) return; // Solo actualiza la posición del icono si se está arrastrando el thumb
    thumb.style.left = `${thumbPosition(slider)}%`;
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
      isDragging = true;
    }
  });

  slider.addEventListener("pointermove", (e) => {
    if (!isDragging) viewport.dispatchEvent(new PointerEvent("pointermove", e));
  });

  slider.addEventListener("pointerup", (e) => {
    if (!isDragging) viewport.dispatchEvent(new PointerEvent("pointerup", e));
    isDragging = false;
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

incializarSlider(slider, thumbIcon, true);
incializarSlider(baseSelector, thumbBase);
incializarSlider(layerSelector, thumbLayer);
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
closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

map.on("singleclick", function (e) {
  const coordinate = e.coordinate;
  const hdms = toStringHDMS(toLonLat(coordinate));

  content.innerHTML = `<code>${hdms}</code>`;
  overlay.setPosition(coordinate);
});
