import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { discover, listBoxes, parseDate, uptimeSec, InternetBoxCard, sameSig, lineOf } = load("internet-box-card.js", [
  "lineOf",
  "discover",
  "listBoxes",
  "parseDate",
  "uptimeSec",
  "InternetBoxCard",
  "sameSig",
]);

const ENTRY = "entry";
const devices = {
  router: { id: "router", name: "Freebox v9 (r1)", model_id: "fbxgw9-r1", config_entries: [ENTRY] },
  phone: { id: "phone", name: "phone", config_entries: ["other_entry"] },
  nas: { id: "nas", name: "nas", config_entries: [ENTRY] },
};
const entities = {
  "sensor.down": { entity_id: "sensor.down", platform: "freebox", device_id: "router", translation_key: "rate_down" },
  "device_tracker.router": { entity_id: "device_tracker.router", platform: "freebox", device_id: "router" },
  "device_tracker.nas": { entity_id: "device_tracker.nas", platform: "freebox", device_id: "nas" },
  // Most client trackers have no device in Home Assistant.
  "device_tracker.laptop": { entity_id: "device_tracker.laptop", platform: "freebox", device_id: null },
  "device_tracker.tablet": { entity_id: "device_tracker.tablet", platform: "freebox", device_id: null },
};
const st = (state, attributes = {}) => ({ state, attributes });
const baseStates = () => {
  const s = {
    "sensor.down": st("100", { unit_of_measurement: "kB/s" }),
    "device_tracker.router": st("home", { uptime: "2026-10-24T08:00:00" }),
    "device_tracker.nas": st("home"),
    "device_tracker.laptop": st("home"),
    "device_tracker.tablet": st("not_home"),
    "light.kitchen": st("off"),
  };
  for (const [id, v] of Object.entries(s)) v.entity_id = id;
  return s;
};

test("client trackers without a device are counted with a single Freebox", () => {
  const box = discover({ states: baseStates(), entities, devices }, undefined);
  assert.deepEqual([...box.trackers].sort(), ["device_tracker.laptop", "device_tracker.nas", "device_tracker.tablet"]);
  assert.equal(box.scalars.router, "device_tracker.router");
});

test("client trackers without a device are not assigned when there are two Freeboxes", () => {
  const devs = { ...devices, router2: { id: "router2", name: "Freebox 2", config_entries: ["entry2"] } };
  const ents = {
    ...entities,
    "sensor.down2": { entity_id: "sensor.down2", platform: "freebox", device_id: "router2", translation_key: "rate_down" },
  };
  const states = { ...baseStates(), "sensor.down2": { entity_id: "sensor.down2", ...st("1") } };
  const box = discover({ states, entities: ents, devices: devs }, "router");
  assert.deepEqual([...box.trackers], ["device_tracker.nas"]);
});

test("discovery is cached across state changes and refreshed on registry changes", () => {
  const states = baseStates();
  const a = discover({ states, entities, devices }, "router");
  const b = discover({ states: { ...states, "light.kitchen": st("on") }, entities, devices }, "router");
  assert.equal(a, b);
  const c = discover({ states, entities: { ...entities }, devices }, "router");
  assert.notEqual(a, c);
});

test("a naive uptime date is read in the Home Assistant time zone", () => {
  // 08:00 in Paris in October (UTC+2) is 06:00 UTC.
  assert.equal(parseDate("2026-10-24T08:00:00", "Europe/Paris"), Date.parse("2026-10-24T06:00:00Z"));
  assert.equal(parseDate("2026-01-15T08:00:00", "Europe/Paris"), Date.parse("2026-01-15T07:00:00Z"));
  assert.equal(parseDate("2026-10-24T08:00:00", "UTC"), Date.parse("2026-10-24T08:00:00Z"));
  assert.equal(parseDate("2026-10-24 08:00:00", "America/New_York"), Date.parse("2026-10-24T12:00:00Z"));
});

test("a date with an offset is parsed as is", () => {
  assert.equal(parseDate("2026-10-24T08:00:00+00:00", "Europe/Paris"), Date.parse("2026-10-24T08:00:00Z"));
});

test("uptimeSec uses the time zone", () => {
  const boot = new Date(Date.now() - 3600e3);
  const pad = (n) => String(n).padStart(2, "0");
  const utcNaive = `${boot.getUTCFullYear()}-${pad(boot.getUTCMonth() + 1)}-${pad(boot.getUTCDate())}T${pad(boot.getUTCHours())}:${pad(boot.getUTCMinutes())}:${pad(boot.getUTCSeconds())}`;
  const sec = uptimeSec({ attributes: { uptime: utcNaive } }, "UTC");
  assert.ok(Math.abs(sec - 3600) < 5, `got ${sec}`);
});

test("an unrelated state change keeps the render signature", () => {
  const states = baseStates();
  const make = (s) => {
    const el = new InternetBoxCard();
    el._config = {};
    el._hass = { states: s, entities, devices, language: "en", config: { time_zone: "UTC" } };
    return el;
  };
  const before = make(states)._signature();
  assert.ok(sameSig(before, make({ ...states, "light.kitchen": st("on") })._signature()));
  assert.ok(!sameSig(before, make({ ...states, "sensor.down": { ...states["sensor.down"], state: "5" } })._signature()));
});

test("boxes of other operators are discovered from their own entity keys", () => {
  // Livebox: rate_down/up, wifi, missed calls, reboot and clear-calls buttons by their own translation keys.
  const lbDevices = { lb: { id: "lb", name: "Livebox 6", model: "Livebox 6", config_entries: ["e"] } };
  const lbEnt = (entity_id, translation_key) => ({ entity_id, platform: "livebox", translation_key, device_id: "lb" });
  const lbEntities = {
    "sensor.l_down": lbEnt("sensor.l_down", "down_rate"),
    "sensor.l_up": lbEnt("sensor.l_up", "up_rate"),
    "switch.l_wifi": lbEnt("switch.l_wifi", "wifi_switch"),
    "sensor.l_callers": lbEnt("sensor.l_callers", "callers"),
    "button.l_restart": lbEnt("button.l_restart", "restart_btn"),
    "button.l_clear": lbEnt("button.l_clear", "cmissed_clear_btn"),
  };
  const lbStates = {};
  for (const id of Object.keys(lbEntities)) lbStates[id] = st("1");
  const lb = discover({ states: lbStates, entities: lbEntities, devices: lbDevices }, "lb");
  assert.equal(lb.operator.name, "Livebox");
  assert.equal(lb.scalars.rate_down, "sensor.l_down");
  assert.equal(lb.scalars.wifi, "switch.l_wifi");
  assert.equal(lb.scalars.missed, "sensor.l_callers");
  assert.equal(lb.scalars.reboot, "button.l_restart");
  assert.equal(lb.scalars.mark_read, "button.l_clear");

  // SFR Box: DSL sync rates by translation key, reboot by device_class "restart", temperature by device_class.
  const sfrDevices = { sfr: { id: "sfr", name: "SFR Box 8", model: "NB6VAC", config_entries: ["e"] } };
  const sfrEntities = {
    "sensor.s_down": { entity_id: "sensor.s_down", platform: "sfr_box", translation_key: "dsl_rate_down", device_id: "sfr" },
    "sensor.s_up": { entity_id: "sensor.s_up", platform: "sfr_box", translation_key: "dsl_rate_up", device_id: "sfr" },
    "sensor.s_temp": { entity_id: "sensor.s_temp", platform: "sfr_box", translation_key: null, device_id: "sfr" },
    "button.s_reboot": { entity_id: "button.s_reboot", platform: "sfr_box", translation_key: null, device_id: "sfr" },
  };
  const sfrStates = {
    "sensor.s_down": st("50000"),
    "sensor.s_up": st("5000"),
    "sensor.s_temp": st("45", { device_class: "temperature" }),
    "button.s_reboot": st("unknown", { device_class: "restart" }),
  };
  const sfr = discover({ states: sfrStates, entities: sfrEntities, devices: sfrDevices }, "sfr");
  assert.equal(sfr.operator.name, "SFR Box");
  assert.equal(sfr.scalars.rate_down, "sensor.s_down");
  assert.equal(sfr.scalars.reboot, "button.s_reboot");
  assert.deepEqual([...sfr.temps].map((t) => t.id), ["sensor.s_temp"]);

  // Bbox: legacy integration with no translation keys, discovered by entity-id suffix.
  const bbDevices = { bb: { id: "bb", name: "Bbox", config_entries: ["e"] } };
  const bbEntities = {
    "sensor.b_down": { entity_id: "sensor.bbox_currently_used_download_bandwidth", platform: "bbox", translation_key: null, device_id: "bb" },
    "sensor.b_up": { entity_id: "sensor.bbox_currently_used_upload_bandwidth", platform: "bbox", translation_key: null, device_id: "bb" },
  };
  const bbStates = {
    "sensor.bbox_currently_used_download_bandwidth": st("500"),
    "sensor.bbox_currently_used_upload_bandwidth": st("50"),
  };
  const bb = discover({ states: bbStates, entities: bbEntities, devices: bbDevices }, "bb");
  assert.equal(bb.operator.name, "Bbox");
  assert.equal(bb.scalars.rate_down, "sensor.bbox_currently_used_download_bandwidth");
  assert.equal(bb.scalars.rate_up, "sensor.bbox_currently_used_upload_bandwidth");

  // Bbox for real: the legacy integration registers no device and no unique_id, so its sensors are only in
  // hass.states (not the entity registry). It is discovered and listed from states by the entity-id prefix.
  const bbOnly = { states: bbStates, entities: {}, devices: {} };
  assert.deepEqual(
    [...listBoxes(bbOnly)].map((b) => ({ value: b.value, label: b.label })),
    [{ value: "sensor.bbox", label: "Bbox" }]
  );
  const bb2 = discover(bbOnly);
  assert.equal(bb2.operator.name, "Bbox");
  assert.equal(bb2.id, "sensor.bbox");
  assert.equal(bb2.device, null);
  assert.equal(bb2.scalars.rate_down, "sensor.bbox_currently_used_download_bandwidth");
  assert.equal(bb2.scalars.rate_up, "sensor.bbox_currently_used_upload_bandwidth");
});

test("the reboot button is discovered by its translation key, its device class, or the default entity id", () => {
  // Registry: translation_key "reboot".
  const ents = {
    ...entities,
    "button.reboot": { entity_id: "button.reboot", platform: "freebox", device_id: "router", translation_key: "reboot" },
  };
  const states = { ...baseStates(), "button.reboot": st("unknown") };
  assert.equal(discover({ states, entities: ents, devices }, "router").scalars.reboot, "button.reboot");

  // Registry: no translation key, device_class "restart".
  const ents2 = {
    ...entities,
    "button.boot": { entity_id: "button.boot", platform: "freebox", device_id: "router", translation_key: null },
  };
  const states2 = { ...baseStates(), "button.boot": st("unknown", { device_class: "restart" }) };
  assert.equal(discover({ states: states2, entities: ents2, devices }, "router").scalars.reboot, "button.boot");

  // No registry (old frontend): the default English entity id.
  const fb = {
    "device_tracker.freebox": st("home", { connection_type: "ftth", firmware_version: "1.0", uptime: "2026-10-24T08:00:00" }),
    "sensor.freebox_download_speed": st("10", { unit_of_measurement: "kB/s" }),
    "button.freebox_reboot": st("unknown"),
  };
  for (const [id, v] of Object.entries(fb)) v.entity_id = id;
  assert.equal(discover({ states: fb }, undefined).scalars.reboot, "button.freebox_reboot");
});

test("the model is detected from the device and can be forced with the model option", () => {
  const { boxModel, MODELS } = load("internet-box-card.js", ["boxModel", "MODELS"]);
  const box = (dev) => ({ device: dev });
  assert.equal(boxModel(box(devices.router), {}).id, "ultra");
  assert.equal(boxModel(box({ model_id: "fbxgw8-r1" }), {}).id, "pop");
  assert.equal(boxModel(box({ name: "Freebox v7 (r1)" }), {}).id, "delta");
  assert.equal(boxModel(box({ model: "Freebox Server Mini 4K" }), {}).id, "mini_4k");
  assert.equal(boxModel(box({ model_id: "fbxgw-r2" }), {}).id, "revolution");
  assert.equal(boxModel(box({ name: "Some router" }), {}), undefined);
  assert.equal(boxModel(box(devices.router), { model: "revolution" }).name, "Freebox Revolution");
  assert.equal(boxModel(box(devices.router), { model: "unknown" }).id, "ultra");
  assert.equal(MODELS.map((m) => m.id).join(), "ultra,pop,delta,revolution,mini_4k");
});

test("every model of every operator has its drawn picture, also shown in the README", async () => {
  const { OPERATORS, IMG_BOX } = load("internet-box-card.js", ["OPERATORS", "IMG_BOX"]);
  const { readFileSync } = await import("node:fs");
  for (const op of Object.values(OPERATORS)) {
    for (const m of op.models) {
      assert.match(IMG_BOX[m.id], /^data:image\/svg\+xml,/, m.id);
      // images/<operator>-<model>.svg is the README copy of the same drawing (npm run screenshots writes it).
      const base = (op.platform === "freebox" ? `freebox-${m.id}` : m.id).replace(/_/g, "-");
      const file = readFileSync(new URL(`../images/${base}.svg`, import.meta.url), "utf8");
      assert.equal(file.trim(), decodeURIComponent(IMG_BOX[m.id].slice("data:image/svg+xml,".length)), m.id);
    }
  }
});

test("the editor model dropdown lists the models of the box's operator", () => {
  const { InternetBoxCardEditor } = load("internet-box-card.js", ["InternetBoxCardEditor"]);
  const modelOptions = (hass) => {
    const ed = new InternetBoxCardEditor();
    ed._hass = hass;
    ed._config = {};
    return ed._schema().find((f) => f.name === "model").selector.select.options.map((o) => o.value);
  };
  // Freebox: the Freebox models.
  assert.equal(modelOptions({ states: baseStates(), entities, devices }).join(), ",ultra,pop,delta,revolution,mini_4k");
  // Livebox: its own models, no Freebox ids.
  const lbDevices = { lb: { id: "lb", name: "Livebox 6", config_entries: ["lb_entry"] } };
  const lbEntities = {
    "sensor.lb_down": { entity_id: "sensor.lb_down", platform: "livebox", device_id: "lb", translation_key: "down_rate" },
  };
  const lbStates = { "sensor.lb_down": { entity_id: "sensor.lb_down", ...st("10", { unit_of_measurement: "kB/s" }) } };
  assert.equal(
    modelOptions({ states: lbStates, entities: lbEntities, devices: lbDevices }).join(),
    ",livebox_7,livebox_6,livebox_5,livebox_4,livebox_s"
  );
});

test("temperatures are read in the sensor's unit and compared in °C", () => {
  const { temperature, InternetBoxMiniCard } = load("internet-box-card.js", ["temperature", "InternetBoxMiniCard"]);
  assert.deepEqual({ ...temperature(st("50", { unit_of_measurement: "°C" })) }, { raw: 50, c: 50, unit: "°C" });
  assert.equal(temperature(st("122", { unit_of_measurement: "°F" })).c, 50);
  assert.equal(Math.round(temperature(st("323.15", { unit_of_measurement: "K" })).c), 50);
  assert.equal(temperature(st("45")).unit, "°C");
  assert.equal(temperature(st("unavailable")).c, null);

  // Imperial Home Assistant: 122 °F (50 °C) is neither shown as "122°C" nor flagged as critical.
  const sfrDevices = { sfr: { id: "sfr", name: "SFR Box 8", model: "NB6VAC", config_entries: ["e"] } };
  const sfrEntities = {
    "sensor.s_down": { entity_id: "sensor.s_down", platform: "sfr_box", translation_key: "dsl_rate_down", device_id: "sfr" },
    "sensor.s_temp": { entity_id: "sensor.s_temp", platform: "sfr_box", translation_key: null, device_id: "sfr" },
  };
  const states = {
    "sensor.s_down": { entity_id: "sensor.s_down", ...st("50000") },
    "sensor.s_temp": { entity_id: "sensor.s_temp", ...st("122", { device_class: "temperature", unit_of_measurement: "°F" }) },
  };
  const el = new InternetBoxMiniCard();
  el._config = { box: "sfr", zoom: false };
  el._hass = { states, entities: sfrEntities, devices: sfrDevices, language: "en", config: { time_zone: "UTC" } };
  const mini = el._renderMini();
  assert.match(mini, /data-key="hottest"[^>]*>.*122°F<\/span>/s);
  assert.doesNotMatch(mini, /class="clickable crit" role="button" tabindex="0" data-key="hottest"/);
  const full = el._system(discover(el._hass, "sfr"));
  assert.match(full, /class="gauge clickable ok"/);
  assert.match(full, /<b>122°<\/b>/);
});

test("the editor clears a model of another operator when the box changes, and keeps its schema", () => {
  const { InternetBoxCardEditor } = load("internet-box-card.js", ["InternetBoxCardEditor"]);
  const lbDevices = { ...devices, lb: { id: "lb", name: "Livebox 6", config_entries: ["lb_entry"] } };
  const lbEntities = {
    ...entities,
    "sensor.lb_down": { entity_id: "sensor.lb_down", platform: "livebox", device_id: "lb", translation_key: "down_rate" },
  };
  const states = { ...baseStates(), "sensor.lb_down": { entity_id: "sensor.lb_down", ...st("10", { unit_of_measurement: "kB/s" }) } };
  const hass = { states, entities: lbEntities, devices: lbDevices, language: "en" };
  const ed = new InternetBoxCardEditor();
  ed.appendChild = () => {};
  const emitted = [];
  ed.dispatchEvent = (ev) => emitted.push(ev.detail.config);
  ed.setConfig({ model: "ultra" });
  ed.hass = hass;
  // No box set: the first box is selected and written to the config.
  assert.equal(emitted.at(-1).box, "router");
  assert.equal(emitted.at(-1).model, "ultra");
  // Same box, a state change: the schema handed to ha-form is kept.
  const schema = ed._form.schema;
  ed.hass = { ...hass, states: { ...states, "light.kitchen": st("on") } };
  assert.equal(ed._form.schema, schema);
  // Box of another operator: the Freebox model is cleared.
  const change = (value) => ed._form.listeners["value-changed"]({ stopPropagation() {}, detail: { value } });
  change({ ...ed._config, box: "lb" });
  assert.equal(emitted.at(-1).box, "lb");
  assert.equal("model" in emitted.at(-1), false);
  // A model of the same operator is kept.
  change({ ...ed._config, model: "livebox_6" });
  assert.equal(emitted.at(-1).model, "livebox_6");
});

test("two legacy Bbox whose prefixes overlap keep their own rates and distinct editor labels", () => {
  const st = (state) => ({ state, attributes: {} });
  // `name: Bbox` and `name: Bbox Salon`: "sensor.bbox" is the start of "sensor.bbox_salon".
  const states = {
    "sensor.bbox_currently_used_download_bandwidth": st("500"),
    "sensor.bbox_currently_used_upload_bandwidth": st("50"),
    "sensor.bbox_salon_currently_used_download_bandwidth": st("900"),
    "sensor.bbox_salon_currently_used_upload_bandwidth": st("90"),
  };
  const hass = { states, entities: {}, devices: {} };
  const main = discover(hass, "sensor.bbox");
  assert.equal(main.id, "sensor.bbox");
  assert.equal(main.scalars.rate_down, "sensor.bbox_currently_used_download_bandwidth");
  assert.equal(main.scalars.rate_up, "sensor.bbox_currently_used_upload_bandwidth");
  const salon = discover(hass, "sensor.bbox_salon");
  assert.equal(salon.id, "sensor.bbox_salon");
  assert.equal(salon.scalars.rate_down, "sensor.bbox_salon_currently_used_download_bandwidth");
  assert.equal(salon.scalars.rate_up, "sensor.bbox_salon_currently_used_upload_bandwidth");
  const labels = [...listBoxes(hass)].map((b) => b.label);
  assert.equal(new Set(labels).size, 2, `labels must be distinct: ${labels.join(", ")}`);
});

test("a legacy Bbox missing its upload sensor does not borrow another box's upload rate", () => {
  const st = (state) => ({ state, attributes: {} });
  const hass = {
    states: {
      "sensor.bbox_currently_used_download_bandwidth": st("500"),
      "sensor.bbox_salon_currently_used_download_bandwidth": st("unavailable"),
      "sensor.bbox_salon_currently_used_upload_bandwidth": st("unavailable"),
    },
    entities: {},
    devices: {},
  };
  const main = discover(hass, "sensor.bbox");
  assert.equal(main.scalars.rate_down, "sensor.bbox_currently_used_download_bandwidth");
  assert.equal(main.scalars.rate_up, undefined);
  // A single legacy box keeps its plain operator name as label.
  const one = { states: { "sensor.bbox_currently_used_download_bandwidth": st("1") }, entities: {}, devices: {} };
  assert.deepEqual([...listBoxes(one)].map((b) => b.label), ["Bbox"]);
});

// Card rendered from the mock Freebox (scripts/mock-states.mjs) with some states replaced, in English.
const mockCard = async (overrides, config = {}, Kind = "InternetBoxCard") => {
  const mock = await import("../scripts/mock-states.mjs");
  const { [Kind]: Card } = load("internet-box-card.js", [Kind]);
  const states = structuredClone(mock.states);
  for (const [id, state] of Object.entries(overrides)) states[id] = { ...states[id], state, attributes: state === "unavailable" ? {} : states[id].attributes };
  const el = new Card();
  el._config = { zoom: false, ...config };
  el._hass = { states, entities: mock.entities, devices: mock.devices, language: "en", config: { time_zone: "UTC" } };
  return el;
};
const WIFI = "switch.freebox_wifi";
const MISSED = "sensor.freebox_missed_calls";
const REBOOT = "button.freebox_reboot";
const PART = "sensor.disk_1000_freebox_free_space";
const ROUTER_ID = "device_tracker.freebox_v9_r1";

test("an unavailable Wi-Fi switch or missed-calls sensor is shown as unavailable, not as Off or 0 missed", async () => {
  for (const state of ["unavailable", "unknown"]) {
    const el = await mockCard({ [WIFI]: state, [MISSED]: state });
    const html = el._render();
    const wifiTile = html.match(/<div class="tile svc[^"]*"[^>]*data-entity="switch\.freebox_wifi">.*?<\/div><\/div><\/div>/s)[0];
    assert.match(wifiTile, /<div class="v">Unavailable<\/div>/, state);
    assert.match(wifiTile, /class="tile svc clickable off"/, state);
    assert.doesNotMatch(wifiTile, />Off</, state);
    const callsTile = html.match(/<div class="tile svc[^"]*"[^>]*data-entity="sensor\.freebox_missed_calls">.*?<\/div><\/div>(<button.*?<\/button>)?<\/div>/s)[0];
    assert.match(callsTile, /<div class="v">Unavailable<\/div>/, state);
    assert.doesNotMatch(callsTile, /0 missed|class="reset"|svc clickable warn/, state);

    // Header chip, shown when the Services section is hidden.
    const chip = (await mockCard({ [WIFI]: state }, { show_services: false }))._chips(
      { scalars: { wifi: WIFI } }
    );
    assert.match(chip, /class="chip clickable off"/, state);
    assert.match(chip, /Wi-Fi · Unavailable/, state);
    assert.doesNotMatch(chip, /Wi-Fi off/, state);

    // Footer of the mini card.
    const mini = (await mockCard({ [WIFI]: state, [MISSED]: state }, {}, "InternetBoxMiniCard"))._renderMini();
    const wifiFoot = mini.match(/<span class="clickable[^"]*"[^>]*data-entity="switch\.freebox_wifi"[^>]*>.*?<\/span>/s)[0];
    assert.match(wifiFoot, /class="clickable off"/, state);
    assert.match(wifiFoot, /title="Wi-Fi · Unavailable"/, state);
    const callsFoot = mini.match(/<span class="clickable[^"]*"[^>]*data-entity="sensor\.freebox_missed_calls".*?<\/span><\/span>/s)[0];
    assert.match(callsFoot, /title="Calls · Unavailable"/, state);
    assert.match(callsFoot, /—<\/span>/, state);
    assert.doesNotMatch(callsFoot, /class="reset"|clickable warn|svg[^>]*>.*?<\/svg>0</s, state);
  }
});

test("real Wi-Fi off and 0 missed calls are still shown as such", async () => {
  const el = await mockCard({ [WIFI]: "off", [MISSED]: "0" });
  const html = el._render();
  assert.match(html, /<div class="k">Wi-Fi<\/div><div class="v">Off<\/div>/);
  assert.match(html, /<div class="v">0 missed<\/div>/);
  const on = (await mockCard({}))._render();
  assert.match(on, /<div class="k">Wi-Fi<\/div><div class="v">On<\/div>/);
  assert.match(on, /<div class="v">2 missed<\/div><\/div><button class="reset"/);
});

test("an unavailable router, RAID or partition is not shown as offline, OK or healthy", async () => {
  const el = await mockCard({ [ROUTER_ID]: "unavailable", [PART]: "unavailable" });
  const html = el._render();
  assert.match(html, /class="chip status clickable off"[^>]*>.*Unavailable/s);
  assert.doesNotMatch(html, /Offline/);
  assert.match(html, /<span class="dot off"><\/span><span class="grow">/);
  const mini = (await mockCard({ [ROUTER_ID]: "unavailable" }, {}, "InternetBoxMiniCard"))._renderMini();
  assert.match(mini, /class="clickable off"[^>]*data-key="router"[^>]*>.*?Unavailable/s);
  assert.doesNotMatch(mini, /OFFLINE/);
  // RAID binary sensor (the mock has none): an unavailable one is neither "OK" nor "Degraded".
  const raid = await mockCard({});
  raid._hass.states["binary_sensor.raid"] = { entity_id: "binary_sensor.raid", state: "unavailable", attributes: {} };
  const rows = raid._storage({ partitions: [], raids: ["binary_sensor.raid"], device: null });
  assert.match(rows, /<span class="chip off">Unavailable<\/span>/);
  assert.doesNotMatch(rows, /class="dot ok"|>OK</);
});

test("the restart button is disabled while the reboot button is unavailable", async () => {
  // A button that was never pressed is "unknown": that is its normal state.
  const ok = (await mockCard({ [REBOOT]: "unknown" }))._render();
  assert.match(ok, /<button class="action" data-action="restart"[^>]*>/);
  assert.doesNotMatch(ok, /data-action="restart"[^>]*disabled/);
  const off = await mockCard({ [REBOOT]: "unavailable" });
  assert.match(off._render(), /<button class="action" data-action="restart"[^>]* disabled>/);
  // And no confirmation is opened for it.
  off._openDialog = () => assert.fail("dialog opened");
  off._confirmRestart();
});

test("connected devices are shown as unavailable when every client tracker is, not as 0 / n", async () => {
  const mock = await import("../scripts/mock-states.mjs");
  const trackers = Object.keys(mock.states).filter((id) => id.startsWith("device_tracker.") && id !== ROUTER_ID);
  const tile = (html) => html.match(/<div class="tile svc[^"]*" data-key="devices">.*?<\/div><\/div><\/div>/s)[0];
  for (const state of ["unavailable", "unknown"]) {
    const t = tile((await mockCard(Object.fromEntries(trackers.map((id) => [id, state]))))._render());
    assert.match(t, /<div class="v">Unavailable<\/div>/, state);
    assert.match(t, /class="tile svc off"/, state);
    assert.doesNotMatch(t, /0 \//, state);
  }
  // Some trackers still known: they are counted, the unavailable ones are left out of the total.
  const some = tile((await mockCard({ [trackers[0]]: "unavailable" }))._render());
  const home = trackers.slice(1).filter((id) => mock.states[id].state === "home").length;
  assert.match(some, new RegExp(`<div class="v">${home} / ${trackers.length - 1}</div>`));
  assert.match(some, /class="tile svc ok"/);
  // Every tracker known: unchanged.
  const all = tile((await mockCard({}))._render());
  assert.match(all, new RegExp(`<div class="v">${trackers.filter((id) => mock.states[id].state === "home").length} / ${trackers.length}</div>`));
});

test("lineOf: the header icon follows the connection type, else the model", () => {
  assert.equal(lineOf("ftth"), "fibre");
  assert.equal(lineOf("xdsl"), "dsl");
  assert.equal(lineOf("4G"), "mobile");
  assert.equal(lineOf(undefined, "Bbox Fibre"), "fibre");
  assert.equal(lineOf(undefined, "Livebox 7"), "box");
});

test("rate tiles: 24 h sparkline from the recorder statistics, refreshed every 5 minutes, off with show_history: false", async () => {
  const calls = [];
  const el = new InternetBoxCard();
  el._config = { box: "router" };
  el._hass = {
    states: baseStates(),
    entities,
    devices,
    language: "en",
    config: { time_zone: "UTC" },
    callWS: async (msg) => {
      calls.push(msg);
      return Object.fromEntries(msg.statistic_ids.map((id) => [id, [{ mean: 10 }, { mean: 40 }, { mean: 20 }]]));
    },
  };
  el._update = () => {
    el.html = el._render();
  };
  el._update();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, "recorder/statistics_during_period");
  assert.doesNotMatch(el.html, /class="spark"/);
  await new Promise((r) => setTimeout(r, 0));
  assert.match(el.html, /class="spark"/);
  el._update();
  assert.equal(calls.length, 1, "no new query within 5 minutes");
  el._histAt -= 5 * 60000 + 1;
  el._update();
  assert.equal(calls.length, 2);

  const off = new InternetBoxCard();
  off._config = { box: "router", show_history: false };
  off._hass = el._hass;
  assert.doesNotMatch(off._render(), /class="spark"/);
  assert.equal(calls.length, 2);
});

test("mini card: the compact rate tiles draw the same 24 h curves", async () => {
  const { InternetBoxMiniCard } = load("internet-box-card.js", ["InternetBoxMiniCard"]);
  const el = new InternetBoxMiniCard();
  el._config = { box: "router" };
  el._hass = {
    states: baseStates(),
    entities,
    devices,
    language: "en",
    config: { time_zone: "UTC" },
    callWS: async (msg) => Object.fromEntries(msg.statistic_ids.map((id) => [id, [{ mean: 1 }, { mean: 3 }]])),
  };
  el._update = () => {
    el.html = el._renderMini();
  };
  el._update();
  await new Promise((r) => setTimeout(r, 0));
  assert.match(el.html, /class="spark"/);
  el._config = { box: "router", show_history: false };
  assert.doesNotMatch(el._renderMini(), /class="spark"/);
});
