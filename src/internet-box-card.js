/*
 * Internet Box Card for Home Assistant
 * https://github.com/juju35/ha-internet-box-card
 *
 * Lovelace cards for internet boxes: the Freebox, Livebox (Orange), SFR Box and Bbox (Bouygues) integrations.
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

const svgUri = (svg) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
// Pictures of the box models, by model id (Freebox, Livebox, SFR Box, Bbox).
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
  timer: "M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39M11,14H13V8H11M15,1H9V3H15V1Z",
  network: "M13,19H14A1,1 0 0,1 15,20H22V22H15A1,1 0 0,1 14,23H10A1,1 0 0,1 9,22H2V20H9A1,1 0 0,1 10,19H11V17H4A1,1 0 0,1 3,16V12A1,1 0 0,1 4,11H20A1,1 0 0,1 21,12V16A1,1 0 0,1 20,17H13V19M4,3H20A1,1 0 0,1 21,4V8A1,1 0 0,1 20,9H4A1,1 0 0,1 3,8V4A1,1 0 0,1 4,3M9,7H10V5H9V7M9,15H10V13H9V15M5,5V7H7V5H5M5,13V15H7V13H5Z",
  ip: "M16.36,14C16.44,13.34 16.5,12.68 16.5,12C16.5,11.32 16.44,10.66 16.36,10H19.74C19.9,10.64 20,11.31 20,12C20,12.69 19.9,13.36 19.74,14M14.59,19.56C15.19,18.45 15.65,17.25 15.97,16H18.92C17.96,17.65 16.43,18.93 14.59,19.56M14.34,14H9.66C9.56,13.34 9.5,12.68 9.5,12C9.5,11.32 9.56,10.65 9.66,10H14.34C14.43,10.65 14.5,11.32 14.5,12C14.5,12.68 14.43,13.34 14.34,14M12,19.96C11.17,18.76 10.5,17.43 10.09,16H13.91C13.5,17.43 12.83,18.76 12,19.96M8,8H5.08C6.03,6.34 7.57,5.06 9.4,4.44C8.8,5.55 8.35,6.75 8,8M5.08,16H8C8.35,17.25 8.8,18.45 9.4,19.56C7.57,18.93 6.03,17.65 5.08,16M4.26,14C4.1,13.36 4,12.69 4,12C4,11.31 4.1,10.64 4.26,10H7.64C7.56,10.66 7.5,11.32 7.5,12C7.5,12.68 7.56,13.34 7.64,14M12,4.03C12.83,5.23 13.5,6.57 13.91,8H10.09C10.5,6.57 11.17,5.23 12,4.03M18.92,8H15.97C15.65,6.75 15.19,5.55 14.59,4.44C16.43,5.07 17.96,6.34 18.92,8M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
  devices: "M3,6H21V4H3C1.9,4 1,4.9 1,6V18A2,2 0 0,0 3,20H7V18H3V6M13,12H9V13.78C8.39,14.33 8,15.11 8,16C8,16.89 8.39,17.67 9,18.22V20H13V18.22C13.61,17.67 14,16.88 14,16C14,15.12 13.61,14.33 13,13.78V12M11,17.5A1.5,1.5 0 0,1 9.5,16A1.5,1.5 0 0,1 11,14.5A1.5,1.5 0 0,1 12.5,16A1.5,1.5 0 0,1 11,17.5M22,8H16A1,1 0 0,0 15,9V19A1,1 0 0,0 16,20H22A1,1 0 0,0 23,19V9A1,1 0 0,0 22,8M21,18H17V10H21V18Z",
  wifi: "M12,21L15.6,16.2C14.6,15.45 13.35,15 12,15C10.65,15 9.4,15.45 8.4,16.2L12,21M12,3C7.95,3 4.21,4.34 1.2,6.6L3,9C5.5,7.12 8.62,6 12,6C15.38,6 18.5,7.12 21,9L22.8,6.6C19.79,4.34 16.05,3 12,3M12,9C9.3,9 6.81,9.89 4.8,11.4L6.6,13.8C8.1,12.67 9.97,12 12,12C14.03,12 15.9,12.67 17.4,13.8L19.2,11.4C17.19,9.89 14.7,9 12,9Z",
  wifi_off: "M2.28,3L1,4.27L2.47,5.74C2.04,6 1.61,6.29 1.2,6.6L3,9C3.39,8.7 3.82,8.42 4.26,8.16L6.5,10.4C5.9,10.68 5.33,11 4.8,11.4L6.6,13.8C7.14,13.4 7.73,13.06 8.35,12.79L10.88,15.32C10,15.5 9.13,15.79 8.4,16.2L12,21L14.88,17.17L19.73,22L21,20.72L3.28,3H2.28M12,3C10.08,3 8.24,3.3 6.5,3.85L8.97,6.32C9.95,6.11 10.96,6 12,6C15.38,6 18.5,7.12 21,9L22.8,6.6C19.79,4.34 16.05,3 12,3M12,9C11.62,9 11.25,9 10.88,9.05L14.15,12.32C15.32,12.6 16.43,13.09 17.4,13.8L19.2,11.4C17.19,9.89 14.7,9 12,9Z",
  check: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.58L21,7Z",
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
    calls: "Calls",
    missed: "missed",
    temperature: "Temp.",
    used: "used",
    free: "free",
    raid_ok: "OK",
    raid_degraded: "Degraded",
    online: "Online",
    offline: "Offline",
    unavailable: "Unavailable",
    hours: "h",
    days: "d",
    minutes: "min",
    rpm: "rpm",
    disk: "Disk",
    no_box: "No internet box found. Is a supported integration (Freebox, Livebox, SFR Box, Bbox) installed?",
    unknown_box: "Internet box not found",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    // Editor
    box: "Internet box (integration device)",
    title: "Title (optional, defaults to the box model)",
    model: "Box model (picture and default title)",
    model_auto: "Automatic",
    show_image: "Show the box picture",
    admin: "Open the box admin interface",
    admin_url: "Box admin address (optional, opened when clicking the picture)",
    show_logo: "Show the operator logo",
    show_network: "Show network",
    show_system: "Show system (temperatures, fans)",
    show_storage: "Show storage",
    show_services: "Show services (Wi-Fi, calls, devices)",
    zoom: "Detail button",
    zoom_helper: "Button at the top right that shows the full card in place of the mini card, and back",
    rate_unit: "Rate unit",
    unit_bytes: "Bytes (kB/s, MB/s)",
    unit_bits: "Bits (kb/s, Mb/s)",
    language: "Language",
    lang_auto: "Automatic",
  },
  fr: {
    network: "Réseau",
    system: "Système",
    storage: "Stockage",
    services: "Services",
    download: "Réception",
    upload: "Envoi",
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
    unavailable: "Indisponible",
    hours: "h",
    days: "j",
    minutes: "min",
    rpm: "tr/min",
    disk: "Disque",
    no_box: "Aucune box internet trouvée. Une intégration compatible (Freebox, Livebox, SFR Box, Bbox) est-elle installée ?",
    unknown_box: "Box internet introuvable",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    box: "Box internet (appareil de l'intégration)",
    title: "Titre (facultatif, modèle de la box par défaut)",
    model: "Modèle de la box (illustration et titre par défaut)",
    model_auto: "Automatique",
    show_image: "Afficher l'illustration de la box",
    admin: "Ouvrir l'interface d'administration de la box",
    admin_url: "Adresse d'administration de la box (facultatif, ouverte au clic sur l'illustration)",
    show_logo: "Afficher le logo de l'opérateur",
    show_network: "Afficher le réseau",
    show_system: "Afficher le système (températures, ventilateurs)",
    show_storage: "Afficher le stockage",
    show_services: "Afficher les services (Wi-Fi, appels, appareils)",
    zoom: "Bouton détail",
    zoom_helper: "Bouton en haut à droite qui affiche la carte complète à la place de la mini carte, et inversement",
    rate_unit: "Unité des débits",
    unit_bytes: "Octets (ko/s, Mo/s)",
    unit_bits: "Bits (kb/s, Mb/s)",
    language: "Langue",
    lang_auto: "Automatique",
  },
  de: {
    network: "Netzwerk",
    system: "System",
    storage: "Speicher",
    services: "Dienste",
    download: "Download",
    upload: "Upload",
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
    calls: "Anrufe",
    missed: "verpasst",
    temperature: "Temp.",
    used: "belegt",
    free: "frei",
    raid_ok: "OK",
    raid_degraded: "Beeinträchtigt",
    online: "Verbunden",
    offline: "Getrennt",
    unavailable: "Nicht verfügbar",
    hours: "h",
    days: "Tg.",
    minutes: "Min.",
    rpm: "U/min",
    disk: "Datenträger",
    no_box: "Keine Internetbox gefunden. Ist eine unterstützte Integration (Freebox, Livebox, SFR Box, Bbox) installiert?",
    unknown_box: "Internetbox nicht gefunden",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    box: "Internetbox (Gerät der Integration)",
    title: "Titel (optional, standardmäßig das Boxmodell)",
    model: "Boxmodell (Bild und Standardtitel)",
    model_auto: "Automatisch",
    show_image: "Bild der Box anzeigen",
    admin: "Verwaltungsoberfläche der Box öffnen",
    admin_url: "Verwaltungsadresse der Box (optional, wird beim Klick auf das Bild geöffnet)",
    show_logo: "Logo des Anbieters anzeigen",
    show_network: "Netzwerk anzeigen",
    show_system: "System anzeigen (Temperaturen, Lüfter)",
    show_storage: "Speicher anzeigen",
    show_services: "Dienste anzeigen (WLAN, Anrufe, Geräte)",
    zoom: "Detail-Schaltfläche",
    zoom_helper: "Schaltfläche oben rechts, die anstelle der Mini-Karte die vollständige Karte anzeigt und umgekehrt",
    rate_unit: "Einheit der Datenrate",
    unit_bytes: "Bytes (kB/s, MB/s)",
    unit_bits: "Bits (kb/s, Mb/s)",
    language: "Sprache",
    lang_auto: "Automatisch",
  },
  es: {
    network: "Red",
    system: "Sistema",
    storage: "Almacenamiento",
    services: "Servicios",
    download: "Descarga",
    upload: "Subida",
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
    unavailable: "No disponible",
    hours: "h",
    days: "d",
    minutes: "min",
    rpm: "rpm",
    disk: "Disco",
    no_box: "No se ha encontrado ningún router de internet. ¿Hay instalada una integración compatible (Freebox, Livebox, SFR Box, Bbox)?",
    unknown_box: "Router de internet no encontrado",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    box: "Router de internet (dispositivo de la integración)",
    title: "Título (opcional, por defecto el modelo del router)",
    model: "Modelo del router (imagen y título por defecto)",
    model_auto: "Automático",
    show_image: "Mostrar la imagen del router",
    admin: "Abrir la interfaz de administración del router",
    admin_url: "Dirección de administración del router (opcional, se abre al hacer clic en la imagen)",
    show_logo: "Mostrar el logotipo del operador",
    show_network: "Mostrar la red",
    show_system: "Mostrar el sistema (temperaturas, ventiladores)",
    show_storage: "Mostrar el almacenamiento",
    show_services: "Mostrar los servicios (Wi-Fi, llamadas, dispositivos)",
    zoom: "Botón de detalle",
    zoom_helper: "Botón arriba a la derecha que muestra la tarjeta completa en lugar de la minitarjeta, y viceversa",
    rate_unit: "Unidad de velocidad",
    unit_bytes: "Bytes (kB/s, MB/s)",
    unit_bits: "Bits (kb/s, Mb/s)",
    language: "Idioma",
    lang_auto: "Automático",
  },
  sr: {
    network: "Мрежа",
    system: "Систем",
    storage: "Складиште",
    services: "Услуге",
    download: "Преузимање",
    upload: "Слање",
    uptime: "Време рада",
    firmware: "Фирмвер",
    devices_short: "Уређаји",
    wifi: "Wi-Fi",
    wifi_on: "Wi-Fi укључен",
    wifi_off: "Wi-Fi искључен",
    on: "Укључено",
    off: "Искључено",
    mark_read: "Означи позиве као прочитане",
    restart: "Поново покрени рутер",
    restart_confirm: "Поново покренути рутер сада? Интернет, телефонска и ТВ веза биће прекинуте на неколико минута.",
    restart_btn: "Поново покрени",
    cancel: "Откажи",
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
    unavailable: "Недоступно",
    hours: "h",
    days: "d",
    minutes: "min",
    rpm: "о/мин",
    disk: "Диск",
    no_box: "Није пронађен ниједан интернет рутер. Да ли је инсталирана подржана интеграција (Freebox, Livebox, SFR Box, Bbox)?",
    unknown_box: "Интернет рутер није пронађен",
    zoom_in: "Прикажи целу картицу",
    zoom_out: "Назад на компактни приказ",
    box: "Интернет рутер (уређај интеграције)",
    title: "Наслов (опционо, подразумевано је модел рутера)",
    model: "Модел рутера (слика и подразумевани наслов)",
    model_auto: "Аутоматски",
    show_image: "Прикажи слику рутера",
    admin: "Отвори администраторски интерфејс рутера",
    admin_url: "Администраторска адреса рутера (опционо, отвара се кликом на слику)",
    show_logo: "Прикажи лого оператера",
    show_network: "Прикажи мрежу",
    show_system: "Прикажи систем (температуре, вентилатори)",
    show_storage: "Прикажи складиште",
    show_services: "Прикажи услуге (Wi-Fi, позиви, уређаји)",
    zoom: "Дугме за детаље",
    zoom_helper: "Дугме у горњем десном углу које пребацује мини картицу на пун приказ и назад",
    rate_unit: "Јединица брзине преноса",
    unit_bytes: "Бајтови (kB/s, MB/s)",
    unit_bits: "Битови (kb/s, Mb/s)",
    language: "Језик",
    lang_auto: "Аутоматски",
  },
  "sr-Latn": {
    network: "Mreža",
    system: "Sistem",
    storage: "Skladište",
    services: "Usluge",
    download: "Preuzimanje",
    upload: "Slanje",
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
    unavailable: "Nedostupno",
    hours: "h",
    days: "d",
    minutes: "min",
    rpm: "o/min",
    disk: "Disk",
    no_box: "Nije pronađen nijedan internet ruter. Da li je instalirana podržana integracija (Freebox, Livebox, SFR Box, Bbox)?",
    unknown_box: "Internet ruter nije pronađen",
    zoom_in: "Prikaži celu karticu",
    zoom_out: "Nazad na kompaktni prikaz",
    box: "Internet ruter (uređaj integracije)",
    title: "Naslov (opciono, podrazumevano je model rutera)",
    model: "Model rutera (slika i podrazumevani naslov)",
    model_auto: "Automatski",
    show_image: "Prikaži sliku rutera",
    admin: "Otvori administratorski interfejs rutera",
    admin_url: "Administratorska adresa rutera (opciono, otvara se klikom na sliku)",
    show_logo: "Prikaži logo operatera",
    show_network: "Prikaži mrežu",
    show_system: "Prikaži sistem (temperature, ventilatori)",
    show_storage: "Prikaži skladište",
    show_services: "Prikaži usluge (Wi-Fi, pozivi, uređaji)",
    zoom: "Dugme za detalje",
    zoom_helper: "Dugme u gornjem desnom uglu koje prebacuje mini karticu na pun prikaz i nazad",
    rate_unit: "Jedinica brzine prenosa",
    unit_bytes: "Bajtovi (kB/s, MB/s)",
    unit_bits: "Bitovi (kb/s, Mb/s)",
    language: "Jezik",
    lang_auto: "Automatski",
  },
  it: {
    network: "Rete",
    system: "Sistema",
    storage: "Archiviazione",
    services: "Servizi",
    download: "Download",
    upload: "Upload",
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
    unavailable: "Non disponibile",
    hours: "h",
    days: "g",
    minutes: "min",
    rpm: "giri/min",
    disk: "Disco",
    no_box: "Nessun modem internet trovato. È installata un'integrazione compatibile (Freebox, Livebox, SFR Box, Bbox)?",
    unknown_box: "Modem internet non trovato",
    zoom_in: "Mostra la scheda completa",
    zoom_out: "Torna alla vista compatta",
    box: "Modem internet (dispositivo dell'integrazione)",
    title: "Titolo (facoltativo, predefinito: modello del modem)",
    model: "Modello del modem (immagine e titolo predefinito)",
    model_auto: "Automatico",
    show_image: "Mostra l'immagine del modem",
    admin: "Apri l'interfaccia di amministrazione del modem",
    admin_url: "Indirizzo di amministrazione del modem (facoltativo, aperto al clic sull'immagine)",
    show_logo: "Mostra il logo dell'operatore",
    show_network: "Mostra la rete",
    show_system: "Mostra il sistema (temperature, ventole)",
    show_storage: "Mostra l'archiviazione",
    show_services: "Mostra i servizi (Wi-Fi, chiamate, dispositivi)",
    zoom: "Pulsante dettagli",
    zoom_helper: "Pulsante in alto a destra che mostra la scheda completa al posto della mini scheda, e viceversa",
    rate_unit: "Unità di velocità",
    unit_bytes: "Byte (kB/s, MB/s)",
    unit_bits: "Bit (kb/s, Mb/s)",
    language: "Lingua",
    lang_auto: "Automatica",
  },
  nl: {
    network: "Netwerk",
    system: "Systeem",
    storage: "Opslag",
    services: "Diensten",
    download: "Download",
    upload: "Upload",
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
    calls: "Oproepen",
    missed: "gemist",
    temperature: "Temp.",
    used: "gebruikt",
    free: "vrij",
    raid_ok: "OK",
    raid_degraded: "Gedegradeerd",
    online: "Online",
    offline: "Offline",
    unavailable: "Niet beschikbaar",
    hours: "u",
    days: "d",
    minutes: "min",
    rpm: "tpm",
    disk: "Schijf",
    no_box: "Geen internetmodem gevonden. Is er een ondersteunde integratie (Freebox, Livebox, SFR Box, Bbox) geïnstalleerd?",
    unknown_box: "Internetmodem niet gevonden",
    zoom_in: "Volledige kaart tonen",
    zoom_out: "Terug naar de compacte weergave",
    box: "Internetmodem (apparaat van de integratie)",
    title: "Titel (optioneel, standaard het model van de modem)",
    model: "Model van de modem (afbeelding en standaardtitel)",
    model_auto: "Automatisch",
    show_image: "Afbeelding van de modem tonen",
    admin: "Beheerinterface van de modem openen",
    admin_url: "Beheeradres van de modem (optioneel, geopend bij klikken op de afbeelding)",
    show_logo: "Logo van de provider tonen",
    show_network: "Netwerk tonen",
    show_system: "Systeem tonen (temperaturen, ventilatoren)",
    show_storage: "Opslag tonen",
    show_services: "Diensten tonen (Wi-Fi, oproepen, apparaten)",
    zoom: "Detailknop",
    zoom_helper: "Knop rechtsboven die de volledige kaart toont in plaats van de minikaart, en terug",
    rate_unit: "Eenheid van snelheid",
    unit_bytes: "Bytes (kB/s, MB/s)",
    unit_bits: "Bits (kb/s, Mb/s)",
    language: "Taal",
    lang_auto: "Automatisch",
  },
  pt: {
    network: "Rede",
    system: "Sistema",
    storage: "Armazenamento",
    services: "Serviços",
    download: "Transferência",
    upload: "Envio",
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
    unavailable: "Indisponível",
    hours: "h",
    days: "d",
    minutes: "min",
    rpm: "rpm",
    disk: "Disco",
    no_box: "Nenhum router de internet encontrado. Está instalada uma integração compatível (Freebox, Livebox, SFR Box, Bbox)?",
    unknown_box: "Router de internet não encontrado",
    zoom_in: "Mostrar o cartão completo",
    zoom_out: "Voltar à vista compacta",
    box: "Router de internet (dispositivo da integração)",
    title: "Título (opcional, por predefinição o modelo do router)",
    model: "Modelo do router (imagem e título predefinido)",
    model_auto: "Automático",
    show_image: "Mostrar a imagem do router",
    admin: "Abrir a interface de administração do router",
    admin_url: "Endereço de administração do router (opcional, aberto ao clicar na imagem)",
    show_logo: "Mostrar o logótipo do operador",
    show_network: "Mostrar a rede",
    show_system: "Mostrar o sistema (temperaturas, ventoinhas)",
    show_storage: "Mostrar o armazenamento",
    show_services: "Mostrar os serviços (Wi-Fi, chamadas, dispositivos)",
    zoom: "Botão de detalhe",
    zoom_helper: "Botão no canto superior direito que mostra o cartão completo em vez do minicartão, e vice-versa",
    rate_unit: "Unidade de velocidade",
    unit_bytes: "Bytes (kB/s, MB/s)",
    unit_bits: "Bits (kb/s, Mb/s)",
    language: "Idioma",
    lang_auto: "Automático",
  },
  pl: {
    network: "Sieć",
    system: "System",
    storage: "Pamięć masowa",
    services: "Usługi",
    download: "Pobieranie",
    upload: "Wysyłanie",
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
    unavailable: "Niedostępne",
    hours: "h",
    days: "d",
    minutes: "min",
    rpm: "obr./min",
    disk: "Dysk",
    no_box: "Nie znaleziono routera internetowego. Czy zainstalowano obsługiwaną integrację (Freebox, Livebox, SFR Box, Bbox)?",
    unknown_box: "Nie znaleziono routera internetowego",
    zoom_in: "Pokaż pełną kartę",
    zoom_out: "Wróć do widoku kompaktowego",
    box: "Router internetowy (urządzenie integracji)",
    title: "Tytuł (opcjonalny, domyślnie model routera)",
    model: "Model routera (obraz i domyślny tytuł)",
    model_auto: "Automatycznie",
    show_image: "Pokaż obraz routera",
    admin: "Otwórz interfejs administracyjny routera",
    admin_url: "Adres panelu administracyjnego routera (opcjonalny, otwierany po kliknięciu obrazu)",
    show_logo: "Pokaż logo operatora",
    show_network: "Pokaż sieć",
    show_system: "Pokaż system (temperatury, wentylatory)",
    show_storage: "Pokaż pamięć masową",
    show_services: "Pokaż usługi (Wi-Fi, połączenia, urządzenia)",
    zoom: "Przycisk szczegółów",
    zoom_helper: "Przycisk w prawym górnym rogu, który pokazuje pełną kartę zamiast minikarty, i z powrotem",
    rate_unit: "Jednostka prędkości",
    unit_bytes: "Bajty (kB/s, MB/s)",
    unit_bits: "Bity (kb/s, Mb/s)",
    language: "Język",
    lang_auto: "Automatycznie",
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
      { id: "livebox_5", name: "Livebox 5", re: /livebox\s*5|lb5/i },
      { id: "livebox_4", name: "Livebox 4", re: /livebox\s*4|lb4/i },
      { id: "livebox_s", name: "Livebox S", re: /livebox\s*s\b|lbs\b/i },
    ],
    keys: { rate_down: "down_rate", rate_up: "up_rate", missed: "callers", wifi: "wifi_switch", mark_read: "cmissed_clear_btn", reboot: "restart_btn" },
  },
  sfr_box: {
    platform: "sfr_box", name: "SFR Box", color: "#e2001a", logo: IMG_SFR,
    website: "https://www.sfr.fr", admin: "http://192.168.1.1",
    models: [
      { id: "sfr_box_8", name: "SFR Box 8", re: /box\s*8|nb8|fast\s*5[0-9]/i },
      { id: "sfr_box_7", name: "SFR Box 7", re: /box\s*7|nb7/i },
      { id: "sfr_nb6vac", name: "SFR Box", re: /nb6vac|box\s*(plus|power|fibre|thd)/i },
    ],
    // The reboot button has no translation key but device_class "restart" (matched below too).
    keys: { rate_down: "dsl_rate_down", rate_up: "dsl_rate_up", reboot: "system_reboot" },
  },
  bbox: {
    platform: "bbox", name: "Bbox", color: "#1246a0", logo: IMG_BBOX,
    website: "https://www.bouyguestelecom.fr", admin: "https://mabbox.bytel.fr",
    models: [
      { id: "bbox_fibre", name: "Bbox Fibre", re: /fibre|fiber/i },
      { id: "bbox_ultym", name: "Bbox Ultym", re: /ultym/i },
      { id: "bbox_miami", name: "Bbox Miami", re: /miami/i },
    ],
    // Legacy integration: hardcoded English names, no translation keys, so it is discovered by entity-id suffix.
    keys: {}, legacy: { rate_down: /_currently_used_download_bandwidth$/, rate_up: /_currently_used_upload_bandwidth$/ },
  },
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
  return `${v >= 100 || i === 0 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
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

/** True when an entity is the operator's "download rate" sensor (by translation key, or entity id for a legacy one). */
const isRateDown = (op, e) =>
  (op.keys.rate_down && e.translation_key === op.keys.rate_down) || (op.legacy?.rate_down?.test(e.entity_id));

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
    if (op && isRateDown(op, e) && e.device_id && !seen.has(e.device_id))
      seen.set(e.device_id, deviceName(hass.devices?.[e.device_id]) || e.device_id);
  }
  const list = [...seen.entries()].map(([value, label]) => ({ value, label }));
  for (const b of legacyBoxes(hass)) if (!seen.has(b.value)) list.push(b);
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
  }
};

const emptyBox = () => ({ id: null, device: null, operator: null, scalars: {}, temps: [], fans: [], partitions: [], raids: [], trackers: [] });

/**
 * Map the entities of one box to a structured object of entity ids. The result is cached on the
 * registries (hass.entities, hass.devices) and the list of the operators' entities that have a state, not on
 * hass.states, which Home Assistant replaces on every state change.
 */
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
  if (router && !dev) {
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
        // Disks are child devices of the router; client trackers share its config entry.
        const child = d && d.via_device_id === router;
        const sameEntry = d && (d.config_entries || []).some((c) => entryIds.has(c));
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
        // Each data slot is matched by the operator's translation key, or by an entity-id pattern for a legacy one.
        if ((keys.rate_down && k === keys.rate_down) || (legacy?.rate_down?.test(id))) box.scalars.rate_down = id;
        else if ((keys.rate_up && k === keys.rate_up) || (legacy?.rate_up?.test(id))) box.scalars.rate_up = id;
        else if (keys.missed && k === keys.missed) box.scalars.missed = id;
        else if (keys.wifi && k === keys.wifi) box.scalars.wifi = id;
        else if (own && domain === "button" && keys.mark_read && k === keys.mark_read) box.scalars.mark_read = id;
        else if (own && domain === "button" && ((keys.reboot && k === keys.reboot) || a.device_class === "restart")) box.scalars.reboot = id;
        else if (keys.partition && k === keys.partition) box.partitions.push({ id, device: d });
        else if (keys.raid && k === keys.raid) box.raids.push(id);
        else if (own && domain === "sensor" && !k && a.device_class === "temperature") box.temps.push({ id, name: shortName(hass, id, dev) });
        else if (own && domain === "sensor" && !k && /^(rpm|tr\/min)$/i.test(a.unit_of_measurement || ""))
          box.fans.push({ id, name: shortName(hass, id, dev) });
      }
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

/** Model of the box: the one set with the `model` option, else the detected one. */
const boxModel = (box, config) => {
  const models = box?.operator?.models ?? MODELS;
  return models.find((m) => m.id === config?.model) ?? detectModel(box);
};

/** Label of a partition: its friendly name without the device name and the "free space" words, as the core
 *  Freebox integration names them (partition_free_space). Italian, Dutch and Polish have no translation of
 *  that name in core and fall back to the English one. */
const partitionLabel = (hass, p, fallback = "Disk") =>
  shortName(hass, p.id, p.device)
    .replace(/\s*(free space|espace libre( de| sur)?|freier speicher(platz)?|espacio libre( de| en)?|espaço livre( em| de)?)\s*/gi, " ")
    .trim() || deviceName(p.device) || fallback;

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  /* A block that may shrink (min-width: 0) to its grid or flex track; its intrinsic width (inline-block, a grid column
     sized "auto") comes from ha-card's contain-intrinsic-inline-size, not from the content of the size container,
     which counts for 0. */
  :host { display: block; min-width: 0; }
  :host { --ibc-red: #cd1e25; --ibc-ok: var(--success-color, #43a047); --ibc-warn: var(--warning-color, #ffa600); --ibc-crit: var(--error-color, #db4437); }
  /* Readable colours: the operator accent and the state colours stay as they are on fills, dots and tints; icons
     and graphics mix 40 % of the theme text colour (3:1), text 50 % (4.5:1). Mixing with --primary-text-color darkens
     them in a light theme and lightens them in a dark one (e.g. the dark blue Bbox accent on a dark card). Declared on
     ha-card, which carries the operator's --ibc-red. */
  ha-card { overflow: hidden; position: relative; container-type: inline-size; contain-intrinsic-inline-size: 240px;
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
  .bar { height: 4px; border-radius: 3px; background: var(--divider-color, rgba(127,127,127,.25)); overflow: hidden; }
  .bar > div { height: 100%; border-radius: 3px; background: var(--c, var(--ibc-accent)); transition: width .6s ease; }
  @media (prefers-reduced-motion: reduce) { .bar > div { transition: none; } }
  .header { display: flex; align-items: center; gap: 10px; padding: 12px 12px 8px; }
  /* The status pill sits right of the title line, centred on it; the subtitle and chips stay under the title. */
  /* Narrow cards: the title block shrinks but keeps about 4 characters of the 16 px title (48 px), the box picture
     gets smaller (hidden below 200 px), the status pill truncates its text (only its dot below 260 px) and the icon
     buttons never shrink. */
  .titles { flex: 1 1 0; min-width: 48px; display: grid; grid-template-columns: minmax(0, 1fr) auto; }
  .titles > * { grid-column: 1; }
  .titles > .chip { grid-column: 2; grid-row: 1; align-self: center; margin-left: 10px; white-space: nowrap; min-width: 0; max-width: 100%; }
  .chip.status { overflow: hidden; }
  .chip.status .txt { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .titles .chips { margin-top: 4px; }
  .logo-link { display: flex; align-items: center; justify-content: center; flex: none; align-self: flex-start; width: 40px; height: 40px; border-radius: 10px;
               background: #fff; box-shadow: inset 0 0 0 1px var(--divider-color, rgba(0,0,0,.12)); }
  .logo { display: block; width: 34px; height: auto; }
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
          background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .tile .icon { color: color-mix(in srgb, var(--c, var(--ibc-red)) 60%, var(--primary-text-color)); }
  .tile > div { min-width: 0; }
  .tile .k { font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tile .v { font-size: 14px; font-weight: 500; white-space: nowrap; }
  .tile.down { --c: var(--ibc-red); }
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

class InternetBoxBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this._dialog = null;
    this.shadowRoot.addEventListener("click", (ev) => {
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
      // Escape closes the confirmation popup.
      if (ev.key === "Escape" && this._dialog) {
        ev.stopPropagation();
        this._closeDialog();
      }
    });
  }

  connectedCallback() {
    // A click elsewhere on the page closes the confirmation popup. It stops there, so the mini card does not
    // also leave its zoomed view on the same click (this listener runs before the mini card's).
    this._onDialogOutside ??= (ev) => {
      if (this._dialog && !ev.composedPath().includes(this)) {
        ev.stopImmediatePropagation();
        this._closeDialog();
      }
    };
    document.addEventListener("click", this._onDialogOutside, true);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this._onDialogOutside, true);
  }

  // Presses a Home Assistant button entity. A failed call is logged (Home Assistant already shows a toast).
  _press(entityId) {
    Promise.resolve()
      .then(() => this._hass?.callService("button", "press", { entity_id: entityId }))
      .catch((err) => console.error("internet-box-card: button.press failed", err));
  }

  // Opens the restart confirmation popup; on confirmation, presses the box's reboot button.
  _confirmRestart() {
    const box = discover(this._hass, this._config.box);
    const reboot = box.scalars.reboot;
    if (!reboot || this._s(reboot)?.state === "unavailable") return;
    this._openDialog({
      body: `<h3>${svgIcon(ICONS.restart)}${esc(this._t("restart"))}</h3>
        <div class="hint">${esc(this._t("restart_confirm"))}</div>`,
      ok: this._t("restart_btn"),
      onOk: () => this._press(reboot),
    });
  }

  _openDialog(dialog) {
    this._dialog = dialog;
    this._update();
    // After a re-render: no scroll of the page towards the card.
    this.shadowRoot.querySelector(".modal .danger")?.focus({ preventScroll: true });
  }

  _closeDialog() {
    if (!this._dialog) return;
    this._dialog = null;
    this._update();
  }

  _dialogHtml() {
    const d = this._dialog;
    if (!d) return "";
    return `<style>${DIALOG_STYLE}</style><div class="backdrop" data-action="dialog-backdrop">
      <div class="modal" role="dialog" aria-modal="true">
        ${d.body}
        <div class="modal-actions">
          <button class="act cancel" data-action="dialog-cancel">${esc(this._t("cancel"))}</button>
          <button class="act danger" data-action="dialog-ok">${esc(d.ok)}</button>
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
    this._config = { ...config };
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
    const missed = this._s(sc.missed);
    if (!missed) return null;
    const n = num(missed);
    const button = this._s(sc.mark_read);
    const markRead = n > 0 && button?.state !== "unavailable" && button;
    const reset = markRead
      ? `<button class="reset" data-press="${markRead.entity_id}" title="${esc(this._t("mark_read"))}" aria-label="${esc(
          this._t("mark_read")
        )}">${svgIcon(ICONS.check)}</button>`
      : "";
    return { missed, n, reset };
  }

  _uptime(router) {
    return uptimeSec(router, this._hass.config?.time_zone);
  }

  // Download / upload rate tile, shared by the full and the mini card.
  _rateTile(id, cls, icon, k) {
    return `<div class="tile clickable ${cls}" role="button" tabindex="0" data-entity="${id || ""}">${svgIcon(icon)}<div><div class="k">${k}</div><div class="v">${this._rate(
      id
    )}</div></div></div>`;
  }

  // What the render depends on: registries, language, the states of the box entities and the
  // minute, for the uptime shown in days, hours and minutes.
  _signature() {
    const h = this._hass;
    const sig = [h.entities, h.devices, h.language, h.locale?.language, h.config?.time_zone];
    const box = discover(h, this._config.box);
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
    if (this._s(box.scalars.router)?.attributes?.uptime) sig.push(Math.floor(Date.now() / 60e3));
    return sig;
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

  // Status pill right of the title (connection state and type), or "" without the router entity.
  _statusPill(box) {
    const router = this._s(box.scalars.router);
    if (!router) return "";
    const online = router.state === "home";
    const type = router.attributes.connection_type;
    const unknown = noValue(router);
    const text = unknown ? this._t("unavailable") : `${online ? this._t("online") : this._t("offline")}${type ? ` · ${String(type).toUpperCase()}` : ""}`;
    // The text is also the tooltip and accessible name: on a narrow card only the coloured dot is shown.
    return `<span class="chip status clickable ${unknown ? "off" : online ? "ok" : "crit"}" role="button" tabindex="0" data-entity="${
      router.entity_id
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
        `<span class="chip clickable ${on ? "ok" : "off"}" role="button" tabindex="0" data-entity="${wifi.entity_id}">${svgIcon(on ? ICONS.wifi : ICONS.wifi_off)}${esc(
          text
        )}</span>`
      );
    }
    return chips.length ? `<div class="chips">${chips.join("")}</div>` : "";
  }

  _header(box, withChips) {
    const c = this._config;
    const op = box.operator || OPERATORS.freebox;
    const router = this._s(box.scalars.router);
    const firmware = box.device?.sw_version || router?.attributes?.firmware_version;
    const devName = deviceName(box.device);
    const model = boxModel(box, c);
    const name = c.title || model?.name || devName || op.name;
    const adminUrl = /^https?:\/\//i.test(c.admin_url || "") ? c.admin_url : op.admin;
    const sub = [devName && devName !== name ? devName : null, firmware ? `${this._t("firmware")} ${firmware}` : null].filter(Boolean);
    // The operator logo (every supported operator has one), opening its website.
    const brand = op.logo
      ? `<a class="logo-link" href="${esc(op.website)}" target="_blank" rel="noopener noreferrer" title="${esc(op.name)}"><img class="logo" src="${op.logo}" alt="${esc(op.name)}"></a>`
      : "";
    // The box picture only when the operator has a matching model drawing.
    const boxImg = model && IMG_BOX[model.id] ? IMG_BOX[model.id] : null;
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
  .tile:has(.reset) { padding-right: 6px; }
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
  /* Below 9 columns of a phone section the title, the pill and the restart button need the whole header; the zoomed
     mini card, which also has its detail button, needs it up to 340 px for the whole pill text. */
  @container (max-width: 260px) { .box-link { display: none; } }
  @container (max-width: 340px) { .header:has(.zoom) .box-link { display: none; } }
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
    const box = discover(this._hass, this._config.box);
    if (!box.id) return this._noBox();
    const c = this._config;
    const parts = [];
    if (c.show_network !== false) parts.push(this._network(box));
    if (c.show_system !== false) parts.push(this._system(box));
    if (c.show_storage !== false) parts.push(this._storage(box));
    if (c.show_services !== false) parts.push(this._services(box));
    return `<style>${BASE_STYLE}${FULL_STYLE}</style>
      <ha-card style="--ibc-red:${(box.operator || OPERATORS.freebox).color}">
        ${this._header(box, true)}
        <div class="content">${parts.filter(Boolean).join("")}</div>
      </ha-card>`;
  }

  _network(box) {
    const sc = box.scalars;
    if (!sc.rate_down && !sc.rate_up) return "";
    const router = this._s(sc.router);
    const facts = [];
    if (router?.attributes?.IPv4)
      facts.push(
        `<span class="clickable" role="button" tabindex="0" data-entity="${router.entity_id}" title="${esc(router.attributes.IPv6 || "")}">${svgIcon(ICONS.ip)}${esc(
          router.attributes.IPv4
        )}</span>`
      );
    const up = this._uptime(router);
    if (up !== null)
      facts.push(
        `<span class="clickable" role="button" tabindex="0" data-entity="${router.entity_id}">${svgIcon(ICONS.timer)}${this._t("uptime")} ${fmtUptime(
          up,
          this._hass,
          this._config
        )}</span>`
      );
    return `<div>
      <div class="section-title">${svgIcon(ICONS.network)}${this._t("network")}</div>
      <div class="grid2">
        ${this._rateTile(sc.rate_down, "down", ICONS.down, this._t("download"))}
        ${this._rateTile(sc.rate_up, "up", ICONS.up, this._t("upload"))}
      </div>
      ${facts.length ? `<div class="facts">${facts.join("")}</div>` : ""}
    </div>`;
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
      return `<div class="gauge clickable ${level(c, 75, 90)}" role="button" tabindex="0" data-key="${id}" data-entity="${id}" title="${esc(name)}">
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
      const cls = level(used, 80, 90);
      return `<div class="part clickable ${cls}" role="button" tabindex="0" data-key="${p.id}" data-entity="${p.id}">
        <div class="row"><span class="dot ${used === null ? "off" : cls || "ok"}"></span><span class="grow">${esc(partitionLabel(this._hass, p, this._t("disk")))}</span>
          <span class="muted">${esc(p.device?.model || "")}</span></div>
        <div class="bar"><div style="width:${used ?? 0}%"></div></div>
        <div class="detail"><span>${used === null ? "—" : `${used.toFixed(0)}% ${this._t("used")}`}</span>
          <span>${free === null ? "" : `${free.toFixed(0)}% ${this._t("free")}`}</span></div>
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
      tiles.push(`<div class="tile svc clickable ${on ? "ok" : unknown ? "off" : ""}" role="button" tabindex="0" data-key="${wifi.entity_id}" data-entity="${
        wifi.entity_id
      }">${svgIcon(on || unknown ? ICONS.wifi : ICONS.wifi_off)}<div><div class="k">${this._t("wifi")}</div><div class="v">${this._t(
        unknown ? "unavailable" : on ? "on" : "off"
      )}</div></div></div>`);
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
  ha-card { contain-intrinsic-inline-size: 160px; }
  .logo-link { width: 32px; height: 32px; border-radius: 8px; }
  .logo { width: 26px; }
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
    const box = discover(this._hass, this._config.box);
    if (!box.id) return this._noBox();
    const c = this._config;
    const sc = box.scalars;
    const parts = [];
    if (c.show_network !== false && (sc.rate_down || sc.rate_up)) {
      parts.push(`<div class="grid2">${this._rateTile(sc.rate_down, "down", ICONS.down, this._t("download"))}${this._rateTile(
        sc.rate_up,
        "up",
        ICONS.up,
        this._t("upload")
      )}</div>`);
    }
    const foot = [];
    const router = this._s(sc.router);
    if (router) {
      const online = router.state === "home";
      const unknown = noValue(router);
      const text = unknown ? this._t("unavailable") : String(router.attributes.connection_type || this._t(online ? "online" : "offline")).toUpperCase();
      foot.push(`<span class="clickable ${unknown ? "off" : online ? "ok" : "crit"}" role="button" tabindex="0" data-key="router" data-entity="${
        router.entity_id
      }"><span class="dot"></span>&nbsp;${esc(text)}</span>`);
    }
    if (c.show_system !== false && box.temps.length) {
      let hottest = null;
      for (const tmp of box.temps) {
        const v = temperature(this._s(tmp.id));
        if (v.c !== null && (!hottest || v.c > hottest.c)) hottest = { ...v, id: tmp.id };
      }
      if (hottest)
        foot.push(`<span class="clickable ${level(hottest.c, 75, 90)}" role="button" tabindex="0" data-key="hottest" data-entity="${hottest.id}">${svgIcon(ICONS.temp)}${Math.round(
          hottest.raw
        )}${esc(hottest.unit)}</span>`);
    }
    const wifi = this._s(sc.wifi);
    if (wifi) {
      // Unavailable: a neutral Wi-Fi icon and "—", the state in the tooltip and accessible name.
      const on = wifi.state === "on";
      const unknown = noValue(wifi);
      const label = unknown ? ` title="${esc(`${this._t("wifi")} · ${this._t("unavailable")}`)}" aria-label="${esc(`${this._t("wifi")} · ${this._t("unavailable")}`)}"` : "";
      foot.push(`<span class="clickable ${on ? "ok" : unknown ? "off" : ""}" role="button" tabindex="0" data-key="${wifi.entity_id}" data-entity="${
        wifi.entity_id
      }"${label}>${svgIcon(on || unknown ? ICONS.wifi : ICONS.wifi_off)}${this._t("wifi")}${unknown ? " —" : ""}</span>`);
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
    const up = this._uptime(router);
    if (up !== null) foot.push(`<span data-key="uptime">${svgIcon(ICONS.timer)}${fmtUptime(up, this._hass, this._config)}</span>`);
    return `<style>${BASE_STYLE}${MINI_STYLE}</style>
      <ha-card style="--ibc-red:${(box.operator || OPERATORS.freebox).color}">
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
    this._config = { ...config };
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
          { name: "show_image", selector: { boolean: {} } },
          { name: "show_logo", selector: { boolean: {} } },
          ...this.constructor.toggles.map((name) => ({ name, selector: { boolean: {} } })),
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
      this._form.computeLabel = (s) => t(this._hass, this._config, s.name);
      this._form.computeHelper = (s) => (STRINGS.en[`${s.name}_helper`] ? t(this._hass, this._config, `${s.name}_helper`) : undefined);
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        // Another box of another operator: a model picked for the former one is not among the new operator's
        // models (and would be silently ignored), so it is cleared.
        if (config.box !== this._config.box && config.model) {
          const models = discover(this._hass, config.box).operator?.models ?? MODELS;
          if (!models.some((m) => m.id === config.model)) delete config.model;
        }
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values and options left at their default.
          if (v === "" || v === undefined || v === null || ((k.startsWith("show_") || k === "zoom") && v === true) || (k === "rate_unit" && v === "bytes"))
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
    const data = { rate_unit: "bytes", model: "", ...this._config };
    for (const name of ["show_image", "show_logo", ...this.constructor.toggles]) if (data[name] === undefined) data[name] = true;
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
    return ["show_network", "show_system", "show_storage", "show_services"];
  }
}

class InternetBoxMiniCardEditor extends InternetBoxEditorBase {
  static get toggles() {
    return ["show_network", "show_system", "zoom"];
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
    description: "Monitor an internet box (Freebox, Livebox, SFR Box, Bbox): download / upload, temperatures, fans, storage, Wi-Fi, calls and connected devices.",
  },
  {
    type: "internet-box-mini-card",
    name: "Internet Box Mini Card",
    description: "Compact internet box overview (Freebox, Livebox, SFR Box, Bbox): download / upload, connection, temperature, Wi-Fi and uptime, with a button to show the full card.",
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
