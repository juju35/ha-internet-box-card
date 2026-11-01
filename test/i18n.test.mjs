import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { STRINGS, RATE_UNITS, lang, InternetBoxCardEditor } = load("internet-box-card.js", [
  "STRINGS",
  "RATE_UNITS",
  "lang",
  "InternetBoxCardEditor",
]);

const LANGS = ["en", "fr", "de", "es", "sr", "sr-Latn"];
const enKeys = Object.keys(STRINGS.en).sort();
const placeholders = (v) => (String(v).match(/\{\w+\}/g) || []).sort();

test("I18N parity: every language has exactly the English keys", () => {
  for (const l of LANGS) {
    assert.ok(STRINGS[l], `missing language ${l}`);
    assert.deepEqual(Object.keys(STRINGS[l]).sort(), enKeys, `key mismatch in ${l}`);
    for (const [k, v] of Object.entries(STRINGS[l])) assert.ok(typeof v === "string" && v.trim(), `${l}.${k} is empty`);
  }
});

test("I18N parity: every language keeps the English placeholders", () => {
  for (const l of LANGS) {
    for (const k of enKeys) assert.deepEqual(placeholders(STRINGS[l][k]), placeholders(STRINGS.en[k]), `${l}.${k} placeholders`);
  }
});

test("I18N parity: every language has rate units", () => {
  for (const l of Object.keys(STRINGS)) {
    assert.ok(RATE_UNITS[l], `missing rate units for ${l}`);
    assert.equal(RATE_UNITS[l].bytes.length, RATE_UNITS.en.bytes.length);
    assert.equal(RATE_UNITS[l].bits.length, RATE_UNITS.en.bits.length);
  }
});

// Brands, the Wi-Fi name and units stay in Latin script in the Cyrillic translation.
const LATIN_ALLOWED = /Freebox|Livebox|SFR Box|Bbox|Wi-Fi|[kMG]?[bB]\/s|\b(h|d|min)\b/g;

test("I18N Serbian: sr has no Latin letters and sr-Latn no Cyrillic, brands and units aside", () => {
  for (const [k, v] of Object.entries(STRINGS.sr)) {
    assert.doesNotMatch(v.replace(LATIN_ALLOWED, ""), /[A-Za-z]/, `sr.${k} has Latin letters: ${v}`);
  }
  for (const [k, v] of Object.entries(STRINGS["sr-Latn"])) {
    assert.doesNotMatch(v, /[Ѐ-ӿ]/, `sr-Latn.${k} has Cyrillic letters: ${v}`);
  }
});

test("I18N language resolution: full tag, then the part before the dash, then English", () => {
  assert.equal(lang(undefined, { language: "fr-FR" }), "fr");
  assert.equal(lang(undefined, { language: "sr-Latn" }), "sr-Latn");
  assert.equal(lang(undefined, { language: "sr" }), "sr");
  assert.equal(lang(undefined, { language: "pt-BR" }), "en");
  // Home Assistant set to Serbian Latin: picked automatically, the card option still wins.
  assert.equal(lang({ locale: { language: "sr-Latn" }, language: "sr-Latn" }, {}), "sr-Latn");
  assert.equal(lang({ language: "sr" }, {}), "sr");
  assert.equal(lang({ locale: { language: "sr-Latn" } }, { language: "de" }), "de");
});

test("I18N editor: the language dropdown offers every translation", () => {
  const ed = new InternetBoxCardEditor();
  ed._hass = { states: {}, entities: {}, devices: {}, language: "en" };
  ed._config = {};
  const options = ed._schema().find((f) => f.name === "language").selector.select.options;
  assert.equal(options.map((o) => o.value).join(), ["", ...LANGS].join());
  assert.equal(options.find((o) => o.value === "sr").label, "Српски");
  assert.equal(options.find((o) => o.value === "sr-Latn").label, "Srpski (latinica)");
});
