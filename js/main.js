import "ol/ol.css";
import { map, base, visor } from "./map.js";
import { getRenderPixel } from "ol/render";
import { assingLayerFuncionality } from "./layers.js";
import { initSliders } from "./sliders.js";
import { loadingListeners } from "./controls.js";
import "./popup.js";

loadingListeners(base.getSource());
loadingListeners(visor.getSource());

assingLayerFuncionality(visor);

initSliders();

// Añadir los scripts al html
const jsFiles = import.meta.glob("./src/\*.js", { eager: true });
// const body = document.querySelector("body");
// jsFiles.array.forEach((js) => {
//   const script = document.createElement("script");
//   script.type = "module";
//   script.src = js;
//   body.appendChild(script);
// });
