#include <DHT.h>
#include "config.h"
#include "mqtt_manager.h"
#include "climate_sensor.h"

static DHT dht(DHTPIN, DHTTYPE);
static unsigned long lastUpdateMs = 0;

void initClimateSensor() {
    dht.begin();
}

void updateClimateData() {
    if (millis() - lastUpdateMs < CLIMATE_DATA_READ_INTERVAL_MS) {
        return;
    }
    lastUpdateMs = millis();

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temperature) || isnan(humidity)) {
        return;
    }

    char payload[16];

    snprintf(payload, sizeof(payload), "%.1f", temperature);
    publishMessageMQTT(MQTT_TOPIC_TEMPERATURE, payload);

    snprintf(payload, sizeof(payload), "%.1f", humidity);
    publishMessageMQTT(MQTT_TOPIC_HUMIDITY, payload);
}
