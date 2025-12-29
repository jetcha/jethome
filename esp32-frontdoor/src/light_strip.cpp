#include "light_strip.h"

#include <Arduino.h>

#include "config.h"

void initLightStrip() {
    pinMode(RELAY_LIGHT_STRIP_PIN, OUTPUT);
    digitalWrite(RELAY_LIGHT_STRIP_PIN, HIGH);  // Start OFF (relay is active LOW)
}

void updateLightStrip(State& state) {
    bool isDoorJustClosed = !state.isDoorOpen && state.wasDoorOpen;
    bool isMotionJustStopped = !state.isMotionDetected && state.wasMotionDetected;

    // Light strip only works when alarm is OFF
    if (state.isAlarmEnabled) {
        state.isLightStripOn = false;
        state.isLightStripCountdownStarted = false;
        digitalWrite(RELAY_LIGHT_STRIP_PIN, HIGH);
        return;
    }

    // Not dark: Light strip always OFF
    if (!state.isDark) {
        state.isLightStripOn = false;
        state.isLightStripCountdownStarted = false;
        digitalWrite(RELAY_LIGHT_STRIP_PIN, HIGH);
        return;
    }

    // Door open OR Motion detected: Keep light strip ON
    if (state.isDoorOpen || state.isMotionDetected) {
        state.isLightStripOn = true;
        state.isLightStripCountdownStarted = false;
    }

    // Door just closed or No motion: Start countdown
    if ((isDoorJustClosed || isMotionJustStopped) && !state.isDoorOpen && !state.isMotionDetected &&
        state.isLightStripOn) {
        state.isLightStripCountdownStarted = true;
        state.lightStripCountdownStartTimestampMs = millis();
    }

    // Otherwise check if countdown finished
    if (state.isLightStripCountdownStarted &&
        (millis() - state.lightStripCountdownStartTimestampMs >= LIGHT_STRIP_DURATION_MS)) {
        state.isLightStripOn = false;
        state.isLightStripCountdownStarted = false;
    }

    // Apply light strip output (active LOW)
    digitalWrite(RELAY_LIGHT_STRIP_PIN, state.isLightStripOn ? LOW : HIGH);
}