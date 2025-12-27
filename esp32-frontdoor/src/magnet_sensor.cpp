#include <Arduino.h>
#include "config.h"
#include "mqtt_manager.h"
#include "magnet_sensor.h"

static bool isFirstUpdate = true;

void initMagnetSensor()
{
    pinMode(DOOR_SENSOR_PIN, INPUT_PULLUP);
    pinMode(WINDOW_SENSOR_PIN, INPUT_PULLUP);
}

void updateMagnetSensorStatus(State &state)
{
    state.wasDoorOpen = state.isDoorOpen;
    bool newDoorState = (digitalRead(DOOR_SENSOR_PIN) == HIGH);
    bool newWindowState = (digitalRead(WINDOW_SENSOR_PIN) == HIGH);

    if (newDoorState != state.isDoorOpen || isFirstUpdate)
    {
        state.isDoorOpen = newDoorState;
        publishMessageMQTT(MQTT_TOPIC_DOOR_STATE, state.isDoorOpen ? "1" : "0");
    }

    if (newWindowState != state.isWindowOpen || isFirstUpdate)
    {
        state.isWindowOpen = newWindowState;
        publishMessageMQTT(MQTT_TOPIC_WINDOW_STATE, state.isWindowOpen ? "1" : "0");
    }

    isFirstUpdate = false;
}