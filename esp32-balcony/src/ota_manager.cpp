#include <ArduinoOTA.h>
#include "config.h"
#include "ota_manager.h"

void initOTA() {
    ArduinoOTA.setHostname(OTA_HOSTNAME);
    ArduinoOTA.setPassword(OTA_PASSWORD);

    ArduinoOTA.onStart([]() {
        // Action before it starts
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

void handleOTA() {
    ArduinoOTA.handle();
}
