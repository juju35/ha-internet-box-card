// Mock Home Assistant states, entity registry and device registry shaped like the Freebox integration,
// used to render screenshots.
const ROUTER = "dev_router";
const DISK = "dev_disk";
const ENTRY = "entry_freebox";
// Fixed clock, so the screenshots do not change with the day they are taken: the screenshot script sets
// the page clock to NOW. The boot date is naive, as the integration gives it, in the UTC time zone of the
// mock Home Assistant (config.time_zone in the screenshot script): uptime 10 d 12 h 49 min.
export const NOW = "2026-10-20T12:00:00Z";
const boot = new Date(Date.parse(NOW) - (10 * 86400 + 12 * 3600 + 49 * 60) * 1000).toISOString().slice(0, 19);

export const devices = {
  [ROUTER]: {
    id: ROUTER,
    name: "Freebox v9 (r1)",
    model: "Freebox v9 (r1)",
    model_id: "fbxgw9-r1",
    sw_version: "4.13.1",
    config_entries: [ENTRY],
  },
  [DISK]: { id: DISK, name: "Disk 1000", model: "Samsung SSD 990 PRO 1TB", via_device_id: ROUTER, config_entries: [ENTRY] },
};

// [entity id, device, translation key, state, attributes]
const raw = [
  ["sensor.freebox_download_speed", ROUTER, "rate_down", "48475.2", { unit_of_measurement: "kB/s", device_class: "data_rate" }, "Download speed"],
  ["sensor.freebox_upload_speed", ROUTER, "rate_up", "2348.75", { unit_of_measurement: "kB/s", device_class: "data_rate" }, "Upload speed"],
  ["sensor.freebox_missed_calls", ROUTER, "missed", "2", { unit_of_measurement: "calls" }, "Missed calls"],
  ["button.freebox_mark_calls_as_read", ROUTER, "mark_calls_as_read", "unknown", {}, "Mark calls as read"],
  ["button.freebox_reboot", ROUTER, "reboot", "unknown", { device_class: "restart" }, "Reboot"],
  ["switch.freebox_wifi", ROUTER, "wifi", "on", {}, "Wi-Fi"],
  ["sensor.freebox_temperature_cpu_0", ROUTER, null, "59", { unit_of_measurement: "°C", device_class: "temperature" }, "Temperature CPU 0"],
  ["sensor.freebox_temperature_cpu_1", ROUTER, null, "57", { unit_of_measurement: "°C", device_class: "temperature" }, "Temperature CPU 1"],
  ["sensor.freebox_temperature_cpu_2", ROUTER, null, "59", { unit_of_measurement: "°C", device_class: "temperature" }, "Temperature CPU 2"],
  ["sensor.freebox_temperature_cpu_3", ROUTER, null, "57", { unit_of_measurement: "°C", device_class: "temperature" }, "Temperature CPU 3"],
  ["sensor.freebox_temperature_1", ROUTER, null, "55", { unit_of_measurement: "°C", device_class: "temperature" }, "Temperature 1"],
  ["sensor.freebox_v9_r1_fan_1", ROUTER, null, "720", { unit_of_measurement: "rpm" }, "Fan 1"],
  ["sensor.disk_1000_freebox_free_space", DISK, "partition_free_space", "62.4", { unit_of_measurement: "%" }, "Freebox free space"],
  [
    "device_tracker.freebox_v9_r1",
    ROUTER,
    null,
    "home",
    {
      source_type: "router",
      IPv4: "203.0.113.42",
      IPv6: "2001:db8:e66:a2c0::1",
      connection_type: "ftth",
      uptime: boot,
      firmware_version: "4.13.1",
    },
    "Freebox v9 (r1)",
  ],
];

const CLIENTS = [
  ["nas", "home"],
  ["tv", "home"],
  ["laptop", "home"],
  ["phone", "home"],
  ["camera", "home"],
  ["tablet", "not_home"],
];

export const states = {};
export const entities = {};
for (const [id, device_id, key, state, attributes, name] of raw) {
  const friendly_name = `${devices[device_id].name} ${name}`;
  states[id] = { entity_id: id, state, attributes: { ...attributes, friendly_name } };
  entities[id] = { entity_id: id, platform: "freebox", device_id, ...(key ? { translation_key: key } : {}) };
}
for (const [name, state] of CLIENTS) {
  const device_id = `dev_${name}`;
  const id = `device_tracker.${name}`;
  devices[device_id] = { id: device_id, name, config_entries: [ENTRY] };
  states[id] = { entity_id: id, state, attributes: { source_type: "router", friendly_name: name } };
  entities[id] = { entity_id: id, platform: "freebox", device_id };
}

// The last Speedtest.net test (its own integration, no device of the box): shown in the network section, with the
// button that runs a new one.
for (const [key, state, unit] of [
  ["download", "845.2", "Mbit/s"],
  ["upload", "512.6", "Mbit/s"],
  ["ping", "9.4", "ms"],
]) {
  const id = `sensor.speedtest_${key}`;
  const at = "2026-10-20T06:00:00Z";
  states[id] = { entity_id: id, state, attributes: { unit_of_measurement: unit, friendly_name: `Speedtest ${key}` }, last_changed: at, last_updated: at, last_reported: at };
  entities[id] = { entity_id: id, platform: "speedtestdotnet", translation_key: key };
}
