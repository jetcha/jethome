#include "magnet_sensor.h"

#include <Arduino.h>

#include "config.h"

static bool isFirstUpdate = true;

void initMagnetSensor() {
    pinMode(DOOR_SENSOR_PIN, INPUT_PULLUP);
    pinMode(WINDOW_SENSOR_PIN, INPUT_PULLUP);
}

void updateMagnetSensorStatus(State& state) {
    state.wasDoorOpen = state.isDoorOpen;
    bool newDoorState = (digitalRead(DOOR_SENSOR_PIN) == HIGH);
    bool newWindowState = (digitalRead(WINDOW_SENSOR_PIN) == HIGH);

    if (newDoorState != state.isDoorOpen || isFirstUpdate) {
        state.isDoorOpen = newDoorState;
    }

    if (newWindowState != state.isWindowOpen || isFirstUpdate) {
        state.isWindowOpen = newWindowState;
    }

    isFirstUpdate = false;
}