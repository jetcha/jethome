#include "ota_manager.h"

#include <ArduinoOTA.h>

static OtaSafetyFunc safetyFunc = nullptr;

void initOTA(const char* hostname, const char* password, OtaSafetyFunc onStart) {
    safetyFunc = onStart;

    ArduinoOTA.setHostname(hostname);
    ArduinoOTA.setPassword(password);

    ArduinoOTA.onStart([]() {
        if (safetyFunc) safetyFunc();
    });

    ArduinoOTA.onEnd([]() {});
    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {});
    ArduinoOTA.onError([](ota_error_t error) {});

    ArduinoOTA.begin();
}

void handleOTA() { ArduinoOTA.handle(); }
