// Browser test (Chromium through Playwright) of the cards at their narrowest: at the minimum width they declare in
// getGridOptions (a narrow 320 px section of the Sections view), and for the header also at 6 columns of it, the
// title keeps a few characters, no button, pill or picture covers it and nothing leaves the card. In English and
// in the longest translations. Skipped when Playwright or Chromium is not installed, except in CI, where it must run.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { devices, entities, states } from "../scripts/mock-states.mjs";

const src = readFileSync(new URL("../src/internet-box-card.js", import.meta.url), "utf8");
const LANGS = ["en", "pl", "sr-Latn", "sr"];
// Width of n columns of a 320 px section (12 columns, 8 px gaps).
const cols = (n) => Math.floor(((320 + 8) * n) / 12 - 8);

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

// Renders a card at a width and measures its header and tiles.
async function measure(type, width, language) {
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><body style="margin:0;font-family:sans-serif"><div id=root style="width:${width}px"></div></body>`);
  // ha-card as in Home Assistant: a block, so that it is the size container of the card's queries.
  await page.addScriptTag({
    content: `customElements.define("ha-card", class extends HTMLElement {
      constructor() { super(); this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block}</style><slot></slot>"; }
    });`,
  });
  await page.addScriptTag({ content: src });
  const res = await page.evaluate(
    async ({ type, language, states, entities, devices }) => {
      const el = document.createElement(type);
      el.setConfig({ type: `custom:${type}`, language });
      el.hass = { states, entities, devices, language, config: { time_zone: "UTC" } };
      document.getElementById("root").appendChild(el);
      // The box picture (a data: URI) takes its width once loaded; a hidden one may never load.
      const imgs = [...el.shadowRoot.querySelectorAll("img")];
      await Promise.all(imgs.map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 1000); }))));
      const root = el.shadowRoot;
      const card = root.querySelector("ha-card").getBoundingClientRect();
      const rect = (n) => n.getBoundingClientRect();
      const hits = (a, b) => a.right > b.left + 0.5 && a.left < b.right - 0.5 && a.bottom > b.top + 0.5 && a.top < b.bottom - 0.5;
      const name = rect(root.querySelector(".name"));
      // Header parts that must not cover the title, nor each other.
      const parts = [".logo-link", ".box-link", ".chip.status", ".action", ".zoom"]
        .map((s) => [s, root.querySelector(s)])
        .filter(([, n]) => n && rect(n).width);
      const covering = parts.filter(([, n]) => hits(rect(n), name)).map(([s]) => s);
      const clashes = [];
      for (let i = 0; i < parts.length; i++)
        for (let j = i + 1; j < parts.length; j++) if (hits(rect(parts[i][1]), rect(parts[j][1]))) clashes.push(`${parts[i][0]} × ${parts[j][0]}`);
      const outside = [...root.querySelectorAll(".header *, .tile, .tile *, .chip, .foot *")]
        .filter((n) => rect(n).width && (rect(n).right > card.right + 0.5 || rect(n).left < card.left - 0.5))
        .map((n) => n.className.baseVal ?? n.className);
      // Text cut without an ellipsis (it overflows its box and is clipped by the card or a parent).
      const clipped = [...root.querySelectorAll(".tile .v")]
        .filter((n) => n.scrollWidth > n.clientWidth + 1 && getComputedStyle(n).textOverflow !== "ellipsis")
        .map((n) => n.textContent);
      const buttons = [...root.querySelectorAll(".action, .zoom")].map((n) => Math.round(rect(n).width));
      const pill = root.querySelector(".chip.status");
      const parts2 = [...root.querySelectorAll(".part")];
      const partition = parts2.map((n) => {
        const grow = rect(n.querySelector(".grow"));
        const detail = rect(n.querySelector(".detail"));
        return { name: Math.round(grow.width), overlaps: hits(grow, detail) || hits(rect(n.querySelector(".muted")), detail) };
      });
      return {
        name: Math.round(name.width),
        covering,
        clashes,
        outside,
        clipped,
        buttons,
        pillLabel: pill?.getAttribute("aria-label") ?? null,
        partition,
        minColumns: el.getGridOptions().min_columns,
      };
    },
    { type, language, states, entities, devices }
  );
  await page.close();
  return res;
}

// About 4 characters of the 16 px title, the last one possibly an ellipsis.
const MIN_TITLE = 32;

test("the full card is readable at its minimum width, and its header at 6 columns", async (t) => {
  if (skip) return t.skip(skip);
  const { minColumns } = await measure("internet-box-card", 500, "en");
  assert.equal(minColumns, 9);
  for (const language of LANGS) {
    for (const width of [cols(minColumns), cols(6), 330]) {
      const r = await measure("internet-box-card", width, language);
      const at = `${language} @ ${width}px`;
      assert.ok(r.name >= MIN_TITLE, `${at}: title ${r.name}px`);
      assert.deepEqual(r.covering, [], `${at}: title covered`);
      assert.deepEqual(r.clashes, [], `${at}: header parts overlap`);
      assert.deepEqual(r.outside, [], `${at}: out of the card`);
      assert.deepEqual(r.buttons, [24], `${at}: restart button`);
      // The status text stays the pill's accessible name when only its dot is shown.
      assert.match(r.pillLabel, /·/, at);
      if (width >= cols(minColumns)) assert.deepEqual(r.clipped, [], `${at}: tile text cut`);
    }
  }
});

test("the mini card is readable at its minimum width", async (t) => {
  if (skip) return t.skip(skip);
  for (const language of LANGS) {
    for (const width of [cols(6), 165, 240]) {
      const r = await measure("internet-box-mini-card", width, language);
      const at = `${language} @ ${width}px`;
      assert.equal(r.minColumns, 6);
      assert.ok(r.name >= MIN_TITLE, `${at}: title ${r.name}px`);
      assert.deepEqual(r.covering, [], `${at}: title covered`);
      assert.deepEqual(r.clashes, [], `${at}: header parts overlap`);
      assert.deepEqual(r.outside, [], `${at}: out of the card`);
      assert.deepEqual(r.clipped, [], `${at}: tile text cut`);
      assert.deepEqual(r.buttons, [24], `${at}: detail button`);
    }
  }
});

test("the partition name stays readable next to the disk model and the used / free texts", async (t) => {
  if (skip) return t.skip(skip);
  for (const language of ["en", "it", "nl", "pt", "pl", "sr"]) {
    for (const width of [cols(9), 330]) {
      const { partition } = await measure("internet-box-card", width, language);
      assert.ok(partition.length, "the mock has a partition");
      for (const p of partition) {
        // 5em of the 13 px row text.
        assert.ok(p.name >= 60, `${language} @ ${width}px: partition name ${p.name}px`);
        assert.equal(p.overlaps, false, `${language} @ ${width}px: row over the used / free texts`);
      }
    }
  }
});
