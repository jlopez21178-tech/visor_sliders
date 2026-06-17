import { getLegend } from "./layers";

// Meto los botones de op en un contenedor custom para mas facilidad con css
const olBtnContainer = document.getElementById("ol-control-container");
const olControlBtn = document.querySelectorAll(".ol-control");
const legendBtnDiv = document.getElementById("legend-btn-container");

for (let btn of olControlBtn) {
  olBtnContainer.insertBefore(btn, legendBtnDiv);
}

// Cambiar icono del zoom-extent por una casa
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

// Controles de la leyenda
const legendBtn = document.getElementById("legend-btn");
const legendContainer = document.getElementById("legend-container");

legendBtn.addEventListener("click", () => {
  legendContainer.classList.toggle("active");
  // Cambiar el icono
  legendBtn.classList = legendContainer.classList.contains("active")
    ? "fa-chisel fa-regular fa-xmark active"
    : "fa-regular fa-square-info";
  // Cambiar el background
  legendBtn.style.background = legendBtn.classList.contains("active")
    ? "var(--c-control-icon-active) !important"
    : "";
  olBtnContainer.classList.toggle("active");
  getLegend();
});

// Funcionalidad rueda de carga
const loader = document.getElementById("loader");
let tilesLoading = 0;
export function setTilesLoading(x) {
  tilesLoading = x;
}

export function loadingListeners(source) {
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

function showError() {
  // TODO
}
