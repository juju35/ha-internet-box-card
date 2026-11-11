# ha-internet-box-card

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![HACS Validation](https://github.com/juju35/ha-internet-box-card/actions/workflows/hacs.yml/badge.svg)](https://github.com/juju35/ha-internet-box-card/actions/workflows/hacs.yml)
[![Validate](https://github.com/juju35/ha-internet-box-card/actions/workflows/validate.yml/badge.svg)](https://github.com/juju35/ha-internet-box-card/actions/workflows/validate.yml)
[![Lint](https://github.com/juju35/ha-internet-box-card/actions/workflows/lint.yml/badge.svg)](https://github.com/juju35/ha-internet-box-card/actions/workflows/lint.yml)
[![Release](https://img.shields.io/github/v/release/juju35/ha-internet-box-card)](https://github.com/juju35/ha-internet-box-card/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-internet-box-card/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

<p align="center">
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/free.svg" alt="Free" height="40">&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/orange.svg" alt="Orange" height="40">&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/sfr.svg" alt="SFR" height="40">&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/bbox.svg" alt="Bouygues Telecom" height="40"><br><br>
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/fritz.svg" alt="FRITZ!" height="40">&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/vodafone.svg" alt="Vodafone" height="40">&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/telekom.svg" alt="Telekom" height="40">&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/swisscom.svg" alt="Swisscom" height="40">&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/salt.svg" alt="Salt" height="40"><br><br>
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/kpn.svg" alt="KPN" height="40">&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/delta.svg" alt="DELTA Fiber" height="40">&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/proximus.svg" alt="Proximus" height="40">&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/bt.svg" alt="BT" height="40">&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/eir.svg" alt="eir" height="40"><br><br>
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/masmovil.svg" alt="MásMóvil" height="40">&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/telia.svg" alt="Telia" height="40">&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/tdc.svg" alt="TDC" height="40">&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/bell.svg" alt="Bell" height="40">&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/optus.svg" alt="Optus" height="40"><br><br>
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/sagemcom.svg" alt="Sagemcom" height="40">&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/huawei.svg" alt="Huawei" height="40">&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/zte.svg" alt="ZTE" height="40">&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/starlink.svg" alt="Starlink" height="40">
</p>

Lovelace cards for Home Assistant to monitor an internet box at a glance: download / upload rates, connection, temperatures, fans, storage, Wi-Fi, missed calls and connected devices. They work with the **Freebox**, **Livebox** (Orange, KPN), **SFR Box**, **Bbox** (Bouygues Telecom), **FRITZ!Box**, **Vodafone Station**, **Swisscom Internet-Box**, **Sagemcom F@st** (Proximus, KPN, Telekom, BT, Bell…), **Huawei LTE**, **ZTE Hyperbox** and **Starlink** integrations ([by country](#supported-integrations)); each section shows only what the box's integration exposes.

Entities are **discovered automatically**, you don't have to pick them one by one.

[![Open your Home Assistant instance and open a repository inside the Marketplace.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-internet-box-card&category=plugin)

| Internet Box Card | Internet Box Mini Card |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card.png" alt="internet-box-card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/mini-card.png" alt="internet-box-mini-card" width="400"> |

## Features

- Two cards: a full **Internet Box Card** and a compact **Internet Box Mini Card**
- Detail button at the top right of the mini card: it shows the full card in its place (same box and options), and the collapse button, or a click anywhere outside the card, brings the compact view back (`zoom: false` removes it)
- Automatic discovery of the box entities, whatever the language of the entity ids (several boxes supported)
- Header icon of the kind of connection (fibre, xDSL, 4G / 5G, satellite, else a box) coloured with the state of the internet link like the status pill (green online, orange while the DSL line syncs, red offline or on a line fault, grey unavailable; the operator colour when the box reports no link state), with the operator logo as a badge; accent colour, website and admin links follow the detected operator, and the internet provider of the box model when it is not the integration's (a Bell Home Hub on the Sagemcom F@st integration, a KPN Box 12 on the Livebox one)
- Picture and commercial name of the box model, detected automatically or set with the `model` option, and firmware version
- Connection status and type (FTTH, xDSL, LTE, satellite…), public IPv4 (IPv6 on hover) and uptime, from the box tracker or the integration's own external IP and uptime sensors. The status is the real link state when the integration exposes it (Livebox WAN status, SFR Box WAN / DSL / FTTH status, with "Syncing" while the DSL line trains and "Line fault" on a line defect), else the box's own tracker
- The last speed test of the [Speedtest.net](https://www.home-assistant.io/integrations/speedtestdotnet/) integration (download, upload, ping) next to the uptime, found automatically
- Download / upload rates, in bytes (kB/s, MB/s) or bits (kb/s, Mb/s), with their last 24 hours drawn behind each tile, on the full card and the mini card (recorder statistics)
- Temperature gauges and fans speed
- Storage: free space of the disk partitions and RAID status
- Services: Wi-Fi state, missed calls and connected devices (the mini card footer always shows the missed calls, orange when there are some)
- A switch next to the Wi-Fi state (Services tile, header chip and mini card footer) turns the box's Wi-Fi on, or off after a confirmation popup; hidden while the Wi-Fi switch is unavailable
- A check button next to the missed calls marks them as read, shown only when there are missed calls and the integration has that button
- A restart button at the top right of the full card reboots the box, after a confirmation popup; shown only when the integration exposes it
- Colors turn orange / red when a threshold is crossed (temperatures, disk usage, missed calls); the temperature and disk usage thresholds can be set
- Click any value (except the connected devices count, a total over several trackers) to open its Home Assistant history (more-info dialog)
- Click the operator logo to open its website, and the box picture to open the box admin interface
- Visual editor in the dashboard UI for both cards (no YAML needed)
- Light and dark mode, 22 languages (English, French, German, Spanish, Serbian Cyrillic and Latin, Italian, Dutch, European Portuguese, Polish, Romanian, Danish, Swedish, Bulgarian, Russian, Ukrainian, Hungarian, Slovak, Czech, Slovenian, Latvian and Greek, see [Translations](#translations))
- Unavailable entities (for example while the box restarts) are shown as unavailable, not as Wi-Fi off or 0 missed calls; the restart button is disabled meanwhile
- Sections view: the full card needs at least 9 columns, the mini card 6; on a narrow card the box picture gets smaller then hidden, and the status pill shows only its coloured dot
- Single file, no external dependency: the box pictures and operator logos are embedded (a provider whose logo file is not in `images/` shows the connection icon without a badge)

## Supported integrations

Each section shows only what the integration exposes. Built-in integrations ship with Home Assistant; custom ones are installed from their repository.

### France

| Integration | Boxes | Discovered |
|---|---|---|
| [Freebox](https://www.home-assistant.io/integrations/freebox/) (built in) | Free: Freebox Ultra, Pop, Delta, Revolution, mini 4K | Rates, connection, IP, uptime, temperatures, fans, storage, RAID, Wi-Fi, missed calls (mark as read), connected devices, reboot |
| [Livebox](https://github.com/cyr-ius/hass-livebox-component) (custom) | Orange: Livebox 4 to 7, Livebox S, Livebox Fibre | Line rates (xDSL) or WAN GPON / SFP interface rates (fibre, including the Arcadyan Livebox Fibre), WAN status and link type, Wi-Fi, missed calls (clear), connected devices, reboot |
| [SFR Box](https://www.home-assistant.io/integrations/sfr_box/) (built in) | SFR: SFR Box 7, 8, NB6VAC | DSL line sync rates, shown as "Line rate" (the integration has no throughput sensor, so no download / upload traffic nor 24 h curve), WAN / DSL / FTTH status (plus the DSL training, line status and access network sensors when enabled, they are disabled by default), temperature, reboot |
| [Bbox](https://www.home-assistant.io/integrations/bbox/) (built in, YAML) or its fork [custom_bbox](https://github.com/earion68/hass_custom_bbox) (custom, YAML) | Bouygues Telecom: Bbox Fibre, Ultym, Miami | Download / upload bandwidth, uptime. The fork reaches the firmwares the built-in one can no longer connect to since Home Assistant 2022.7 (SSL `DH_KEY_TOO_SMALL`); both create the same sensors |
| [Bouygues Bbox](https://github.com/cyr-ius/hass-bbox2) (custom, config flow) | Bouygues Telecom: Bbox Wi-Fi 7, Fibre, Ultym, Miami | Download / upload rates, link status, public IPv4 / IPv6, uptime, Wi-Fi switch, connected devices, reboot. Its sensors have no translation key: they are recognised by their default entity id (`_download_speed`, `_upload_speed`, `_uptime`, `_ip_address`, `_ipv6_address`, `_link_status`, `button…_restart`), so keep those suffixes when renaming them |

### Germany

| Integration | Boxes | Discovered |
|---|---|---|
| [FRITZ!Box Tools](https://www.home-assistant.io/integrations/fritz/) (built in) | AVM / FRITZ!: every FRITZ!Box (DSL, cable, fibre, LTE), from 1&1, O2, Telekom and the shops; also sold in Austria, Switzerland and the Netherlands | Download / upload rates, WAN connection, external IPv4 / IPv6, uptime, CPU temperature, main Wi-Fi switch, connected devices, reboot (not the reconnect button); the DSL line sync rates when there is no traffic sensor |
| [Vodafone Station](https://www.home-assistant.io/integrations/vodafone_station/) (built in) | Vodafone: WiFi 6 Station (CGA6444VF) | Download / upload rates, active connection (DSL, fibre…), external IPv4 / IPv6, uptime, main Wi-Fi switch, connected devices, reboot (not the reconnect buttons) |
| [Sagemcom F@st](https://github.com/imicknl/ha-sagemcom-fast) (custom) | Telekom: Speedport Pro | Connected devices, reboot |

### Italy, United Kingdom, Ireland

| Integration | Boxes | Discovered |
|---|---|---|
| [Vodafone Station](https://www.home-assistant.io/integrations/vodafone_station/) (built in) | Vodafone Italy: Power Station (SHG3000), Power Station WiFi 6 (SHG3060), WiFi 6 Station (RHG3006), H300S; Vodafone UK: Ultra Hub, Vox 3.0 (THG3000); Vodafone Ireland: Gigabox | As in Germany above |
| [Sagemcom F@st](https://github.com/imicknl/ha-sagemcom-fast) (custom) | BT (UK): Smart Hub (F@st 5364); eir (Ireland): F3000 (F@st 5366SD) | Connected devices, reboot |

### Switzerland

| Integration | Boxes | Discovered |
|---|---|---|
| [Swisscom Internet-Box](https://www.home-assistant.io/integrations/swisscom/) (built in) | Swisscom: Internet-Box light, standard, plus | Connected devices only (the integration does presence detection and has no entity for the box itself): the box is the integration, its picture is the Internet-Box one |
| [Sagemcom F@st](https://github.com/imicknl/ha-sagemcom-fast) (custom) | Salt: FibreBox X6 (F@st 5688T) | Connected devices, reboot |

### Netherlands, Belgium

| Integration | Boxes | Discovered |
|---|---|---|
| [Livebox](https://github.com/cyr-ius/hass-livebox-component) (custom) | KPN: Box 12 (Livebox OS) | As for the Livebox, with the KPN colour and links |
| [Sagemcom F@st](https://github.com/imicknl/ha-sagemcom-fast) (custom) | KPN: Experia Box 12 (F@st 5359), F@st 4360Air; DELTA Fiber / Zeelandnet: F@st 3890V3; Proximus (Belgium): b-box 3 (F@st 3865b) | Connected devices, reboot |

### Spain, Nordics

| Integration | Boxes | Discovered |
|---|---|---|
| [Sagemcom F@st](https://github.com/imicknl/ha-sagemcom-fast) (custom) | MásMóvil (Spain): F@st 5655V2; Telia (Sweden): F@st 5370e; TDC (Denmark): F@st 5380 | Connected devices, reboot |

### Canada, Australia

| Integration | Boxes | Discovered |
|---|---|---|
| [Sagemcom F@st](https://github.com/imicknl/ha-sagemcom-fast) (custom) | Bell (Canada): Home Hub 3000 (F@st 5566), Home Hub 4000 (F@st 5689); Optus (Australia): F@st 3864 | Connected devices, reboot |

### Any country: 4G / 5G and satellite

| Integration | Boxes | Discovered |
|---|---|---|
| [Huawei LTE](https://www.home-assistant.io/integrations/huawei_lte/) (built in) | Huawei 4G / 5G routers (B535, B818, H122…), whatever the mobile operator | Download / upload rates, mobile connection, WAN IPv4 / IPv6, uptime, Wi-Fi state (read only), connected devices, reboot |
| [ZTE Hyperbox](https://github.com/timniklas/hass-zte_hyperbox) (custom) | ZTE MC8810 Hyperbox 5G Lite | Download / upload rates, connection and reboot, recognised by their kind (data rate, connectivity, restart) as the card does not know the integration's own keys |
| [Starlink](https://www.home-assistant.io/integrations/starlink/) (built in) | Starlink dish | Download / upload throughput, connectivity, uptime (last restart), reboot |

## Prerequisites

Home Assistant 2024.8 or later, and one of the integrations above configured.

The connected devices count uses the `device_tracker` entities of the integration, which are often disabled by default: enable the ones you want to follow.

On a Freebox, the restart button needs the **Freebox settings modification** permission: if pressing it fails with an `insufficient_rights` error, open Freebox OS ([mafreebox.freebox.fr](https://mafreebox.freebox.fr)) → **Freebox settings** → **Access management** → **Applications**, and allow **Modification des réglages de la Freebox** for the **Home Assistant** application.

## Installation

### Via the Marketplace (recommended)

Click the button below to add the repository directly:

[![Add to the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-internet-box-card&category=plugin)

Then click **Install**, and reload your browser when the Marketplace asks you to.

Or manually:

1. Open **Settings → Marketplace → Add from link** (top right; this needs a GitHub account connected)
2. Add `https://github.com/juju35/ha-internet-box-card` — Type: **Dashboard**
3. Open **Internet Box Card** and click **Install**
4. Clear your browser cache and refresh

### Manual

1. Download `internet-box-card.js` and the `internet-box-card.i18n.*.js` translation files from the [latest release](https://github.com/juju35/ha-internet-box-card/releases/latest)
2. Copy them all to `/config/www/` (without the translation files, the cards show in English)
3. Go to **Settings → Dashboards → ⋮ → Resources** → Add resource:
   - URL: `/local/internet-box-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

### Upgrading from Freebox Card

The cards were called **Freebox Card** / **Freebox Mini Card** before version 2.0.0. The former types `custom:freebox-card` and `custom:freebox-mini-card` stay registered, so existing dashboards keep working. After updating, check that the dashboard resource points to `internet-box-card.js`: since 3.0.0 the releases no longer attach the former `freebox-card.js` copy.

## Configuration

### Visual editor

Edit a dashboard, click **Add card** and search for **Internet Box Card** or **Internet Box Mini Card**. The box is preselected; pick another one in the list if you have several, set an optional title, choose the sections to display, the rate unit and the language. The preview updates live, and options left at their default are kept out of the generated YAML.

### Minimal

```yaml
type: custom:internet-box-card
```

```yaml
type: custom:internet-box-mini-card
```

### Full options

```yaml
type: custom:internet-box-card
box: 0123456789abcdef0123456789abcdef
title: My box
model: delta
admin_url: https://mafreebox.freebox.fr
show_image: true
show_logo: true
show_network: true
show_system: true
show_storage: true
show_services: true
temp_warning: 70
temp_critical: 85
disk_warning: 80
disk_critical: 95
rate_unit: bits
language: fr
```

```yaml
type: custom:internet-box-mini-card
box: 0123456789abcdef0123456789abcdef
title: My box
model: livebox_7
admin_url: http://livebox.home
show_image: true
show_logo: true
show_network: true
show_system: true
zoom: true
rate_unit: bits
language: fr
```

### Options reference

| Option | Card | Default | Description |
|---|---|---|---|
| `box` | both | First box found | Box to display: its device id, for the Bbox its entity-id prefix, for the Swisscom Internet-Box `platform:swisscom` (only needed with several boxes, pick it in the visual editor) |
| `title` | both | Box model | Card title |
| `model` | both | Detected | Box model, for its picture and the default title (see [Supported models](#supported-models)). Needed for the Bbox, whose integration exposes no model |
| `admin_url` | both | Operator default | Admin interface opened when clicking the box picture (Freebox: `https://mafreebox.freebox.fr`, Livebox: `http://livebox.home`, SFR: `http://192.168.1.1`, Bbox: `https://mabbox.bytel.fr`, FRITZ!Box: `http://fritz.box`, Swisscom: `http://internetbox.home`, Huawei LTE: `http://192.168.8.1`, Starlink: `http://192.168.100.1`…; else the box's own configuration URL when the integration gives one, as Sagemcom F@st does) |
| `show_image` | both | `true` | Show the box picture |
| `show_logo` | both | `true` | Show the header icon of the connection, coloured with the link state, with the operator logo (opens the operator website when clicked) |
| `show_network` | both | `true` | Download / upload rates (and IPv4, uptime on the full card) |
| `show_history` | both | `true` | 24 h curve behind the download / upload tiles, from the recorder's 5-minute statistics (rate sensors with a `state_class`), on a time axis: the curve breaks where the recorder has no data |
| `show_system` | both | `true` | Temperatures and fans (hottest temperature on the mini card) |
| `show_storage` | full | `true` | Disk partitions and RAID status |
| `show_speedtest` | full | `true` | The last Speedtest.net test in the network section (download, upload and ping, in the rate unit chosen; its time on hover), when that integration is set up |
| `show_services` | full | `true` | Wi-Fi, missed calls and connected devices |
| `temp_warning` | both | `75` | Temperature (in °C, whatever the sensor's unit) from which a temperature turns orange |
| `temp_critical` | both | `90` | Temperature (in °C) from which a temperature turns red |
| `disk_warning` | both | `80` | Disk usage (in % used) from which a partition turns orange (full card); `storage_warning` before 2.8.0, still read |
| `disk_critical` | both | `90` | Disk usage (in % used) from which a partition turns red (full card); `storage_critical` before 2.8.0, still read |
| `zoom` | mini | `true` | Detail button at the top right: shows the full card (every section) in place of the mini card, and back |
| `rate_unit` | both | `bytes` | Rates unit: `bytes` (kB/s, MB/s) or `bits` (kb/s, Mb/s) |
| `language` | both | Auto | Force language: `en`, `fr`, `de`, `es`, `sr`, `sr-Latn`, `it`, `nl`, `pt`, `pl`, `ro`, `da`, `sv`, `bg`, `ru`, `uk`, `hu`, `sk`, `cs`, `sl`, `lv` or `el` (auto-detects from HA settings) |

## Supported models

The model is detected from the box device (model id or name); set `model` to force another picture, for example when the detection fails. The French operators' boxes have their own stylised drawings; the boxes of the other integrations are drawn with a generic form factor (router, hub, tower, 4G / 5G box, dish), never a copy of the product, and keep their own model name from the device (a "FRITZ!Box 7590", a "Huawei B535-232").

### France

#### Freebox (Free)

Without a detected model or `model` option, no box picture is shown.

| Freebox Ultra | Freebox Pop | Freebox Delta | Freebox Revolution | Freebox mini 4K |
|:---:|:---:|:---:|:---:|:---:|
| <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/freebox-ultra.svg" alt="Freebox Ultra" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/freebox-pop.svg" alt="Freebox Pop" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/freebox-delta.svg" alt="Freebox Delta" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/freebox-revolution.svg" alt="Freebox Revolution" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/freebox-mini-4k.svg" alt="Freebox mini 4K" width="120"> |
| `ultra` (v9) | `pop` (v8) | `delta` (v7) | `revolution` (v6) | `mini_4k` |

#### Livebox (Orange)

| Livebox 7 | Livebox 6 | Livebox 5 | Livebox 4 | Livebox S |
|:---:|:---:|:---:|:---:|:---:|
| <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/livebox-7.svg" alt="Livebox 7" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/livebox-6.svg" alt="Livebox 6" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/livebox-5.svg" alt="Livebox 5" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/livebox-4.svg" alt="Livebox 4" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/livebox-s.svg" alt="Livebox S" width="120"> |
| `livebox_7` | `livebox_6` | `livebox_5` | `livebox_4` | `livebox_s` |

#### SFR Box

| SFR Box 8 | SFR Box 7 | SFR Box (NB6VAC) |
|:---:|:---:|:---:|
| <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/sfr-box-8.svg" alt="SFR Box 8" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/sfr-box-7.svg" alt="SFR Box 7" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/sfr-nb6vac.svg" alt="SFR Box NB6VAC" width="120"> |
| `sfr_box_8` | `sfr_box_7` | `sfr_nb6vac` |

#### Bbox (Bouygues Telecom)

The legacy Bbox integration (and its `custom_bbox` fork) exposes no device model: set the picture with the `model` option. With the Bouygues Bbox integration (hass-bbox2), the Bbox Wi-Fi 7 (Sagemcom F@st 5696b) is detected from its device model.

| Bbox Wi-Fi 7 | Bbox Fibre | Bbox Ultym | Bbox Miami |
|:---:|:---:|:---:|:---:|
| <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-router.svg" alt="Bbox Wi-Fi 7" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/bbox-fibre.svg" alt="Bbox Fibre" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/bbox-ultym.svg" alt="Bbox Ultym" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/bbox-miami.svg" alt="Bbox Miami" width="120"> |
| `bbox_wifi7` | `bbox_fibre` | `bbox_ultym` | `bbox_miami` |

### Germany

#### FRITZ!Box

The model name comes from the device; the picture is a generic router, or a tower for the cable models (FRITZ!Box 6xxx).

| FRITZ!Box | FRITZ!Box Cable |
|:---:|:---:|
| <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-router.svg" alt="FRITZ!Box" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-tower.svg" alt="FRITZ!Box Cable" width="120"> |
| `fritz_box` | `fritz_box_cable` |

#### Vodafone Station (Germany, Italy, United Kingdom, Ireland)

| Power Station | WiFi 6 Station | Ultra Hub | Gigabox | Vox 3.0 | H300S |
|:---:|:---:|:---:|:---:|:---:|:---:|
| <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-tower.svg" alt="Power Station" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-hub.svg" alt="WiFi 6 Station" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-tower.svg" alt="Ultra Hub" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-tower.svg" alt="Gigabox" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-hub.svg" alt="Vox 3.0" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-hub.svg" alt="H300S" width="120"> |
| `vodafone_power_station` | `vodafone_wifi6_station` | `vodafone_ultra_hub` | `vodafone_gigabox` | `vodafone_vox` | `vodafone_h300s` |

#### Sagemcom F@st (by provider and country)

The model number of the F@st gateway gives the provider, whose name, colour and links the card takes. An unknown F@st keeps the Sagemcom name with its own model number.

| Provider | Country | Box | `model` | Picture |
|---|---|---|---|:---:|
| Telekom | Germany | Speedport Pro | `telekom_speedport_pro` | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-tower.svg" alt="tower" width="60"> |
| BT | United Kingdom | Smart Hub (F@st 5364) | `bt_smart_hub` | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-tower.svg" alt="tower" width="60"> |
| eir | Ireland | F3000 (F@st 5366SD) | `eir_f3000` | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-router.svg" alt="router" width="60"> |
| Salt | Switzerland | FibreBox X6 (F@st 5688T) | `salt_fibrebox_x6` | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-tower.svg" alt="tower" width="60"> |
| KPN | Netherlands | Experia Box 12 (F@st 5359) | `kpn_experia_box_12` | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-tower.svg" alt="tower" width="60"> |
| KPN | Netherlands | F@st 4360Air | `kpn_fast_4360` | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-router.svg" alt="router" width="60"> |
| DELTA Fiber / Zeelandnet | Netherlands | F@st 3890V3 | `delta_fast_3890` | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-tower.svg" alt="tower" width="60"> |
| Proximus | Belgium | b-box 3 (F@st 3865b) | `proximus_bbox3` | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-tower.svg" alt="tower" width="60"> |
| MásMóvil | Spain | F@st 5655V2 | `masmovil_fast_5655` | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-router.svg" alt="router" width="60"> |
| Telia | Sweden | F@st 5370e | `telia_fast_5370` | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-router.svg" alt="router" width="60"> |
| TDC | Denmark | F@st 5380 | `tdc_fast_5380` | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-router.svg" alt="router" width="60"> |
| Bell | Canada | Home Hub 4000 (F@st 5689) | `bell_home_hub_4000` | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-tower.svg" alt="tower" width="60"> |
| Bell | Canada | Home Hub 3000 (F@st 5566) | `bell_home_hub_3000` | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-tower.svg" alt="tower" width="60"> |
| Optus | Australia | F@st 3864 | `optus_fast_3864` | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-router.svg" alt="router" width="60"> |
| Other F@st | — | Its own model number | `sagemcom_fast` | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-router.svg" alt="router" width="60"> |

### Switzerland

#### Swisscom Internet-Box

The integration has no entity for the box, so its model is not known: the Internet-Box picture is always shown.

| Internet-Box |
|:---:|
| <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-hub.svg" alt="Internet-Box" width="120"> |
| `internet_box` |

### Netherlands

#### KPN Box 12 (Livebox integration)

| KPN Box 12 |
|:---:|
| <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-hub.svg" alt="KPN Box 12" width="120"> |
| `kpn_box_12` |

The KPN Experia boxes are Sagemcom F@st gateways, see above.

### Any country: 4G / 5G and satellite

| Huawei LTE | ZTE Hyperbox 5G Lite | Starlink |
|:---:|:---:|:---:|
| <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-mobile.svg" alt="Huawei LTE" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-mobile.svg" alt="ZTE Hyperbox 5G Lite" width="120"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/images/generic-dish.svg" alt="Starlink" width="120"> |
| `huawei_lte_router` | `zte_mc8810` | `starlink` |

## Screenshots

While the box is running, the card animates: the cooling fan spins at its live speed. It settles to a still card when it stops (and honours `prefers-reduced-motion`).

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/fan.gif" alt="fan" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/fan-dark.gif" alt="fan, dark theme" width="400"> |

### Operators

The full card with what each integration exposes, by country: the Freebox shows every section (rates, connection, temperatures, fan, storage, Wi-Fi, calls, devices, restart); the Livebox its line rates, Wi-Fi, missed calls (with the clear button), connected devices and restart button; the SFR Box its DSL line sync rates ("Line rate"), temperature and restart button; the Bbox its bandwidth (picture set with `model: bbox_fibre`); the others what is listed in [Supported integrations](#supported-integrations).

| Country | Operator | Light | Dark |
|---|---|---|---|
| France | Freebox (Free) | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card.png" alt="Freebox (Free) card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-dark.png" alt="Freebox (Free) card dark" width="400"> |
| France | Livebox (Orange) | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-livebox.png" alt="Livebox (Orange) card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-livebox-dark.png" alt="Livebox (Orange) card dark" width="400"> |
| France | SFR Box | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-sfr.png" alt="SFR Box card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-sfr-dark.png" alt="SFR Box card dark" width="400"> |
| France | Bbox (Bouygues Telecom) | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-bbox.png" alt="Bbox (Bouygues Telecom) card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-bbox-dark.png" alt="Bbox (Bouygues Telecom) card dark" width="400"> |
| Germany | FRITZ!Box | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-fritz.png" alt="FRITZ!Box card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-fritz-dark.png" alt="FRITZ!Box card dark" width="400"> |
| Germany, Italy, UK, Ireland | Vodafone Station | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-vodafone.png" alt="Vodafone Station card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-vodafone-dark.png" alt="Vodafone Station card dark" width="400"> |
| Switzerland | Swisscom Internet-Box | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-swisscom.png" alt="Swisscom Internet-Box card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-swisscom-dark.png" alt="Swisscom Internet-Box card dark" width="400"> |
| Netherlands | KPN Box 12 | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-kpn.png" alt="KPN Box 12 card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-kpn-dark.png" alt="KPN Box 12 card dark" width="400"> |
| Canada (and every Sagemcom F@st provider) | Bell Home Hub 4000 (Sagemcom F@st) | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-sagemcom.png" alt="Bell Home Hub 4000 (Sagemcom F@st) card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-sagemcom-dark.png" alt="Bell Home Hub 4000 (Sagemcom F@st) card dark" width="400"> |
| Any | Huawei LTE | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-huawei.png" alt="Huawei LTE card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-huawei-dark.png" alt="Huawei LTE card dark" width="400"> |
| Any | ZTE Hyperbox | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-zte.png" alt="ZTE Hyperbox card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-zte-dark.png" alt="ZTE Hyperbox card dark" width="400"> |
| Any | Starlink | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-starlink.png" alt="Starlink card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/card-starlink-dark.png" alt="Starlink card dark" width="400"> |

### Mini card

| Light | Dark |
|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/mini-card.png" alt="mini card" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/mini-card-dark.png" alt="mini card dark" width="400"> |
| <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/mini-card-zoom.png" alt="mini card, detail view" width="400"> | <img src="https://raw.githubusercontent.com/juju35/ha-internet-box-card/main/screenshots/mini-card-zoom-dark.png" alt="mini card dark, detail view" width="400"> |

The second row is the mini card after a click on its detail button (top right): the full card, with the collapse button in the same place.

## How it works

The cards read the entity and device registries of Home Assistant and keep the entities of the supported box integrations (`freebox`, `livebox`, `sfr_box`, `bbox` (legacy or hass-bbox2) / `custom_bbox`, `fritz`, `vodafone_station`, `swisscom`, `sagemcom_fast`, `huawei_lte`, `zte_hyperbox`, `starlink`). Each box's sensors are recognized by their integration's own translation keys (for the Freebox: `rate_down`, `rate_up`, `missed`, `wifi`, `partition_free_space`, `raid_degraded`), so entity ids translated in another language (for example `sensor.freebox_vitesse_de_telechargement`) and renamed entities are supported. The legacy Bbox integration is a YAML platform without devices nor unique ids, so its sensors are not in the entity registry: they are found in the states by their entity-id suffix (`_currently_used_download_bandwidth`…). The Bouygues Bbox integration (hass-bbox2) shares the `bbox` domain and registers a device, but its sensors have no translation key: the box's own entities are matched by their entity-id suffix (`_download_speed`…). The box picture and the header logo, colour and links follow the detected operator, or the provider of the detected model (Sagemcom F@st and KPN boxes). A box with no rate sensor is found by its restart button (Sagemcom F@st); the Swisscom integration has only the trackers of the connected devices, so the integration itself is the box. On the ZTE Hyperbox, whose keys the card does not know, the rates are the data-rate sensors whose name says download / upload, and the connection and restart entities are found by their device class. A restart button with a translation key of its own is a reconnect button (FRITZ!Box, Vodafone), never taken for the reboot.

The box itself is the device of the download rate sensor (on a Livebox fibre line, which has no `down_rate` / `up_rate` sensor, the rates of the `WAN_GPON` or `WAN_SFP` interface statistics sensors, never those of the Wi-Fi, Ethernet or DS-Lite interfaces). The Livebox missed calls are counted from the `callmissed` binary sensor's `missed_calls` list (its `callers` sensor counts every call, missed or not, and is only a fallback filtered on the missed ones). Temperature and fan sensors are recognized by their `temperature` device class and `rpm` unit, disk partitions by their parent device, and connected devices by the config entry they share with the box (with a single box, the connected devices trackers that have no device are counted too). The **mark calls as read** and **reboot** buttons are found by their translation key (the reboot button also by its `restart` device class). On a Freebox, the connection type, IP addresses and uptime come from the attributes of its `device_tracker`. The connection status comes from the integration's connectivity binary sensors when it has some (Livebox `connectivity` with its `link_type` attribute; SFR Box `wan_status`, else `dsl_status` / `ftth_status`, with the `dsl_training`, `dsl_line_status` and `net_infra` sensors), else from the box's `device_tracker` (Freebox). The Freebox integration gives the boot date without a time zone, in the system time zone of the Home Assistant process, and the card reads it in the time zone of Home Assistant (**Settings → System → General**). Both match on Home Assistant OS and Supervised; in a Docker container, start Home Assistant with `TZ` set to the same time zone (for example `-e TZ=Europe/Paris`), otherwise the uptime is off by the UTC offset. When the registry is not available, English Freebox entity ids (`sensor.freebox_download_speed`…) are used as a fallback.

Thresholds:

| Value | Orange | Red |
|---|---|---|
| Temperatures | 75 °C | 90 °C |
| Disk usage | 80 % | 90 % |
| Missed calls | 1 | — |

Temperatures are shown in the unit of their sensor (°F with the imperial unit system) and compared to these thresholds after conversion to °C.

## Development

```bash
npm install
npm run build        # bundles src/internet-box-card.js + the embedded logos (images/*.svg) into dist/internet-box-card.js
npm run check        # builds and checks the card (run in CI)
npm run screenshots  # renders the cards with mock data (scripts/mock-states.mjs, scripts/mock-operators.mjs) into screenshots/ (and fan.gif / fan-dark.gif, needs ffmpeg)
```

`dist/` is not committed: `npm run build` creates it locally, CI builds it on every push, and the release workflow attaches the built file to the release, which is where the Marketplace installs it from.

### Releasing

1. Bump `version` in `package.json`
2. Add a `## <version>` section at the top of [CHANGELOG.md](https://github.com/juju35/ha-internet-box-card/blob/main/CHANGELOG.md)
3. Push to `main`: the **Release** workflow builds the card, creates the tag and the GitHub release with the changelog section as notes, and attaches `internet-box-card.js` with its translation files

## Translations

The cards auto-detect the language from your Home Assistant settings. Currently supported:

| Language | Code |
|---|---|
| English | `en` |
| Français | `fr` |
| Deutsch | `de` |
| Español | `es` |
| Српски (Serbian, Cyrillic) | `sr` |
| Srpski (Serbian, Latin) | `sr-Latn` |
| Italiano | `it` |
| Nederlands | `nl` |
| Português (European) | `pt` |
| Polski | `pl` |
| Română | `ro` |
| Dansk | `da` |
| Svenska | `sv` |
| Български | `bg` |
| Русский | `ru` |
| Українська | `uk` |
| Magyar | `hu` |
| Slovenčina | `sk` |
| Čeština | `cs` |
| Slovenščina | `sl` |
| Latviešu | `lv` |
| Ελληνικά | `el` |

Contributions for additional languages are welcome!

## License

[MIT](https://github.com/juju35/ha-internet-box-card/blob/main/LICENSE)

Freebox and Free are trademarks of Free SAS, Livebox and Orange of Orange SA, SFR of SFR SA, Bbox and Bouygues Telecom of Bouygues Telecom SA. This project is not affiliated with any of them.

## Support

If you find this project useful, you can support its development:

<a href="https://buymeacoffee.com/julienstep9"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="50"></a>
