#include "wifi_manager.h"

static const char* wifiSsid = nullptr;
static const char* wifiPass = nullptr;
static unsigned long reconnectDelay = 0;
static unsigned long lastWifiAttemptTimestampMs = 0;

void initWifi(const char* ssid, const char* password, unsigned long reconnectDelayMs) {
    wifiSsid = ssid;
    wifiPass = password;
    reconnectDelay = reconnectDelayMs;

    WiFi.begin(wifiSsid, wifiPass);
    lastWifiAttemptTimestampMs = millis();
}

void maintainWifiConnection() {
    if (WiFi.status() == WL_CONNECTED) {
        return;
    }

    if (millis() - lastWifiAttemptTimestampMs < reconnectDelay) {
        return;
    }
    lastWifiAttemptTimestampMs = millis();

    WiFi.disconnect();
    WiFi.begin(wifiSsid, wifiPass);
}
