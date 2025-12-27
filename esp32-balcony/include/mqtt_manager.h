#ifndef MQTT_MANAGER_H
#define MQTT_MANAGER_H

#include <PubSubClient.h>

void initMQTT();
void maintainMQTTConnection();
void publishMessageMQTT(const char *topic, const char *payload);

#endif // MQTT_MANAGER_H
