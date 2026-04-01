#include <Arduino.h>
#include "config.h"
#include "wifi_manager.h"
#include "mqtt_manager.h"
#include "ota_manager.h"
#include "climate_sensor.h"

void setup()
{
    Serial.begin(SERIAL_BAUDRATE);

    initClimateSensor(I2C_SDA_PIN, I2C_SCL_PIN, CLIMATE_DATA_READ_INTERVAL_MS,
                      MQTT_TOPIC_CLIMATE, publishMessageMQTT);
    initWifi(WIFI_SSID, WIFI_PASS, WIFI_RECONNECTION_DELAY_MS);
    initOTA(OTA_HOSTNAME, OTA_PASSWORD);
    initMQTT(MQTT_SERVER, MQTT_PORT, MQTT_CLIENT_ID);
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
