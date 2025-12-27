#include "wifi_manager.h"
#include "config.h"

static unsigned long lastWifiAttemptTimestampMs = 0;

void initWifi() {
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    lastWifiAttemptTimestampMs = millis();
}

void maintainWifiConnection() {
    if (WiFi.status() == WL_CONNECTED) {
        return;
    }
    
    if (millis() - lastWifiAttemptTimestampMs < WIFI_RECONNECTION_DELAY_MS) {
        return;
    }
    lastWifiAttemptTimestampMs = millis();
    
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASS);
}