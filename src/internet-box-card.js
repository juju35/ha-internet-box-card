/*
 * Internet Box Card for Home Assistant
 * https://github.com/juju35/ha-internet-box-card
 *
 * Lovelace cards for internet boxes: the Freebox, Livebox (Orange, KPN), SFR Box, Bbox (Bouygues), FRITZ!Box,
 * Vodafone Station, Swisscom Internet-Box, Sagemcom F@st, Huawei LTE, ZTE Hyperbox and Starlink integrations.
 * Entities are discovered automatically from the entity registry (integration platform and translation key),
 * whatever the language and the entity ids; the legacy Bbox integration is found by entity id.
 */

const VERSION = "__VERSION__";
// Freebox pictures, drawn: rounded boxes as an extruded top shape (plan flattened by the view angle), square boxes
// in parallel projection (each face drawn flat and placed with shared axes).
const FONT = 'font-family="Arial, Helvetica, sans-serif"';
// Extrusion of a convex top shape: the shape `top(dy)` drawn at dy = h (bottom), a band between its left / right
// extremes (x0, x1 at height yExt), then the shape at dy = 0 (top).
const extrude = (top, x0, x1, yExt, h, side, cap) =>
  `<path d="${top(h)}" fill="${side}"/><rect x="${x0}" y="${yExt}" width="${x1 - x0}" height="${h}" fill="${side}"/><path d="${top(0)}" fill="${cap}"/>`;
const svgDoc = (w, h, defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;
const grad = (id, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
// Stadium (pill) outline centred on (cx, cy), half-sizes a × b, ends of radius b.
const stadium = (cx, cy, a, b) => `M${cx - a + b} ${cy - b} H${cx + a - b} A${b} ${b} 0 0 1 ${cx + a - b} ${cy + b} H${cx - a + b} A${b} ${b} 0 0 1 ${cx - a + b} ${cy - b} Z`;
// Squircle-like rounded ellipse (Ultra): superellipse approximated with cubic curves.
const roundEllipse = (cx, cy, a, b, k = 0.82) =>
  `M${cx} ${cy - b} C${cx + a * k} ${cy - b} ${cx + a} ${cy - b * k} ${cx + a} ${cy} C${cx + a} ${cy + b * k} ${cx + a * k} ${cy + b} ${cx} ${cy + b} C${cx - a * k} ${cy + b} ${cx - a} ${cy + b * k} ${cx - a} ${cy} C${cx - a} ${cy - b * k} ${cx - a * k} ${cy - b} ${cx} ${cy - b} Z`;

// Freebox Ultra: white rounded oval with the black "free" pill and its button on top.
const ultraSvg = () => {
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
const popSvg = () => {
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
const DOTS = {
  1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  3: [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."],
  7: ["#####", "....#", "...#.", "..#..", "..#..", "..#..", "..#.."],
  ":": [".", ".", "#", ".", "#", ".", "."],
};
// "text" in glowing dots from (x, y), dot pitch p.
const dotText = (text, x, y, p) => {
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
const deltaSvg = () => {
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
const display1337 = (x, y, dh, fill = "#d8c21a") =>
  `<text x="${x}" y="${y + dh}" font-size="${dh * 1.25}" font-weight="700" fill="${fill}" ${FONT} letter-spacing="1">13</text><text x="${x}" y="${y + 2.1 * dh}" font-size="${dh * 1.25}" font-weight="700" fill="${fill}" ${FONT} letter-spacing="1">37</text>`;
const dpad = (cx, cy, r, col) =>
  `<path d="M${cx - 3} ${cy - r + 3} l3 -3 l3 3 M${cx - 3} ${cy + r - 3} l3 3 l3 -3 M${cx - r + 3} ${cy - 3} l-3 3 l3 3 M${cx + r - 3} ${cy - 3} l3 3 l-3 3" fill="none" stroke="${col}" stroke-width="1.3" stroke-linecap="round"/>`;
// Freebox mini 4K (photo): seen from above, brushed grey top, black front with the yellow display.
const mini4kSvg = () => {
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
const revolutionSvg = () => {
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
const LB = "#ff7900";
// Dark upright box with a flat top (Livebox 6 / 7). `diode` adds the white dot under the orange status line.
const liveboxDark = ({ w, h, diode }) => {
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
const livebox6Svg = () => liveboxDark({ w: 94, h: 116, diode: false });
const livebox7Svg = () => liveboxDark({ w: 102, h: 128, diode: true });
// Light upright rounded box (Livebox 5).
// Low, wide black box with a diagonally ridged top (Livebox 5): a tall ridged top face and a front face with
// three vertical orange indicator bars over small icons on the left.
const livebox5Svg = () => {
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
const livebox4Svg = () => {
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
const liveboxSSvg = () => {
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
const sfrBox8Svg = () => {
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
const sfrBox7Svg = () => {
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
const sfrNB6VACSvg = () => {
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
const bboxMiamiSvg = () => {
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
const bboxUltymSvg = () => {
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
const bboxFibreSvg = () => {
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
const genRouterSvg = ({ accent } = {}) => {
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
const genHubSvg = ({ accent } = {}) => {
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
const genTowerSvg = ({ accent } = {}) => {
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
const genMobileSvg = ({ accent } = {}) => {
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
const genDishSvg = ({ accent } = {}) => {
  const defs = grad("gdsb", [[0, "#ffffff"], [1, "#cfd3d9"]], 1, 1);
  let s = `<ellipse cx="150" cy="164" rx="40" ry="6" opacity=".28"/>`;
  s += `<rect x="146" y="96" width="8" height="66" rx="3" fill="#8a8f98"/><rect x="128" y="156" width="44" height="7" rx="3" fill="#6b7078"/>`;
  if (accent) s += `<circle cx="150" cy="148" r="2.4" fill="${accent}"/>`;
  s += `<g transform="rotate(-18 150 66)"><rect x="96" y="20" width="108" height="92" rx="16" fill="url(#gdsb)" stroke="#000" stroke-opacity=".18"/>`;
  s += `<rect x="104" y="28" width="92" height="76" rx="11" fill="none" stroke="#000" stroke-opacity=".07"/></g>`;
  return svgDoc(300, 176, defs, s);
};
const GENERIC = { generic_router: genRouterSvg, generic_hub: genHubSvg, generic_tower: genTowerSvg, generic_mobile: genMobileSvg, generic_dish: genDishSvg };

const svgUri = (svg) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
// Pictures of the box models, by picture id: a model's `pic`, else its own id (Freebox, Livebox, SFR Box, Bbox drawings,
// then the generic form factors of the other integrations).
const IMG_BOX = {
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
const _tinted = new Map();
const modelPic = (m, accent) => {
  if (!m) return undefined;
  const pic = m.pic ?? m.id;
  if (!accent || !GENERIC[pic]) return IMG_BOX[pic];
  const key = `${pic}|${accent}`;
  if (!_tinted.has(key)) _tinted.set(key, svgUri(GENERIC[pic]({ accent })));
  return _tinted.get(key);
};
const IMG_LOGO = "__IMG_LOGO__";
const IMG_ORANGE = "__IMG_ORANGE__";
const IMG_SFR = "__IMG_SFR__";
const IMG_BBOX = "__IMG_BBOX__";
const FREE_URL = "https://www.free.fr";
const ADMIN_URL = "https://mafreebox.freebox.fr";

const ICONS = {
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

const STRINGS = {
  en: {
    network: "Network",
    system: "System",
    storage: "Storage",
    services: "Services",
    download: "Download",
    upload: "Upload",
    line_rate: "Line rate",
    uptime: "Uptime",
    firmware: "Firmware",
    devices_short: "Devices",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi on",
    wifi_off: "Wi-Fi off",
    on: "On",
    off: "Off",
    mark_read: "Mark calls as read",
    restart: "Restart the box",
    restart_confirm: "Restart the box now? The internet, phone and TV connection will be interrupted for a few minutes.",
    restart_btn: "Restart",
    cancel: "Cancel",
    wifi_turn_on: "Turn the Wi-Fi on",
    wifi_turn_off: "Turn the Wi-Fi off",
    wifi_off_confirm: "Turn the Wi-Fi off now? Wireless devices will lose their connection; wired devices are not affected.",
    wifi_off_btn: "Turn off",
    calls: "Calls",
    missed: "missed",
    temperature: "Temp.",
    used: "used",
    free: "free",
    raid_ok: "OK",
    raid_degraded: "Degraded",
    online: "Online",
    offline: "Offline",
    syncing: "Syncing",
    line_fault: "Line fault",
    unavailable: "Unavailable",
    hours: "h",
    days: "d",
    minutes: "min",
    rpm: "rpm",
    disk: "Disk",
    no_box: "No internet box found. Is a supported integration (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink) installed?",
    unknown_box: "Internet box not found",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    // Editor
    box: "Internet box (integration device)",
    title: "Title (optional, defaults to the box model)",
    model: "Box model (picture and default title)",
    model_auto: "Automatic",
    show_image: "Show the box picture",
    show_title: "Show title",
    show_subtitle: "Show subtitle",
    admin: "Open the box admin interface",
    admin_url: "Box admin address (optional, opened when clicking the picture)",
    show_logo: "Show the operator logo",
    show_network: "Show network",
    show_history: "Show 24 h rate history",
    show_system: "Show system (temperatures, fans)",
    show_storage: "Show storage",
    show_services: "Show services (Wi-Fi, calls, devices)",
    show_speedtest: "Show the last speed test (Speedtest.net)",
    speedtest: "Speed test",
    entities: "Sensors of your choice",
    ent_rate_down: "Box download rate",
    ent_rate_up: "Box upload rate",
    ent_download: "Speed test: download",
    ent_upload: "Speed test: upload",
    ent_ping: "Speed test: ping",
    ent_run: "Speed test: button to run it",
    run_speedtest: "Run a speed test",
    speedtest_running: "Speed test running…",
    zoom: "Detail button",
    zoom_helper: "Button at the top right that shows the full card in place of the mini card, and back",
    rate_unit: "Rate unit",
    unit_bytes: "Bytes (kB/s, MB/s)",
    unit_bits: "Bits (kb/s, Mb/s)",
    language: "Language",
    lang_auto: "Automatic",
    temp_warning: "Temperature warning (°C)",
    temp_critical: "Temperature critical (°C)",
    disk_warning: "Storage warning (% used)",
    disk_critical: "Storage critical (% used)",
  },
  fr: {
    network: "Réseau",
    system: "Système",
    storage: "Stockage",
    services: "Services",
    download: "Réception",
    upload: "Envoi",
    line_rate: "Débit synchro",
    uptime: "Allumée depuis",
    firmware: "Firmware",
    devices_short: "Appareils",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi activé",
    wifi_off: "Wi-Fi désactivé",
    on: "Activé",
    off: "Désactivé",
    mark_read: "Marquer les appels comme lus",
    restart: "Redémarrer la box",
    restart_confirm: "Redémarrer la box maintenant ? La connexion internet, téléphone et TV sera interrompue pendant quelques minutes.",
    restart_btn: "Redémarrer",
    cancel: "Annuler",
    wifi_turn_on: "Activer le Wi-Fi",
    wifi_turn_off: "Désactiver le Wi-Fi",
    wifi_off_confirm: "Désactiver le Wi-Fi maintenant ? Les appareils sans fil perdront leur connexion ; les appareils filaires ne sont pas concernés.",
    wifi_off_btn: "Désactiver",
    calls: "Appels",
    missed: "manqués",
    missed_one: "manqué",
    temperature: "Temp.",
    used: "utilisés",
    free: "libres",
    raid_ok: "OK",
    raid_degraded: "Dégradé",
    online: "En ligne",
    offline: "Hors ligne",
    syncing: "Synchronisation",
    line_fault: "Défaut de ligne",
    unavailable: "Indisponible",
    hours: "h",
    days: "j",
    minutes: "min",
    rpm: "tr/min",
    disk: "Disque",
    no_box: "Aucune box internet trouvée. Une intégration compatible (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink) est-elle installée ?",
    unknown_box: "Box internet introuvable",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    box: "Box internet (appareil de l'intégration)",
    title: "Titre (facultatif, modèle de la box par défaut)",
    model: "Modèle de la box (illustration et titre par défaut)",
    model_auto: "Automatique",
    show_image: "Afficher l'illustration de la box",
    show_title: "Afficher le titre",
    show_subtitle: "Afficher le sous-titre",
    admin: "Ouvrir l'interface d'administration de la box",
    admin_url: "Adresse d'administration de la box (facultatif, ouverte au clic sur l'illustration)",
    show_logo: "Afficher le logo de l'opérateur",
    show_network: "Afficher le réseau",
    show_history: "Afficher l’historique 24 h des débits",
    show_system: "Afficher le système (températures, ventilateurs)",
    show_storage: "Afficher le stockage",
    show_services: "Afficher les services (Wi-Fi, appels, appareils)",
    show_speedtest: "Afficher le dernier test de débit (Speedtest.net)",
    speedtest: "Test de débit",
    entities: "Capteurs de votre choix",
    ent_rate_down: "Débit descendant de la box",
    ent_rate_up: "Débit montant de la box",
    ent_download: "Test de débit : descendant",
    ent_upload: "Test de débit : montant",
    ent_ping: "Test de débit : ping",
    ent_run: "Test de débit : bouton pour le lancer",
    run_speedtest: "Lancer un test de débit",
    speedtest_running: "Test de débit en cours…",
    zoom: "Bouton détail",
    zoom_helper: "Bouton en haut à droite qui affiche la carte complète à la place de la mini carte, et inversement",
    rate_unit: "Unité des débits",
    unit_bytes: "Octets (ko/s, Mo/s)",
    unit_bits: "Bits (kb/s, Mb/s)",
    language: "Langue",
    lang_auto: "Automatique",
    temp_warning: "Seuil d'alerte température (°C)",
    temp_critical: "Seuil critique température (°C)",
    disk_warning: "Seuil d'alerte stockage (% utilisé)",
    disk_critical: "Seuil critique stockage (% utilisé)",
  },
  de: {
    network: "Netzwerk",
    system: "System",
    storage: "Speicher",
    services: "Dienste",
    download: "Download",
    upload: "Upload",
    line_rate: "Leitungsrate",
    uptime: "Betriebszeit",
    firmware: "Firmware",
    devices_short: "Geräte",
    wifi: "WLAN",
    wifi_on: "WLAN an",
    wifi_off: "WLAN aus",
    on: "An",
    off: "Aus",
    mark_read: "Anrufe als gelesen markieren",
    restart: "Box neu starten",
    restart_confirm: "Box jetzt neu starten? Internet-, Telefon- und TV-Verbindung werden für einige Minuten unterbrochen.",
    restart_btn: "Neu starten",
    cancel: "Abbrechen",
    wifi_turn_on: "WLAN einschalten",
    wifi_turn_off: "WLAN ausschalten",
    wifi_off_confirm: "WLAN jetzt ausschalten? Drahtlose Geräte verlieren ihre Verbindung; kabelgebundene Geräte sind nicht betroffen.",
    wifi_off_btn: "Ausschalten",
    calls: "Anrufe",
    missed: "verpasst",
    temperature: "Temp.",
    used: "belegt",
    free: "frei",
    raid_ok: "OK",
    raid_degraded: "Beeinträchtigt",
    online: "Verbunden",
    offline: "Getrennt",
    syncing: "Synchronisiert",
    line_fault: "Leitungsstörung",
    unavailable: "Nicht verfügbar",
    hours: "h",
    days: "Tg.",
    minutes: "Min.",
    rpm: "U/min",
    disk: "Datenträger",
    no_box: "Keine Internetbox gefunden. Ist eine unterstützte Integration (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink) installiert?",
    unknown_box: "Internetbox nicht gefunden",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    box: "Internetbox (Gerät der Integration)",
    title: "Titel (optional, standardmäßig das Boxmodell)",
    model: "Boxmodell (Bild und Standardtitel)",
    model_auto: "Automatisch",
    show_image: "Bild der Box anzeigen",
    show_title: "Titel anzeigen",
    show_subtitle: "Untertitel anzeigen",
    admin: "Verwaltungsoberfläche der Box öffnen",
    admin_url: "Verwaltungsadresse der Box (optional, wird beim Klick auf das Bild geöffnet)",
    show_logo: "Logo des Anbieters anzeigen",
    show_network: "Netzwerk anzeigen",
    show_history: "24-h-Verlauf der Raten anzeigen",
    show_system: "System anzeigen (Temperaturen, Lüfter)",
    show_storage: "Speicher anzeigen",
    show_services: "Dienste anzeigen (WLAN, Anrufe, Geräte)",
    show_speedtest: "Letzten Geschwindigkeitstest anzeigen (Speedtest.net)",
    speedtest: "Geschwindigkeitstest",
    entities: "Sensoren Ihrer Wahl",
    ent_rate_down: "Download-Rate der Box",
    ent_rate_up: "Upload-Rate der Box",
    ent_download: "Geschwindigkeitstest: Download",
    ent_upload: "Geschwindigkeitstest: Upload",
    ent_ping: "Geschwindigkeitstest: Ping",
    ent_run: "Geschwindigkeitstest: Taste zum Starten",
    run_speedtest: "Geschwindigkeitstest starten",
    speedtest_running: "Geschwindigkeitstest läuft…",
    zoom: "Detail-Schaltfläche",
    zoom_helper: "Schaltfläche oben rechts, die anstelle der Mini-Karte die vollständige Karte anzeigt und umgekehrt",
    rate_unit: "Einheit der Datenrate",
    unit_bytes: "Bytes (kB/s, MB/s)",
    unit_bits: "Bits (kb/s, Mb/s)",
    language: "Sprache",
    lang_auto: "Automatisch",
    temp_warning: "Temperatur-Warnschwelle (°C)",
    temp_critical: "Kritische Temperaturschwelle (°C)",
    disk_warning: "Speicher-Warnschwelle (% belegt)",
    disk_critical: "Kritische Speicherschwelle (% belegt)",
  },
  es: {
    network: "Red",
    system: "Sistema",
    storage: "Almacenamiento",
    services: "Servicios",
    download: "Descarga",
    upload: "Subida",
    line_rate: "Velocidad de línea",
    uptime: "Tiempo activo",
    firmware: "Firmware",
    devices_short: "Dispositivos",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi activado",
    wifi_off: "Wi-Fi desactivado",
    on: "Activado",
    off: "Desactivado",
    mark_read: "Marcar las llamadas como leídas",
    restart: "Reiniciar el router",
    restart_confirm: "¿Reiniciar el router ahora? La conexión a internet, el teléfono y la TV se interrumpirán durante unos minutos.",
    restart_btn: "Reiniciar",
    cancel: "Cancelar",
    wifi_turn_on: "Activar el Wi-Fi",
    wifi_turn_off: "Desactivar el Wi-Fi",
    wifi_off_confirm: "¿Desactivar el Wi-Fi ahora? Los dispositivos inalámbricos perderán la conexión; los dispositivos con cable no se verán afectados.",
    wifi_off_btn: "Desactivar",
    calls: "Llamadas",
    missed: "perdidas",
    missed_one: "perdida",
    temperature: "Temp.",
    used: "usado",
    free: "libre",
    raid_ok: "OK",
    raid_degraded: "Degradado",
    online: "En línea",
    offline: "Fuera de línea",
    syncing: "Sincronizando",
    line_fault: "Fallo de línea",
    unavailable: "No disponible",
    hours: "h",
    days: "d",
    minutes: "min",
    rpm: "rpm",
    disk: "Disco",
    no_box: "No se ha encontrado ningún router de internet. ¿Hay instalada una integración compatible (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink)?",
    unknown_box: "Router de internet no encontrado",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    box: "Router de internet (dispositivo de la integración)",
    title: "Título (opcional, por defecto el modelo del router)",
    model: "Modelo del router (imagen y título por defecto)",
    model_auto: "Automático",
    show_image: "Mostrar la imagen del router",
    show_title: "Mostrar el título",
    show_subtitle: "Mostrar el subtítulo",
    admin: "Abrir la interfaz de administración del router",
    admin_url: "Dirección de administración del router (opcional, se abre al hacer clic en la imagen)",
    show_logo: "Mostrar el logotipo del operador",
    show_network: "Mostrar la red",
    show_history: "Mostrar el historial de 24 h de las velocidades",
    show_system: "Mostrar el sistema (temperaturas, ventiladores)",
    show_storage: "Mostrar el almacenamiento",
    show_services: "Mostrar los servicios (Wi-Fi, llamadas, dispositivos)",
    show_speedtest: "Mostrar el último test de velocidad (Speedtest.net)",
    speedtest: "Test de velocidad",
    entities: "Sensores a su elección",
    ent_rate_down: "Velocidad de descarga del router",
    ent_rate_up: "Velocidad de subida del router",
    ent_download: "Test de velocidad: descarga",
    ent_upload: "Test de velocidad: subida",
    ent_ping: "Test de velocidad: ping",
    ent_run: "Test de velocidad: botón para lanzarlo",
    run_speedtest: "Lanzar un test de velocidad",
    speedtest_running: "Test de velocidad en curso…",
    zoom: "Botón de detalle",
    zoom_helper: "Botón arriba a la derecha que muestra la tarjeta completa en lugar de la minitarjeta, y viceversa",
    rate_unit: "Unidad de velocidad",
    unit_bytes: "Bytes (kB/s, MB/s)",
    unit_bits: "Bits (kb/s, Mb/s)",
    language: "Idioma",
    lang_auto: "Automático",
    temp_warning: "Umbral de aviso de temperatura (°C)",
    temp_critical: "Umbral crítico de temperatura (°C)",
    disk_warning: "Umbral de aviso de almacenamiento (% usado)",
    disk_critical: "Umbral crítico de almacenamiento (% usado)",
  },
  sr: {
    network: "Мрежа",
    system: "Систем",
    storage: "Складиште",
    services: "Услуге",
    download: "Преузимање",
    upload: "Слање",
    line_rate: "Брзина линије",
    uptime: "Време рада",
    firmware: "Фирмвер",
    devices_short: "Уређаји",
    wifi: "Вај-фај",
    wifi_on: "Вај-фај укључен",
    wifi_off: "Вај-фај искључен",
    on: "Укључено",
    off: "Искључено",
    mark_read: "Означи позиве као прочитане",
    restart: "Поново покрени рутер",
    restart_confirm: "Поново покренути рутер сада? Интернет, телефонска и ТВ веза биће прекинуте на неколико минута.",
    restart_btn: "Поново покрени",
    cancel: "Откажи",
    wifi_turn_on: "Укључи Вај-фај",
    wifi_turn_off: "Искључи Вај-фај",
    wifi_off_confirm: "Искључити Вај-фај сада? Бежични уређаји ће изгубити везу; уређаји повезани каблом нису погођени.",
    wifi_off_btn: "Искључи",
    calls: "Позиви",
    missed: "пропуштених",
    missed_one: "пропуштен",
    missed_few: "пропуштена",
    temperature: "Темп.",
    used: "искоришћено",
    free: "слободно",
    raid_ok: "У реду",
    raid_degraded: "Деградирано",
    online: "На мрежи",
    offline: "Ван мреже",
    syncing: "Синхронизација",
    line_fault: "Квар линије",
    unavailable: "Недоступно",
    hours: "h",
    days: "d",
    minutes: "min",
    rpm: "о/мин",
    disk: "Диск",
    no_box: "Није пронађен ниједан интернет рутер. Да ли је инсталирана подржана интеграција (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink)?",
    unknown_box: "Интернет рутер није пронађен",
    zoom_in: "Прикажи целу картицу",
    zoom_out: "Назад на компактни приказ",
    box: "Интернет рутер (уређај интеграције)",
    title: "Наслов (опционо, подразумевано је модел рутера)",
    model: "Модел рутера (слика и подразумевани наслов)",
    model_auto: "Аутоматски",
    show_image: "Прикажи слику рутера",
    show_title: "Прикажи наслов",
    show_subtitle: "Прикажи поднаслов",
    admin: "Отвори администраторски интерфејс рутера",
    admin_url: "Администраторска адреса рутера (опционо, отвара се кликом на слику)",
    show_logo: "Прикажи лого оператера",
    show_network: "Прикажи мрежу",
    show_history: "Прикажи историју протока за 24 ч",
    show_system: "Прикажи систем (температуре, вентилатори)",
    show_storage: "Прикажи складиште",
    show_services: "Прикажи услуге (Вај-фај, позиви, уређаји)",
    show_speedtest: "Прикажи последњи тест брзине (Speedtest.net)",
    speedtest: "Тест брзине",
    entities: "Сензори по вашем избору",
    ent_rate_down: "Брзина преузимања рутера",
    ent_rate_up: "Брзина слања рутера",
    ent_download: "Тест брзине: преузимање",
    ent_upload: "Тест брзине: слање",
    ent_ping: "Тест брзине: пинг",
    ent_run: "Тест брзине: дугме за покретање",
    run_speedtest: "Покрени тест брзине",
    speedtest_running: "Тест брзине у току…",
    zoom: "Дугме за детаље",
    zoom_helper: "Дугме у горњем десном углу које пребацује мини картицу на пун приказ и назад",
    rate_unit: "Јединица брзине преноса",
    unit_bytes: "Бајтови (kB/s, MB/s)",
    unit_bits: "Битови (kb/s, Mb/s)",
    language: "Језик",
    lang_auto: "Аутоматски",
    temp_warning: "Праг упозорења температуре (°)",
    temp_critical: "Критични праг температуре (°)",
    disk_warning: "Праг упозорења складишта (% заузето)",
    disk_critical: "Критични праг складишта (% заузето)",
  },
  "sr-Latn": {
    network: "Mreža",
    system: "Sistem",
    storage: "Skladište",
    services: "Usluge",
    download: "Preuzimanje",
    upload: "Slanje",
    line_rate: "Brzina linije",
    uptime: "Vreme rada",
    firmware: "Firmver",
    devices_short: "Uređaji",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi uključen",
    wifi_off: "Wi-Fi isključen",
    on: "Uključeno",
    off: "Isključeno",
    mark_read: "Označi pozive kao pročitane",
    restart: "Ponovo pokreni ruter",
    restart_confirm: "Ponovo pokrenuti ruter sada? Internet, telefonska i TV veza biće prekinute na nekoliko minuta.",
    restart_btn: "Ponovo pokreni",
    cancel: "Otkaži",
    wifi_turn_on: "Uključi Wi-Fi",
    wifi_turn_off: "Isključi Wi-Fi",
    wifi_off_confirm: "Isključiti Wi-Fi sada? Bežični uređaji će izgubiti vezu; uređaji povezani kablom nisu pogođeni.",
    wifi_off_btn: "Isključi",
    calls: "Pozivi",
    missed: "propuštenih",
    missed_one: "propušten",
    missed_few: "propuštena",
    temperature: "Temp.",
    used: "iskorišćeno",
    free: "slobodno",
    raid_ok: "U redu",
    raid_degraded: "Degradirano",
    online: "Na mreži",
    offline: "Van mreže",
    syncing: "Sinhronizacija",
    line_fault: "Kvar linije",
    unavailable: "Nedostupno",
    hours: "h",
    days: "d",
    minutes: "min",
    rpm: "o/min",
    disk: "Disk",
    no_box: "Nije pronađen nijedan internet ruter. Da li je instalirana podržana integracija (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink)?",
    unknown_box: "Internet ruter nije pronađen",
    zoom_in: "Prikaži celu karticu",
    zoom_out: "Nazad na kompaktni prikaz",
    box: "Internet ruter (uređaj integracije)",
    title: "Naslov (opciono, podrazumevano je model rutera)",
    model: "Model rutera (slika i podrazumevani naslov)",
    model_auto: "Automatski",
    show_image: "Prikaži sliku rutera",
    show_title: "Prikaži naslov",
    show_subtitle: "Prikaži podnaslov",
    admin: "Otvori administratorski interfejs rutera",
    admin_url: "Administratorska adresa rutera (opciono, otvara se klikom na sliku)",
    show_logo: "Prikaži logo operatera",
    show_network: "Prikaži mrežu",
    show_history: "Prikaži istoriju protoka za 24 č",
    show_system: "Prikaži sistem (temperature, ventilatori)",
    show_storage: "Prikaži skladište",
    show_services: "Prikaži usluge (Wi-Fi, pozivi, uređaji)",
    show_speedtest: "Prikaži poslednji test brzine (Speedtest.net)",
    speedtest: "Test brzine",
    entities: "Senzori po vašem izboru",
    ent_rate_down: "Brzina preuzimanja rutera",
    ent_rate_up: "Brzina slanja rutera",
    ent_download: "Test brzine: preuzimanje",
    ent_upload: "Test brzine: slanje",
    ent_ping: "Test brzine: ping",
    ent_run: "Test brzine: dugme za pokretanje",
    run_speedtest: "Pokreni test brzine",
    speedtest_running: "Test brzine u toku…",
    zoom: "Dugme za detalje",
    zoom_helper: "Dugme u gornjem desnom uglu koje prebacuje mini karticu na pun prikaz i nazad",
    rate_unit: "Jedinica brzine prenosa",
    unit_bytes: "Bajtovi (kB/s, MB/s)",
    unit_bits: "Bitovi (kb/s, Mb/s)",
    language: "Jezik",
    lang_auto: "Automatski",
    temp_warning: "Prag upozorenja temperature (°C)",
    temp_critical: "Kritični prag temperature (°C)",
    disk_warning: "Prag upozorenja skladišta (% zauzeto)",
    disk_critical: "Kritični prag skladišta (% zauzeto)",
  },
  it: {
    network: "Rete",
    system: "Sistema",
    storage: "Archiviazione",
    services: "Servizi",
    download: "Download",
    upload: "Upload",
    line_rate: "Velocità di linea",
    uptime: "Tempo di attività",
    firmware: "Firmware",
    devices_short: "Dispositivi",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi attivato",
    wifi_off: "Wi-Fi disattivato",
    on: "Attivato",
    off: "Disattivato",
    mark_read: "Segna le chiamate come lette",
    restart: "Riavvia il modem",
    restart_confirm: "Riavviare il modem adesso? La connessione internet, il telefono e la TV saranno interrotti per qualche minuto.",
    restart_btn: "Riavvia",
    cancel: "Annulla",
    wifi_turn_on: "Attiva il Wi-Fi",
    wifi_turn_off: "Disattiva il Wi-Fi",
    wifi_off_confirm: "Disattivare il Wi-Fi adesso? I dispositivi wireless perderanno la connessione; i dispositivi via cavo non sono interessati.",
    wifi_off_btn: "Disattiva",
    calls: "Chiamate",
    missed: "perse",
    missed_one: "persa",
    temperature: "Temp.",
    used: "usato",
    free: "libero",
    raid_ok: "OK",
    raid_degraded: "Degradato",
    online: "Online",
    offline: "Offline",
    syncing: "Sincronizzazione",
    line_fault: "Guasto di linea",
    unavailable: "Non disponibile",
    hours: "h",
    days: "g",
    minutes: "min",
    rpm: "giri/min",
    disk: "Disco",
    no_box: "Nessun modem internet trovato. È installata un'integrazione compatibile (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink)?",
    unknown_box: "Modem internet non trovato",
    zoom_in: "Mostra la scheda completa",
    zoom_out: "Torna alla vista compatta",
    box: "Modem internet (dispositivo dell'integrazione)",
    title: "Titolo (facoltativo, predefinito: modello del modem)",
    model: "Modello del modem (immagine e titolo predefinito)",
    model_auto: "Automatico",
    show_image: "Mostra l'immagine del modem",
    show_title: "Mostra il titolo",
    show_subtitle: "Mostra il sottotitolo",
    admin: "Apri l'interfaccia di amministrazione del modem",
    admin_url: "Indirizzo di amministrazione del modem (facoltativo, aperto al clic sull'immagine)",
    show_logo: "Mostra il logo dell'operatore",
    show_network: "Mostra la rete",
    show_history: "Mostra lo storico 24 h delle velocità",
    show_system: "Mostra il sistema (temperature, ventole)",
    show_storage: "Mostra l'archiviazione",
    show_services: "Mostra i servizi (Wi-Fi, chiamate, dispositivi)",
    show_speedtest: "Mostra l'ultimo test di velocità (Speedtest.net)",
    speedtest: "Test di velocità",
    entities: "Sensori a scelta",
    ent_rate_down: "Velocità di download del router",
    ent_rate_up: "Velocità di upload del router",
    ent_download: "Test di velocità: download",
    ent_upload: "Test di velocità: upload",
    ent_ping: "Test di velocità: ping",
    ent_run: "Test di velocità: pulsante per avviarlo",
    run_speedtest: "Avvia un test di velocità",
    speedtest_running: "Test di velocità in corso…",
    zoom: "Pulsante dettagli",
    zoom_helper: "Pulsante in alto a destra che mostra la scheda completa al posto della mini scheda, e viceversa",
    rate_unit: "Unità di velocità",
    unit_bytes: "Byte (kB/s, MB/s)",
    unit_bits: "Bit (kb/s, Mb/s)",
    language: "Lingua",
    lang_auto: "Automatica",
    temp_warning: "Soglia di avviso temperatura (°C)",
    temp_critical: "Soglia critica temperatura (°C)",
    disk_warning: "Soglia di avviso archiviazione (% usato)",
    disk_critical: "Soglia critica archiviazione (% usato)",
  },
  nl: {
    network: "Netwerk",
    system: "Systeem",
    storage: "Opslag",
    services: "Diensten",
    download: "Download",
    upload: "Upload",
    line_rate: "Lijnsnelheid",
    uptime: "Uptime",
    firmware: "Firmware",
    devices_short: "Apparaten",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi aan",
    wifi_off: "Wi-Fi uit",
    on: "Aan",
    off: "Uit",
    mark_read: "Oproepen als gelezen markeren",
    restart: "Modem herstarten",
    restart_confirm: "Modem nu herstarten? De internet-, telefoon- en tv-verbinding wordt een paar minuten onderbroken.",
    restart_btn: "Herstarten",
    cancel: "Annuleren",
    wifi_turn_on: "Wi-Fi inschakelen",
    wifi_turn_off: "Wi-Fi uitschakelen",
    wifi_off_confirm: "Wi-Fi nu uitschakelen? Draadloze apparaten verliezen hun verbinding; bekabelde apparaten blijven verbonden.",
    wifi_off_btn: "Uitschakelen",
    calls: "Oproepen",
    missed: "gemist",
    temperature: "Temp.",
    used: "gebruikt",
    free: "vrij",
    raid_ok: "OK",
    raid_degraded: "Gedegradeerd",
    online: "Online",
    offline: "Offline",
    syncing: "Synchroniseren",
    line_fault: "Lijnstoring",
    unavailable: "Niet beschikbaar",
    hours: "u",
    days: "d",
    minutes: "min",
    rpm: "tpm",
    disk: "Schijf",
    no_box: "Geen internetmodem gevonden. Is er een ondersteunde integratie (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink) geïnstalleerd?",
    unknown_box: "Internetmodem niet gevonden",
    zoom_in: "Volledige kaart tonen",
    zoom_out: "Terug naar de compacte weergave",
    box: "Internetmodem (apparaat van de integratie)",
    title: "Titel (optioneel, standaard het model van de modem)",
    model: "Model van de modem (afbeelding en standaardtitel)",
    model_auto: "Automatisch",
    show_image: "Afbeelding van de modem tonen",
    show_title: "Titel tonen",
    show_subtitle: "Ondertitel tonen",
    admin: "Beheerinterface van de modem openen",
    admin_url: "Beheeradres van de modem (optioneel, geopend bij klikken op de afbeelding)",
    show_logo: "Logo van de provider tonen",
    show_network: "Netwerk tonen",
    show_history: "24-uursgeschiedenis van de snelheden weergeven",
    show_system: "Systeem tonen (temperaturen, ventilatoren)",
    show_storage: "Opslag tonen",
    show_services: "Diensten tonen (Wi-Fi, oproepen, apparaten)",
    show_speedtest: "Laatste snelheidstest tonen (Speedtest.net)",
    speedtest: "Snelheidstest",
    entities: "Sensoren naar keuze",
    ent_rate_down: "Downloadsnelheid van de router",
    ent_rate_up: "Uploadsnelheid van de router",
    ent_download: "Snelheidstest: download",
    ent_upload: "Snelheidstest: upload",
    ent_ping: "Snelheidstest: ping",
    ent_run: "Snelheidstest: knop om hem te starten",
    run_speedtest: "Snelheidstest starten",
    speedtest_running: "Snelheidstest bezig…",
    zoom: "Detailknop",
    zoom_helper: "Knop rechtsboven die de volledige kaart toont in plaats van de minikaart, en terug",
    rate_unit: "Eenheid van snelheid",
    unit_bytes: "Bytes (kB/s, MB/s)",
    unit_bits: "Bits (kb/s, Mb/s)",
    language: "Taal",
    lang_auto: "Automatisch",
    temp_warning: "Waarschuwingsdrempel temperatuur (°C)",
    temp_critical: "Kritieke drempel temperatuur (°C)",
    disk_warning: "Waarschuwingsdrempel opslag (% gebruikt)",
    disk_critical: "Kritieke drempel opslag (% gebruikt)",
  },
  pt: {
    network: "Rede",
    system: "Sistema",
    storage: "Armazenamento",
    services: "Serviços",
    download: "Transferência",
    upload: "Envio",
    line_rate: "Velocidade da linha",
    uptime: "Tempo ligado",
    firmware: "Firmware",
    devices_short: "Dispositivos",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi ligado",
    wifi_off: "Wi-Fi desligado",
    on: "Ligado",
    off: "Desligado",
    mark_read: "Marcar as chamadas como lidas",
    restart: "Reiniciar o router",
    restart_confirm: "Reiniciar o router agora? A ligação à internet, ao telefone e à TV será interrompida durante alguns minutos.",
    restart_btn: "Reiniciar",
    cancel: "Cancelar",
    wifi_turn_on: "Ligar o Wi-Fi",
    wifi_turn_off: "Desligar o Wi-Fi",
    wifi_off_confirm: "Desligar o Wi-Fi agora? Os dispositivos sem fios perderão a ligação; os dispositivos com cabo não são afetados.",
    wifi_off_btn: "Desligar",
    calls: "Chamadas",
    missed: "perdidas",
    missed_one: "perdida",
    temperature: "Temp.",
    used: "usado",
    free: "livre",
    raid_ok: "OK",
    raid_degraded: "Degradado",
    online: "Online",
    offline: "Offline",
    syncing: "A sincronizar",
    line_fault: "Falha de linha",
    unavailable: "Indisponível",
    hours: "h",
    days: "d",
    minutes: "min",
    rpm: "rpm",
    disk: "Disco",
    no_box: "Nenhum router de internet encontrado. Está instalada uma integração compatível (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink)?",
    unknown_box: "Router de internet não encontrado",
    zoom_in: "Mostrar o cartão completo",
    zoom_out: "Voltar à vista compacta",
    box: "Router de internet (dispositivo da integração)",
    title: "Título (opcional, por predefinição o modelo do router)",
    model: "Modelo do router (imagem e título predefinido)",
    model_auto: "Automático",
    show_image: "Mostrar a imagem do router",
    show_title: "Mostrar o título",
    show_subtitle: "Mostrar o subtítulo",
    admin: "Abrir a interface de administração do router",
    admin_url: "Endereço de administração do router (opcional, aberto ao clicar na imagem)",
    show_logo: "Mostrar o logótipo do operador",
    show_network: "Mostrar a rede",
    show_history: "Mostrar o histórico de 24 h dos débitos",
    show_system: "Mostrar o sistema (temperaturas, ventoinhas)",
    show_storage: "Mostrar o armazenamento",
    show_services: "Mostrar os serviços (Wi-Fi, chamadas, dispositivos)",
    show_speedtest: "Mostrar o último teste de velocidade (Speedtest.net)",
    speedtest: "Teste de velocidade",
    entities: "Sensores à sua escolha",
    ent_rate_down: "Velocidade de download do router",
    ent_rate_up: "Velocidade de upload do router",
    ent_download: "Teste de velocidade: download",
    ent_upload: "Teste de velocidade: upload",
    ent_ping: "Teste de velocidade: ping",
    ent_run: "Teste de velocidade: botão para o iniciar",
    run_speedtest: "Iniciar um teste de velocidade",
    speedtest_running: "Teste de velocidade em curso…",
    zoom: "Botão de detalhe",
    zoom_helper: "Botão no canto superior direito que mostra o cartão completo em vez do minicartão, e vice-versa",
    rate_unit: "Unidade de velocidade",
    unit_bytes: "Bytes (kB/s, MB/s)",
    unit_bits: "Bits (kb/s, Mb/s)",
    language: "Idioma",
    lang_auto: "Automático",
    temp_warning: "Limiar de aviso de temperatura (°C)",
    temp_critical: "Limiar crítico de temperatura (°C)",
    disk_warning: "Limiar de aviso de armazenamento (% usado)",
    disk_critical: "Limiar crítico de armazenamento (% usado)",
  },
  pl: {
    network: "Sieć",
    system: "System",
    storage: "Pamięć masowa",
    services: "Usługi",
    download: "Pobieranie",
    upload: "Wysyłanie",
    line_rate: "Prędkość linii",
    uptime: "Czas pracy",
    firmware: "Firmware",
    devices_short: "Urządzenia",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi włączone",
    wifi_off: "Wi-Fi wyłączone",
    on: "Włączone",
    off: "Wyłączone",
    mark_read: "Oznacz połączenia jako odczytane",
    restart: "Uruchom ponownie router",
    restart_confirm: "Uruchomić teraz ponownie router? Połączenie z internetem, telefon i telewizja zostaną przerwane na kilka minut.",
    restart_btn: "Uruchom ponownie",
    cancel: "Anuluj",
    wifi_turn_on: "Włącz Wi-Fi",
    wifi_turn_off: "Wyłącz Wi-Fi",
    wifi_off_confirm: "Wyłączyć teraz Wi-Fi? Urządzenia bezprzewodowe stracą połączenie; urządzenia przewodowe nie zostaną odłączone.",
    wifi_off_btn: "Wyłącz",
    calls: "Połączenia",
    missed: "nieodebrane",
    missed_one: "nieodebrane",
    missed_few: "nieodebrane",
    missed_many: "nieodebranych",
    temperature: "Temp.",
    used: "zajęte",
    free: "wolne",
    raid_ok: "OK",
    raid_degraded: "Zdegradowany",
    online: "Online",
    offline: "Offline",
    syncing: "Synchronizacja",
    line_fault: "Awaria linii",
    unavailable: "Niedostępne",
    hours: "h",
    days: "d",
    minutes: "min",
    rpm: "obr./min",
    disk: "Dysk",
    no_box: "Nie znaleziono routera internetowego. Czy zainstalowano obsługiwaną integrację (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink)?",
    unknown_box: "Nie znaleziono routera internetowego",
    zoom_in: "Pokaż pełną kartę",
    zoom_out: "Wróć do widoku kompaktowego",
    box: "Router internetowy (urządzenie integracji)",
    title: "Tytuł (opcjonalny, domyślnie model routera)",
    model: "Model routera (obraz i domyślny tytuł)",
    model_auto: "Automatycznie",
    show_image: "Pokaż obraz routera",
    show_title: "Pokaż tytuł",
    show_subtitle: "Pokaż podtytuł",
    admin: "Otwórz interfejs administracyjny routera",
    admin_url: "Adres panelu administracyjnego routera (opcjonalny, otwierany po kliknięciu obrazu)",
    show_logo: "Pokaż logo operatora",
    show_network: "Pokaż sieć",
    show_history: "Pokaż historię przepustowości z 24 h",
    show_system: "Pokaż system (temperatury, wentylatory)",
    show_storage: "Pokaż pamięć masową",
    show_services: "Pokaż usługi (Wi-Fi, połączenia, urządzenia)",
    show_speedtest: "Pokaż ostatni test prędkości (Speedtest.net)",
    speedtest: "Test prędkości",
    entities: "Wybrane czujniki",
    ent_rate_down: "Prędkość pobierania routera",
    ent_rate_up: "Prędkość wysyłania routera",
    ent_download: "Test prędkości: pobieranie",
    ent_upload: "Test prędkości: wysyłanie",
    ent_ping: "Test prędkości: ping",
    ent_run: "Test prędkości: przycisk do uruchomienia",
    run_speedtest: "Uruchom test prędkości",
    speedtest_running: "Trwa test prędkości…",
    zoom: "Przycisk szczegółów",
    zoom_helper: "Przycisk w prawym górnym rogu, który pokazuje pełną kartę zamiast minikarty, i z powrotem",
    rate_unit: "Jednostka prędkości",
    unit_bytes: "Bajty (kB/s, MB/s)",
    unit_bits: "Bity (kb/s, Mb/s)",
    language: "Język",
    lang_auto: "Automatycznie",
    temp_warning: "Próg ostrzeżenia temperatury (°C)",
    temp_critical: "Próg krytyczny temperatury (°C)",
    disk_warning: "Próg ostrzeżenia pamięci (% zajęte)",
    disk_critical: "Próg krytyczny pamięci (% zajęte)",
  },
  ro: {
    network: "Rețea",
    system: "Sistem",
    storage: "Stocare",
    services: "Servicii",
    download: "Descărcare",
    upload: "Încărcare",
    line_rate: "Viteză linie",
    uptime: "Funcționează de",
    firmware: "Firmware",
    devices_short: "Dispozitive",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi pornit",
    wifi_off: "Wi-Fi oprit",
    on: "Pornit",
    off: "Oprit",
    mark_read: "Marchează apelurile ca citite",
    restart: "Repornește routerul",
    restart_confirm: "Reporniți routerul acum? Conexiunea la internet, telefonul și televiziunea vor fi întrerupte câteva minute.",
    restart_btn: "Repornește",
    cancel: "Anulează",
    wifi_turn_on: "Pornește Wi-Fi",
    wifi_turn_off: "Oprește Wi-Fi",
    wifi_off_confirm: "Opriți Wi-Fi acum? Dispozitivele wireless își vor pierde conexiunea; dispozitivele conectate prin cablu nu sunt afectate.",
    wifi_off_btn: "Oprește",
    calls: "Apeluri",
    missed: "pierdute",
    missed_one: "pierdut",
    temperature: "Temp.",
    used: "utilizat",
    free: "liber",
    raid_ok: "OK",
    raid_degraded: "Degradat",
    online: "Online",
    offline: "Offline",
    syncing: "Sincronizare",
    line_fault: "Defect de linie",
    unavailable: "Indisponibil",
    hours: "h",
    days: "z",
    minutes: "min",
    rpm: "rot/min",
    disk: "Disc",
    no_box: "Nu a fost găsit niciun router de internet. Este instalată o integrare compatibilă (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink)?",
    unknown_box: "Routerul de internet nu a fost găsit",
    zoom_in: "Afișează cardul complet",
    zoom_out: "Înapoi la vizualizarea compactă",
    box: "Router de internet (dispozitivul integrării)",
    title: "Titlu (opțional, implicit modelul routerului)",
    model: "Modelul routerului (imagine și titlu implicit)",
    model_auto: "Automat",
    show_image: "Afișează imaginea routerului",
    show_title: "Afișează titlul",
    show_subtitle: "Afișează subtitlul",
    admin: "Deschide interfața de administrare a routerului",
    admin_url: "Adresa de administrare a routerului (opțional, se deschide la clic pe imagine)",
    show_logo: "Afișează sigla operatorului",
    show_network: "Afișează rețeaua",
    show_history: "Afișează istoricul vitezelor pe 24 h",
    show_system: "Afișează sistemul (temperaturi, ventilatoare)",
    show_storage: "Afișează stocarea",
    show_services: "Afișează serviciile (Wi-Fi, apeluri, dispozitive)",
    show_speedtest: "Afișează ultimul test de viteză (Speedtest.net)",
    speedtest: "Test de viteză",
    entities: "Senzori la alegere",
    ent_rate_down: "Viteza de descărcare a routerului",
    ent_rate_up: "Viteza de încărcare a routerului",
    ent_download: "Test de viteză: descărcare",
    ent_upload: "Test de viteză: încărcare",
    ent_ping: "Test de viteză: ping",
    ent_run: "Test de viteză: buton pentru pornire",
    run_speedtest: "Pornește un test de viteză",
    speedtest_running: "Test de viteză în curs…",
    zoom: "Buton de detalii",
    zoom_helper: "Buton din dreapta sus care afișează cardul complet în locul minicardului, și invers",
    rate_unit: "Unitatea vitezei de transfer",
    unit_bytes: "Octeți (kB/s, MB/s)",
    unit_bits: "Biți (kb/s, Mb/s)",
    language: "Limbă",
    lang_auto: "Automată",
    temp_warning: "Prag de avertizare temperatură (°C)",
    temp_critical: "Prag critic temperatură (°C)",
    disk_warning: "Prag de avertizare stocare (% utilizat)",
    disk_critical: "Prag critic stocare (% utilizat)",
  },
  da: {
    network: "Netværk",
    system: "System",
    storage: "Lager",
    services: "Tjenester",
    download: "Download",
    upload: "Upload",
    line_rate: "Linjehastighed",
    uptime: "Oppetid",
    firmware: "Firmware",
    devices_short: "Enheder",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi til",
    wifi_off: "Wi-Fi fra",
    on: "Til",
    off: "Fra",
    mark_read: "Markér opkald som læst",
    restart: "Genstart routeren",
    restart_confirm: "Vil du genstarte routeren nu? Internet-, telefon- og tv-forbindelsen afbrydes i et par minutter.",
    restart_btn: "Genstart",
    cancel: "Annuller",
    wifi_turn_on: "Slå Wi-Fi til",
    wifi_turn_off: "Slå Wi-Fi fra",
    wifi_off_confirm: "Vil du slå Wi-Fi fra nu? Trådløse enheder mister forbindelsen; enheder med kabel påvirkes ikke.",
    wifi_off_btn: "Slå fra",
    calls: "Opkald",
    missed: "ubesvarede",
    missed_one: "ubesvaret",
    temperature: "Temp.",
    used: "brugt",
    free: "ledig",
    raid_ok: "OK",
    raid_degraded: "Forringet",
    online: "Online",
    offline: "Offline",
    syncing: "Synkroniserer",
    line_fault: "Linjefejl",
    unavailable: "Utilgængelig",
    hours: "t",
    days: "d",
    minutes: "min",
    rpm: "o/min",
    disk: "Disk",
    no_box: "Der blev ikke fundet nogen internetrouter. Er en understøttet integration (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink) installeret?",
    unknown_box: "Internetrouteren blev ikke fundet",
    zoom_in: "Vis hele kortet",
    zoom_out: "Tilbage til kompakt visning",
    box: "Internetrouter (integrationens enhed)",
    title: "Titel (valgfri, som standard routerens model)",
    model: "Routermodel (billede og standardtitel)",
    model_auto: "Automatisk",
    show_image: "Vis billede af routeren",
    show_title: "Vis titel",
    show_subtitle: "Vis undertitel",
    admin: "Åbn routerens administrationsside",
    admin_url: "Routerens administrationsadresse (valgfri, åbnes ved klik på billedet)",
    show_logo: "Vis operatørens logo",
    show_network: "Vis netværk",
    show_history: "Vis 24-timers historik for hastigheder",
    show_system: "Vis system (temperaturer, blæsere)",
    show_storage: "Vis lager",
    show_services: "Vis tjenester (Wi-Fi, opkald, enheder)",
    show_speedtest: "Vis den seneste hastighedstest (Speedtest.net)",
    speedtest: "Hastighedstest",
    entities: "Sensorer efter eget valg",
    ent_rate_down: "Routerens downloadhastighed",
    ent_rate_up: "Routerens uploadhastighed",
    ent_download: "Hastighedstest: download",
    ent_upload: "Hastighedstest: upload",
    ent_ping: "Hastighedstest: ping",
    ent_run: "Hastighedstest: knap til at starte den",
    run_speedtest: "Start en hastighedstest",
    speedtest_running: "Hastighedstest kører…",
    zoom: "Detaljeknap",
    zoom_helper: "Knap øverst til højre, der viser hele kortet i stedet for minikortet og tilbage igen",
    rate_unit: "Enhed for hastighed",
    unit_bytes: "Bytes (kB/s, MB/s)",
    unit_bits: "Bits (kb/s, Mb/s)",
    language: "Sprog",
    lang_auto: "Automatisk",
    temp_warning: "Advarselsgrænse for temperatur (°C)",
    temp_critical: "Kritisk grænse for temperatur (°C)",
    disk_warning: "Advarselsgrænse for lager (% brugt)",
    disk_critical: "Kritisk grænse for lager (% brugt)",
  },
  sv: {
    network: "Nätverk",
    system: "System",
    storage: "Lagring",
    services: "Tjänster",
    download: "Nedladdning",
    upload: "Uppladdning",
    line_rate: "Linjehastighet",
    uptime: "Drifttid",
    firmware: "Firmware",
    devices_short: "Enheter",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi på",
    wifi_off: "Wi-Fi av",
    on: "På",
    off: "Av",
    mark_read: "Markera samtal som lästa",
    restart: "Starta om routern",
    restart_confirm: "Vill du starta om routern nu? Internet-, telefon- och tv-anslutningen bryts i några minuter.",
    restart_btn: "Starta om",
    cancel: "Avbryt",
    wifi_turn_on: "Slå på Wi-Fi",
    wifi_turn_off: "Stäng av Wi-Fi",
    wifi_off_confirm: "Vill du stänga av Wi-Fi nu? Trådlösa enheter tappar anslutningen; enheter med kabel påverkas inte.",
    wifi_off_btn: "Stäng av",
    calls: "Samtal",
    missed: "missade",
    missed_one: "missat",
    temperature: "Temp.",
    used: "använt",
    free: "ledigt",
    raid_ok: "OK",
    raid_degraded: "Försämrad",
    online: "Online",
    offline: "Offline",
    syncing: "Synkroniserar",
    line_fault: "Linjefel",
    unavailable: "Ej tillgänglig",
    hours: "h",
    days: "d",
    minutes: "min",
    rpm: "v/min",
    disk: "Disk",
    no_box: "Ingen internetrouter hittades. Är en integration som stöds (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink) installerad?",
    unknown_box: "Internetroutern hittades inte",
    zoom_in: "Visa hela kortet",
    zoom_out: "Tillbaka till kompakt vy",
    box: "Internetrouter (integrationens enhet)",
    title: "Titel (valfri, routerns modell som standard)",
    model: "Routermodell (bild och standardtitel)",
    model_auto: "Automatisk",
    show_image: "Visa bild på routern",
    show_title: "Visa rubrik",
    show_subtitle: "Visa underrubrik",
    admin: "Öppna routerns administrationsgränssnitt",
    admin_url: "Routerns administrationsadress (valfri, öppnas vid klick på bilden)",
    show_logo: "Visa operatörens logotyp",
    show_network: "Visa nätverk",
    show_history: "Visa 24 h-historik för hastigheter",
    show_system: "Visa system (temperaturer, fläktar)",
    show_storage: "Visa lagring",
    show_services: "Visa tjänster (Wi-Fi, samtal, enheter)",
    show_speedtest: "Visa det senaste hastighetstestet (Speedtest.net)",
    speedtest: "Hastighetstest",
    entities: "Valfria sensorer",
    ent_rate_down: "Routerns nedladdningshastighet",
    ent_rate_up: "Routerns uppladdningshastighet",
    ent_download: "Hastighetstest: nedladdning",
    ent_upload: "Hastighetstest: uppladdning",
    ent_ping: "Hastighetstest: ping",
    ent_run: "Hastighetstest: knapp för att starta det",
    run_speedtest: "Starta ett hastighetstest",
    speedtest_running: "Hastighetstest pågår…",
    zoom: "Detaljknapp",
    zoom_helper: "Knapp uppe till höger som visar hela kortet i stället för minikortet, och tillbaka",
    rate_unit: "Enhet för hastighet",
    unit_bytes: "Byte (kB/s, MB/s)",
    unit_bits: "Bitar (kb/s, Mb/s)",
    language: "Språk",
    lang_auto: "Automatiskt",
    temp_warning: "Varningsgräns för temperatur (°C)",
    temp_critical: "Kritisk gräns för temperatur (°C)",
    disk_warning: "Varningsgräns för lagring (% använt)",
    disk_critical: "Kritisk gräns för lagring (% använt)",
  },
  bg: {
    network: "Мрежа",
    system: "Система",
    storage: "Хранилище",
    services: "Услуги",
    download: "Изтегляне",
    upload: "Качване",
    line_rate: "Скорост на линията",
    uptime: "Време на работа",
    firmware: "Фърмуер",
    devices_short: "Устройства",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi включен",
    wifi_off: "Wi-Fi изключен",
    on: "Включено",
    off: "Изключено",
    mark_read: "Маркиране на обажданията като прочетени",
    restart: "Рестартиране на рутера",
    restart_confirm: "Да се рестартира ли рутерът сега? Връзката с интернет, телефонът и телевизията ще бъдат прекъснати за няколко минути.",
    restart_btn: "Рестартиране",
    cancel: "Отказ",
    wifi_turn_on: "Включване на Wi-Fi",
    wifi_turn_off: "Изключване на Wi-Fi",
    wifi_off_confirm: "Да се изключи ли Wi-Fi сега? Безжичните устройства ще загубят връзката си; устройствата с кабел не са засегнати.",
    wifi_off_btn: "Изключване",
    calls: "Разговори",
    missed: "пропуснати",
    missed_one: "пропуснато",
    temperature: "Темп.",
    used: "заето",
    free: "свободно",
    raid_ok: "Наред",
    raid_degraded: "Влошен",
    online: "На линия",
    offline: "Извън линия",
    syncing: "Синхронизиране",
    line_fault: "Повреда на линията",
    unavailable: "Недостъпно",
    hours: "ч",
    days: "д",
    minutes: "мин",
    rpm: "об/мин",
    disk: "Диск",
    no_box: "Не е намерен интернет рутер. Инсталирана ли е поддържана интеграция (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink)?",
    unknown_box: "Интернет рутерът не е намерен",
    zoom_in: "Показване на пълната карта",
    zoom_out: "Обратно към компактния изглед",
    box: "Интернет рутер (устройство на интеграцията)",
    title: "Заглавие (по избор, по подразбиране моделът на рутера)",
    model: "Модел на рутера (изображение и заглавие по подразбиране)",
    model_auto: "Автоматично",
    show_image: "Показване на изображение на рутера",
    show_title: "Показване на заглавието",
    show_subtitle: "Показване на подзаглавието",
    admin: "Отваряне на администраторския интерфейс на рутера",
    admin_url: "Администраторски адрес на рутера (по избор, отваря се при щракване върху изображението)",
    show_logo: "Показване на логото на оператора",
    show_network: "Показване на мрежата",
    show_history: "Показване на 24-часовата история на скоростите",
    show_system: "Показване на системата (температури, вентилатори)",
    show_storage: "Показване на хранилището",
    show_services: "Показване на услугите (Wi-Fi, обаждания, устройства)",
    show_speedtest: "Показване на последния тест на скоростта (Speedtest.net)",
    speedtest: "Тест на скоростта",
    entities: "Сензори по ваш избор",
    ent_rate_down: "Скорост на изтегляне на рутера",
    ent_rate_up: "Скорост на качване на рутера",
    ent_download: "Тест на скоростта: изтегляне",
    ent_upload: "Тест на скоростта: качване",
    ent_ping: "Тест на скоростта: пинг",
    ent_run: "Тест на скоростта: бутон за стартиране",
    run_speedtest: "Стартиране на тест на скоростта",
    speedtest_running: "Тестът на скоростта тече…",
    zoom: "Бутон за подробности",
    zoom_helper: "Бутон горе вдясно, който показва пълната карта вместо мини картата и обратно",
    rate_unit: "Мерна единица за скорост",
    unit_bytes: "Байтове (kB/s, MB/s)",
    unit_bits: "Битове (kb/s, Mb/s)",
    language: "Език",
    lang_auto: "Автоматично",
    temp_warning: "Праг за предупреждение за температура (°C)",
    temp_critical: "Критичен праг за температура (°C)",
    disk_warning: "Праг за предупреждение за хранилище (% заето)",
    disk_critical: "Критичен праг за хранилище (% заето)",
  },
  ru: {
    network: "Сеть",
    system: "Система",
    storage: "Хранилище",
    services: "Сервисы",
    download: "Приём",
    upload: "Передача",
    line_rate: "Скорость линии",
    uptime: "Время работы",
    firmware: "Прошивка",
    devices_short: "Устройства",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi включён",
    wifi_off: "Wi-Fi выключен",
    on: "Включено",
    off: "Выключено",
    mark_read: "Отметить звонки как просмотренные",
    restart: "Перезагрузить роутер",
    restart_confirm: "Перезагрузить роутер сейчас? Интернет, телефон и ТВ будут недоступны несколько минут.",
    restart_btn: "Перезагрузить",
    cancel: "Отмена",
    wifi_turn_on: "Включить Wi-Fi",
    wifi_turn_off: "Выключить Wi-Fi",
    wifi_off_confirm: "Выключить Wi-Fi сейчас? Беспроводные устройства потеряют соединение; устройства, подключённые кабелем, не затронуты.",
    wifi_off_btn: "Выключить",
    calls: "Звонки",
    missed: "непринятых",
    missed_one: "непринятый",
    temperature: "Темп.",
    used: "занято",
    free: "свободно",
    raid_ok: "Норма",
    raid_degraded: "Деградирован",
    online: "В сети",
    offline: "Не в сети",
    syncing: "Синхронизация",
    line_fault: "Неисправность линии",
    unavailable: "Недоступно",
    hours: "ч",
    days: "д",
    minutes: "мин",
    rpm: "об/мин",
    disk: "Диск",
    no_box: "Интернет-роутер не найден. Установлена ли поддерживаемая интеграция (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink)?",
    unknown_box: "Интернет-роутер не найден",
    zoom_in: "Показать полную карточку",
    zoom_out: "Вернуться к компактному виду",
    box: "Интернет-роутер (устройство интеграции)",
    title: "Заголовок (необязательно, по умолчанию модель роутера)",
    model: "Модель роутера (изображение и заголовок по умолчанию)",
    model_auto: "Автоматически",
    show_image: "Показывать изображение роутера",
    show_title: "Показывать заголовок",
    show_subtitle: "Показывать подзаголовок",
    admin: "Открыть веб-интерфейс роутера",
    admin_url: "Адрес веб-интерфейса роутера (необязательно, открывается по нажатию на изображение)",
    show_logo: "Показывать логотип оператора",
    show_network: "Показывать сеть",
    show_history: "Показать историю скоростей за 24 ч",
    show_system: "Показывать систему (температуры, вентиляторы)",
    show_storage: "Показывать хранилище",
    show_services: "Показывать сервисы (Wi-Fi, звонки, устройства)",
    show_speedtest: "Показывать последний тест скорости (Speedtest.net)",
    speedtest: "Тест скорости",
    entities: "Датчики на выбор",
    ent_rate_down: "Скорость загрузки роутера",
    ent_rate_up: "Скорость отдачи роутера",
    ent_download: "Тест скорости: загрузка",
    ent_upload: "Тест скорости: отдача",
    ent_ping: "Тест скорости: пинг",
    ent_run: "Тест скорости: кнопка запуска",
    run_speedtest: "Запустить тест скорости",
    speedtest_running: "Идёт тест скорости…",
    zoom: "Кнопка подробностей",
    zoom_helper: "Кнопка в правом верхнем углу, которая показывает полную карточку вместо мини-карточки и обратно",
    rate_unit: "Единица скорости",
    unit_bytes: "Байты (kB/s, MB/s)",
    unit_bits: "Биты (kb/s, Mb/s)",
    language: "Язык",
    lang_auto: "Автоматически",
    temp_warning: "Порог предупреждения температуры (°C)",
    temp_critical: "Критический порог температуры (°C)",
    disk_warning: "Порог предупреждения хранилища (% занято)",
    disk_critical: "Критический порог хранилища (% занято)",
  },
  uk: {
    network: "Мережа",
    system: "Система",
    storage: "Сховище",
    services: "Сервіси",
    download: "Прийом",
    upload: "Передача",
    line_rate: "Швидкість лінії",
    uptime: "Час роботи",
    firmware: "Прошивка",
    devices_short: "Пристрої",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi увімкнено",
    wifi_off: "Wi-Fi вимкнено",
    on: "Увімкнено",
    off: "Вимкнено",
    mark_read: "Позначити дзвінки як переглянуті",
    restart: "Перезапустити роутер",
    restart_confirm: "Перезапустити роутер зараз? Інтернет, телефон і ТБ будуть недоступні кілька хвилин.",
    restart_btn: "Перезапуск",
    cancel: "Скасувати",
    wifi_turn_on: "Увімкнути Wi-Fi",
    wifi_turn_off: "Вимкнути Wi-Fi",
    wifi_off_confirm: "Вимкнути Wi-Fi зараз? Бездротові пристрої втратять з'єднання; пристрої, під'єднані кабелем, не постраждають.",
    wifi_off_btn: "Вимкнути",
    calls: "Дзвінки",
    missed: "пропущених",
    missed_one: "пропущений",
    missed_few: "пропущені",
    temperature: "Темп.",
    used: "зайнято",
    free: "вільно",
    raid_ok: "Норма",
    raid_degraded: "Деградований",
    online: "У мережі",
    offline: "Не в мережі",
    syncing: "Синхронізація",
    line_fault: "Несправність лінії",
    unavailable: "Недоступно",
    hours: "год",
    days: "дн",
    minutes: "хв",
    rpm: "об/хв",
    disk: "Диск",
    no_box: "Інтернет-роутер не знайдено. Чи встановлено підтримувану інтеграцію (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink)?",
    unknown_box: "Інтернет-роутер не знайдено",
    zoom_in: "Показати повну картку",
    zoom_out: "Повернутися до компактного вигляду",
    box: "Інтернет-роутер (пристрій інтеграції)",
    title: "Заголовок (необов’язково, типово модель роутера)",
    model: "Модель роутера (зображення і типовий заголовок)",
    model_auto: "Автоматично",
    show_image: "Показувати зображення роутера",
    show_title: "Показувати заголовок",
    show_subtitle: "Показувати підзаголовок",
    admin: "Відкрити вебінтерфейс роутера",
    admin_url: "Адреса вебінтерфейсу роутера (необов’язково, відкривається натисканням на зображення)",
    show_logo: "Показувати логотип оператора",
    show_network: "Показувати мережу",
    show_history: "Показати історію швидкостей за 24 год",
    show_system: "Показувати систему (температури, вентилятори)",
    show_storage: "Показувати сховище",
    show_services: "Показувати сервіси (Wi-Fi, дзвінки, пристрої)",
    show_speedtest: "Показувати останній тест швидкості (Speedtest.net)",
    speedtest: "Тест швидкості",
    entities: "Датчики на вибір",
    ent_rate_down: "Швидкість завантаження роутера",
    ent_rate_up: "Швидкість віддачі роутера",
    ent_download: "Тест швидкості: завантаження",
    ent_upload: "Тест швидкості: віддача",
    ent_ping: "Тест швидкості: пінг",
    ent_run: "Тест швидкості: кнопка запуску",
    run_speedtest: "Запустити тест швидкості",
    speedtest_running: "Триває тест швидкості…",
    zoom: "Кнопка подробиць",
    zoom_helper: "Кнопка у правому верхньому куті, яка показує повну картку замість мінікартки, і навпаки",
    rate_unit: "Одиниця швидкості",
    unit_bytes: "Байти (kB/s, MB/s)",
    unit_bits: "Біти (kb/s, Mb/s)",
    language: "Мова",
    lang_auto: "Автоматично",
    temp_warning: "Поріг попередження температури (°C)",
    temp_critical: "Критичний поріг температури (°C)",
    disk_warning: "Поріг попередження сховища (% зайнято)",
    disk_critical: "Критичний поріг сховища (% зайнято)",
  },
  hu: {
    network: "Hálózat",
    system: "Rendszer",
    storage: "Tárhely",
    services: "Szolgáltatások",
    download: "Letöltés",
    upload: "Feltöltés",
    line_rate: "Vonalsebesség",
    uptime: "Üzemidő",
    firmware: "Firmware",
    devices_short: "Eszközök",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi bekapcsolva",
    wifi_off: "Wi-Fi kikapcsolva",
    on: "Be",
    off: "Ki",
    mark_read: "Hívások megjelölése olvasottként",
    restart: "Router újraindítása",
    restart_confirm: "Újraindítja most a routert? Az internet-, telefon- és tévékapcsolat néhány percre megszakad.",
    restart_btn: "Újraindítás",
    cancel: "Mégse",
    wifi_turn_on: "Wi-Fi bekapcsolása",
    wifi_turn_off: "Wi-Fi kikapcsolása",
    wifi_off_confirm: "Kikapcsolja most a Wi-Fit? A vezeték nélküli eszközök elveszítik a kapcsolatot; a vezetékes eszközöket ez nem érinti.",
    wifi_off_btn: "Kikapcsolás",
    calls: "Hívások",
    missed: "nem fogadott",
    temperature: "Hőm.",
    used: "foglalt",
    free: "szabad",
    raid_ok: "OK",
    raid_degraded: "Leromlott",
    online: "Online",
    offline: "Offline",
    syncing: "Szinkronizálás",
    line_fault: "Vonalhiba",
    unavailable: "Nem elérhető",
    hours: "ó",
    days: "n",
    minutes: "p",
    rpm: "f/perc",
    disk: "Lemez",
    no_box: "Nem található internetes router. Telepítve van egy támogatott integráció (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink)?",
    unknown_box: "Az internetes router nem található",
    zoom_in: "Teljes kártya megjelenítése",
    zoom_out: "Vissza a kompakt nézethez",
    box: "Internetes router (az integráció eszköze)",
    title: "Cím (nem kötelező, alapértelmezés szerint a router típusa)",
    model: "Router típusa (kép és alapértelmezett cím)",
    model_auto: "Automatikus",
    show_image: "A router képének megjelenítése",
    show_title: "Cím megjelenítése",
    show_subtitle: "Alcím megjelenítése",
    admin: "A router felügyeleti felületének megnyitása",
    admin_url: "A router felügyeleti címe (nem kötelező, a képre kattintva nyílik meg)",
    show_logo: "A szolgáltató logójának megjelenítése",
    show_network: "Hálózat megjelenítése",
    show_history: "Sebességek 24 órás előzményeinek megjelenítése",
    show_system: "Rendszer megjelenítése (hőmérsékletek, ventilátorok)",
    show_storage: "Tárhely megjelenítése",
    show_services: "Szolgáltatások megjelenítése (Wi-Fi, hívások, eszközök)",
    show_speedtest: "Utolsó sebességteszt megjelenítése (Speedtest.net)",
    speedtest: "Sebességteszt",
    entities: "Választott érzékelők",
    ent_rate_down: "A router letöltési sebessége",
    ent_rate_up: "A router feltöltési sebessége",
    ent_download: "Sebességteszt: letöltés",
    ent_upload: "Sebességteszt: feltöltés",
    ent_ping: "Sebességteszt: ping",
    ent_run: "Sebességteszt: indító gomb",
    run_speedtest: "Sebességteszt indítása",
    speedtest_running: "Sebességteszt folyamatban…",
    zoom: "Részletek gomb",
    zoom_helper: "Gomb a jobb felső sarokban, amely a minikártya helyett a teljes kártyát jeleníti meg, és vissza",
    rate_unit: "Sebesség mértékegysége",
    unit_bytes: "Bájt (kB/s, MB/s)",
    unit_bits: "Bit (kb/s, Mb/s)",
    language: "Nyelv",
    lang_auto: "Automatikus",
    temp_warning: "Hőmérséklet figyelmeztetési küszöb (°C)",
    temp_critical: "Hőmérséklet kritikus küszöb (°C)",
    disk_warning: "Tárhely figyelmeztetési küszöb (% foglalt)",
    disk_critical: "Tárhely kritikus küszöb (% foglalt)",
  },
  sk: {
    network: "Sieť",
    system: "Systém",
    storage: "Úložisko",
    services: "Služby",
    download: "Sťahovanie",
    upload: "Odosielanie",
    line_rate: "Rýchlosť linky",
    uptime: "Doba prevádzky",
    firmware: "Firmvér",
    devices_short: "Zariadenia",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi zapnuté",
    wifi_off: "Wi-Fi vypnuté",
    on: "Zapnuté",
    off: "Vypnuté",
    mark_read: "Označiť hovory ako prečítané",
    restart: "Reštartovať router",
    restart_confirm: "Reštartovať router teraz? Internetové, telefónne a TV pripojenie bude na niekoľko minút prerušené.",
    restart_btn: "Reštartovať",
    cancel: "Zrušiť",
    wifi_turn_on: "Zapnúť Wi-Fi",
    wifi_turn_off: "Vypnúť Wi-Fi",
    wifi_off_confirm: "Vypnúť Wi-Fi teraz? Bezdrôtové zariadenia stratia pripojenie; zariadenia pripojené káblom to neovplyvní.",
    wifi_off_btn: "Vypnúť",
    calls: "Hovory",
    missed: "zmeškaných",
    missed_one: "zmeškaný",
    missed_few: "zmeškané",
    temperature: "Tepl.",
    used: "obsadené",
    free: "voľné",
    raid_ok: "OK",
    raid_degraded: "Degradované",
    online: "Online",
    offline: "Offline",
    syncing: "Synchronizácia",
    line_fault: "Porucha linky",
    unavailable: "Nedostupné",
    hours: "h",
    days: "d",
    minutes: "min",
    rpm: "ot./min",
    disk: "Disk",
    no_box: "Nenašiel sa žiadny internetový router. Je nainštalovaná podporovaná integrácia (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink)?",
    unknown_box: "Internetový router sa nenašiel",
    zoom_in: "Zobraziť celú kartu",
    zoom_out: "Späť na kompaktné zobrazenie",
    box: "Internetový router (zariadenie integrácie)",
    title: "Názov (voliteľný, predvolene model routera)",
    model: "Model routera (obrázok a predvolený názov)",
    model_auto: "Automaticky",
    show_image: "Zobraziť obrázok routera",
    show_title: "Zobraziť názov",
    show_subtitle: "Zobraziť podnázov",
    admin: "Otvoriť administračné rozhranie routera",
    admin_url: "Administračná adresa routera (voliteľná, otvorí sa po kliknutí na obrázok)",
    show_logo: "Zobraziť logo operátora",
    show_network: "Zobraziť sieť",
    show_history: "Zobraziť 24 h históriu rýchlostí",
    show_system: "Zobraziť systém (teploty, ventilátory)",
    show_storage: "Zobraziť úložisko",
    show_services: "Zobraziť služby (Wi-Fi, hovory, zariadenia)",
    show_speedtest: "Zobraziť posledný test rýchlosti (Speedtest.net)",
    speedtest: "Test rýchlosti",
    entities: "Senzory podľa vlastného výberu",
    ent_rate_down: "Rýchlosť sťahovania routera",
    ent_rate_up: "Rýchlosť odosielania routera",
    ent_download: "Test rýchlosti: sťahovanie",
    ent_upload: "Test rýchlosti: odosielanie",
    ent_ping: "Test rýchlosti: ping",
    ent_run: "Test rýchlosti: tlačidlo na spustenie",
    run_speedtest: "Spustiť test rýchlosti",
    speedtest_running: "Prebieha test rýchlosti…",
    zoom: "Tlačidlo podrobností",
    zoom_helper: "Tlačidlo vpravo hore, ktoré namiesto minikarty zobrazí celú kartu, a naopak",
    rate_unit: "Jednotka rýchlosti",
    unit_bytes: "Bajty (kB/s, MB/s)",
    unit_bits: "Bity (kb/s, Mb/s)",
    language: "Jazyk",
    lang_auto: "Automaticky",
    temp_warning: "Prah varovania teploty (°C)",
    temp_critical: "Kritický prah teploty (°C)",
    disk_warning: "Prah varovania úložiska (% použité)",
    disk_critical: "Kritický prah úložiska (% použité)",
  },
  cs: {
    network: "Síť",
    system: "Systém",
    storage: "Úložiště",
    services: "Služby",
    download: "Stahování",
    upload: "Odesílání",
    line_rate: "Rychlost linky",
    uptime: "Doba provozu",
    firmware: "Firmware",
    devices_short: "Zařízení",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi zapnuto",
    wifi_off: "Wi-Fi vypnuto",
    on: "Zapnuto",
    off: "Vypnuto",
    mark_read: "Označit hovory jako přečtené",
    restart: "Restartovat router",
    restart_confirm: "Restartovat router nyní? Připojení k internetu, telefon a televize budou na několik minut přerušeny.",
    restart_btn: "Restartovat",
    cancel: "Zrušit",
    wifi_turn_on: "Zapnout Wi-Fi",
    wifi_turn_off: "Vypnout Wi-Fi",
    wifi_off_confirm: "Vypnout Wi-Fi nyní? Bezdrátová zařízení ztratí připojení; zařízení připojená kabelem to neovlivní.",
    wifi_off_btn: "Vypnout",
    calls: "Hovory",
    missed: "zmeškaných",
    missed_one: "zmeškaný",
    missed_few: "zmeškané",
    temperature: "Tepl.",
    used: "obsazeno",
    free: "volno",
    raid_ok: "OK",
    raid_degraded: "Degradováno",
    online: "Online",
    offline: "Offline",
    syncing: "Synchronizace",
    line_fault: "Porucha linky",
    unavailable: "Nedostupné",
    hours: "h",
    days: "d",
    minutes: "min",
    rpm: "ot./min",
    disk: "Disk",
    no_box: "Nebyl nalezen žádný internetový router. Je nainstalována podporovaná integrace (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink)?",
    unknown_box: "Internetový router nebyl nalezen",
    zoom_in: "Zobrazit celou kartu",
    zoom_out: "Zpět na kompaktní zobrazení",
    box: "Internetový router (zařízení integrace)",
    title: "Název (volitelný, výchozí je model routeru)",
    model: "Model routeru (obrázek a výchozí název)",
    model_auto: "Automaticky",
    show_image: "Zobrazit obrázek routeru",
    show_title: "Zobrazit název",
    show_subtitle: "Zobrazit podnázev",
    admin: "Otevřít administrační rozhraní routeru",
    admin_url: "Administrační adresa routeru (volitelná, otevře se kliknutím na obrázek)",
    show_logo: "Zobrazit logo operátora",
    show_network: "Zobrazit síť",
    show_history: "Zobrazit 24h historii rychlostí",
    show_system: "Zobrazit systém (teploty, ventilátory)",
    show_storage: "Zobrazit úložiště",
    show_services: "Zobrazit služby (Wi-Fi, hovory, zařízení)",
    show_speedtest: "Zobrazit poslední test rychlosti (Speedtest.net)",
    speedtest: "Test rychlosti",
    entities: "Senzory dle vlastního výběru",
    ent_rate_down: "Rychlost stahování routeru",
    ent_rate_up: "Rychlost odesílání routeru",
    ent_download: "Test rychlosti: stahování",
    ent_upload: "Test rychlosti: odesílání",
    ent_ping: "Test rychlosti: ping",
    ent_run: "Test rychlosti: tlačítko pro spuštění",
    run_speedtest: "Spustit test rychlosti",
    speedtest_running: "Probíhá test rychlosti…",
    zoom: "Tlačítko podrobností",
    zoom_helper: "Tlačítko vpravo nahoře, které místo minikarty zobrazí celou kartu, a zpět",
    rate_unit: "Jednotka rychlosti",
    unit_bytes: "Bajty (kB/s, MB/s)",
    unit_bits: "Bity (kb/s, Mb/s)",
    language: "Jazyk",
    lang_auto: "Automaticky",
    temp_warning: "Práh varování teploty (°C)",
    temp_critical: "Kritický práh teploty (°C)",
    disk_warning: "Práh varování úložiště (% využito)",
    disk_critical: "Kritický práh úložiště (% využito)",
  },
  sl: {
    network: "Omrežje",
    system: "Sistem",
    storage: "Shramba",
    services: "Storitve",
    download: "Prejemanje",
    upload: "Pošiljanje",
    line_rate: "Hitrost linije",
    uptime: "Čas delovanja",
    firmware: "Firmware",
    devices_short: "Naprave",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi vklopljen",
    wifi_off: "Wi-Fi izklopljen",
    on: "Vklopljeno",
    off: "Izklopljeno",
    mark_read: "Označi klice kot prebrane",
    restart: "Znova zaženi usmerjevalnik",
    restart_confirm: "Želite zdaj znova zagnati usmerjevalnik? Internetna, telefonska in TV-povezava bodo za nekaj minut prekinjene.",
    restart_btn: "Znova zaženi",
    cancel: "Prekliči",
    wifi_turn_on: "Vklopi Wi-Fi",
    wifi_turn_off: "Izklopi Wi-Fi",
    wifi_off_confirm: "Želite zdaj izklopiti Wi-Fi? Brezžične naprave bodo izgubile povezavo; žično povezanih naprav to ne prizadene.",
    wifi_off_btn: "Izklopi",
    calls: "Klici",
    missed: "zgrešenih",
    missed_one: "zgrešen",
    missed_two: "zgrešena",
    missed_few: "zgrešeni",
    temperature: "Temp.",
    used: "zasedeno",
    free: "prosto",
    raid_ok: "V redu",
    raid_degraded: "Okrnjeno",
    online: "Povezan",
    offline: "Brez povezave",
    syncing: "Sinhronizacija",
    line_fault: "Napaka linije",
    unavailable: "Ni na voljo",
    hours: "h",
    days: "d",
    minutes: "min",
    rpm: "vrt./min",
    disk: "Disk",
    no_box: "Internetnega usmerjevalnika ni bilo mogoče najti. Ali je nameščena podprta integracija (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink)?",
    unknown_box: "Internetnega usmerjevalnika ni mogoče najti",
    zoom_in: "Prikaži celotno kartico",
    zoom_out: "Nazaj na strnjeni pogled",
    box: "Internetni usmerjevalnik (naprava integracije)",
    title: "Naslov (neobvezno, privzeto model usmerjevalnika)",
    model: "Model usmerjevalnika (slika in privzeti naslov)",
    model_auto: "Samodejno",
    show_image: "Prikaži sliko usmerjevalnika",
    show_title: "Prikaži naslov",
    show_subtitle: "Prikaži podnaslov",
    admin: "Odpri skrbniški vmesnik usmerjevalnika",
    admin_url: "Skrbniški naslov usmerjevalnika (neobvezno, odpre se ob kliku na sliko)",
    show_logo: "Prikaži logotip operaterja",
    show_network: "Prikaži omrežje",
    show_history: "Prikaži 24-urno zgodovino hitrosti",
    show_system: "Prikaži sistem (temperature, ventilatorji)",
    show_storage: "Prikaži shrambo",
    show_services: "Prikaži storitve (Wi-Fi, klici, naprave)",
    show_speedtest: "Prikaži zadnji preizkus hitrosti (Speedtest.net)",
    speedtest: "Preizkus hitrosti",
    entities: "Senzorji po vaši izbiri",
    ent_rate_down: "Hitrost prenosa usmerjevalnika",
    ent_rate_up: "Hitrost nalaganja usmerjevalnika",
    ent_download: "Preizkus hitrosti: prenos",
    ent_upload: "Preizkus hitrosti: nalaganje",
    ent_ping: "Preizkus hitrosti: ping",
    ent_run: "Test hitrosti: gumb za zagon",
    run_speedtest: "Zaženi test hitrosti",
    speedtest_running: "Test hitrosti poteka…",
    zoom: "Gumb za podrobnosti",
    zoom_helper: "Gumb zgoraj desno, ki namesto mini kartice prikaže celotno kartico, in nazaj",
    rate_unit: "Enota hitrosti",
    unit_bytes: "Bajti (kB/s, MB/s)",
    unit_bits: "Biti (kb/s, Mb/s)",
    language: "Jezik",
    lang_auto: "Samodejno",
    temp_warning: "Prag opozorila za temperaturo (°C)",
    temp_critical: "Kritični prag za temperaturo (°C)",
    disk_warning: "Prag opozorila za shrambo (% zasedeno)",
    disk_critical: "Kritični prag za shrambo (% zasedeno)",
  },
  lv: {
    network: "Tīkls",
    system: "Sistēma",
    storage: "Krātuve",
    services: "Pakalpojumi",
    download: "Lejupielāde",
    upload: "Augšupielāde",
    line_rate: "Līnijas ātrums",
    uptime: "Darbības laiks",
    firmware: "Firmware",
    devices_short: "Ierīces",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi ieslēgts",
    wifi_off: "Wi-Fi izslēgts",
    on: "Ieslēgts",
    off: "Izslēgts",
    mark_read: "Atzīmēt zvanus kā izlasītus",
    restart: "Restartēt maršrutētāju",
    restart_confirm: "Restartēt maršrutētāju tagad? Interneta, tālruņa un TV savienojums tiks pārtraukts uz dažām minūtēm.",
    restart_btn: "Restartēt",
    cancel: "Atcelt",
    wifi_turn_on: "Ieslēgt Wi-Fi",
    wifi_turn_off: "Izslēgt Wi-Fi",
    wifi_off_confirm: "Izslēgt Wi-Fi tagad? Bezvadu ierīces zaudēs savienojumu; ar kabeli pievienotās ierīces netiks ietekmētas.",
    wifi_off_btn: "Izslēgt",
    calls: "Zvani",
    missed: "neatbildēti",
    missed_one: "neatbildēts",
    temperature: "Temp.",
    used: "aizņemts",
    free: "brīvs",
    raid_ok: "Labi",
    raid_degraded: "Degradēts",
    online: "Tiešsaistē",
    offline: "Bezsaistē",
    syncing: "Sinhronizē",
    line_fault: "Līnijas kļūme",
    unavailable: "Nav pieejams",
    hours: "h",
    days: "d",
    minutes: "min",
    rpm: "1/min",
    disk: "Disks",
    no_box: "Netika atrasts neviens interneta maršrutētājs. Vai ir instalēta atbalstīta integrācija (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink)?",
    unknown_box: "Interneta maršrutētājs nav atrasts",
    zoom_in: "Rādīt pilno kartīti",
    zoom_out: "Atpakaļ uz kompakto skatu",
    box: "Interneta maršrutētājs (integrācijas ierīce)",
    title: "Virsraksts (neobligāts, pēc noklusējuma maršrutētāja modelis)",
    model: "Maršrutētāja modelis (attēls un noklusējuma virsraksts)",
    model_auto: "Automātiski",
    show_image: "Rādīt maršrutētāja attēlu",
    show_title: "Rādīt virsrakstu",
    show_subtitle: "Rādīt apakšvirsrakstu",
    admin: "Atvērt maršrutētāja administrēšanas saskarni",
    admin_url: "Maršrutētāja administrēšanas adrese (neobligāta, tiek atvērta, noklikšķinot uz attēla)",
    show_logo: "Rādīt operatora logotipu",
    show_network: "Rādīt tīklu",
    show_history: "Rādīt ātrumu 24 h vēsturi",
    show_system: "Rādīt sistēmu (temperatūras, ventilatori)",
    show_storage: "Rādīt krātuvi",
    show_services: "Rādīt pakalpojumus (Wi-Fi, zvani, ierīces)",
    show_speedtest: "Rādīt pēdējo ātruma testu (Speedtest.net)",
    speedtest: "Ātruma tests",
    entities: "Jūsu izvēlēti sensori",
    ent_rate_down: "Maršrutētāja lejupielādes ātrums",
    ent_rate_up: "Maršrutētāja augšupielādes ātrums",
    ent_download: "Ātruma tests: lejupielāde",
    ent_upload: "Ātruma tests: augšupielāde",
    ent_ping: "Ātruma tests: ping",
    ent_run: "Ātruma tests: poga tā palaišanai",
    run_speedtest: "Palaist ātruma testu",
    speedtest_running: "Notiek ātruma tests…",
    zoom: "Detaļu poga",
    zoom_helper: "Poga augšējā labajā stūrī, kas minikartītes vietā parāda pilno kartīti, un atpakaļ",
    rate_unit: "Ātruma mērvienība",
    unit_bytes: "Baiti (kB/s, MB/s)",
    unit_bits: "Biti (kb/s, Mb/s)",
    language: "Valoda",
    lang_auto: "Automātiski",
    temp_warning: "Temperatūras brīdinājuma slieksnis (°C)",
    temp_critical: "Temperatūras kritiskais slieksnis (°C)",
    disk_warning: "Krātuves brīdinājuma slieksnis (% aizņemts)",
    disk_critical: "Krātuves kritiskais slieksnis (% aizņemts)",
  },
  el: {
    network: "Δίκτυο",
    system: "Σύστημα",
    storage: "Αποθήκευση",
    services: "Υπηρεσίες",
    download: "Λήψη",
    upload: "Αποστολή",
    line_rate: "Ταχύτητα γραμμής",
    uptime: "Σε λειτουργία",
    firmware: "Firmware",
    devices_short: "Συσκευές",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi ενεργό",
    wifi_off: "Wi-Fi ανενεργό",
    on: "Ενεργό",
    off: "Ανενεργό",
    mark_read: "Σήμανση κλήσεων ως αναγνωσμένων",
    restart: "Επανεκκίνηση δρομολογητή",
    restart_confirm: "Επανεκκίνηση του δρομολογητή τώρα; Η σύνδεση στο διαδίκτυο, το τηλέφωνο και η τηλεόραση θα διακοπούν για λίγα λεπτά.",
    restart_btn: "Επανεκκίνηση",
    cancel: "Ακύρωση",
    wifi_turn_on: "Ενεργοποίηση Wi-Fi",
    wifi_turn_off: "Απενεργοποίηση Wi-Fi",
    wifi_off_confirm: "Απενεργοποίηση του Wi-Fi τώρα; Οι ασύρματες συσκευές θα χάσουν τη σύνδεσή τους· οι ενσύρματες συσκευές δεν επηρεάζονται.",
    wifi_off_btn: "Απενεργοποίηση",
    calls: "Κλήσεις",
    missed: "αναπάντητες",
    missed_one: "αναπάντητη",
    temperature: "Θερμ.",
    used: "σε χρήση",
    free: "ελεύθερο",
    raid_ok: "Εντάξει",
    raid_degraded: "Υποβαθμισμένο",
    online: "Συνδεμένο",
    offline: "Εκτός σύνδεσης",
    syncing: "Συγχρονισμός",
    line_fault: "Βλάβη γραμμής",
    unavailable: "Μη διαθέσιμο",
    hours: "ώρ.",
    days: "ημ.",
    minutes: "λεπ.",
    rpm: "σ.α.λ.",
    disk: "Δίσκος",
    no_box: "Δεν βρέθηκε δρομολογητής διαδικτύου. Είναι εγκατεστημένη μια υποστηριζόμενη ενσωμάτωση (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink);",
    unknown_box: "Δεν βρέθηκε ο δρομολογητής διαδικτύου",
    zoom_in: "Εμφάνιση πλήρους κάρτας",
    zoom_out: "Επιστροφή στη συμπαγή προβολή",
    box: "Δρομολογητής διαδικτύου (συσκευή της ενσωμάτωσης)",
    title: "Τίτλος (προαιρετικός, από προεπιλογή το μοντέλο του δρομολογητή)",
    model: "Μοντέλο δρομολογητή (εικόνα και προεπιλεγμένος τίτλος)",
    model_auto: "Αυτόματα",
    show_image: "Εμφάνιση εικόνας του δρομολογητή",
    show_title: "Εμφάνιση τίτλου",
    show_subtitle: "Εμφάνιση υπότιτλου",
    admin: "Άνοιγμα της διεπαφής διαχείρισης του δρομολογητή",
    admin_url: "Διεύθυνση διαχείρισης του δρομολογητή (προαιρετική, ανοίγει με κλικ στην εικόνα)",
    show_logo: "Εμφάνιση λογότυπου παρόχου",
    show_network: "Εμφάνιση δικτύου",
    show_history: "Εμφάνιση ιστορικού ταχυτήτων 24 ωρών",
    show_system: "Εμφάνιση συστήματος (θερμοκρασίες, ανεμιστήρες)",
    show_storage: "Εμφάνιση αποθήκευσης",
    show_services: "Εμφάνιση υπηρεσιών (Wi-Fi, κλήσεις, συσκευές)",
    show_speedtest: "Εμφάνιση του τελευταίου τεστ ταχύτητας (Speedtest.net)",
    speedtest: "Τεστ ταχύτητας",
    entities: "Αισθητήρες της επιλογής σας",
    ent_rate_down: "Ταχύτητα λήψης του router",
    ent_rate_up: "Ταχύτητα αποστολής του router",
    ent_download: "Τεστ ταχύτητας: λήψη",
    ent_upload: "Τεστ ταχύτητας: αποστολή",
    ent_ping: "Τεστ ταχύτητας: ping",
    ent_run: "Τεστ ταχύτητας: κουμπί εκκίνησης",
    run_speedtest: "Εκκίνηση τεστ ταχύτητας",
    speedtest_running: "Τεστ ταχύτητας σε εξέλιξη…",
    zoom: "Κουμπί λεπτομερειών",
    zoom_helper: "Κουμπί πάνω δεξιά που εμφανίζει την πλήρη κάρτα στη θέση της μίνι κάρτας, και αντίστροφα",
    rate_unit: "Μονάδα ταχύτητας",
    unit_bytes: "Byte (kB/s, MB/s)",
    unit_bits: "Bit (kb/s, Mb/s)",
    language: "Γλώσσα",
    lang_auto: "Αυτόματα",
    temp_warning: "Όριο προειδοποίησης θερμοκρασίας (°C)",
    temp_critical: "Κρίσιμο όριο θερμοκρασίας (°C)",
    disk_warning: "Όριο προειδοποίησης αποθήκευσης (% σε χρήση)",
    disk_critical: "Κρίσιμο όριο αποθήκευσης (% σε χρήση)",
  },
};

const RATE_UNITS = {
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
const MODELS = [
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
const OPERATORS = {
  freebox: {
    platform: "freebox", name: "Freebox", color: "#cd1e25", logo: IMG_LOGO,
    website: FREE_URL, admin: ADMIN_URL, models: MODELS,
    keys: { rate_down: "rate_down", rate_up: "rate_up", missed: "missed", wifi: "wifi", mark_read: "mark_calls_as_read", reboot: "reboot", partition: "partition_free_space", raid: "raid_degraded" },
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
    // On a fibre line (GPON or SFP) the integration creates no down_rate / up_rate sensor: the throughput comes from
    // the WAN interface statistics, whose translation keys are built from the interface name (WAN_GPON_rate_rx).
    // `alt` holds patterns on the translation key, used when the canonical key is missing (never Wi-Fi or Ethernet
    // interfaces, nor the DS-Lite tunnel).
    alt: { rate_down: /^wan_(gpon|sfp)_rate_rx$/i, rate_up: /^wan_(gpon|sfp)_rate_tx$/i },
    // Since Livebox 3.0.0 every interface shares one translation key (interface_rate_rx / _tx, the interface only a
    // placeholder of the name): the WAN interface is then told by its name in the entity id, generated from the name in
    // any language (sensor.livebox_wan_sfp_rate_rx, sensor.livebox_debit_recu_wan_sfp), never a sub-interface
    // (wan_gpon_internet…) nor the DS-Lite tunnel. `veip0` is the GPON interface of the boxes with a built-in ONT.
    altIface: {
      keys: { rate_down: "interface_rate_rx", rate_up: "interface_rate_tx" },
      re: /(^|_)(wan_(gpon|sfp)|veip0)(_rate_[rt]x)?(_\d+)?$/i,
    },
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
const BRANDS = {
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const lang = (hass, config) => {
  const l = (config?.language) || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

const t = (hass, config, key) => STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key;

/** Text agreeing with the count n: the `key_one/_few/_many` variant picked by Intl.PluralRules when the
 *  language defines it, else the plain key (which serves as the `_other` form). */
const tn = (hass, config, key, n) => {
  const l = lang(hass, config);
  let form = "other";
  try {
    // The Portuguese texts are European Portuguese: 0 takes the plural there (pt alone means pt-BR to Intl).
    form = new Intl.PluralRules(l === "pt" ? "pt-PT" : l).select(n);
  } catch (_) {}
  return STRINGS[l][`${key}_${form}`] ?? t(hass, config, key);
};

const num = (s) => {
  if (!s) return null;
  const v = parseFloat(s.state);
  return Number.isFinite(v) ? v : null;
};

/** True when Home Assistant has no value for the entity (unavailable, e.g. while the box restarts, or unknown):
 *  the card then shows it as unavailable, never as a real state (Wi-Fi off, 0 missed calls, offline, RAID OK). */
const noValue = (s) => !s || s.state === "unavailable" || s.state === "unknown";

/** Number of missed calls from the missed-calls entity, or null while it has no value. A counting sensor (Freebox)
 *  gives it as its state; a binary sensor listing the missed calls (Livebox `callmissed`) as the length of its
 *  `missed_calls` attribute (0 when off); the Livebox `callers` total only through its `callers` list, keeping the
 *  calls whose status is "missed". */
const missedCount = (s) => {
  if (noValue(s)) return null;
  const a = s.attributes || {};
  if (Array.isArray(a.missed_calls)) return a.missed_calls.length;
  if (s.entity_id?.startsWith("binary_sensor.")) return s.state === "on" ? null : 0;
  if (Array.isArray(a.callers)) return a.callers.filter((c) => c?.status === "missed").length;
  return num(s);
};

const RATE_FACTORS = {
  "b/s": 1, "bit/s": 1 / 8, "kbit/s": 125, "mbit/s": 125e3, "gbit/s": 125e6,
  "kb/s": 1e3, "mb/s": 1e6, "gb/s": 1e9, "kib/s": 1024, "mib/s": 1024 ** 2, "gib/s": 1024 ** 3,
};

/** Data rate of a sensor in bytes per second, whatever the unit chosen in Home Assistant. */
const toBps = (s) => {
  const v = num(s);
  if (v === null) return null;
  const unit = String(s.attributes.unit_of_measurement || "kB/s").toLowerCase();
  return v * (RATE_FACTORS[unit] ?? 1e3);
};

/** Locale for numbers: the card's language, refined by Home Assistant's own locale when they agree ("fr-CA"). The
 *  Portuguese texts are European Portuguese (pt alone means pt-BR to Intl). */
const numLang = (hass, config) => {
  const l = lang(hass, config);
  const ha = hass && (hass.locale?.language || hass.language);
  const loc = ha && ha.split("-")[0] === l ? ha : l;
  return loc === "pt" ? "pt-PT" : loc;
};

/** Rate with the language's units and decimal separator ("1,5 Mo/s" in French). */
const fmtRate = (bps, hass, config) => {
  if (bps === null || bps === undefined) return "—";
  const bits = config.rate_unit === "bits";
  const units = RATE_UNITS[lang(hass, config)][bits ? "bits" : "bytes"];
  let v = bits ? bps * 8 : bps;
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  const d = v >= 100 || i === 0 ? 0 : 1;
  const n = new Intl.NumberFormat(numLang(hass, config), { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: false }).format(v);
  return `${n} ${units[i]}`;
};

const fmtUptime = (sec, hass, config) => {
  if (sec === null) return "—";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d} ${t(hass, config, "days")} ${h} ${t(hass, config, "hours")}`;
  if (h > 0) return `${h} ${t(hass, config, "hours")} ${m} ${t(hass, config, "minutes")}`;
  return `${m} ${t(hass, config, "minutes")}`;
};

/** Offset of a time zone from UTC at a given instant, in minutes ("Europe/Paris" in summer -> 120).
 *  Cached per (time zone, minute): building an Intl.DateTimeFormat on every render is needless work. */
const _tzCache = new Map();
const tzOffset = (timeZone, ms) => {
  const key = `${timeZone}|${Math.floor(ms / 60000)}`;
  let off = _tzCache.get(key);
  if (off !== undefined) return off;
  const name = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(new Date(ms))
    .find((p) => p.type === "timeZoneName")?.value;
  const m = /GMT([+-])(\d{1,2})(?::?(\d{2}))?/.exec(name || "");
  off = m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] || 0)) : 0;
  if (_tzCache.size > 64) _tzCache.clear();
  _tzCache.set(key, off);
  return off;
};

/**
 * Parse a date. The Freebox integration exposes a naive datetime (no UTC offset), built with
 * datetime.fromtimestamp(), so in the system time zone of the Home Assistant process (its TZ variable),
 * which Home Assistant does not set itself. It is read in timeZone (hass.config.time_zone), not in the
 * browser's: both match on Home Assistant OS and Supervised, where the Supervisor passes TZ, but not in
 * a container started without TZ (see the README).
 */
const parseDate = (raw, timeZone) => {
  const str = String(raw).trim().replace(" ", "T");
  const naive = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(str);
  if (!naive || !timeZone) return Date.parse(str);
  const asUtc = Date.parse(`${str}Z`);
  if (!Number.isFinite(asUtc)) return Number.NaN;
  try {
    // Second pass: the offset of the resulting instant, right around daylight saving time changes.
    const first = asUtc - tzOffset(timeZone, asUtc) * 60e3;
    return asUtc - tzOffset(timeZone, first) * 60e3;
  } catch {
    return Date.parse(str);
  }
};

/** Seconds since the box started, from an uptime sensor: a boot date (device_class uptime / timestamp), or a duration
 *  (Huawei LTE: seconds, or the sensor's own time unit); null while it has no value. */
const bootSec = (s) => {
  if (noValue(s)) return null;
  const unit = String(s.attributes?.unit_of_measurement || "").toLowerCase();
  const v = Number(s.state);
  if (unit && Number.isFinite(v)) return Math.max(0, v * ({ ms: 1e-3, s: 1, min: 60, h: 3600, d: 86400 }[unit] ?? 1));
  const ms = Date.parse(s.state);
  return Number.isFinite(ms) ? Math.max(0, (Date.now() - ms) / 1000) : null;
};

/** Seconds since the boot date exposed by the router device tracker ("uptime" attribute). */
const uptimeSec = (tracker, timeZone) => {
  const raw = tracker?.attributes?.uptime;
  if (!raw) return null;
  const ms = parseDate(raw, timeZone);
  return Number.isFinite(ms) ? Math.max(0, (Date.now() - ms) / 1000) : null;
};

/**
 * Temperature sensor value: `raw` in the sensor's own unit (Home Assistant converts temperature sensors to the
 * user's unit system), `c` the same value in °C for the thresholds and the gauge, `unit` the unit to display.
 */
const temperature = (s) => {
  const raw = num(s);
  const unit = s?.attributes?.unit_of_measurement || "°C";
  if (raw === null) return { raw, c: null, unit };
  const u = unit.replace(/^°/, "").toUpperCase();
  const c = u === "F" ? ((raw - 32) * 5) / 9 : u === "K" ? raw - 273.15 : raw;
  return { raw, c, unit };
};

const level = (v, warn, crit) => (v === null ? "" : v >= crit ? "crit" : v >= warn ? "warn" : "ok");

// Default warning / critical thresholds: temperatures in °C, disk in % used. Each can be set in the card options
// (`temp_warning`, `temp_critical`, `disk_warning`, `disk_critical`), named as on the system-monitor card.
const THRESHOLDS = { temp_warning: 75, temp_critical: 90, disk_warning: 80, disk_critical: 90 };

// Options renamed in 2.8.0 (`storage_*` -> `disk_*`), still read under their old name; the new name wins when both are set.
const LEGACY_OPTIONS = { storage_warning: "disk_warning", storage_critical: "disk_critical" };
const normalizeConfig = (config) => {
  const out = { ...config };
  for (const [old, name] of Object.entries(LEGACY_OPTIONS)) {
    if (old in out) {
      if (out[name] === undefined) out[name] = out[old];
      delete out[old];
    }
  }
  return out;
};

/** A threshold option as a number, or its default when unset or not a number. */
const threshold = (config, key) => {
  const v = config?.[key];
  const n = v === "" || v === null || v === undefined ? Number.NaN : Number(v);
  return Number.isFinite(n) ? n : THRESHOLDS[key];
};

// Header icon of the kind of connection (fibre, xDSL, 4G / 5G, else a generic box): a box body with what feeds it.
const BOX_BODY = '<rect x="3" y="12" width="18" height="8" rx="2"/><circle class="led" cx="7" cy="16" r="1.1"/><circle class="led" cx="10.5" cy="16" r="1.1"/>';
const LINE_ICONS = {
  box: '<path class="ln" d="M7 12V5M17 12V5"/>',
  fibre: '<circle cx="12" cy="6" r="2"/><path class="ln" d="M12 12V8.5M8 6H6M18 6h-2M9.2 3.2 8 2M14.8 3.2 16 2"/>',
  dsl: '<path class="ln" d="M12 12v-1.5l-2.5-1.8 5-2-5-2 2.5-1.7V1.5"/>',
  mobile: '<path class="ln" d="M12 12V6.5M8.6 5.6a4.8 4.8 0 0 1 6.8 0M6.2 3.2a8.2 8.2 0 0 1 11.6 0"/>',
  satellite: '<path class="ln" d="M12 12V8M7.5 3.5l9 4.5M9 2.6a5 5 0 0 0 6.4 7.6"/><circle cx="17.5" cy="3.5" r="1.3"/>',
};
const lineOf = (type, model) => {
  const t = `${type || ""} ${model || ""}`.toLowerCase();
  return /ftth|fib|pon\b/.test(t)
    ? "fibre"
    : /dsl/.test(t)
      ? "dsl"
      : /\b(4g|5g|lte|mobile|cell|internet.?key)/.test(t)
        ? "mobile"
        : /satellite|starlink/.test(t)
          ? "satellite"
          : "box";
};
const lineIcon = (kind) => `<svg class="icon type" viewBox="0 0 24 24" aria-hidden="true">${BOX_BODY}${LINE_ICONS[kind]}</svg>`;
const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// Same values, compared by identity: used to skip a render when nothing the card shows has changed.
const sameSig = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

// Patch the shadow DOM in place from the new HTML: nodes whose tag is unchanged are kept, so keyboard
// focus, hover, embedded pictures and CSS transitions survive an update, and only the changed text and
// attributes are written. Rows of a list carry a data-key (their entity or row id) and are matched by it,
// wherever they moved, so a focused row keeps its own data when the list is reordered (a node matched by
// position would be rewritten with the row taking its place, and Enter would act on that row). Nodes
// without a data-key are matched by position.
const patchAttrs = (cur, next) => {
  for (const { name } of [...cur.attributes]) if (!next.hasAttribute(name)) cur.removeAttribute(name);
  for (const { name, value } of next.attributes) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
};
const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
const sameNode = (a, b) => !!a && a.nodeType === b.nodeType && a.nodeName === b.nodeName;
// Moves a kept node. moveBefore (where supported) keeps its focus; insertBefore drops it, which is safe:
// Enter then does nothing rather than act on another row.
const place = (parent, node, ref) => {
  if (node === ref) return;
  try {
    if (parent.moveBefore && node.parentNode === parent) return parent.moveBefore(node, ref);
  } catch (_e) {
    /* fall back to insertBefore */
  }
  parent.insertBefore(node, ref);
};
const patchChildren = (cur, next) => {
  const old = [...cur.childNodes];
  const fresh = [...next.childNodes];
  const byKey = new Map();
  for (const o of old) {
    const k = keyOf(o);
    if (k !== null && !byKey.has(k)) byKey.set(k, o);
  }
  const used = new Set();
  fresh.forEach((n, i) => {
    const k = keyOf(n);
    let o = k !== null ? byKey.get(k) : old[i];
    if (!sameNode(o, n) || used.has(o) || (k === null && keyOf(o) !== null)) o = null;
    const ref = cur.childNodes[i] ?? null;
    if (!o) {
      cur.insertBefore(n, ref);
      return;
    }
    used.add(o);
    place(cur, o, ref);
    if (n.nodeType === 1) {
      patchAttrs(o, n);
      patchChildren(o, n);
    } else if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
  });
  while (cur.childNodes.length > fresh.length) cur.removeChild(cur.lastChild);
};
const morph = (root, html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  patchChildren(root, tpl.content);
};

// After the confirmation popup closes, clicks on the card are ignored for this long: the second click of a double
// click on its button would otherwise land on what lies under it.
const CONFIRM_GUARD_MS = 400;

// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
const inDialog = (path) => path.some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

const fireMoreInfo = (node, entityId) => {
  if (!entityId) return;
  node.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
};

// ---------------------------------------------------------------------------
// Entity discovery
// ---------------------------------------------------------------------------

const _cache = new WeakMap();
const _entries = new WeakMap();

const deviceName = (dev) => dev && (dev.name_by_user || dev.name);

/** Friendly name of an entity without its device name ("Freebox v9 (r1) Température CPU 0" -> "Température CPU 0").
 *  The literal "Freebox" prefix covers the legacy Freebox integration, whose entities carry it without a device name. */
const shortName = (hass, id, dev) => {
  const name = hass.states[id]?.attributes?.friendly_name || id.split(".")[1];
  for (const prefix of [dev?.name_by_user, dev?.name, "Freebox"]) {
    if (prefix && name.startsWith(`${prefix} `)) return name.slice(prefix.length + 1);
  }
  return name;
};

/** Without the device registry: keep the end of the name from its first temperature / fan word. */
const tail = (hass, id) => {
  const name = shortName(hass, id);
  return name.match(/(temp[ée]rature|temp\.|ventilateur|fan)\b.*$/i)?.[0] || name;
};

/** Registry entries of every supported operator, or [] when the registry is not exposed. */
let _withState; // last registry() result, keyed by the identity of hass.entities and hass.states
const registry = (hass) => {
  if (!hass.entities) return [];
  // The scan of the whole registry is cached on hass.entities, replaced only when the registry changes.
  let all = _entries.get(hass.entities);
  if (!all) {
    all = Object.values(hass.entities).filter((e) => OPERATORS[e.platform] && !e.hidden);
    _entries.set(hass.entities, all);
  }
  // registry() is called several times per discover() pass (listBoxes, legacyBoxes, opOfDevice):
  // reuse the filtered list while hass.entities and hass.states are the same objects.
  if (_withState && _withState.entities === hass.entities && _withState.states === hass.states) return _withState.list;
  const list = all.filter((e) => hass.states[e.entity_id]);
  _withState = { entities: hass.entities, states: hass.states, list };
  return list;
};

/** True when the entity's translation key matches the operator's alternate pattern for a slot: a rate slot (Livebox
 *  fibre, a sensor) or the Wi-Fi (the FRITZ!Box main Wi-Fi switches, one per band). */
const isAlt = (op, e, slot) =>
  !!(op.alt?.[slot] && (!/^rate_/.test(slot) || e.entity_id.startsWith("sensor.")) && op.alt[slot].test(e.translation_key || ""));
/** True when the entity is the WAN interface's rate for a slot under a translation key shared by every interface
 *  (Livebox 3.0.0 `interface_rate_rx`): the interface is read from the entity id (see `altIface`). */
const isIfaceRate = (op, e, slot) =>
  !!(op.altIface?.keys[slot] && e.translation_key === op.altIface.keys[slot] && e.entity_id.startsWith("sensor.") &&
    op.altIface.re.test(e.entity_id.slice(e.entity_id.indexOf(".") + 1)));
const isAltRate = (op, e, slot) => isAlt(op, e, slot) || isIfaceRate(op, e, slot);

// Integrations whose keys the card does not know (`guess`): rate sensors told apart by their translation key or id.
const GUESS_DOWN = /down|rx\b|_rx|receiv/i;
const GUESS_UP = /(^|[^a-z])up(load|link|_|$)|tx\b|_tx|sent|send/i;
/** "down" / "up" for a data-rate sensor of a `guess` operator, by its translation key or entity id, else null. */
const guessRate = (hass, e) => {
  if (!e.entity_id.startsWith("sensor.") || hass.states[e.entity_id]?.attributes?.device_class !== "data_rate") return null;
  const name = `${e.translation_key || ""} ${e.entity_id}`;
  return GUESS_DOWN.test(name) ? "down" : GUESS_UP.test(name) ? "up" : null;
};

/** True when an entity is the operator's "download rate" sensor (by translation key, an alternate key pattern, or
 *  entity id for a legacy one), or its downstream line sync rate for an operator without throughput sensors (SFR Box). */
const isRateDown = (op, e) =>
  (op.keys.rate_down && e.translation_key === op.keys.rate_down) ||
  (!e.translation_key && !!op.ids?.rate_down?.test(e.entity_id)) ||
  (op.keys.sync_down && e.translation_key === op.keys.sync_down) ||
  isAltRate(op, e, "rate_down") ||
  (op.legacy?.rate_down?.test(e.entity_id));

/** Slot of a box entity without translation key matched by the operator's entity-id suffixes (hass-bbox2), or undefined. */
const idSlot = (op, id) => op.ids && Object.keys(op.ids).find((slot) => op.ids[slot].test(id));

/** True when an entity marks the box device: its download rate (see isRateDown), else, for an integration whose box
 *  has no rate sensor, its restart button (Sagemcom F@st), or a guessed download rate (ZTE Hyperbox). */
const isAnchor = (hass, op, e) =>
  isRateDown(op, e) ||
  (op.anchorRestart && e.entity_id.startsWith("button.") && !e.translation_key && hass.states[e.entity_id]?.attributes?.device_class === "restart") ||
  (op.guess && guessRate(hass, e) === "down");

/** Boxes of the integrations that expose no entity for the box itself, only trackers (Swisscom): the integration is
 *  the box, keyed "platform:<integration>". */
const trackerBoxes = (hass) => {
  const out = [];
  for (const op of Object.values(OPERATORS)) {
    if (op.trackersOnly && registry(hass).some((e) => e.platform === op.platform && e.entity_id.startsWith("device_tracker.")))
      out.push({ value: `platform:${op.platform}`, label: op.name });
  }
  return out;
};

/** The operator of a device, from the platform of its registry entities, or undefined. */
const opOfDevice = (hass, deviceId) => {
  for (const e of registry(hass)) if (e.device_id === deviceId) return OPERATORS[e.platform];
  return undefined;
};

/** Entity ids in hass.states that match a legacy operator's download / upload patterns (Bbox has no registry).
 *  The result depends only on the set of entity ids, not on the states, but hass.states is replaced on every
 *  state change: the regex scan of all ids is cached and reused while the set of ids looks unchanged (same
 *  count and every cached match still present — entity additions and removals change the count). */
let _legacyIds; // { count, ids (sorted) }
const legacyStateIds = (hass) => {
  const states = hass.states || {};
  const keys = Object.keys(states);
  const hit = _legacyIds;
  if (hit && hit.count === keys.length && hit.ids.every((id) => id in states)) return hit.ids;
  const out = [];
  for (const op of Object.values(OPERATORS)) {
    if (!op.legacy) continue;
    for (const id of keys) if (op.legacy.rate_down?.test(id) || op.legacy.rate_up?.test(id)) out.push(id);
  }
  out.sort();
  _legacyIds = { count: keys.length, ids: out };
  return out;
};

/** Legacy operators have no entity registry (no unique_id): their box is found in hass.states by the entity-id
 *  pattern, keyed by the entity-id prefix left once the "download rate" suffix is removed. */
const legacyBoxes = (hass) => {
  const seen = new Map();
  for (const op of Object.values(OPERATORS)) {
    if (!op.legacy?.rate_down) continue;
    for (const id of Object.keys(hass.states || {})) {
      const m = op.legacy.rate_down.exec(id);
      if (m) {
        const prefix = id.slice(0, m.index) || id;
        if (!seen.has(prefix)) seen.set(prefix, op.name);
      }
    }
  }
  // Several legacy boxes of one operator (`name: Bbox`, `name: Bbox Salon`) get the prefix in their label.
  const names = [...seen.values()];
  return [...seen.entries()].map(([value, name]) => ({
    value,
    label: names.filter((n) => n === name).length > 1 ? `${name} (${value})` : name,
  }));
};

/** True when a legacy pattern matches the entity id right after the box prefix: "sensor.bbox" must not claim
 *  "sensor.bbox_salon_currently_used_download_bandwidth", whose suffix starts further on. */
const legacyOwn = (re, id, prefix) => !!re && id.startsWith(prefix) && re.exec(id)?.index === prefix.length;

/** List the boxes of every operator: the devices of their "download rate" sensors, plus legacy boxes from states. */
const listBoxes = (hass) => {
  const seen = new Map();
  for (const e of registry(hass)) {
    const op = OPERATORS[e.platform];
    if (op && isAnchor(hass, op, e) && e.device_id && !seen.has(e.device_id))
      seen.set(e.device_id, deviceName(hass.devices?.[e.device_id]) || e.device_id);
  }
  const list = [...seen.entries()].map(([value, label]) => ({ value, label }));
  for (const b of [...legacyBoxes(hass), ...trackerBoxes(hass)]) if (!seen.has(b.value)) list.push(b);
  return list;
};

/** Fill a box from hass.states for a legacy operator (no registry, no device): only the download / upload rates. */
const fillLegacy = (hass, box, prefix) => {
  const op = Object.values(OPERATORS).find(
    (o) => o.legacy?.rate_down && Object.keys(hass.states).some((id) => legacyOwn(o.legacy.rate_down, id, prefix))
  );
  if (!op) return;
  box.id = prefix;
  box.operator = op;
  box.device = null;
  for (const id of Object.keys(hass.states).sort()) {
    if (legacyOwn(op.legacy.rate_down, id, prefix)) box.scalars.rate_down = id;
    else if (legacyOwn(op.legacy.rate_up, id, prefix)) box.scalars.rate_up = id;
    else if (legacyOwn(op.legacy.boot, id, prefix)) box.scalars.boot = id;
  }
};

/** Fill a box of an integration that only has trackers (Swisscom): every tracker of the integration is counted. */
const fillTrackers = (hass, box, value) => {
  const op = OPERATORS[value.slice("platform:".length)];
  if (!op) return;
  box.id = value;
  box.operator = op;
  box.device = null;
  box.trackers = registry(hass)
    .filter((e) => e.platform === op.platform && e.entity_id.startsWith("device_tracker."))
    .map((e) => e.entity_id)
    .sort();
};

const emptyBox = () => ({ id: null, device: null, operator: null, lineType: null, scalars: {}, temps: [], fans: [], partitions: [], raids: [], trackers: [] });

/**
 * Map the entities of one box to a structured object of entity ids. The result is cached on the
 * registries (hass.entities, hass.devices) and the list of the operators' entities that have a state, not on
 * hass.states, which Home Assistant replaces on every state change.
 */
// The last speed test: download, upload (Mbit/s) and ping (ms) sensors, by translation key, of the Speedtest.net
// integration (else of Fast.com, download only). Not part of the box: the same for every box card. The `entities`
// option's `speedtest` sets the sensors of another speed test (LibreSpeed, Speedtest Tracker…), and `run` the entity
// that starts one (a button, a script…).
const SPEEDTEST_KEYS = ["download", "upload", "ping"];
const SPEEDTEST_PLATFORMS = ["speedtestdotnet", "fastdotcom"];
const isEntityId = (v) => typeof v === "string" && /^[a-z_]+\.[a-z0-9_]+$/.test(v);
const discoverSpeedtest = (hass, config) => {
  const byPlatform = {};
  for (const e of Object.values(hass.entities || {})) {
    if (!SPEEDTEST_PLATFORMS.includes(e.platform) || e.hidden || !e.entity_id.startsWith("sensor.") || !SPEEDTEST_KEYS.includes(e.translation_key)) continue;
    if (hass.states[e.entity_id]) (byPlatform[e.platform] ??= {})[e.translation_key] = e.entity_id;
  }
  const found = { ...(byPlatform.speedtestdotnet || byPlatform.fastdotcom || {}) };
  const own = config?.entities?.speedtest;
  if (own && typeof own === "object") {
    const chosen = SPEEDTEST_KEYS.filter((k) => isEntityId(own[k]));
    // Sensors of another speed test: theirs only, not mixed with Speedtest.net's
    if (chosen.length) for (const k of SPEEDTEST_KEYS) found[k] = isEntityId(own[k]) ? own[k] : undefined;
  }
  for (const k of SPEEDTEST_KEYS) if (!found[k]) delete found[k];
  if (!found.download && !found.upload) return null;
  // How to start a test: the entity set in `run`, else a refresh of the Speedtest.net / Fast.com sensors (their
  // integration runs a test on it); none for sensors of another speed test without `run`.
  if (isEntityId(own?.run)) found.run = own.run;
  else if (SPEEDTEST_PLATFORMS.includes(hass.entities?.[found.download || found.upload]?.platform)) found.run = found.download || found.upload;
  return found;
};

// The `entities` option's box values: sensors of the user's choice, replacing those found on the box.
const BOX_KEYS = ["rate_down", "rate_up", "sync_down", "sync_up", "ip", "boot", "wifi", "missed"];
const withEntitiesCache = new WeakMap();
const withEntities = (box, entities) => {
  if (!box || !entities || typeof entities !== "object") return box;
  const own = BOX_KEYS.filter((k) => isEntityId(entities[k]));
  if (!own.length) return box;
  const key = own.map((k) => `${k}=${entities[k]}`).join(",");
  const hit = withEntitiesCache.get(box);
  if (hit?.key === key) return hit.result;
  const result = { ...box, scalars: { ...box.scalars, ...Object.fromEntries(own.map((k) => [k, entities[k]])) } };
  withEntitiesCache.set(box, { key, result });
  return result;
};
// The editor's pickers of `entities`, and the option without the ones left empty (none: no option).
const EDITOR_ENTITIES = new Set(["rate_down", "rate_up", ...SPEEDTEST_KEYS, "run"]);
// A speed test started from the card is shown running until its sensors are written again, at most this long.
const SPEEDTEST_RUN_MS = 180e3;
// The service that starts a speed test with the `run` entity: a button is pressed, a script or an automation run,
// any other entity refreshed (homeassistant.update_entity).
const runService = (id) => {
  const domain = id.split(".")[0];
  if (domain === "button" || domain === "input_button") return [domain, "press"];
  if (domain === "script") return ["script", "turn_on"];
  if (domain === "automation") return ["automation", "trigger"];
  return ["homeassistant", "update_entity"];
};
const cleanEntities = (entities) => {
  if (!entities || typeof entities !== "object") return undefined;
  const out = {};
  for (const [k, v] of Object.entries(entities)) {
    const value = v && typeof v === "object" ? cleanEntities(v) : v;
    if (value !== "" && value !== undefined && value !== null) out[k] = value;
  }
  return Object.keys(out).length ? out : undefined;
};
// The box a card shows: the one found, with the sensors of the `entities` option.
const boxFor = (hass, config) => withEntities(discover(hass, config?.box), config?.entities);

const discover = (hass, boxId) => {
  const found = registry(hass);
  const holder = hass.entities || hass.states;
  let byBox = _cache.get(holder);
  if (!byBox) {
    byBox = new Map();
    _cache.set(holder, byBox);
  }
  const key = boxId || "";
  const stamp = found.map((e) => e.entity_id).join(",") + "|" + legacyStateIds(hass).join(",");
  const hit = byBox.get(key);
  if (hit && hit.devices === hass.devices && hit.stamp === stamp) return hit.box;

  const box = emptyBox();
  const entries = [...found].sort((a, b) => a.entity_id.localeCompare(b.entity_id));
  const routers = listBoxes(hass).map((b) => b.value);
  const router = boxId ? (routers.includes(boxId) ? boxId : null) : routers[0];
  const dev = router ? hass.devices?.[router] : null;
  if (router?.startsWith("platform:")) {
    // Integration without a box entity (Swisscom): its trackers only.
    fillTrackers(hass, box, router);
  } else if (router && !dev) {
    // Legacy operator (Bbox): no device, entities found in hass.states by their id pattern.
    fillLegacy(hass, box, router);
  } else if (router && dev) {
    {
      const op = opOfDevice(hass, router) || OPERATORS.freebox;
      const keys = op.keys;
      const legacy = op.legacy;
      const entryIds = new Set(dev?.config_entries || []);
      box.id = router;
      box.device = dev;
      box.operator = op;
      for (const e of entries) {
        const id = e.entity_id;
        const domain = id.split(".")[0];
        const d = hass.devices[e.device_id];
        const own = e.device_id === router;
        const sameEntry = d && (d.config_entries || []).some((c) => entryIds.has(c));
        // Disks are child devices of the router, of its own config entry; client trackers share that entry too.
        // Another integration's device linked to the router (a FRITZ!Box client merged with a NAS by its MAC
        // address, juju35/ha-nas-card#74) is not a child: its entities are left out. Without config entries in
        // the registry (old frontend, tests), the link alone decides.
        const child = d && d.via_device_id === router && (sameEntry || !entryIds.size || !d.config_entries?.length);
        if (e.platform !== op.platform) continue;
        if (domain === "device_tracker") {
          if (own) box.scalars.router = id;
          // Most client trackers have no device (Home Assistant gives one only when another integration
          // registered the MAC address): with a single box, they belong to it.
          else if (sameEntry || (!e.device_id && routers.length === 1)) box.trackers.push(id);
          continue;
        }
        if (!own && !child) continue;
        const k = e.translation_key;
        const a = hass.states[id].attributes;
        // Box sensors without translation key known by their entity-id suffix (hass-bbox2): the first one wins.
        const slot = own && !k ? idSlot(op, id) : undefined;
        if (slot) {
          box.scalars[slot] ??= id;
          continue;
        }
        // Each data slot is matched by the operator's translation key, or by an entity-id pattern for a legacy one.
        // The canonical rate key wins over an alternate one (the alternate only fills an empty slot), and the
        // missed-calls sensor over the total of calls.
        if ((keys.rate_down && k === keys.rate_down) || (legacy?.rate_down?.test(id))) box.scalars.rate_down = id;
        else if ((keys.rate_up && k === keys.rate_up) || (legacy?.rate_up?.test(id))) box.scalars.rate_up = id;
        else if (isAltRate(op, e, "rate_down")) box.scalars.rate_down ??= id;
        else if (isAltRate(op, e, "rate_up")) box.scalars.rate_up ??= id;
        else if (own && op.guess && guessRate(hass, e) === "down") box.scalars.rate_down ??= id;
        else if (own && op.guess && guessRate(hass, e) === "up") box.scalars.rate_up ??= id;
        else if (keys.sync_down && k === keys.sync_down) box.scalars.sync_down = id;
        else if (keys.sync_up && k === keys.sync_up) box.scalars.sync_up = id;
        else if (keys.missed && k === keys.missed) box.scalars.missed = id;
        else if (keys.missed_total && k === keys.missed_total) box.scalars.missed_total = id;
        else if (domain === "binary_sensor" && keys.wan && k === keys.wan) box.scalars.wan = id;
        // A connectivity binary sensor without translation key (Starlink, the guessed ZTE one) when the operator has
        // no keyed WAN sensor.
        else if (own && domain === "binary_sensor" && (op.wanClass || op.guess) && !k && a.device_class === "connectivity") box.scalars.wan ??= id;
        else if (domain === "sensor" && keys.ip && k === keys.ip) box.scalars.ip = id;
        else if (domain === "sensor" && keys.ip6 && k === keys.ip6) box.scalars.ip6 = id;
        else if (domain === "sensor" && keys.boot && k === keys.boot) box.scalars.boot = id;
        // The box uptime sensor without translation key (FRITZ!Box device_uptime, Vodafone sys_uptime): a boot date.
        else if (own && domain === "sensor" && op.bootClass && !k && (a.device_class === "uptime" || a.device_class === "timestamp")) box.scalars.boot ??= id;
        else if (domain === "binary_sensor" && keys.lines?.[k]) {
          box.scalars.line = id;
          box.lineType = keys.lines[k];
        } else if (domain === "sensor" && keys.training && k === keys.training) box.scalars.training = id;
        else if (domain === "sensor" && keys.line_status && k === keys.line_status) box.scalars.line_status = id;
        else if (domain === "sensor" && keys.infra && k === keys.infra) box.scalars.infra = id;
        else if (keys.wifi && k === keys.wifi) box.scalars.wifi = id;
        else if (isAlt(op, e, "wifi")) box.scalars.wifi ??= id;
        else if (own && domain === "button" && keys.mark_read && k === keys.mark_read) box.scalars.mark_read = id;
        // A restart button with a translation key of its own is a reconnect button (FRITZ!Box `reconnect`, Vodafone
        // `dsl_reconnect`…), never the reboot.
        else if (own && domain === "button" && ((keys.reboot && k === keys.reboot) || (!k && a.device_class === "restart"))) box.scalars.reboot = id;
        else if (keys.partition && k === keys.partition) box.partitions.push({ id, device: d });
        else if (keys.raid && k === keys.raid) box.raids.push(id);
        // Temperatures: the box's temperature sensors, with a key (FRITZ!Box cpu_temperature) or not (Freebox).
        else if (own && domain === "sensor" && a.device_class === "temperature") box.temps.push({ id, name: shortName(hass, id, dev) });
        else if (own && domain === "sensor" && !k && /^(rpm|tr\/min)$/i.test(a.unit_of_measurement || ""))
          box.fans.push({ id, name: shortName(hass, id, dev) });
      }
      // The DSL line sync rates of a box that has them tell its kind of line (FRITZ!Box on DSL).
      if (op.syncLine && box.scalars.sync_down) box.lineType ??= op.syncLine;
    }
  } else if (!entries.length && !boxId) {
    // No registry (old frontend, tests): fall back on the default English entity ids.
    for (const id of Object.keys(hass.states).sort()) {
      const s = hass.states[id];
      const a = s.attributes || {};
      if (id.startsWith("device_tracker.") && a.connection_type !== undefined && a.firmware_version) box.scalars.router ??= id;
      else if (/^sensor\.freebox.*_download_speed$/.test(id)) box.scalars.rate_down ??= id;
      else if (/^sensor\.freebox.*_upload_speed$/.test(id)) box.scalars.rate_up ??= id;
      else if (/^sensor\.freebox.*_missed_calls$/.test(id)) box.scalars.missed ??= id;
      else if (/^button\.freebox.*_mark_calls_as_read$/.test(id)) box.scalars.mark_read ??= id;
      else if (/^button\.freebox.*_reboot$/.test(id) || (id.startsWith("button.freebox") && a.device_class === "restart")) box.scalars.reboot ??= id;
      else if (/^switch\.freebox.*_wifi$/.test(id)) box.scalars.wifi ??= id;
      else if (/^sensor\.freebox/.test(id) && a.device_class === "temperature") box.temps.push({ id, name: tail(hass, id) });
      else if (/^sensor\.freebox/.test(id) && /^rpm$/i.test(a.unit_of_measurement || "")) box.fans.push({ id, name: tail(hass, id) });
    }
    if (box.scalars.rate_down) {
      box.id = "freebox";
      box.operator = OPERATORS.freebox;
    }
  }
  byBox.set(key, { devices: hass.devices, stamp, box });
  return box;
};

/** Model of the box detected from its device, among its operator's models (Freebox when none is known), or undefined. */
const detectModel = (box) => {
  const models = box?.operator?.models ?? MODELS;
  const dev = box?.device;
  const ids = [dev?.model_id, dev?.hw_version, dev?.model, dev?.name].filter(Boolean).join(" ");
  return ids ? models.find((m) => m.re.test(ids)) : undefined;
};

/** Model of the box: the one set with the `model` option, else the detected one, else the operator's default model
 *  (an integration without device, whose box has a single kind of picture: Swisscom). A model whose `fromDevice` is
 *  set takes the device's own model as its name (a "FRITZ!Box 7590" rather than "FRITZ!Box"). */
const boxModel = (box, config) => {
  const models = box?.operator?.models ?? MODELS;
  const m =
    models.find((x) => x.id === config?.model) ??
    detectModel(box) ??
    (box?.operator?.defaultModel ? models.find((x) => x.id === box.operator.defaultModel) : undefined);
  if (!m?.fromDevice) return m;
  const own = box?.device?.model;
  return own ? { ...m, name: /^\s*[a-z]?\d/i.test(own) && m.prefix ? `${m.prefix} ${own}` : own } : m;
};

/** Branding of the box: its operator's, overridden by the brand of its model when the model belongs to another
 *  internet provider than the integration's (a KPN Box 12 on the Livebox integration, a Bell Home Hub on Sagemcom). */
const brandOf = (box, config) => {
  const op = box?.operator || OPERATORS.freebox;
  const brand = BRANDS[boxModel(box, config)?.brand];
  return brand ? { ...op, ...brand } : op;
};

/** Label of a partition: its friendly name without the device name and the "free space" words, as the core
 *  Freebox integration names them (partition_free_space). Italian, Dutch, Polish, Romanian, Danish, Bulgarian,
 *  Russian, Ukrainian, Slovenian, Latvian and Greek have no translation of that name in core and fall back to
 *  the English one. */
const partitionLabel = (hass, p, fallback = "Disk") =>
  shortName(hass, p.id, p.device)
    .replace(
      /\s*(free space|espace libre( de| sur)?|freier speicher(platz)?|espacio libre( de| en)?|espaço livre( em| de)?|fritt utrymme|szabad hely|voľný priestor|(- )?volné místo)\s*/gi,
      " "
    )
    .trim() || deviceName(p.device) || fallback;

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  :host { display: block; }
  /* ha-card is the size container of the width queries: its content gives it no width, so in a parent that sizes to
     its content (inline-block, grid auto column: button-card, layout-card) the card would fall to a few pixels. This
     empty, zero-height grid gives the card a natural (max-content) width of 400 px (240 px for the compact mini card)
     without any minimum (its min-content width is 0): in a "1fr 1fr" grid (grid card, horizontal-stack,
     layout-card), wrapped in a <div> or not, the card still shrinks to its column. contain-intrinsic-inline-size or a
     min-width on the host would be a minimum and overflow there. */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 400px); height: 0; }
  :host { --ibc-red: #cd1e25; --ibc-ok: var(--success-color, #43a047); --ibc-warn: var(--warning-color, #ffa600); --ibc-crit: var(--error-color, #db4437); }
  /* Readable colours: the operator accent and the state colours stay as they are on fills, dots and tints; icons
     and graphics mix 40 % of the theme text colour (3:1), text 50 % (4.5:1). Mixing with --primary-text-color darkens
     them in a light theme and lightens them in a dark one (e.g. the dark blue Bbox accent on a dark card). Declared on
     ha-card, which carries the operator's --ibc-red. */
  ha-card { overflow: hidden; position: relative; container-type: inline-size;
            --ibc-accent: color-mix(in srgb, var(--ibc-red) 60%, var(--primary-text-color)); }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .muted { color: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .ok { --c: var(--ibc-ok); } .warn { --c: var(--ibc-warn); } .crit { --c: var(--ibc-crit); } .off { --c: var(--disabled-text-color, #9e9e9e); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--ibc-ok)); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;
          background: color-mix(in srgb, var(--c, var(--ibc-ok)) 15%, transparent);
          color: color-mix(in srgb, var(--c, var(--ibc-ok)) 50%, var(--primary-text-color)); }
  .chip .icon { width: 14px; height: 14px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
  .chip.wifi { padding-right: 3px; }
  .chip > [role="button"] { display: inline-flex; align-items: center; gap: 4px; }
  /* Wi-Fi on / off switch: outlined track, tinted when on, never filled. */
  .toggle { all: unset; flex: none; position: relative; box-sizing: border-box; width: 28px; height: 16px; border-radius: 8px; cursor: pointer;
            border: 1.5px solid color-mix(in srgb, var(--secondary-text-color) 70%, transparent); }
  .toggle::after { content: ""; position: absolute; top: 2px; left: 2px; width: 9px; height: 9px; border-radius: 50%;
                   background: var(--secondary-text-color); transition: transform .2s ease; }
  .toggle[aria-checked="true"] { border-color: color-mix(in srgb, var(--ibc-ok) 70%, var(--primary-text-color)); background: color-mix(in srgb, var(--ibc-ok) 15%, transparent); }
  .toggle[aria-checked="true"]::after { transform: translateX(12px); background: color-mix(in srgb, var(--ibc-ok) 70%, var(--primary-text-color)); }
  .toggle:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { .toggle::after { transition: none; } }
  .bar { height: 4px; border-radius: 3px; background: var(--divider-color, rgba(127,127,127,.25)); overflow: hidden; }
  .bar > div { height: 100%; border-radius: 3px; background: var(--c, var(--ibc-accent)); transition: width .6s ease; }
  @media (prefers-reduced-motion: reduce) { .bar > div { transition: none; } }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 8px; }
  /* The status pill sits right of the title line, centred on it; the subtitle and chips stay under the title. */
  /* Narrow cards: the title block shrinks but keeps about 4 characters of the 16 px title (48 px), the box picture
     gets smaller (hidden up to 340 px on the full card), the status pill truncates its text (only its dot below 245 px) and the icon
     buttons never shrink. */
  .titles { flex: 1 1 0; min-width: 48px; display: grid; grid-template-columns: minmax(0, 1fr) auto; }
  :host([hide-title]) .titles > .name, :host([hide-subtitle]) .titles > .sub { display: none; }
  .titles > * { grid-column: 1; }
  .titles > .chip { grid-column: 2; grid-row: 1; align-self: center; margin-left: 10px; white-space: nowrap; min-width: 0; max-width: 100%; }
  .chip.status { overflow: hidden; }
  .chip.status .txt { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .titles .chips { margin-top: 4px; }
  .logo-link { position: relative; display: flex; align-items: center; justify-content: center; flex: none; align-self: flex-start;
               width: 40px; height: 40px; border-radius: 50%; background: color-mix(in srgb, var(--ibc-tint) 16%, transparent);
               --ibc-tint: var(--c, var(--ibc-red)); --ibc-icon: color-mix(in srgb, var(--ibc-tint) 60%, var(--primary-text-color));
               transition: background-color .3s ease; }
  /* The pill takes the colour of the link state (.ok / .warn / .crit / .off set --c), the operator's without one. */
  .logo-link .icon.type { width: 24px; height: 24px; fill: var(--ibc-icon); stroke: var(--ibc-icon); stroke-width: 0; transition: fill .3s ease, stroke .3s ease; }
  .logo-link .icon.type .ln { fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .logo-link .icon.type .led { fill: color-mix(in srgb, var(--ibc-tint) 16%, var(--card-background-color, #fff)); }
  @media (prefers-reduced-motion: reduce) { .logo-link, .logo-link .icon.type { transition: none; } }
  .logo { position: absolute; right: -4px; bottom: -4px; display: block; width: 18px; height: 18px; object-fit: contain; border-radius: 5px; padding: 1px;
          box-sizing: border-box; background: #fff;
          box-shadow: 0 0 0 1px var(--divider-color, rgba(0,0,0,.12)), 0 0 0 3px var(--card-background-color, #fff); }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); overflow: hidden; }
  /* Device name and firmware on one line when they fit, else one per line: the "·" separator that starts a line
     sits in the negative margin, clipped by .sub. */
  .sub .parts { display: flex; flex-wrap: wrap; margin-left: -10px; }
  .sub .parts span { min-width: 0; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub .parts span::before { content: "·"; display: inline-block; width: 10px; text-align: center; }
  /* The box picture gives way before the buttons: it shrinks (object-fit) rather than push them out of the card. */
  .box-link { display: flex; flex: 0 1 auto; min-width: 0; max-width: 40%; }
  @container (max-width: 200px) { .box-link { display: none; } }
  .box { height: 48px; width: auto; max-width: 100%; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,.25)); }
  .tile { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 10px; min-width: 0;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); position: relative; overflow: hidden; }
  .tile > :not(.spark) { position: relative; }
  .tile .spark { position: absolute; left: 0; bottom: 0; width: 100%; height: 55%; pointer-events: none; }
  .spark-a { fill: color-mix(in srgb, var(--c) 12%, transparent); }
  .spark-l { fill: none; stroke: color-mix(in srgb, var(--c) 50%, transparent); stroke-width: 1.2; vector-effect: non-scaling-stroke; }
  .tile .icon { color: color-mix(in srgb, var(--c, var(--ibc-red)) 60%, var(--primary-text-color)); }
  .tile > div { min-width: 0; }
  .tile .k { font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tile .v { font-size: 14px; font-weight: 500; white-space: nowrap; }
  .tile.down { --c: var(--ibc-ok); }
  .tile.up { --c: var(--info-color, #039be5); }
  .warning { padding: 16px; color: color-mix(in srgb, var(--ibc-warn) 50%, var(--primary-text-color)); }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px -4px 0; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--secondary-text-color) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }
  /* Header action button (restart): round, tinted on hover, never filled. */
  .action { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px 0; border-radius: 50%;
            display: grid; place-items: center; color: var(--secondary-text-color); }
  .action .icon { width: 16px; height: 16px; }
  .action:hover { background: color-mix(in srgb, var(--ibc-red) 16%, transparent); color: var(--ibc-accent); }
  .action:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }
  .action:disabled { cursor: default; opacity: .4; }
  .action:disabled:hover { background: none; color: var(--secondary-text-color); }
`;

// In-card confirmation popup, at the top of the card so it stays in view when the card is long.
const DIALOG_STYLE = `
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center;
              padding-top: 12px; box-sizing: border-box; z-index: 9; border-radius: inherit; }
  .modal { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(92%, 340px); max-height: calc(100% - 24px);
           box-sizing: border-box; border-radius: 14px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.4); display: flex; flex-direction: column; gap: 10px; }
  .modal h3 { margin: 0; font-size: 16px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
  .modal h3 .icon { width: 20px; height: 20px; color: var(--ibc-accent); }
  .modal .hint { font-size: 13px; color: var(--secondary-text-color); line-height: 1.4; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 2px; }
  .modal button.act { border: 0; border-radius: 8px; padding: 8px 14px; font: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
  .modal button.cancel { background: var(--secondary-background-color, rgba(127,127,127,.12)); color: var(--primary-text-color); }
  .modal button.danger { background: color-mix(in srgb, var(--ibc-red) 16%, transparent); color: var(--primary-text-color); }
  .modal button.cancel:hover { background: color-mix(in srgb, var(--secondary-text-color) 16%, var(--secondary-background-color, transparent)); }
  .modal button.danger:hover { background: color-mix(in srgb, var(--ibc-red) 26%, transparent); }
`;

// Sparkline of a series of [time (ms), value] points (24 h of 5-minute rate means), on a real time axis: x is the
// point's time over the 24 h window ending at `end`, y its value scaled from 0 to the series' peak. Points more than
// two periods apart are not joined: the curve breaks where the recorder has no data. Runs of a single point are not
// drawn; nothing at all without a run of two points.
const HIST_REFRESH = 5 * 60000;
const HIST_WINDOW = 864e5;
const HIST_PERIOD = 5 * 60000;
function spark(points, end) {
  if (!points || points.length < 2) return "";
  const start = end - HIST_WINDOW;
  const inWindow = points.filter(([at]) => at >= start && at <= end).sort((a, b) => a[0] - b[0]);
  const runs = [];
  let run = [];
  for (const p of inWindow) {
    if (run.length && p[0] - run[run.length - 1][0] > 2 * HIST_PERIOD) {
      runs.push(run);
      run = [];
    }
    run.push(p);
  }
  runs.push(run);
  const drawn = runs.filter((r) => r.length >= 2);
  if (!drawn.length) return "";
  const peak = Math.max(...drawn.flat().map(([, v]) => v)) || 1;
  const x = (at) => (((at - start) / HIST_WINDOW) * 100).toFixed(2);
  const y = (v) => (30 - (Math.max(0, v) / peak) * 28).toFixed(2);
  const lines = drawn.map((r) => `M${r.map(([at, v]) => `${x(at)},${y(v)}`).join("L")}`);
  const areas = drawn.map((r, i) => `M${x(r[0][0])},30L${lines[i].slice(1)}L${x(r[r.length - 1][0])},30Z`);
  return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path class="spark-a" d="${areas.join("")}"/><path class="spark-l" d="${lines.join(
    ""
  )}"/></svg>`;
}

/** Time of a recorder statistics row in ms: a number (Home Assistant 2023.3 and later) or an ISO date string. */
const statTime = (p) => (typeof p.start === "number" ? p.start : Date.parse(p.start));

class InternetBoxBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this._dialog = null;
    this.shadowRoot.addEventListener("click", (ev) => {
      // Just closed: the rest of a double click on the popup's button does nothing.
      if (!this._dialog && Date.now() - (this._dialogClosedAt ?? 0) < CONFIRM_GUARD_MS) {
        ev.stopImmediatePropagation();
        return;
      }
      const path = ev.composedPath();
      const action = path.find((n) => n.dataset?.action);
      // While the confirmation popup is open, only its own buttons and the backdrop act; any other click closes it.
      if (this._dialog) {
        if (action?.dataset.action === "dialog-ok") {
          const run = this._dialog.onOk;
          this._closeDialog();
          run?.();
        } else if (action?.dataset.action === "dialog-cancel" || path[0] === action) {
          this._closeDialog();
        }
        return;
      }
      // The restart button opens a confirmation popup before pressing the box's reboot button.
      if (action?.dataset.action === "restart") return this._confirmRestart();
      // The Wi-Fi switch turns the Wi-Fi on at once, and off after a confirmation popup.
      if (action?.dataset.action === "wifi") return this._toggleWifi();
      // The speed test button starts a test (nothing while one runs).
      if (action?.dataset.action === "speedtest") return this._runSpeedtest();
      const press = path.find((n) => n.dataset?.press);
      if (press) {
        this._press(press.dataset.press);
        return;
      }
      const el = path.find((n) => n.dataset?.entity);
      if (el) fireMoreInfo(this, el.dataset.entity);
    });
    // Keyboard access: Enter or Space on a focusable non-button element acts as a click.
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" || ev.key === " ") && ev.target.getAttribute?.("role") === "button") {
        ev.preventDefault();
        ev.target.click();
      }
    });
    // Escape closes the confirmation popup (as Cancel). Listened on the window while the popup is open: a re-render
    // or a click on its text can take the focus out of the card. Tab and Shift+Tab stay on the popup's two buttons.
    this._onKey = (ev) => {
      if (!this._dialog) return;
      if (ev.key === "Tab") {
        const btns = [...this.shadowRoot.querySelectorAll(".modal button.act")];
        if (!btns.length) return;
        ev.preventDefault();
        const i = btns.indexOf(this.shadowRoot.activeElement);
        btns[(i + (ev.shiftKey ? -1 : 1) + btns.length) % btns.length].focus({ preventScroll: true });
        return;
      }
      if (ev.key !== "Escape") return;
      ev.stopPropagation();
      this._closeDialog();
    };
  }

  connectedCallback() {
    // A click elsewhere on the page closes the confirmation popup; the focus goes where that click put it. The click
    // goes on to its target; the mini card only keeps its zoomed view on it (this listener runs before the mini's).
    this._onDialogOutside ??= (ev) => {
      if (this._dialog && !ev.composedPath().includes(this)) {
        this._dialogClosingClick = ev;
        this._closeDialog(false);
      }
    };
    document.addEventListener("click", this._onDialogOutside, true);
    // Reattached with the popup still open (view switch, editor): Escape keeps closing it.
    if (this._dialog) window.addEventListener("keydown", this._onKey);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this._onDialogOutside, true);
    window.removeEventListener("keydown", this._onKey);
    clearTimeout(this._speedtestTimer);
  }

  // Calls a Home Assistant service on an entity. A failed call is logged (Home Assistant already shows a toast).
  _call(domain, service, entityId) {
    Promise.resolve()
      .then(() => this._hass?.callService(domain, service, { entity_id: entityId }))
      .catch((err) => console.error(`internet-box-card: ${domain}.${service} failed`, err));
  }

  // Presses a Home Assistant button entity.
  _press(entityId) {
    this._call("button", "press", entityId);
  }

  // When the speed test sensors were last written (last_reported: also when the values stay the same).
  _speedtestMark(sp) {
    const st = this._s(sp.download) || this._s(sp.upload);
    return `${st?.last_reported ?? ""}|${st?.last_updated ?? ""}`;
  }

  // A speed test started from the card runs until its sensors are written again, or SPEEDTEST_RUN_MS at most.
  _speedtestRunning(sp) {
    const run = this._speedtestRun;
    if (!run || !sp) return false;
    if (Date.now() - run.at < SPEEDTEST_RUN_MS && this._speedtestMark(sp) === run.mark) return true;
    this._speedtestRun = null;
    return false;
  }

  _runSpeedtest() {
    const sp = discoverSpeedtest(this._hass, this._config);
    if (!sp?.run || this._speedtestRunning(sp)) return;
    this._speedtestRun = { at: Date.now(), mark: this._speedtestMark(sp) };
    const [domain, service] = runService(sp.run);
    this._call(domain, service, sp.run);
    // Shown as stopped at the latest when the time is up, even without any state change.
    clearTimeout(this._speedtestTimer);
    this._speedtestTimer = setTimeout(() => this._update(), SPEEDTEST_RUN_MS + 50);
    this._update();
  }

  // Turns the box's Wi-Fi switch on, or opens a confirmation popup before turning it off (wireless devices lose
  // their connection). Nothing while the switch is unavailable, nor for an entity that is not a switch.
  _toggleWifi() {
    const wifi = this._s(boxFor(this._hass, this._config).scalars.wifi);
    if (!wifi?.entity_id?.startsWith("switch.") || noValue(wifi)) return;
    const id = wifi.entity_id;
    if (wifi.state !== "on") return this._call("switch", "turn_on", id);
    this._openDialog({
      body: `<h3 id="dialog-title">${svgIcon(ICONS.wifi_off)}${esc(this._t("wifi_turn_off"))}</h3>
        <div class="hint" id="dialog-msg">${esc(this._t("wifi_off_confirm"))}</div>`,
      ok: this._t("wifi_off_btn"),
      onOk: () => this._call("switch", "turn_off", id),
      from: "wifi",
    });
  }

  // Small on / off switch for the Wi-Fi, next to its tile, chip or footer item; none while the switch is
  // unavailable. Its name is "Wi-Fi", its tooltip the action it does.
  _wifiToggle(wifi) {
    // Only a Wi-Fi switch can be turned on and off (the Huawei LTE Wi-Fi state is a read-only binary sensor).
    if (!wifi || noValue(wifi) || !wifi.entity_id.startsWith("switch.")) return "";
    const on = wifi.state === "on";
    return `<button type="button" class="toggle" role="switch" aria-checked="${on}" data-action="wifi" title="${esc(
      this._t(on ? "wifi_turn_off" : "wifi_turn_on")
    )}" aria-label="${esc(this._t("wifi"))}"></button>`;
  }

  // Opens the restart confirmation popup; on confirmation, presses the box's reboot button.
  _confirmRestart() {
    const box = boxFor(this._hass, this._config);
    const reboot = box.scalars.reboot;
    if (!reboot || this._s(reboot)?.state === "unavailable") return;
    this._openDialog({
      body: `<h3 id="dialog-title">${svgIcon(ICONS.restart)}${esc(this._t("restart"))}</h3>
        <div class="hint" id="dialog-msg">${esc(this._t("restart_confirm"))}</div>`,
      ok: this._t("restart_btn"),
      onOk: () => this._press(reboot),
      from: "restart",
    });
  }

  _openDialog(dialog) {
    this._dialog = dialog;
    window.addEventListener("keydown", this._onKey);
    this._update();
    // After a re-render: no scroll of the page towards the card.
    this.shadowRoot.querySelector(".modal .danger")?.focus({ preventScroll: true });
  }

  // Closes the popup and gives the focus back to the button that opened it (`from`: its data-action), looked up
  // again after the render, which may have re-created it.
  _closeDialog(restoreFocus = true) {
    if (!this._dialog) return;
    const { from } = this._dialog;
    this._dialog = null;
    this._dialogClosedAt = Date.now();
    window.removeEventListener("keydown", this._onKey);
    this._update();
    if (restoreFocus && from) this.shadowRoot.querySelector(`[data-action="${from}"]`)?.focus({ preventScroll: true });
  }

  _dialogHtml() {
    const d = this._dialog;
    if (!d) return "";
    return `<style>${DIALOG_STYLE}</style><div class="backdrop" data-action="dialog-backdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-msg">
        ${d.body}
        <div class="modal-actions">
          <button type="button" class="act cancel" data-action="dialog-cancel">${esc(this._t("cancel"))}</button>
          <button type="button" class="act danger" data-action="dialog-ok">${esc(d.ok)}</button>
        </div>
      </div>
    </div>`;
  }

  // Round restart button for the header: shown only when the box exposes a reboot button.
  // Disabled while the reboot button is unavailable (a button never pressed is "unknown": that is its normal state).
  _restartBtn(box) {
    if (!box.scalars.reboot) return "";
    const label = esc(this._t("restart"));
    const disabled = this._s(box.scalars.reboot)?.state === "unavailable" ? " disabled" : "";
    return `<button class="action" data-action="restart" title="${label}" aria-label="${label}"${disabled}>${svgIcon(ICONS.restart)}</button>`;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    // Render only when a state the card shows has changed, not on every state change of Home Assistant.
    const sig = this._signature();
    if (sameSig(sig, this._sig)) return;
    this._update(sig);
  }

  get hass() {
    return this._hass;
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = normalizeConfig(config);
    // show_title / show_subtitle: the header's title / subtitle, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    this.toggleAttribute?.("hide-subtitle", config.show_subtitle === false);
    this._html = "";
    this._update();
  }

  _t(key) {
    return t(this._hass, this._config, key);
  }

  _tn(key, n) {
    return tn(this._hass, this._config, key, n);
  }

  _s(id) {
    return id ? this._hass.states[id] : undefined;
  }

  _rate(id) {
    return fmtRate(toBps(this._s(id)), this._hass, this._config);
  }

  // Missed calls sensor, its count (null while unavailable) and the "mark as read" button (only when there are some
  // and the button is available), or null without the sensor.
  _missedCalls(sc) {
    const missed = this._s(sc.missed) || this._s(sc.missed_total);
    if (!missed) return null;
    const n = missedCount(missed);
    const button = this._s(sc.mark_read);
    const markRead = n > 0 && button?.state !== "unavailable" && button;
    const reset = markRead
      ? `<button class="reset" data-press="${markRead.entity_id}" title="${esc(this._t("mark_read"))}" aria-label="${esc(
          this._t("mark_read")
        )}">${svgIcon(ICONS.check)}</button>`
      : "";
    return { missed, n, reset };
  }

  // Level ("ok", "warn", "crit", or "" without value) of a temperature in °C or a storage use in %, against the
  // configured thresholds.
  _level(v, metric) {
    return level(v, threshold(this._config, `${metric}_warning`), threshold(this._config, `${metric}_critical`));
  }

  // Seconds since the box started: the router tracker's boot date (Freebox), else the box's uptime sensor, a boot
  // date (FRITZ!Box, Vodafone, Starlink, Bbox) or a number of seconds (Huawei LTE).
  _uptime(router, box) {
    const fromTracker = uptimeSec(router, this._hass.config?.time_zone);
    if (fromTracker !== null || !box?.scalars.boot) return fromTracker;
    return bootSec(this._s(box.scalars.boot));
  }

  // Entity opened by a click on the uptime: the router tracker when it gives it, else the uptime sensor.
  _uptimeEntity(router, box) {
    return router?.attributes?.uptime ? router.entity_id : box?.scalars.boot || router?.entity_id;
  }

  // Download / upload rate tile, shared by the full and the mini card.
  _rateTile(id, cls, icon, k, hist) {
    // A tile without its sensor opens no more-info: not focusable.
    const attrs = id ? `clickable ${cls}" role="button" tabindex="0" data-entity="${id}"` : `${cls}"`;
    return `<div class="tile ${attrs}>${spark(hist?.[id], hist?.end)}${svgIcon(icon)}<div><div class="k">${k}</div><div class="v">${this._rate(
      id
    )}</div></div></div>`;
  }

  // The download / upload tiles, with their 24 h curves (`hist`). A box without throughput sensors (SFR Box) gets
  // its DSL line sync rates instead, labelled "Line rate" and without curve: the sync rate is not traffic.
  _rateTiles(sc, hist) {
    if (sc.rate_down || sc.rate_up)
      return `${this._rateTile(sc.rate_down, "down", ICONS.down, this._t("download"), hist)}${this._rateTile(sc.rate_up, "up", ICONS.up, this._t("upload"), hist)}`;
    const k = this._t("line_rate");
    return `${this._rateTile(sc.sync_down, "down sync", ICONS.down, `${k} ↓`, null)}${this._rateTile(sc.sync_up, "up sync", ICONS.up, `${k} ↑`, null)}`;
  }

  // What the render depends on: registries, language, the states of the box entities and the
  // minute, for the uptime shown in days, hours and minutes.
  _signature() {
    const h = this._hass;
    const sig = [h.entities, h.devices, h.language, h.locale?.language, h.config?.time_zone];
    const box = boxFor(h, this._config);
    if (!box.id) return sig;
    const ids = [
      ...Object.values(box.scalars),
      ...box.temps.map((x) => x.id),
      ...box.fans.map((x) => x.id),
      ...box.partitions.map((x) => x.id),
      ...box.raids,
      ...box.trackers,
    ];
    for (const id of ids) sig.push(h.states[id]);
    const sp = discoverSpeedtest(h, this._config);
    for (const id of Object.values(sp || {})) sig.push(h.states[id]);
    sig.push(this._speedtestRunning(sp));
    if (this._s(box.scalars.router)?.attributes?.uptime || box.scalars.boot) sig.push(Math.floor(Date.now() / 60e3));
    return sig;
  }

  // 24 h of 5-minute means from the recorder's statistics, fetched again every 5 minutes, as { [id]: [[time, mean]…],
  // end }. Returns what is already there (nothing at first): the card renders again when the answer comes.
  _history(ids) {
    const key = ids.join(",");
    if (key && this._hass.callWS && (this._histKey !== key || Date.now() - this._histAt > HIST_REFRESH)) {
      this._histKey = key;
      const end = Date.now();
      this._histAt = end;
      this._hass
        .callWS({
          type: "recorder/statistics_during_period",
          start_time: new Date(end - HIST_WINDOW).toISOString(),
          statistic_ids: ids,
          period: "5minute",
          types: ["mean"],
        })
        .then((r) => {
          if (this._histKey !== key) return;
          // [time, mean] pairs; the window ends at the request time, so the curves stay put until the next fetch.
          const series = ids.map((id) => [id, (r?.[id] || []).map((p) => [statTime(p), p.mean]).filter(([at, v]) => Number.isFinite(at) && Number.isFinite(v))]);
          this._hist = { ...Object.fromEntries(series), end };
          this._update();
        })
        // No statistics (sensor without state_class, recorder off): try again in a minute, no curve meanwhile.
        .catch(() => {
          this._histAt = Date.now() - HIST_REFRESH + 60000;
        });
    }
    return this._histKey === key ? this._hist : null;
  }

  _update(sig) {
    if (!this._hass || !this._config) return;
    this._sig = sig ?? this._signature();
    let html = this._render();
    // The confirmation popup lives inside the ha-card (positioned over it), added after the content.
    if (this._dialog) html = html.replace(/<\/ha-card>(?![\s\S]*<\/ha-card>)/, `${this._dialogHtml()}</ha-card>`);
    if (html !== this._html) {
      this._html = html;
      morph(this.shadowRoot, html);
    }
  }

  // Kind of line ("FTTH", "XDSL"…): the router's connection type (Freebox), the WAN sensor's link type (Livebox), the
  // access network sensor (SFR Box), else the kind of the line sensor found (SFR Box DSL / FTTH); "" when unknown.
  _linkType(box) {
    const sc = box.scalars;
    const infra = this._s(sc.infra);
    const type =
      this._s(sc.router)?.attributes?.connection_type ||
      this._s(sc.wan)?.attributes?.link_type ||
      (infra && !noValue(infra) ? infra.state : "") ||
      box.lineType ||
      box.operator?.line;
    return type ? String(type).replace(/_/g, " ").toUpperCase() : "";
  }

  // State of the internet link: { entity, cls, key, type }, or null when the box exposes nothing about it. Read from
  // the integration's own link entities when it has some (WAN status, else the DSL / FTTH line status); a link that
  // is down says why when the DSL line tells it (still training: "Syncing"; a line defect: "Line fault"). Without
  // them (or while they are unavailable), the router tracker's presence, as before.
  _link(box) {
    const sc = box.scalars;
    const type = this._linkType(box);
    const real = [this._s(sc.wan), this._s(sc.line)].find((s) => s && !noValue(s));
    if (real) {
      if (real.state === "on") return { entity: real.entity_id, cls: "ok", key: "online", type };
      const training = this._s(sc.training);
      if (training && !noValue(training) && !["showtime", "idle"].includes(training.state))
        return { entity: training.entity_id, cls: "warn", key: "syncing", type };
      const line = this._s(sc.line_status);
      if (line && !noValue(line) && line.state !== "no_defect") return { entity: line.entity_id, cls: "crit", key: "line_fault", type };
      return { entity: real.entity_id, cls: "crit", key: "offline", type };
    }
    // An integration whose only link entity names the active line (Vodafone Station `active_connection`: dsl, fiber,
    // internet_key) is online while it names one; without one (unknown) the card says nothing rather than guess.
    const infra = this._s(sc.infra);
    if (!sc.router && box.operator?.infraLink && infra && !noValue(infra))
      return { entity: infra.entity_id, cls: "ok", key: "online", type };
    const router = this._s(sc.router);
    const fallback = router || this._s(sc.wan) || this._s(sc.line);
    if (!fallback || noValue(fallback)) return fallback ? { entity: fallback.entity_id, cls: "off", key: "unavailable", type } : null;
    const online = router.state === "home";
    return { entity: router.entity_id, cls: online ? "ok" : "crit", key: online ? "online" : "offline", type };
  }

  // Status pill right of the title (connection state and type), or "" when the box exposes no link state.
  _statusPill(box) {
    const link = this._link(box);
    if (!link) return "";
    const text = link.cls === "off" ? this._t("unavailable") : `${this._t(link.key)}${link.type ? ` · ${link.type}` : ""}`;
    // The text is also the tooltip and accessible name: on a narrow card only the coloured dot is shown.
    return `<span class="chip status clickable ${link.cls}" role="button" tabindex="0" data-entity="${
      link.entity
    }" title="${esc(text)}" aria-label="${esc(text)}"><span class="dot"></span><span class="txt">${esc(text)}</span></span>`;
  }

  // Info chips under the title (Wi-Fi state). The Services section (shown unless disabled) already has a Wi-Fi
  // tile, so the header chip would duplicate it: it is shown only when that section is hidden.
  _chips(box) {
    const sc = box.scalars;
    const chips = [];
    const wifi = this._s(sc.wifi);
    if (wifi && this._config.show_services === false) {
      const on = wifi.state === "on";
      const text = noValue(wifi) ? `${this._t("wifi")} · ${this._t("unavailable")}` : on ? this._t("wifi_on") : this._t("wifi_off");
      chips.push(
        `<span class="chip wifi clickable ${on ? "ok" : "off"}" data-entity="${wifi.entity_id}"><span role="button" tabindex="0">${svgIcon(
          on ? ICONS.wifi : ICONS.wifi_off
        )}${esc(text)}</span>${this._wifiToggle(wifi)}</span>`
      );
    }
    return chips.length ? `<div class="chips">${chips.join("")}</div>` : "";
  }

  _header(box, withChips) {
    const c = this._config;
    const model = boxModel(box, c);
    const op = brandOf(box, c);
    const router = this._s(box.scalars.router);
    const firmware = box.device?.sw_version || router?.attributes?.firmware_version;
    const devName = deviceName(box.device);
    const name = c.title || model?.name || devName || op.name;
    const adminUrl = /^https?:\/\//i.test(c.admin_url || "") ? c.admin_url : op.admin || box.device?.configuration_url || "";
    // The device name is left out when the title already contains it ("Huawei B535-232" over "B535-232").
    const sub = [devName && !name.toLowerCase().includes(devName.toLowerCase()) ? devName : null, firmware ? `${this._t("firmware")} ${firmware}` : null].filter(Boolean);
    // Icon of the kind of connection, tinted with the state of the internet link (online, syncing, offline,
    // unavailable) — the operator colour when the box exposes no link state — with the operator logo (every supported
    // operator has one) as a badge, opening its website.
    const line = lineIcon(lineOf(this._linkType(box), model?.name));
    const state = this._link(box)?.cls;
    const brand = `<a class="logo-link${state ? ` ${state}` : ""}" href="${esc(op.website)}" target="_blank" rel="noopener noreferrer" title="${esc(op.name)}">${
      op.logo ? `<img class="logo" src="${op.logo}" alt="${esc(op.name)}">` : ""
    }${line}</a>`;
    // The box picture only when the operator has a matching model drawing.
    // The generic form factors take the provider's colour; the French operators' drawings keep their own.
    const boxImg = modelPic(model, op.color) || null;
    return `
      <div class="header">
        ${c.show_logo !== false ? brand : ""}
        <div class="titles">
          <div class="name">${esc(name)}</div>
          ${withChips ? this._statusPill(box) : ""}
          <div class="sub"><div class="parts">${sub.map((x) => `<span>${esc(x)}</span>`).join("")}</div></div>
          ${withChips ? this._chips(box) : ""}
        </div>
        ${
          c.show_image !== false && boxImg
            ? `<a class="box-link" href="${esc(adminUrl)}" target="_blank" rel="noopener noreferrer" title="${esc(
                this._t("admin")
              )}"><img class="box" src="${boxImg}" alt="${esc(model.name)}"></a>`
            : ""
        }
        ${withChips ? this._restartBtn(box) : ""}
        ${this._headerEnd()}
      </div>`;
  }

  // End of the header, top right (the detail button of the mini card).
  _headerEnd() {
    return "";
  }

  _noBox() {
    return `<style>${BASE_STYLE}</style><ha-card><div class="warning">${esc(
      this._config.box ? `${this._t("unknown_box")}: ${this._config.box}` : this._t("no_box")
    )}</div></ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Full card
// ---------------------------------------------------------------------------

const ring = (pct) => {
  const r = 26;
  const c = 2 * Math.PI * r;
  const p = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  return `<svg class="ring" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="${r}" class="track"/>
    <circle cx="32" cy="32" r="${r}" class="value" stroke-dasharray="${((p / 100) * c).toFixed(1)} ${c.toFixed(1)}"/>
  </svg>`;
};

const FULL_STYLE = `
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 12px; }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin-bottom: 6px; }
  .section-title .icon { width: 16px; height: 16px; }
  .grid2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
  @container (max-width: 260px) { .grid2 { grid-template-columns: minmax(0, 1fr); } }
  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 6px; }
  .facts { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 12px; margin-top: 6px; }
  .facts > span { display: inline-flex; align-items: center; gap: 4px; min-width: 0; }
  .facts .icon { width: 14px; height: 14px; color: var(--secondary-text-color); }
  .facts .speedtest-fact > span { display: inline-flex; align-items: center; gap: 4px; }
  .facts .run { display: grid; place-items: center; width: 20px; height: 20px; padding: 0; margin-left: 2px; border: none;
    border-radius: 50%; cursor: pointer; background: transparent; color: inherit; }
  .facts .run:hover:not(:disabled) { background: color-mix(in srgb, var(--primary-color) 15%, transparent); }
  .facts .run:disabled { cursor: progress; }
  .gauges { display: grid; grid-template-columns: repeat(auto-fit, minmax(68px, 1fr)); gap: 6px; }
  .gauge { display: flex; flex-direction: column; align-items: center; position: relative; }
  .gauge .val .icon { width: 12px; height: 12px; }
  .ring { width: 52px; height: 52px; transform: rotate(-90deg); }
  .ring circle { fill: none; stroke-width: 6; }
  .ring .track { stroke: var(--divider-color, rgba(127,127,127,.25)); }
  .ring .value { stroke: var(--c, var(--ibc-accent)); stroke-linecap: round; transition: stroke-dasharray .6s ease; }
  .gauge .val { position: absolute; top: 0; height: 52px; display: flex; align-items: center; justify-content: center; }
  .gauge .val b { font-size: 14px; font-weight: 500; }
  .gauge .lbl { font-size: 12px; color: var(--secondary-text-color); margin-top: 0; text-align: center; white-space: nowrap;
                overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .fans { margin-top: 8px; gap: 6px; }
  .part { margin-bottom: 8px; display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: 8px; align-items: center; }
  .part .row { grid-column: 1; grid-row: 1; }
  .part:last-child { margin-bottom: 0; }
  .row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
  /* The partition name is the row's identifier: it keeps 5em, the disk model gives way (ellipsis). */
  .row .grow { flex: 1 1 auto; min-width: 5em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row .muted { flex: 0 1 auto; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .part .bar { margin: 4px 0 0; grid-column: 1 / -1; grid-row: 2; }
  .part .detail { font-size: 11px; color: var(--secondary-text-color); display: flex; justify-content: flex-end; grid-column: 2; grid-row: 1; gap: 8px; }
  /* Narrow card: used / free under the bar, so the partition name keeps the whole first line. */
  @container (max-width: 300px) {
    .part .row { grid-column: 1 / -1; }
    .part .detail { grid-column: 1 / -1; grid-row: 3; justify-content: space-between; margin-top: 2px; }
  }
  .tile.svc { --c: var(--secondary-text-color); }
  .tile.svc.ok { --c: var(--ibc-ok); } .tile.svc.warn { --c: var(--ibc-warn); }
  .tiles.svc-row { display: flex; flex-wrap: wrap; }
  .tiles.svc-row .tile { flex: 1 1 auto; }
  .tile:has(.reset, .toggle) { padding-right: 6px; }
  .tile .toggle { margin-left: auto; }
  .tile:has(.reset) .v { overflow: hidden; text-overflow: ellipsis; }
  .tile .reset { margin-left: auto; flex: none; display: grid; place-items: center; width: 22px; height: 22px; padding: 0;
    border: none; border-radius: 50%; cursor: pointer; color: color-mix(in srgb, var(--c) 60%, var(--primary-text-color));
    background: color-mix(in srgb, var(--c) 15%, transparent); }
  .tile .reset:hover { background: color-mix(in srgb, var(--c) 28%, transparent); }
  .tile .reset .icon { width: 14px; height: 14px; }
  .spin { animation: spin 1.6s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .spin { animation: none; } .ring .value { transition: none; } }
  /* Full card only (and the zoomed mini, which uses this style): its header also carries the status pill and the
     restart button, so on a narrow card the box picture gets smaller to leave room for the title, then is hidden.
     The compact mini keeps its full-size picture (MINI_STYLE). */
  @container (max-width: 460px) { .box { height: 38px; } }
  @container (max-width: 380px) { .box { height: 32px; } }
  /* Up to 340 px (9 to 12 columns of a phone section) the title, the status pill under it and the restart button
     need the whole header: with the picture the title block would be narrower than the whole pill text (up to
     135 px, "Fuera de línea · FTTH"). */
  @container (max-width: 340px) { .box-link { display: none; } }
  /* On a narrow full card the status pill would squeeze the title on its line; move it below the title (in the
     first column, under the name) so the title keeps the full width. */
  @container (max-width: 440px) {
    .titles > .chip.status { grid-column: 1; grid-row: auto; align-self: start; justify-self: start; margin: 4px 0 0; }
  }
  /* Narrower still (below 9 columns of a phone section): only the pill's coloured dot, back on the title line (its
     text stays its tooltip and label). */
  @container (max-width: 244px) {
    .titles > .chip.status { grid-column: 2; grid-row: 1; align-self: center; justify-self: end; margin: 0 0 0 6px; padding: 5px; }
    .chip.status .txt { display: none; }
  }
  /* At 6 columns of a narrow section: the dot goes to the subtitle line, the title takes the whole first line. */
  @container (max-width: 200px) {
    .titles > .name { grid-column: 1 / -1; }
    .titles > .chip.status { grid-row: 2; }
    /* The zoomed mini card has both the restart and the detail buttons: the logo gives them its place. */
    .header:has(.zoom) .logo-link { display: none; }
  }
`;

class InternetBoxCard extends InternetBoxBase {
  static getConfigElement() {
    return document.createElement("internet-box-card-editor");
  }

  static getStubConfig(hass) {
    const box = hass ? listBoxes(hass)[0] : null;
    return box ? { box: box.value } : {};
  }

  getCardSize() {
    return 7;
  }

  // Below 9 columns (about 240 px in a narrow section) the full card's tiles and gauges no longer fit.
  getGridOptions() {
    return { columns: 12, min_columns: 9 };
  }

  _render() {
    const box = boxFor(this._hass, this._config);
    if (!box.id) return this._noBox();
    const c = this._config;
    const parts = [];
    if (c.show_network !== false) parts.push(this._network(box));
    if (c.show_system !== false) parts.push(this._system(box));
    if (c.show_storage !== false) parts.push(this._storage(box));
    if (c.show_services !== false) parts.push(this._services(box));
    return `<style>${BASE_STYLE}${FULL_STYLE}</style>
      <ha-card style="--ibc-red:${brandOf(box, this._config).color}">
        ${this._header(box, true)}
        <div class="content">${parts.filter(Boolean).join("")}</div>
      </ha-card>`;
  }

  _network(box) {
    const sc = box.scalars;
    const rates = sc.rate_down || sc.rate_up || sc.sync_down || sc.sync_up;
    const router = this._s(sc.router);
    const facts = [];
    // Public IP: the router tracker's attributes (Freebox), else the integration's external IP sensors.
    const ip4 = this._s(sc.ip);
    const ip6 = this._s(sc.ip6);
    const ip = router?.attributes?.IPv4
      ? { entity: router.entity_id, v4: router.attributes.IPv4, v6: router.attributes.IPv6 }
      : ip4 && !noValue(ip4)
        ? { entity: ip4.entity_id, v4: ip4.state, v6: ip6 && !noValue(ip6) ? ip6.state : "" }
        : null;
    if (ip)
      facts.push(
        `<span class="clickable" role="button" tabindex="0" data-entity="${ip.entity}" title="${esc(ip.v6 || "")}">${svgIcon(ICONS.ip)}${esc(ip.v4)}</span>`
      );
    const up = this._uptime(router, box);
    if (up !== null)
      facts.push(
        `<span class="clickable" role="button" tabindex="0" data-entity="${this._uptimeEntity(router, box)}">${svgIcon(ICONS.timer)}${this._t("uptime")} ${fmtUptime(
          up,
          this._hass,
          this._config
        )}</span>`
      );
    const sp = this._config.show_speedtest !== false ? discoverSpeedtest(this._hass, this._config) : null;
    if (sp) {
      const dl = this._s(sp.download);
      const ul = this._s(sp.upload);
      const ping = Number.parseFloat(this._s(sp.ping)?.state);
      const parts = [
        dl ? `↓ ${fmtRate(toBps(dl), this._hass, this._config)}` : "",
        ul ? `↑ ${fmtRate(toBps(ul), this._hass, this._config)}` : "",
        Number.isFinite(ping) ? `${Math.round(ping)} ms` : "",
      ].filter(Boolean);
      const when = (dl || ul)?.last_changed;
      facts.push(
        `<span class="speedtest-fact"><span class="clickable speedtest" role="button" tabindex="0" data-entity="${sp.download || sp.upload}" title="${esc(
          `${this._t("speedtest")}${when ? ` · ${new Date(when).toLocaleString(numLang(this._hass, this._config))}` : ""}`
        )}">${svgIcon(ICONS.speedtest)}${esc(parts.join(" · "))}</span>${this._speedtestButton(sp)}</span>`
      );
    }
    // Without any rate or sync sensor, the IP address and the uptime are still shown.
    if (!rates && !facts.length) return "";
    const hist = !rates || this._config.show_history === false ? null : this._history([sc.rate_down, sc.rate_up].filter(Boolean));
    return `<div>
      <div class="section-title">${svgIcon(ICONS.network)}${this._t("network")}</div>
      ${rates ? `<div class="grid2">${this._rateTiles(sc, hist)}</div>` : ""}
      ${facts.length ? `<div class="facts">${facts.join("")}</div>` : ""}
    </div>`;
  }

  // The button that starts a speed test, its icon turning while the test runs.
  _speedtestButton(sp) {
    if (!sp.run || this._s(sp.run)?.state === "unavailable") return "";
    const running = this._speedtestRunning(sp);
    const label = esc(this._t(running ? "speedtest_running" : "run_speedtest"));
    return `<button type="button" class="run" data-action="speedtest" title="${label}" aria-label="${label}"${
      running ? ' aria-busy="true" disabled' : ""
    }>${svgIcon(ICONS.refresh, running ? "spin" : "")}</button>`;
  }

  _system(box) {
    if (!box.temps.length && !box.fans.length) return "";
    // "Température CPU 0" -> "CPU 0", "Température 1" -> "Temp. 1"; CPU sensors first.
    const temps = box.temps
      .map(({ id, name }) => {
        const short = name.replace(/^(temp[ée]rature|temp\.?)\s+/i, "");
        return { id, name, label: /^\d+$/.test(short) ? `${this._t("temperature")} ${short}` : short };
      })
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
    const gauges = temps.map(({ id, name, label }) => {
      // Thresholds and gauge (0-100) in °C, whatever unit the sensor reports; the value in its own unit.
      const { raw, c } = temperature(this._s(id));
      return `<div class="gauge clickable ${this._level(c, "temp")}" role="button" tabindex="0" data-key="${id}" data-entity="${id}" title="${esc(name)}">
        ${ring(c)}
        <div class="val"><b>${raw === null ? "—" : `${Math.round(raw)}°`}</b></div>
        <div class="lbl">${esc(label)}</div>
      </div>`;
    });
    const fans = box.fans.map(({ id, name }) => {
      const rpm = num(this._s(id));
      return `<div class="tile clickable" role="button" tabindex="0" data-key="${id}" data-entity="${id}">${svgIcon(ICONS.fan, rpm ? "spin" : "")}<div><div class="k">${esc(
        name
      )}</div><div class="v">${rpm === null ? "—" : `${Math.round(rpm)} ${this._t("rpm")}`}</div></div></div>`;
    });
    return `<div>
      <div class="section-title">${svgIcon(ICONS.temp)}${this._t("system")}</div>
      ${gauges.length ? `<div class="gauges">${gauges.join("")}</div>` : ""}
      ${fans.length ? `<div class="tiles fans">${fans.join("")}</div>` : ""}
    </div>`;
  }

  _storage(box) {
    const rows = box.partitions.map((p) => {
      const free = num(this._s(p.id));
      const used = free === null ? null : Math.max(0, Math.min(100, 100 - free));
      const cls = this._level(used, "disk");
      return `<div class="part clickable ${cls}" role="button" tabindex="0" data-key="${p.id}" data-entity="${p.id}">
        <div class="row"><span class="dot ${used === null ? "off" : cls || "ok"}"></span><span class="grow">${esc(partitionLabel(this._hass, p, this._t("disk")))}</span>
          <span class="muted">${esc(p.device?.model || "")}</span></div>
        <div class="bar"><div style="width:${used ?? 0}%"></div></div>
        <div class="detail"><span>${used === null ? "—" : `${Math.round(used)}% ${this._t("used")}`}</span>
          <span>${free === null ? "" : `${Math.round(free)}% ${this._t("free")}`}</span></div>
      </div>`;
    });
    for (const id of box.raids) {
      const degraded = this._s(id)?.state === "on";
      const cls = noValue(this._s(id)) ? "off" : degraded ? "crit" : "ok";
      const text = cls === "off" ? "unavailable" : degraded ? "raid_degraded" : "raid_ok";
      rows.push(`<div class="row clickable" role="button" tabindex="0" data-key="${id}" data-entity="${id}"><span class="dot ${cls}"></span>
        <span class="grow">${esc(shortName(this._hass, id, box.device))}</span>
        <span class="chip ${cls}">${this._t(text)}</span></div>`);
    }
    if (!rows.length) return "";
    return `<div><div class="section-title">${svgIcon(ICONS.database)}${this._t("storage")}</div>${rows.join("")}</div>`;
  }

  _services(box) {
    const sc = box.scalars;
    const tiles = [];
    const wifi = this._s(sc.wifi);
    if (wifi) {
      const on = wifi.state === "on";
      const unknown = noValue(wifi);
      // As on the Calls tile, the keyboard target is the label: the switch must not sit inside a role="button".
      tiles.push(`<div class="tile svc clickable ${on ? "ok" : unknown ? "off" : ""}" data-key="${wifi.entity_id}" data-entity="${
        wifi.entity_id
      }">${svgIcon(on || unknown ? ICONS.wifi : ICONS.wifi_off)}<div role="button" tabindex="0"><div class="k">${this._t("wifi")}</div><div class="v">${this._t(
        unknown ? "unavailable" : on ? "on" : "off"
      )}</div></div>${this._wifiToggle(wifi)}</div>`);
    }
    const calls = this._missedCalls(sc);
    if (calls) {
      const { missed, n, reset } = calls;
      // The keyboard target is the label, not the whole tile: the "mark as read" button must not sit inside
      // a role="button" element. A click anywhere on the tile still opens the more-info dialog (data-entity).
      const value = n === null ? this._t("unavailable") : `${n} ${this._tn("missed", n)}`;
      tiles.push(`<div class="tile svc clickable ${n > 0 ? "warn" : n === null ? "off" : ""}" data-key="${missed.entity_id}" data-entity="${
        missed.entity_id
      }">${svgIcon(n > 0 ? ICONS.phone_missed : ICONS.phone)}<div role="button" tabindex="0"><div class="k">${this._t(
        "calls"
      )}</div><div class="v">${value}</div></div>${reset}</div>`);
    }
    if (box.trackers.length) {
      // Unavailable / unknown trackers are left out of the count; when none is known, the tile says so.
      const known = box.trackers.filter((id) => !noValue(this._s(id)));
      const home = known.filter((id) => this._s(id).state === "home").length;
      tiles.push(`<div class="tile svc ${known.length ? "ok" : "off"}" data-key="devices"><span>${svgIcon(ICONS.devices)}</span><div><div class="k">${this._t(
        "devices_short"
      )}</div><div class="v">${known.length ? `${home} / ${known.length}` : this._t("unavailable")}</div></div></div>`);
    }
    if (!tiles.length) return "";
    return `<div><div class="section-title">${svgIcon(ICONS.services)}${this._t("services")}</div><div class="tiles svc-row">${tiles.join(
      ""
    )}</div></div>`;
  }
}

// ---------------------------------------------------------------------------
// Mini card
// ---------------------------------------------------------------------------

const MINI_STYLE = `
  :host::before { grid-template-columns: minmax(0, 240px); }
  .box-link { max-width: 35%; }
  .box { height: 44px; }
  @container (max-width: 260px) { .box { height: 28px; } }
  .name { font-size: 16px; }
  .content { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 8px; }
  .grid2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  /* Too narrow for two rates side by side: one under the other. */
  @container (max-width: 260px) { .grid2 { grid-template-columns: minmax(0, 1fr); } }
  .tile { padding: 6px 8px; gap: 8px; }
  .tile .v { font-size: 14px; }
  .foot { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 4px 8px; font-size: 12px;
          color: var(--secondary-text-color); margin-top: 2px; }
  .foot span { display: inline-flex; align-items: center; gap: 3px; }
  .foot .icon { width: 14px; height: 14px; }
  .foot .ok .icon { color: color-mix(in srgb, var(--ibc-ok) 60%, var(--primary-text-color)); }
  .foot .warn { color: color-mix(in srgb, var(--ibc-warn) 50%, var(--primary-text-color)); }
  .foot .crit { color: color-mix(in srgb, var(--ibc-crit) 50%, var(--primary-text-color)); }
  .foot .reset { display: grid; place-items: center; width: 18px; height: 18px; padding: 0; margin-left: 3px; border: none;
    border-radius: 50%; cursor: pointer; color: color-mix(in srgb, var(--ibc-warn) 60%, var(--primary-text-color));
    background: color-mix(in srgb, var(--ibc-warn) 15%, transparent); }
  .foot .reset:hover { background: color-mix(in srgb, var(--ibc-warn) 28%, transparent); }
  .foot .reset .icon { width: 12px; height: 12px; }
  .foot .toggle { margin-left: 3px; width: 24px; height: 14px; }
  .foot .toggle::after { width: 7px; height: 7px; }
  .foot .toggle[aria-checked="true"]::after { transform: translateX(10px); }
`;

// The detail button (top right, `zoom: false` removes it) switches the mini card to the full card, with the
// same configuration, and back; a click anywhere outside the card (or a dialog opened from it) brings it back too.
class InternetBoxMiniCard extends InternetBoxCard {
  static getConfigElement() {
    return document.createElement("internet-box-mini-card-editor");
  }

  constructor() {
    super();
    this._zoomed = false;
    this.shadowRoot.addEventListener("click", (ev) => {
      if (!ev.composedPath().some((n) => n.classList?.contains("zoom"))) return;
      ev.stopPropagation();
      this._zoom(!this._zoomed);
      // Keyboard use (Enter / Space: no click count) keeps the focus on the button of the new view.
      // The button is a new element after the re-render: moving the focus to it must not scroll the page.
      if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
    });
    this._onOutside = (ev) => {
      const path = ev.composedPath();
      // The click that closed the restart popup only closes it.
      if (ev === this._dialogClosingClick) return;
      if (this._zoomed && !path.includes(this) && !inDialog(path)) this._zoom(false);
    };
  }

  connectedCallback() {
    super.connectedCallback?.();
    document.addEventListener("click", this._onOutside, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    document.removeEventListener("click", this._onOutside, true);
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 3;
  }

  getGridOptions() {
    return this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 };
  }

  _zoom(on) {
    if (this._zoomed === on) return;
    this._zoomed = on;
    this._update();
  }

  _headerEnd() {
    if (this._config.zoom === false) return "";
    const label = esc(this._t(this._zoomed ? "zoom_out" : "zoom_in"));
    return `<button class="zoom" title="${label}" aria-label="${label}">${svgIcon(this._zoomed ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _render() {
    return this._zoomed ? super._render() : this._renderMini();
  }

  _renderMini() {
    const box = boxFor(this._hass, this._config);
    if (!box.id) return this._noBox();
    const c = this._config;
    const sc = box.scalars;
    const parts = [];
    if (c.show_network !== false && (sc.rate_down || sc.rate_up || sc.sync_down || sc.sync_up)) {
      // The same 24 h curves as the full card, behind the compact rate tiles.
      const hist = c.show_history === false ? null : this._history([sc.rate_down, sc.rate_up].filter(Boolean));
      parts.push(`<div class="grid2">${this._rateTiles(sc, hist)}</div>`);
    }
    const foot = [];
    const router = this._s(sc.router);
    const link = this._link(box);
    if (link) {
      // The kind of line when the link is up or plainly down (coloured), the reason when the DSL line gives one.
      const text =
        link.cls === "off" ? this._t("unavailable") : (["online", "offline"].includes(link.key) && link.type) || this._t(link.key).toUpperCase();
      foot.push(`<span class="clickable ${link.cls}" role="button" tabindex="0" data-key="router" data-entity="${link.entity}"><span class="dot"></span>&nbsp;${esc(
        text
      )}</span>`);
    }
    if (c.show_system !== false && box.temps.length) {
      let hottest = null;
      for (const tmp of box.temps) {
        const v = temperature(this._s(tmp.id));
        if (v.c !== null && (!hottest || v.c > hottest.c)) hottest = { ...v, id: tmp.id };
      }
      if (hottest)
        foot.push(`<span class="clickable ${this._level(hottest.c, "temp")}" role="button" tabindex="0" data-key="hottest" data-entity="${hottest.id}">${svgIcon(ICONS.temp)}${Math.round(
          hottest.raw
        )}${esc(hottest.unit)}</span>`);
    }
    const wifi = this._s(sc.wifi);
    if (wifi) {
      // Unavailable: a neutral Wi-Fi icon and "—", the state in the tooltip and accessible name.
      const on = wifi.state === "on";
      const unknown = noValue(wifi);
      const label = unknown ? ` title="${esc(`${this._t("wifi")} · ${this._t("unavailable")}`)}" aria-label="${esc(`${this._t("wifi")} · ${this._t("unavailable")}`)}"` : "";
      foot.push(`<span class="clickable ${on ? "ok" : unknown ? "off" : ""}" data-key="${wifi.entity_id}" data-entity="${wifi.entity_id}"><span role="button" tabindex="0"${label}>${svgIcon(
        on || unknown ? ICONS.wifi : ICONS.wifi_off
      )}${this._t("wifi")}${unknown ? " —" : ""}</span>${this._wifiToggle(wifi)}</span>`);
    }
    // Missed calls, always shown when the box reports them: in orange with "mark as read" when there are some,
    // plain at 0, as on the Calls tile of the full card.
    const calls = this._missedCalls(sc);
    if (calls) {
      const { missed, n, reset } = calls;
      // Same as the tile of the full card: the "mark as read" button stays outside the role="button" element.
      const label = `${this._t("calls")} · ${n === null ? this._t("unavailable") : `${n} ${this._tn("missed", n)}`}`;
      foot.push(`<span class="clickable ${n > 0 ? "warn" : n === null ? "off" : ""}" data-key="${missed.entity_id}" data-entity="${missed.entity_id}" title="${esc(
        label
      )}"><span role="button" tabindex="0" aria-label="${esc(label)}">${svgIcon(n > 0 ? ICONS.phone_missed : ICONS.phone)}${n ?? "—"}</span>${reset}</span>`);
    }
    const up = this._uptime(router, box);
    if (up !== null) foot.push(`<span data-key="uptime">${svgIcon(ICONS.timer)}${fmtUptime(up, this._hass, this._config)}</span>`);
    return `<style>${BASE_STYLE}${MINI_STYLE}</style>
      <ha-card style="--ibc-red:${brandOf(box, this._config).color}">
        ${this._header(box, false)}
        <div class="content">
          ${parts.join("")}
          ${foot.length ? `<div class="foot">${foot.join("")}</div>` : ""}
        </div>
      </ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

class InternetBoxEditorBase extends HTMLElement {
  static get toggles() {
    return [];
  }

  setConfig(config) {
    this._config = normalizeConfig(config);
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema() {
    const boxOptions = this._hass ? listBoxes(this._hass) : [];
    const tr = (k) => t(this._hass, this._config, k);
    const box = this._hass ? discover(this._hass, this._config.box) : undefined;
    const detected = box ? detectModel(box) : undefined;
    const autoModel = detected ? `${tr("model_auto")} (${detected.name})` : tr("model_auto");
    return [
      {
        name: "box",
        selector: { select: { mode: "dropdown", custom_value: true, options: boxOptions } },
      },
      { name: "title", selector: { text: {} } },
      {
        name: "model",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "", label: autoModel },
              ...(box?.operator?.models ?? MODELS).map((m) => ({ value: m.id, label: m.name })),
            ],
          },
        },
      },
      { name: "admin_url", selector: { text: { type: "url" } } },
      {
        type: "grid",
        name: "",
        schema: [
          { name: "show_title", selector: { boolean: {} } },
          { name: "show_subtitle", selector: { boolean: {} } },
          { name: "show_image", selector: { boolean: {} } },
          { name: "show_logo", selector: { boolean: {} } },
          ...this.constructor.toggles.map((name) => ({ name, selector: { boolean: {} } })),
        ],
      },
      // Warning / critical thresholds, shown at their default values.
      {
        type: "grid",
        name: "",
        schema: Object.keys(THRESHOLDS).map((name) => ({
          name,
          selector: { number: { min: 0, max: name.startsWith("temp") ? 150 : 100, step: 1, mode: "box", unit_of_measurement: name.startsWith("temp") ? "°C" : "%" } },
        })),
      },
      // Sensors of the user's choice: the box's rates, and another speed test than Speedtest.net (LibreSpeed…). Saved under
      // `entities`, as the YAML option (which takes the other box values too).
      {
        type: "expandable",
        name: "entities",
        title: tr("entities"),
        schema: [
          ...["rate_down", "rate_up"].map((name) => ({ name, selector: { entity: { domain: "sensor" } } })),
          {
            type: "expandable",
            name: "speedtest",
            title: tr("speedtest"),
            schema: [
              ...SPEEDTEST_KEYS.map((name) => ({ name, selector: { entity: { domain: "sensor" } } })),
              { name: "run", selector: { entity: { domain: ["button", "input_button", "script", "automation"] } } },
            ],
          },
        ],
      },
      {
        name: "rate_unit",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "bytes", label: tr("unit_bytes") },
              { value: "bits", label: tr("unit_bits") },
            ],
          },
        },
      },
      {
        name: "language",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "", label: tr("lang_auto") },
              { value: "en", label: "English" },
              { value: "fr", label: "Français" },
              { value: "de", label: "Deutsch" },
              { value: "es", label: "Español" },
              { value: "sr", label: "Српски" },
              { value: "sr-Latn", label: "Srpski (latinica)" },
              { value: "it", label: "Italiano" },
              { value: "nl", label: "Nederlands" },
              { value: "pt", label: "Português (Portugal)" },
              { value: "pl", label: "Polski" },
              { value: "ro", label: "Română" },
              { value: "da", label: "Dansk" },
              { value: "sv", label: "Svenska" },
              { value: "bg", label: "Български" },
              { value: "ru", label: "Русский" },
              { value: "uk", label: "Українська" },
              { value: "hu", label: "Magyar" },
              { value: "sk", label: "Slovenčina" },
              { value: "cs", label: "Čeština" },
              { value: "sl", label: "Slovenščina" },
              { value: "lv", label: "Latviešu" },
              { value: "el", label: "Ελληνικά" },
            ],
          },
        },
      },
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      // The pickers of `entities` share their names with no other field: their own labels.
      this._form.computeLabel = (s) => t(this._hass, this._config, EDITOR_ENTITIES.has(s.name) ? `ent_${s.name}` : s.name);
      this._form.computeHelper = (s) => (STRINGS.en[`${s.name}_helper`] ? t(this._hass, this._config, `${s.name}_helper`) : undefined);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value, entities: cleanEntities(ev.detail.value.entities) };
        // Another box of another operator: a model picked for the former one is not among the new operator's
        // models (and would be silently ignored), so it is cleared.
        if (config.box !== this._config.box && config.model) {
          const models = discover(this._hass, config.box).operator?.models ?? MODELS;
          if (!models.some((m) => m.id === config.model)) delete config.model;
        }
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values and options left at their default.
          if (
            v === "" ||
            v === undefined ||
            v === null ||
            ((k.startsWith("show_") || k === "zoom") && v === true) ||
            (k === "rate_unit" && v === "bytes") ||
            THRESHOLDS[k] === v
          )
            delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    // No box set: the card shows the first one found, so the editor selects it and writes it to the config.
    if (!this._config.box) {
      const first = listBoxes(this._hass)[0]?.value;
      if (first) {
        this._config = { ...this._config, box: first };
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
      }
    }
    const data = { rate_unit: "bytes", model: "", ...THRESHOLDS, ...this._config };
    for (const name of ["show_title", "show_subtitle", "show_image", "show_logo", ...this.constructor.toggles]) if (data[name] === undefined) data[name] = true;
    this._form.hass = this._hass;
    this._form.data = data;
    // The schema is rebuilt on every hass update (every state change) but only handed to the form when its
    // options (boxes, models, detected model, language) changed, so ha-form does not re-render for nothing.
    const schema = this._schema();
    const key = JSON.stringify(schema);
    if (key !== this._schemaKey) {
      this._schemaKey = key;
      this._form.schema = schema;
    }
  }
}

class InternetBoxCardEditor extends InternetBoxEditorBase {
  static get toggles() {
    return ["show_network", "show_history", "show_speedtest", "show_system", "show_storage", "show_services"];
  }
}

class InternetBoxMiniCardEditor extends InternetBoxEditorBase {
  static get toggles() {
    return ["show_network", "show_history", "show_system", "zoom"];
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
};
define("internet-box-card", InternetBoxCard);
define("internet-box-mini-card", InternetBoxMiniCard);
// Former types, kept so that existing dashboards keep working: same cards under another name. A custom element class
// can only be defined once, hence the subclasses.
for (const [name, base] of [
  ["freebox-card", InternetBoxCard],
  ["freebox-mini-card", InternetBoxMiniCard],
])
  define(name, class extends base {});
define("internet-box-card-editor", InternetBoxCardEditor);
define("internet-box-mini-card-editor", InternetBoxMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "internet-box-card",
    name: "Internet Box Card",
    description: "Monitor an internet box (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink): download / upload, temperatures, fans, storage, Wi-Fi, calls and connected devices.",
  },
  {
    type: "internet-box-mini-card",
    name: "Internet Box Mini Card",
    description: "Compact internet box overview (Freebox, Livebox, SFR Box, Bbox, FRITZ!Box, Vodafone Station, Swisscom, Sagemcom F@st, Huawei LTE, ZTE Hyperbox, Starlink): download / upload, connection, temperature, Wi-Fi and uptime, with a button to show the full card.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/juju35/ha-internet-box-card" });
}

console.info(
  `%c INTERNET-BOX-CARD %c v${VERSION} `,
  "color: white; background: #455a64; font-weight: 700;",
  "color: #455a64; background: white; font-weight: 700;"
);
