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
