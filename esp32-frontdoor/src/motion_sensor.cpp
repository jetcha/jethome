#include "motion_sensor.h"

#include <Arduino.h>

#include "config.h"

static bool isFirstUpdate = true;

void initMotionSensor() { pinMode(MOTION_SENSOR_PIN, INPUT); }

void updateMotionSensor(State& state) {
    state.wasMotionDetected = state.isMotionDetected;
    bool newMotionState = (digitalRead(MOTION_SENSOR_PIN) == HIGH);

    if (newMotionState != state.isMotionDetected || isFirstUpdate) {
        state.isMotionDetected = newMotionState;
    }

    isFirstUpdate = false;
}