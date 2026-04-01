#include "mqtt_manager.h"

#include <PubSubClient.h>
#include <WiFi.h>

static WiFiClient espClient;
static PubSubClient mqtt(espClient);
static unsigned long lastConnectionAttemptMs = 0;
static const char* mqttClientId = nullptr;
static const char** subTopics = nullptr;
static int subTopicCount = 0;
static MqttMessageFunc messageCallback = nullptr;

static void mqttCallback(char* topic, byte* payload, unsigned int length) {
    if (!messageCallback) return;

    char msg[length + 1];
    memcpy(msg, payload, length);
    msg[length] = '\0';

    messageCallback(topic, msg);
}

void initMQTT(const char* server, int port, const char* clientId,
              const char** subscribeTopics, int topicCount,
              MqttMessageFunc onMessage) {
    mqttClientId = clientId;
    subTopics = subscribeTopics;
    subTopicCount = topicCount;
    messageCallback = onMessage;

    mqtt.setServer(server, port);
    if (messageCallback) {
        mqtt.setCallback(mqttCallback);
    }
}

void maintainMQTTConnection() {
    if (mqtt.connected()) {
        mqtt.loop();
        return;
    }

    if (millis() - lastConnectionAttemptMs < 5000) {
        mqtt.loop();
        return;
    }
    lastConnectionAttemptMs = millis();

    if (mqtt.connect(mqttClientId)) {
        for (int i = 0; i < subTopicCount; i++) {
            mqtt.subscribe(subTopics[i]);
        }
    }

    mqtt.loop();
}

void publishMessageMQTT(const char* topic, const char* payload) {
    mqtt.publish(topic, payload);
}
