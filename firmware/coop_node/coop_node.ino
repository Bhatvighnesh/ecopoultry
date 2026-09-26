/*
 * EcoPoultry - Coop Environment & Actuator Node
 *
 * Reads DHT11 (temperature/humidity), MQ135 (gas), and a PIR motion sensor,
 * POSTs a reading to the backend every 5 seconds, and polls the backend's
 * relay state every 5 seconds to drive a fan relay - this is the physical
 * half of Objective 1's closed loop (the backend decides on/off based on
 * thresholds; this firmware just obeys it).
 *
 * Wiring (see the project's wiring guide artifact for the full diagram):
 *   DHT11   DATA -> GPIO4   (VCC -> 3V3, GND -> GND)
 *   MQ135   AOUT -> GPIO34  (VCC -> 5V/VIN, GND -> GND)
 *   HW-416B OUT  -> GPIO27  (VCC -> 3V3, GND -> GND)
 *   Relay   IN   -> GPIO26  (VCC -> 5V/VIN, GND -> GND)
 *
 * Libraries required (Arduino IDE Library Manager):
 *   - "DHT sensor library" by Adafruit
 *   - "Adafruit Unified Sensor" (dependency of the above)
 *   - "ArduinoJson" by Benoit Blanchon
 *
 * Board: any ESP32 DevKit (esp32 board package in Boards Manager).
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ---------------- Configuration - edit these ----------------
const char *WIFI_SSID = "YOUR_WIFI_SSID";
const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char *BACKEND_URL = "https://ecopoultry.onrender.com";

// Most cheap single-channel relay modules are ACTIVE-LOW (a LOW signal
// energizes the relay). Set this to false if yours is active-high - test
// with a multimeter or just observe which state clicks the relay on.
const bool RELAY_ACTIVE_LOW = true;

// ---------------- Pins ----------------
#define DHTPIN 4
#define DHTTYPE DHT11
#define MQ135_PIN 34
#define PIR_PIN 27
#define RELAY_PIN 26

DHT dht(DHTPIN, DHTTYPE);

// ---------------- Timing ----------------
const unsigned long ENV_POST_INTERVAL_MS = 5000;
const unsigned long ACTUATOR_POLL_INTERVAL_MS = 5000;
const unsigned long ACTIVITY_WINDOW_MS = 60000; // "activity" is a per-minute count

unsigned long lastEnvPostTime = 0;
unsigned long lastActuatorPollTime = 0;
unsigned long activityWindowStart = 0;

// Counts PIR LOW->HIGH transitions within the current 1-minute window, then
// resets - this is what the backend's "activity count/min" field expects.
volatile int pirEventCount = 0;
bool lastPirState = LOW;

void setRelay(bool on) {
  bool pinLevel = RELAY_ACTIVE_LOW ? !on : on;
  digitalWrite(RELAY_PIN, pinLevel ? HIGH : LOW);
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Connected, IP: ");
  Serial.println(WiFi.localIP());
}

void postEnvironmentReading() {
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  int gasRaw = analogRead(MQ135_PIN);

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("[env] DHT11 read failed, skipping this cycle");
    return;
  }

  StaticJsonDocument<200> doc;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["gas"] = gasRaw;
  doc["activity"] = pirEventCount;

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  http.begin(String(BACKEND_URL) + "/api/sensors/environment");
  http.addHeader("Content-Type", "application/json");
  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    Serial.printf("[env] POST -> %d : temp=%.1f hum=%.1f gas=%d activity=%d\n",
                  httpCode, temperature, humidity, gasRaw, pirEventCount);
  } else {
    Serial.printf("[env] POST failed: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

void pollActuatorState() {
  HTTPClient http;
  http.begin(String(BACKEND_URL) + "/api/actuators/device-state");
  int httpCode = http.GET();

  if (httpCode == 200) {
    String response = http.getString();
    StaticJsonDocument<200> doc;
    DeserializationError err = deserializeJson(doc, response);
    if (!err) {
      const char *fanState = doc["states"]["fan"];
      bool fanOn = fanState && strcmp(fanState, "on") == 0;
      setRelay(fanOn);
      Serial.printf("[relay] fan -> %s\n", fanOn ? "ON" : "off");
    } else {
      Serial.println("[relay] failed to parse response");
    }
  } else {
    Serial.printf("[relay] poll failed: %d\n", httpCode);
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  setRelay(false); // start with the fan off

  dht.begin();
  connectWiFi();

  activityWindowStart = millis();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  bool pirState = digitalRead(PIR_PIN);
  if (pirState == HIGH && lastPirState == LOW) {
    pirEventCount++;
  }
  lastPirState = pirState;

  unsigned long now = millis();

  if (now - activityWindowStart >= ACTIVITY_WINDOW_MS) {
    activityWindowStart = now;
    pirEventCount = 0;
  }

  if (now - lastEnvPostTime >= ENV_POST_INTERVAL_MS) {
    lastEnvPostTime = now;
    postEnvironmentReading();
  }

  if (now - lastActuatorPollTime >= ACTUATOR_POLL_INTERVAL_MS) {
    lastActuatorPollTime = now;
    pollActuatorState();
  }
}
