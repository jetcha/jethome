#include "mqtt_manager.h"

#include <WiFi.h>

#include "config.h"

static WiFiClient espClient;
static PubSubClient mqtt(espClient);
static State* appState = nullptr;
static unsigned long lastConnectionAttemptMs = 0;

static void mqttCallback(char* topic, byte* payload, unsigned int length) {
    String msg;
    for (unsigned int i = 0; i < length; i++) {
        msg += (char)payload[i];
    }

    if (appState == nullptr) {
        return;
    }

    String topicStr = String(topic);

    if (topicStr == MQTT_TOPIC_ALARM_SET) {
        appState->isAlarmEnabled = (msg == "1");
    }

    if (topicStr == MQTT_TOPIC_TESTMODE_SET) {
        appState->isTestMode = (msg == "1");
        appState->sirenDurationMs =
            appState->isTestMode ? SIREN_DURATION_TEST_MS : SIREN_DURATION_MS;
    }

    if (topicStr == MQTT_TOPIC_LIGHT_DARK) {
        appState->isDark = (msg == "1");
    }
}

void initMQTT(State* statePtr) {
    appState = statePtr;
    mqtt.setServer(MQTT_SERVER, MQTT_PORT);
    mqtt.setCallback(mqttCallback);
}

void maintainMQTTConnection() {
    if (mqtt.connected()) {
        mqtt.loop();
        return;
    }

    if (millis() - lastConnectionAttemptMs < MQTT_RECONNECTION_DELAY_MS) {
        mqtt.loop();
        return;
    }
    lastConnectionAttemptMs = millis();

    // The main loop should retry if it fails
    if (mqtt.connect(MQTT_CLIENT_ID)) {
        mqtt.subscribe(MQTT_TOPIC_ALARM_SET);
        mqtt.subscribe(MQTT_TOPIC_TESTMODE_SET);
        mqtt.subscribe(MQTT_TOPIC_LIGHT_DARK);
    }

    mqtt.loop();
}

void publishMessageMQTT(const char* topic, const char* payload) { mqtt.publish(topic, payload); }
