// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------
import { MODELS } from "./core.js";
import { THRESHOLDS, normalizeConfig, t } from "./helpers.js";
import { EDITOR_ENTITIES, SPEEDTEST_KEYS, cleanEntities, detectModel, discover, listBoxes } from "./entity-discovery.js";
import { STRINGS } from "./i18n/strings.js";

export class InternetBoxEditorBase extends HTMLElement {
  static get toggles() {
    return [];
  }

  setConfig(config) {
    this._config = normalizeConfig(config);
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const boxOptions = this._hass ? listBoxes(this._hass) : [];
    const tr = (k) => t(this._hass, this._config, k);
    const box = this._hass ? discover(this._hass, this._config.box) : undefined;
    const detected = box ? detectModel(box) : undefined;
    const autoModel = detected ? `${tr("model_auto")} (${detected.name})` : tr("model_auto");
    return [
      {
        name: "box",
        selector: { select: { mode: "dropdown", custom_value: true, options: boxOptions } },
      },
      { name: "title", selector: { text: {} } },
      {
        name: "model",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "", label: autoModel },
              ...(box?.operator?.models ?? MODELS).map((m) => ({ value: m.id, label: m.name })),
            ],
          },
        },
      },
      { name: "admin_url", selector: { text: { type: "url" } } },
      {
        type: "grid",
        name: "",
        schema: [
          { name: "show_title", selector: { boolean: {} } },
          { name: "show_subtitle", selector: { boolean: {} } },
          { name: "show_image", selector: { boolean: {} } },
          { name: "show_logo", selector: { boolean: {} } },
          { name: "illustration", selector: { boolean: {} } },
          ...this.constructor.toggles.map((name) => ({ name, selector: { boolean: {} } })),
        ],
      },
      // Day / night picture of the illustrated header: automatic (Home Assistant's theme) unless forced.
      {
        name: "illustration_theme",
        selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((v) => ({ value: v, label: tr(`theme_${v}`) })) } },
      },
      // Warning / critical thresholds, shown at their default values.
      {
        type: "grid",
        name: "",
        schema: Object.keys(THRESHOLDS).map((name) => ({
          name,
          selector: { number: { min: 0, max: name.startsWith("temp") ? 150 : 100, step: 1, mode: "box", unit_of_measurement: name.startsWith("temp") ? "°C" : "%" } },
        })),
      },
      // Sensors of the user's choice: the box's rates, and another speed test than Speedtest.net (LibreSpeed…). Saved under
      // `entities`, as the YAML option (which takes the other box values too).
      {
        type: "expandable",
        name: "entities",
        title: tr("entities"),
        schema: [
          ...["rate_down", "rate_up"].map((name) => ({ name, selector: { entity: { domain: "sensor" } } })),
          {
            type: "expandable",
            name: "speedtest",
            title: tr("speedtest"),
            schema: [
              ...SPEEDTEST_KEYS.map((name) => ({ name, selector: { entity: { domain: "sensor" } } })),
              { name: "run", selector: { entity: { domain: ["button", "input_button", "script", "automation"] } } },
            ],
          },
        ],
      },
      {
        name: "rate_unit",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "bytes", label: tr("unit_bytes") },
              { value: "bits", label: tr("unit_bits") },
            ],
          },
        },
      },
      {
        name: "language",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "", label: tr("lang_auto") },
              { value: "en", label: "English" },
              { value: "fr", label: "Français" },
              { value: "de", label: "Deutsch" },
              { value: "es", label: "Español" },
              { value: "sr", label: "Српски" },
              { value: "sr-Latn", label: "Srpski (latinica)" },
              { value: "it", label: "Italiano" },
              { value: "nl", label: "Nederlands" },
              { value: "pt", label: "Português (Portugal)" },
              { value: "pl", label: "Polski" },
              { value: "ro", label: "Română" },
              { value: "da", label: "Dansk" },
              { value: "sv", label: "Svenska" },
              { value: "bg", label: "Български" },
              { value: "ru", label: "Русский" },
              { value: "uk", label: "Українська" },
              { value: "hu", label: "Magyar" },
              { value: "sk", label: "Slovenčina" },
              { value: "cs", label: "Čeština" },
              { value: "sl", label: "Slovenščina" },
              { value: "lv", label: "Latviešu" },
              { value: "el", label: "Ελληνικά" },
            ],
          },
        },
      },
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      // The pickers of `entities` share their names with no other field: their own labels.
      this._form.computeLabel = (s) => t(this._hass, this._config, EDITOR_ENTITIES.has(s.name) ? `ent_${s.name}` : s.name);
      this._form.computeHelper = (s) => (STRINGS.en[`${s.name}_helper`] ? t(this._hass, this._config, `${s.name}_helper`) : undefined);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value, entities: cleanEntities(ev.detail.value.entities) };
        // Another box of another operator: a model picked for the former one is not among the new operator's
        // models (and would be silently ignored), so it is cleared.
        if (config.box !== this._config.box && config.model) {
          const models = discover(this._hass, config.box).operator?.models ?? MODELS;
          if (!models.some((m) => m.id === config.model)) delete config.model;
        }
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values and options left at their default.
          if (
            v === "" ||
            v === undefined ||
            v === null ||
            ((k.startsWith("show_") || k === "zoom" || k === "illustration") && v === true) ||
            (k === "illustration_theme" && v === "auto") ||
            (k === "rate_unit" && v === "bytes") ||
            THRESHOLDS[k] === v
          )
            delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    // No box set: the card shows the first one found, so the editor selects it and writes it to the config.
    if (!this._config.box) {
      const first = listBoxes(this._hass)[0]?.value;
      if (first) {
        this._config = { ...this._config, box: first };
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
      }
    }
    const data = { rate_unit: "bytes", model: "", illustration_theme: "auto", ...THRESHOLDS, ...this._config };
    for (const name of ["show_title", "show_subtitle", "show_image", "show_logo", "illustration", ...this.constructor.toggles]) if (data[name] === undefined) data[name] = true;
    this._form.hass = this._hass;
    // A new data object re-renders the whole form: handed over only when the config changed, not on every state change.
    if (this._dataFor !== this._config) {
      this._dataFor = this._config;
      this._form.data = data;
    }
    // The schema is rebuilt on every hass update (every state change) but only handed to the form when its
    // options (boxes, models, detected model, language) changed, so ha-form does not re-render for nothing.
    const schema = this._schema();
    const key = JSON.stringify(schema);
    if (key !== this._schemaKey) {
      this._schemaKey = key;
      this._form.schema = schema;
    }
  }
}

export class InternetBoxCardEditor extends InternetBoxEditorBase {
  static get toggles() {
    return ["show_network", "show_history", "show_speedtest", "show_system", "show_storage", "show_services"];
  }
}

export class InternetBoxMiniCardEditor extends InternetBoxEditorBase {
  static get toggles() {
    // The detail view is the full card: its sections' options too (README: "both").
    return ["show_network", "show_history", "show_speedtest", "show_system", "show_storage", "show_services", "zoom"];
  }
}
