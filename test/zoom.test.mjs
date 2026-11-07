// Browser test (Chromium through Playwright) of the detail button of the mini card: it switches to the full card
// and back, a click outside the card folds it back, a click inside it or in a dialog opened from it does not, and
// `zoom: false` removes the button. Skipped when Playwright or Chromium is not installed, except in CI, where it
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

// A page with a mini card (`config` over its defaults), an outside element and a dialog.
const open = async (config = {}) => {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setContent("<!doctype html><body><div id=root></div><p id=outside>outside</p><dialog open><b>x</b></dialog></body>");
  await page.addScriptTag({ content: src });
  await page.evaluate(
    ({ config, states, entities, devices }) => {
      const el = document.createElement("internet-box-mini-card");
      el.setConfig({ type: "custom:internet-box-mini-card", ...config });
      el.hass = { states, entities, devices, language: "en", config: { time_zone: "UTC" } };
      document.getElementById("root").appendChild(el);
      window.card = el;
      window.click = (node, detail = 1) =>
        node.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail }));
      window.view = () => {
        const root = el.shadowRoot;
        const zoom = root.querySelector(".zoom");
        return {
          full: !!root.querySelector(".section-title"),
          mini: !!root.querySelector(".foot"),
          icon: zoom?.querySelector("path")?.getAttribute("d").slice(0, 12) ?? null,
          title: zoom?.title ?? null,
          last: zoom ? zoom === root.querySelector(".header").lastElementChild : null,
          size: el.getCardSize(),
          columns: el.getGridOptions().columns,
          focused: !!zoom && root.activeElement === zoom,
        };
      };
    },
    { config, states, entities, devices }
  );
  return { page, errors };
};

const EXPAND = "M10,21V19H6.";
const COLLAPSE = "M19.5,3.09L1";

test("the detail button shows the full card and goes back to the mini card", async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors } = await open();
  const mini = await page.evaluate(() => window.view());
  assert.deepEqual(mini, { full: false, mini: true, icon: EXPAND, title: "Show the full card", last: true, size: 3, columns: 6, focused: false });
  const res = await page.evaluate(() => {
    let bubbled = 0;
    document.addEventListener("click", () => bubbled++);
    window.click(window.card.shadowRoot.querySelector(".zoom"));
    const zoomed = window.view();
    const root = window.card.shadowRoot;
    const sections = [...root.querySelectorAll(".section-title")].map((n) => n.textContent);
    const gauges = root.querySelectorAll(".gauge").length;
    window.click(root.querySelector(".zoom"));
    return { zoomed, sections, gauges, back: window.view(), bubbled };
  });
  assert.deepEqual(res.zoomed, {
    full: true,
    mini: false,
    icon: COLLAPSE,
    title: "Back to the compact view",
    last: true,
    size: 7,
    columns: 12,
    focused: false,
  });
  // Everything the full card shows.
  assert.deepEqual(res.sections, ["Network", "System", "Storage", "Services"]);
  assert.ok(res.gauges > 0);
  assert.deepEqual(res.back, mini);
  assert.equal(res.bubbled, 0, "the button click must not propagate");
  assert.deepEqual(errors, []);
  await page.close();
});

test("from the keyboard, the focus stays on the detail button", async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors } = await open();
  await page.evaluate(() => window.card.shadowRoot.querySelector(".zoom").focus());
  await page.keyboard.press("Enter");
  assert.deepEqual(await page.evaluate(() => [window.view().full, window.view().focused]), [true, true]);
  await page.keyboard.press("Space");
  assert.deepEqual(await page.evaluate(() => [window.view().mini, window.view().focused]), [true, true]);
  assert.deepEqual(errors, []);
  await page.close();
});

test("a click outside folds the card back, a click inside it or in a dialog does not", async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors } = await open();
  const res = await page.evaluate(() => {
    const root = window.card.shadowRoot;
    window.click(root.querySelector(".zoom"));
    window.click(root.querySelector(".section-title"));
    const inside = window.view().full;
    window.click(document.querySelector("dialog b"));
    const dialog = window.view().full;
    window.click(document.getElementById("outside"));
    const outside = window.view().full;
    // Removed from the page: no more listener.
    window.click(root.querySelector(".zoom"));
    window.card.remove();
    window.click(document.getElementById("outside"));
    return { inside, dialog, outside, detached: window.card._zoomed };
  });
  assert.deepEqual(res, { inside: true, dialog: true, outside: false, detached: true });
  assert.deepEqual(errors, []);
  await page.close();
});

test("the former freebox-card / freebox-mini-card types still render the same cards", async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors } = await open();
  const res = await page.evaluate(
    ({ states, entities, devices }) =>
      ["freebox-card", "freebox-mini-card"].map((type) => {
        const el = document.createElement(type);
        el.setConfig({ type: `custom:${type}` });
        el.hass = { states, entities, devices, language: "en", config: { time_zone: "UTC" } };
        document.body.appendChild(el);
        const root = el.shadowRoot;
        return [type, !!root.querySelector(".section-title"), !!root.querySelector(".foot")];
      }),
    { states, entities, devices }
  );
  assert.deepEqual(res, [
    ["freebox-card", true, false],
    ["freebox-mini-card", false, true],
  ]);
  assert.deepEqual(errors, []);
  await page.close();
});

test("zoom: false removes the detail button", async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors } = await open({ zoom: false });
  const v = await page.evaluate(() => window.view());
  assert.equal(v.icon, null);
  assert.ok(v.mini);
  assert.deepEqual(errors, []);
  await page.close();
});

test("the status pill sits right of the title, centred on its line, and the Wi-Fi state is not duplicated under it (the Services section shows it)", async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors } = await open();
  const res = await page.evaluate(() => {
    const root = window.card.shadowRoot;
    window.click(root.querySelector(".zoom"));
    const header = root.querySelector(".header");
    const status = root.querySelector(".titles > .chip.status");
    const centre = (n) => n.getBoundingClientRect().top + n.getBoundingClientRect().height / 2;
    return {
      row: [...header.children].map((n) => n.className.split(" ")[0]),
      status: status.textContent,
      dy: Math.abs(centre(status) - centre(root.querySelector(".name"))) <= 1,
      right: status.getBoundingClientRect().left > root.querySelector(".sub").getBoundingClientRect().right,
      under: [...root.querySelectorAll(".titles .chips .chip")].map((n) => n.textContent),
    };
  });
  assert.deepEqual(res, { row: ["logo-link", "titles", "box-link", "action", "zoom"], status: "Online · FTTH", dy: true, right: true, under: [] });
  assert.deepEqual(errors, []);
  await page.close();
});

test("the brand logo of the mini card keeps the full card's size (40 px, logo badge 18 px)", async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors } = await open();
  const res = await page.evaluate(() => {
    const root = window.card.shadowRoot;
    const size = () => {
      const r = (sel) => root.querySelector(sel).getBoundingClientRect();
      return { link: [r(".logo-link").width, r(".logo-link").height], logo: r(".logo").width };
    };
    const mini = size();
    window.click(root.querySelector(".zoom"));
    return { mini, full: size() };
  });
  assert.deepEqual(res.mini, { link: [40, 40], logo: 18 });
  assert.deepEqual(res.mini, res.full);
  assert.deepEqual(errors, []);
  await page.close();
});

// The focus put back after a re-render (detail button from the keyboard, confirm button of the restart popup) must
// not scroll the page: in a long dashboard the card may be partly off screen.
test("the focus moved after a re-render does not scroll the page", async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors } = await open();
  const res = await page.evaluate(async () => {
    const calls = [];
    const focus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function (opts) {
      calls.push([this.className, opts?.preventScroll === true]);
      return focus.call(this, opts);
    };
    const root = window.card.shadowRoot;
    // Keyboard activation (no click count) of the detail button, then the restart popup of the full view.
    window.click(root.querySelector(".zoom"), 0);
    window.click(root.querySelector(".action"));
    HTMLElement.prototype.focus = focus;
    return calls;
  });
  assert.deepEqual(res, [
    ["zoom", true],
    ["act danger", true],
  ]);
  assert.deepEqual(errors, []);
  await page.close();
});

// The restart popup is a modal dialog: named by its title, the focus kept on its two buttons, Escape (wherever the
// focus is) closes it and gives the focus back to the restart button, and a double click on its button does not
// reach what lies under it.
test("the restart popup traps the focus, closes on Escape and gives the focus back", async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors } = await open();
  await page.evaluate(() => {
    const root = window.card.shadowRoot;
    window.click(root.querySelector(".zoom"));
    root.querySelector(".action").focus();
  });
  await page.keyboard.press("Enter");
  const focused = () => page.evaluate(() => window.card.shadowRoot.activeElement?.className ?? null);
  const opened = await page.evaluate(() => {
    const modal = window.card.shadowRoot.querySelector(".modal");
    return [modal.getAttribute("aria-modal"), window.card.shadowRoot.getElementById(modal.getAttribute("aria-labelledby"))?.textContent];
  });
  assert.deepEqual(opened, ["true", "Restart the box"]);
  assert.equal(await focused(), "act danger");
  await page.keyboard.press("Tab");
  assert.equal(await focused(), "act cancel");
  await page.keyboard.press("Tab");
  assert.equal(await focused(), "act danger");
  await page.keyboard.press("Shift+Tab");
  assert.equal(await focused(), "act cancel");
  // Focus out of the card (a click on the popup's text, say): Escape still closes it.
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press("Escape");
  assert.deepEqual(await page.evaluate(() => [!!window.card.shadowRoot.querySelector(".modal"), window.view().full]), [false, true]);
  assert.equal(await focused(), "action");
  assert.deepEqual(errors, []);
  await page.close();
});

test("a double click on the popup's button does not act on what lies under it", async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors } = await open();
  const res = await page.evaluate(() => {
    const root = window.card.shadowRoot;
    const calls = [];
    window.card._press = (id) => calls.push(id);
    window.click(root.querySelector(".zoom"));
    window.click(root.querySelector(".action"));
    window.click(root.querySelector(".modal .danger"));
    // The second click of the double click lands on the detail button: ignored.
    window.click(root.querySelector(".zoom"));
    return { calls: calls.length, full: window.view().full };
  });
  assert.deepEqual(res, { calls: 1, full: true });
  assert.deepEqual(errors, []);
  await page.close();
});

test("a click outside closes the restart popup, reaches its target and leaves the card zoomed", async (t) => {
  if (skip) return t.skip(skip);
  const { page, errors } = await open();
  const res = await page.evaluate(() => {
    const root = window.card.shadowRoot;
    let reached = 0;
    document.getElementById("outside").addEventListener("click", () => reached++);
    window.click(root.querySelector(".zoom"));
    window.click(root.querySelector(".action"));
    window.click(document.getElementById("outside"));
    const first = { popup: !!root.querySelector(".modal"), full: window.view().full, reached };
    window.click(document.getElementById("outside"));
    return { first, second: { full: window.view().full, reached } };
  });
  assert.deepEqual(res, { first: { popup: false, full: true, reached: 1 }, second: { full: false, reached: 2 } });
  assert.deepEqual(errors, []);
  await page.close();
});
