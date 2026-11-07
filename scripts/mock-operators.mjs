// Mock Home Assistant data for the other operators, shaped like what each integration really exposes, used to
// render the per-operator README screenshots. Each operator gives { states, entities, devices, config }.

const st = (state, attributes = {}) => ({ state, attributes });

// Registry-based integrations: [entity id, device, translation key, state, attributes, name].
const build = (platform, entry, devices, raw, clients = []) => {
  const states = {};
  const entities = {};
  for (const [id, device_id, key, state, attributes, name] of raw) {
    const friendly_name = `${devices[device_id].name} ${name}`;
    states[id] = { entity_id: id, ...st(state, { ...attributes, friendly_name }) };
    entities[id] = { entity_id: id, platform, device_id, ...(key ? { translation_key: key } : {}) };
  }
  for (const [name, state] of clients) {
    const device_id = `dev_${platform}_${name}`;
    const id = `device_tracker.${platform}_${name}`;
    devices[device_id] = { id: device_id, name, config_entries: [entry] };
    states[id] = { entity_id: id, ...st(state, { source_type: "router", friendly_name: name }) };
    entities[id] = { entity_id: id, platform, device_id };
  }
  return { states, entities, devices };
};

// Livebox (Orange), hass-livebox-component: line rates, Wi-Fi switch, missed calls with their clear button,
// restart button, WAN status, and a device tracker per connected device.
const LB = "dev_livebox";
const livebox = build(
  "livebox",
  "entry_livebox",
  { [LB]: { id: LB, name: "Livebox 7", model: "Livebox 7", sw_version: "SG_LB7_1.2.4", config_entries: ["entry_livebox"] } },
  [
    ["sensor.livebox_7_downlink_rate", LB, "down_rate", "2000", { unit_of_measurement: "Mbit/s", device_class: "data_rate" }, "Downlink rate"],
    ["sensor.livebox_7_uplink_rate", LB, "up_rate", "800", { unit_of_measurement: "Mbit/s", device_class: "data_rate" }, "Uplink rate"],
    ["sensor.livebox_7_missed_calls", LB, "callers", "1", {}, "Missed calls"],
    ["switch.livebox_7_wifi", LB, "wifi_switch", "on", {}, "Wi-Fi"],
    ["button.livebox_7_clear_missed_calls", LB, "cmissed_clear_btn", "unknown", {}, "Clear missed calls"],
    ["button.livebox_7_restart", LB, "restart_btn", "unknown", { device_class: "restart" }, "Restart"],
    ["binary_sensor.livebox_7_wan_status", LB, "connectivity", "on", { device_class: "connectivity", link_type: "gpon" }, "WAN Status"],
  ],
  [
    ["tv", "home"],
    ["laptop", "home"],
    ["phone", "home"],
    ["console", "home"],
    ["tablet", "not_home"],
  ]
);

// SFR Box, sfr_box integration: DSL line sync rates, system temperature, the reboot button and the WAN and DSL
// line status.
const SFR = "dev_sfr";
const sfr = build(
  "sfr_box",
  "entry_sfr",
  { [SFR]: { id: SFR, name: "SFR Box", model: "NB6VAC-FXC-r0", sw_version: "NB6VAC-MAIN-R4.0.45", config_entries: ["entry_sfr"] } },
  [
    ["sensor.sfr_box_dsl_rate_down", SFR, "dsl_rate_down", "65480", { unit_of_measurement: "kbit/s", device_class: "data_rate" }, "DSL rate down"],
    ["sensor.sfr_box_dsl_rate_up", SFR, "dsl_rate_up", "11880", { unit_of_measurement: "kbit/s", device_class: "data_rate" }, "DSL rate up"],
    ["sensor.sfr_box_temperature", SFR, null, "52", { unit_of_measurement: "°C", device_class: "temperature" }, "Temperature"],
    ["button.sfr_box_restart", SFR, null, "unknown", { device_class: "restart" }, "Restart"],
    ["binary_sensor.sfr_box_wan_status", SFR, "wan_status", "on", { device_class: "connectivity" }, "WAN status"],
    ["binary_sensor.sfr_box_dsl_status", SFR, "dsl_status", "on", { device_class: "connectivity" }, "DSL status"],
  ]
);

// Bbox (Bouygues Telecom), legacy YAML bbox platform: no device and no unique id, so no registry entry; its
// sensors only exist in the states. The integration exposes no model: the picture is set with `model`.
const bbox = {
  devices: {},
  entities: {},
  states: Object.fromEntries(
    [
      ["sensor.bbox_currently_used_download_bandwidth", "312.6", "Bbox Currently Used Download Bandwidth"],
      ["sensor.bbox_currently_used_upload_bandwidth", "48.2", "Bbox Currently Used Upload Bandwidth"],
      ["sensor.bbox_maximum_download_bandwidth", "1000", "Bbox Maximum Download Bandwidth"],
      ["sensor.bbox_maximum_upload_bandwidth", "700", "Bbox Maximum Upload Bandwidth"],
    ].map(([id, state, friendly_name]) => [
      id,
      { entity_id: id, ...st(state, { unit_of_measurement: "Mbit/s", device_class: "data_rate", friendly_name }) },
    ])
  ),
  config: { model: "bbox_fibre" },
};

export const operators = { livebox: { ...livebox, config: {} }, sfr: { ...sfr, config: {} }, bbox };
