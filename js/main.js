import "ol/ol.css";
import { base, visor } from "./map.js";
import { assingLayerFuncionality } from "./layers.js";
import { initSliders } from "./sliders.js";
import { loadingListeners } from "./controls.js";
import "./popup.js";

loadingListeners(base.getSource());
loadingListeners(visor.getSource());

assingLayerFuncionality(visor);

initSliders();
