// Screenshot helpers (scripts/capture.mjs): the GIF frames freeze every animation, those in shadow roots included
// (the card's), and a capture only replaces a file whose decoded pixels differ. Browser part skipped when Playwright
// or Chromium is not installed, except in CI; ffmpeg part skipped when ffmpeg is not on PATH.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { freezeAnimations, saveIfChanged } from "../scripts/capture.mjs";

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

test("the GIF frames freeze the animations inside shadow roots", async (t) => {
  if (skip) return t.skip(skip);
  const page = await browser.newPage();
  await page.setContent("<!doctype html><div id=host></div>");
  await page.evaluate(() => {
    document.getElementById("host").attachShadow({ mode: "open" }).innerHTML =
      "<style>@keyframes s { to { transform: rotate(360deg) } } b { display: block; width: 40px; height: 8px; background: red; margin: 20px; animation: s 1s linear infinite }</style><b></b>";
  });
  const frozen = await freezeAnimations(page, 250);
  assert.equal(frozen, 1);
  const clip = { x: 0, y: 0, width: 80, height: 50 };
  const a = await page.screenshot({ clip });
  await page.waitForTimeout(300);
  const b = await page.screenshot({ clip });
  assert.ok(a.equals(b), "the frame changed while frozen");
  // The same time gives the same frame.
  await freezeAnimations(page, 250);
  assert.ok(a.equals(await page.screenshot({ clip })));
  await page.close();
});

const hasFfmpeg = (() => {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

test("a capture replaces the file only when its pixels change", (t) => {
  if (!hasFfmpeg) return t.skip("ffmpeg not on PATH");
  const dir = mkdtempSync(join(tmpdir(), "ibc-capture-"));
  const png = (name, color, level) => {
    const f = join(dir, name);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", `color=${color}:s=16x16`, "-frames:v", "1", "-compression_level", String(level), f]);
    return f;
  };
  try {
    const dest = png("dest.png", "red", 9);
    const before = readFileSync(dest);
    // Same pixels, other bytes (another compression level): the file is kept as it is.
    const same = png("same.png", "red", 0);
    assert.notDeepEqual(readFileSync(same), before);
    assert.equal(saveIfChanged(same, dest), false);
    assert.deepEqual(readFileSync(dest), before);
    assert.throws(() => statSync(same), "the temporary capture is removed");
    // Other pixels: replaced.
    const other = png("other.png", "blue", 9);
    const otherBytes = readFileSync(other);
    assert.equal(saveIfChanged(other, dest), true);
    assert.deepEqual(readFileSync(dest), otherBytes);
    // A new file is written.
    assert.equal(saveIfChanged(png("n.png", "red", 9), join(dir, "new.png")), true);
    assert.ok(statSync(join(dir, "new.png")).size > 0);
  } finally {
    rmSync(dir, { recursive: true });
  }
});

// The comparison sees every channel: two opaque pictures of other colours (same alpha), or one that differs from the
// other in a single channel by one level, are different pixels and replace the file; a difference in alpha alone too.
test("a capture that differs in any one channel replaces the file", (t) => {
  if (!hasFfmpeg) return t.skip("ffmpeg not on PATH");
  const dir = mkdtempSync(join(tmpdir(), "ibc-capture-"));
  const png = (name, rgba) => {
    const f = join(dir, name);
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", `color=0x${rgba}:s=16x16,format=rgba`, "-frames:v", "1", f]);
    return f;
  };
  try {
    for (const [base, other] of [
      ["ff0000ff", "0000ffff"],
      ["808080ff", "818080ff"],
      ["808080ff", "808180ff"],
      ["808080ff", "808081ff"],
      ["808080ff", "808080fe"],
    ]) {
      const dest = png(`dest-${base}.png`, base);
      const fresh = png(`fresh-${other}.png`, other);
      const bytes = readFileSync(fresh);
      assert.equal(saveIfChanged(fresh, dest), true, `${base} → ${other} kept the old file`);
      assert.deepEqual(readFileSync(dest), bytes);
    }
  } finally {
    rmSync(dir, { recursive: true });
  }
});
