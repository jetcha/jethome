#include "climate_sensor.h"

#include <Adafruit_SHTC3.h>
#include <Wire.h>

static Adafruit_SHTC3 shtc3 = Adafruit_SHTC3();
static unsigned long lastUpdateTimestampMs = 0;
static bool isSensorInitialized = false;
static unsigned long readIntervalMs = 0;
static const char* topic = nullptr;
static MqttPublishFunc publish = nullptr;

void initClimateSensor(int sdaPin, int sclPin, unsigned long intervalMs,
                       const char* mqttTopic, MqttPublishFunc publishFunc) {
    readIntervalMs = intervalMs;
    topic = mqttTopic;
    publish = publishFunc;

    Wire.begin(sdaPin, sclPin);
    if (shtc3.begin()) {
        isSensorInitialized = true;
    }
}

void updateClimateData() {
    if (!isSensorInitialized) {
        return;
    }

    if (millis() - lastUpdateTimestampMs < readIntervalMs) {
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
    publish(topic, payload);
}
