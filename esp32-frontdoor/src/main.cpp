#include <Arduino.h>

#include "alarm_system.h"
#include "climate_sensor.h"
#include "config.h"
#include "led_indicator.h"
#include "light_strip.h"
#include "magnet_sensor.h"
#include "motion_sensor.h"
#include "mqtt_manager.h"
#include "ota_manager.h"
#include "state.h"
#include "wifi_manager.h"

// Global application state
static State appState;

static const char* mqttSubscribeTopics[] = {MQTT_TOPIC_ALARM_SET, MQTT_TOPIC_LIGHT_DARK};

void onMqttMessage(const char* topic, const char* payload) {
    if (strcmp(topic, MQTT_TOPIC_ALARM_SET) == 0) {
        appState.isAlarmEnabled = (strcmp(payload, "1") == 0);
    }
    if (strcmp(topic, MQTT_TOPIC_LIGHT_DARK) == 0) {
        appState.isDark = (strcmp(payload, "1") == 0);
    }
}

void setup() {
    Serial.begin(SERIAL_BAUDRATE);

    // Initialize all modules
    initLedIndicator();
    initMagnetSensor();
    initMotionSensor();
    initAlarmSystem();
    initLightStrip();

    // Belows are the shared modules (climate and network setup)
    initClimateSensor(I2C_SDA_PIN, I2C_SCL_PIN, CLIMATE_DATA_READ_INTERVAL_MS,
                      MQTT_TOPIC_CLIMATE, publishMessageMQTT);
    initWifi(WIFI_SSID, WIFI_PASS, WIFI_RECONNECTION_DELAY_MS);
    initOTA(OTA_HOSTNAME, OTA_PASSWORD, []() {
        digitalWrite(RELAY_SIREN_PIN, HIGH);
        digitalWrite(RELAY_LIGHT_STRIP_PIN, HIGH);
    });
    initMQTT(MQTT_SERVER, MQTT_PORT, MQTT_CLIENT_ID, mqttSubscribeTopics, 2, onMqttMessage);
}

void loop() {
    // Handle OTA updates
    handleOTA();

    // Maintain network connection
    maintainWifiConnection();
    maintainMQTTConnection();

    // Update sensors
    updateMagnetSensorStatus(appState);
    updateMotionSensor(appState);
    updateClimateData();

    // Update outputs
    updateLedIndicator(appState);
    updateAlarmSystem(appState);
    updateLightStrip(appState);

    delay(LOOPING_DELAY_MS);
}