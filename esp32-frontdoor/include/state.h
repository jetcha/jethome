#ifndef STATE_H
#define STATE_H

#include <Arduino.h>

#include "config.h"

// =============================================================================
// Shared Application State
// =============================================================================
// This struct holds all state that needs to be shared between modules.
// A single instance is created in main.cpp and passed by reference to modules.

struct State {
    // Alarm system
    bool isAlarmEnabled = false;
    bool isTestMode = false;

    // Door and window sensors
    bool isDoorOpen = false;
    bool isWindowOpen = false;
    bool wasDoorOpen = false;

    // Motion sensor
    bool isMotionDetected = false;
    bool wasMotionDetected = false;

    // Siren
    bool isSirenActive = false;
    bool isSirenCountdownStarted = false;
    unsigned long sirenStartTimestampMs = 0;
    unsigned long sirenDurationMs = SIREN_DURATION_MS;

    // Light strip
    bool isDark = false;
    bool isLightStripOn = false;
    bool isLightStripCountdownStarted = false;
    unsigned long lightStripCountdownStartTimestampMs = 0;
};

#endif  // STATE_H
