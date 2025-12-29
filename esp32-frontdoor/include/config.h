#ifndef CONFIG_H
#define CONFIG_H

// =============================================================================
// General
// =============================================================================
#define SERIAL_BAUDRATE 115200

// =============================================================================
// WiFi Credentials
// =============================================================================
#define WIFI_SSID "AirportFreeWifi"
#define WIFI_PASS "BodhiBenny0501"

// =============================================================================
// OTA Configuration
// =============================================================================
#define OTA_HOSTNAME "jethome-esp32"
#define OTA_PASSWORD "900731"

// =============================================================================
// MQTT Configuration
// =============================================================================
#define MQTT_SERVER "jetweb.duckdns.org"
#define MQTT_PORT 1883
#define MQTT_CLIENT_ID "jethome"

// MQTT Topics - Subscribe
#define MQTT_TOPIC_ALARM_SET "jethome/alarm/set"
#define MQTT_TOPIC_TESTMODE_SET "jethome/testmode/set"
#define MQTT_TOPIC_LIGHT_DARK "jethome/light/dark"

// MQTT Topics - Publish
#define MQTT_TOPIC_CLIMATE "jethome/frontdoor/climate"
#define MQTT_TOPIC_DOOR_STATE "jethome/door/state"
#define MQTT_TOPIC_WINDOW_STATE "jethome/window/state"

// =============================================================================
// Pin Definitions
// =============================================================================

// DHT22 Temperature/Humidity Sensor
#define DHTPIN 4
#define DHTTYPE DHT22

// KY016 RGB LED
#define LED_R_PIN 18
#define LED_G_PIN 19
#define LED_B_PIN 21

// Magnetic Reed Sensors
#define DOOR_SENSOR_PIN 25
#define WINDOW_SENSOR_PIN 26

// Relays (active LOW - LOW = ON, HIGH = OFF)
#define RELAY_SIREN_PIN 32
#define RELAY_LIGHT_STRIP_PIN 33

// HC-SR501 Motion Sensor
#define MOTION_SENSOR_PIN 27

// =============================================================================
// Timing Definitions
// =============================================================================
#define SIREN_DURATION_MS 60000
#define SIREN_DURATION_TEST_MS 300
#define WIFI_RECONNECTION_DELAY_MS 10000
#define MQTT_RECONNECTION_DELAY_MS 5000
#define CLIMATE_DATA_READ_INTERVAL_MS 2000
#define LED_BLINK_INTERVAL_MS 500
#define LIGHT_STRIP_DURATION_MS 15000
#define LOOPING_DELAY_MS 100

#endif  // CONFIG_H
