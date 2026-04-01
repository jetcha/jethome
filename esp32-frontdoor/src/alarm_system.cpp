#include "alarm_system.h"

#include <Arduino.h>

#include "config.h"
#include "mqtt_manager.h"

void initAlarmSystem() {
    pinMode(RELAY_SIREN_PIN, OUTPUT);
    digitalWrite(RELAY_SIREN_PIN, HIGH);  // Start OFF (relay is active LOW)
}

void updateAlarmSystem(State& state) {
    bool isBreachDetected = state.isDoorOpen || state.isWindowOpen;
    bool wasSirenActive = state.isSirenActive;

    // If alarm system is turned off, immediately stop siren
    if (!state.isAlarmEnabled) {
        state.isSirenActive = false;
        state.isSirenCountdownStarted = false;
    }

    // Breach detected while alarm is enabled: activate siren
    if (state.isAlarmEnabled && isBreachDetected) {
        state.isSirenActive = true;
        state.isSirenCountdownStarted = false;
    }

    // Notify backend when alarm first triggers
    if (!wasSirenActive && state.isSirenActive) {
        if (state.isDoorOpen) publishMessageMQTT(MQTT_TOPIC_ALARM_TRIGGERED, "door");
        if (state.isWindowOpen) publishMessageMQTT(MQTT_TOPIC_ALARM_TRIGGERED, "window");
    }

    // Start countdown when breach is closed but siren is still active
    if (state.isSirenActive && !isBreachDetected && !state.isSirenCountdownStarted) {
        state.isSirenCountdownStarted = true;
        state.sirenStartTimestampMs = millis();
    }

    // Check if countdown finished
    if (state.isSirenActive && state.isSirenCountdownStarted &&
        (millis() - state.sirenStartTimestampMs >= SIREN_DURATION_MS)) {
        state.isSirenActive = false;
        state.isSirenCountdownStarted = false;
    }

    // Apply siren output (active LOW)
    digitalWrite(RELAY_SIREN_PIN, state.isSirenActive ? LOW : HIGH);
}
