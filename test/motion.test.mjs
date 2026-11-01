// Browser test (Chromium through Playwright): with "reduce motion" set in the system, the card neither spins the
// fans nor animates the bars and gauges; without it, they keep their animation. Skipped when Playwright or Chromium
// is not installed, except in CI, where it must run.
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

async function motion(reducedMotion, type) {
  const page = await browser.newPage({ reducedMotion });
  await page.setContent("<!doctype html><body><div id=root></div></body>");
  await page.addScriptTag({ content: src });
  const res = await page.evaluate(
    ({ type, states, entities, devices }) => {
      const el = document.createElement(type);
      el.setConfig({ type: `custom:${type}` });
      el.hass = { states, entities, devices, language: "en", config: { time_zone: "UTC" } };
      document.getElementById("root").appendChild(el);
      const all = (sel, prop) => [...el.shadowRoot.querySelectorAll(sel)].map((n) => getComputedStyle(n)[prop]);
      return {
        bars: all(".bar > div", "transitionDuration"),
        rings: all(".ring .value", "transitionDuration"),
        spins: all(".spin", "animationName"),
      };
    },
    { type, states, entities, devices }
  );
  await page.close();
  return res;
}

for (const type of ["internet-box-card", "internet-box-mini-card"]) {
  test(`${type}: no decorative motion when the system asks to reduce it`, async (t) => {
    if (skip) return t.skip(skip);
    const r = await motion("reduce", type);
    if (type === "internet-box-card") assert.ok(r.bars.length > 0 && r.rings.length > 0);
    for (const v of [...r.bars, ...r.rings]) assert.equal(v, "0s");
    for (const v of r.spins) assert.equal(v, "none");
  });

  test(`${type}: bars and gauges stay animated by default`, async (t) => {
    if (skip) return t.skip(skip);
    const r = await motion("no-preference", type);
    for (const v of [...r.bars, ...r.rings]) assert.equal(v, "0.6s");
  });
}
