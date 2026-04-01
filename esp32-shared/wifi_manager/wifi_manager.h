#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <WiFi.h>

void initWifi(const char* ssid, const char* password, unsigned long reconnectDelayMs);
void maintainWifiConnection();

#endif  // WIFI_MANAGER_H
