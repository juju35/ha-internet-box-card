// Bundles src/internet-box-card.js into the single HACS file dist/internet-box-card.js,
// inlining the operator logos (Free, Orange, SFR, Bbox) so the card needs no extra resource. The other providers'
// logos ("__IMG_FILE:<file>__") are inlined from images/<file> when that file is there, else left out (empty: the
// header then shows the connection icon without a logo badge).
// Usage: node scripts/build.mjs  (dist/ is not committed: CI and the release workflow build it)
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
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
  .replace("__IMG_BBOX__", `data:image/svg+xml;base64,${b64("bbox.svg")}`)
  .replace(/__IMG_FILE:([\w.-]+)__/g, (_, file) => (existsSync(`${root}images/${file}`) ? `data:image/svg+xml;base64,${b64(file)}` : ""));

mkdirSync(`${root}dist`, { recursive: true });
writeFileSync(`${root}dist/internet-box-card.js`, out);
console.log(`Built dist/internet-box-card.js (${(out.length / 1024).toFixed(1)} KB)`);

// Translations: English stays in the bundle, each other language goes to dist/internet-box-card.i18n.<lang>.js,
// fetched when a card needs it (scripts/i18n-split.mjs).
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) splitDist(`${root}dist`, "internet-box-card.js", { version: pkg.version });
