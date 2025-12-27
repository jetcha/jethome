#include <Arduino.h>
#include "config.h"
#include "wifi_manager.h"
#include "mqtt_manager.h"
#include "ota_manager.h"
#include "climate_sensor.h"

void setup()
{
    Serial.begin(SERIAL_BAUDRATE);

    // Initialize all modules
    initClimateSensor();

    // Network setup
    initWifi();
    initOTA();
    initMQTT();
}

void loop()
{
    // Handle OTA updates
    handleOTA();

    // Maintain network connection
    maintainWifiConnection();
    maintainMQTTConnection();

    // Update sensors
    updateClimateData();

    delay(LOOPING_DELAY_MS);
}
