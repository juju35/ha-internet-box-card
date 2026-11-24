// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
import { ICONS, PIC_FIT, modelPic, sceneSvg } from "./core.js";
import { CONFIRM_GUARD_MS, bootSec, esc, fireMoreInfo, fmtRate, level, lineIcon, lineOf, missedCount, morph, noValue, normalizeConfig, sameSig, svgIcon, t, threshold, tn, toBps, uptimeSec } from "./helpers.js";
import { SPEEDTEST_RUN_MS, boxFor, boxModel, brandOf, deviceName, discoverSpeedtest, runService } from "./entity-discovery.js";

export const BASE_STYLE = `
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
  ha-card { overflow: hidden; position: relative; container-type: inline-size; container-name: ibc-card;
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
  /* The status pill right after the title, when the whole title and the pill's whole label fit on that row (measured,
     see _fitPill); otherwise on a line of its own under the subtitle (which keeps one line), else its dot alone. */
  .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .trow > .name { flex: 0 1 auto; min-width: 0; }
  .trow > .chip.status { flex: none; max-width: none; margin: 0; white-space: nowrap; }
  /* The box picture giving way to the title and its pill (measured, see _fitPill). */
  .header.pic-small .box { height: 26px; }
  .header.pic-none .box-link { display: none; }
  .header:not(.banner) .titles.below .trow { display: contents; }
  .header:not(.banner) .titles.below .trow > .chip.status { grid-row: 3; justify-self: start; max-width: 100%; margin-top: 4px; }
  .header:not(.banner) .titles.below .sub { max-height: 15px; line-height: 15px; }
  .header:not(.banner) .titles.dot-only .trow > .chip.status { padding: 5px; } .header:not(.banner) .titles.dot-only .chip.status .txt { display: none; }
  @container ibc-card (max-width: 200px) { .header:not(.banner) .trow > .chip.status { padding: 5px; } .header:not(.banner) .chip.status .txt { display: none; } }
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
  /* 24 h curve in its own 24 px band under the icon and the text, never behind them. */
  .tile:has(> .spark) { padding-bottom: 30px; }
  .tile .spark { position: absolute; inset: auto 0 0; width: 100%; height: 24px; pointer-events: none; }
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

// Illustrated header (the default; `illustration: false` keeps the classic one): a 90 px banner, the icon, title,
// status and subtitle on the sky at its left, the internet scene at its right (at most 200 px wide, 62 % of the
// card), and a 10 px network strip under the whole banner, edge to edge. Day and night colours.
// The width of an element's whole text in its own font, in fractional pixels (scrollWidth is rounded).
export let textCtx;
export const textWidth = (el) => {
  const cs = getComputedStyle(el);
  textCtx ??= document.createElement("canvas").getContext?.("2d");
  if (!textCtx) return el.scrollWidth;
  textCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  return Math.max(el.scrollWidth, textCtx.measureText(el.textContent.trim()).width + pad);
};

export const BANNER_STYLE = `
  .banner { position: relative; overflow: hidden; height: 90px; padding: 0; gap: 0; display: block;
            --g: 10px; --scene-w: min(200px, 62%); --sky-text: #0d2a45; --sky-muted: #3b5b78;
            --sc-bg: #eaf2fb; --sc-dot: #c9dcf2; --sc-bed: #b9c9dc; --sc-dev: #fff; --sc-dev-line: #c9d2de; --sc-dev-icon: #5f6b7a;
            --sc-wave: #2f80ed; --sc-pk: #43a047; --sc-dim: #9aa3ae;
            background: var(--sc-bg); color: var(--sky-text); }
  .banner.night { --sky-text: #fff; --sky-muted: rgba(255,255,255,.78);
                  --sc-bg: #101827; --sc-dot: #22324d; --sc-bed: #2a3446; --sc-dev: #1d2a3d; --sc-dev-line: #33465f; --sc-dev-icon: #9fb3cf; }
  .banner .scene { position: absolute; right: 0; bottom: var(--g); height: calc(100% - var(--g)); width: var(--scene-w); }
  .banner .htext { position: absolute; left: 0; top: 0; bottom: var(--g); z-index: 1;
                   display: flex; align-items: center; gap: 10px; padding: 0 8px 0 14px; min-width: 0; }
  .banner .titles { flex: 1 1 0; display: grid; grid-template-columns: minmax(0, 1fr); align-content: center; min-width: 48px; }
  .banner .name { color: var(--sky-text); }
  /* One subtitle line: device and firmware side by side, or the device alone when both do not fit. */
  .banner .sub { color: var(--sky-muted); flex: none; height: 15px; line-height: 15px; }
  /* The status pill on the title's row, in the state colour of the icon on frosted glass, when the whole title and the
     pill's whole label fit there (measured, see _fitPill); otherwise the pill goes on a line of its own under the
     subtitle; when that does not fit above the strip, or on a card of 200 px or less, its dot alone. */
  .banner .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .banner .trow > .name { flex: 0 1 auto; min-width: 0; }
  .banner .trow > .chip.status { flex: none; max-width: none; margin: 0; padding: 1px 8px; font-size: 11px; font-weight: 500; line-height: 16px;
                                 white-space: nowrap; box-sizing: border-box;
                                 background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
  .banner.night .trow > .chip.status { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
  .banner .trow > .chip.status .dot { width: 7px; height: 7px; }
  .banner .trow > .chip.status .txt { display: block; }
  .banner .titles.below .trow { display: contents; }
  .banner .titles.below .trow > .chip.status { grid-row: 3; justify-self: start; max-width: 100%; margin-top: 3px; }
  .banner .titles.dot-only .trow > .chip.status { padding: 4px; } .banner .titles.dot-only .trow > .chip.status .txt { display: none; }
  @container ibc-card (max-width: 200px) { .banner .trow > .chip.status { padding: 4px; } .banner .trow > .chip.status .txt { display: none; } }
  .banner + .content { padding-top: 12px; }
  /* Round icon on the sky: translucent white, the icon in the state colour (online, syncing, offline, unavailable). */
  .banner .logo-link { align-self: center; background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px rgba(47,128,237,.18);
                       --ibc-icon: color-mix(in srgb, var(--ibc-tint) 72%, #0d2a45); }
  .banner.night .logo-link { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14);
                             --ibc-icon: color-mix(in srgb, var(--ibc-tint) 62%, #fff); }
  .banner .logo-link .icon.type .led { fill: #fff; }
  .banner.night .logo-link .icon.type .led { fill: #1d2a3d; }
  .banner .logo { box-shadow: 0 0 0 1px rgba(13,42,69,.16), 0 1px 3px rgba(13,42,69,.18); }
  /* Restart and detail buttons, top right over the scene. */
  .banner .hbtns { position: absolute; top: 5px; right: 5px; z-index: 2; display: flex; gap: 4px; }
  .banner .hbtns .action, .banner .hbtns .zoom { margin: 0; width: 24px; height: 24px; padding: 0; border-radius: 50%; box-sizing: border-box;
                                                 display: grid; place-items: center; color: #33506b; background: rgba(255,255,255,.55);
                                                 box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); backdrop-filter: blur(4px); }
  .banner .hbtns .icon { width: 16px; height: 16px; }
  .banner.night .hbtns .action, .banner.night .hbtns .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .banner .hbtns .action:hover, .banner .hbtns .zoom:hover { background: rgba(255,255,255,.75); }
  .banner.night .hbtns .action:hover, .banner.night .hbtns .zoom:hover { background: rgba(255,255,255,.22); }
  .banner .hbtns .action:disabled { opacity: .5; }
  /* The scene. */
  .sc-dots { fill: var(--sc-dot); }
  .sc-fibre-bed { stroke: var(--sc-bed); stroke-width: 4; stroke-linecap: round; fill: none; }
  .sc-fibre { stroke: var(--sc-link); stroke-width: 2; stroke-linecap: round; fill: none; stroke-dasharray: 3 4; }
  .sc-fibre.flow { stroke-dasharray: 4 26; animation: sc-flow 1.4s linear infinite; }
  .sc-wait .sc-fibre.flow { animation-duration: 2.6s; }
  .sc-wire { stroke: var(--sc-dim); stroke-width: 1; fill: none; stroke-dasharray: 2 3; }
  .sc-wire.on { stroke: var(--sc-pk); }
  .sc-pk { fill: var(--sc-pk); animation: sc-packet 1.4s linear infinite; }
  .sc-dev { fill: var(--sc-dev); stroke: var(--sc-dev-line); }
  .sc-dev-i { fill: none; stroke: var(--sc-dev-icon); stroke-width: 1.3; }
  .sc-waves { fill: none; stroke: var(--sc-dim); stroke-width: 1.8; stroke-linecap: round; }
  .sc-waves.on { stroke: var(--sc-wave); }
  .sc-waves.on path { animation: sc-blink 1.5s infinite; }
  .sc-waves.on .w2 { animation-delay: .25s; } .sc-waves.on .w3 { animation-delay: .5s; }
  .sc-cut circle { fill: #e5484d; } .sc-cut path { stroke: #fff; stroke-width: 1.6; }
  .sc-box { filter: drop-shadow(0 2px 2px rgba(0,0,0,.22)); }
  /* At night a soft glow keeps the dark boxes (Livebox, Bbox) apart from the sky. */
  .night .sc-box { filter: drop-shadow(0 0 3px rgba(150,185,230,.45)); }
  a.sc-box { cursor: pointer; }
  a.sc-box:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); }
  /* The network strip: a cable with its light pulses, red and grey when the link is down. */
  .ground { position: absolute; left: 0; right: 0; bottom: 0; height: var(--g); }
  .g-net { background: #1e3a5f; background-image: repeating-linear-gradient(90deg, #4fc3f7 0 14px, transparent 14px 22px);
           background-size: 100% 2px; background-repeat: no-repeat; background-position: 0 50%; box-shadow: inset 0 2px 0 #2f5a8a; }
  .night .g-net { background-color: #0f1d33; box-shadow: inset 0 2px 0 #1e3a5f; }
  .g-netdown { background: #5a6370; background-image: repeating-linear-gradient(90deg, #e5484d 0 6px, transparent 6px 16px);
               background-size: 100% 2px; background-repeat: no-repeat; background-position: 0 50%; box-shadow: inset 0 2px 0 #77808c; }
  .night .g-netdown { background-color: #2c323b; box-shadow: inset 0 2px 0 #3a414c; }
  @keyframes sc-flow { to { stroke-dashoffset: -30; } }
  @keyframes sc-blink { 50% { opacity: .2; } }
  @keyframes sc-packet { from { offset-distance: 0%; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } to { offset-distance: 100%; opacity: 0; } }
  @media (prefers-reduced-motion: reduce) {
    .sc-fibre.flow, .sc-waves.on path { animation: none; }
    .sc-pk { display: none; }
  }
  /* Narrow card: a smaller scene, then the sky alone (the text keeps the room left of the buttons). */
  /* The text stops where the scene starts (its open sky, x < 80, stays under the text), and before the buttons. */
  .banner { --text-r: calc(var(--scene-w) * .6); --btns-w: 0px; }
  .banner:has(.hbtns > *) { --btns-w: 36px; }
  .banner:has(.hbtns > :nth-child(2)) { --btns-w: 64px; }
  /* The scene moves left of the buttons: its devices and Wi-Fi waves stay clear of them. */
  .banner .scene { right: var(--btns-w); }
  .banner .htext { right: calc(var(--text-r) + var(--btns-w)); }
  /* Narrower, a lower scene: its top stays under the buttons, it keeps to the right edge. */
  @container (max-width: 400px) { .banner { --scene-w: 40%; --text-r: calc(var(--scene-w) * .5); } .banner .scene { right: 0; }
                                  .banner .htext { right: max(var(--text-r), var(--btns-w)); }
                                  .banner:has(.hbtns > *) .scene { height: calc(100% - var(--g) - 28px); } }
  @container (max-width: 200px) { .banner .scene { display: none; } .banner { --text-r: var(--btns-w); } }
`;

// Night picture: forced by `illustration_theme`, else Home Assistant's dark theme alone (a light theme keeps the day
// picture after sunset).
export const isNight = (hass, config) => {
  const theme = config?.illustration_theme;
  if (theme === "night") return true;
  if (theme === "day") return false;
  return !!hass?.themes?.darkMode;
};

// In-card confirmation popup, at the top of the card so it stays in view when the card is long.
export const DIALOG_STYLE = `
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
export const HIST_REFRESH = 5 * 60000;
export const HIST_WINDOW = 864e5;
export const HIST_PERIOD = 5 * 60000;
export function spark(points, end) {
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
export const statTime = (p) => (typeof p.start === "number" ? p.start : Date.parse(p.start));

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. The handler runs when the press and the release are both outside the card (a slider dragged out of the
// card does not count, and a scroll cancels the pointer); keyboard clicks (no click count) still go through the click
// event. The handler keeps its own checks (dialogs opened from the card…). `tap(ev)` is for the tests.
export const watchOutside = (card, handler) => {
  let downOutside = false;
  const outside = (ev) => !ev.composedPath().includes(card);
  const onDown = (ev) => {
    downOutside = outside(ev);
  };
  const onUp = (ev) => {
    if (downOutside && outside(ev)) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
  };
};

export class InternetBoxBase extends HTMLElement {
  // The speed tests started from the cards, by the entity that starts them: { at, mark }.
  static speedtestRuns = new Map();

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
    (this._onDialogOutsideWatch ??= watchOutside(this, (ev) => this._onDialogOutside(ev))).on();
    // Back on the page after leaving it: rendered again in its default state.
    this._update?.();
    if (!this._fitObserver && typeof ResizeObserver === "function") this._fitObserver = new ResizeObserver(() => this._fitPill?.());
    this._fitObserver?.observe(this);
    document.fonts?.ready?.then(() => this._fitPill?.());
    // Reattached with the popup still open (view switch, editor): Escape keeps closing it.
    if (this._dialog) window.addEventListener("keydown", this._onKey);
  }

  disconnectedCallback() {
    this._onDialogOutsideWatch?.off();
    this._fitObserver?.disconnect();
    // Left (another dashboard view, a conditional card hidden): back to the default state, so that the card does
    // not come back unfolded or with its popup open.
    this._dialog = null;
    window.removeEventListener("keydown", this._onKey);
    clearTimeout(this._speedtestTimer);
  }

  // Calls a Home Assistant service on an entity. A failed call is logged (Home Assistant already shows a toast) and
  // `onError` run.
  _call(domain, service, entityId, onError) {
    Promise.resolve()
      .then(() => this._hass?.callService(domain, service, { entity_id: entityId }))
      .catch((err) => {
        console.error(`internet-box-card: ${domain}.${service} failed`, err);
        onError?.();
      });
  }

  // Presses a Home Assistant button entity.
  _press(entityId) {
    this._call("button", "press", entityId);
  }

  // When the speed test's results last came. Speedtest.net and Fast.com: when their sensor was last written
  // (last_reported: also with the same values), the refresh that runs the test writing it once done. Another speed
  // test: when its values last changed (last_updated), its integration may write them again on every poll.
  _speedtestMark(sp) {
    const st = this._s(sp.download) || this._s(sp.upload);
    const refreshed = sp.run === sp.download || sp.run === sp.upload;
    return `${refreshed ? (st?.last_reported ?? "") : ""}|${st?.last_updated ?? ""}`;
  }

  // A speed test started from a card runs until its results come, or SPEEDTEST_RUN_MS at most. Shared by the cards of
  // the page (keyed by the entity that starts it): each shows it running.
  _speedtestRunning(sp) {
    const run = sp?.run && InternetBoxBase.speedtestRuns.get(sp.run);
    if (!run) return false;
    if (Date.now() - run.at < SPEEDTEST_RUN_MS && this._speedtestMark(sp) === run.mark) return true;
    InternetBoxBase.speedtestRuns.delete(sp.run);
    return false;
  }

  _runSpeedtest() {
    const sp = discoverSpeedtest(this._hass, this._config);
    if (!sp?.run || this._speedtestRunning(sp)) return;
    const run = { at: Date.now(), mark: this._speedtestMark(sp) };
    InternetBoxBase.speedtestRuns.set(sp.run, run);
    const [domain, service] = runService(sp.run);
    // A failed call: shown as stopped at once.
    this._call(domain, service, sp.run, () => {
      if (InternetBoxBase.speedtestRuns.get(sp.run) !== run) return;
      InternetBoxBase.speedtestRuns.delete(sp.run);
      this._update();
    });
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
    const sig = [h.entities, h.devices, h.language, h.locale?.language, h.config?.time_zone, h.themes?.darkMode];
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
    this._fitPill();
  }

  // The banner's status pill, measured after each render and on a new width (in every language): it sits on the
  // title's row, right after the title, only when the whole title and the pill's whole label fit there; otherwise it
  // takes a line of its own under the subtitle (.below), the title whole on its row (cut only when it does not fit
  // alone) and the subtitle on one line. When the three lines do not fit in the banner above the ground strip, or
  // the label does not fit its line, the pill shows its dot alone (.dot-only): beside the title when the whole title
  // leaves it room, else under the subtitle.
  _fitPill() {
    // Home Assistant's <ha-card> (a Lit element) shows its content only from its first update, a microtask after it
    // is connected: measured before, everything is 0 px wide and the pill lands on the wrong line. Fitted then.
    const haCard = this.shadowRoot?.querySelector?.("ha-card");
    if (haCard && haCard.hasUpdated === false) {
      this._pillWait ??= (haCard.updateComplete?.then ? haCard.updateComplete : new Promise((r) => requestAnimationFrame(r))).then(() => {
        this._pillWait = null;
        this._fitPill();
      });
      return;
    }
    for (const t of this.shadowRoot?.querySelectorAll?.(".header .titles") || []) {
      const row = t.querySelector(".trow");
      const chips = row ? [...row.querySelectorAll(":scope > .chip.status")] : [];
      if (!chips[0]?.getBoundingClientRect) continue;
      t.classList.remove("below", "dot-only");
      const name = row.querySelector(".name");
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const outer = (c) => c.getBoundingClientRect().width + (parseFloat(getComputedStyle(c).marginLeft) || 0) + (parseFloat(getComputedStyle(c).marginRight) || 0);
      const others = [...row.children].filter((c) => c !== name && !chips.includes(c) && c.getClientRects().length);
      const roomOf = () => row.getBoundingClientRect().width - others.reduce((w, c) => w + outer(c) + gap, 0);
      const title = name && getComputedStyle(name).display !== "none" ? textWidth(name) + gap : 0;
      const pills = () => chips.reduce((w, c) => w + c.getBoundingClientRect().width, gap * (chips.length - 1));
      // The classic header's box picture gives way to the title and its pill: smaller (.pic-small), then hidden
      // (.pic-none), the first step that leaves the whole title and the pill's whole label on one row. When none does,
      // the first step that leaves the whole title and the whole pill each on its own line, else no picture.
      const header = t.closest(".header");
      const pic = !header.classList.contains("banner") && header.querySelector(":scope > .box-link");
      header.classList.remove("pic-small", "pic-none");
      const steps = pic && pic.getClientRects().length ? ["", "pic-small", "pic-none"] : [""];
      const set = (step) => {
        header.classList.remove("pic-small", "pic-none");
        if (step) header.classList.add(step);
      };
      const beside = steps.find((step) => (set(step), title + pills() <= roomOf()));
      if (beside !== undefined) continue;
      set(steps.find((step) => (set(step), title - gap <= row.getBoundingClientRect().width && pills() <= t.getBoundingClientRect().width + 0.5)) ?? steps.at(-1));
      const room = roomOf();
      t.classList.add("below");
      const banner = t.closest(".banner") || t;
      const ground = banner.querySelector(".ground");
      const floor = ground ? ground.getBoundingClientRect().top : banner.getBoundingClientRect().bottom;
      const box = t.getBoundingClientRect();
      // Whole: the label not cut and the pill not past the title block (into the picture).
      const whole = chips.every((c) => {
        const tx = c.querySelector(".txt");
        return (!tx || tx.scrollWidth <= tx.clientWidth + 0.5) && c.getBoundingClientRect().right <= box.right + 0.5;
      });
      if (whole && box.bottom <= floor + 0.5 && box.top >= banner.getBoundingClientRect().top - 0.5) continue;
      t.classList.add("dot-only");
      if (title + pills() <= room) t.classList.remove("below");
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
    if (c.illustration !== false) {
      // Illustrated banner: the status pill on the title's row (under the device / firmware when there is no room); the
      // header chips (Wi-Fi, when the Services section is hidden) move to the top of the content.
      const link = this._link(box);
      const wifi = this._s(box.scalars.wifi);
      const scene = { ok: "ok", warn: "wait", crit: "down", off: "off" }[link?.cls] || "ok";
      const svg = sceneSvg({
        state: scene,
        wifi: !wifi || wifi.state !== "off",
        pic: c.show_image !== false ? boxImg : null,
        fit: boxImg ? PIC_FIT[model.pic ?? model.id] : null,
        href: adminUrl,
        label: `${model?.name || op.name} · ${this._t("admin")}`,
      });
      const btns = `${withChips ? this._restartBtn(box) : ""}${this._headerEnd()}`;
      return `
      <div class="header banner${isNight(this._hass, c) ? " night" : ""}">
        ${svg}
        <div class="ground ${scene === "down" ? "g-netdown" : "g-net"}"></div>
        <div class="htext">
          ${c.show_logo !== false ? brand : ""}
          <div class="titles">
            <div class="trow"><div class="name">${esc(name)}</div>${this._statusPill(box)}</div>
            ${sub.length ? `<div class="sub"><div class="parts">${sub.map((x) => `<span>${esc(x)}</span>`).join("")}</div></div>` : ""}
          </div>
        </div>
        ${btns ? `<div class="hbtns">${btns}</div>` : ""}
      </div>`;
    }
    return `
      <div class="header">
        ${c.show_logo !== false ? brand : ""}
        <div class="titles">
          <div class="trow"><div class="name">${esc(name)}</div>${this._statusPill(box)}</div>
          <div class="sub" title="${esc(sub.join(" · "))}"><div class="parts">${sub.map((x) => `<span>${esc(x)}</span>`).join("")}</div></div>
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
