// Browser test (Chromium through Playwright): the card does not move the dashboard. A state change of an entity the
// card does not show writes nothing in its shadow DOM; a change of its own entities patches it in place (no node
// replaced, its pictures and icons kept) and its height stays the same on every animation frame, so the sections
// grid never reflows under the user. Skipped when Playwright or Chromium is not installed, except in CI, where it
// must run. CHROMIUM_PATH points to a local Chromium if needed.
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

const STUBS = "";
const HASS = () => ({ states, entities, devices, language: "en", config: { time_zone: "UTC" } });

// Mounts the card, then sends 20 hass updates (even: an unrelated entity, odd: the card's own entities, through
// `mutate`) and records the card's height on every frame and the shadow DOM's mutations of each kind of update.
const probe = async (tag, config, width) => {
  const page = await browser.newPage({ viewport: { width: 800, height: 1400 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setContent(`<!doctype html><body style="margin:0"><div id="root" style="width:${width}px"></div></body>`);
  if (STUBS) await page.addScriptTag({ content: STUBS });
  await page.addScriptTag({ content: src });
  const r = await page.evaluate(
    async ({ tag, config, hass, mutate }) => {
      const frames = (n) => new Promise((done) => { const f = (k) => (k ? requestAnimationFrame(() => f(k - 1)) : done()); f(n); });
      const el = document.createElement(tag);
      el.setConfig({ type: `custom:${tag}`, ...config });
      hass.callWS = () => new Promise(() => {});
      hass.callService = async () => {};
      el.hass = hass;
      document.getElementById("root").appendChild(el);
      await frames(6);
      await new Promise((done) => setTimeout(done, 300));
      await frames(3);
      const step = new Function("states", "i", mutate);
      const counts = { unrelated: 0, removed: 0 };
      let kind = "unrelated";
      const count = (list) => {
        for (const m of list) {
          if (kind === "unrelated") counts.unrelated++;
          else if (m.type === "childList") counts.removed += [...m.removedNodes].filter((n) => n.nodeType === 1).length;
        }
      };
      const mo = new MutationObserver(count);
      const media = [...el.shadowRoot.querySelectorAll("img, svg")];
      mo.observe(el.shadowRoot, { subtree: true, childList: true, attributes: true, characterData: true });
      const heights = new Set();
      let run = true;
      const tick = () => {
        heights.add(Math.round(el.getBoundingClientRect().height));
        if (run) requestAnimationFrame(tick);
      };
      tick();
      let h = hass;
      for (let i = 0; i < 20; i++) {
        kind = i % 2 ? "related" : "unrelated";
        const states = { ...h.states };
        if (kind === "unrelated") states["sensor.layout_probe"] = { entity_id: "sensor.layout_probe", state: String(i), attributes: {} };
        else step(states, i);
        h = { ...h, states };
        el.hass = h;
        count(mo.takeRecords());
        await frames(2);
      }
      run = false;
      mo.disconnect();
      return { ...counts, heights: [...heights], mediaKept: media.every((n) => n.isConnected), media: media.length };
    },
    { tag, config, hass: HASS(), mutate: MUTATE }
  );
  await page.close();
  return { ...r, errors };
};

const MUTATE = `const set = (id, v) => (states[id] = { ...states[id], state: String(v) });
set("sensor.freebox_download_speed", 1000 + ((i * 7919) % 90000));
set("sensor.freebox_upload_speed", 100 + ((i * 3571) % 9000));
set("sensor.freebox_temperature_cpu_0", 50 + (i % 9));`;

for (const [tag, config, width] of [["internet-box-mini-card", {}, 260], ["internet-box-mini-card", {}, 480], ["internet-box-card", {}, 300], ["internet-box-card", {}, 480]]) {
  test(`${tag} at ${width} px: no write on unrelated updates, patched in place, constant height`, async (t) => {
    if (skip) return t.skip(skip);
    const r = await probe(tag, config, width);
    assert.deepEqual(r.errors, []);
    assert.equal(r.unrelated, 0, "an unrelated state change writes nothing");
    assert.equal(r.removed, 0, "no element replaced by an update of the card's own entities");
    assert.ok(r.media > 0 && r.mediaKept, "the pictures and icons are kept");
    assert.equal(r.heights.length, 1, `one height on every frame, got ${r.heights}`);
  });
}
