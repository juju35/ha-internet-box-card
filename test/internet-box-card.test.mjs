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
// Recorder 5-minute statistics rows ending now, one per value (null: no row for that period).
const stats = (values, end = Date.now()) =>
  values.map((mean, i) => (mean === null ? null : { start: end - (values.length - i) * 300000, mean })).filter(Boolean);
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
    "binary_sensor.l_missed": lbEnt("binary_sensor.l_missed", "callmissed"),
    "button.l_restart": lbEnt("button.l_restart", "restart_btn"),
    "button.l_clear": lbEnt("button.l_clear", "cmissed_clear_btn"),
  };
  const lbStates = {};
  for (const id of Object.keys(lbEntities)) lbStates[id] = st("1");
  const lb = discover({ states: lbStates, entities: lbEntities, devices: lbDevices }, "lb");
  assert.equal(lb.operator.name, "Livebox");
  assert.equal(lb.scalars.rate_down, "sensor.l_down");
  assert.equal(lb.scalars.wifi, "switch.l_wifi");
  // The missed calls come from the "call missed" binary sensor; `callers` counts every call and is only a fallback.
  assert.equal(lb.scalars.missed, "binary_sensor.l_missed");
  assert.equal(lb.scalars.missed_total, "sensor.l_callers");
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
  // sfr_box has no throughput sensor: its DSL sync rates are the line rate, not the download / upload rates.
  assert.equal(sfr.scalars.sync_down, "sensor.s_down");
  assert.equal(sfr.scalars.sync_up, "sensor.s_up");
  assert.equal(sfr.scalars.rate_down, undefined);
  assert.equal(sfr.scalars.rate_up, undefined);
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

test("Livebox on fibre: discovered and rated from the WAN GPON interface statistics (#61)", () => {
  // No down_rate / up_rate sensor on a GPON or SFP line: the integration only exposes the per-interface rates,
  // whose translation keys are built from the interface name. Only the WAN interface counts, never Wi-Fi, Ethernet
  // or the DS-Lite tunnel.
  const devs = { lb: { id: "lb", name: "Livebox Fibre", model: "ArcadyanLBFIBRE_OFR", manufacturer: "Arcadyan", config_entries: ["e"] } };
  const ent = (entity_id, translation_key) => ({ entity_id, platform: "livebox", translation_key, device_id: "lb" });
  const ents = {
    "sensor.livebox_fibre_wan_gpon_rate_rx": ent("sensor.livebox_fibre_wan_gpon_rate_rx", "WAN_GPON_rate_rx"),
    "sensor.livebox_fibre_wan_gpon_rate_tx": ent("sensor.livebox_fibre_wan_gpon_rate_tx", "WAN_GPON_rate_tx"),
    "sensor.livebox_fibre_eth1_rate_rx": ent("sensor.livebox_fibre_eth1_rate_rx", "eth1_rate_rx"),
    "sensor.livebox_fibre_wan_ds_lite_tunnel_rate_rx": ent("sensor.livebox_fibre_wan_ds_lite_tunnel_rate_rx", "WAN_DS_LITE_TUNNEL_rate_rx"),
    "sensor.livebox_fibre_2_4ghz_private_ssid_rate_rx": ent("sensor.livebox_fibre_2_4ghz_private_ssid_rate_rx", "2.4GHz_Private_SSID_rate_rx"),
    "binary_sensor.livebox_fibre_wan_status": ent("binary_sensor.livebox_fibre_wan_status", "connectivity"),
  };
  const states = {};
  for (const id of Object.keys(ents)) states[id] = st("12.5", { unit_of_measurement: "Mbit/s" });
  const hass = { states, entities: ents, devices: devs };
  assert.equal(JSON.stringify(listBoxes(hass)), JSON.stringify([{ value: "lb", label: "Livebox Fibre" }]));
  const box = discover(hass, "lb");
  assert.equal(box.operator.name, "Livebox");
  assert.equal(box.scalars.rate_down, "sensor.livebox_fibre_wan_gpon_rate_rx");
  assert.equal(box.scalars.rate_up, "sensor.livebox_fibre_wan_gpon_rate_tx");
  assert.equal(box.scalars.wan, "binary_sensor.livebox_fibre_wan_status");
  // The same device id given by hand is accepted too.
  assert.equal(discover(hass, "lb").id, "lb");

  // The canonical keys win when both exist (xDSL line with interface statistics too), whatever the entity order.
  const both = {
    ...ents,
    "sensor.a_down": ent("sensor.a_down", "down_rate"),
    "sensor.z_up": ent("sensor.z_up", "up_rate"),
  };
  const bothStates = { ...states, "sensor.a_down": st("1"), "sensor.z_up": st("1") };
  const b = discover({ states: bothStates, entities: both, devices: devs }, "lb");
  assert.equal(b.scalars.rate_down, "sensor.a_down");
  assert.equal(b.scalars.rate_up, "sensor.z_up");

  // The Arcadyan Livebox Fibre is drawn as a Livebox 5.
  const { boxModel } = load("internet-box-card.js", ["boxModel"]);
  assert.equal(boxModel(box, {}).id, "livebox_5");
});

test("Livebox 3.0.0 on fibre: the WAN interface rate under the shared interface_rate key, Sagemcom Livebox 5 (#98)", () => {
  // Since Livebox 3.0.0 every interface rate has the translation key interface_rate_rx / _tx: the WAN interface is
  // told by its name in the entity id, generated in the language of Home Assistant.
  const devs = { lb: { id: "lb", name: "Livebox Fibre", model: "SagemcomFast5656_OFR", manufacturer: "Sagemcom", config_entries: ["e"] } };
  const ent = (entity_id, translation_key) => ({ entity_id, platform: "livebox", translation_key, device_id: "lb" });
  const mk = (ids) => {
    const entities = {};
    const states = {};
    for (const [id, k] of ids) {
      entities[id] = ent(id, k);
      states[id] = st("12.5", { unit_of_measurement: "Mbit/s" });
    }
    return { states, entities, devices: devs };
  };
  // French entity ids, the Wi-Fi, Ethernet, a sub-interface and the DS-Lite tunnel listed first.
  const fr = mk([
    ["sensor.livebox_fibre_debit_recu_2_4ghz_private_ssid", "interface_rate_rx"],
    ["sensor.livebox_fibre_debit_recu_eth1", "interface_rate_rx"],
    ["sensor.livebox_fibre_debit_recu_wan_sfp_internet", "interface_rate_rx"],
    ["sensor.livebox_fibre_debit_recu_wan_ds_lite_tunnel", "interface_rate_rx"],
    ["sensor.livebox_fibre_debit_recu_wan_sfp", "interface_rate_rx"],
    ["sensor.livebox_fibre_debit_emis_eth1", "interface_rate_tx"],
    ["sensor.livebox_fibre_debit_emis_wan_sfp", "interface_rate_tx"],
  ]);
  assert.equal(JSON.stringify(listBoxes(fr)), JSON.stringify([{ value: "lb", label: "Livebox Fibre" }]));
  const box = discover(fr, "lb");
  assert.equal(box.scalars.rate_down, "sensor.livebox_fibre_debit_recu_wan_sfp");
  assert.equal(box.scalars.rate_up, "sensor.livebox_fibre_debit_emis_wan_sfp");
  // English entity ids, GPON and the veip0 interface of the boxes with a built-in ONT.
  const en = discover(mk([["sensor.livebox_wan_gpon_rate_rx", "interface_rate_rx"], ["sensor.livebox_wan_gpon_rate_tx", "interface_rate_tx"]]), "lb");
  assert.equal(en.scalars.rate_down, "sensor.livebox_wan_gpon_rate_rx");
  const veip = discover(mk([["sensor.livebox_veip0_rate_rx", "interface_rate_rx"], ["sensor.livebox_veip0_rate_tx", "interface_rate_tx"]]), "lb");
  assert.equal(veip.scalars.rate_up, "sensor.livebox_veip0_rate_tx");
  // Without a WAN interface, no box.
  assert.equal(listBoxes(mk([["sensor.livebox_fibre_debit_recu_eth1", "interface_rate_rx"]])).length, 0);
  // The Sagemcom Livebox Fibre is drawn as a Livebox 5.
  const { boxModel } = load("internet-box-card.js", ["boxModel"]);
  assert.equal(boxModel(box, {}).id, "livebox_5");
});

test("Livebox: the missed calls are counted from the call-missed sensor, never from the total of calls (#61)", () => {
  const { missedCount } = load("internet-box-card.js", ["missedCount"]);
  const s = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes });
  const callers = [{ status: "missed" }, { status: "in" }, { status: "missed" }, { status: "out" }];
  // `callmissed` binary sensor with its missed_calls list; off means none; unavailable means no value.
  assert.equal(missedCount(s("binary_sensor.lb_missed", "on", { missed_calls: callers.slice(0, 2) })), 2);
  assert.equal(missedCount(s("binary_sensor.lb_missed", "off", { missed_calls: [] })), 0);
  assert.equal(missedCount(s("binary_sensor.lb_missed", "off")), 0);
  assert.equal(missedCount(s("binary_sensor.lb_missed", "unavailable")), null);
  // `callers` total (fallback): only the calls whose status is "missed", not the 4 of the state.
  assert.equal(missedCount(s("sensor.lb_callers", "4", { callers })), 2);
  // Freebox: the state is the count.
  assert.equal(missedCount(s("sensor.freebox_missed_calls", "3")), 3);
  assert.equal(missedCount(s("sensor.freebox_missed_calls", "unknown")), null);
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
      // A model is drawn on its own (its id) or with a shared generic form factor (its `pic`).
      const pic = m.pic ?? m.id;
      assert.match(IMG_BOX[pic], /^data:image\/svg\+xml,/, m.id);
      // images/<operator>-<model>.svg is the README copy of the same drawing (npm run screenshots writes it).
      const base = (op.platform === "freebox" && !m.pic ? `freebox-${pic}` : pic).replace(/_/g, "-");
      const file = readFileSync(new URL(`../images/${base}.svg`, import.meta.url), "utf8");
      assert.equal(file.trim(), decodeURIComponent(IMG_BOX[pic].slice("data:image/svg+xml,".length)), m.id);
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
    ",livebox_7,livebox_6,livebox_5,livebox_4,livebox_s,kpn_box_12"
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
  // Copied: tests add entities to it. Without the screenshots' Speedtest.net sensors: the tests of the speed test add theirs.
  const entities = structuredClone(mock.entities);
  for (const id of Object.keys(states)) if (id.startsWith("sensor.speedtest_")) delete states[id], delete entities[id];
  for (const [id, state] of Object.entries(overrides)) states[id] = { ...states[id], state, attributes: state === "unavailable" ? {} : states[id].attributes };
  const el = new Card();
  el._config = { zoom: false, ...config };
  el._hass = { states, entities, devices: mock.devices, language: "en", config: { time_zone: "UTC" } };
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
    assert.match(chip, /class="chip wifi clickable off"/, state);
    assert.doesNotMatch(chip, /class="toggle"/, state);
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
  assert.equal(lineOf("GPON"), "fibre");
  assert.equal(lineOf("XGS-PON"), "fibre");
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
      return Object.fromEntries(msg.statistic_ids.map((id) => [id, stats([10, 40, 20])]));
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
    callWS: async (msg) => Object.fromEntries(msg.statistic_ids.map((id) => [id, stats([1, 3])])),
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

test("SFR Box: the DSL sync rates show as the line rate, without 24 h traffic curve", async () => {
  const { InternetBoxCard: Full, InternetBoxMiniCard } = load("internet-box-card.js", ["InternetBoxCard", "InternetBoxMiniCard"]);
  const sfrDevices = { sfr: { id: "sfr", name: "SFR Box 8", model: "NB6VAC", config_entries: ["e"] } };
  const sfrEntities = {
    "sensor.s_down": { entity_id: "sensor.s_down", platform: "sfr_box", translation_key: "dsl_rate_down", device_id: "sfr" },
    "sensor.s_up": { entity_id: "sensor.s_up", platform: "sfr_box", translation_key: "dsl_rate_up", device_id: "sfr" },
  };
  const kbps = { unit_of_measurement: "kbit/s", device_class: "data_rate" };
  const states = {
    "sensor.s_down": { entity_id: "sensor.s_down", ...st("65480", kbps) },
    "sensor.s_up": { entity_id: "sensor.s_up", ...st("11880", kbps) },
  };
  const calls = [];
  const hass = {
    states,
    entities: sfrEntities,
    devices: sfrDevices,
    language: "en",
    config: { time_zone: "UTC" },
    callWS: async (msg) => {
      calls.push(msg);
      return {};
    },
  };
  for (const El of [Full, InternetBoxMiniCard]) {
    const el = new El();
    el._config = { box: "sfr", zoom: false };
    el._hass = hass;
    const html = El === Full ? el._render() : el._renderMini();
    assert.match(html, /Line rate ↓/);
    assert.match(html, /Line rate ↑/);
    assert.doesNotMatch(html, />Download</);
    assert.doesNotMatch(html, />Upload</);
    assert.doesNotMatch(html, /class="spark"/);
  }
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(calls.length, 0);
});

// SFR Box (or Livebox) with its link entities: [entity id, translation key, state, attributes].
const linkCard = (Kind, platform, rows) => {
  const { [Kind]: Card } = load("internet-box-card.js", [Kind]);
  const devs = { b: { id: "b", name: "Box", config_entries: ["e"] } };
  const ents = {};
  const states = {};
  const down = platform === "sfr_box" ? "dsl_rate_down" : "down_rate";
  for (const [id, key, state, attributes = {}] of [[`sensor.${platform}_down`, down, "1000", { unit_of_measurement: "kbit/s" }], ...rows]) {
    ents[id] = { entity_id: id, platform, device_id: "b", translation_key: key };
    states[id] = { entity_id: id, ...st(state, attributes) };
  }
  const el = new Card();
  el._config = { box: "b", zoom: false };
  el._hass = { states, entities: ents, devices: devs, language: "en", config: { time_zone: "UTC" } };
  return el;
};
const pill = (html) => html.match(/<span class="chip status[^>]*>.*?<\/span><\/span>/s)?.[0] ?? "";

test("SFR Box: the status pill shows the real WAN / line state from the integration's entities", () => {
  const sfr = (rows) => linkCard("InternetBoxCard", "sfr_box", rows);
  const WAN = ["binary_sensor.sfr_wan", "wan_status"];
  const DSL = ["binary_sensor.sfr_dsl", "dsl_status"];
  const TRAINING = ["sensor.sfr_training", "dsl_training"];
  const LINE = ["sensor.sfr_line", "dsl_line_status"];
  // WAN up, the kind of line from the DSL line sensor.
  let p = pill(sfr([[...WAN, "on"], [...DSL, "on"]])._render());
  assert.match(p, /class="chip status clickable ok"[^>]*data-entity="binary_sensor.sfr_wan"/);
  assert.match(p, />Online · DSL</);
  // The access network sensor, when enabled, names the line.
  p = pill(sfr([[...WAN, "on"], [...DSL, "on"], ["sensor.sfr_infra", "net_infra", "ftth"]])._render());
  assert.match(p, />Online · FTTH</);
  // WAN down while the DSL line is training: syncing, linked to the training sensor.
  p = pill(sfr([[...WAN, "off"], [...DSL, "off"], [...TRAINING, "g_994_training"], [...LINE, "no_defect"]])._render());
  assert.match(p, /class="chip status clickable warn"[^>]*data-entity="sensor.sfr_training"/);
  assert.match(p, />Syncing · DSL</);
  // WAN down with a line defect: line fault, linked to the line status sensor.
  p = pill(sfr([[...WAN, "off"], [...TRAINING, "idle"], [...LINE, "loss_of_signal"]])._render());
  assert.match(p, /class="chip status clickable crit"[^>]*data-entity="sensor.sfr_line"/);
  assert.match(p, />Line fault</);
  // WAN down, nothing more: offline.
  p = pill(sfr([[...WAN, "off"], [...DSL, "off"], [...TRAINING, "showtime"], [...LINE, "no_defect"]])._render());
  assert.match(p, /class="chip status clickable crit"[^>]*data-entity="binary_sensor.sfr_wan"/);
  assert.match(p, />Offline · DSL</);
  // WAN unavailable: the DSL line sensor answers instead.
  p = pill(sfr([[...WAN, "unavailable"], [...DSL, "on"]])._render());
  assert.match(p, /data-entity="binary_sensor.sfr_dsl"[^>]*>.*Online · DSL/s);
  // Every link entity unavailable: unavailable, not offline.
  p = pill(sfr([[...WAN, "unavailable"]])._render());
  assert.match(p, /class="chip status clickable off"[^>]*>.*Unavailable/s);
  // No link entity (and no router tracker): no pill, as before.
  assert.equal(pill(sfr([])._render()), "");
  // The mini card footer: the kind of line when up, the reason when the line gives one.
  const mini = (rows) => linkCard("InternetBoxMiniCard", "sfr_box", rows)._renderMini();
  assert.match(mini([[...WAN, "on"], [...DSL, "on"]]), /class="clickable ok"[^>]*data-key="router"[^>]*><span class="dot"><\/span>&nbsp;DSL</);
  assert.match(mini([[...WAN, "off"], [...TRAINING, "g_993_started"]]), /class="clickable warn"[^>]*data-key="router"[^>]*>.*SYNCING/s);
});

test("Livebox: the status pill follows the WAN connectivity sensor and its link type", () => {
  const lb = (state) => linkCard("InternetBoxCard", "livebox", [["binary_sensor.lb_wan", "connectivity", state, { link_type: "gpon" }]]);
  assert.match(pill(lb("on")._render()), /class="chip status clickable ok"[^>]*>.*Online · GPON/s);
  assert.match(pill(lb("off")._render()), /class="chip status clickable crit"[^>]*>.*Offline · GPON/s);
  // The header icon follows the link type: fibre.
  assert.match(lb("on")._render(), /<path class="ln" d="M12 12V8\.5/);
});

test("thresholds: temperature and storage levels follow the options, with the former values as defaults", async () => {
  const mock = await import("../scripts/mock-states.mjs");
  const tempId = Object.keys(mock.states).find((id) => mock.states[id].attributes.device_class === "temperature");
  const gaugeOf = (html) => html.match(new RegExp(`class="gauge clickable (\\w*)"[^>]*data-key="${tempId}"`))[1];
  const partOf = (html) => html.match(new RegExp(`class="part clickable (\\w*)"[^>]*data-key="${PART}"`))[1];
  // 60 °C and 85 % used: ok and warn by default (75 / 90 °C, 80 / 90 %).
  const def = (await mockCard({ [tempId]: "60", [PART]: "15" }))._render();
  assert.equal(gaugeOf(def), "ok");
  assert.equal(partOf(def), "warn");
  const custom = await mockCard({ [tempId]: "60", [PART]: "15" }, { temp_warning: 50, temp_critical: 58, disk_warning: 90, disk_critical: "95" });
  const html = custom._render();
  assert.equal(gaugeOf(html), "crit");
  assert.equal(partOf(html), "ok");
  // storage_* (before 2.8) still read, disk_* winning when both are set: 85 % used is critical from 70, not 95.
  const { normalizeConfig } = load("internet-box-card.js", ["normalizeConfig"]);
  const legacy = (await mockCard({ [PART]: "15" }, normalizeConfig({ storage_warning: 90, storage_critical: 95, disk_critical: 70 })))._render();
  assert.equal(partOf(legacy), "crit");
  assert.equal(JSON.stringify(normalizeConfig({ storage_warning: 90, disk_critical: 70 })), JSON.stringify({ disk_critical: 70, disk_warning: 90 }));
  // A value that is not a number falls back to the default.
  const bad = (await mockCard({ [tempId]: "80" }, { temp_warning: "hot" }))._render();
  assert.equal(gaugeOf(bad), "warn");
  // The mini card's hottest temperature uses the same thresholds.
  const mini = (await mockCard({ [tempId]: "60" }, { temp_warning: 50 }, "InternetBoxMiniCard"))._renderMini();
  assert.match(mini, /class="clickable warn" role="button" tabindex="0" data-key="hottest"/);
});

test("thresholds in the editor: shown at their defaults, kept in the YAML only when changed", () => {
  const { InternetBoxCardEditor } = load("internet-box-card.js", ["InternetBoxCardEditor"]);
  const ed = new InternetBoxCardEditor();
  ed.appendChild = () => {};
  const emitted = [];
  ed.dispatchEvent = (ev) => emitted.push(ev.detail.config);
  ed.setConfig({ box: "router" });
  ed.hass = { states: baseStates(), entities, devices, language: "en" };
  assert.equal(ed._form.data.temp_warning, 75);
  assert.equal(ed._form.data.disk_critical, 90);
  const names = JSON.stringify(ed._form.schema);
  for (const k of ["temp_warning", "temp_critical", "disk_warning", "disk_critical"]) assert.match(names, new RegExp(`"${k}"`));
  ed._form.listeners["value-changed"]({ stopPropagation() {}, detail: { value: { ...ed._form.data, temp_warning: 70 } } });
  const out = emitted.at(-1);
  assert.equal(out.temp_warning, 70);
  for (const k of ["temp_critical", "disk_warning", "disk_critical"]) assert.equal(k in out, false, k);
});

test("sparkline: real time axis over the 24 h window, broken where the recorder has no data", () => {
  const { spark, statTime } = load("internet-box-card.js", ["spark", "statTime"]);
  const end = Date.UTC(2026, 10, 7, 12);
  const H = 3600000;
  // Points at -24 h, -12 h and now land at x 0, 50 and 100, whatever their count.
  const even = spark(
    [
      [end - 24 * H, 1],
      [end - 24 * H + 300000, 1],
      [end - 12 * H, 2],
      [end - 12 * H + 300000, 2],
      [end - 300000, 1],
      [end, 1],
    ],
    end
  );
  const line = even.match(/class="spark-l" d="([^"]*)"/)[1];
  // Three runs (gaps of 12 h): three subpaths, starting at x 0, 50 and 99.65.
  assert.deepEqual(line.match(/M[\d.]+/g), ["M0.00", "M50.00", "M99.65"]);
  // Each run's area is closed down to the baseline on its own.
  assert.equal(even.match(/class="spark-a" d="([^"]*)"/)[1].match(/Z/g).length, 3);
  // One missing 5-minute row (10 minutes apart) still joins; two (15 minutes) break.
  const run = (gap) => spark([[end - 3 * H, 1], [end - 3 * H + 300000, 2], [end - 3 * H + 300000 + gap, 3], [end - 3 * H + 600000 + gap, 1]], end);
  assert.equal(run(600000).match(/class="spark-l" d="([^"]*)"/)[1].match(/M/g).length, 1);
  assert.equal(run(900000).match(/class="spark-l" d="([^"]*)"/)[1].match(/M/g).length, 2);
  // A lone point between gaps is not drawn; nothing at all without a run of two points; points outside the window are left out.
  assert.equal(spark([[end - 5 * H, 1], [end - 2 * H, 2]], end), "");
  assert.equal(spark([[end - 30 * H, 1], [end - 29 * H, 2], [end - H, 3]], end), "");
  // Statistics rows carry their start as epoch ms (current Home Assistant) or an ISO date (older ones).
  assert.equal(statTime({ start: end }), end);
  assert.equal(statTime({ start: new Date(end).toISOString() }), end);
});

test("sparkline from the recorder: gaps in the statistics break the curve", async () => {
  const el = new InternetBoxCard();
  el._config = { box: "router" };
  el._hass = {
    states: baseStates(),
    entities,
    devices,
    language: "en",
    config: { time_zone: "UTC" },
    callWS: async (msg) => Object.fromEntries(msg.statistic_ids.map((id) => [id, stats([5, 6, 7, null, null, null, 4, 5])])),
  };
  el._update = () => {
    el.html = el._render();
  };
  el._update();
  await new Promise((r) => setTimeout(r, 0));
  const d = el.html.match(/class="spark-l" d="([^"]*)"/)[1];
  assert.equal(d.match(/M/g).length, 2);
  // The last row (5 minutes before the request) ends near the right edge, not stretched to it.
  assert.match(d, /L99\.65,[\d.]+$/);
});

test("rates use the decimal separator of the card's language", async () => {
  const fr = await mockCard({}, { language: "fr" });
  fr._hass.states["sensor.down"] = { entity_id: "sensor.down", state: "1500", attributes: { unit_of_measurement: "kB/s" } };
  assert.equal(fr._rate("sensor.down"), "1,5 Mo/s");
  const en = await mockCard({});
  en._hass.states["sensor.down"] = fr._hass.states["sensor.down"];
  assert.equal(en._rate("sensor.down"), "1.5 MB/s");
  // No grouping: 999 kB/s stays "999", units under 1000.
  en._hass.states["sensor.down"] = { entity_id: "sensor.down", state: "999", attributes: { unit_of_measurement: "kB/s" } };
  assert.equal(en._rate("sensor.down"), "999 kB/s");
});

test("a rate tile without its sensor is neither clickable nor focusable", async () => {
  const el = await mockCard({});
  const html = el._rateTiles({ rate_down: "sensor.down", rate_up: undefined }, null);
  assert.match(html, /<div class="tile clickable down" role="button" tabindex="0" data-entity="sensor.down">/);
  assert.match(html, /<div class="tile up">/);
  assert.equal(html.match(/tabindex/g).length, 1);
  assert.doesNotMatch(html, /data-entity=""/);
});

test("the network section keeps the IP address and uptime when the box has no rate or sync sensor", async () => {
  const el = await mockCard({});
  const router = el._s(ROUTER_ID);
  router.attributes = { ...router.attributes, IPv4: "203.0.113.7" };
  const html = el._network({ scalars: { router: ROUTER_ID } });
  assert.match(html, /class="section-title"/);
  assert.match(html, /203\.0\.113\.7/);
  assert.match(html, /Uptime /);
  assert.doesNotMatch(html, /class="grid2"|class="tile/);
  // Neither rates nor facts: no section.
  el._hass.states[ROUTER_ID] = { ...router, attributes: {} };
  assert.equal(el._network({ scalars: { router: ROUTER_ID } }), "");
});

test("Wi-Fi switch: on the tile, the header chip and the mini card footer, none while unavailable", async () => {
  const toggle = /<button type="button" class="toggle" role="switch" aria-checked="(true|false)" data-action="wifi" title="([^"]*)" aria-label="Wi-Fi"><\/button>/;
  for (const [state, checked, title] of [
    ["on", "true", "Turn the Wi-Fi off"],
    ["off", "false", "Turn the Wi-Fi on"],
  ]) {
    const tile = (await mockCard({ [WIFI]: state }))._render();
    assert.deepEqual(tile.match(toggle).slice(1), [checked, title], state);
    // The switch is not inside an element with role="button": the tile's label is the keyboard target.
    assert.match(tile, /data-entity="switch\.freebox_wifi">[\s\S]*?<div role="button" tabindex="0"><div class="k">Wi-Fi<\/div>[\s\S]*?<\/div><\/div><button type="button" class="toggle"/);
    const chip = (await mockCard({ [WIFI]: state }, { show_services: false }))._chips({ scalars: { wifi: WIFI } });
    assert.deepEqual(chip.match(toggle).slice(1), [checked, title], state);
    assert.match(chip, /<span role="button" tabindex="0">/);
    const mini = (await mockCard({ [WIFI]: state }, {}, "InternetBoxMiniCard"))._renderMini();
    assert.deepEqual(mini.match(toggle).slice(1), [checked, title], state);
  }
  for (const state of ["unavailable", "unknown"]) {
    assert.doesNotMatch((await mockCard({ [WIFI]: state }))._render(), /class="toggle"/, state);
    assert.doesNotMatch((await mockCard({ [WIFI]: state }, {}, "InternetBoxMiniCard"))._renderMini(), /class="toggle"/, state);
  }
});

test("Wi-Fi switch: turns the Wi-Fi on at once, off only after the confirmation popup", async () => {
  const run = async (state) => {
    const el = await mockCard({ [WIFI]: state });
    const calls = [];
    el._hass.callService = (...a) => calls.push(a);
    let dialog = null;
    el._openDialog = (d) => {
      dialog = d;
    };
    el._toggleWifi();
    await new Promise((r) => setTimeout(r));
    return { calls, dialog };
  };
  const off = await run("off");
  assert.equal(off.dialog, null);
  assert.deepEqual(JSON.parse(JSON.stringify(off.calls)), [["switch", "turn_on", { entity_id: WIFI }]]);

  const on = await run("on");
  assert.deepEqual(on.calls, []);
  assert.equal(on.dialog.from, "wifi");
  assert.equal(on.dialog.ok, "Turn off");
  assert.match(on.dialog.body, /Turn the Wi-Fi off<\/h3>/);
  assert.match(on.dialog.body, /Wireless devices will lose their connection/);
  on.dialog.onOk();
  await new Promise((r) => setTimeout(r));
  assert.deepEqual(JSON.parse(JSON.stringify(on.calls)), [["switch", "turn_off", { entity_id: WIFI }]]);

  for (const state of ["unavailable", "unknown"]) assert.deepEqual(await run(state), { calls: [], dialog: null }, state);

  // Only a switch entity is turned on or off.
  const el = await mockCard({});
  const calls = [];
  el._hass.callService = (...c) => calls.push(c);
  el._openDialog = () => assert.fail("dialog opened");
  el._s = (id) => (id ? { ...el._hass.states[id], entity_id: "sensor.freebox_wifi" } : undefined);
  el._toggleWifi();
  await new Promise((r) => setTimeout(r));
  assert.deepEqual(calls, []);
});

test("the last Speedtest.net test is a fact of the network section, hidden with show_speedtest: false", async () => {
  const el = await mockCard({});
  const add = (id, key, state, unit) => {
    el._hass.entities[id] = { entity_id: id, platform: "speedtestdotnet", translation_key: key };
    el._hass.states[id] = { entity_id: id, state, attributes: { unit_of_measurement: unit }, last_changed: "2026-11-09T06:00:00Z" };
  };
  add("sensor.speedtest_download", "download", "845.2", "Mbit/s");
  add("sensor.speedtest_upload", "upload", "512", "Mbit/s");
  add("sensor.speedtest_ping", "ping", "9.4", "ms");
  const html = el._network({ scalars: { router: ROUTER_ID } });
  assert.match(html, /class="clickable speedtest" role="button" tabindex="0" data-entity="sensor\.speedtest_download"/);
  assert.match(html, /↓ 106 MB\/s · ↑ 64\.0 MB\/s · 9 ms/);
  el._config = { ...el._config, show_speedtest: false };
  assert.doesNotMatch(el._network({ scalars: { router: ROUTER_ID } }), /speedtest/);
});

test("another speed test (LibreSpeed…) through entities.speedtest: its sensors only, not mixed with Speedtest.net's; Fast.com found", async () => {
  const el = await mockCard({});
  const add = (id, platform, key, state, unit) => {
    if (platform) el._hass.entities[id] = { entity_id: id, platform, translation_key: key };
    el._hass.states[id] = { entity_id: id, state, attributes: { unit_of_measurement: unit }, last_changed: "2026-11-09T06:00:00Z" };
  };
  add("sensor.fast_com_download", "fastdotcom", "download", "400", "Mbit/s");
  let html = el._network({ scalars: { router: ROUTER_ID } });
  assert.match(html, /data-entity="sensor\.fast_com_download"/);
  assert.match(html, /↓ 50\.0 MB\/s</);
  add("sensor.speedtest_upload", "speedtestdotnet", "upload", "512", "Mbit/s");
  add("sensor.librespeed_download", null, null, "800", "Mbit/s");
  add("sensor.librespeed_ping", null, null, "12", "ms");
  el._config = { ...el._config, entities: { speedtest: { download: "sensor.librespeed_download", ping: "sensor.librespeed_ping" } } };
  html = el._network({ scalars: { router: ROUTER_ID } });
  assert.match(html, /data-entity="sensor\.librespeed_download"/);
  assert.match(html, /↓ 100 MB\/s · 12 ms/);
  assert.doesNotMatch(html, /↑/);
});

test("speed test button (#107): refreshes Speedtest.net, presses the entity of entities.speedtest.run, turns until new results", async () => {
  const el = await mockCard({});
  const calls = [];
  el._hass.callService = (...c) => calls.push(c);
  el._update = () => {};
  const add = (id, platform, key, state) => {
    if (platform) el._hass.entities[id] = { entity_id: id, platform, translation_key: key };
    el._hass.states[id] = { entity_id: id, state, attributes: { unit_of_measurement: "Mbit/s" }, last_updated: "2026-11-09T06:00:00Z", last_reported: "2026-11-09T06:00:00Z" };
  };
  add("sensor.speedtest_download", "speedtestdotnet", "download", "845");
  const net = () => el._network({ scalars: { router: ROUTER_ID } });
  let html = net();
  assert.match(html, /<button type="button" class="run" data-action="speedtest" title="Run a speed test" aria-label="Run a speed test">/);
  // Not inside the fact opening the more-info dialog
  assert.doesNotMatch(html, /role="button"[^>]*>(?:(?!<\/span>).)*<button/);
  el._runSpeedtest();
  await new Promise((r) => setTimeout(r));
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [["homeassistant", "update_entity", { entity_id: "sensor.speedtest_download" }]]);
  html = net();
  assert.match(html, /class="run" data-action="speedtest" title="Speed test running…" aria-label="Speed test running…" aria-busy="true" aria-disabled="true"><svg class="icon spin"/);
  el._runSpeedtest();
  await new Promise((r) => setTimeout(r));
  assert.equal(calls.length, 1, "no second test while one runs");
  // New results: stopped
  el._hass.states["sensor.speedtest_download"] = { ...el._hass.states["sensor.speedtest_download"], last_reported: "2026-11-12T22:00:00Z" };
  assert.doesNotMatch(net(), /aria-busy/);
  // Time is up without results: stopped too
  el._runSpeedtest();
  [...el.constructor.speedtestRuns.values()][0].at -= 181e3;
  assert.doesNotMatch(net(), /aria-busy/);
  clearTimeout(el._speedtestTimer);
  await new Promise((r) => setTimeout(r));
  assert.equal(calls.length, 2);

  // A failed call: stopped at once
  el._hass.callService = () => Promise.reject(new Error("forbidden"));
  el._runSpeedtest();
  assert.match(net(), /aria-busy/);
  await new Promise((r) => setTimeout(r));
  assert.equal(el.constructor.speedtestRuns.size, 0);
  assert.doesNotMatch(net(), /aria-busy/);
  clearTimeout(el._speedtestTimer);
  el._hass.callService = (...c) => calls.push(c);

  // Sensors of another speed test: a button only with entities.speedtest.run, pressed (a script is run)
  add("sensor.librespeed_download", null, null, "800");
  el._config = { ...el._config, entities: { speedtest: { download: "sensor.librespeed_download" } } };
  assert.doesNotMatch(net(), /data-action="speedtest"/);
  for (const [run, svc] of [
    ["button.librespeed_run", ["button", "press"]],
    ["input_button.speedtest", ["input_button", "press"]],
    ["script.speedtest", ["script", "turn_on"]],
    ["automation.speedtest", ["automation", "trigger"]],
  ]) {
    el._hass.states[run] = { entity_id: run, state: "unknown", attributes: {} };
    el._config = { ...el._config, entities: { speedtest: { download: "sensor.librespeed_download", run } } };
    el.constructor.speedtestRuns.clear();
    calls.length = 0;
    assert.match(net(), /data-action="speedtest"/);
    el._runSpeedtest();
    await new Promise((r) => setTimeout(r));
    assert.deepEqual(JSON.parse(JSON.stringify(calls)), [[...svc, { entity_id: run }]], run);
    clearTimeout(el._speedtestTimer);
  }
  el._hass.states["script.speedtest"].state = "unavailable";
  el._config = { ...el._config, entities: { speedtest: { download: "sensor.librespeed_download", run: "script.speedtest" } } };
  assert.doesNotMatch(net(), /data-action="speedtest"/);
});

test("speed test button: another speed test runs until its values change, not on a poll writing the same ones; shared by the cards", async () => {
  const el = await mockCard({});
  el._hass.callService = async () => {};
  el._update = () => {};
  const id = "sensor.librespeed_download";
  el._hass.states[id] = { entity_id: id, state: "800", attributes: { unit_of_measurement: "Mbit/s" }, last_updated: "2026-11-09T06:00:00Z", last_reported: "2026-11-09T06:00:00Z" };
  el._hass.states["button.librespeed_run"] = { entity_id: "button.librespeed_run", state: "unknown", attributes: {} };
  el._config = { ...el._config, entities: { speedtest: { download: id, run: "button.librespeed_run" } } };
  const running = () => /aria-busy/.test(el._network({ scalars: { router: ROUTER_ID } }));
  el._runSpeedtest();
  el._hass.states[id] = { ...el._hass.states[id], last_reported: "2026-11-12T22:00:00Z" };
  assert.ok(running(), "a poll with the same values");
  // Another card of the page (same entity starting the test) shows it running too
  const other = Object.create(Object.getPrototypeOf(el));
  Object.assign(other, { _hass: el._hass, _config: el._config });
  assert.ok(/aria-busy/.test(other._network({ scalars: { router: ROUTER_ID } })));
  el._hass.states[id] = { ...el._hass.states[id], state: "812", last_updated: "2026-11-12T22:01:00Z" };
  assert.ok(!running(), "new results");
  clearTimeout(el._speedtestTimer);
});

test("speed test button: in every language, and in the editor's speed test fold", () => {
  const { STRINGS, InternetBoxCardEditor } = load("internet-box-card.js", ["STRINGS", "InternetBoxCardEditor"]);
  for (const [code, s] of Object.entries(STRINGS)) for (const k of ["ent_run", "run_speedtest", "speedtest_running"]) assert.ok(s[k], `${code} ${k}`);
  const ed = new InternetBoxCardEditor();
  ed.appendChild = () => {};
  ed.setConfig({ box: "router" });
  ed.hass = { states: baseStates(), entities, devices, language: "en" };
  const fold = ed._form.schema.find((f) => f.name === "entities").schema.find((f) => f.name === "speedtest");
  assert.ok(fold.schema.some((f) => f.name === "run"));
  assert.equal(ed._form.computeLabel({ name: "run" }), "Speed test: button to run it");
});

test("entities: the box's sensors of the user's choice replace the ones found, the same object while nothing changes", () => {
  const lib = load("internet-box-card.js", ["boxFor", "discover"]);
  const hass = { states: { ...baseStates(), "sensor.wan_in": { entity_id: "sensor.wan_in", ...st("2000", { unit_of_measurement: "kB/s" }) } }, entities, devices, language: "en" };
  const config = { box: "router", entities: { rate_down: "sensor.wan_in", wifi: "not an id" } };
  const found = lib.discover(hass, "router");
  const own = lib.boxFor(hass, config);
  assert.equal(found.scalars.rate_down, "sensor.down");
  assert.equal(own.scalars.rate_down, "sensor.wan_in");
  assert.equal(own.scalars.wifi, found.scalars.wifi);
  assert.equal(lib.boxFor(hass, { ...config }), own);
  assert.equal(lib.boxFor(hass, { box: "router" }), found);
});

test("editor: the box rates and a speed test chosen under entities, emptied ones dropped", () => {
  const { InternetBoxCardEditor } = load("internet-box-card.js", ["InternetBoxCardEditor"]);
  const hass = { states: baseStates(), entities, devices, language: "en" };
  const ed = new InternetBoxCardEditor();
  ed.appendChild = () => {};
  const emitted = [];
  ed.dispatchEvent = (ev) => emitted.push(ev.detail.config);
  ed.setConfig({ box: "router" });
  ed.hass = hass;
  const fold = ed._form.schema.find((f) => f.name === "entities");
  assert.equal(fold.type, "expandable");
  assert.equal(ed._form.computeLabel({ name: "download" }), "Speed test: download");
  const change = (value) => ed._form.listeners["value-changed"]({ stopPropagation() {}, detail: { value } });
  change({ ...ed._config, entities: { rate_down: "", speedtest: { download: "sensor.librespeed_download", upload: "" } } });
  assert.deepEqual(JSON.parse(JSON.stringify(emitted.at(-1).entities)), { speedtest: { download: "sensor.librespeed_download" } });
  change({ ...ed._config, entities: { speedtest: { download: "" } } });
  assert.equal("entities" in emitted.at(-1), false);
});

// A device of another integration linked to the router (FRITZ!Box Tools links network clients, a NAS merged by its
// MAC address among them, to the box) is no child of the box: its entities of the box's platform are left out.
test("a device of another config entry linked to the router is not a child of the box", async () => {
  const mock = await import("../scripts/mock-states.mjs");
  const hass = { states: structuredClone(mock.states), entities: structuredClone(mock.entities), devices: structuredClone(mock.devices), language: "en" };
  const router = Object.keys(hass.devices).find((id) => !hass.devices[id].via_device_id);
  const platform = Object.values(hass.entities).find((e) => e.device_id === router).platform;
  hass.devices.nas = { id: "nas", name: "NAS", via_device_id: router, config_entries: ["entry_other"] };
  const id = "sensor.nas_free_space";
  hass.entities[id] = { entity_id: id, platform, device_id: "nas", translation_key: "partition_free_space" };
  hass.states[id] = { entity_id: id, state: "10", attributes: { friendly_name: "NAS free space", unit_of_measurement: "%" } };
  const box = discover(hass, router);
  assert.ok(box.partitions.length >= 1, "the box disk partition is still found");
  assert.ok(!box.partitions.some((p) => p.id === id));
});

test("a Freebox whose entities have no translation key is found by entity-id suffix (#112)", () => {
  const devs = {
    fbx: { id: "fbx", name: "Freebox v7 (r1)", model: "Freebox v7 (r1)", model_id: "fbxgw7-r1/full", config_entries: ["e"] },
    disk: { id: "disk", name: "Disk 1", via_device_id: "fbx", config_entries: ["e"] },
  };
  const ids = {
    "sensor.freebox_download_speed": ["fbx", { device_class: "data_rate" }],
    "sensor.freebox_upload_speed": ["fbx", { device_class: "data_rate" }],
    "sensor.freebox_missed_calls": ["fbx", {}],
    "sensor.freebox_temperature_cpu_ap": ["fbx", { device_class: "temperature" }],
    "sensor.freebox_disque_dur_1": ["disk", {}],
    "sensor.disque_dur_free_space": ["disk", {}],
    "binary_sensor.raid_array_0_degraded": ["disk", {}],
    "device_tracker.freebox_v7_r1": ["fbx", {}],
    "switch.freebox_wifi": ["fbx", {}],
    "button.mark_calls_as_read": ["fbx", {}],
    "button.reboot_freebox": ["fbx", { device_class: "restart" }],
  };
  const ents = {};
  const states = {};
  for (const [id, [device_id, attributes]] of Object.entries(ids)) {
    ents[id] = { entity_id: id, platform: "freebox", device_id };
    states[id] = { entity_id: id, state: "1", attributes };
  }
  const hass = { states, entities: ents, devices: devs };
  assert.deepEqual([...listBoxes(hass)].map((b) => b.value), ["fbx"]);
  const box = discover(hass, undefined);
  assert.equal(box.scalars.rate_down, "sensor.freebox_download_speed");
  assert.equal(box.scalars.rate_up, "sensor.freebox_upload_speed");
  assert.equal(box.scalars.missed, "sensor.freebox_missed_calls");
  assert.equal(box.scalars.wifi, "switch.freebox_wifi");
  assert.equal(box.scalars.mark_read, "button.mark_calls_as_read");
  assert.equal(box.scalars.reboot, "button.reboot_freebox");
  assert.equal(box.scalars.router, "device_tracker.freebox_v7_r1");
  assert.deepEqual([...box.partitions].map((p) => p.id), ["sensor.disque_dur_free_space"]);
  assert.deepEqual([...box.raids], ["binary_sensor.raid_array_0_degraded"]);
  assert.deepEqual([...box.temps].map((t) => t.id), ["sensor.freebox_temperature_cpu_ap"]);
});
