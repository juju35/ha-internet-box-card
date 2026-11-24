// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
import { RATE_UNITS } from "./core.js";
import { STRINGS } from "./i18n/strings.js";

export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const lang = (hass, config) => {
  const l = (config?.language) || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

export const t = (hass, config, key) => STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key;

/** Text agreeing with the count n: the `key_one/_few/_many` variant picked by Intl.PluralRules when the
 *  language defines it, else the plain key (which serves as the `_other` form). */
export const tn = (hass, config, key, n) => {
  const l = lang(hass, config);
  let form = "other";
  try {
    // The Portuguese texts are European Portuguese: 0 takes the plural there (pt alone means pt-BR to Intl).
    form = new Intl.PluralRules(l === "pt" ? "pt-PT" : l).select(n);
  } catch (_) {}
  return STRINGS[l][`${key}_${form}`] ?? t(hass, config, key);
};

export const num = (s) => {
  if (!s) return null;
  const v = parseFloat(s.state);
  return Number.isFinite(v) ? v : null;
};

/** True when Home Assistant has no value for the entity (unavailable, e.g. while the box restarts, or unknown):
 *  the card then shows it as unavailable, never as a real state (Wi-Fi off, 0 missed calls, offline, RAID OK). */
export const noValue = (s) => !s || s.state === "unavailable" || s.state === "unknown";

/** Number of missed calls from the missed-calls entity, or null while it has no value. A counting sensor (Freebox)
 *  gives it as its state; a binary sensor listing the missed calls (Livebox `callmissed`) as the length of its
 *  `missed_calls` attribute (0 when off); the Livebox `callers` total only through its `callers` list, keeping the
 *  calls whose status is "missed". */
export const missedCount = (s) => {
  if (noValue(s)) return null;
  const a = s.attributes || {};
  if (Array.isArray(a.missed_calls)) return a.missed_calls.length;
  if (s.entity_id?.startsWith("binary_sensor.")) return s.state === "on" ? null : 0;
  if (Array.isArray(a.callers)) return a.callers.filter((c) => c?.status === "missed").length;
  return num(s);
};

export const RATE_FACTORS = {
  "b/s": 1, "bit/s": 1 / 8, "kbit/s": 125, "mbit/s": 125e3, "gbit/s": 125e6,
  "kb/s": 1e3, "mb/s": 1e6, "gb/s": 1e9, "kib/s": 1024, "mib/s": 1024 ** 2, "gib/s": 1024 ** 3,
};

/** Data rate of a sensor in bytes per second, whatever the unit chosen in Home Assistant. */
export const toBps = (s) => {
  const v = num(s);
  if (v === null) return null;
  const unit = String(s.attributes.unit_of_measurement || "kB/s").toLowerCase();
  return v * (RATE_FACTORS[unit] ?? 1e3);
};

/** Locale for numbers: the card's language, refined by Home Assistant's own locale when they agree ("fr-CA"). The
 *  Portuguese texts are European Portuguese (pt alone means pt-BR to Intl). */
export const numLang = (hass, config) => {
  const l = lang(hass, config);
  const ha = hass && (hass.locale?.language || hass.language);
  const loc = ha && ha.split("-")[0] === l ? ha : l;
  return loc === "pt" ? "pt-PT" : loc;
};

/** Rate with the language's units and decimal separator ("1,5 Mo/s" in French). */
export const fmtRate = (bps, hass, config) => {
  if (bps === null || bps === undefined) return "—";
  const bits = config.rate_unit === "bits";
  const units = RATE_UNITS[lang(hass, config)][bits ? "bits" : "bytes"];
  let v = bits ? bps * 8 : bps;
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  const d = v >= 100 || i === 0 ? 0 : 1;
  const n = new Intl.NumberFormat(numLang(hass, config), { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: false }).format(v);
  return `${n} ${units[i]}`;
};

export const fmtUptime = (sec, hass, config) => {
  if (sec === null) return "—";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d} ${t(hass, config, "days")} ${h} ${t(hass, config, "hours")}`;
  if (h > 0) return `${h} ${t(hass, config, "hours")} ${m} ${t(hass, config, "minutes")}`;
  return `${m} ${t(hass, config, "minutes")}`;
};

/** Offset of a time zone from UTC at a given instant, in minutes ("Europe/Paris" in summer -> 120).
 *  Cached per (time zone, minute): building an Intl.DateTimeFormat on every render is needless work. */
export const _tzCache = new Map();
export const tzOffset = (timeZone, ms) => {
  const key = `${timeZone}|${Math.floor(ms / 60000)}`;
  let off = _tzCache.get(key);
  if (off !== undefined) return off;
  const name = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(new Date(ms))
    .find((p) => p.type === "timeZoneName")?.value;
  const m = /GMT([+-])(\d{1,2})(?::?(\d{2}))?/.exec(name || "");
  off = m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] || 0)) : 0;
  if (_tzCache.size > 64) _tzCache.clear();
  _tzCache.set(key, off);
  return off;
};

/**
 * Parse a date. The Freebox integration exposes a naive datetime (no UTC offset), built with
 * datetime.fromtimestamp(), so in the system time zone of the Home Assistant process (its TZ variable),
 * which Home Assistant does not set itself. It is read in timeZone (hass.config.time_zone), not in the
 * browser's: both match on Home Assistant OS and Supervised, where the Supervisor passes TZ, but not in
 * a container started without TZ (see the README).
 */
export const parseDate = (raw, timeZone) => {
  const str = String(raw).trim().replace(" ", "T");
  const naive = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(str);
  if (!naive || !timeZone) return Date.parse(str);
  const asUtc = Date.parse(`${str}Z`);
  if (!Number.isFinite(asUtc)) return Number.NaN;
  try {
    // Second pass: the offset of the resulting instant, right around daylight saving time changes.
    const first = asUtc - tzOffset(timeZone, asUtc) * 60e3;
    return asUtc - tzOffset(timeZone, first) * 60e3;
  } catch {
    return Date.parse(str);
  }
};

/** Seconds since the box started, from an uptime sensor: a boot date (device_class uptime / timestamp), or a duration
 *  (Huawei LTE: seconds, or the sensor's own time unit); null while it has no value. */
export const bootSec = (s) => {
  if (noValue(s)) return null;
  const unit = String(s.attributes?.unit_of_measurement || "").toLowerCase();
  const v = Number(s.state);
  if (unit && Number.isFinite(v)) return Math.max(0, v * ({ ms: 1e-3, s: 1, min: 60, h: 3600, d: 86400 }[unit] ?? 1));
  const ms = Date.parse(s.state);
  return Number.isFinite(ms) ? Math.max(0, (Date.now() - ms) / 1000) : null;
};

/** Seconds since the boot date exposed by the router device tracker ("uptime" attribute). */
export const uptimeSec = (tracker, timeZone) => {
  const raw = tracker?.attributes?.uptime;
  if (!raw) return null;
  const ms = parseDate(raw, timeZone);
  return Number.isFinite(ms) ? Math.max(0, (Date.now() - ms) / 1000) : null;
};

/**
 * Temperature sensor value: `raw` in the sensor's own unit (Home Assistant converts temperature sensors to the
 * user's unit system), `c` the same value in °C for the thresholds and the gauge, `unit` the unit to display.
 */
export const temperature = (s) => {
  const raw = num(s);
  const unit = s?.attributes?.unit_of_measurement || "°C";
  if (raw === null) return { raw, c: null, unit };
  const u = unit.replace(/^°/, "").toUpperCase();
  const c = u === "F" ? ((raw - 32) * 5) / 9 : u === "K" ? raw - 273.15 : raw;
  return { raw, c, unit };
};

export const level = (v, warn, crit) => (v === null ? "" : v >= crit ? "crit" : v >= warn ? "warn" : "ok");

// Default warning / critical thresholds: temperatures in °C, disk in % used. Each can be set in the card options
// (`temp_warning`, `temp_critical`, `disk_warning`, `disk_critical`), named as on the system-monitor card.
export const THRESHOLDS = { temp_warning: 75, temp_critical: 90, disk_warning: 80, disk_critical: 90 };

// Options renamed in 2.8.0 (`storage_*` -> `disk_*`), still read under their old name; the new name wins when both are set.
export const LEGACY_OPTIONS = { storage_warning: "disk_warning", storage_critical: "disk_critical" };
export const normalizeConfig = (config) => {
  const out = { ...config };
  for (const [old, name] of Object.entries(LEGACY_OPTIONS)) {
    if (old in out) {
      if (out[name] === undefined) out[name] = out[old];
      delete out[old];
    }
  }
  return out;
};

/** A threshold option as a number, or its default when unset or not a number. */
export const threshold = (config, key) => {
  const v = config?.[key];
  const n = v === "" || v === null || v === undefined ? Number.NaN : Number(v);
  return Number.isFinite(n) ? n : THRESHOLDS[key];
};

// Header icon of the kind of connection (fibre, xDSL, 4G / 5G, else a generic box): a box body with what feeds it.
export const BOX_BODY = '<rect x="3" y="12" width="18" height="8" rx="2"/><circle class="led" cx="7" cy="16" r="1.1"/><circle class="led" cx="10.5" cy="16" r="1.1"/>';
export const LINE_ICONS = {
  box: '<path class="ln" d="M7 12V5M17 12V5"/>',
  fibre: '<circle cx="12" cy="6" r="2"/><path class="ln" d="M12 12V8.5M8 6H6M18 6h-2M9.2 3.2 8 2M14.8 3.2 16 2"/>',
  dsl: '<path class="ln" d="M12 12v-1.5l-2.5-1.8 5-2-5-2 2.5-1.7V1.5"/>',
  mobile: '<path class="ln" d="M12 12V6.5M8.6 5.6a4.8 4.8 0 0 1 6.8 0M6.2 3.2a8.2 8.2 0 0 1 11.6 0"/>',
  satellite: '<path class="ln" d="M12 12V8M7.5 3.5l9 4.5M9 2.6a5 5 0 0 0 6.4 7.6"/><circle cx="17.5" cy="3.5" r="1.3"/>',
};
export const lineOf = (type, model) => {
  const t = `${type || ""} ${model || ""}`.toLowerCase();
  return /ftth|fib|pon\b|ont\b|sfp\b/.test(t)
    ? "fibre"
    : /dsl/.test(t)
      ? "dsl"
      : /\b(4g|5g|lte|mobile|cell|internet.?key)/.test(t)
        ? "mobile"
        : /satellite|starlink/.test(t)
          ? "satellite"
          : "box";
};
export const lineIcon = (kind) => `<svg class="icon type" viewBox="0 0 24 24" aria-hidden="true">${BOX_BODY}${LINE_ICONS[kind]}</svg>`;
export const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// Same values, compared by identity: used to skip a render when nothing the card shows has changed.
export const sameSig = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

// Patch the shadow DOM in place from the new HTML: nodes whose tag is unchanged are kept, so keyboard
// focus, hover, embedded pictures and CSS transitions survive an update, and only the changed text and
// attributes are written. Rows of a list carry a data-key (their entity or row id) and are matched by it,
// wherever they moved, so a focused row keeps its own data when the list is reordered (a node matched by
// position would be rewritten with the row taking its place, and Enter would act on that row). Nodes
// without a data-key are matched by position.
export const patchAttrs = (cur, next) => {
  for (const { name } of [...cur.attributes]) if (!next.hasAttribute(name)) cur.removeAttribute(name);
  for (const { name, value } of next.attributes) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
};
export const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
export const sameNode = (a, b) => !!a && a.nodeType === b.nodeType && a.nodeName === b.nodeName;
// Moves a kept node. moveBefore (where supported) keeps its focus; insertBefore drops it, which is safe:
// Enter then does nothing rather than act on another row.
export const place = (parent, node, ref) => {
  if (node === ref) return;
  try {
    if (parent.moveBefore && node.parentNode === parent) return parent.moveBefore(node, ref);
  } catch (_e) {
    /* fall back to insertBefore */
  }
  parent.insertBefore(node, ref);
};
export const patchChildren = (cur, next) => {
  const old = [...cur.childNodes];
  const fresh = [...next.childNodes];
  const byKey = new Map();
  for (const o of old) {
    const k = keyOf(o);
    if (k !== null && !byKey.has(k)) byKey.set(k, o);
  }
  const used = new Set();
  fresh.forEach((n, i) => {
    const k = keyOf(n);
    let o = k !== null ? byKey.get(k) : old[i];
    if (!sameNode(o, n) || used.has(o) || (k === null && keyOf(o) !== null)) o = null;
    const ref = cur.childNodes[i] ?? null;
    if (!o) {
      cur.insertBefore(n, ref);
      return;
    }
    used.add(o);
    place(cur, o, ref);
    if (n.nodeType === 1) {
      patchAttrs(o, n);
      patchChildren(o, n);
    } else if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
  });
  while (cur.childNodes.length > fresh.length) cur.removeChild(cur.lastChild);
};
export const morph = (root, html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  patchChildren(root, tpl.content);
};

// After the confirmation popup closes, clicks on the card are ignored for this long: the second click of a double
// click on its button would otherwise land on what lies under it.
export const CONFIRM_GUARD_MS = 400;

// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
export const inDialog = (path) => path.some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

export const fireMoreInfo = (node, entityId) => {
  if (!entityId) return;
  node.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
};
