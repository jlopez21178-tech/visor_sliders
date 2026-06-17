import { container, map, view, overlay } from "./map.js";
import { toLonLat } from "ol/proj";
import { TileWMS } from "ol/source";

//// Cerrar el popup al hacer click
const closer = document.getElementById("popup-closer");
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

  const content = document.getElementById("popup-content");
  const [lon, lat] = toLonLat(e.coordinate);
  content.innerHTML = "<code>Cargando...</code>";
  overlay.setPosition(e.coordinate);

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
          // Coje el ultimo titulo añadido
          const title = info.children[info.children.length - 2];
          if (!title) return;
          const text = title.textContent.split(":")[1];
          if (!text) return;
          title.textContent = text.slice(2, text.length - 1);

          overlay.setPosition(e.coordinate);
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
