// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
import { pickerDefine } from "./card-picker.js";
import { VERSION } from "./core.js";
import { InternetBoxCard } from "./full-card.js";
import { InternetBoxMiniCard } from "./mini-card.js";
import { InternetBoxCardEditor, InternetBoxMiniCardEditor } from "./visual-editors.js";

export const define = (name, cls) => {
  if (!customElements.get(name)) pickerDefine(name, cls);
};
define("internet-box-card", InternetBoxCard);
define("internet-box-mini-card", InternetBoxMiniCard);
// Former types, kept so that existing dashboards keep working: same cards under another name. A custom element class
// can only be defined once, hence the subclasses.
for (const [name, base] of [
  ["freebox-card", InternetBoxCard],
  ["freebox-mini-card", InternetBoxMiniCard],
])
  define(name, class extends base {});
define("internet-box-card-editor", InternetBoxCardEditor);
define("internet-box-mini-card-editor", InternetBoxMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "internet-box-card",
    name: "Internet Box Card",
    description: "Monitor an internet box (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink): download / upload, temperatures, fans, storage, Wi-Fi, calls and connected devices.",
  },
  {
    type: "internet-box-mini-card",
    name: "Internet Box Mini Card",
    description: "Compact internet box overview (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink): download / upload, connection, temperature, Wi-Fi and uptime, with a button to show the full card.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-internet-box-card" });
}

console.info(
  `%c INTERNET-BOX-CARD %c v${VERSION} `,
  "color: white; background: #455a64; font-weight: 700;",
  "color: #455a64; background: white; font-weight: 700;"
);
