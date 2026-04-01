#ifndef CLIMATE_SENSOR_H
#define CLIMATE_SENSOR_H

typedef void (*MqttPublishFunc)(const char* topic, const char* payload);

void initClimateSensor(int sdaPin, int sclPin, unsigned long intervalMs,
                       const char* mqttTopic, MqttPublishFunc publishFunc);
void updateClimateData();

#endif  // CLIMATE_SENSOR_H
