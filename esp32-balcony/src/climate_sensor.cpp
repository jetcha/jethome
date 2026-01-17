#include "climate_sensor.h"

#include <Adafruit_SHTC3.h>
#include <Wire.h>

#include "config.h"
#include "mqtt_manager.h"

static Adafruit_SHTC3 shtc3 = Adafruit_SHTC3();
static unsigned long lastUpdateTimestampMs = 0;
static bool isSensorInitialized = false;

void initClimateSensor() {
    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
    if (shtc3.begin()) {
        isSensorInitialized = true;
    }
}

void updateClimateData() {
    if (!isSensorInitialized) {
        return;
    }

    if (millis() - lastUpdateTimestampMs < CLIMATE_DATA_READ_INTERVAL_MS) {
        return;
    }
    lastUpdateTimestampMs = millis();

    sensors_event_t humidity, temperature;
    shtc3.getEvent(&humidity, &temperature);

    if (isnan(temperature.temperature) || isnan(humidity.relative_humidity)) {
        return;
    }

    char payload[64];
    snprintf(payload, sizeof(payload), "{\"temperature\":%.1f,\"humidity\":%.1f}",
             temperature.temperature, humidity.relative_humidity);
    publishMessageMQTT(MQTT_TOPIC_CLIMATE, payload);
}