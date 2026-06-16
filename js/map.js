import { Collection, Map, Overlay, View } from "ol";
import { Tile } from "ol/layer";
import { TileWMS } from "ol/source";
import {
  defaults as defaultControls,
  ScaleLine,
  FullScreen,
  MousePosition,
  ZoomToExtent,
  Zoom,
} from "ol/control";
import { toLonLat, transformExtent } from "ol/proj";
import { toStringHDMS } from "ol/coordinate";
import mapList from "../map-list.json";
mapList.sort((a, b) => Number(a.label) - Number(b.label));
export const mapsList = mapList;

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

export const container = document.getElementById("popup");
export const overlay = new Overlay({
  element: container,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

export const view = new View({
  zoom: 12,
  center: [475000, 4850000],
  minZoom: 11,
});

export let base = new Tile({
  source: new TileWMS({
    url: mapList[0].urlService,
    params: { LAYERS: mapList[0].layerId, TILED: true },
  }),
});

export function setBase(layer) {
  base = layer;
}

export let visor = new Tile({
  source: new TileWMS({
    url: mapList[mapList.length - 1].urlService,
    params: { LAYERS: mapList[mapList.length - 1].layerId, TILED: true },
  }),
});

export function setVisor(layer) {
  visor = layer;
}

export const map = new Map({
  target: "map",
  view,
  layers: new Collection([base, visor]),
  overlays: [overlay],
  controls: defaultCtrl.extend([
    new ScaleLine(),
    new FullScreen(),
    mousePosition,
    zoomToExtent,
  ]),
});
