#include <Arduino.h>
#include "config.h"
#include "light_strip.h"

void initLightStrip()
{
    pinMode(RELAY_LIGHT_STRIP_PIN, OUTPUT);
    digitalWrite(RELAY_LIGHT_STRIP_PIN, HIGH); // Start OFF (relay is active LOW)
}

void updateLightStrip(State &state)
{
    // Light strip only works when alarm is OFF
    if (state.isAlarmEnabled)
    {
        state.isLightStripOn = false;
        state.isLightStripCountdownStarted = false;
        digitalWrite(RELAY_LIGHT_STRIP_PIN, HIGH);
        return;
    }

    // Not dark: Light strip always OFF
    if (!state.isDark)
    {
        state.isLightStripOn = false;
        state.isLightStripCountdownStarted = false;
        digitalWrite(RELAY_LIGHT_STRIP_PIN, HIGH);
        return;
    }

    // Dark + Door opens: Keep light strip ON, no countdown until door is closed
    if (state.isDoorOpen)
    {
        state.isLightStripOn = true;
        state.isLightStripCountdownStarted = false;
    }

    // Dark + Door just closed: Start countdown
    if (!state.isDoorOpen && state.wasDoorOpen && state.isLightStripOn)
    {
        state.isLightStripCountdownStarted = true;
        state.lightStripCountdownStartTimestampMs = millis();
    }

    // Check if countdown finished
    if (state.isLightStripCountdownStarted &&
        (millis() - state.lightStripCountdownStartTimestampMs >= LIGHT_STRIP_DURATION_MS))
    {
        state.isLightStripOn = false;
        state.isLightStripCountdownStarted = false;
    }

    // Apply light strip output (active LOW)
    digitalWrite(RELAY_LIGHT_STRIP_PIN, state.isLightStripOn ? LOW : HIGH);
}
