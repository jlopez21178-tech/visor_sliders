import { map } from "./map.js";
import layerList from "../layer-list.json";
layerList.sort((a, b) => a.label.localeCompare(b.label));
import { mapsList } from "./map";
import { changeMap } from "./layers.js";

// Funcionalidad para el poisicionamiento del icono del slider
const baseSelector = document.getElementById("base-selector");
const layerSelector = document.getElementById("layer-selector");
const thumbBase = document.getElementById("thumb-base");
const thumbLayer = document.getElementById("thumb-layer");
const thumbIcon = document.getElementById("thumb-icon");
const viewport = map.getViewport();
export const slider = document.getElementById("slider");
slider.addEventListener("input", () => map.render());

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

function setMapLabels() {
  const map = document.getElementById("map-list");
  baseSelector.setAttribute("max", mapsList.length - 1);
  layerSelector.setAttribute("max", mapsList.length - 1);
  layerSelector.value = mapsList.length - 1;
  for (let layer of mapsList) {
    map.innerHTML += `<span>${layer.label}</span>`;
  }
}

export function initSliders() {
  setMapLabels();
  sliderFunctionality(slider, thumbIcon, true);
  sliderFunctionality(baseSelector, thumbBase);
  sliderFunctionality(layerSelector, thumbLayer);
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
