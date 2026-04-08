#include <WiFi.h>

// ── WiFi ──────────────────────────────────────
const char* ssid     = "wifi_name";
const char* password = "wifi_password";

// ── EMG config ────────────────────────────────────────────
const int emgPin = 34;
const int TCP_PORT = 5000;
const int LED_PIN = 2;              // ← built-in blue LED on ESP32

WiFiServer server(TCP_PORT);
WiFiClient client;

unsigned long startTime;
int buf[8] = {0};
int idx     = 0;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  pinMode(LED_PIN, OUTPUT);         // ← set LED as output
  digitalWrite(LED_PIN, LOW);       // ← off while connecting

  // ── connect to WiFi ───────────────────────────────────
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
  }
  Serial.println("\nWiFi connected!");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());

  digitalWrite(LED_PIN, HIGH);      // ← blue LED ON = WiFi connected 

  server.begin();
  Serial.printf("TCP server started on port %d\n", TCP_PORT);
}

void loop() {
  // ── accept new client if none connected ───────────────
  if (!client || !client.connected()) {
    client = server.accept();
    if (client) {
      Serial.println("Python connected!");
      startTime = millis();
      memset(buf, 0, sizeof(buf));
      idx = 0;
    }
  }

  // ── stream data if client is connected ────────────────
  if (client && client.connected()) {
    unsigned long t = millis() - startTime;
    int raw = analogRead(emgPin);

    buf[idx] = raw;
    idx = (idx + 1) % 8;
    int filtered = (buf[0]+buf[1]+buf[2]+buf[3]+
                    buf[4]+buf[5]+buf[6]+buf[7]) / 8;

    client.printf("%lu,%d,%d\n", t, raw, filtered);
    delay(2);                        // ~500 Hz
  }
}
