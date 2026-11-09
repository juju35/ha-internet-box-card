// Bundles src/internet-box-card.js into the single HACS file dist/internet-box-card.js,
// inlining the operator logos (Free, Orange, SFR, Bbox) so the card needs no extra resource.
// Usage: node scripts/build.mjs  (dist/ is not committed: CI and the release workflow build it)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { splitDist } from "./i18n-split.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(`${root}package.json`, "utf8"));
const b64 = (file) => readFileSync(`${root}images/${file}`).toString("base64");

const out = readFileSync(`${root}src/internet-box-card.js`, "utf8")
  .replace("__VERSION__", pkg.version)
  .replace("__IMG_LOGO__", `data:image/svg+xml;base64,${b64("free.svg")}`)
  .replace("__IMG_ORANGE__", `data:image/svg+xml;base64,${b64("orange.svg")}`)
  .replace("__IMG_SFR__", `data:image/svg+xml;base64,${b64("sfr.svg")}`)
  .replace("__IMG_BBOX__", `data:image/svg+xml;base64,${b64("bbox.svg")}`);

mkdirSync(`${root}dist`, { recursive: true });
writeFileSync(`${root}dist/internet-box-card.js`, out);
// Same file under the former name, attached to the releases for manual installs that still load it.
writeFileSync(`${root}dist/freebox-card.js`, out);
console.log(`Built dist/internet-box-card.js and dist/freebox-card.js (${(out.length / 1024).toFixed(1)} KB)`);

// Translations: English stays in the bundle, each other language goes to dist/internet-box-card.i18n.<lang>.js,
// fetched when a card needs it (scripts/i18n-split.mjs).
if (process.argv[1] === fileURLToPath(import.meta.url)) splitDist(`${root}dist`, "internet-box-card.js", { version: pkg.version, aliases: ["freebox-card.js"] });
