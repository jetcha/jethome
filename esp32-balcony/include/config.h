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
#define OTA_HOSTNAME "jethome-balcony"
#define OTA_PASSWORD "900731"

// =============================================================================
// MQTT Configuration
// =============================================================================
#define MQTT_SERVER "jetweb.duckdns.org"
#define MQTT_PORT 1883
#define MQTT_CLIENT_ID "jethome-balcony"

// MQTT Topics - Publish
#define MQTT_TOPIC_CLIMATE "jethome/balcony/climate"

// =============================================================================
// Pin Definitions
// =============================================================================

// DHT22 Temperature/Humidity Sensor
#define DHTPIN 4
#define DHTTYPE DHT22

// =============================================================================
// Timing Definitions
// =============================================================================
#define WIFI_RECONNECTION_DELAY_MS 10000
#define MQTT_RECONNECTION_DELAY_MS 5000
#define CLIMATE_DATA_READ_INTERVAL_MS 2000
#define LOOPING_DELAY_MS 100

#endif // CONFIG_H
