#ifndef OTA_MANAGER_H
#define OTA_MANAGER_H

typedef void (*OtaSafetyFunc)();

void initOTA(const char* hostname, const char* password, OtaSafetyFunc onStart = nullptr);
void handleOTA();

#endif  // OTA_MANAGER_H
