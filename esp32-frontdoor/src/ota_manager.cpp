#include "ota_manager.h"

#include <ArduinoOTA.h>

#include "config.h"

void initOTA() {
    ArduinoOTA.setHostname(OTA_HOSTNAME);
    ArduinoOTA.setPassword(OTA_PASSWORD);

    ArduinoOTA.onStart([]() {
        // Safety: Turn off relays during OTA update
        digitalWrite(RELAY_SIREN_PIN, HIGH);
        digitalWrite(RELAY_LIGHT_STRIP_PIN, HIGH);
    });

    ArduinoOTA.onEnd([]() {
        // Action when it is finished
    });

    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
        // Action when it is progressing
    });

    ArduinoOTA.onError([](ota_error_t error) {
        // Action when it fails
    });

    ArduinoOTA.begin();
}

void handleOTA() { ArduinoOTA.handle(); }
