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

// One registry-based box per integration below: [entity id, translation key, state, attributes, name] on its device.
const single = (platform, device, rows, clients = []) => {
  const id = `dev_${platform}`;
  const entry = `entry_${platform}`;
  return build(
    platform,
    entry,
    { [id]: { id, config_entries: [entry], ...device } },
    rows.map(([eid, key, state, attributes, name]) => [eid, id, key, state, attributes, name]),
    clients
  );
};
const CLIENTS = [
  ["tv", "home"],
  ["laptop", "home"],
  ["phone", "home"],
  ["tablet", "not_home"],
];
const RESTART = { device_class: "restart" };
const BOOT = new Date(Date.UTC(2026, 9, 28, 6, 12)).toISOString();

// FRITZ!Box, fritz integration: traffic rates (kB/s), WAN connection, external IP, uptime, CPU temperature, main
// Wi-Fi switch, reboot button.
const fritz = single(
  "fritz",
  { name: "FRITZ!Box 7590 AX", model: "FRITZ!Box 7590 AX", sw_version: "8.02" },
  [
    ["sensor.fritz_box_download_throughput", "kb_s_received", "4210", { unit_of_measurement: "kB/s", device_class: "data_rate", state_class: "measurement" }, "Download throughput"],
    ["sensor.fritz_box_upload_throughput", "kb_s_sent", "612", { unit_of_measurement: "kB/s", device_class: "data_rate", state_class: "measurement" }, "Upload throughput"],
    ["binary_sensor.fritz_box_connection", "is_connected", "on", { device_class: "connectivity" }, "Connection"],
    ["sensor.fritz_box_external_ip", "external_ip", "203.0.113.24", {}, "External IP"],
    ["sensor.fritz_box_last_restart", null, BOOT, { device_class: "uptime" }, "Last restart"],
    ["sensor.fritz_box_cpu_temperature", "cpu_temperature", "58", { unit_of_measurement: "°C", device_class: "temperature" }, "CPU temperature"],
    ["switch.fritz_box_wi_fi_main_2_4ghz", "wi_fi_main_2_4ghz", "on", {}, "Wi-Fi main 2.4Ghz"],
    ["button.fritz_box_restart", null, "unknown", RESTART, "Restart"],
  ],
  CLIENTS
);

// Vodafone Station, vodafone_station integration: rates (kB/s), external IP, active connection, uptime, main Wi-Fi.
const vodafone = single(
  "vodafone_station",
  { name: "Vodafone Station", model: "SHG3060", sw_version: "XS6_4.2.00.10" },
  [
    ["sensor.vodafone_station_download_stream", "down_stream", "2860", { unit_of_measurement: "kB/s", device_class: "data_rate", state_class: "measurement" }, "Download stream"],
    ["sensor.vodafone_station_upload_stream", "up_stream", "420", { unit_of_measurement: "kB/s", device_class: "data_rate", state_class: "measurement" }, "Upload stream"],
    ["sensor.vodafone_station_external_ipv4", "external_ipv4", "198.51.100.61", {}, "External IPv4"],
    ["sensor.vodafone_station_active_connection", "active_connection", "fiber", { device_class: "enum" }, "Active connection"],
    ["sensor.vodafone_station_uptime", null, BOOT, { device_class: "uptime" }, "Uptime"],
    ["switch.vodafone_station_main", "main", "on", {}, "Wi-Fi"],
    ["button.vodafone_station_restart", null, "unknown", RESTART, "Restart"],
  ],
  CLIENTS
);

// Swisscom Internet-Box, swisscom integration: connected devices only.
const swisscomAll = single("swisscom", { name: "unused" }, [], CLIENTS);
delete swisscomAll.devices.dev_swisscom;

// Sagemcom F@st 5689 (Bell Home Hub 4000), sagemcom_fast integration: reboot button and connected devices.
const sagemcom = single(
  "sagemcom_fast",
  { name: "Sagemcom F@st 5689", model: "F@st 5689", sw_version: "SGRT000060", configuration_url: "http://192.168.2.1" },
  [["button.sagemcom_fast_5689_reboot", null, "unknown", RESTART, "Reboot"]],
  CLIENTS
);

// KPN Box 12 on the Livebox integration (Livebox OS).
const kpn = single(
  "livebox",
  { name: "KPN Box 12", model: "KPN Box 12", sw_version: "V12.C.23.04.36" },
  [
    ["sensor.kpn_box_12_downlink_rate", "down_rate", "940", { unit_of_measurement: "Mbit/s", device_class: "data_rate" }, "Downlink rate"],
    ["sensor.kpn_box_12_uplink_rate", "up_rate", "940", { unit_of_measurement: "Mbit/s", device_class: "data_rate" }, "Uplink rate"],
    ["binary_sensor.kpn_box_12_wan_status", "connectivity", "on", { device_class: "connectivity", link_type: "gpon" }, "WAN Status"],
    ["switch.kpn_box_12_wifi", "wifi_switch", "on", {}, "Wi-Fi"],
    ["button.kpn_box_12_restart", "restart_btn", "unknown", RESTART, "Restart"],
  ],
  CLIENTS
);

// Huawei LTE, huawei_lte integration: rates (B/s), mobile connection, WAN IP, uptime (seconds), Wi-Fi state.
const huawei = single(
  "huawei_lte",
  { name: "B535-232", model: "B535-232", sw_version: "11.0.5.3" },
  [
    ["sensor.b535_232_current_download_rate", "current_download_rate", "6450000", { unit_of_measurement: "B/s", device_class: "data_rate", state_class: "measurement" }, "Current download rate"],
    ["sensor.b535_232_current_upload_rate", "current_upload_rate", "780000", { unit_of_measurement: "B/s", device_class: "data_rate", state_class: "measurement" }, "Current upload rate"],
    ["binary_sensor.b535_232_mobile_connection", "mobile_connection", "on", { device_class: "connectivity" }, "Mobile connection"],
    ["sensor.b535_232_wan_ip_address", "wan_ip_address", "100.72.18.4", {}, "WAN IP address"],
    ["sensor.b535_232_uptime", "uptime", "561600", { unit_of_measurement: "s", device_class: "duration" }, "Uptime"],
    ["binary_sensor.b535_232_wi_fi_status", "wifi_status", "on", {}, "Wi-Fi status"],
    ["button.b535_232_restart", null, "unknown", RESTART, "Restart"],
  ],
  CLIENTS
);

// Starlink, starlink integration: throughput (Mbit/s), last restart, connectivity, reboot.
const starlink = single(
  "starlink",
  { name: "Starlink", model: "Starlink", sw_version: "2026.10.30.mr1" },
  [
    ["sensor.starlink_downlink_throughput", "downlink_throughput", "182.4", { unit_of_measurement: "Mbit/s", device_class: "data_rate", state_class: "measurement" }, "Downlink throughput"],
    ["sensor.starlink_uplink_throughput", "uplink_throughput", "21.7", { unit_of_measurement: "Mbit/s", device_class: "data_rate", state_class: "measurement" }, "Uplink throughput"],
    ["sensor.starlink_last_restart", "last_restart", BOOT, { device_class: "timestamp" }, "Last restart"],
    ["binary_sensor.starlink_connectivity", null, "on", { device_class: "connectivity" }, "Connectivity"],
    ["button.starlink_restart", null, "unknown", RESTART, "Restart"],
  ]
);

// ZTE Hyperbox, zte_hyperbox integration: rates and restart button, matched by their kind.
const zte = single(
  "zte_hyperbox",
  { name: "ZTE MC8810", model: "MC8810" },
  [
    ["sensor.zte_mc8810_download_rate", null, "5120", { unit_of_measurement: "kB/s", device_class: "data_rate", state_class: "measurement" }, "Download rate"],
    ["sensor.zte_mc8810_upload_rate", null, "640", { unit_of_measurement: "kB/s", device_class: "data_rate", state_class: "measurement" }, "Upload rate"],
    ["binary_sensor.zte_mc8810_connected", null, "on", { device_class: "connectivity" }, "Connected"],
    ["button.zte_mc8810_reboot", null, "unknown", RESTART, "Reboot"],
  ]
);

export const operators = {
  livebox: { ...livebox, config: {} },
  sfr: { ...sfr, config: {} },
  bbox,
  fritz: { ...fritz, config: {} },
  vodafone: { ...vodafone, config: {} },
  swisscom: { ...swisscomAll, config: {} },
  sagemcom: { ...sagemcom, config: {} },
  kpn: { ...kpn, config: {} },
  huawei: { ...huawei, config: {} },
  starlink: { ...starlink, config: {} },
  zte: { ...zte, config: {} },
};
