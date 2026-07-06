# Country IoT

## Overview

Firmware for the IoT module of a country site. A NodeMCU **ESP8266** reads
temperature and humidity from a single **DHT11** sensor and publishes them over
**MQTT** every 30 seconds. Two LEDs report the node's health (green = OK,
red = fault). The module is **publish-only**; alert logic lives in the country API.

## Stack

- **NodeMCU ESP8266** (board `nodemcuv2`), Arduino framework
- **PlatformIO** (build + upload + serial monitor)
- Libraries: `256dpi/MQTT` (MQTT, QoS 1),
  `beegee-tokyo/DHT sensor library for ESPx` (DHT11, header `DHTesp.h`),
  `bblanchon/ArduinoJson` (payload)

## Hardware & wiring

| Sensor / LED | NodeMCU pin | Via |
|---|---|---|
| DHT11 `S` (data) | `D2` (GPIO4) | — |
| DHT11 `+` / `-` | `3V3` / `GND` | — |
| Green LED (OK) | `D1` (GPIO5) | 220 Ω → LED → GND |
| Red LED (KO) | `D5` (GPIO14) | 220 Ω → LED → GND |

See the wiring diagram in `docs/schemas/` (`iot-wiring`).

## Setup

1. Install **VS Code** + the **PlatformIO IDE** extension.
2. **Windows only:** install the **CH340** (or CP2102) USB-serial driver, otherwise
   the board won't appear on any COM port.
3. Copy the config template and fill in your values:
   ```bash
   cp include/config.example.h include/config.h
   ```
   Set `WIFI_SSID`, `WIFI_PASSWORD`, `MQTT_HOST` (the LAN IP of the PC running
   Mosquitto — not `127.0.0.1`), `COUNTRY`, `WAREHOUSE_ID`.
   `config.h` is gitignored.

## Run

Start the broker first (see `infra/docker/mosquitto`), then from this folder:

```bash
pio run                 # compile (downloads toolchain + libs on first run)
pio run --target upload # flash the board over USB
pio device monitor      # serial logs at 115200 baud
```

## Endpoints / Topics

Publishes to `futurekawa/<country>/<warehouse_id>/measurements` (QoS 1, retain
false, every 30 s). Payload contract:
[`packages/contracts/mqtt/measurements.md`](../../../packages/contracts/mqtt/measurements.md).

## Tests

No automated tests yet. Manual verification:

1. Run the broker and subscribe: `mosquitto_sub -t "futurekawa/#" -v`.
2. Flash the board and open the serial monitor.
3. Confirm a JSON message arrives every 30 s and the **green** LED is on.
4. Unplug the DHT data wire → the **red** LED should turn on and the serial log
   shows a DHT read error.

## Local decisions

- **ESP8266 + DHT11** (not the brief's ESP32 + DHT22): this is the hardware on hand.
  DHT11 covers the project's temperature/humidity ranges at lower precision
  (±2 °C / ±5 %), acceptable for the prototype.
- **`256dpi/MQTT` over `PubSubClient`**: the spec requires QoS 1, which
  PubSubClient does not support for publishing.
- **Publish-only firmware**: keeps a single source of truth for alerts (the
  backend). LEDs reflect local health only.
- **NTP timestamp**: the device stamps measurements with UTC epoch; the backend
  may re-stamp on receipt if the device clock is not yet synced.
