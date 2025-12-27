#include <DHT.h>
#include "config.h"
#include "mqtt_manager.h"
#include "climate_sensor.h"

static DHT dht(DHTPIN, DHTTYPE);
static unsigned long lastUpdateTimestampMs = 0;

void initClimateSensor()
{
    dht.begin();
}

void updateClimateData()
{
    char payload[64];

    if (millis() - lastUpdateTimestampMs < CLIMATE_DATA_READ_INTERVAL_MS)
    {
        return;
    }
    lastUpdateTimestampMs = millis();

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temperature) || isnan(humidity))
    {
        return;
    }

    snprintf(payload, sizeof(payload), "{\"temperature\":%.1f,\"humidity\":%.1f}", temperature, humidity);
    publishMessageMQTT(MQTT_TOPIC_CLIMATE, payload);
}
