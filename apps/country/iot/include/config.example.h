#pragma once
// Copy this file to `config.h` and fill in your own values.
// `config.h` is gitignored — never commit your Wi-Fi credentials.

// --- Wi-Fi ---
#define WIFI_SSID     "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// --- MQTT broker ---
// IP address of the machine running Mosquitto (see infra/docker/mosquitto).
// On the same PC, use that PC's LAN IP (not 127.0.0.1 — the ESP is a separate host).
#define MQTT_HOST     "192.168.1.10"
#define MQTT_PORT     1883

// --- Identity of this node ---
#define COUNTRY       "brazil"   // brazil | ecuador | colombia
#define WAREHOUSE_ID  "wh-01"
