import { Map, View } from "ol";
import { Tile } from "ol/layer";
import { getRenderPixel } from "ol/render";
import { OSM, TileWMS, XYZ } from "ol/source";

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
  source: source,
});

const map = new Map({
  target: "map",
  view: new View({
    zoom: 12,
    center: [475000, 4850000],
  }),
  layers: [base, visor],
});

const mapsList = document.getElementById("maps-tree");
mapsList.addEventListener("click", (e) => {
  if (!e.target.getAttribute("source")) return;

  visor.un("prerender", onPrerender);
  visor.un("postrender", onPostrender);
  map.removeLayer(visor);

  switch (e.target.getAttribute("source")) {
    case "maptiler": {
      source = new XYZ({
        url: `https://api.maptiler.com/maps/${e.target.getAttribute("map-id")}/{z}/{x}/{y}.png?key=V1UJJmQhAy6fVv7O5N08`,
        maxZoom: 19,
        tileSize: 512,
      });
      break;
    }
    case "silme": {
      source = new TileWMS({
        url: "//ide.cime.es/geoserver2/base_referencia/wms/",
        params: { LAYERS: e.target.getAttribute("map-id"), TILED: true },
      });
      break;
    }
    case "osm": {
      source = new OSM();
      break;
    }
    default:
      return; // En caso de no haber un source valido no añade ninguna capa
  }

  visor = new Tile({
    source: source,
  });

  assingLayerFuncionality(visor);
  map.addLayer(visor);
});

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

/* transform: translateY(-50%); */
console.log(
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M288 128C288 110.3 273.7 96 256 96C238.3 96 224 110.3 224 128L224 512C224 529.7 238.3 544 256 544C273.7 544 288 529.7 288 512L288 128zM416 128C416 110.3 401.7 96 384 96C366.3 96 352 110.3 352 128L352 512C352 529.7 366.3 544 384 544C401.7 544 416 529.7 416 512L416 128z"/></svg>
`),
);

const thumbIcon = document.getElementById("thumb-icon");
slider.value = 50; // Valor inicial del slider
thumbIcon.style.left = `${slider.value}%`; // Posición inicial del icono

slider.addEventListener("input", (e) => {
  console.log(slider.value);
  const min = Number(slider.min) || 0;
  const max = Number(slider.max) || 100;
  const percentage = (Number(slider.value) - min) / (max - min);
  thumbIcon.style.left = `${percentage * 100}%`;
});
