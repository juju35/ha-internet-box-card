// ---------------------------------------------------------------------------
// Full card
// ---------------------------------------------------------------------------
import { ICONS } from "./core.js";
import { esc, fmtRate, fmtUptime, noValue, num, numLang, svgIcon, temperature, toBps } from "./helpers.js";
import { boxFor, brandOf, discoverSpeedtest, listBoxes, partitionLabel, shortName } from "./entity-discovery.js";
import { BANNER_STYLE, BASE_STYLE, InternetBoxBase } from "./shared-styles.js";

export const ring = (pct) => {
  const r = 26;
  const c = 2 * Math.PI * r;
  const p = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  return `<svg class="ring" viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="${r}" class="track"/>
    <circle cx="32" cy="32" r="${r}" class="value" stroke-dasharray="${((p / 100) * c).toFixed(1)} ${c.toFixed(1)}"/>
  </svg>`;
};

export const FULL_STYLE = `
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
  .facts .run:hover:not([aria-disabled]) { background: color-mix(in srgb, var(--primary-color) 15%, transparent); }
  .facts .run[aria-disabled] { cursor: progress; }
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
  /* At 6 columns of a narrow section: the dot goes to the subtitle line, the title takes the whole first line. */
  @container (max-width: 200px) {
    .titles > .name { grid-column: 1 / -1; }
    .titles > .chip.status { grid-row: 2; }
    /* The zoomed mini card has both the restart and the detail buttons: the logo gives them its place. */
    .header:has(.zoom) .logo-link { display: none; }
  }
`;

export class InternetBoxCard extends InternetBoxBase {
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
    // With the illustrated banner, the header chips open the content.
    if (c.illustration !== false) parts.unshift(this._chips(box));
    return `<style>${BASE_STYLE}${FULL_STYLE}${c.illustration !== false ? BANNER_STYLE : ""}</style>
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

  // The button that starts a speed test, its icon turning while the test runs. aria-disabled, not disabled, while it
  // runs: the button keeps the keyboard focus.
  _speedtestButton(sp) {
    if (!sp.run || this._s(sp.run)?.state === "unavailable") return "";
    const running = this._speedtestRunning(sp);
    const label = esc(this._t(running ? "speedtest_running" : "run_speedtest"));
    return `<button type="button" class="run" data-action="speedtest" title="${label}" aria-label="${label}"${
      running ? ' aria-busy="true" aria-disabled="true"' : ""
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
