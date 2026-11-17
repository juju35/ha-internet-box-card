// Browser test (Chromium through Playwright): the 24 h sparklines of the download / upload tiles never
// cross the text of their tile, light or dark, compact or zoomed, from 245 to 500 px. Skipped when
// Playwright or Chromium is not installed, except in CI, where it must run.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { devices, entities, states } from "../scripts/mock-states.mjs";

const src = readFileSync(new URL("../src/internet-box-card.js", import.meta.url), "utf8");
let browser;
let skip = false;
before(async () => {
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  } catch (err) {
    if (process.env.CI) throw err;
    skip = `Chromium not available: ${err.message.split("\n")[0]}`;
  }
});
after(() => browser?.close());

const HA_CARD = `customElements.define("ha-card", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;overflow:hidden}</style><slot></slot>";
  }
});`;

// Each sparkline against the glyphs of its own tile or row (text nodes and icons outside the sparkline).
const overlaps = async (cards) => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1600 } });
  await page.route("https://brands.home-assistant.io/**", (r) => r.fulfill({ status: 404 }));
  await page.setContent(`<!doctype html><html><body style="margin:0;font-family:Roboto,Arial,sans-serif"><div id="root"></div></body></html>`);
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: src });
  const out = await page.evaluate(
    async ({ cards, states, entities, devices }) => {
      const res = [];
      const callWS = async (msg) => {
        const t0 = Date.parse(msg.start_time);
        return Object.fromEntries(
          (msg.statistic_ids || []).map((id) => [id, Array.from({ length: 288 }, (_, i) => ({ start: t0 + i * 300000, mean: 20 + 60 * Math.abs(Math.sin(i / 20)) }))])
        );
      };
      for (const { type, width, zoom } of cards) {
        const box = document.createElement("div");
        box.style.width = `${width}px`;
        document.getElementById("root").replaceChildren(box);
        const el = document.createElement(type);
        el.setConfig({ type: `custom:${type}` });
        el.hass = { states, entities, devices, language: "en", locale: { language: "en" }, config: { time_zone: "UTC" }, callService: () => {}, callWS };
        box.appendChild(el);
        if (zoom) el.shadowRoot.querySelector(".zoom").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
        await new Promise((r) => setTimeout(r, 300));
        el.hass = { ...el.hass };
        await new Promise((r) => setTimeout(r, 100));
        const sparks = [...el.shadowRoot.querySelectorAll(".spark")];
        const hits = [];
        for (const sp of sparks) {
          const s = sp.getBoundingClientRect();
          const host = sp.parentElement;
          const boxes = [];
          const walk = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
          while (walk.nextNode()) {
            if (!walk.currentNode.textContent.trim() || sp.contains(walk.currentNode)) continue;
            const range = document.createRange();
            range.selectNodeContents(walk.currentNode);
            for (const b of range.getClientRects()) boxes.push([walk.currentNode.textContent.trim(), b]);
          }
          for (const ic of host.querySelectorAll("svg.icon")) boxes.push(["icon", ic.getBoundingClientRect()]);
          for (const [txt, b] of boxes)
            if (b.width && b.height && b.left < s.right - 0.5 && b.right > s.left + 0.5 && b.top < s.bottom - 0.5 && b.bottom > s.top + 0.5)
              hits.push(`${host.className}: "${txt}"`);
        }
        res.push({ at: `${type}${zoom ? " zoomed" : ""} ${width}px`, sparks: sparks.length, hits });
      }
      return res;
    },
    { cards, states, entities, devices }
  );
  await page.close();
  return out;
};

test("sparklines sit in their own band: no text or icon of the tile or row under them", async (t) => {
  if (skip) return t.skip(skip);
  const cards = [];
  for (const width of [245, 300, 400, 500])
    for (const [type, zoom] of [
      ["internet-box-card", false],
      ["internet-box-mini-card", false],
      ["internet-box-mini-card", true],
    ])
      cards.push({ type, width, zoom });
  for (const m of await overlaps(cards)) {
    assert.ok(m.sparks > 0, `${m.at}: no sparkline drawn`);
    assert.deepEqual(m.hits, [], `${m.at}: text under a sparkline`);
  }
});
