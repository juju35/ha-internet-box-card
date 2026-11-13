# Changelog

## 3.5.1 - 2026-11-13

### Fixes
- Folding back on a tap elsewhere now works on iOS (Safari and the companion app): a tap on something that is not clickable sent no click to the page, so the restart confirmation popup and the detail view of the mini card stayed open. The press and the release are caught instead; a slider dragged out of the card and a scroll do not fold anything, and keyboard clicks still work.
- Leaving the card (another dashboard view, a conditional card hidden) brings it back in its default state, instead of coming back unfolded or with its popup open.

## 3.5.0 - 2026-11-12

### Features
- **Speed test button** ([#107](https://github.com/juju35/ha-internet-box-card/issues/107)): a button next to the last speed test runs a new one. With Speedtest.net or Fast.com, it refreshes their sensors (the integration runs a test); with another speed test, it uses the entity set in `entities.speedtest.run` (a button or an `input_button` pressed, a script run, an automation triggered), also in the visual editor. Its icon turns, and it can't be pressed again, until the new results come (3 minutes at most), on every card of the page showing that speed test; a failed call stops it at once. The README screenshots show the speed test.

## 3.4.0 - 2026-11-12

### Features
- `show_title` and `show_subtitle` options (also in the visual editor) hide the header's title and its subtitle, separately, for a card placed under a section heading of its own (asked in juju35/ha-vehicle-card#72).

## 3.3.0 - 2026-11-11

### Features
- **Sensors of your choice** ([#100](https://github.com/juju35/ha-internet-box-card/issues/100)): `entities` sets the sensors of another speed test than Speedtest.net (`speedtest`: `download`, `upload`, `ping`, from LibreSpeed, Speedtest Tracker or a sensor of your own) and of the box's values (`rate_down`, `rate_up`, `sync_down`, `sync_up`, `ip`, `boot`, `wifi`, `missed`). The box rates and the speed test can be picked in the visual editor, under **Sensors of your choice**.
- **Fast.com**: its last test (download) shows when Speedtest.net is not set up.

## 3.2.1 - 2026-11-11

### Fixes
- **Livebox** on fibre not found with the Livebox integration 3.0.0 ([#98](https://github.com/juju35/ha-internet-box-card/issues/98)): since that release every interface rate shares the translation key `interface_rate_rx` / `interface_rate_tx` instead of one built from the interface name, so the `WAN_GPON` / `WAN_SFP` rates were no longer recognised. The WAN interface (`WAN_GPON`, `WAN_SFP`, or `veip0` on the boxes with a built-in ONT) is now also told by its name in the entity id, in any language; never a sub-interface nor the DS-Lite tunnel. The keys of the earlier releases still work.
- **Livebox 5** by Sagemcom (`SagemcomFast5656_OFR`, "Livebox Fibre") detected and drawn as a Livebox 5, like the Arcadyan one.

## 3.2.0 - 2026-11-11

### Features
- **Bbox**: the "Bouygues Bbox" integration ([hass-bbox2](https://github.com/cyr-ius/hass-bbox2), custom, config flow) is supported. It shares the `bbox` domain with the legacy platform but registers a device whose sensors have no translation key, so the box was not found ([#93](https://github.com/juju35/ha-internet-box-card/issues/93)). Its download / upload rates, link status, public IPv4 / IPv6, uptime, Wi-Fi switch, connected devices and restart button are recognised by their entity-id suffix.
- **Bbox Wi-Fi 7** model (`bbox_wifi7`, Sagemcom F@st 5696b), detected from the hass-bbox2 device model, drawn with the generic router silhouette.

## 3.1.0 - 2026-11-10

### Features
- The header icon takes the colour of the internet link state, like the status pill: green online, orange while the DSL line syncs, red offline or on a line fault, grey when unavailable. It keeps the operator colour when the box exposes no link state. On both the full and the mini card.

## 3.0.1 - 2026-11-10

### Fixes
- A device of another integration linked to the box in the device registry is no longer taken for one of the box's own child devices (disks): FRITZ!Box Tools links its network clients to the box or to the mesh repeater they go through, a NAS or a printer merged in by its MAC address among them. Only the children of the box's own config entry are read.

## 3.0.0 - 2026-11-10

### Breaking changes
- The `freebox-card.js` copy of the bundle is no longer built nor attached to the releases. A dashboard resource that still loads `freebox-card.js` must point to `internet-box-card.js`. The former card types `custom:freebox-card` and `custom:freebox-mini-card` stay registered.

## 2.11.0 - 2026-11-10

### Features
- **Eight more integrations**, grouped by country in the README:
  - **FRITZ!Box** (`fritz`, Germany and neighbours): download / upload rates, WAN connection, external IPv4 / IPv6, uptime, CPU temperature, main Wi-Fi switch, connected devices, reboot; the DSL line sync rates when there is no traffic sensor.
  - **Vodafone Station** (`vodafone_station`, Germany, Italy, United Kingdom, Ireland): rates, active connection, external IPs, uptime, main Wi-Fi switch, connected devices, reboot.
  - **Swisscom Internet-Box** (`swisscom`, Switzerland): connected devices (the integration has no entity for the box, so the integration is the box, `box: platform:swisscom`).
  - **Sagemcom F@st** (`sagemcom_fast`, custom): found by its reboot button, with connected devices; the gateway model gives the provider and its colour and links: Telekom Speedport Pro, BT Smart Hub, eir F3000, Salt FibreBox X6, KPN Experia Box 12 and F@st 4360Air, DELTA F@st 3890V3, Proximus b-box 3, MásMóvil, Telia, TDC, Bell Home Hub 3000 / 4000, Optus.
  - **KPN Box 12** on the Livebox integration (Livebox OS), with the KPN colour and links.
  - **Huawei LTE** (`huawei_lte`): rates, mobile connection, WAN IPs, uptime, Wi-Fi state (read only, no switch), reboot.
  - **ZTE Hyperbox** (`zte_hyperbox`, custom): rates, connection and reboot recognised by their kind.
  - **Starlink** (`starlink`): throughput, connectivity, uptime (last restart), reboot, with a satellite connection icon.
- **Bbox**: the uptime sensor is shown, and the `custom_bbox` fork (for the firmwares the built-in integration can no longer reach) is documented; it creates the same sensors.
- Public IP and uptime are also read from the integration's own sensors (external IP, uptime as a boot date or a duration), not only from the box tracker.
- The boxes of the new integrations are drawn with generic form factors (router, hub, tower, 4G / 5G box, dish), with the device's own model name, their status lights and trim in the provider's colour; the providers' logos are embedded.

- Vodafone Station: the status pill shows the active connection (xDSL, fibre, Internet Key) while there is one.

### Fixes
- The device name under the title is left out when the title already contains it (Huawei LTE "B535-232").
- A restart button that has a translation key of its own (a reconnect button) is no longer taken for the box reboot.
- The Wi-Fi switch is shown only when the Wi-Fi entity is a switch.

## 2.10.1 - 2026-11-09

### Maintenance
- No code change: released again to check the installation from the Marketplace.

## 2.10.0 - 2026-11-09

### Features
- **Speed test**: the last test of the Speedtest.net integration (download, upload, ping) shows in the network section next to the uptime, found automatically, in the rate unit chosen; a click opens its download sensor. `show_speedtest: false` hides it.

## 2.9.1 - 2026-11-09

### Fixes
- Translations: the cards are defined once the page's language file has arrived (at most 1.5 s; Home Assistant builds a card when its element gets defined), so the first render is already translated instead of English then redrawn; until a language file is in, a missing text reads the English one wherever the card has no fallback of its own.

## 2.9.0 - 2026-11-09

### Performance
- **Translations load on demand**: the bundle keeps English only (224 KB → 170 KB) and each other language is its own `internet-box-card.i18n.<lang>.js` file next to it, fetched the first time a card needs it. Home Assistant loads every dashboard resource on every dashboard, so each page used to download and parse all 22 languages to use one. Until a language file has arrived (a few milliseconds), texts fall back to English, and the cards redraw once it is there.

### Maintenance
- Build: `scripts/i18n-split.mjs` splits the built bundle and rebuilds every table from the split files to check them (the build fails on any difference); `src/` keeps every language as before.
- Release: every file of `dist/` is attached. Manual installation copies the translation files too.

## 2.8.1 - 2026-11-09

### Fixes
- Livebox on a fibre line (GPON or SFP, for example the Arcadyan "Livebox Fibre"): the box is now discovered and its download / upload rates read from the WAN interface statistics sensors (`WAN_GPON Rate Rx / Tx`), as the integration creates no `down_rate` / `up_rate` sensor there; the box was previously missing from the editor and reported as not found even with its device id (#61). The Wi-Fi, Ethernet and DS-Lite interface rates are never taken for the box rates.
- Livebox: the Arcadyan Livebox Fibre (`ArcadyanLBFIBRE_OFR`) is drawn as a Livebox 5 (#61).
- Livebox: the missed calls are counted from the "call missed" binary sensor (its `missed_calls` list), no longer from the `callers` sensor, which counts every call, missed or not (#61). Without that sensor, the `callers` list is filtered on the missed ones.

## 2.8.0 - 2026-11-08

### Changes
- Display aligned with the other cards (system-monitor, docker, switch): the download tile is green and the upload tile blue, as everywhere else, instead of the operator red; storage percentages are rounded like the other gauges.
- Options renamed `storage_warning` / `storage_critical` → `disk_warning` / `disk_critical` (the names of system-monitor-card); the old names are still read.

## 2.7.0 - 2026-11-08

### Features
- A switch next to the Wi-Fi state (Services tile, header chip and mini card footer) turns the box's Wi-Fi on, or off after a confirmation popup at the top of the card.

### Fixes
- The IP address and the uptime are shown in the Network section even when the box has no rate or line sync sensor.
- Serbian (Cyrillic): Wi-Fi is written "Вај-фај", without Latin letters.

## 2.6.0 - 2026-11-08

### Features
- The restart confirmation popup is a proper modal dialog for keyboard and screen reader users: named by its title, Tab stays on its two buttons, Escape closes it wherever the focus is, and the focus goes back to the restart button.
- Rates use the decimal separator of the card's language ("1,5 Mo/s" in French).

### Fixes
- A click elsewhere on the page that closes the restart popup now also reaches what was clicked; the mini card stays on its full view for that click.
- The second click of a double click on the popup's button no longer acts on what lies under it.
- A download or upload tile without its sensor is no longer clickable nor focusable.

## 2.5.0 - 2026-11-07

### Features
- The connection status shows the real link state from the integration when it has one: the WAN status of the Livebox (with its link type) and the WAN, DSL or FTTH status of the SFR Box, with "Syncing" while the DSL line trains and "Line fault" on a line defect; the box's tracker remains the fallback.
- The temperature and disk usage thresholds can be set with `temp_warning`, `temp_critical`, `storage_warning` and `storage_critical` (also in the visual editor); the defaults are unchanged (75 / 90 °C, 80 / 90 %).
- The 24 h rate curves use a real time axis and break where the recorder has no data, instead of joining the remaining points evenly spaced.

## 2.4.1 - 2026-11-07

### Fixes
- SFR Box: the DSL line sync rates are no longer shown as download / upload traffic (the `sfr_box` integration has no throughput sensor). They show as "Line rate" tiles, without the 24 h traffic curve.

## 2.4.0 - 2026-11-07

### Features
- Mini card: the folded download and upload tiles also draw their last 24 hours, like the full card (`show_history`, now also in the mini card editor).

## 2.3.0 - 2026-11-07

### Features
- Full card: the download and upload tiles draw their last 24 hours behind the rate (recorder 5-minute statistics, refreshed every 5 minutes). `show_history: false` turns it off (also in the visual editor).

## 2.2.2 - 2026-11-04

### Documentation
- README: images and links use absolute URLs, so the screenshots, icons, badges and links display in HACS (relative paths broke there).
- README: screenshots get a display size, so cards no longer show oversized in HACS and on GitHub.

## 2.2.1 - 2026-11-04

### New
- Added Romanian, Danish, Swedish, Bulgarian, Russian, Ukrainian, Hungarian, Slovak, Czech, Slovenian, Latvian and Greek translations: `ro`, `da`, `sv`, `bg`, `ru`, `uk`, `hu`, `sk`, `cs`, `sl`, `lv` and `el`, picked automatically from the Home Assistant language and offered in the visual editor.
- The missed calls agree with the count in the new languages that have a singular or dual form ("1 непринятый", "2 zgrešena", "1 αναπάντητη"…); Hungarian keeps a single form.
- Partition names: the "free space" words of the core Freebox integration are also stripped in Swedish, Hungarian, Slovak and Czech.

### Maintenance
- Tests for the language resolution of the new languages, their editor labels, their missed-call forms and partition names, and, in Chromium, the header and status pill of the longest new translations (Greek, Bulgarian, Ukrainian, Slovenian) at the narrowest widths.

## 2.2.0 - 2026-11-03

### Features
- **Header**: the operator logo becomes an icon of the kind of connection (fibre, xDSL, 4G / 5G, else a generic box), tinted with the operator colour, with the operator logo as a badge, on the full card and the mini card. The connection comes from the box's `connection_type`, else from the model name (Bbox Fibre). The box picture is unchanged.

## 2.1.7 - 2026-11-02

### Fixes
- **Mini card**: the box brand logo keeps its full size (40 px) in the compact view, like the full card.

## 2.1.6 - 2026-11-01

### Fixes
- **Unavailable entities**: while the box restarts (or when an entity is unavailable or unknown), the card no longer shows "Wi-Fi Off", "0 missed" calls, "Offline", a RAID "OK" or a green dot on the partition: they read "Unavailable" in a neutral colour. The "mark as read" button is hidden and the restart button is disabled until the box's buttons are available again.
- **Narrow cards**: at 6 columns of a narrow section the title disappeared behind the box picture and the status pill. The title now keeps a few characters, the box picture gets smaller then is hidden up to 340 px (12 columns of a phone section) so that the status pill under the title keeps its whole text, and the status pill shows only its coloured dot below 245 px (9 columns of a phone section); above that it shows its whole text, also while the box is offline. The rates stack one under the other, and the partition name no longer gives way to the disk model. The full card now needs at least 9 columns in the Sections view (the mini card still 6).
- **Mini card detail view**: on a narrow mini card (6 columns), the detail and restart buttons of the zoomed view were pushed out of the card; they now always stay inside it.
- **Connected devices**: when every client tracker is unavailable the tile reads "Unavailable" instead of "0 / 6"; unavailable trackers are left out of the count.
- **Layout card, button card**: in a container sized by its content (an inline block, an `auto` grid column) the card no longer collapses to a few pixels, and side by side in two columns it still shares the width, also when each card is wrapped in its own block (as layout-card does) instead of overflowing its column.
- **Keyboard**: moving the focus to the detail button or the restart confirmation no longer scrolls the page.
- **Plurals**: "1 manqué" in French, "1 perdida" in Spanish, and the three Serbian forms ("1 пропуштен", "2 пропуштена", "5 пропуштених").

### Maintenance
- Tests for unavailable entities, the missed-call plurals of every language (1, 2, 5, 21, 22) and, in Chromium, the cards at their narrowest widths in English, Polish and Serbian, the zoomed mini card, the status pill text, content-sized and two-column containers (card placed directly or wrapped in a block) and the focus.
- The GIF screenshots are now identical from one run to the next, and unchanged screenshots are no longer rewritten (the comparison checks every colour channel, not only transparency).

## 2.1.5 - 2026-11-01

### New
- Added Italian, Dutch, European Portuguese and Polish translations: `it`, `nl`, `pt` and `pl`, picked automatically from the Home Assistant language (`pt-BR` falls back to European Portuguese) and offered in the visual editor.

### Maintenance
- Tests for the language resolution of the new languages (`it-IT`, `nl-BE`, `pt`, `pt-BR`, `pl-PL`, `ja` falling back to English), the rate units of every language and the editor language options.

## 2.1.4 - 2026-11-01

### New
- Added Serbian (Cyrillic and Latin) translations: `sr` and `sr-Latn`, picked automatically from the Home Assistant language and offered in the visual editor.

### Maintenance
- Tests for the language resolution (`sr-Latn` from Home Assistant, `pt-BR` falling back to English), the placeholders and the script of the Serbian translations.

## 2.1.3 - 2026-10-29

### Fixes
- **Readable colours in dark and light themes**: the operator accent (the dark blue of the Bbox, the Freebox and SFR reds, the Livebox orange) and the state colours are blended with the theme text colour wherever they colour text or icons: download and upload icons, restart popup icon, status and Wi-Fi pills, missed calls and their "mark as read" button. Text now reaches a 4.5:1 contrast and icons 3:1 in Home Assistant's default themes; the Bbox download arrow was nearly invisible on a dark card. The restart confirmation button keeps its red tint with the theme text colour.
- **Bbox Miami picture**: the top face shows its dark gradient again instead of a flat black.
- **Reduced motion**: with "reduce motion" set in the system, the bars and gauges no longer animate (the fans already stopped spinning).

### Maintenance
- Dependabot also proposes pre-commit hook updates, and the Biome check reads its version from the pre-commit configuration.
- Tests for the colour contrast in both themes, the box pictures' gradient references and reduced motion.

## 2.1.2 - 2026-10-29

### Fixes
- **Several Bbox (legacy integration)**: with two Bbox whose names start the same way (for example `Bbox` and `Bbox Salon`), the first card no longer shows the download and upload rates of the second box, and the visual editor lists them as "Bbox (sensor.bbox)" and "Bbox (sensor.bbox_salon)" instead of two identical "Bbox" entries.

## 2.1.1 - 2026-10-29

### Fixes
- **Temperatures with the imperial unit system**: the temperature thresholds and gauges now convert the sensor value to °C first, and the mini card shows the sensor's own unit, so 122 °F is no longer shown as "122°C", in red, with a full gauge.
- **Visual editor**: the box selected by default is now saved in the card configuration, and a box model of another operator is cleared when another box is picked; the editor no longer rebuilds its form on every Home Assistant state change.
- **Translations**: fan speeds in the user's language (tr/min, U/min), translated fallback name for disks, "espacio libre" removed from Spanish partition names, uptime label written the same way in every language ("Uptime 3 d 4 h"), German "Tg." for days, Spanish "En línea / Fuera de línea".

### Maintenance
- CI: fork-safe screenshots workflow checkout, Chromium system dependencies installed in a time-boxed, retried step that fails explicitly after 3 attempts, Dependabot also tracks npm (Playwright), and the Lint, Validate and HACS checks are re-run on the commit pushed by the screenshots workflow.
- Internal clean-ups: shared rate tile, no in-place sort of a cached list, unused generic brand icon removed.

## 2.1.0 - 2026-10-28

### Changes
- **German and Spanish translations**: the cards and the visual editor are available in German (`de`) and Spanish (`es`), auto-detected from the Home Assistant language or forced with the `language` option (also selectable in the editor).

### Maintenance
- Test checking that every language has exactly the English keys and its rate units.

## 2.0.1 - 2026-10-28

### Fixes
- **Box model in the visual editor**: the model dropdown now lists the detected operator's own models (Livebox, SFR Box, Bbox) instead of always the Freebox ones, so a Bbox model (required by the `model` option) can be picked from the editor.
- **Performance**: entity discovery and uptime computations are cached instead of being recomputed on every state change.
- README: the card shows no picture when the box model is unknown and `model` is unset (no Freebox Ultra fallback); the restart button needs the Home Assistant application to be allowed to modify the Freebox settings in Freebox OS; screenshots of the card for every operator.

### Maintenance
- Internal CSS variables renamed `--fb-*` → `--ibc-*`, leftover Freebox wording removed from operator-generic code.
- CI: fork-safe screenshots workflow, release gated on `npm test`, `hacs/action` pinned to a tagged release, unused Ruff config removed.

## 2.0.0 - 2026-10-28

### Changes
- **Renamed Internet Box Card**: the cards are now **Internet Box Card** / **Internet Box Mini Card**, types `custom:internet-box-card` / `custom:internet-box-mini-card` (card picker and HACS name too), since they are no longer Freebox-only. The former types `freebox-card` and `freebox-mini-card` stay registered: existing dashboards keep working.
- The file is now `internet-box-card.js` (`hacs.json`, build, release). Releases still attach a `freebox-card.js` copy for manual installs. **After updating, check that the dashboard resource points to `internet-box-card.js`.**
- The repository is renamed `ha-internet-box-card` (formerly `ha-freebox-card`, GitHub redirects the former address); links updated.
- **Operator logos**: the header shows the Free, Orange, SFR and Bouygues Telecom logos (the Free logo is now an SVG), each opening its operator website.
- **Bbox pictures**: original stylised drawings of the Bbox Fibre, Ultym and Miami, set with the `model` option (`bbox_fibre`, `bbox_ultym`, `bbox_miami`).
- Editor and dialog texts are operator-neutral ("Restart the box", "Box model"…).
- README rewritten for every operator (supported integrations, models, upgrade notes).

### Fixes
- **Bbox discovery**: the Bbox integration registers no device and no unique id, so its sensors are not in the entity registry and the card could not find them. They are now found in the states by their entity-id suffix, and the Bbox is listed in the box selector.

### Maintenance
- Source `src/internet-box-card.js`, classes `InternetBoxCard` / `InternetBoxMiniCard`, editors `internet-box-card-editor` / `internet-box-mini-card-editor`; the release attaches both files.

## 1.22.0 - 2026-10-28

### Changes
- **SFR Box pictures**: original stylised drawings of the SFR Box 8 (rounded cube with a glossy top and a mesh body), the SFR Box 7 (tall slim upright mesh box on a foot) and the NB6VAC / Box Plus/Power (low, wide, glossy box with a status-light column and a ventilation grille), detected from the device model. Stylised originals, no logos.

## 1.21.0 - 2026-10-28

### Fixes
- **Realistic Livebox pictures**: redrawn to match each model — the Livebox 6 and 7 are now dark anthracite upright boxes with a flat top, a fabric-effect finish, an orange status light line (the 7 adds a white dot) and a front screen; the Livebox 4 is a dark box with a rounded top and a front display; the Livebox 5 a light upright box; the Livebox S a small light box.

## 1.20.0 - 2026-10-28

### Changes
- **Livebox (Orange) support with per-model pictures**: the card now draws the Livebox models (4, 5, 6, 7, S) as original stylised pictures and shows its download / upload rate, Wi-Fi, missed calls (with a clear button) and reboot, with the Orange accent colour. The rate sensors are the line sync rate the integration exposes.

## 1.19.0 - 2026-10-28

### Changes
- **Other operators are now discovered** (foundation for multi-operator support): the cards recognise the Livebox (Orange, `livebox`), SFR Box (`sfr_box`) and Bbox (Bouygues, `bbox`) integrations in addition to the Freebox, each from its own entity keys (or entity-id patterns for the Bbox). The header adopts the detected operator's name, accent colour and admin/website links, with a tinted generic box icon when no brand logo is available. Freebox behaviour is unchanged. Per-model box pictures for the new operators come next.

## 1.18.0 - 2026-10-27

### Changes
- **Status pill moves under the title on narrow cards**: on a narrow full card (or zoomed mini) the "Online · FTTH" pill now drops below the title instead of squeezing it on the same line, so the Freebox name stays fully readable while the picture remains visible. On wider cards the pill stays on the title line as before.

## 1.17.0 - 2026-10-27

### Fixes
- **Wi-Fi no longer shown twice on the full card**: the Wi-Fi chip under the title duplicated the Services section's Wi-Fi tile. The chip is now shown only when the Services section is hidden (`show_services: false`); otherwise the Services tile is the single Wi-Fi indicator.

## 1.16.0 - 2026-10-27

### Fixes
- **Expanded view always shows the Freebox picture**: on the full card (and the zoomed mini) the picture now only shrinks on narrow cards and is never hidden, so it stays visible whenever the card is expanded. The title may be shortened on very narrow cards instead.

## 1.15.0 - 2026-10-27

### Fixes
- **Mini card keeps its Freebox picture**: the narrow-card rule that shrinks then hides the picture now applies only to the full card (and the zoomed mini), whose header also carries the status pill and restart button. The compact mini card — which has neither — always shows the picture again.

## 1.14.0 - 2026-10-27

### Fixes
- **Header on narrow cards**: the Freebox picture now yields space before the title — it shrinks, then is hidden on the narrowest cards (container queries) — so the name and status pill stay readable instead of the title being truncated to a few letters when the restart button, status pill and picture share a tight header.

## 1.13.0 - 2026-10-27

### Changes
- **Restart button**: a round button at the top right of the full card reboots the Freebox (the integration's **Reboot** button), after a confirmation popup shown at the top of the card. It appears only when the integration exposes the reboot button, which is discovered by its translation key or its `restart` device class.

## 1.12.0 - 2026-10-26

### Fixes
- **Mini card**: the detail button now sits flush top-right and vertically centred on the header, matching the other cards (it was pinned to the top and pulled slightly left).

## 1.11.0 - 2026-10-26

### Fixes
- **README**: the screenshots table labelled its right column "Dark (French)", but `scripts/screenshots.mjs` renders every screenshot (light and dark) in English (`language: "en"`). The label is now simply "Dark" to match the images.

## 1.10.0
### Changes
- The Free logo tile in the header is 40 × 40 px on the full card (was 36 px) and 32 × 32 px on the mini card, like the header icon of the other cards; the logo stays left of the title.
- The status pill ("Online · FTTH") sits in the header row, right of the title and before the Freebox picture, instead of under the title; the Wi-Fi chip stays under the title. The Free logo is top-aligned.
- The subtitle no longer gets cut off next to the Freebox picture: when the device name and firmware do not fit on one line, the firmware goes to a second line.
- The status pill is centred on the title line, not on the whole title block, when the subtitle takes two lines.
- Header geometry: the body starts 8 px below the header on both cards (was 4 px), the logo 12 px from the card's top edge.

### Maintenance
- Browser test for the status pill position.

## 1.9.0

### Changes
- The Freebox pictures are drawn instead of photos (Ultra, Pop, Delta, Revolution, mini 4K): rounded boxes as an extruded top shape, square boxes in parallel projection, each with its details (Ultra and Pop "free" pill, Delta dot-matrix clock on its tall curved front, yellow 13/37 display of the Revolution and mini 4K, Revolution red tab). Sharp at any size.

### Maintenance
- The README shows the same drawings (`images/freebox-<model>.svg`, written by `npm run screenshots`); a test checks they match the card. Screenshots regenerated.

## 1.8.1

### Fixes
- **Freebox Mini Card**: the missed calls are always shown in the footer when the Freebox reports them, as on the Calls tile of the full card: plain phone icon at 0, orange with the count and the "mark as read" button when there are some (they were hidden at 0).

### Maintenance
- The full and mini cards share the missed calls chip logic; browser test of the chip at 0.

## 1.8.0

### New
- Detail button at the top right of the **Freebox Mini Card**: it shows the full Freebox card in place of the mini card (same Freebox and options, every section), and the collapse button brings the compact view back. A click anywhere outside the card folds it back too; a click inside it, or in a dialog opened from it (more-info), does not. From the keyboard, the focus stays on the button.
- `zoom` option of the mini card (on by default; `zoom: false` removes the button), with its switch in the visual editor (**Detail button**).
- The card size given to the dashboard follows the view shown.

### Maintenance
- Browser test of the detail button; screenshots of the zoomed-in mini card.

## 1.7.2

### Fixes
- Screen readers can reach the **Mark calls as read** button of the missed calls tile (full card) and of the missed calls in the mini card footer: it is no longer inside an element announced as a single button. The keyboard target is now the label of the missed calls; a click anywhere on the tile still opens the more-info dialog.

### Maintenance
- Browser test for the missed calls controls; the duplication check job runs on Node 22.

## 1.7.1

### Changes
- The README header no longer shows the Freebox Ultra picture, whatever the model: the pictures of every model are in the **Supported models** section.

## 1.7.0

### New
- Pictures of every Freebox model supported by the Freebox integration: Ultra, Pop, Delta, Revolution and mini 4K. The card shows the picture of the detected model instead of always the Freebox Ultra.
- `model` option (`ultra`, `pop`, `delta`, `revolution`, `mini_4k`) to choose the model, for its picture and the default title; in the visual editor, the **Freebox model** dropdown defaults to **Automatic** and shows the detected model.

## 1.6.1

### Changes
- Running Home Assistant in Docker: start the container with `TZ` set to the time zone of Home Assistant (for example `-e TZ=Europe/Paris`), otherwise the uptime is off by the UTC offset. The README now documents this limit (the integration gives the boot date without a time zone); Home Assistant OS and Supervised are not affected.
- The README explains that, with a single Freebox, "Devices x / y" also counts the client trackers that have no device of their own.

### Fixes
- When a list changes order (temperatures, fans, partitions, service tiles, mini card footer), the keyboard focus stays on the same item instead of landing on another row. In browsers that cannot move an element without losing its focus, the focus is dropped rather than moved to another row.
- The README screenshots show the right uptime.

### Maintenance
- Browser tests (Chromium) for the in-place updates, run in CI; screenshots taken with a fixed clock and a fresh page per capture; duplication check skips the tests.

## 1.6.0

### Fixes
- "Devices x / y" now counts the Freebox client trackers that have no device of their own (most of them), so the figure goes up to the real number of clients. With several Freeboxes, those trackers stay uncounted rather than counted twice.
- Uptime is no longer shifted when the browser is in another time zone than Home Assistant.

### Changes
- The card only re-renders when something it shows changes, and updates the page in place: keyboard focus, hover and text selection survive updates, the bars, rings and chevrons animate again, and the box pictures are not decoded again on every poll. The uptime still ticks every minute.
- Keyboard access: clickable tiles and gauges can be reached with Tab and opened with Enter or Space, with a visible focus outline.
- A failure of **Mark calls as read** is logged instead of raising an unhandled error.
- The README says that the devices count is the one value that does not open a more-info dialog.

### Maintenance
- CI hardened: actions pinned by commit SHA, read-only token permissions, Dependabot for action updates, duplication report annotated on pull requests.
- Unit tests (`npm test`, run in CI); discovery cached on the registries instead of being recomputed on every state change.

## 1.5.2

### Maintenance
- Tooling only, no functional change: Biome linting, pre-commit and a Lint CI (duplication checks). Card source modernized (optional chaining, template literals), identical behavior.

## 1.5.1

### Changes
- The mini card gets the button too: a small check next to the missed calls count in its footer marks them as read.

## 1.5.0

### What's new
- A check button on the calls tile marks the missed calls as read: it presses the Freebox integration's **Mark calls as read** button and only shows when there are missed calls. The rest of the tile still opens the missed calls sensor.

### Changes
- The service tiles size to their content, so "2 manqués" keeps room next to the button.

## 1.4.0

### Changes
- More compact layout with the same information, like the other ha-* cards: 12 px card padding, 36 px header icon, 16 px name and 12 px subtitle, 11 px pills, tighter tiles and sections.
- Box picture 64 → 48 px, Free logo tile 36 px, temperature gauges 64 → 52 px; storage on one line with its bar underneath.
- The mini card picks up the smaller pills and subtitle.

## 1.3.0

### Changes
- The Free logo sits in a 40 px tile left of the title, like the logos of the other ha-* cards, instead of above it.
- HACS now asks for Home Assistant 2024.8 or later, the version that brought the sections view the card supports; the README says so under **Prerequisites**.

### Fixes
- "Uptime: 10 d" in English, without the French space before the colon.

### Maintenance
- CHANGELOG headings use the same plain English set as the other ha-* repositories.

## 1.2.0

### Changes
- The warning color falls back to Home Assistant's default `#ffa600` (was `#ffa000`), like the other ha-* cards. The upload tile uses `--info-color` instead of a fixed blue.

### Development
- The built card is no longer committed in `dist/`: CI builds it on every push, and the release workflow builds it and attaches it to the release, which is where HACS downloads it from.
- Releases are published when `version` in `package.json` has no tag yet: bump the version, add its CHANGELOG section and push, like the other ha-* repositories (the manual Release workflow run is no longer needed).
- Issue templates, and stale, release notes and merged-branch cleanup workflows, shared with the other repositories.

## 1.1.1

### Maintenance
- Validate workflow and README badges aligned with the other ha-* repositories. Nothing changes for users.

## 1.1.0

### What's new
- Click the Free logo to open [free.fr](https://www.free.fr), and the Freebox picture to open the Freebox OS admin interface (in a new tab).
- New `admin_url` option (also in the visual editor) to change the Freebox OS address, `https://mafreebox.freebox.fr` by default.

## 1.0.0

First release of the Freebox cards for Home Assistant, built for the [Freebox integration](https://www.home-assistant.io/integrations/freebox/).

| Freebox Card | Freebox Mini Card |
|---|---|
| ![freebox-card](https://raw.githubusercontent.com/juju35/ha-freebox-card/main/screenshots/card.png) | ![freebox-mini-card](https://raw.githubusercontent.com/juju35/ha-freebox-card/main/screenshots/mini-card.png) |

### What's new
- **Freebox Card** (`custom:freebox-card`): model and firmware, connection status and type, download / upload rates, public IP and uptime, temperature gauges, fans, disk partitions and RAID status, Wi-Fi, missed calls and connected devices.
- **Freebox Mini Card** (`custom:freebox-mini-card`): compact overview with download / upload, connection, hottest temperature, Wi-Fi, missed calls and uptime.
- **Automatic discovery** of the integration entities through the entity registry (translation keys): no entity to pick, translated entity ids and several Freebox supported.
- **Visual editor** for both cards: Freebox, title, sections to display, rate unit (bytes or bits) and language.
- Orange / red colors when temperatures or disk usage cross a threshold.
- Click any value to open its history (more-info dialog).
- Light and dark mode, English and French.
- Single file with no external dependency, the Freebox picture and the Free logo are embedded.

### Installation
[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=juju35&repository=ha-freebox-card&category=plugin)

Open the link above (or add `https://github.com/juju35/ha-freebox-card` as a **Dashboard** custom repository in HACS), click **Download**, then reload your browser. Manual install: copy `freebox-card.js` from the assets below to `/config/www/` and add `/local/freebox-card.js` as a JavaScript Module resource.

### Quick start
```yaml
type: custom:freebox-card
```

```yaml
type: custom:freebox-mini-card
```

All options are described in the [README](https://github.com/juju35/ha-freebox-card#configuration).
