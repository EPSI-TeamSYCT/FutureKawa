# Country IoT 🌡️

![Platform](https://img.shields.io/badge/platform-ESP8266-blue)
![Framework](https://img.shields.io/badge/framework-Arduino-00979D)
![Build](https://img.shields.io/badge/PlatformIO-nodemcuv2-orange)
![Language](https://img.shields.io/badge/firmware-C%2B%2B-00599C)
![MQTT](https://img.shields.io/badge/MQTT-QoS%201-660066)
![Simulator](https://img.shields.io/badge/simulator-Python-3776AB)

> Firmware for a country's IoT node: a **NodeMCU ESP8266** reads temperature and
> humidity from a **DHT11** and publishes them over **MQTT** every 30 s. A Python
> **simulator** can stand in for the hardware.

## 📑 Table of contents

- 🧭 [Overview](#overview)
- 🧱 [Stack](#stack)
- 🔌 [Hardware & wiring](#hardware--wiring)
- ⚙️ [Setup](#setup)
- ▶️ [Run](#run)
- 📡 [Topics & payload](#topics--payload)
- 🛰️ [Simulator](#simulator)
- ✅ [Tests](#tests)
- 🧩 [Local decisions](#local-decisions)
- 🩺 [Troubleshooting](#troubleshooting)

## Overview

A NodeMCU ESP8266 reads temperature + humidity from a single DHT11 sensor and
publishes them over MQTT every 30 seconds. Two LEDs report the node's health
(🟢 green = OK, 🔴 red = fault). The module is **publish-only**; alert logic lives
in the country API.

## Stack

| Layer | Choice |
|---|---|
| 🧠 Board | NodeMCU **ESP8266** (`nodemcuv2`), Arduino framework |
| 🛠️ Toolchain | **PlatformIO** (build + upload + serial monitor) |
| 📚 Libs | `256dpi/MQTT` (QoS 1) · `DHT sensor library for ESPx` (DHT11) · `bblanchon/ArduinoJson` |
| 🛰️ Simulator | Python worker — `uv`, `paho-mqtt`, `pydantic-settings` (env-driven, one instance per country; see [`simulator/`](simulator/README.md)) |

## Hardware & wiring

| Sensor / LED | NodeMCU pin | Via |
|---|---|---|
| 🌡️ DHT11 `S` (data) | `D2` (GPIO4) | — |
| ⚡ DHT11 `+` / `−` | `3V3` / `GND` | — |
| 🟢 Green LED (OK) | `D1` (GPIO5) | 220 Ω → LED → GND |
| 🔴 Red LED (KO) | `D5` (GPIO14) | 220 Ω → LED → GND |

Wiring diagram: [`docs/schemas/`](../../../docs/schemas/) (`iot-wiring`).

## Setup

1. Install **VS Code** + the **PlatformIO IDE** extension.
2. 🪟 **Windows:** install the **CH340** USB-serial driver (see
   [Troubleshooting](#troubleshooting) — the driver version matters!).
3. Copy the config template and fill it in:
   ```bash
   cp include/config.example.h include/config.h
   ```
   Set `WIFI_SSID`, `WIFI_PASSWORD`, `MQTT_HOST` (the LAN IP of the PC running
   Mosquitto — **not** `127.0.0.1`), `COUNTRY`, `WAREHOUSE_ID`. `config.h` is gitignored.

## Run

Start the [broker](../../../infra/docker/mosquitto/README.md) first, then:

```bash
pio run                 # compile (downloads toolchain + libs on first run)
pio run --target upload # flash over USB  (close the serial monitor first!)
pio device monitor      # serial logs @ 115200 baud
```

> ⚠️ **Never keep the serial monitor open during an upload** — it locks the COM
> port. Order: close monitor → upload → open monitor.

## Topics & payload

Publishes to `futurekawa/<country>/<warehouse_id>/measurements` — **QoS 1**,
retain **false**, every **30 s**. Full contract:
[`packages/contracts/mqtt/measurements.md`](../../../packages/contracts/mqtt/measurements.md).

```json
{ "warehouse_id": "wh-01", "country": "brazil", "temperature": 27.4, "humidity": 58.0, "timestamp": 1751808000 }
```

## Simulator

No hardware? The **country-agnostic Python worker** publishes the same MQTT
measurements — **one instance per country**, configured entirely by environment
variables. Full docs: [`simulator/README.md`](simulator/README.md).

```bash
cd simulator
uv sync
uv run python src/main.py     # one country (from .env)

# ...or the full fleet — broker + the 3 countries — in one command:
docker compose up --build
```

- ➕ **Add a country = env config, no code change.**
- 📡 Publishes the exact same [MQTT contract](../../../packages/contracts/mqtt/measurements.md)
  as the firmware, with realistic drift + occasional anomalies to trigger alerts.
- 🧪 Tested with `uv run pytest` (13 tests).

## Tests

No automated tests yet. Manual check:

1. 🐳 Run the broker and subscribe: `mosquitto_sub -t "futurekawa/#" -v`.
2. ⚡ Flash the board (or run the simulator) and open the serial monitor.
3. ✅ A JSON message arrives every 30 s and the 🟢 green LED is on.
4. 🔌 Unplug the DHT data wire → the 🔴 red LED turns on (`DHT read error`).

## Local decisions

- **ESP8266 + DHT11** (not the brief's ESP32 + DHT22): the hardware on hand. DHT11
  covers the project ranges at lower precision (±2 °C / ±5 %) — fine for a prototype.
- **`256dpi/MQTT` over `PubSubClient`**: the spec needs QoS 1, which PubSubClient
  doesn't support for publishing.
- **Publish-only firmware**: single source of truth for alerts (the backend).
- **NTP timestamp**: the device stamps UTC epoch; the backend may re-stamp on receipt.
- **Python simulator**: decouples backend development from the hardware and drives
  the jury demo reliably.

## Troubleshooting

Hard-won notes from bringing up a clone NodeMCU on Windows 11 👇

| Symptom | Cause | Fix |
|---|---|---|
| Upload: `PermissionError … 31` (device not functioning) | Newest CH340 driver breaks clone chips | Install an **older CH340 driver** (~3.5, 2019) |
| Upload: `Access denied … 5` | Serial monitor holds the port | **Close the monitor**, then upload |
| Upload: `semaphore timeout … 121` | Flaky USB cable/port | Try another **data** cable + a direct USB port |
| `UnknownPackageError: DHTesp` | Wrong registry name | Use `beegee-tokyo/DHT sensor library for ESPx` |
| Serial monitor shows garbage | Baud mismatch | Set `monitor_speed = 115200` |
| Wi-Fi connects, MQTT fails | School Wi-Fi client isolation / firewall | Use a phone **hotspot**; allow port **1883** |
| `DHT read error: TIMEOUT` | Wiring, missing pull-up, or dead sensor | Check `S`→D2 & power; add 10 kΩ pull-up; try the other sensor |
| Nothing on the breadboard, onboard LED OK | Header pins **not soldered** | Solder the headers to the board |
