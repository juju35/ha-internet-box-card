// ---------------------------------------------------------------------------
// Entity discovery
// ---------------------------------------------------------------------------
import { BRANDS, MODELS, OPERATORS } from "./core.js";

export const _cache = new WeakMap();
export const _entries = new WeakMap();

export const deviceName = (dev) => dev && (dev.name_by_user || dev.name);

/** Friendly name of an entity without its device name ("Freebox v9 (r1) Température CPU 0" -> "Température CPU 0").
 *  The literal "Freebox" prefix covers the legacy Freebox integration, whose entities carry it without a device name. */
export const shortName = (hass, id, dev) => {
  const name = hass.states[id]?.attributes?.friendly_name || id.split(".")[1];
  for (const prefix of [dev?.name_by_user, dev?.name, "Freebox"]) {
    if (prefix && name.startsWith(`${prefix} `)) return name.slice(prefix.length + 1);
  }
  return name;
};

/** Without the device registry: keep the end of the name from its first temperature / fan word. */
export const tail = (hass, id) => {
  const name = shortName(hass, id);
  return name.match(/(temp[ée]rature|temp\.|ventilateur|fan)\b.*$/i)?.[0] || name;
};

/** Registry entries of every supported operator, or [] when the registry is not exposed. */
export let _withState; // last registry() result, keyed by the identity of hass.entities and hass.states
export const registry = (hass) => {
  if (!hass.entities) return [];
  // The scan of the whole registry is cached on hass.entities, replaced only when the registry changes.
  let all = _entries.get(hass.entities);
  if (!all) {
    all = Object.values(hass.entities).filter((e) => OPERATORS[e.platform] && !e.hidden);
    _entries.set(hass.entities, all);
  }
  // registry() is called several times per discover() pass (listBoxes, legacyBoxes, opOfDevice):
  // reuse the filtered list while hass.entities and hass.states are the same objects.
  if (_withState && _withState.entities === hass.entities && _withState.states === hass.states) return _withState.list;
  const list = all.filter((e) => hass.states[e.entity_id]);
  _withState = { entities: hass.entities, states: hass.states, list };
  return list;
};

/** True when the entity's translation key matches the operator's alternate pattern for a slot: a rate slot (Livebox
 *  fibre, a sensor) or the Wi-Fi (the FRITZ!Box main Wi-Fi switches, one per band). */
export const isAlt = (op, e, slot) =>
  !!(op.alt?.[slot] && (!/^rate_/.test(slot) || e.entity_id.startsWith("sensor.")) && op.alt[slot].test(e.translation_key || ""));
/** True when the entity is the WAN interface's rate for a slot under a translation key shared by every interface
 *  (Livebox 3.0.0 `interface_rate_rx`): the interface is read from the entity id (see `altIface`). */
export const isIfaceRate = (op, e, slot) =>
  !!(op.altIface?.keys[slot] && e.translation_key === op.altIface.keys[slot] && e.entity_id.startsWith("sensor.") &&
    op.altIface.re.test(e.entity_id.slice(e.entity_id.indexOf(".") + 1)));
export const isAltRate = (op, e, slot) => isAlt(op, e, slot) || isIfaceRate(op, e, slot);

// Integrations whose keys the card does not know (`guess`): rate sensors told apart by their translation key or id.
export const GUESS_DOWN = /down|rx\b|_rx|receiv/i;
export const GUESS_UP = /(^|[^a-z])up(load|link|_|$)|tx\b|_tx|sent|send/i;
/** "down" / "up" for a data-rate sensor of a `guess` operator, by its translation key or entity id, else null. */
export const guessRate = (hass, e) => {
  if (!e.entity_id.startsWith("sensor.") || hass.states[e.entity_id]?.attributes?.device_class !== "data_rate") return null;
  const name = `${e.translation_key || ""} ${e.entity_id}`;
  return GUESS_DOWN.test(name) ? "down" : GUESS_UP.test(name) ? "up" : null;
};

/** True when an entity is the operator's "download rate" sensor (by translation key, an alternate key pattern, or
 *  entity id for a legacy one), or its downstream line sync rate for an operator without throughput sensors (SFR Box). */
export const isRateDown = (op, e) =>
  (op.keys.rate_down && e.translation_key === op.keys.rate_down) ||
  (!e.translation_key && !!op.ids?.rate_down?.test(e.entity_id)) ||
  (op.keys.sync_down && e.translation_key === op.keys.sync_down) ||
  isAltRate(op, e, "rate_down") ||
  (op.legacy?.rate_down?.test(e.entity_id));

/** Slot of a box entity without translation key matched by the operator's entity-id suffixes (hass-bbox2), or undefined. */
export const idSlot = (op, id) => op.ids && Object.keys(op.ids).find((slot) => op.ids[slot].test(id));

/** True when an entity marks the box device: its download rate (see isRateDown), else one of the operator's own box
 *  entities (`anchorKeys`: the Livebox WAN status and restart button), else, for an integration whose box has no rate
 *  sensor, its restart button (Sagemcom F@st), or a guessed download rate (ZTE Hyperbox). */
export const isAnchor = (hass, op, e) =>
  isRateDown(op, e) ||
  (!!e.translation_key && !!op.anchorKeys?.includes(e.translation_key)) ||
  (op.anchorRestart && e.entity_id.startsWith("button.") && !e.translation_key && hass.states[e.entity_id]?.attributes?.device_class === "restart") ||
  (op.guess && guessRate(hass, e) === "down");

/** Boxes of the integrations that expose no entity for the box itself, only trackers (Swisscom): the integration is
 *  the box, keyed "platform:<integration>". */
export const trackerBoxes = (hass) => {
  const out = [];
  for (const op of Object.values(OPERATORS)) {
    if (op.trackersOnly && registry(hass).some((e) => e.platform === op.platform && e.entity_id.startsWith("device_tracker.")))
      out.push({ value: `platform:${op.platform}`, label: op.name });
  }
  return out;
};

/** The operator of a device, from the platform of its registry entities, or undefined. */
export const opOfDevice = (hass, deviceId) => {
  for (const e of registry(hass)) if (e.device_id === deviceId) return OPERATORS[e.platform];
  return undefined;
};

/** Entity ids in hass.states that match a legacy operator's download / upload patterns (Bbox has no registry).
 *  The result depends only on the set of entity ids, not on the states, but hass.states is replaced on every
 *  state change: the regex scan of all ids is cached and reused while the set of ids looks unchanged (same
 *  count and every cached match still present — entity additions and removals change the count). */
export let _legacyIds; // { count, ids (sorted) }
export const legacyStateIds = (hass) => {
  const states = hass.states || {};
  const keys = Object.keys(states);
  const hit = _legacyIds;
  if (hit && hit.count === keys.length && hit.ids.every((id) => id in states)) return hit.ids;
  const out = [];
  for (const op of Object.values(OPERATORS)) {
    if (!op.legacy) continue;
    for (const id of keys) if (op.legacy.rate_down?.test(id) || op.legacy.rate_up?.test(id)) out.push(id);
  }
  out.sort();
  _legacyIds = { count: keys.length, ids: out };
  return out;
};

/** Legacy operators have no entity registry (no unique_id): their box is found in hass.states by the entity-id
 *  pattern, keyed by the entity-id prefix left once the "download rate" suffix is removed. */
export const legacyBoxes = (hass) => {
  const seen = new Map();
  for (const op of Object.values(OPERATORS)) {
    if (!op.legacy?.rate_down) continue;
    for (const id of Object.keys(hass.states || {})) {
      const m = op.legacy.rate_down.exec(id);
      if (m) {
        const prefix = id.slice(0, m.index) || id;
        if (!seen.has(prefix)) seen.set(prefix, op.name);
      }
    }
  }
  // Several legacy boxes of one operator (`name: Bbox`, `name: Bbox Salon`) get the prefix in their label.
  const names = [...seen.values()];
  return [...seen.entries()].map(([value, name]) => ({
    value,
    label: names.filter((n) => n === name).length > 1 ? `${name} (${value})` : name,
  }));
};

/** True when a legacy pattern matches the entity id right after the box prefix: "sensor.bbox" must not claim
 *  "sensor.bbox_salon_currently_used_download_bandwidth", whose suffix starts further on. */
export const legacyOwn = (re, id, prefix) => !!re && id.startsWith(prefix) && re.exec(id)?.index === prefix.length;

/** List the boxes of every operator: the devices of their "download rate" sensors, plus legacy boxes from states. */
export const listBoxes = (hass) => {
  const seen = new Map();
  for (const e of registry(hass)) {
    const op = OPERATORS[e.platform];
    if (op && isAnchor(hass, op, e) && e.device_id && !seen.has(e.device_id))
      seen.set(e.device_id, deviceName(hass.devices?.[e.device_id]) || e.device_id);
  }
  const list = [...seen.entries()].map(([value, label]) => ({ value, label }));
  for (const b of [...legacyBoxes(hass), ...trackerBoxes(hass)]) if (!seen.has(b.value)) list.push(b);
  return list;
};

/** Fill a box from hass.states for a legacy operator (no registry, no device): only the download / upload rates. */
export const fillLegacy = (hass, box, prefix) => {
  const op = Object.values(OPERATORS).find(
    (o) => o.legacy?.rate_down && Object.keys(hass.states).some((id) => legacyOwn(o.legacy.rate_down, id, prefix))
  );
  if (!op) return;
  box.id = prefix;
  box.operator = op;
  box.device = null;
  for (const id of Object.keys(hass.states).sort()) {
    if (legacyOwn(op.legacy.rate_down, id, prefix)) box.scalars.rate_down = id;
    else if (legacyOwn(op.legacy.rate_up, id, prefix)) box.scalars.rate_up = id;
    else if (legacyOwn(op.legacy.boot, id, prefix)) box.scalars.boot = id;
  }
};

/** Fill a box of an integration that only has trackers (Swisscom): every tracker of the integration is counted. */
export const fillTrackers = (hass, box, value) => {
  const op = OPERATORS[value.slice("platform:".length)];
  if (!op) return;
  box.id = value;
  box.operator = op;
  box.device = null;
  box.trackers = registry(hass)
    .filter((e) => e.platform === op.platform && e.entity_id.startsWith("device_tracker."))
    .map((e) => e.entity_id)
    .sort();
};

export const emptyBox = () => ({ id: null, device: null, operator: null, lineType: null, scalars: {}, temps: [], fans: [], partitions: [], raids: [], trackers: [] });

/**
 * Map the entities of one box to a structured object of entity ids. The result is cached on the
 * registries (hass.entities, hass.devices) and the list of the operators' entities that have a state, not on
 * hass.states, which Home Assistant replaces on every state change.
 */
// The last speed test: download, upload (Mbit/s) and ping (ms) sensors, by translation key, of the Speedtest.net
// integration (else of Fast.com, download only). Not part of the box: the same for every box card. The `entities`
// option's `speedtest` sets the sensors of another speed test (LibreSpeed, Speedtest Tracker…), and `run` the entity
// that starts one (a button, a script…).
export const SPEEDTEST_KEYS = ["download", "upload", "ping"];
export const SPEEDTEST_PLATFORMS = ["speedtestdotnet", "fastdotcom"];
export const isEntityId = (v) => typeof v === "string" && /^[a-z_]+\.[a-z0-9_]+$/.test(v);
export const discoverSpeedtest = (hass, config) => {
  const byPlatform = {};
  for (const e of Object.values(hass.entities || {})) {
    if (!SPEEDTEST_PLATFORMS.includes(e.platform) || e.hidden || !e.entity_id.startsWith("sensor.") || !SPEEDTEST_KEYS.includes(e.translation_key)) continue;
    if (hass.states[e.entity_id]) (byPlatform[e.platform] ??= {})[e.translation_key] = e.entity_id;
  }
  const found = { ...(byPlatform.speedtestdotnet || byPlatform.fastdotcom || {}) };
  const own = config?.entities?.speedtest;
  if (own && typeof own === "object") {
    const chosen = SPEEDTEST_KEYS.filter((k) => isEntityId(own[k]));
    // Sensors of another speed test: theirs only, not mixed with Speedtest.net's
    if (chosen.length) for (const k of SPEEDTEST_KEYS) found[k] = isEntityId(own[k]) ? own[k] : undefined;
  }
  for (const k of SPEEDTEST_KEYS) if (!found[k]) delete found[k];
  if (!found.download && !found.upload) return null;
  // How to start a test: the entity set in `run`, else a refresh of the Speedtest.net / Fast.com sensors (their
  // integration runs a test on it); none for sensors of another speed test without `run`.
  if (isEntityId(own?.run)) found.run = own.run;
  else if (SPEEDTEST_PLATFORMS.includes(hass.entities?.[found.download || found.upload]?.platform)) found.run = found.download || found.upload;
  return found;
};

// The `entities` option's box values: sensors of the user's choice, replacing those found on the box.
export const BOX_KEYS = ["rate_down", "rate_up", "sync_down", "sync_up", "ip", "boot", "wifi", "missed"];
export const withEntitiesCache = new WeakMap();
export const withEntities = (box, entities) => {
  if (!box || !entities || typeof entities !== "object") return box;
  const own = BOX_KEYS.filter((k) => isEntityId(entities[k]));
  if (!own.length) return box;
  const key = own.map((k) => `${k}=${entities[k]}`).join(",");
  const hit = withEntitiesCache.get(box);
  if (hit?.key === key) return hit.result;
  const result = { ...box, scalars: { ...box.scalars, ...Object.fromEntries(own.map((k) => [k, entities[k]])) } };
  withEntitiesCache.set(box, { key, result });
  return result;
};
// The editor's pickers of `entities`, and the option without the ones left empty (none: no option).
export const EDITOR_ENTITIES = new Set(["rate_down", "rate_up", ...SPEEDTEST_KEYS, "run"]);
// A speed test started from the card is shown running until its sensors are written again, at most this long.
export const SPEEDTEST_RUN_MS = 180e3;
// The service that starts a speed test with the `run` entity: a button is pressed, a script or an automation run,
// any other entity refreshed (homeassistant.update_entity).
export const runService = (id) => {
  const domain = id.split(".")[0];
  if (domain === "button" || domain === "input_button") return [domain, "press"];
  if (domain === "script") return ["script", "turn_on"];
  if (domain === "automation") return ["automation", "trigger"];
  return ["homeassistant", "update_entity"];
};
export const cleanEntities = (entities) => {
  if (!entities || typeof entities !== "object") return undefined;
  const out = {};
  for (const [k, v] of Object.entries(entities)) {
    const value = v && typeof v === "object" ? cleanEntities(v) : v;
    if (value !== "" && value !== undefined && value !== null) out[k] = value;
  }
  return Object.keys(out).length ? out : undefined;
};
// The box a card shows: the one found, with the sensors of the `entities` option.
export const boxFor = (hass, config) => withEntities(discover(hass, config?.box), config?.entities);

export const discover = (hass, boxId) => {
  const found = registry(hass);
  const holder = hass.entities || hass.states;
  let byBox = _cache.get(holder);
  if (!byBox) {
    byBox = new Map();
    _cache.set(holder, byBox);
  }
  const key = boxId || "";
  const stamp = found.map((e) => e.entity_id).join(",") + "|" + legacyStateIds(hass).join(",");
  const hit = byBox.get(key);
  if (hit && hit.devices === hass.devices && hit.stamp === stamp) return hit.box;

  const box = emptyBox();
  const entries = [...found].sort((a, b) => a.entity_id.localeCompare(b.entity_id));
  const routers = listBoxes(hass).map((b) => b.value);
  const router = boxId ? (routers.includes(boxId) ? boxId : null) : routers[0];
  const dev = router ? hass.devices?.[router] : null;
  if (router?.startsWith("platform:")) {
    // Integration without a box entity (Swisscom): its trackers only.
    fillTrackers(hass, box, router);
  } else if (router && !dev) {
    // Legacy operator (Bbox): no device, entities found in hass.states by their id pattern.
    fillLegacy(hass, box, router);
  } else if (router && dev) {
    {
      const op = opOfDevice(hass, router) || OPERATORS.freebox;
      const keys = op.keys;
      const legacy = op.legacy;
      const entryIds = new Set(dev?.config_entries || []);
      box.id = router;
      box.device = dev;
      box.operator = op;
      for (const e of entries) {
        const id = e.entity_id;
        const domain = id.split(".")[0];
        const d = hass.devices[e.device_id];
        const own = e.device_id === router;
        const sameEntry = d && (d.config_entries || []).some((c) => entryIds.has(c));
        // Disks are child devices of the router, of its own config entry; client trackers share that entry too.
        // Another integration's device linked to the router (a FRITZ!Box client merged with a NAS by its MAC
        // address, juju35/ha-nas-card#74) is not a child: its entities are left out. Without config entries in
        // the registry (old frontend, tests), the link alone decides.
        const child = d && d.via_device_id === router && (sameEntry || !entryIds.size || !d.config_entries?.length);
        if (e.platform !== op.platform) continue;
        if (domain === "device_tracker") {
          if (own) box.scalars.router = id;
          // Most client trackers have no device (Home Assistant gives one only when another integration
          // registered the MAC address): with a single box, they belong to it.
          else if (sameEntry || (!e.device_id && routers.length === 1)) box.trackers.push(id);
          continue;
        }
        if (!own && !child) continue;
        const k = e.translation_key;
        const a = hass.states[id].attributes;
        // Box sensors without translation key known by their entity-id suffix (hass-bbox2): the first one wins.
        const slot = own && !k ? idSlot(op, id) : undefined;
        if (slot) {
          box.scalars[slot] ??= id;
          continue;
        }
        // Each data slot is matched by the operator's translation key, or by an entity-id pattern for a legacy one.
        // The canonical rate key wins over an alternate one (the alternate only fills an empty slot), and the
        // missed-calls sensor over the total of calls.
        if ((keys.rate_down && k === keys.rate_down) || (legacy?.rate_down?.test(id))) box.scalars.rate_down = id;
        else if ((keys.rate_up && k === keys.rate_up) || (legacy?.rate_up?.test(id))) box.scalars.rate_up = id;
        else if (isAltRate(op, e, "rate_down")) box.scalars.rate_down ??= id;
        else if (isAltRate(op, e, "rate_up")) box.scalars.rate_up ??= id;
        else if (own && op.guess && guessRate(hass, e) === "down") box.scalars.rate_down ??= id;
        else if (own && op.guess && guessRate(hass, e) === "up") box.scalars.rate_up ??= id;
        else if (keys.sync_down && k === keys.sync_down) box.scalars.sync_down = id;
        else if (keys.sync_up && k === keys.sync_up) box.scalars.sync_up = id;
        else if (keys.missed && k === keys.missed) box.scalars.missed = id;
        else if (keys.missed_total && k === keys.missed_total) box.scalars.missed_total = id;
        else if (domain === "binary_sensor" && keys.wan && k === keys.wan) box.scalars.wan = id;
        // A connectivity binary sensor without translation key (Starlink, the guessed ZTE one) when the operator has
        // no keyed WAN sensor.
        else if (own && domain === "binary_sensor" && (op.wanClass || op.guess) && !k && a.device_class === "connectivity") box.scalars.wan ??= id;
        else if (domain === "sensor" && keys.ip && k === keys.ip) box.scalars.ip = id;
        else if (domain === "sensor" && keys.ip6 && k === keys.ip6) box.scalars.ip6 = id;
        else if (domain === "sensor" && keys.boot && k === keys.boot) box.scalars.boot = id;
        // The box uptime sensor without translation key (FRITZ!Box device_uptime, Vodafone sys_uptime): a boot date.
        else if (own && domain === "sensor" && op.bootClass && !k && (a.device_class === "uptime" || a.device_class === "timestamp")) box.scalars.boot ??= id;
        else if (domain === "binary_sensor" && keys.lines?.[k]) {
          box.scalars.line = id;
          box.lineType = keys.lines[k];
        } else if (domain === "sensor" && keys.training && k === keys.training) box.scalars.training = id;
        else if (domain === "sensor" && keys.line_status && k === keys.line_status) box.scalars.line_status = id;
        else if (domain === "sensor" && keys.infra && k === keys.infra) box.scalars.infra = id;
        else if (keys.wifi && k === keys.wifi) box.scalars.wifi = id;
        else if (isAlt(op, e, "wifi")) box.scalars.wifi ??= id;
        else if (own && domain === "button" && keys.mark_read && k === keys.mark_read) box.scalars.mark_read = id;
        // A restart button with a translation key of its own is a reconnect button (FRITZ!Box `reconnect`, Vodafone
        // `dsl_reconnect`…), never the reboot.
        else if (own && domain === "button" && ((keys.reboot && k === keys.reboot) || (!k && a.device_class === "restart"))) box.scalars.reboot = id;
        else if ((keys.partition && k === keys.partition) || (!k && op.childIds?.partition?.test(id))) box.partitions.push({ id, device: d });
        else if ((keys.raid && k === keys.raid) || (!k && op.childIds?.raid?.test(id))) box.raids.push(id);
        // Temperatures: the box's temperature sensors, with a key (FRITZ!Box cpu_temperature) or not (Freebox).
        else if (own && domain === "sensor" && a.device_class === "temperature") box.temps.push({ id, name: shortName(hass, id, dev) });
        else if (own && domain === "sensor" && !k && /^(rpm|tr\/min)$/i.test(a.unit_of_measurement || ""))
          box.fans.push({ id, name: shortName(hass, id, dev) });
        // A fibre sensor (fiber_rx / fiber_tx / fiber_power_*) is proof the line is fibre, for a box whose WAN
        // status gives no usable link_type (juju35/ha-internet-box-card#114).
        else if (own && op.fiberKey && k && op.fiberKey.test(k)) box.lineType ??= "fibre";
      }
      // The DSL line sync rates of a box that has them tell its kind of line (FRITZ!Box on DSL).
      if (op.syncLine && box.scalars.sync_down) box.lineType ??= op.syncLine;
    }
  } else if (!entries.length && !boxId) {
    // No registry (old frontend, tests): fall back on the default English entity ids.
    for (const id of Object.keys(hass.states).sort()) {
      const s = hass.states[id];
      const a = s.attributes || {};
      if (id.startsWith("device_tracker.") && a.connection_type !== undefined && a.firmware_version) box.scalars.router ??= id;
      else if (/^sensor\.freebox.*_download_speed$/.test(id)) box.scalars.rate_down ??= id;
      else if (/^sensor\.freebox.*_upload_speed$/.test(id)) box.scalars.rate_up ??= id;
      else if (/^sensor\.freebox.*_missed_calls$/.test(id)) box.scalars.missed ??= id;
      else if (/^button\.freebox.*_mark_calls_as_read$/.test(id)) box.scalars.mark_read ??= id;
      else if (/^button\.freebox.*_reboot$/.test(id) || (id.startsWith("button.freebox") && a.device_class === "restart")) box.scalars.reboot ??= id;
      else if (/^switch\.freebox.*_wifi$/.test(id)) box.scalars.wifi ??= id;
      else if (/^sensor\.freebox/.test(id) && a.device_class === "temperature") box.temps.push({ id, name: tail(hass, id) });
      else if (/^sensor\.freebox/.test(id) && /^rpm$/i.test(a.unit_of_measurement || "")) box.fans.push({ id, name: tail(hass, id) });
    }
    if (box.scalars.rate_down) {
      box.id = "freebox";
      box.operator = OPERATORS.freebox;
    }
  }
  byBox.set(key, { devices: hass.devices, stamp, box });
  return box;
};

/** Model of the box detected from its device, among its operator's models (Freebox when none is known), or undefined. */
export const detectModel = (box) => {
  const models = box?.operator?.models ?? MODELS;
  const dev = box?.device;
  const ids = [dev?.model_id, dev?.hw_version, dev?.model, dev?.name].filter(Boolean).join(" ");
  return ids ? models.find((m) => m.re.test(ids)) : undefined;
};

/** Model of the box: the one set with the `model` option, else the detected one, else the operator's default model
 *  (an integration without device, whose box has a single kind of picture: Swisscom). A model whose `fromDevice` is
 *  set takes the device's own model as its name (a "FRITZ!Box 7590" rather than "FRITZ!Box"). */
export const boxModel = (box, config) => {
  const models = box?.operator?.models ?? MODELS;
  const m =
    models.find((x) => x.id === config?.model) ??
    detectModel(box) ??
    (box?.operator?.defaultModel ? models.find((x) => x.id === box.operator.defaultModel) : undefined);
  if (!m?.fromDevice) return m;
  const own = box?.device?.model;
  return own ? { ...m, name: /^\s*[a-z]?\d/i.test(own) && m.prefix ? `${m.prefix} ${own}` : own } : m;
};

/** Branding of the box: its operator's, overridden by the brand of its model when the model belongs to another
 *  internet provider than the integration's (a KPN Box 12 on the Livebox integration, a Bell Home Hub on Sagemcom). */
export const brandOf = (box, config) => {
  const op = box?.operator || OPERATORS.freebox;
  const brand = BRANDS[boxModel(box, config)?.brand];
  return brand ? { ...op, ...brand } : op;
};

/** Label of a partition: its friendly name without the device name and the "free space" words, as the core
 *  Freebox integration names them (partition_free_space). Italian, Dutch, Polish, Romanian, Danish, Bulgarian,
 *  Russian, Ukrainian, Slovenian, Latvian and Greek have no translation of that name in core and fall back to
 *  the English one. */
export const partitionLabel = (hass, p, fallback = "Disk") =>
  shortName(hass, p.id, p.device)
    .replace(
      /\s*(free space|espace libre( de| sur)?|freier speicher(platz)?|espacio libre( de| en)?|espaço livre( em| de)?|fritt utrymme|szabad hely|voľný priestor|(- )?volné místo)\s*/gi,
      " "
    )
    .trim() || deviceName(p.device) || fallback;
