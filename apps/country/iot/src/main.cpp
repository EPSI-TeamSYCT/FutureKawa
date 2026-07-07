// FutureKawa IoT module — NodeMCU ESP8266 + DHT11.
//
// Reads temperature + humidity from a single DHT11 sensor and publishes them
// over MQTT every 30 seconds. Two status LEDs report the node's health:
//   - green (D1) ON  -> everything OK (Wi-Fi + MQTT + read + publish)
//   - red   (D5) ON  -> a fault occurred (no Wi-Fi / no broker / read failed)
// Exactly one LED is on at a time.
//
// The device is publish-only: alert logic lives in the country backend.
// Payload contract: packages/contracts/mqtt/measurements.md

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <MQTT.h>
#include <ArduinoJson.h>
#include <DHTesp.h>
#include <time.h>
#include "config.h"

// --- Pins (NodeMCU silkscreen labels) ---
#define PIN_DHT     D2   // DHT11 data line
#define PIN_LED_OK  D1   // green LED -> system OK
#define PIN_LED_KO  D5   // red LED   -> system KO / fault

// Publish one reading every 30 seconds (project spec).
static const unsigned long PUBLISH_EVERY_MS = 30000UL;

DHTesp dht;
WiFiClient net;
MQTTClient mqtt(256);  // internal buffer large enough for our payload

char measurementsTopic[96];
unsigned long lastPublish = 0;

// Drive the two status LEDs. Exactly one is lit at any time.
void setStatus(bool ok) {
  digitalWrite(PIN_LED_OK, ok ? HIGH : LOW);
  digitalWrite(PIN_LED_KO, ok ? LOW : HIGH);
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  setStatus(false);
  Serial.printf("WiFi: connecting to \"%s\"", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000UL) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf(" connected, IP=%s\n", WiFi.localIP().toString().c_str());
    // Sync the clock over NTP so measurements carry a real UTC timestamp.
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  } else {
    Serial.println(" failed, will retry");
  }
}

void connectMQTT() {
  if (mqtt.connected()) return;
  setStatus(false);
  String clientId = String("iot-") + COUNTRY + "-" + WAREHOUSE_ID;
  Serial.printf("MQTT: connecting to %s:%d as %s ...", MQTT_HOST, MQTT_PORT, clientId.c_str());
  if (mqtt.connect(clientId.c_str())) {
    Serial.println(" connected");
  } else {
    Serial.println(" failed, will retry");
  }
}

void setup() {
  Serial.begin(115200);
  delay(50);
  Serial.println("\nFutureKawa IoT node starting...");

  pinMode(PIN_LED_OK, OUTPUT);
  pinMode(PIN_LED_KO, OUTPUT);
  setStatus(false);  // red until everything is up

  dht.setup(PIN_DHT, DHTesp::DHT11);

  snprintf(measurementsTopic, sizeof(measurementsTopic),
           "futurekawa/%s/%s/measurements", COUNTRY, WAREHOUSE_ID);
  Serial.printf("Topic: %s\n", measurementsTopic);

  connectWiFi();
  mqtt.begin(MQTT_HOST, MQTT_PORT, net);
  connectMQTT();
}

void loop() {
  // Keep connections alive; go red on any drop.
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();

  if (millis() - lastPublish < PUBLISH_EVERY_MS) return;
  lastPublish = millis();

  // One DHT11 delivers BOTH temperature and humidity in a single read.
  TempAndHumidity r = dht.getTempAndHumidity();
  if (dht.getStatus() != DHTesp::ERROR_NONE || isnan(r.temperature) || isnan(r.humidity)) {
    Serial.printf("DHT read error: %s\n", dht.getStatusString());
    setStatus(false);
    return;
  }

  // Build the JSON payload (see packages/contracts/mqtt/measurements.md).
  JsonDocument doc;
  doc["warehouse_id"] = WAREHOUSE_ID;
  doc["country"]      = COUNTRY;
  doc["temperature"]  = r.temperature;
  doc["humidity"]     = r.humidity;
  doc["timestamp"]    = (uint32_t) time(nullptr);  // UTC epoch (0 until NTP synced)

  char payload[256];
  serializeJson(doc, payload, sizeof(payload));

  // retain=false, QoS=1 (project spec).
  bool ok = mqtt.publish(measurementsTopic, payload, false, 1);
  Serial.printf("PUB %s -> %s [%s]\n", measurementsTopic, payload, ok ? "ok" : "FAILED");
  setStatus(ok);
}
