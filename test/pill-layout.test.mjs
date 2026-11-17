// Browser test (Chromium through Playwright) of the status pill of the illustrated and the classic header, on the full card and the mini
// card (compact and zoomed), light and dark, in en, fr, de, hu, el and ru, from 245 to 500 px: the pill sits on the
// title's row only beside the whole title (no ellipsis); otherwise on a line of its own under the subtitle. Its label
// is whole, or its dot alone (always at 190 px). Nothing runs into the ground strip or out of the banner.
// Skipped when Playwright or Chromium is not installed.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { devices, entities, states } from "../scripts/mock-states.mjs";

const src = readFileSync(new URL("../src/internet-box-card.js", import.meta.url), "utf8");
const HA_CARD = `customElements.define("ha-card", class extends HTMLElement { constructor() { super();
  this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;overflow:hidden}</style><slot></slot>"; } });`;
let browser;
let skip = false;
before(async () => {
  try {
    const { chromium } = await import("playwright");
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  } catch (err) {
    skip = `Chromium not available: ${err.message.split("\n")[0]}`;
  }
});
after(() => browser?.close());

test("the banner's status pill: beside the whole title or under the subtitle, whole label or dot, inside the banner", { timeout: 600000 }, async (t) => {
  if (skip) return t.skip(skip);
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.setContent("<!doctype html><body style='margin:0;font-family:Roboto,Arial,sans-serif'></body>");
  await page.addScriptTag({ content: HA_CARD });
  await page.addScriptTag({ content: src });
  const cases = [];
  for (const [type, zoom] of [["internet-box-card", false], ["internet-box-mini-card", false], ["internet-box-mini-card", true]])
    for (const language of ["en", "fr", "de", "hu", "el", "ru"])
      for (const dark of [false, true])
        for (const variant of ["online", "offline", "classic", "classic offline"]) for (const width of [190, 245, 300, 400, 460, 500]) cases.push({ type, zoom, language, dark, variant, width });
  const results = await page.evaluate(
    async ({ cases, data }) => {
      const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await document.fonts.ready;
      const out = [];
      for (const c of cases) {
        const box = document.body.appendChild(document.createElement("div"));
        box.style.width = `${c.width}px`;
        const el = document.createElement(c.type);
        const st = c.variant.endsWith("offline") ? data.offline : data.states;
        el.setConfig({ type: `custom:${c.type}`, language: c.language, ...(c.variant.startsWith("classic") ? { illustration: false } : {}) });
        el.hass = { states: st, entities: data.entities, devices: data.devices, language: c.language, locale: { language: c.language }, themes: { darkMode: c.dark },
                    config: { time_zone: "UTC" }, callService: async () => {} };
        box.appendChild(el);
        await frame();
        if (c.zoom) {
          el.shadowRoot.querySelector(".zoom").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, detail: 1 }));
          await frame();
        }
        // The banner, or the classic header (illustration: false) inside the card.
        for (const t of el.shadowRoot.querySelectorAll(".header .titles")) {
          const inBanner = t.closest(".banner");
          const banner = (inBanner || t.closest("ha-card")).getBoundingClientRect();
          const floor = inBanner ? inBanner.querySelector(".ground").getBoundingClientRect().top : Infinity;
          const pill = t.querySelector(".chip.status");
          const tx = pill?.querySelector(".txt");
          const nameEl = t.querySelector(".name");
          const name = nameEl.getBoundingClientRect();
          const p = pill?.getBoundingClientRect();
          const parts = [...t.querySelectorAll(":scope > *, .trow > *")].map((e) => e.getBoundingClientRect()).filter((r) => r.width);
          const tb = t.getBoundingClientRect();
          out.push({
            ...c,
            label: pill?.getAttribute("title") || pill?.textContent,
            dot: tx ? getComputedStyle(tx).display === "none" : null,
            cut: tx ? tx.scrollWidth - tx.clientWidth : null,
            beside: p ? p.top < name.bottom - 2 : false,
            titleCut: nameEl.scrollWidth - nameEl.clientWidth,
            nameW: name.width,
            // The classic header's box picture, still shown next to the title block.
            pic: !inBanner && !!t.closest(".header").querySelector(":scope > .box-link")?.getClientRects().length,
            past: p ? p.right - tb.right : 0,
            low: Math.max(...parts.map((r) => r.bottom)) - floor,
            out: Math.max(banner.top - Math.min(...parts.map((r) => r.top)), Math.max(...parts.map((r) => r.right)) - banner.right,
                          banner.left - Math.min(...parts.map((r) => r.left))),
          });
        }
        box.remove();
      }
      return out;
    },
    { cases, data: { states, entities, devices, offline: { ...states, "device_tracker.freebox_v9_r1": { ...states["device_tracker.freebox_v9_r1"], state: "not_home" } } } },
  );
  await page.close();
  assert.ok(results.length >= cases.length, "a case without a banner");
  for (const r of results) {
    const at = `${r.type}${r.zoom ? " zoomed" : ""} ${r.variant} ${r.language} ${r.dark ? "dark" : "light"} ${r.width}px`;
    assert.ok(r.cut !== null, `no pill: ${at}`);
    if (r.width <= 200) assert.ok(r.dot, `pill label shown at ${at}`);
    if (!r.dot) assert.ok(r.cut <= 0.5, `pill "${r.label}" cut by ${r.cut}px: ${at}`);
    if (r.beside) assert.ok(r.titleCut <= 0, `title cut beside the pill: ${at}`);
    assert.ok(r.nameW >= 24, `title ${r.nameW}px wide: ${at}`);
    // The picture gives way first: never shown beside a cut title or a pill reduced to its dot (above 200 px).
    if (r.pic) assert.ok(r.titleCut <= 0, `title cut beside the box picture: ${at}`);
    if (r.pic && r.width > 200) assert.ok(!r.dot, `pill reduced to its dot beside the box picture: ${at}`);
    assert.ok(r.past <= 0.5, `pill ${r.past}px past the title block: ${at}`);
    assert.ok(r.low <= 0.5, `header text ${r.low}px into the ground strip: ${at}`);
    assert.ok(r.out <= 0.5, `header text ${r.out}px out of the banner: ${at}`);
  }
});
