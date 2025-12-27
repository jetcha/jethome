#include <DHT.h>
#include "config.h"
#include "mqtt_manager.h"
#include "climate_sensor.h"

static DHT dht(DHTPIN, DHTTYPE);
static unsigned long lastUpdateTimestampMs = 0;

void initClimateSensor() {
    dht.begin();
}

void updateClimateData() {
    char payload[16];

    if (millis() - lastUpdateTimestampMs < CLIMATE_DATA_READ_INTERVAL_MS) {
        return;
    }
    lastUpdateTimestampMs = millis();

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temperature) || isnan(humidity)) {
        Serial.printf("Ah\n");
        return;
    }

    snprintf(payload, sizeof(payload), "%.1f", temperature);
    publishMessageMQTT(MQTT_TOPIC_TEMPERATURE, payload);

    Serial.printf("Temperature: %s\n", payload);

    snprintf(payload, sizeof(payload), "%.1f", humidity);
    publishMessageMQTT(MQTT_TOPIC_HUMIDITY, payload);

    Serial.printf("Humdity: %s\n", payload);
}
