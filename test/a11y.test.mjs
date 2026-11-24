// Browser test (Chromium through Playwright) of the missed calls controls: the "mark calls as read"
// button must not sit inside an element with role="button" (its descendants are presentational for
// assistive technologies, so the button would be unreachable). Skipped when Playwright or Chromium is
// not installed, except in CI, where it must run. CHROMIUM_PATH points to a local Chromium if needed.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { devices, entities, states } from "../scripts/mock-states.mjs";
import { source } from "./source.mjs";

const src = source;

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

for (const type of ["internet-box-card", "internet-box-mini-card"]) {
  test(`${type}: mark calls as read is reachable and the missed calls stay keyboard operable`, async (t) => {
    if (skip) return t.skip(skip);
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setContent("<!doctype html><body><div id=root></div></body>");
    await page.addScriptTag({ content: src });
    const res = await page.evaluate(
      ({ type, states, entities, devices }) => {
        const calls = (window.calls = []);
        const opened = [];
        const el = document.createElement(type);
        el.setConfig({ type: `custom:${type}` });
        el.hass = {
          states,
          entities,
          devices,
          language: "en",
          config: { time_zone: "UTC" },
          callService: (...a) => calls.push(a),
        };
        el.addEventListener("hass-more-info", (e) => opened.push(e.detail.entityId));
        document.getElementById("root").appendChild(el);
        const root = el.shadowRoot;
        const nested = root.querySelectorAll('[role="button"] button, [role="button"] [role="button"]').length;
        const reset = root.querySelector("button.reset");
        reset.click();
        const owner = root.querySelector('[data-key="sensor.freebox_missed_calls"]');
        const target = owner.querySelector('[role="button"]') ?? (owner.getAttribute("role") === "button" ? owner : null);
        target.focus();
        target.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, composed: true }));
        return { nested, label: reset.getAttribute("aria-label"), focused: root.activeElement === target, opened };
      },
      { type, states, entities, devices }
    );
    const calls = await page.evaluate(() => window.calls);
    assert.equal(res.nested, 0, "a control is nested in a role=button element");
    assert.equal(res.label, "Mark calls as read");
    assert.ok(res.focused);
    assert.deepEqual(res.opened, ["sensor.freebox_missed_calls"]);
    assert.deepEqual(calls, [["button", "press", { entity_id: "button.freebox_mark_calls_as_read" }]]);
    assert.deepEqual(errors, []);
    await page.close();
  });
}

test("internet-box-mini-card: the missed calls stay visible at 0, plain and without the mark as read button", async (t) => {
  if (skip) return t.skip(skip);
  const page = await browser.newPage();
  await page.setContent("<!doctype html><body><div id=root></div></body>");
  await page.addScriptTag({ content: src });
  const res = await page.evaluate(
    ({ states, entities, devices }) => {
      const id = "sensor.freebox_missed_calls";
      const el = document.createElement("internet-box-mini-card");
      el.setConfig({ type: "custom:internet-box-mini-card" });
      el.hass = {
        states: { ...states, [id]: { ...states[id], state: "0" } },
        entities,
        devices,
        language: "en",
        config: { time_zone: "UTC" },
        callService: () => {},
      };
      document.getElementById("root").appendChild(el);
      const chip = el.shadowRoot.querySelector(`.foot [data-key="${id}"]`);
      return chip && { text: chip.textContent.trim(), warn: chip.classList.contains("warn"), reset: !!chip.querySelector(".reset") };
    },
    { states, entities, devices }
  );
  assert.deepEqual(res, { text: "0", warn: false, reset: false });
  await page.close();
});
