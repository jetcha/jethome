#include <WiFi.h>
#include "config.h"
#include "mqtt_manager.h"

static WiFiClient espClient;
static PubSubClient mqtt(espClient);
static unsigned long lastConnectionAttemptMs = 0;

void initMQTT() {
    mqtt.setServer(MQTT_SERVER, MQTT_PORT);
    mqtt.setCallback(nullptr);
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
    mqtt.connect(MQTT_CLIENT_ID);

    mqtt.loop();
}

void publishMessageMQTT(const char* topic, const char* payload) {
    mqtt.publish(topic, payload);
}
