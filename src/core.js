/*
 * Internet Box Card for Home Assistant
 * https://github.com/juju35/ha-internet-box-card
 *
 * Lovelace cards for internet boxes: the Freebox, Livebox (Orange, KPN), SFR Box, Bbox (Bouygues), FRITZ!Box,
 * Vodafone Station, Swisscom Internet-Box, Sagemcom F@st, Huawei LTE, ZTE Hyperbox and Starlink integrations.
 * Entities are discovered automatically from the entity registry (integration platform and translation key),
 * whatever the language and the entity ids; the legacy Bbox integration is found by entity id.
 */
import { esc } from "./helpers.js";

export const VERSION = "__VERSION__";
// Freebox pictures, drawn: rounded boxes as an extruded top shape (plan flattened by the view angle), square boxes
// in parallel projection (each face drawn flat and placed with shared axes).
export const FONT = 'font-family="Arial, Helvetica, sans-serif"';
// Extrusion of a convex top shape: the shape `top(dy)` drawn at dy = h (bottom), a band between its left / right
// extremes (x0, x1 at height yExt), then the shape at dy = 0 (top).
export const extrude = (top, x0, x1, yExt, h, side, cap) =>
  `<path d="${top(h)}" fill="${side}"/><rect x="${x0}" y="${yExt}" width="${x1 - x0}" height="${h}" fill="${side}"/><path d="${top(0)}" fill="${cap}"/>`;
export const svgDoc = (w, h, defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;
export const grad = (id, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
// Stadium (pill) outline centred on (cx, cy), half-sizes a × b, ends of radius b.
export const stadium = (cx, cy, a, b) => `M${cx - a + b} ${cy - b} H${cx + a - b} A${b} ${b} 0 0 1 ${cx + a - b} ${cy + b} H${cx - a + b} A${b} ${b} 0 0 1 ${cx - a + b} ${cy - b} Z`;
// Squircle-like rounded ellipse (Ultra): superellipse approximated with cubic curves.
export const roundEllipse = (cx, cy, a, b, k = 0.82) =>
  `M${cx} ${cy - b} C${cx + a * k} ${cy - b} ${cx + a} ${cy - b * k} ${cx + a} ${cy} C${cx + a} ${cy + b * k} ${cx + a * k} ${cy + b} ${cx} ${cy + b} C${cx - a * k} ${cy + b} ${cx - a} ${cy + b * k} ${cx - a} ${cy} C${cx - a} ${cy - b * k} ${cx - a * k} ${cy - b} ${cx} ${cy - b} Z`;

// Freebox Ultra: white rounded oval with the black "free" pill and its button on top.
export const ultraSvg = () => {
  const h = 46;
  const top = (dy) => roundEllipse(150, 46 + dy, 140, 40);
  const defs = grad("u-cap", [[0, "#ffffff"], [1, "#ebebe9"]]) + grad("u-side", [[0, "#f1f1ef"], [0.55, "#dededb"], [1, "#b9b9b5"]], 1, 0);
  let s = `<ellipse cx="150" cy="${46 + h + 37}" rx="136" ry="7" opacity=".25"/>`;
  s += extrude(top, 10, 290, 46, h, "url(#u-side)", "url(#u-cap)");
  s += `<path d="${stadium(158, 34, 40, 9)}" fill="#141517"/>`;
  s += `<text x="148" y="37.5" text-anchor="middle" font-size="11" font-style="italic" font-weight="700" fill="#fff" ${FONT}>free</text>`;
  s += `<circle cx="187" cy="34" r="5.5" fill="#2a2c30" stroke="#3d4045"/>`;
  return svgDoc(300, 140, defs, s);
};
// Freebox Pop: white puck, silver "free" pill with its dark button on top, LED on the front.
export const popSvg = () => {
  const h = 42;
  const top = (dy) => `M10 ${48 + dy} A140 38 0 0 1 290 ${48 + dy} A140 38 0 0 1 10 ${48 + dy} Z`;
  const defs = grad("p-cap", [[0, "#ffffff"], [1, "#e7e8e8"]]) + grad("p-side", [[0, "#f3f3f1"], [0.5, "#d9d9d6"], [1, "#a7a8a6"]], 1, 0) + grad("p-pill", [[0, "#d9dbdd"], [1, "#a9adb1"]]);
  let s = `<ellipse cx="150" cy="${48 + h + 34}" rx="136" ry="8" opacity=".25"/>`;
  s += extrude(top, 10, 290, 48, h, "url(#p-side)", "url(#p-cap)");
  s += `<path d="${stadium(185, 30, 38, 7)}" fill="url(#p-pill)"/>`;
  s += `<text x="174" y="33.5" text-anchor="middle" font-size="9" font-style="italic" font-weight="700" fill="#fff" ${FONT}>free</text>`;
  s += `<ellipse cx="210" cy="30" rx="11" ry="5.5" fill="#2a2c30"/>`;
  s += `<circle cx="150" cy="${48 + 38 + h * 0.5}" r="1.8" fill="#fff"/><circle cx="150" cy="${48 + 38 + h * 0.5}" r="4" fill="#fff" opacity=".3"/>`;
  return svgDoc(300, 136, defs, s);
};
// Dot-matrix glyphs (5 × 7) of the Delta clock.
export const DOTS = {
  1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  3: [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."],
  7: ["#####", "....#", "...#.", "..#..", "..#..", "..#..", "..#.."],
  ":": [".", ".", "#", ".", "#", ".", "."],
};
// "text" in glowing dots from (x, y), dot pitch p.
export const dotText = (text, x, y, p) => {
  let s = "";
  for (const ch of text) {
    const rows = DOTS[ch];
    for (const [j, row] of rows.entries()) {
      for (const [i, c] of [...row].entries()) {
        if (c === "#") s += `<circle cx="${(x + i * p).toFixed(1)}" cy="${(y + j * p).toFixed(1)}" r="${(p * 0.36).toFixed(2)}"/>`;
      }
    }
    x += (rows[0].length + 1) * p;
  }
  return `<g fill="#ffffff" filter="url(#d-glow)">${s}</g>`;
};
// Freebox Delta, seen from the front and low: white rounded-triangle top much foreshortened, tall curved front
// with its raised rim, dot-matrix clock with the up / down keys, "free" under it, slim base.
export const deltaSvg = () => {
  const defs =
    grad("d-cap", [[0, "#fdfdfd"], [1, "#e9e9e7"]]) +
    grad("d-front", [[0, "#e4e4e2"], [0.3, "#d6d6d4"], [0.7, "#cacac7"], [1, "#b9b9b6"]], 1, 0) +
    '<filter id="d-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  // One outline for the whole body, rounded at the corners; the top face shares its upper part and ends on the
  // curved rim; the slim base follows the curved bottom.
  const shoulders = "M6 72 C6 62 12 56 26 50 L98 13 C110 6 190 6 202 13 L274 50 C288 56 294 62 294 72";
  const rim = "C250 78 200 81 150 81 C100 81 50 78 6 72";
  let s = '<ellipse cx="150" cy="150" rx="140" ry="4" opacity=".25"/>';
  s += '<path d="M22 140 Q150 154 278 140 L276 145 Q150 158 24 145 Z" fill="#b9b9b6"/>';
  s += `<path d="${shoulders} V124 C294 136 286 142 270 143 Q150 151 30 143 C14 142 6 136 6 124 Z" fill="url(#d-front)"/>`;
  s += `<path d="${shoulders} ${rim} Z" fill="url(#d-cap)"/>`;
  s += '<path d="M6 72 C50 78 100 81 150 81 C200 81 250 78 294 72" fill="none" stroke="#ffffff" stroke-width="3"/>';
  s += '<path d="M7 76 C50 82 100 85 150 85 C200 85 250 82 293 76" fill="none" stroke="#bdbdba" stroke-width="1"/>';
  s += '<path d="M146 66 q2 -2 4 0 m-5 -2 q3 -3 6 0" fill="none" stroke="#b9b9b5" stroke-width=".9" stroke-linecap="round"/>';
  s += dotText("13:37", 122, 98, 3.6);
  s += '<path d="M101 99 l4 -4 l4 4 M101 124 l4 4 l4 -4" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" filter="url(#d-glow)"/>';
  s += `<text x="168" y="139" text-anchor="middle" font-size="9" font-style="italic" fill="#9b9b97" ${FONT}>free</text>`;
  return svgDoc(300, 156, defs, s);
};
// Yellow segmented "13 / 37" display of the Freebox player boxes, at (x, y), digit height dh.
export const display1337 = (x, y, dh, fill = "#d8c21a") =>
  `<text x="${x}" y="${y + dh}" font-size="${dh * 1.25}" font-weight="700" fill="${fill}" ${FONT} letter-spacing="1">13</text><text x="${x}" y="${y + 2.1 * dh}" font-size="${dh * 1.25}" font-weight="700" fill="${fill}" ${FONT} letter-spacing="1">37</text>`;
export const dpad = (cx, cy, r, col) =>
  `<path d="M${cx - 3} ${cy - r + 3} l3 -3 l3 3 M${cx - 3} ${cy + r - 3} l3 3 l3 -3 M${cx - r + 3} ${cy - 3} l-3 3 l3 3 M${cx + r - 3} ${cy - 3} l3 3 l-3 3" fill="none" stroke="${col}" stroke-width="1.3" stroke-linecap="round"/>`;
// Freebox mini 4K (photo): seen from above, brushed grey top, black front with the yellow display.
export const mini4kSvg = () => {
  const [X0, Y0] = [6, 54];
  const front = `matrix(1 0 0 1 ${X0} ${Y0})`;
  const top = `matrix(1 0 .06 -.42 ${X0} ${Y0})`;
  const defs = grad("m-top", [[0, "#7c7f83"], [0.5, "#a7aaae"], [1, "#6d7074"]], 1, 0);
  let s = `<rect x="${X0}" y="${Y0 + 60}" width="260" height="4" fill="#000" opacity=".35"/>`;
  s += `<g transform="${top}"><rect width="260" height="100" rx="2" fill="url(#m-top)"/></g>`;
  s += `<g transform="${front}"><rect width="266" height="60" rx="1.5" fill="#0b0b0c"/>`;
  s += display1337(10, 8, 18);
  s += `${dpad(102, 30, 13, "#9a9a9a")}<circle cx="134" cy="30" r="3" fill="none" stroke="#9a9a9a" stroke-width="1.2"/>`;
  s += `<text x="252" y="13" text-anchor="end" font-size="8" font-style="italic" fill="#c8c8c8" ${FONT}>freebox</text></g>`;
  return svgDoc(278, 120, defs, s);
};
// Freebox Revolution (photo): black box seen from the front left, yellow display and red tab on the front.
export const revolutionSvg = () => {
  const [X0, Y0] = [10, 52];
  const front = `matrix(1 .16 0 1 ${X0} ${Y0})`;
  const top = `matrix(1 .16 .5 -.26 ${X0} ${Y0})`;
  const side = `matrix(.5 -.26 0 1 ${X0 + 230} ${Y0 + 230 * 0.16})`;
  const defs = grad("r-top", [[0, "#2b2c2f"], [1, "#151618"]], 1, 0) + grad("r-front", [[0, "#1d1e21"], [1, "#0c0c0d"]]);
  let tex = "";
  for (let i = 0; i < 9; i++) tex += `<text x="${8 + (i % 3) * 70}" y="${16 + Math.floor(i / 3) * 30}" font-size="13" font-weight="700" fill="#2e3034" ${FONT}>FREEBOX</text>`;
  let s = `<ellipse cx="160" cy="${Y0 + 74}" rx="140" ry="7" opacity=".3"/>`;
  s += `<g transform="${top}"><rect width="230" height="100" rx="5" fill="url(#r-top)"/>${tex}</g>`;
  s += `<g transform="${side}"><rect width="100" height="30" rx="3" fill="#0e0f10"/><circle cx="72" cy="14" r="3" fill="#222"/></g>`;
  s += `<g transform="${front}"><rect width="230" height="30" rx="3" fill="url(#r-front)"/>`;
  s += display1337(8, 2, 12);
  s += `${dpad(58, 15, 11, "#c9b318")}<circle cx="84" cy="15" r="2.6" fill="none" stroke="#c9b318" stroke-width="1"/>`;
  s += `<rect x="6" y="26" width="20" height="13" rx="1.5" fill="#d61f1f"/><rect x="9" y="29" width="8" height="4" fill="#fff"/></g>`;
  return svgDoc(320, 136, defs, s);
};
// Orange Livebox: original stylised drawings of each model's form factor (no logo), with the brand orange used
// only as an accent. The Livebox 6 and 7 are dark anthracite upright boxes with a flat top, a fabric-effect
// finish, an orange status light line (the 7 adds a white dot) and a small front screen; the Livebox 5 is a
// light upright rounded box; the Livebox 4 a dark box with a rounded top and a front display; the Livebox S a
// small light box.
export const LB = "#ff7900";
// Dark upright box with a flat top (Livebox 6 / 7). `diode` adds the white dot under the orange status line.
export const liveboxDark = ({ w, h, diode }) => {
  const x = (300 - w) / 2;
  const bottom = 172;
  const top = bottom - h;
  const r = 14;
  const defs =
    grad("lbd", [[0, "#53555a"], [0.5, "#333539"], [1, "#1b1c1f"]], 1, 0) +
    '<filter id="lbd-g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>';
  let s = `<ellipse cx="150" cy="${bottom + 3}" rx="${Math.round(w * 0.5)}" ry="6" opacity=".3"/>`;
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}" fill="url(#lbd)"/>`;
  // Fabric-effect: faint vertical lines.
  for (let i = 1; i < 12; i++)
    s += `<line x1="${(x + (i * w) / 12).toFixed(1)}" y1="${top + 8}" x2="${(x + (i * w) / 12).toFixed(1)}" y2="${bottom - 8}" stroke="#000" stroke-opacity=".07"/>`;
  s += `<rect x="${x + 6}" y="${top + 12}" width="4" height="${h - 28}" rx="2" fill="#fff" opacity=".10"/>`;
  // Orange status light line near the top, with a soft glow.
  const ly = top + 22;
  s += `<rect x="${x + 16}" y="${ly - 2}" width="${w - 32}" height="7" rx="3.5" fill="${LB}" opacity=".5" filter="url(#lbd-g)"/>`;
  s += `<rect x="${x + 16}" y="${ly}" width="${w - 32}" height="3" rx="1.5" fill="${LB}"/>`;
  if (diode) s += `<circle cx="150" cy="${ly + 11}" r="1.8" fill="#fff"/>`;
  // Small front e-ink screen.
  s += `<rect x="${(300 - 44) / 2}" y="${bottom - 14 - 26}" width="44" height="26" rx="4" fill="#111214" stroke="#000" stroke-opacity=".35"/>`;
  return svgDoc(300, 182, defs, s);
};
export const livebox6Svg = () => liveboxDark({ w: 94, h: 116, diode: false });
export const livebox7Svg = () => liveboxDark({ w: 102, h: 128, diode: true });
// Light upright rounded box (Livebox 5).
// Low, wide black box with a diagonally ridged top (Livebox 5): a tall ridged top face and a front face with
// three vertical orange indicator bars over small icons on the left.
export const livebox5Svg = () => {
  const w = 252;
  const x = (300 - w) / 2;
  const yTop = 80;
  const topH = 34;
  const frontH = 42;
  const fy = yTop + topH;
  const defs = grad("lb5t", [[0, "#2d2d31"], [1, "#161618"]], 1, 0) + grad("lb5f", [[0, "#232326"], [0.5, "#17171a"], [1, "#101012"]]);
  const topShape = `M${x + 18} ${yTop} H${x + w - 10} L${x + w} ${fy} H${x} Z`;
  let s = `<ellipse cx="150" cy="${fy + frontH + 10}" rx="${Math.round(w * 0.5)}" ry="7" opacity=".32"/>`;
  s += `<path d="${topShape}" fill="url(#lb5t)"/>`;
  // Diagonal ridge texture over the top face.
  s += `<clipPath id="lb5clip"><path d="${topShape}"/></clipPath><g clip-path="url(#lb5clip)">`;
  for (let i = -4; i < 40; i++) s += `<line x1="${x + i * 8}" y1="${yTop - 6}" x2="${x + i * 8 + 44}" y2="${fy + 6}" stroke="#000" stroke-opacity=".3" stroke-width="2"/>`;
  s += "</g>";
  // Front face.
  s += `<rect x="${x}" y="${fy}" width="${w}" height="${frontH}" rx="4" fill="url(#lb5f)"/>`;
  // Three vertical orange indicator bars with small icons under them.
  const bx = x + 52;
  const gap = 22;
  for (let i = 0; i < 3; i++) s += `<rect x="${bx + i * gap}" y="${fy + 7}" width="4" height="15" rx="2" fill="${LB}"/>`;
  const iy = fy + frontH - 9;
  s += `<circle cx="${bx + 2}" cy="${iy}" r="3" fill="none" stroke="#9a9a9e" stroke-width="1"/><line x1="${bx - 1}" y1="${iy}" x2="${bx + 5}" y2="${iy}" stroke="#9a9a9e" stroke-width=".7"/>`;
  s += `<path d="M${bx + gap - 3} ${iy + 1} a5 5 0 0 1 10 0 M${bx + gap - 1} ${iy + 2.5} a3 3 0 0 1 6 0" fill="none" stroke="#9a9a9e" stroke-width="1" stroke-linecap="round"/>`;
  s += `<path d="M${bx + 2 * gap - 1} ${iy - 3} q0 6 6 6 l0 -2 -3 .6 q-.8 -2 -.8 -4.6 z" fill="#9a9a9e"/>`;
  return svgDoc(300, 170, defs, s);
};
// Low, wide black box seen from the front (Livebox 4): a short top face and a taller glossy front face carrying a
// strip of small orange indicator lights on the left and a few neutral touch marks on the right, with a corner nub.
export const livebox4Svg = () => {
  const w = 252;
  const x = (300 - w) / 2;
  const yTop = 86;
  const topH = 18;
  const frontH = 48;
  const fy = yTop + topH;
  const defs = grad("lb4t", [[0, "#2c2c30"], [1, "#171719"]], 1, 0) + grad("lb4f", [[0, "#242427"], [0.5, "#19191b"], [1, "#101012"]]);
  let s = `<ellipse cx="150" cy="${fy + frontH + 10}" rx="${Math.round(w * 0.5)}" ry="7" opacity=".32"/>`;
  // Top face (slight perspective) with an abstract criss-cross line pattern on the left and a soft sheen on the right.
  const lb4top = `M${x + 12} ${yTop} H${x + w - 12} L${x + w} ${fy} H${x} Z`;
  s += `<path d="${lb4top}" fill="url(#lb4t)"/>`;
  s += `<clipPath id="lb4clip"><path d="${lb4top}"/></clipPath><g clip-path="url(#lb4clip)" stroke="#5c5c62" stroke-opacity=".55" stroke-width="1.3" fill="none" stroke-linecap="round">`;
  s += `<path d="M${x + 18} ${fy - 2} L${x + 92} ${yTop + 2}"/><path d="M${x + 18} ${yTop + 3} L${x + 104} ${fy - 2}"/><path d="M${x + 50} ${fy - 2} L${x + 112} ${yTop + 4}"/><path d="M${x + 34} ${yTop + 2} L${x + 74} ${fy - 2}"/>`;
  s += "</g>";
  s += `<path d="M${Math.round(x + w * 0.52)} ${yTop + 5} H${x + w - 16} L${x + w - 8} ${fy - 4} H${Math.round(x + w * 0.48)} Z" fill="#ffffff" opacity=".04"/>`;
  // Front face.
  s += `<rect x="${x}" y="${fy}" width="${w}" height="${frontH}" rx="5" fill="url(#lb4f)"/>`;
  s += `<rect x="${x + 6}" y="${fy + 4}" width="${w - 12}" height="4" rx="2" fill="#ffffff" opacity=".05"/>`;
  // Orange indicator lights (abstract): a dot, Wi-Fi arcs, a phone tick, a small square — evenly spaced.
  const cy = fy + frontH / 2 + 2;
  const gx = x + 54;
  const gap = 26;
  s += `<circle cx="${gx}" cy="${cy}" r="3.4" fill="none" stroke="${LB}" stroke-width="1.6"/><circle cx="${gx}" cy="${cy}" r="1" fill="${LB}"/>`;
  s += `<path d="M${gx + gap - 5} ${cy + 1} a5 5 0 0 1 10 0 M${gx + gap - 3} ${cy + 2.5} a3 3 0 0 1 6 0" fill="none" stroke="${LB}" stroke-width="1.5" stroke-linecap="round"/><circle cx="${gx + gap}" cy="${cy + 4.5}" r="1" fill="${LB}"/>`;
  s += `<path d="M${gx + 2 * gap - 4} ${cy - 4} q0 8 8 8 l0 -3 -4 1 q-1 -3 -1 -6 z" fill="${LB}"/>`;
  s += `<rect x="${gx + 3 * gap - 4}" y="${cy - 4}" width="8" height="7" rx="1.5" fill="${LB}"/>`;
  // Right side: separator, two neutral touch marks and a corner antenna nub.
  s += `<rect x="${x + w - 88}" y="${fy + 8}" width="1.2" height="${frontH - 16}" fill="#3a3a3d"/>`;
  s += `<rect x="${x + w - 70}" y="${cy - 5}" width="2.4" height="10" rx="1.2" fill="#6a6a6e"/>`;
  s += `<path d="M${x + w - 54} ${cy + 3} a6 6 0 0 1 12 0 M${x + w - 51} ${cy + 1.5} a3 3 0 0 1 6 0" fill="none" stroke="#6a6a6e" stroke-width="1.4" stroke-linecap="round"/>`;
  s += `<rect x="${x + w - 30}" y="${cy - 4}" width="12" height="8" rx="1.5" fill="none" stroke="#6a6a6e" stroke-width="1.1"/>`;
  return svgDoc(300, 162, defs, s);
};
// Small light box (Livebox S).
// Dark upright box on feet, fabric-textured rounded top and a smooth lower half, with a central front screen
// showing a Wi-Fi glyph (Livebox S).
export const liveboxSSvg = () => {
  const w = 132;
  const x = (300 - w) / 2;
  const top = 26;
  const bodyH = 128;
  const bottom = top + bodyH;
  const r = 24;
  const split = top + 66;
  const defs = grad("lbs1", [[0, "#474a4f"], [1, "#2e3034"]], 1, 0) + grad("lbs2", [[0, "#3b3d41"], [1, "#282a2d"]], 1, 0);
  let s = `<ellipse cx="150" cy="${bottom + 30}" rx="${Math.round(w * 0.5)}" ry="6" opacity=".28"/>`;
  // Feet.
  s += `<path d="M${x + 32} ${bottom - 6} L${x + 8} ${bottom + 26} M${x + w - 32} ${bottom - 6} L${x + w - 8} ${bottom + 26}" stroke="#303236" stroke-width="8" stroke-linecap="round"/>`;
  s += `<path d="M${x - 2} ${bottom + 24} h42 M${x + w - 40} ${bottom + 24} h42" stroke="#2b2d30" stroke-width="7" stroke-linecap="round"/>`;
  // Body (rounded rect), split into a fabric top and a smooth bottom by colour, with fabric dots clipped to it.
  s += `<rect x="${x}" y="${top}" width="${w}" height="${bodyH}" rx="${r}" fill="url(#lbs2)"/>`;
  s += `<clipPath id="lbsc"><rect x="${x}" y="${top}" width="${w}" height="${bodyH}" rx="${r}"/></clipPath><g clip-path="url(#lbsc)">`;
  s += `<rect x="${x}" y="${top}" width="${w}" height="${split - top}" fill="url(#lbs1)"/>`;
  for (let yy = top + 9; yy < split - 4; yy += 6) for (let xx = x + 9; xx < x + w - 6; xx += 6) s += `<circle cx="${xx}" cy="${yy}" r=".8" fill="#000" fill-opacity=".18"/>`;
  s += `<rect x="${x + 7}" y="${top + r}" width="4" height="46" rx="2" fill="#fff" opacity=".07"/></g>`;
  // Central front screen with a status line and a Wi-Fi glyph.
  const pw = 46;
  const ph = 54;
  const px = 150 - pw / 2;
  const py = top + 34;
  s += `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="9" fill="#24262a" stroke="#1a1b1e"/>`;
  s += `<rect x="144" y="${py + 7}" width="12" height="2.4" rx="1.2" fill="#8d8d91"/>`;
  s += `<g stroke="#d2d2d5" stroke-width="2" fill="none" stroke-linecap="round"><path d="M142 ${py + 30} a10 10 0 0 1 16 0"/><path d="M145.5 ${py + 34} a5.5 5.5 0 0 1 9 0"/></g><circle cx="150" cy="${py + 39}" r="1.6" fill="#d2d2d5"/>`;
  return svgDoc(300, 200, defs, s);
};

// SFR Box: original stylised drawings. The Box 8 is a dark rounded cube with a glossy top and a mesh body; the
// Box 7 a tall slim upright black box with a mesh grille and a column of status lights, on a foot.
export const sfrBox8Svg = () => {
  const w = 128;
  const x = (300 - w) / 2;
  const top = 50;
  const h = 110;
  const bottom = top + h;
  const r = 28;
  const glossH = 30;
  const defs = grad("sfr8b", [[0, "#202124"], [1, "#0f1012"]], 1, 0) + grad("sfr8g", [[0, "#34353a"], [1, "#191a1d"]], 1, 0);
  let s = `<ellipse cx="150" cy="${bottom + 8}" rx="${Math.round(w * 0.5)}" ry="8" opacity=".3"/>`;
  // Single rounded-cube body, clipped so the top band is glossy and the rest is a mesh grille.
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}" fill="url(#sfr8b)"/>`;
  s += `<clipPath id="sfr8c"><rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}"/></clipPath><g clip-path="url(#sfr8c)">`;
  s += `<rect x="${x}" y="${top}" width="${w}" height="${glossH}" fill="url(#sfr8g)"/>`;
  s += `<ellipse cx="${Math.round(x + w * 0.4)}" cy="${top + 9}" rx="${Math.round(w * 0.3)}" ry="4" fill="#fff" opacity=".07"/>`;
  for (let yy = top + glossH + 6; yy < bottom - 4; yy += 4) for (let xx = x + 8; xx < x + w - 6; xx += 4) s += `<circle cx="${xx}" cy="${yy}" r=".7" fill="#000" fill-opacity=".4"/>`;
  s += "</g>";
  s += `<circle cx="${x + w - 28}" cy="${top + 15}" r="2" fill="#7fb0e0"/>`;
  return svgDoc(300, 176, defs, s);
};
export const sfrBox7Svg = () => {
  const w = 72;
  const h = 138;
  const x = (300 - w) / 2;
  const top = 22;
  const bottom = top + h;
  const r = 10;
  const defs = grad("sfr7", [[0, "#242528"], [1, "#101113"]], 1, 0);
  let s = `<ellipse cx="150" cy="${bottom + 14}" rx="46" ry="7" opacity=".3"/>`;
  // Foot.
  s += `<rect x="${150 - 4}" y="${bottom - 6}" width="8" height="12" fill="#17181a"/><rect x="${150 - 26}" y="${bottom + 2}" width="52" height="7" rx="3" fill="#1a1b1d"/>`;
  // Body.
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}" fill="url(#sfr7)"/>`;
  // Small ridges on the top-left.
  for (let i = 0; i < 5; i++) s += `<line x1="${x + 10 + i * 5}" y1="${top + 5}" x2="${x + 16 + i * 5}" y2="${top + 11}" stroke="#000" stroke-opacity=".3" stroke-width="1.4"/>`;
  // Column of small status lights on the left.
  for (let i = 0; i < 4; i++) s += `<circle cx="${x + 14}" cy="${top + 42 + i * 20}" r="2.6" fill="none" stroke="#b7b7bb" stroke-width="1"/>`;
  // Mesh grille (right).
  s += `<clipPath id="sfr7c"><rect x="${x + 26}" y="${top + 16}" width="${w - 34}" height="${h - 30}" rx="6"/></clipPath><g clip-path="url(#sfr7c)">`;
  for (let yy = top + 18; yy < bottom - 12; yy += 4) for (let xx = x + 28; xx < x + w - 6; xx += 4) s += `<circle cx="${xx}" cy="${yy}" r=".7" fill="#000" fill-opacity=".42"/>`;
  s += "</g>";
  return svgDoc(300, 180, defs, s);
};

// SFR NB6VAC (Box Plus / Power / Fibre): a low, wide, glossy black box seen from the front, with a column of
// status lights on the left (green at the bottom) and a ventilation grille on the right.
export const sfrNB6VACSvg = () => {
  const w = 236;
  const x = (300 - w) / 2;
  const yTop = 80;
  const topH = 20;
  const frontH = 50;
  const fy = yTop + topH;
  const bottom = fy + frontH;
  const defs = grad("nb6t", [[0, "#242427"], [0.5, "#131315"], [1, "#0c0c0e"]], 1, 0) + grad("nb6f", [[0, "#1b1b1e"], [1, "#0c0c0e"]]);
  let s = `<ellipse cx="150" cy="${bottom + 8}" rx="${Math.round(w * 0.5)}" ry="8" opacity=".32"/>`;
  // Glossy top face with a diagonal sheen.
  const topShape = `M${x + 14} ${yTop} H${x + w - 10} L${x + w} ${fy} H${x} Z`;
  s += `<path d="${topShape}" fill="url(#nb6t)"/>`;
  s += `<clipPath id="nb6c"><path d="${topShape}"/></clipPath><path clip-path="url(#nb6c)" d="M${x + 40} ${yTop} L${x + 128} ${yTop} L${x + 66} ${fy} L${x - 8} ${fy} Z" fill="#ffffff" opacity=".07"/>`;
  // Front face.
  s += `<rect x="${x}" y="${fy}" width="${w}" height="${frontH}" rx="4" fill="url(#nb6f)"/>`;
  // Status light column (green at the bottom).
  for (let i = 0; i < 5; i++) s += `<circle cx="${x + 12}" cy="${fy + 10 + i * 8}" r="2" fill="${i === 4 ? "#36c24a" : "#54545a"}"/>`;
  // Ventilation grille on the right.
  for (let i = 0; i < 9; i++) s += `<rect x="${x + w - 62 + i * 6}" y="${fy + 9}" width="2" height="${frontH - 18}" rx="1" fill="#000" fill-opacity=".45"/>`;
  // Small front flap.
  s += `<rect x="${Math.round(x + w * 0.52)}" y="${fy + 11}" width="16" height="${frontH - 22}" rx="2" fill="#141417" stroke="#000" stroke-opacity=".3"/>`;
  return svgDoc(300, 170, defs, s);
};

// Bbox (Bouygues): original stylised drawings. The Miami is a low, wide black box with stacked ventilation fins
// and a thin accent line; the Ultym a tall upright glossy tower with a round front dial; the Fibre a slim
// rounded matte tower with a column of green status lights and a bright central bar.
export const bboxMiamiSvg = () => {
  const w = 228;
  const x = (300 - w) / 2;
  const yTop = 78;
  const topH = 18;
  const frontH = 58;
  const fy = yTop + topH;
  const bottom = fy + frontH;
  const defs = grad("bbmt", [[0, "#26272b"], [0.5, "#141416"], [1, "#0d0d0f"]], 1, 0) + grad("bbmf", [[0, "#1c1c1f"], [1, "#0b0b0d"]]);
  let s = `<ellipse cx="150" cy="${bottom + 10}" rx="${Math.round(w * 0.5)}" ry="8" opacity=".3"/>`;
  // Feet.
  s += `<rect x="${x + 16}" y="${bottom - 2}" width="20" height="8" rx="3" fill="#141417"/><rect x="${x + w - 36}" y="${bottom - 2}" width="20" height="8" rx="3" fill="#141417"/>`;
  // Glossy top face with a diagonal sheen.
  const topShape = `M${x + 12} ${yTop} H${x + w - 8} L${x + w} ${fy} H${x} Z`;
  s += `<path d="${topShape}" fill="url(#bbmt)"/>`;
  s += `<clipPath id="bbmc"><path d="${topShape}"/></clipPath><path clip-path="url(#bbmc)" d="M${x + 36} ${yTop} L${x + 120} ${yTop} L${x + 60} ${fy} L${x - 6} ${fy} Z" fill="#fff" opacity=".07"/>`;
  // Front face with stacked ventilation fins.
  s += `<rect x="${x}" y="${fy}" width="${w}" height="${frontH}" rx="5" fill="url(#bbmf)"/>`;
  for (let i = 0; i < 4; i++) s += `<rect x="${x + 10}" y="${fy + 10 + i * 10}" width="${w - 20}" height="3" rx="1.5" fill="#000" fill-opacity=".38"/>`;
  // Thin blue accent line and a small status light.
  s += `<rect x="${x + 10}" y="${bottom - 7}" width="${w - 20}" height="2" rx="1" fill="#1f6fe0" opacity=".85"/>`;
  s += `<circle cx="${x + w - 18}" cy="${fy + 11}" r="2" fill="#36c24a"/>`;
  return svgDoc(300, 170, defs, s);
};
export const bboxUltymSvg = () => {
  const w = 104;
  const h = 150;
  const x = (300 - w) / 2;
  const top = 22;
  const bottom = top + h;
  const r = 20;
  const defs = grad("bbu1", [[0, "#2b2c30"], [1, "#101113"]], 1, 0) + grad("bbu2", [[0, "#3a3b40"], [1, "#1a1b1e"]], 1, 0);
  let s = `<ellipse cx="150" cy="${bottom + 12}" rx="${Math.round(w * 0.5)}" ry="7" opacity=".3"/>`;
  // Feet.
  s += `<rect x="${x + 14}" y="${bottom - 4}" width="18" height="9" rx="3" fill="#141417"/><rect x="${x + w - 32}" y="${bottom - 4}" width="18" height="9" rx="3" fill="#141417"/>`;
  // Glossy upright body with a rounded top.
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}" fill="url(#bbu1)"/>`;
  s += `<clipPath id="bbuc"><rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}"/></clipPath><g clip-path="url(#bbuc)">`;
  s += `<rect x="${x}" y="${top}" width="${w}" height="40" fill="url(#bbu2)"/>`;
  s += `<rect x="${x + 8}" y="${top + 8}" width="6" height="${h - 24}" rx="3" fill="#fff" opacity=".06"/></g>`;
  // Round front dial with a soft ring, and two small side buttons.
  s += `<circle cx="150" cy="${top + 74}" r="26" fill="#17181b" stroke="#000" stroke-opacity=".4"/>`;
  s += `<circle cx="150" cy="${top + 74}" r="26" fill="none" stroke="#1f6fe0" stroke-width="2" opacity=".55"/>`;
  s += `<circle cx="150" cy="${top + 74}" r="14" fill="#202226"/>`;
  s += `<circle cx="${x + 16}" cy="${top + 118}" r="2.2" fill="#54545a"/><circle cx="${x + w - 16}" cy="${top + 118}" r="2.2" fill="#36c24a"/>`;
  return svgDoc(300, 180, defs, s);
};
export const bboxFibreSvg = () => {
  const w = 86;
  const h = 150;
  const x = (300 - w) / 2;
  const top = 24;
  const bottom = top + h;
  const r = 30;
  const defs = grad("bbf", [[0, "#242529"], [1, "#0f1012"]], 1, 0);
  const G = "#3ad64f";
  let s = `<ellipse cx="150" cy="${bottom + 12}" rx="${Math.round(w * 0.5)}" ry="6" opacity=".28"/>`;
  // Slim matte tower with soft rounded corners.
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}" fill="url(#bbf)"/>`;
  s += `<clipPath id="bbfc"><rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${r}"/></clipPath>`;
  s += `<rect clip-path="url(#bbfc)" x="${x + 7}" y="${top + 14}" width="5" height="${h - 34}" rx="2.5" fill="#fff" opacity=".05"/>`;
  // Two status lights near the top, a bright central bar, two lights below.
  s += `<circle cx="${150 - 9}" cy="${top + 34}" r="3" fill="${G}"/><circle cx="${150 + 9}" cy="${top + 34}" r="3" fill="${G}"/>`;
  s += `<rect x="${150 - 26}" y="${top + 68}" width="52" height="7" rx="3.5" fill="${G}"/>`;
  s += `<rect x="${150 - 26}" y="${top + 68}" width="52" height="7" rx="3.5" fill="${G}" opacity=".35"/>`;
  s += `<circle cx="${150 - 9}" cy="${top + 104}" r="3" fill="${G}"/><circle cx="${150 + 9}" cy="${top + 104}" r="3" fill="${G}"/>`;
  return svgDoc(300, 182, defs, s);
};

// Generic form factors, shared by the boxes of the other integrations (FRITZ!Box, Vodafone Station, Swisscom,
// Sagemcom F@st, Huawei LTE, ZTE, Starlink): neutral drawings of a kind of device, not of a given product. Each takes
// an optional accent colour (the provider's), used for its status lights and a thin trim; without one, the lights
// keep the neutral green / blue of the README pictures.
// Wide desktop router with two antennas at the back.
export const genRouterSvg = ({ accent } = {}) => {
  const w = 176;
  const h = 34;
  const x = (300 - w) / 2;
  const top = 108;
  const bottom = top + h;
  const defs = grad("grtb", [[0, "#2b2c30"], [1, "#141518"]]) + grad("grta", [[0, "#3a3b40"], [1, "#1c1d20"]], 1, 0);
  let s = `<ellipse cx="150" cy="${bottom + 9}" rx="${Math.round(w * 0.52)}" ry="7" opacity=".28"/>`;
  for (const ax of [x + 26, x + w - 26]) s += `<rect x="${ax - 4}" y="${top - 82}" width="8" height="86" rx="4" fill="url(#grta)"/>`;
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="10" fill="url(#grtb)"/>`;
  s += `<rect x="${x + 6}" y="${top + 3}" width="${w - 12}" height="3" rx="1.5" fill="#fff" opacity=".08"/>`;
  if (accent) s += `<rect x="${x + 12}" y="${bottom - 4}" width="${w - 24}" height="2" rx="1" fill="${accent}"/>`;
  for (let i = 0; i < 5; i++) s += `<circle cx="${x + 30 + i * 13}" cy="${top + 21}" r="2.4" fill="${accent || (i < 4 ? "#3ad64f" : "#4f8fe6")}"/>`;
  return svgDoc(300, 160, defs, s);
};
// Low rounded hub without antennas, with a status light bar.
export const genHubSvg = ({ accent } = {}) => {
  const w = 150;
  const h = 46;
  const x = (300 - w) / 2;
  const top = 82;
  const bottom = top + h;
  const defs = grad("ghbb", [[0, "#f4f5f7"], [1, "#c9ccd2"]]);
  let s = `<ellipse cx="150" cy="${bottom + 9}" rx="${Math.round(w * 0.5)}" ry="7" opacity=".25"/>`;
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="${h / 2}" fill="url(#ghbb)" stroke="#000" stroke-opacity=".15"/>`;
  s += `<rect x="${x + 14}" y="${top + 5}" width="${w - 28}" height="4" rx="2" fill="#fff" opacity=".7"/>`;
  s += `<rect x="${150 - 24}" y="${top + h - 15}" width="48" height="5" rx="2.5" fill="${accent || "#3ad64f"}"/>`;
  return svgDoc(300, 150, defs, s);
};
// Slim upright tower on a foot, with a column of status lights.
export const genTowerSvg = ({ accent } = {}) => {
  const w = 64;
  const h = 132;
  const x = (300 - w) / 2;
  const top = 18;
  const bottom = top + h;
  const defs = grad("gtwb", [[0, "#2a2b2f"], [1, "#111214"]], 1, 0);
  let s = `<ellipse cx="150" cy="${bottom + 14}" rx="44" ry="7" opacity=".28"/>`;
  s += `<rect x="${150 - 30}" y="${bottom + 2}" width="60" height="8" rx="4" fill="#1a1b1d"/>`;
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="14" fill="url(#gtwb)"/>`;
  s += `<rect x="${x + 6}" y="${top + 12}" width="4" height="${h - 24}" rx="2" fill="#fff" opacity=".06"/>`;
  if (accent) s += `<rect x="${150 - 30}" y="${bottom + 2}" width="60" height="2" rx="1" fill="${accent}"/>`;
  for (let i = 0; i < 4; i++) s += `<circle cx="150" cy="${top + 30 + i * 16}" r="2.6" fill="${accent || (i ? "#3ad64f" : "#4f8fe6")}"/>`;
  return svgDoc(300, 172, defs, s);
};
// Compact 4G / 5G cube with signal bars on its front.
export const genMobileSvg = ({ accent } = {}) => {
  const w = 104;
  const h = 120;
  const x = (300 - w) / 2;
  const top = 30;
  const bottom = top + h;
  const defs = grad("gmbb", [[0, "#fafbfc"], [1, "#d3d6dc"]], 1, 1);
  let s = `<ellipse cx="150" cy="${bottom + 9}" rx="${Math.round(w * 0.56)}" ry="7" opacity=".25"/>`;
  s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="18" fill="url(#gmbb)" stroke="#000" stroke-opacity=".15"/>`;
  for (let i = 0; i < 4; i++) {
    const bh = 8 + i * 7;
    s += `<rect x="${150 - 22 + i * 12}" y="${top + 62 - bh}" width="8" height="${bh}" rx="2" fill="${i < 3 ? accent || "#2f7fe0" : "#b8bcc4"}"/>`;
  }
  s += `<rect x="${150 - 22}" y="${top + 84}" width="44" height="4" rx="2" fill="${accent || "#3ad64f"}"/>`;
  return svgDoc(300, 168, defs, s);
};
// Flat satellite dish on a mast.
export const genDishSvg = ({ accent } = {}) => {
  const defs = grad("gdsb", [[0, "#ffffff"], [1, "#cfd3d9"]], 1, 1);
  let s = `<ellipse cx="150" cy="164" rx="40" ry="6" opacity=".28"/>`;
  s += `<rect x="146" y="96" width="8" height="66" rx="3" fill="#8a8f98"/><rect x="128" y="156" width="44" height="7" rx="3" fill="#6b7078"/>`;
  if (accent) s += `<circle cx="150" cy="148" r="2.4" fill="${accent}"/>`;
  s += `<g transform="rotate(-18 150 66)"><rect x="96" y="20" width="108" height="92" rx="16" fill="url(#gdsb)" stroke="#000" stroke-opacity=".18"/>`;
  s += `<rect x="104" y="28" width="92" height="76" rx="11" fill="none" stroke="#000" stroke-opacity=".07"/></g>`;
  return svgDoc(300, 176, defs, s);
};
export const GENERIC = { generic_router: genRouterSvg, generic_hub: genHubSvg, generic_tower: genTowerSvg, generic_mobile: genMobileSvg, generic_dish: genDishSvg };

export const svgUri = (svg) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
// Pictures of the box models, by picture id: a model's `pic`, else its own id (Freebox, Livebox, SFR Box, Bbox drawings,
// then the generic form factors of the other integrations).
export const IMG_BOX = {
  ultra: svgUri(ultraSvg()),
  pop: svgUri(popSvg()),
  delta: svgUri(deltaSvg()),
  revolution: svgUri(revolutionSvg()),
  mini_4k: svgUri(mini4kSvg()),
  livebox_4: svgUri(livebox4Svg()),
  livebox_5: svgUri(livebox5Svg()),
  livebox_6: svgUri(livebox6Svg()),
  livebox_7: svgUri(livebox7Svg()),
  livebox_s: svgUri(liveboxSSvg()),
  sfr_box_8: svgUri(sfrBox8Svg()),
  sfr_box_7: svgUri(sfrBox7Svg()),
  sfr_nb6vac: svgUri(sfrNB6VACSvg()),
  bbox_miami: svgUri(bboxMiamiSvg()),
  bbox_ultym: svgUri(bboxUltymSvg()),
  bbox_fibre: svgUri(bboxFibreSvg()),
  generic_router: svgUri(genRouterSvg()),
  generic_hub: svgUri(genHubSvg()),
  generic_tower: svgUri(genTowerSvg()),
  generic_mobile: svgUri(genMobileSvg()),
  generic_dish: svgUri(genDishSvg()),
};
/** Picture of a model: its shared `pic` drawing, else the drawing named after it. A generic form factor is drawn in
 *  the provider's accent colour when one is given (status lights and trim), each variant built once. */
export const _tinted = new Map();
export const modelPic = (m, accent) => {
  if (!m) return undefined;
  const pic = m.pic ?? m.id;
  if (!accent || !GENERIC[pic]) return IMG_BOX[pic];
  const key = `${pic}|${accent}`;
  if (!_tinted.has(key)) _tinted.set(key, svgUri(GENERIC[pic]({ accent })));
  return _tinted.get(key);
};

// ---------------------------------------------------------------------------
// Illustrated header: an internet scene at the right of the banner, in a 200 × 80 picture drawn from its bottom
// right corner (fibre arriving into the box, world dots, Wi-Fi waves to the connected devices). The left of the
// picture (x < 80) is open sky, under the title. The box is the model's own drawing, drawn big on the ground strip.
// ---------------------------------------------------------------------------

// Drawn part of each model picture (x, y, width, height in its viewBox), so the box fills its place in the scene
// whatever the margins of its drawing. The generic form factors keep their geometry when tinted.
export const PIC_FIT = {
  ultra: [10, 6, 280, 130],
  pop: [10, 10, 280, 122],
  delta: [6, 8, 288, 146],
  revolution: [10, 26, 290, 107],
  mini_4k: [6, 12, 266, 106],
  livebox_4: [24, 86, 252, 76],
  livebox_5: [0, 74, 300, 96],
  livebox_6: [103, 56, 94, 125],
  livebox_7: [99, 44, 102, 137],
  livebox_s: [82, 26, 136, 164],
  sfr_box_8: [86, 50, 128, 126],
  sfr_box_7: [104, 22, 92, 158],
  sfr_nb6vac: [24, 80, 244, 86],
  bbox_miami: [30, 78, 234, 92],
  bbox_ultym: [98, 22, 104, 158],
  bbox_fibre: [107, 24, 86, 158],
  generic_router: [58, 26, 184, 132],
  generic_hub: [75, 82, 150, 62],
  generic_tower: [106, 18, 88, 153],
  generic_mobile: [92, 30, 116, 136],
  generic_dish: [84, 6, 131, 164],
};

// Dots of the world map behind the scene, on a fixed pseudo-random pattern.
export const SCENE_DOTS = (() => {
  const dots = [];
  for (let y = 6; y < 60; y += 6) for (let x = 86; x < 200; x += 6) if ((x * 7 + y * 13) % 11 < 6) dots.push(`<circle cx="${x}" cy="${y}" r=".9"/>`);
  return dots.join("");
})();

// Connected devices around the box (laptop, phone, TV): position and outline.
export const SCENE_DEVICES = [
  [110, 22, "M-5 -3 h10 v6 h-10z M-7 3 h14"],
  [132, 12, "M-3 -5 h6 v10 h-6z"],
  [184, 16, "M-6 -4 h12 v7 h-12z M-2 5 h4"],
];

// Size of a model picture's viewBox (every drawing starts at 0 0), read once per picture.
export const _picSize = new Map();
export const picSize = (pic) => {
  if (!_picSize.has(pic)) {
    const m = decodeURIComponent(pic).match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    _picSize.set(pic, m ? [Number(m[1]), Number(m[2])] : [300, 160]);
  }
  return _picSize.get(pic);
};

// Colour of the link by scene state: online, syncing, offline, unavailable.
export const SCENE_LINK = { ok: "#2fd0ff", wait: "#ffa600", down: "#e5484d", off: "#9aa3ae" };

/** The banner picture. `state`: ok | wait | down | off (the internet link); `wifi`: the Wi-Fi is on; `pic` / `fit`:
 *  the box picture (data: URI) and its drawn part; `href`: the box admin page opened by a click on the box. */
export const sceneSvg = ({ state, wifi, pic, fit, href, label }) => {
  const c = SCENE_LINK[state] || SCENE_LINK.ok;
  const up = state === "ok" || state === "wait";
  const radio = up && wifi;
  const slow = state === "wait";
  const fibre = "M80 70 H150";
  const links = SCENE_DEVICES.map(([x, y, d], i) => {
    const p = `M160 52 Q${(160 + x) / 2} ${y + 10} ${x} ${y + 6}`;
    return `<path class="sc-wire${radio ? " on" : ""}" d="${p}"/>${
      radio ? `<circle class="sc-pk" r="1.4" style="offset-path:path('${p}');animation-duration:${(slow ? 2.6 : 1.4) + i * 0.4}s"/>` : ""
    }<g transform="translate(${x} ${y})"><circle class="sc-dev" r="8"/><path class="sc-dev-i" d="${d}"/></g>`;
  }).join("");
  let box = "";
  if (pic && fit) {
    const [fx, fy, fw, fh] = fit;
    const [vw, vh] = picSize(pic);
    // Wide boxes lie low (28 high at most), standing ones rise to 44; at most 66 wide, centred at x 160, on the ground.
    const maxH = fw / fh > 1.4 ? 28 : 44;
    let h = maxH;
    let w = (h * fw) / fh;
    if (w > 66) {
      w = 66;
      h = (w * fh) / fw;
    }
    const img = `<svg x="${(160 - w / 2).toFixed(1)}" y="${(80 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="${fx} ${fy} ${fw} ${fh}" preserveAspectRatio="xMidYMax meet" overflow="visible"><image href="${pic}" width="${vw}" height="${vh}"/></svg>`;
    box = href
      ? `<a class="sc-box" href="${esc(href)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(label)}"><title>${esc(label)}</title>${img}</a>`
      : `<g class="sc-box">${img}</g>`;
  }
  return `<svg class="scene sc-${state}" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax meet" focusable="false" style="--sc-link:${c}">
    <g aria-hidden="true">
      <g class="sc-dots">${SCENE_DOTS}</g>
      <path class="sc-fibre-bed" d="${fibre}"/>
      <path class="sc-fibre${up ? " flow" : ""}" d="${fibre}"/>
      ${links}
      <g class="sc-waves${radio ? " on" : ""}" transform="translate(160 40)"><path class="w1" d="M-6 -4 a8 8 0 0 1 12 0"/><path class="w2" d="M-11 -9 a15 15 0 0 1 22 0"/><path class="w3" d="M-16 -14 a22 22 0 0 1 32 0"/></g>
      ${state === "down" ? '<g class="sc-cut" transform="translate(116 70)"><circle r="6"/><path d="M-2.6 -2.6 l5.2 5.2 M2.6 -2.6 l-5.2 5.2"/></g>' : ""}
    </g>
    ${box}
  </svg>`;
};
export const IMG_LOGO = "__IMG_LOGO__";
export const IMG_ORANGE = "__IMG_ORANGE__";
export const IMG_SFR = "__IMG_SFR__";
export const IMG_BBOX = "__IMG_BBOX__";
export const FREE_URL = "https://www.free.fr";
export const ADMIN_URL = "https://mafreebox.freebox.fr";

export const ICONS = {
  down: "M9,4H15V12H19.84L12,19.84L4.16,12H9V4Z",
  up: "M15,20H9V12H4.16L12,4.16L19.84,12H15V20Z",
  temp: "M15 13V5A3 3 0 0 0 9 5V13A5 5 0 1 0 15 13M12 4A1 1 0 0 1 13 5V8H11V5A1 1 0 0 1 12 4Z",
  fan: "M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.68 9.22,10.87C9.41,10.39 9.73,9.97 10.14,9.65C8.15,5.96 8.94,2 12.5,2Z",
  // mdi:speedometer, for the last speed test.
  speedtest: "M12,16A3,3 0 0,1 9,13C9,11.88 9.61,10.9 10.5,10.39L20.21,4.77L14.68,14.35C14.18,15.33 13.17,16 12,16M12,3C13.81,3 15.5,3.5 16.97,4.32L14.87,5.53C14,5.19 13,5 12,5A8,8 0 0,0 4,13C4,15.21 4.89,17.21 6.34,18.65H6.35C6.74,19.04 6.74,19.67 6.35,20.06C5.96,20.45 5.32,20.45 4.93,20.07V20.07C3.12,18.26 2,15.76 2,13A10,10 0 0,1 12,3M22,13C22,15.76 20.88,18.26 19.07,20.07V20.07C18.68,20.45 18.05,20.45 17.66,20.06C17.27,19.67 17.27,19.04 17.66,18.65V18.65C19.11,17.2 20,15.21 20,13C20,12 19.81,11 19.46,10.1L20.67,8C21.5,9.5 22,11.18 22,13Z",
  timer: "M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39M11,14H13V8H11M15,1H9V3H15V1Z",
  network: "M13,19H14A1,1 0 0,1 15,20H22V22H15A1,1 0 0,1 14,23H10A1,1 0 0,1 9,22H2V20H9A1,1 0 0,1 10,19H11V17H4A1,1 0 0,1 3,16V12A1,1 0 0,1 4,11H20A1,1 0 0,1 21,12V16A1,1 0 0,1 20,17H13V19M4,3H20A1,1 0 0,1 21,4V8A1,1 0 0,1 20,9H4A1,1 0 0,1 3,8V4A1,1 0 0,1 4,3M9,7H10V5H9V7M9,15H10V13H9V15M5,5V7H7V5H5M5,13V15H7V13H5Z",
  ip: "M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
  devices: "M3,6H21V4H3C1.9,4 1,4.9 1,6V18A2,2 0 0,0 3,20H7V18H3V6M13,12H9V13.78C8.39,14.33 8,15.11 8,16C8,16.89 8.39,17.67 9,18.22V20H13V18.22C13.61,17.67 14,16.88 14,16C14,15.12 13.61,14.33 13,13.78V12M11,17.5A1.5,1.5 0 0,1 9.5,16A1.5,1.5 0 0,1 11,14.5A1.5,1.5 0 0,1 12.5,16A1.5,1.5 0 0,1 11,17.5M22,8H16A1,1 0 0,0 15,9V19A1,1 0 0,0 16,20H22A1,1 0 0,0 23,19V9A1,1 0 0,0 22,8M21,18H17V10H21V18Z",
  wifi: "M12,21L15.6,16.2C14.6,15.45 13.35,15 12,15C10.65,15 9.4,15.45 8.4,16.2L12,21M12,3C7.95,3 4.21,4.34 1.2,6.6L3,9C5.5,7.12 8.62,6 12,6C15.38,6 18.5,7.12 21,9L22.8,6.6C19.79,4.34 16.05,3 12,3M12,9C9.3,9 6.81,9.89 4.8,11.4L6.6,13.8C8.1,12.67 9.97,12 12,12C14.03,12 15.9,12.67 17.4,13.8L19.2,11.4C17.19,9.89 14.7,9 12,9Z",
  wifi_off: "M2.28,3L1,4.27L2.47,5.74C2.04,6 1.61,6.29 1.2,6.6L3,9C3.39,8.7 3.82,8.42 4.26,8.16L6.5,10.4C5.9,10.68 5.33,11 4.8,11.4L6.6,13.8C7.14,13.4 7.73,13.06 8.35,12.79L10.88,15.32C10,15.5 9.13,15.79 8.4,16.2L12,21L14.88,17.17L19.73,22L21,20.72L3.28,3H2.28M12,3C10.08,3 8.24,3.3 6.5,3.85L8.97,6.32C9.95,6.11 10.96,6 12,6C15.38,6 18.5,7.12 21,9L22.8,6.6C19.79,4.34 16.05,3 12,3M12,9C11.62,9 11.25,9 10.88,9.05L14.15,12.32C15.32,12.6 16.43,13.09 17.4,13.8L19.2,11.4C17.19,9.89 14.7,9 12,9Z",
  check: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.58L21,7Z",
  refresh: "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z",
  restart: "M12,4C14.1,4 16.1,4.8 17.6,6.3C20.7,9.4 20.7,14.5 17.6,17.6C15.8,19.5 13.3,20.2 10.9,19.9L11.4,17.9C13.1,18.1 14.9,17.5 16.2,16.2C18.5,13.9 18.5,10.1 16.2,7.7C15.1,6.6 13.5,6 12,6V10.6L7,5.6L12,0.6V4M6.3,17.6C3.7,15 3.3,11 5.1,7.9L6.6,9.4C5.5,11.6 5.9,14.4 7.8,16.2C8.3,16.7 8.9,17.1 9.6,17.4L9,19.4C8,19 7.1,18.4 6.3,17.6Z",
  phone: "M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z",
  phone_missed: "M23.71,16.67C20.66,13.77 16.54,12 12,12C7.46,12 3.34,13.77 0.29,16.67C0.11,16.85 0,17.1 0,17.38C0,17.66 0.11,17.9 0.29,18.08L2.77,20.56C2.95,20.74 3.2,20.85 3.5,20.85C3.75,20.85 4,20.75 4.18,20.57C4.97,19.83 5.86,19.21 6.84,18.71C7.17,18.55 7.4,18.21 7.4,17.81V14.71C8.85,14.24 10.39,14 12,14C13.6,14 15.15,14.24 16.6,14.72V17.82C16.6,18.22 16.83,18.56 17.16,18.72C18.14,19.21 19.04,19.84 19.82,20.58C20,20.76 20.25,20.86 20.5,20.86C20.8,20.86 21.05,20.75 21.23,20.57L23.71,18.09C23.89,17.91 24,17.66 24,17.38C24,17.1 23.89,16.85 23.71,16.67M6.5,5.5L12,11L19,4L18,3L12,9L7.5,4.5H11V3H5V9H6.5V5.5Z",
  database: "M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z",
  // mdi:arrow-expand / mdi:arrow-collapse: the detail button of the mini card.
  expand: "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
  collapse: "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
  services: "M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z",
};


export const RATE_UNITS = {
  en: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  fr: { bytes: ["o/s", "ko/s", "Mo/s", "Go/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  de: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  es: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  sr: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  "sr-Latn": { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  it: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  nl: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  pt: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  pl: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  ro: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  da: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  sv: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  bg: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  ru: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  uk: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  hu: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  sk: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  cs: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  sl: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  lv: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
  el: { bytes: ["B/s", "kB/s", "MB/s", "GB/s"], bits: ["b/s", "kb/s", "Mb/s", "Gb/s"] },
};

// Freebox models supported by the Freebox integration (Freebox OS), with their commercial name, detected
// from the model id (fbxgw9-r1) or the pretty name (Freebox v9 (r1)). The `model` option forces one by id.
export const MODELS = [
  { id: "ultra", name: "Freebox Ultra", re: /fbxgw9|v9\b/i },
  { id: "pop", name: "Freebox Pop", re: /fbxgw8|v8\b/i },
  { id: "delta", name: "Freebox Delta", re: /fbxgw7|v7\b/i },
  { id: "revolution", name: "Freebox Revolution", re: /fbxgw-r|v6\b/i },
  { id: "mini_4k", name: "Freebox mini 4K", re: /fbxgw2|mini/i },
];

// Internet boxes supported, keyed by the Home Assistant integration platform that exposes them. Each operator maps
// the card's data slots to that integration's entity translation keys (`keys`), or to entity-id patterns for a
// legacy integration without translation keys (`legacy`), and carries the branding (name, accent colour, URLs,
// logo and model pictures). Freebox is the reference; the others are discovered the same way from their own keys.
// The box picture comes from the matched model; a box whose model is unknown (and no `model` option) shows none.
export const OPERATORS = {
  freebox: {
    platform: "freebox", name: "Freebox", color: "#cd1e25", logo: IMG_LOGO,
    website: FREE_URL, admin: ADMIN_URL, models: MODELS,
    keys: { rate_down: "rate_down", rate_up: "rate_up", missed: "missed", wifi: "wifi", mark_read: "mark_calls_as_read", reboot: "reboot", partition: "partition_free_space", raid: "raid_degraded" },
    // Core versions whose Freebox entities have hardcoded English names and no translation key (juju35/ha-internet-box-card#112):
    // matched by entity-id suffix, only for entities without a key. Partitions and RAID arrays are on the disk devices.
    ids: {
      rate_down: /^sensor\..+_download_speed$/, rate_up: /^sensor\..+_upload_speed$/, missed: /^sensor\..+_missed_calls$/,
      wifi: /^switch\..+_wifi$/, mark_read: /^button\.(.+_)?mark_calls_as_read$/,
    },
    childIds: { partition: /^sensor\..+_free_space$/, raid: /^binary_sensor\..+_degraded$/ },
  },
  livebox: {
    platform: "livebox", name: "Livebox", color: "#ff7900", logo: IMG_ORANGE,
    website: "https://www.orange.fr", admin: "http://livebox.home",
    models: [
      { id: "livebox_7", name: "Livebox 7", re: /livebox\s*7|lb7/i },
      { id: "livebox_6", name: "Livebox 6", re: /livebox\s*6|lb6/i },
      // The "Livebox Fibre" (ProductClass) is a Livebox 5, by Arcadyan (ModelName ArcadyanLBFIBRE_OFR) or Sagemcom
      // (SagemcomFast5656_OFR).
      { id: "livebox_5", name: "Livebox 5", re: /livebox\s*5|lb5|arcadyanlbfibre|fast\s*5656/i },
      { id: "livebox_4", name: "Livebox 4", re: /livebox\s*4|lb4/i },
      { id: "livebox_s", name: "Livebox S", re: /livebox\s*s\b|lbs\b/i },
      // KPN (Netherlands) runs Livebox OS on its Box 12 (firmware V12.C…), supported by the same integration.
      { id: "kpn_box_12", name: "KPN Box 12", re: /kpn|box\s*12\b|^v12\./i, pic: "generic_hub", brand: "kpn" },
    ],
    // `wan`: the WAN connectivity binary sensor ("WAN Status", its link_type attribute gives the kind of line).
    // `missed`: the "call missed" binary sensor, whose `missed_calls` attribute lists the missed calls (the `callers`
    // sensor counts every call, missed or not: `missed_total` is only a fallback, filtered on status "missed").
    keys: {
      rate_down: "down_rate", rate_up: "up_rate", missed: "callmissed", missed_total: "callers", wifi: "wifi_switch",
      mark_read: "cmissed_clear_btn", reboot: "restart_btn", wan: "connectivity",
    },
    // On a fibre line (GPON or SFP) the integration creates no xDSL down_rate / up_rate sensor: the throughput comes
    // from the WAN interface statistics, whose translation keys are built from the interface name (WAN_GPON_rate_rx,
    // or just fiber_rate_rx on the boxes that name the interface "fiber", juju35/ha-internet-box-card#114).
    // `alt` holds patterns on the translation key, used when the canonical key is missing (never Wi-Fi or Ethernet
    // interfaces, nor the DS-Lite tunnel).
    alt: { rate_down: /^(wan_(gpon|sfp)|fiber)_rate_rx$/i, rate_up: /^(wan_(gpon|sfp)|fiber)_rate_tx$/i },
    // The box exposes fibre sensors (fiber_rx / fiber_tx byte counters, fiber_power_rx / fiber_power_tx): their mere
    // presence means the line is fibre, used when the WAN status has no (or an unrecognised) link_type attribute
    // (juju35/ha-internet-box-card#114).
    fiberKey: /^fiber(_power)?_[rt]x$/i,
    // Since Livebox 3.0.0 every interface shares one translation key (interface_rate_rx / _tx, the interface only a
    // placeholder of the name): the WAN interface is then told by its name in the entity id, generated from the name in
    // any language (sensor.livebox_wan_sfp_rate_rx, sensor.livebox_debit_recu_wan_sfp), never a sub-interface
    // (wan_gpon_internet…) nor the DS-Lite tunnel. `veip0` is the GPON interface of the boxes with a built-in ONT.
    // `optical_ont` is the WAN interface of the boxes behind an external ONT (Livebox 3 / 4: "Optical ONT").
    altIface: {
      keys: { rate_down: "interface_rate_rx", rate_up: "interface_rate_tx" },
      re: /(^|_)(wan_(gpon|sfp)|veip0|optical_ont|fiber)(_rate_[rt]x)?(_\d+)?$/i,
    },
    // A box without a rate sensor the card knows (a Livebox 4 on fibre, juju35/ha-internet-box-card#114: no xDSL rate on
    // a GPON line, and its WAN interface is not WAN_GPON / WAN_SFP / veip0) is still found by its WAN status binary
    // sensor or its restart button, entities of the box device only.
    anchorKeys: ["connectivity", "restart_btn"],
  },
  sfr_box: {
    platform: "sfr_box", name: "SFR Box", color: "#e2001a", logo: IMG_SFR,
    website: "https://www.sfr.fr", admin: "http://192.168.1.1",
    models: [
      { id: "sfr_box_8", name: "SFR Box 8", re: /box\s*8|nb8|fast\s*5[0-9]/i },
      { id: "sfr_box_7", name: "SFR Box 7", re: /box\s*7|nb7/i },
      { id: "sfr_nb6vac", name: "SFR Box", re: /nb6vac|box\s*(plus|power|fibre|thd)/i },
    ],
    // sfr_box exposes no throughput sensor, only the DSL line sync rates: they go to the `sync_*` slots, shown as
    // "Line rate" (no 24 h traffic curve), never as download / upload. The reboot button has no translation key
    // but device_class "restart" (matched below too). The link state comes from its connectivity binary sensors: the
    // WAN first, else the DSL or FTTH line (`lines`, by kind of line), with the DSL training and line status sensors
    // telling why a DSL line is down, and the access network (net_infra) its kind.
    keys: {
      sync_down: "dsl_rate_down", sync_up: "dsl_rate_up", reboot: "system_reboot",
      wan: "wan_status", lines: { dsl_status: "DSL", ftth_status: "FTTH" }, training: "dsl_training", line_status: "dsl_line_status", infra: "net_infra",
    },
  },
  bbox: {
    platform: "bbox", name: "Bbox", color: "#1246a0", logo: IMG_BBOX,
    website: "https://www.bouyguestelecom.fr", admin: "https://mabbox.bytel.fr",
    models: [
      { id: "bbox_wifi7", name: "Bbox Wi-Fi 7", re: /wi-?fi\s*7|5696/i, pic: "generic_router" },
      { id: "bbox_fibre", name: "Bbox Fibre", re: /fibre|fiber/i },
      { id: "bbox_ultym", name: "Bbox Ultym", re: /ultym/i },
      { id: "bbox_miami", name: "Bbox Miami", re: /miami/i },
    ],
    // Legacy integration: hardcoded English names, no translation keys, so it is discovered by entity-id suffix.
    // The core `bbox` platform and its `custom_bbox` fork (hass_custom_bbox, for the firmwares that the core one can no
    // longer reach since Home Assistant 2022.7) create the same sensors, uptime included (a boot date).
    legacy: { rate_down: /_currently_used_download_bandwidth$/, rate_up: /_currently_used_upload_bandwidth$/, boot: /_uptime$/ },
    // The "Bouygues Bbox" integration (hass-bbox2, custom, config flow) shares the `bbox` domain but registers a
    // device and its entities. Its sensors have hardcoded English names and no translation key: they are matched by
    // entity-id suffix (`ids`, only for the box's own entities without a key); its Wi-Fi switches have keys.
    keys: { wifi: "wifi" },
    ids: {
      rate_down: /^sensor\..+_download_speed$/, rate_up: /^sensor\..+_upload_speed$/, boot: /^sensor\..+_uptime$/,
      ip: /^sensor\..+_ip_address$/, ip6: /^sensor\..+_ipv6_address$/, wan: /^binary_sensor\..+_link_status$/,
      reboot: /^button\..+_restart$/,
    },
  },
  // FRITZ!Box (fritz, built in): AVM / FRITZ! routers, sold by 1&1, O2, Telekom and many providers in Germany,
  // Austria, Switzerland and the Netherlands. Traffic rates in kB/s, the DSL line sync rates (kept as sync rates,
  // shown only without traffic sensors), the WAN connection, external IPs, the box uptime (device_uptime, no
  // translation key) and the main Wi-Fi switches (one per band: wi_fi_main_2_4ghz, wi_fi_main_5ghz…).
  fritz: {
    platform: "fritz", name: "FRITZ!Box", color: "#1f6fd1", logo: "__IMG_FILE:fritz.svg__",
    website: "https://fritz.com", admin: "http://fritz.box", syncLine: "DSL",
    models: [
      { id: "fritz_box_cable", name: "FRITZ!Box Cable", re: /fritz!?\s*box\s*6\d{3}/i, pic: "generic_tower", fromDevice: true },
      { id: "fritz_box", name: "FRITZ!Box", re: /fritz/i, pic: "generic_router", fromDevice: true },
    ],
    keys: {
      rate_down: "kb_s_received", rate_up: "kb_s_sent", sync_down: "link_kb_s_received", sync_up: "link_kb_s_sent",
      wan: "is_connected", ip: "external_ip", ip6: "external_ipv6",
    },
    alt: { wifi: /^wi_fi_main/ },
    bootClass: true,
  },
  // Vodafone Station (vodafone_station, built in): Sercomm, Technicolor and UltraHub routers of Vodafone in Italy,
  // the United Kingdom, Ireland and Germany. Rates in kB/s, external IPs, active connection (DSL, fibre, Internet
  // Key), uptime (sys_uptime, no translation key), main Wi-Fi switch; its reconnect buttons are restart buttons too,
  // with a translation key, never taken for the reboot.
  vodafone_station: {
    platform: "vodafone_station", name: "Vodafone Station", color: "#e60000", logo: "__IMG_FILE:vodafone.svg__",
    website: "https://www.vodafone.com", admin: "http://192.168.1.1",
    models: [
      { id: "vodafone_gigabox", name: "Vodafone Gigabox", re: /gigabox/i, pic: "generic_tower" },
      { id: "vodafone_power_station", name: "Vodafone Power Station", re: /shg30[0-9]0|power\s*station/i, pic: "generic_tower" },
      { id: "vodafone_wifi6_station", name: "Vodafone WiFi 6 Station", re: /rhg3006|cga6444|wi-?fi\s*6\s*station/i, pic: "generic_hub" },
      { id: "vodafone_ultra_hub", name: "Vodafone Ultra Hub", re: /ultra\s*hub|fg4278|dgm4980/i, pic: "generic_tower" },
      { id: "vodafone_vox", name: "Vodafone Vox 3.0", re: /thg3000|vox/i, pic: "generic_hub" },
      { id: "vodafone_h300s", name: "Vodafone H300S", re: /h300s/i, pic: "generic_hub" },
    ],
    keys: { rate_down: "down_stream", rate_up: "up_stream", ip: "external_ipv4", ip6: "external_ipv6", infra: "active_connection", wifi: "main" },
    bootClass: true,
    infraLink: true,
  },
  // Swisscom Internet-Box (swisscom, built in): presence detection only, a device tracker per connected device and
  // no entity for the box itself. The box is the integration: its connected devices are counted.
  swisscom: {
    platform: "swisscom", name: "Swisscom Internet-Box", color: "#1b2f78", logo: "__IMG_FILE:swisscom.svg__",
    website: "https://www.swisscom.ch", admin: "http://internetbox.home", trackersOnly: true, defaultModel: "internet_box",
    models: [{ id: "internet_box", name: "Internet-Box", re: /internet-?box/i, pic: "generic_hub" }],
    keys: {},
  },
  // Sagemcom F@st (sagemcom_fast, custom): the reboot button (device_class restart) on the gateway device, and a
  // tracker per connected device. The F@st routers are rebranded by many providers: the model gives the provider.
  sagemcom_fast: {
    platform: "sagemcom_fast", name: "Sagemcom F@st", color: "#00838f", logo: "__IMG_FILE:sagemcom.svg__",
    website: "https://www.sagemcom.com", admin: null, anchorRestart: true,
    models: [
      { id: "proximus_bbox3", name: "Proximus b-box 3", re: /3865/i, pic: "generic_tower", brand: "proximus" },
      { id: "kpn_experia_box_12", name: "KPN Experia Box 12", re: /5359|experia/i, pic: "generic_tower", brand: "kpn" },
      { id: "kpn_fast_4360", name: "KPN F@st 4360Air", re: /4360/i, pic: "generic_router", brand: "kpn" },
      { id: "delta_fast_3890", name: "DELTA F@st 3890V3", re: /3890/i, pic: "generic_tower", brand: "delta" },
      { id: "telekom_speedport_pro", name: "Telekom Speedport Pro", re: /speedport/i, pic: "generic_tower", brand: "telekom" },
      { id: "bt_smart_hub", name: "BT Smart Hub", re: /5364|smart\s*hub/i, pic: "generic_tower", brand: "bt" },
      { id: "eir_f3000", name: "eir F3000", re: /5366|f3000/i, pic: "generic_router", brand: "eir" },
      { id: "salt_fibrebox_x6", name: "Salt FibreBox X6", re: /5688|fibrebox/i, pic: "generic_tower", brand: "salt" },
      { id: "masmovil_fast_5655", name: "MásMóvil F@st 5655", re: /5655/i, pic: "generic_router", brand: "masmovil" },
      { id: "telia_fast_5370", name: "Telia F@st 5370e", re: /5370/i, pic: "generic_router", brand: "telia" },
      { id: "tdc_fast_5380", name: "TDC F@st 5380", re: /5380/i, pic: "generic_router", brand: "tdc" },
      { id: "bell_home_hub_4000", name: "Bell Home Hub 4000", re: /5689|home\s*hub\s*4000/i, pic: "generic_tower", brand: "bell" },
      { id: "bell_home_hub_3000", name: "Bell Home Hub 3000", re: /5566|home\s*hub\s*3000/i, pic: "generic_tower", brand: "bell" },
      { id: "optus_fast_3864", name: "Optus F@st 3864", re: /3864/i, pic: "generic_router", brand: "optus" },
      { id: "sagemcom_fast", name: "Sagemcom F@st", re: /f@st|sagemcom/i, pic: "generic_router", fromDevice: true },
    ],
    keys: {},
  },
  // Huawei LTE (huawei_lte, built in): 4G / 5G routers (B535, B818, H122…). Rates in B/s, mobile connection, WAN IPs,
  // uptime in seconds, Wi-Fi state (read only: a binary sensor), restart button (device_class restart, no key).
  huawei_lte: {
    platform: "huawei_lte", name: "Huawei LTE", color: "#c7000b", logo: "__IMG_FILE:huawei.svg__",
    website: "https://consumer.huawei.com", admin: "http://192.168.8.1", line: "LTE",
    models: [{ id: "huawei_lte_router", name: "Huawei 4G / 5G router", re: /./, pic: "generic_mobile", fromDevice: true, prefix: "Huawei" }],
    keys: {
      rate_down: "current_download_rate", rate_up: "current_upload_rate", wan: "mobile_connection",
      ip: "wan_ip_address", ip6: "wan_ipv6_address", boot: "uptime", wifi: "wifi_status",
    },
  },
  // ZTE Hyperbox (zte_hyperbox, custom): MC8810 Hyperbox 5G Lite. Its sensors are matched by their kind (data rate,
  // restart button, connectivity), the integration's keys being unknown to the card.
  zte_hyperbox: {
    platform: "zte_hyperbox", name: "ZTE Hyperbox", color: "#0068b7", logo: "__IMG_FILE:zte.svg__",
    website: "https://www.zte.com", admin: "http://192.168.0.1", line: "5G", guess: true, anchorRestart: true,
    models: [{ id: "zte_mc8810", name: "ZTE Hyperbox 5G Lite", re: /./, pic: "generic_mobile" }],
    keys: {},
    bootClass: true,
  },
  // Starlink (starlink, built in): the dish's throughput in bit/s, last restart (a date), connectivity (device_class
  // connectivity, no key) and reboot button.
  starlink: {
    platform: "starlink", name: "Starlink", color: "#3c4a5c", logo: "__IMG_FILE:starlink.svg__",
    website: "https://www.starlink.com", admin: "http://192.168.100.1", line: "SATELLITE",
    models: [{ id: "starlink", name: "Starlink", re: /./, pic: "generic_dish" }],
    keys: { rate_down: "downlink_throughput", rate_up: "uplink_throughput", boot: "last_restart" },
    wanClass: true,
  },
};

// Internet providers that ship a box supported through another integration (its model's `brand`): their name,
// accent colour and links replace the integration's on the card. A provider with no admin address leaves the box's
// own configuration URL (the device's), as the Sagemcom F@st integration sets it.
export const BRANDS = {
  kpn: { name: "KPN", color: "#009900", website: "https://www.kpn.com", admin: "http://192.168.2.254", logo: "__IMG_FILE:kpn.svg__" },
  proximus: { name: "Proximus", color: "#5c2d91", website: "https://www.proximus.be", admin: "http://192.168.1.1", logo: "__IMG_FILE:proximus.svg__" },
  delta: { name: "DELTA Fiber", color: "#008ecf", website: "https://www.delta.nl", admin: null, logo: "__IMG_FILE:delta.svg__" },
  telekom: { name: "Telekom", color: "#e20074", website: "https://www.telekom.de", admin: "http://speedport.ip", logo: "__IMG_FILE:telekom.svg__" },
  bt: { name: "BT", color: "#5514b4", website: "https://www.bt.com", admin: "http://192.168.1.254", logo: "__IMG_FILE:bt.svg__" },
  eir: { name: "eir", color: "#e40046", website: "https://www.eir.ie", admin: null, logo: "__IMG_FILE:eir.svg__" },
  salt: { name: "Salt", color: "#c8102e", website: "https://www.salt.ch", admin: null, logo: "__IMG_FILE:salt.svg__" },
  masmovil: { name: "MásMóvil", color: "#e5bd00", website: "https://www.masmovil.es", admin: null, logo: "__IMG_FILE:masmovil.svg__" },
  telia: { name: "Telia", color: "#990ae3", website: "https://www.telia.se", admin: null, logo: "__IMG_FILE:telia.svg__" },
  tdc: { name: "TDC", color: "#1f3a93", website: "https://tdc.dk", admin: null, logo: "__IMG_FILE:tdc.svg__" },
  bell: { name: "Bell", color: "#00549a", website: "https://www.bell.ca", admin: "http://192.168.2.1", logo: "__IMG_FILE:bell.svg__" },
  optus: { name: "Optus", color: "#008a8a", website: "https://www.optus.com.au", admin: null, logo: "__IMG_FILE:optus.svg__" },
};
