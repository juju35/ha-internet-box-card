import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { STRINGS, RATE_UNITS, lang, tn, partitionLabel, InternetBoxCardEditor } = load("internet-box-card.js", [
  "STRINGS",
  "RATE_UNITS",
  "lang",
  "tn",
  "partitionLabel",
  "InternetBoxCardEditor",
]);

const LANGS = [
  "en", "fr", "de", "es", "sr", "sr-Latn", "it", "nl", "pt", "pl",
  "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el",
];
// Plural variants (key_one/_two/_few/_many) are optional: a language without them uses the plain key.
const PLURAL = /_(one|two|few|many)$/;
const baseKeys = (l) => Object.keys(STRINGS[l]).filter((k) => !PLURAL.test(k)).sort();
const enKeys = Object.keys(STRINGS.en).sort();
const placeholders = (v) => (String(v).match(/\{\w+\}/g) || []).sort();

test("I18N parity: every language has exactly the English keys", () => {
  for (const l of LANGS) {
    assert.ok(STRINGS[l], `missing language ${l}`);
    assert.deepEqual(baseKeys(l), enKeys, `key mismatch in ${l}`);
    for (const k of Object.keys(STRINGS[l]).filter((k) => PLURAL.test(k))) {
      assert.ok(enKeys.includes(k.replace(PLURAL, "")), `${l}.${k} is a plural form of an unknown key`);
    }
    for (const [k, v] of Object.entries(STRINGS[l])) assert.ok(typeof v === "string" && v.trim(), `${l}.${k} is empty`);
  }
});

test("I18N parity: every language keeps the English placeholders", () => {
  for (const l of LANGS) {
    for (const k of Object.keys(STRINGS[l])) {
      const base = k.replace(PLURAL, "");
      assert.deepEqual(placeholders(STRINGS[l][k]), placeholders(STRINGS.en[base]), `${l}.${k} placeholders`);
    }
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
  // Home Assistant set to Serbian Latin: picked automatically, the card option still wins.
  assert.equal(lang({ locale: { language: "sr-Latn" }, language: "sr-Latn" }, {}), "sr-Latn");
  assert.equal(lang({ language: "sr" }, {}), "sr");
  assert.equal(lang({ locale: { language: "sr-Latn" } }, { language: "de" }), "de");
});

test("I18N language resolution: Italian, Dutch, Portuguese and Polish, other tags fall back to English", () => {
  const resolve = (language) => lang(undefined, { language });
  assert.equal(resolve("it-IT"), "it");
  assert.equal(resolve("nl-BE"), "nl");
  assert.equal(resolve("pt"), "pt");
  // Brazilian Portuguese falls back to the European Portuguese translation, by design.
  assert.equal(resolve("pt-BR"), "pt");
  assert.equal(resolve("pl-PL"), "pl");
  assert.equal(resolve("sr-Latn"), "sr-Latn");
  assert.equal(resolve("ja"), "en");
  assert.equal(lang({ locale: { language: "pl-PL" } }, {}), "pl");
});

test("I18N language resolution: the 12 languages added in 2.2.1 from their regional tags", () => {
  const resolve = (language) => lang(undefined, { language });
  const tags = {
    "ro-RO": "ro", "da-DK": "da", "sv-SE": "sv", "sv-FI": "sv", "bg-BG": "bg", "ru-RU": "ru", "uk-UA": "uk",
    "hu-HU": "hu", "sk-SK": "sk", "cs-CZ": "cs", "sl-SI": "sl", "lv-LV": "lv", "el-GR": "el",
  };
  for (const [tag, want] of Object.entries(tags)) assert.equal(resolve(tag), want, tag);
  assert.equal(lang({ locale: { language: "el" } }, {}), "el");
  assert.equal(lang({ locale: { language: "ru" } }, { language: "uk" }), "uk");
});

test("I18N parity: every language has the English rate units, same lengths", () => {
  assert.deepEqual(Object.keys(RATE_UNITS).sort(), [...LANGS].sort());
  for (const l of LANGS) {
    for (const kind of ["bytes", "bits"]) {
      assert.equal(RATE_UNITS[l][kind].length, RATE_UNITS.en[kind].length, `${l}.${kind}`);
      for (const u of RATE_UNITS[l][kind]) assert.ok(u.trim(), `${l}.${kind} has an empty unit`);
    }
  }
});

test("I18N editor: the language dropdown offers every translation", () => {
  const ed = new InternetBoxCardEditor();
  ed._hass = { states: {}, entities: {}, devices: {}, language: "en" };
  ed._config = {};
  const options = ed._schema().find((f) => f.name === "language").selector.select.options;
  assert.equal(options.map((o) => o.value).join(), ["", ...LANGS].join());
  assert.equal(options.find((o) => o.value === "sr").label, "Српски");
  assert.equal(options.find((o) => o.value === "sr-Latn").label, "Srpski (latinica)");
  assert.equal(options.find((o) => o.value === "it").label, "Italiano");
  assert.equal(options.find((o) => o.value === "nl").label, "Nederlands");
  assert.equal(options.find((o) => o.value === "pt").label, "Português (Portugal)");
  assert.equal(options.find((o) => o.value === "pl").label, "Polski");
  const natives = {
    ro: "Română", da: "Dansk", sv: "Svenska", bg: "Български", ru: "Русский", uk: "Українська", hu: "Magyar",
    sk: "Slovenčina", cs: "Čeština", sl: "Slovenščina", lv: "Latviešu", el: "Ελληνικά",
  };
  for (const [l, label] of Object.entries(natives)) assert.equal(options.find((o) => o.value === l).label, label, l);
});

test("I18N plurals: missed calls agree with the count in Polish, Italian and Portuguese", () => {
  const missed = (language, n) => tn(undefined, { language }, "missed", n);
  assert.deepEqual([0, 1, 2, 4, 5, 12, 21, 22, 25].map((n) => missed("pl", n)), [
    "nieodebranych", "nieodebrane", "nieodebrane", "nieodebrane", "nieodebranych",
    "nieodebranych", "nieodebranych", "nieodebrane", "nieodebranych",
  ]);
  assert.deepEqual([0, 1, 2].map((n) => missed("it", n)), ["perse", "persa", "perse"]);
  assert.deepEqual([0, 1, 2].map((n) => missed("pt", n)), ["perdidas", "perdida", "perdidas"]);
  assert.deepEqual([0, 1, 2].map((n) => missed("pt-BR", n)), ["perdidas", "perdida", "perdidas"]);
  // Languages without plural variants keep their single text.
  assert.deepEqual([0, 1, 5].map((n) => missed("en", n)), ["missed", "missed", "missed"]);
  // French: 0 and 1 are singular.
  assert.deepEqual([0, 1, 2, 5].map((n) => missed("fr", n)), ["manqué", "manqué", "manqués", "manqués"]);
});

test("I18N plurals: Portuguese from HA uses the European rules, the language option stays first", () => {
  const hass = (language) => ({ language, locale: { language } });
  assert.equal(tn(hass("pt"), {}, "missed", 0), "perdidas"); // pt-PT: 0 is plural (pt-BR would say "perdida")
  assert.equal(tn(hass("pt"), { language: "pl" }, "missed", 5), "nieodebranych");
  assert.equal(tn(hass("pl"), { language: "pt" }, "missed", 1), "perdida");
});

test("I18N partitions: the core Freebox 'free space' words are stripped in every translated form", () => {
  const dev = { name: "Freebox Server" };
  const label = (friendly_name) =>
    partitionLabel({ states: { "sensor.p": { attributes: { friendly_name } } } }, { id: "sensor.p", device: dev });
  // Names from homeassistant/components/freebox translations (partition_free_space); it, nl and pl
  // have no translation in core and use the English name.
  assert.equal(label("Freebox Server Disque dur free space"), "Disque dur");
  assert.equal(label("Freebox Server Espace libre Disque dur"), "Disque dur");
  assert.equal(label("Freebox Server Disque dur Freier Speicherplatz"), "Disque dur");
  assert.equal(label("Freebox Server espacio libre de Disque dur"), "Disque dur");
  assert.equal(label("Freebox Server Espaço livre em Disque dur"), "Disque dur");
  assert.equal(label("Freebox Server Disque dur fritt utrymme"), "Disque dur");
  assert.equal(label("Freebox Server Disque dur szabad hely"), "Disque dur");
  assert.equal(label("Freebox Server Disque dur voľný priestor"), "Disque dur");
  assert.equal(label("Freebox Server Disque dur - volné místo"), "Disque dur");
  assert.equal(label("Freebox Server free space"), "Freebox Server");
});

test("I18N plurals: missed calls agree with the count in every language", () => {
  const missed = (language, n) => `${n} ${tn(undefined, { language }, "missed", n)}`;
  const expected = {
    en: ["1 missed", "2 missed", "5 missed", "21 missed", "22 missed"],
    fr: ["1 manqué", "2 manqués", "5 manqués", "21 manqués", "22 manqués"],
    de: ["1 verpasst", "2 verpasst", "5 verpasst", "21 verpasst", "22 verpasst"],
    es: ["1 perdida", "2 perdidas", "5 perdidas", "21 perdidas", "22 perdidas"],
    sr: ["1 пропуштен", "2 пропуштена", "5 пропуштених", "21 пропуштен", "22 пропуштена"],
    "sr-Latn": ["1 propušten", "2 propuštena", "5 propuštenih", "21 propušten", "22 propuštena"],
    it: ["1 persa", "2 perse", "5 perse", "21 perse", "22 perse"],
    nl: ["1 gemist", "2 gemist", "5 gemist", "21 gemist", "22 gemist"],
    pt: ["1 perdida", "2 perdidas", "5 perdidas", "21 perdidas", "22 perdidas"],
    pl: ["1 nieodebrane", "2 nieodebrane", "5 nieodebranych", "21 nieodebranych", "22 nieodebrane"],
    ro: ["1 pierdut", "2 pierdute", "5 pierdute", "21 pierdute", "22 pierdute"],
    da: ["1 ubesvaret", "2 ubesvarede", "5 ubesvarede", "21 ubesvarede", "22 ubesvarede"],
    sv: ["1 missat", "2 missade", "5 missade", "21 missade", "22 missade"],
    bg: ["1 пропуснато", "2 пропуснати", "5 пропуснати", "21 пропуснати", "22 пропуснати"],
    ru: ["1 пропущенный", "2 пропущенных", "5 пропущенных", "21 пропущенный", "22 пропущенных"],
    uk: ["1 пропущений", "2 пропущені", "5 пропущених", "21 пропущений", "22 пропущені"],
    hu: ["1 nem fogadott", "2 nem fogadott", "5 nem fogadott", "21 nem fogadott", "22 nem fogadott"],
    sk: ["1 zmeškaný", "2 zmeškané", "5 zmeškaných", "21 zmeškaných", "22 zmeškaných"],
    cs: ["1 zmeškaný", "2 zmeškané", "5 zmeškaných", "21 zmeškaných", "22 zmeškaných"],
    sl: ["1 zgrešen", "2 zgrešena", "5 zgrešenih", "21 zgrešenih", "22 zgrešenih"],
    lv: ["1 neatbildēts", "2 neatbildēti", "5 neatbildēti", "21 neatbildēts", "22 neatbildēti"],
    el: ["1 αναπάντητη", "2 αναπάντητες", "5 αναπάντητες", "21 αναπάντητες", "22 αναπάντητες"],
  };
  assert.deepEqual(Object.keys(expected).sort(), [...LANGS].sort());
  for (const [l, want] of Object.entries(expected)) {
    assert.deepEqual([1, 2, 5, 21, 22].map((n) => missed(l, n)), want, l);
  }
  // 0 takes the singular in French, the plural in the others.
  assert.equal(missed("fr", 0), "0 manqué");
  assert.equal(missed("es", 0), "0 perdidas");
  // Slovenian: 101 and 102 take the singular and the dual again; Latvian: 0 takes the plural.
  assert.equal(missed("sl", 101), "101 zgrešen");
  assert.equal(missed("sl", 102), "102 zgrešena");
  assert.equal(missed("lv", 0), "0 neatbildēti");
});

test("I18N: every language translates the unavailable state", () => {
  for (const l of LANGS) assert.notEqual(STRINGS[l].unavailable, undefined, l);
  for (const l of LANGS.filter((l) => l !== "en")) assert.notEqual(STRINGS[l].unavailable, STRINGS.en.unavailable, l);
});
