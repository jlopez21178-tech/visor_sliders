import { map, base, visor, setBase, setVisor } from "./map.js";
import { slider } from "./sliders.js";
import { getRenderPixel } from "ol/render.js";
import { Tile } from "ol/layer";
import { TileWMS } from "ol/source.js";
import { loadingListeners, setTilesLoading } from "./controls.js";
import { mapsList } from "./map.js";
import layerList from "../layer-list.json";
layerList.sort((a, b) => a.label.localeCompare(b.label));

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

export function assingLayerFuncionality(layer) {
  layer.on("prerender", onPrerender);
  layer.on("postrender", onPostrender);
}

slider.addEventListener("input", () => map.render());

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

export function changeMap(slider) {
  const layer = mapsList[slider.value];
  setTilesLoading(0);
  const source = new TileWMS({
    url: layer.urlService,
    params: { LAYERS: layer.layerId, TILED: true },
  });

  if (slider.id === "base-selector") {
    map.getLayers().remove(base);
    setBase(new Tile({ source }));
    map.getLayers().insertAt(0, base);
  } else {
    visor.un("prerender", onPrerender);
    visor.un("postrender", onPostrender);
    map.getLayers().remove(visor);
    setVisor(new Tile({ source }));
    map.getLayers().insertAt(1, visor);
    assingLayerFuncionality(visor);
  }
  loadingListeners(source);
}
