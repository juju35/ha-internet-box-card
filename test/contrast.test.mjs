// Browser test (Chromium through Playwright) of the WCAG contrast of the operator accent and the state colours, in
// Home Assistant's default light and dark themes: text needs 4.5:1, meaningful icons and graphics 3:1. The colours
// are read from the rendered card and flattened on a canvas, so color-mix() and translucent backgrounds count as
// the browser paints them. Skipped when Playwright or Chromium is not installed, except in CI, where it must run.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { operators } from "../scripts/mock-operators.mjs";
import { devices, entities, states } from "../scripts/mock-states.mjs";

const src = readFileSync(new URL("../src/internet-box-card.js", import.meta.url), "utf8");

// Home Assistant's default theme colours (frontend src/resources/theme).
const THEMES = {
  light: {
    "--secondary-background-color": "#e5e5e5",
    "--card-background-color": "#ffffff",
    "--primary-text-color": "#212121",
    "--secondary-text-color": "#727272",
    "--success-color": "#4caf50",
    "--warning-color": "#ff9800",
    "--error-color": "#db4437",
    "--info-color": "#039be5",
  },
  dark: {
    "--secondary-background-color": "#282828",
    "--card-background-color": "#1c1c1c",
    "--primary-text-color": "#e1e1e1",
    "--secondary-text-color": "#9b9b9b",
    "--success-color": "#4caf50",
    "--warning-color": "#ff9800",
    "--error-color": "#db4437",
    "--info-color": "#039be5",
  },
};

const HA_CARD = `customElements.define("ha-card", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML =
      "<style>:host{display:block;background:var(--card-background-color);color:var(--primary-text-color)}</style><slot></slot>";
  }
});`;

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

// Renders the full card and returns the contrast ratio of each checked element against what is painted under it.
async function measure(type, theme, mock) {
  const page = await browser.newPage();
  await page.setContent(
    `<!doctype html><style>:root{${Object.entries(THEMES[theme])
      .map(([k, v]) => `${k}:${v};`)
      .join("")}}</style><div id=root></div>`
  );
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: src });
  const res = await page.evaluate(({ type, mock }) => {
    const el = document.createElement(type);
    el.setConfig({ type: `custom:${type}`, ...mock.config });
    el.hass = { ...mock, language: "en", config: { time_zone: "UTC" }, callService() {} };
    document.getElementById("root").appendChild(el);
    const root = el.shadowRoot;
    root.querySelector(".action")?.click(); // restart confirmation popup, when the box can restart
    const ctx = Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", {
      willReadFrequently: true,
    });
    // Paints the colours bottom to top on one pixel and returns the result, as sRGB 0-255.
    const paint = (...colors) => {
      ctx.clearRect(0, 0, 1, 1);
      for (const c of colors) {
        ctx.fillStyle = c;
        ctx.fillRect(0, 0, 1, 1);
      }
      return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
    };
    const lum = (rgb) => {
      const [r, g, b] = rgb.map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a, b) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    // Background stack of a node: its translucent backgrounds up to the first opaque one (the card).
    const under = (node) => {
      const layers = [];
      for (let n = node; n; n = n.parentElement ?? n.getRootNode().host) {
        const bg = getComputedStyle(n).backgroundColor;
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") layers.unshift(bg);
        if (n.tagName === "HA-CARD") break;
      }
      return layers;
    };
    const card = getComputedStyle(root.querySelector("ha-card")).backgroundColor;
    const check = (sel) =>
      [...root.querySelectorAll(sel)].map((n) => {
        const bg = paint(card, ...under(n));
        return ratio(paint(...bg.length ? [`rgb(${bg})`] : [], getComputedStyle(n).color), bg);
      });
    return {
      tileIcons: check(".tile .icon"),
      chips: check(".chip"),
      danger: check(".modal button.danger"),
      dialogIcon: check(".modal h3 .icon"),
      footText: check(".foot .warn, .foot .crit"),
      footIcons: check(".foot .ok .icon, .foot .reset"),
    };
  }, { type, mock });
  await page.close();
  return res;
}

const MIN = { tileIcons: 3, dialogIcon: 3, footIcons: 3, chips: 4.5, danger: 4.5, footText: 4.5 };
const MOCKS = { freebox: { states, entities, devices, config: {} }, ...operators };
for (const type of ["internet-box-card", "internet-box-mini-card"])
  for (const theme of Object.keys(THEMES))
    for (const [name, mock] of Object.entries(MOCKS))
      test(`${type}, ${name}, ${theme} theme: accent and state colours are readable`, async (t) => {
        if (skip) return t.skip(skip);
        const r = await measure(type, theme, mock);
        assert.ok(r.tileIcons.length > 0);
        const low = Object.entries(r).flatMap(([k, list]) =>
          list.filter((v) => v < MIN[k]).map((v) => `${k} ${v.toFixed(2)}:1 < ${MIN[k]}:1`)
        );
        assert.deepEqual(low, []);
      });
