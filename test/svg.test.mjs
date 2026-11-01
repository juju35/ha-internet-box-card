// The box pictures are inline SVG data URIs: every id they declare must be a valid, space-free XML name, and every
// url(#id) they use must point at one of them (an invalid reference makes the browser paint the shape black).
import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const { IMG_BOX } = load("internet-box-card.js", ["IMG_BOX"]);

for (const [model, uri] of Object.entries(IMG_BOX)) {
  test(`${model}: SVG ids are valid and every url(#id) resolves`, () => {
    const svg = decodeURIComponent(uri.slice("data:image/svg+xml,".length));
    const ids = [...svg.matchAll(/\sid="([^"]*)"/g)].map((m) => m[1]);
    for (const id of ids) assert.match(id, /^[A-Za-z_][\w.-]*$/, `invalid id "${id}"`);
    assert.equal(new Set(ids).size, ids.length, "duplicate id");
    for (const [, ref] of svg.matchAll(/url\(#([^)]*)\)/g)) assert.ok(ids.includes(ref), `url(#${ref}) has no target`);
  });
}
