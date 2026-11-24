// ---------------------------------------------------------------------------
// Mini card
// ---------------------------------------------------------------------------
import { ICONS } from "./core.js";
import { esc, fmtUptime, inDialog, noValue, svgIcon, temperature } from "./helpers.js";
import { boxFor, brandOf } from "./entity-discovery.js";
import { BANNER_STYLE, BASE_STYLE, watchOutside } from "./shared-styles.js";
import { InternetBoxCard } from "./full-card.js";

export const MINI_STYLE = `
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
export class InternetBoxMiniCard extends InternetBoxCard {
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
    (this._onOutsideWatch ??= watchOutside(this, (ev) => this._onOutside(ev))).on();
    // Back on the page after leaving it: rendered again in its default state.
    this._update?.();
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    this._onOutsideWatch?.off();
    // Left (another dashboard view, a conditional card hidden): back to the default state, so that the card does
    // not come back unfolded or with its popup open.
    this._zoomed = false;
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
    return `<style>${BASE_STYLE}${MINI_STYLE}${c.illustration !== false ? BANNER_STYLE : ""}</style>
      <ha-card style="--ibc-red:${brandOf(box, this._config).color}">
        ${this._header(box, false)}
        <div class="content">
          ${parts.join("")}
          ${foot.length ? `<div class="foot">${foot.join("")}</div>` : ""}
        </div>
      </ha-card>`;
  }
}
