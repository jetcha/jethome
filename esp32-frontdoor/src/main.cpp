#include <Arduino.h>
#include "config.h"
#include "state.h"
#include "wifi_manager.h"
#include "mqtt_manager.h"
#include "ota_manager.h"
#include "climate_sensor.h"
#include "magnet_sensor.h"
#include "alarm_system.h"
#include "light_strip.h"
#include "led_indicator.h"

// Global application state
// A single instance shared info between modules
static State appState;

void setup() {
    Serial.begin(SERIAL_BAUDRATE);

    // Initialize all modules
    initLedIndicator();
    initMagnetSensor();
    initAlarmSystem();
    initLightStrip();
    initClimateSensor();

    // Network setup
    initWifi();
    initOTA();
    initMQTT(&appState);
}

void loop() {
    // Handle OTA updates
    handleOTA();

    // Maintain network connection
    maintainWifiConnection();
    maintainMQTTConnection();

    // Update sensors
    updateMagnetSensorStatus(appState);
    updateClimateData();

    // Update outputs
    updateLedIndicator(appState);
    updateAlarmSystem(appState);
    updateLightStrip(appState);

    delay(LOOPING_DELAY_MS);
}
