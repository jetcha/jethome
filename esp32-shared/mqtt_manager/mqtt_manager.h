#ifndef MQTT_MANAGER_H
#define MQTT_MANAGER_H

typedef void (*MqttMessageFunc)(const char* topic, const char* payload);

void initMQTT(const char* server, int port, const char* clientId,
              const char** subscribeTopics = nullptr, int topicCount = 0,
              MqttMessageFunc onMessage = nullptr);
void maintainMQTTConnection();
void publishMessageMQTT(const char* topic, const char* payload);

#endif  // MQTT_MANAGER_H
