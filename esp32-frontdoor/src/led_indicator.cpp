#include <Arduino.h>
#include "config.h"
#include "led_indicator.h"

struct LedState
{
    bool r;
    bool g;
    bool b;
};

static LedState previousLedState = {false, false, false};
static unsigned long lastBlinkMs = 0;

void initLedIndicator()
{
    pinMode(LED_R_PIN, OUTPUT);
    pinMode(LED_G_PIN, OUTPUT);
    pinMode(LED_B_PIN, OUTPUT);

    digitalWrite(LED_R_PIN, LOW);
    digitalWrite(LED_G_PIN, LOW);
    digitalWrite(LED_B_PIN, LOW);
}

void updateLedIndicator(const State &state)
{
    LedState currentLedState = previousLedState;

    if (!state.isAlarmEnabled)
    {
        // Green: Alarm disabled (safe mode)
        currentLedState = {false, true, false};
    }
    else if (state.isTestMode)
    {
        // Blue: Test mode active
        currentLedState = {false, false, true};
    }
    else if (millis() - lastBlinkMs >= LED_BLINK_INTERVAL_MS)
    {
        // Red blinking: Alarm enabled (armed)
        currentLedState = {!previousLedState.r, false, false};
        lastBlinkMs = millis();
    }

    // Only update outputs if state changed
    if (currentLedState.r != previousLedState.r ||
        currentLedState.g != previousLedState.g ||
        currentLedState.b != previousLedState.b)
    {

        digitalWrite(LED_R_PIN, currentLedState.r ? HIGH : LOW);
        digitalWrite(LED_G_PIN, currentLedState.g ? HIGH : LOW);
        digitalWrite(LED_B_PIN, currentLedState.b ? HIGH : LOW);

        previousLedState = currentLedState;
    }
}
