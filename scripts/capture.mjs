// Screenshot helpers shared by scripts/screenshots.mjs (and tested by test/capture.test.mjs).
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, rmSync } from "node:fs";

// Pauses every running animation of the page at `time` ms, those inside shadow roots included (the card's fan:
// document.getAnimations() leaves them out), so a frame depends only on `time`, never on the machine's speed.
// Returns the number of animations frozen.
export function freezeAnimations(page, time) {
  return page.evaluate((t) => {
    const roots = [document];
    for (let i = 0; i < roots.length; i++)
      for (const el of roots[i].querySelectorAll("*")) if (el.shadowRoot) roots.push(el.shadowRoot);
    const all = new Set(roots.flatMap((r) => r.getAnimations()));
    for (const a of all) {
      a.pause();
      a.currentTime = t;
    }
    return all.size;
  }, time);
}

// Decoded pixels of an image (every frame of a GIF), with its size and timing: the same picture saved with other
// bytes (compression level, encoder version) gives the same result.
const pixels = (file) =>
  execFileSync("ffmpeg", ["-loglevel", "error", "-i", file, "-pix_fmt", "rgba", "-f", "framemd5", "-"], { encoding: "utf8" })
    .split("\n")
    .filter((l) => !l.startsWith("#version") && !l.startsWith("#format"))
    .join("\n");

// Moves the fresh capture `tmp` to `dest` only if its pixels differ (or `dest` is missing), else drops it, so an
// unchanged screenshot is never rewritten and never shows up in a commit. Returns true when `dest` was written.
export function saveIfChanged(tmp, dest) {
  if (existsSync(dest) && pixels(tmp) === pixels(dest)) {
    rmSync(tmp);
    return false;
  }
  // Copy then remove, not rename: the temporary file is on /tmp, often another device than the repository (EXDEV).
  copyFileSync(tmp, dest);
  rmSync(tmp);
  return true;
}
