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

void setup() {
    Serial.begin(SERIAL_BAUDRATE);

    // Initialize all modules
    initLedIndicator();
    initMagnetSensor();
    initMotionSensor();
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
    updateMotionSensor(appState);
    updateClimateData();

    // Update outputs
    updateLedIndicator(appState);
    updateAlarmSystem(appState);
    updateLightStrip(appState);

    delay(LOOPING_DELAY_MS);
}