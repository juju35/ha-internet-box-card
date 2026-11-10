// Discovery of the integrations added after the French operators: each mock is shaped like what the integration
// really creates (translation keys, device classes, units), and the box must get the slots the card shows.
import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { discover, listBoxes, boxModel, brandOf, bootSec, lineOf, InternetBoxCard, InternetBoxMiniCard } = load("internet-box-card.js", [
  "InternetBoxCard",
  "InternetBoxMiniCard",
  "discover",
  "listBoxes",
  "boxModel",
  "brandOf",
  "bootSec",
  "lineOf",
]);

// [entity id, translation key or null, state, attributes, device id (default: the box)].
const hassOf = (platform, device, rows, clients = []) => {
  const states = {};
  const entities = {};
  const devices = { box: { id: "box", config_entries: ["entry"], ...device } };
  for (const [id, key, state, attributes = {}, dev = "box"] of rows) {
    states[id] = { entity_id: id, state, attributes };
    entities[id] = { entity_id: id, platform, device_id: dev, ...(key ? { translation_key: key } : {}) };
  }
  for (const name of clients) {
    const id = `device_tracker.${name}`;
    devices[`dev_${name}`] = { id: `dev_${name}`, name, config_entries: ["entry"] };
    states[id] = { entity_id: id, state: "home", attributes: { source_type: "router" } };
    entities[id] = { entity_id: id, platform, device_id: `dev_${name}` };
  }
  return { states, entities, devices, config: { time_zone: "UTC" } };
};

test("FRITZ!Box: traffic rates, DSL sync, WAN, IPs, uptime, main Wi-Fi, reboot (not the reconnect button)", () => {
  const hass = hassOf(
    "fritz",
    { name: "FRITZ!Box 7590", model: "FRITZ!Box 7590", sw_version: "8.02" },
    [
      ["sensor.fritz_download", "kb_s_received", "1250", { unit_of_measurement: "kB/s", device_class: "data_rate" }],
      ["sensor.fritz_upload", "kb_s_sent", "300", { unit_of_measurement: "kB/s", device_class: "data_rate" }],
      ["sensor.fritz_link_down", "link_kb_s_received", "250000", { unit_of_measurement: "kbit/s", device_class: "data_rate" }],
      ["sensor.fritz_link_up", "link_kb_s_sent", "40000", { unit_of_measurement: "kbit/s", device_class: "data_rate" }],
      ["binary_sensor.fritz_connection", "is_connected", "on", { device_class: "connectivity" }],
      ["sensor.fritz_external_ip", "external_ip", "203.0.113.7"],
      ["sensor.fritz_external_ipv6", "external_ipv6", "2001:db8::7"],
      ["sensor.fritz_last_restart", null, "2026-11-01T10:00:00+00:00", { device_class: "uptime" }],
      ["sensor.fritz_cpu_temperature", "cpu_temperature", "61", { unit_of_measurement: "°C", device_class: "temperature" }],
      ["switch.fritz_wi_fi_main_2_4ghz", "wi_fi_main_2_4ghz", "on"],
      ["switch.fritz_wi_fi_guest", "wi_fi_guest", "off"],
      ["button.fritz_reconnect", "reconnect", "unknown", { device_class: "restart" }],
      ["button.fritz_restart", null, "unknown", { device_class: "restart" }],
    ],
    ["laptop", "phone"]
  );
  const box = discover(hass);
  assert.equal(box.operator.platform, "fritz");
  assert.equal(box.scalars.rate_down, "sensor.fritz_download");
  assert.equal(box.scalars.rate_up, "sensor.fritz_upload");
  assert.equal(box.scalars.sync_down, "sensor.fritz_link_down");
  assert.equal(box.scalars.wan, "binary_sensor.fritz_connection");
  assert.equal(box.scalars.ip, "sensor.fritz_external_ip");
  assert.equal(box.scalars.ip6, "sensor.fritz_external_ipv6");
  assert.equal(box.scalars.boot, "sensor.fritz_last_restart");
  assert.equal(box.scalars.wifi, "switch.fritz_wi_fi_main_2_4ghz");
  assert.equal(box.scalars.reboot, "button.fritz_restart");
  assert.equal(box.temps.length, 1);
  assert.equal(box.trackers.length, 2);
  assert.equal(box.lineType, "DSL");
  assert.equal(boxModel(box, {}).name, "FRITZ!Box 7590");
  assert.equal(boxModel(box, {}).pic, "generic_router");
  assert.equal(boxModel({ ...box, device: { model: "FRITZ!Box 6690 Cable" } }, {}).id, "fritz_box_cable");
});

test("Vodafone Station: rates, IPs, active connection, uptime, main Wi-Fi, reboot among the reconnect buttons", () => {
  const hass = hassOf("vodafone_station", { name: "Vodafone Station", model: "SHG3060" }, [
    ["sensor.vf_down", "down_stream", "900", { unit_of_measurement: "kB/s", device_class: "data_rate" }],
    ["sensor.vf_up", "up_stream", "120", { unit_of_measurement: "kB/s", device_class: "data_rate" }],
    ["sensor.vf_ip", "external_ipv4", "198.51.100.4"],
    ["sensor.vf_link", "active_connection", "fiber", { device_class: "enum" }],
    ["sensor.vf_uptime", null, "2026-11-08T00:00:00+00:00", { device_class: "uptime" }],
    ["switch.vf_main", "main", "on"],
    ["switch.vf_guest", "guest", "off"],
    ["button.vf_fiber_reconnect", "fiber_reconnect", "unknown", { device_class: "restart" }],
    ["button.vf_restart", null, "unknown", { device_class: "restart" }],
  ]);
  const box = discover(hass);
  assert.equal(box.scalars.rate_down, "sensor.vf_down");
  assert.equal(box.scalars.ip, "sensor.vf_ip");
  assert.equal(box.scalars.infra, "sensor.vf_link");
  assert.equal(box.scalars.boot, "sensor.vf_uptime");
  assert.equal(box.scalars.wifi, "switch.vf_main");
  assert.equal(box.scalars.reboot, "button.vf_restart");
  assert.equal(boxModel(box, {}).id, "vodafone_power_station");
  assert.equal(lineOf("FIBER"), "fibre");
});

test("Swisscom Internet-Box: the integration is the box, its connected devices counted", () => {
  const hass = hassOf("swisscom", {}, [], ["tv", "phone", "laptop"]);
  delete hass.devices.box;
  assert.equal(JSON.stringify(listBoxes(hass)), JSON.stringify([{ value: "platform:swisscom", label: "Swisscom Internet-Box" }]));
  const box = discover(hass);
  assert.equal(box.id, "platform:swisscom");
  assert.equal(box.trackers.length, 3);
  assert.equal(boxModel(box, {}).id, "internet_box");
});

test("Sagemcom F@st: the box is found by its reboot button, and its model gives the provider's branding", () => {
  const hass = hassOf(
    "sagemcom_fast",
    { name: "Sagemcom F@st 5689", model: "F@st 5689", configuration_url: "http://192.168.2.1" },
    [["button.fast_reboot", null, "unknown", { device_class: "restart" }]],
    ["phone"]
  );
  assert.equal(listBoxes(hass)[0].value, "box");
  const box = discover(hass);
  assert.equal(box.scalars.reboot, "button.fast_reboot");
  assert.equal(box.trackers.length, 1);
  assert.equal(boxModel(box, {}).id, "bell_home_hub_4000");
  const brand = brandOf(box, {});
  assert.equal(brand.name, "Bell");
  assert.equal(brand.color, "#00549a");
  // An unknown F@st keeps the integration's own branding and the device's model as its name.
  const other = { ...box, device: { model: "F@st 9999" } };
  assert.equal(brandOf(other, {}).name, "Sagemcom F@st");
  assert.equal(boxModel(other, {}).name, "F@st 9999");
});

test("KPN Box 12 on the Livebox integration is branded KPN", () => {
  const hass = hassOf("livebox", { name: "KPN Box 12", model: "KPN Box 12" }, [
    ["sensor.kpn_down", "down_rate", "100", { unit_of_measurement: "Mbit/s" }],
  ]);
  const box = discover(hass);
  assert.equal(boxModel(box, {}).id, "kpn_box_12");
  assert.equal(brandOf(box, {}).name, "KPN");
  assert.equal(brandOf(box, {}).website, "https://www.kpn.com");
});

test("Huawei LTE: rates, mobile connection, WAN IP, uptime in seconds, read-only Wi-Fi state", () => {
  const hass = hassOf("huawei_lte", { name: "B535-232", model: "B535-232" }, [
    ["sensor.hw_down", "current_download_rate", "52000", { unit_of_measurement: "B/s", device_class: "data_rate" }],
    ["sensor.hw_up", "current_upload_rate", "9000", { unit_of_measurement: "B/s", device_class: "data_rate" }],
    ["binary_sensor.hw_mobile", "mobile_connection", "on", { device_class: "connectivity" }],
    ["sensor.hw_ip", "wan_ip_address", "10.20.30.40"],
    ["sensor.hw_uptime", "uptime", "7200", { unit_of_measurement: "s", device_class: "duration" }],
    ["binary_sensor.hw_wifi", "wifi_status", "on"],
    ["button.hw_restart", null, "unknown", { device_class: "restart" }],
  ]);
  const box = discover(hass);
  assert.equal(box.scalars.wan, "binary_sensor.hw_mobile");
  assert.equal(box.scalars.boot, "sensor.hw_uptime");
  assert.equal(box.scalars.wifi, "binary_sensor.hw_wifi");
  assert.equal(box.scalars.reboot, "button.hw_restart");
  assert.equal(boxModel(box, {}).name, "Huawei B535-232");
  assert.equal(bootSec(hass.states["sensor.hw_uptime"]), 7200);
  assert.equal(lineOf(box.operator.line), "mobile");
});

test("Starlink: throughput in bit/s, last restart, connectivity without key, reboot", () => {
  const hass = hassOf("starlink", { name: "Starlink", model: "Starlink" }, [
    ["sensor.sl_down", "downlink_throughput", "120.5", { unit_of_measurement: "Mbit/s", device_class: "data_rate" }],
    ["sensor.sl_up", "uplink_throughput", "15.2", { unit_of_measurement: "Mbit/s", device_class: "data_rate" }],
    ["sensor.sl_restart", "last_restart", "2026-11-09T00:00:00+00:00", { device_class: "timestamp" }],
    ["binary_sensor.sl_connection", null, "on", { device_class: "connectivity" }],
    ["binary_sensor.sl_obstructed", "currently_obstructed", "off", { device_class: "problem" }],
    ["button.sl_reboot", null, "unknown", { device_class: "restart" }],
  ]);
  const box = discover(hass);
  assert.equal(box.scalars.rate_down, "sensor.sl_down");
  assert.equal(box.scalars.boot, "sensor.sl_restart");
  assert.equal(box.scalars.wan, "binary_sensor.sl_connection");
  assert.equal(box.scalars.reboot, "button.sl_reboot");
  assert.equal(lineOf(box.operator.line), "satellite");
  assert.equal(boxModel(box, {}).pic, "generic_dish");
});

test("ZTE Hyperbox: rates guessed from the data-rate sensors, connectivity and restart button by device class", () => {
  const hass = hassOf("zte_hyperbox", { name: "ZTE MC8810", model: "MC8810" }, [
    ["sensor.zte_download_rate", null, "3000", { unit_of_measurement: "kB/s", device_class: "data_rate" }],
    ["sensor.zte_upload_rate", null, "400", { unit_of_measurement: "kB/s", device_class: "data_rate" }],
    ["binary_sensor.zte_connected", null, "on", { device_class: "connectivity" }],
    ["button.zte_reboot", null, "unknown", { device_class: "restart" }],
  ]);
  const box = discover(hass);
  assert.equal(box.scalars.rate_down, "sensor.zte_download_rate");
  assert.equal(box.scalars.rate_up, "sensor.zte_upload_rate");
  assert.equal(box.scalars.wan, "binary_sensor.zte_connected");
  assert.equal(box.scalars.reboot, "button.zte_reboot");
});

test("Bbox (core or custom_bbox fork): the uptime sensor, a boot date, is read with the rates", () => {
  const states = Object.fromEntries(
    [
      ["sensor.bbox_currently_used_download_bandwidth", "300", { unit_of_measurement: "Mbit/s" }],
      ["sensor.bbox_currently_used_upload_bandwidth", "40", { unit_of_measurement: "Mbit/s" }],
      ["sensor.bbox_uptime", "2026-11-01T00:00:00+00:00", { device_class: "timestamp" }],
    ].map(([id, state, attributes]) => [id, { entity_id: id, state, attributes }])
  );
  const box = discover({ states, entities: {}, devices: {} });
  assert.equal(box.scalars.rate_down, "sensor.bbox_currently_used_download_bandwidth");
  assert.equal(box.scalars.boot, "sensor.bbox_uptime");
  assert.ok(bootSec(states["sensor.bbox_uptime"]) > 0);
});

const renderWith = (Card, hass, config = {}) => {
  const el = new Card();
  el._config = config;
  el._hass = { ...hass, language: "en" };
  return el._render();
};

test("the full and mini cards render the new boxes: external IP, uptime sensor, provider colour and links", () => {
  const hass = hassOf("huawei_lte", { name: "B535-232", model: "B535-232" }, [
    ["sensor.hw_down", "current_download_rate", "52000", { unit_of_measurement: "B/s", device_class: "data_rate" }],
    ["sensor.hw_up", "current_upload_rate", "9000", { unit_of_measurement: "B/s", device_class: "data_rate" }],
    ["sensor.hw_ip", "wan_ip_address", "10.20.30.40"],
    ["sensor.hw_uptime", "uptime", "93600", { unit_of_measurement: "s", device_class: "duration" }],
    ["binary_sensor.hw_wifi", "wifi_status", "on"],
  ]);
  const html = renderWith(InternetBoxCard, hass);
  assert.match(html, /--ibc-red:#c7000b/);
  assert.match(html, /10\.20\.30\.40/);
  assert.match(html, /data-entity="sensor\.hw_uptime"/);
  assert.match(html, /Huawei B535-232/);
  // The Huawei Wi-Fi state is read only: no on / off switch.
  assert.doesNotMatch(html, /data-action="wifi"/);
  assert.match(renderWith(InternetBoxMiniCard, hass), /data-key="uptime"/);

  const bell = hassOf(
    "sagemcom_fast",
    { name: "Sagemcom F@st 5689", model: "F@st 5689", configuration_url: "http://192.168.2.1" },
    [["button.fast_reboot", null, "unknown", { device_class: "restart" }]],
    ["phone"]
  );
  const b = renderWith(InternetBoxCard, bell);
  assert.match(b, /--ibc-red:#00549a/);
  assert.match(b, /href="https:\/\/www\.bell\.ca"/);
  assert.match(b, /Bell Home Hub 4000/);

  const swisscom = hassOf("swisscom", {}, [], ["tv", "phone"]);
  delete swisscom.devices.box;
  assert.match(renderWith(InternetBoxCard, swisscom), /Internet-Box/);
});

test("the generic pictures take the provider's colour, the French operators' drawings keep their own", () => {
  const { modelPic, OPERATORS, IMG_BOX } = load("internet-box-card.js", ["modelPic", "OPERATORS", "IMG_BOX"]);
  const fritz = OPERATORS.fritz.models.find((m) => m.id === "fritz_box");
  const tinted = decodeURIComponent(modelPic(fritz, "#1f6fd1"));
  assert.match(tinted, /#1f6fd1/);
  assert.equal(modelPic(fritz, "#1f6fd1"), modelPic(fritz, "#1f6fd1"));
  assert.equal(modelPic(fritz), IMG_BOX.generic_router);
  const livebox = OPERATORS.livebox.models.find((m) => m.id === "livebox_7");
  assert.equal(modelPic(livebox, "#ff7900"), IMG_BOX.livebox_7);
});

test("Vodafone: the active connection gives the status pill; the title's own device name is not repeated", () => {
  const hass = hassOf("vodafone_station", { name: "Vodafone Station", model: "SHG3060" }, [
    ["sensor.vf_down", "down_stream", "900", { unit_of_measurement: "kB/s", device_class: "data_rate" }],
    ["sensor.vf_link", "active_connection", "internet_key", { device_class: "enum" }],
  ]);
  const html = renderWith(InternetBoxCard, hass);
  assert.match(html, /chip status clickable ok[^>]*data-entity="sensor\.vf_link"/);
  assert.match(html, /Online · INTERNET KEY/);
  assert.equal(lineOf("INTERNET KEY"), "mobile");
  // Unknown line: no pill rather than a guess.
  hass.states["sensor.vf_link"].state = "unknown";
  assert.doesNotMatch(renderWith(InternetBoxCard, hass), /chip status/);

  const hw = hassOf("huawei_lte", { name: "B535-232", model: "B535-232", sw_version: "11.0.5.3" }, [
    ["sensor.hw_down", "current_download_rate", "52000", { unit_of_measurement: "B/s", device_class: "data_rate" }],
  ]);
  const sub = renderWith(InternetBoxCard, hw).match(/<div class="parts">(.*?)<\/div>/)[1];
  assert.doesNotMatch(sub, /B535-232/);
  assert.match(sub, /11\.0\.5\.3/);
});
