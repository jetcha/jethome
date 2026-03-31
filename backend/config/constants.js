export const PORT = 3001;

// Authentication
export const PASSWORD_ROLES = {
  ["5656"]: "admin",
  ["0217"]: "user",
};

// VAPID keys for push notifications
export const VAPID_PUBLIC =
  "BGvl9emPq4-T9ZGV8sO74rhEyGJYE7WjByq1crKKlsgv9cdlTzeWx8a9YMcacXKO0wkaQ4ywJRAVK-JpiC5Gtms";
export const VAPID_PRIVATE = "BQVemg5JDjdst7XHWggPV05EhBaoKz0p5jBY9U17kIE";
export const VAPID_EMAIL = "mailto:jet.chang@mailbox.org";

// Location coordinates (Helmond, Netherlands)
export const LATITUDE = 51.4416;
export const LONGITUDE = 5.4697;

// Update intervals
export const SUN_TIME_UPDATE_INTERVAL_MS = 60000;
export const CLIMATE_DATA_SAVE_INTERVAL_MS = 300000;

// MQTT
export const MQTT_BROKER_URL = "mqtt://localhost:1883";

// Database
export const DATABASE_PATH = "climate_history.db";

// Pixel 6 (IP Webcam)
export const PIXEL6_HOST = "192.168.1.87";
export const PIXEL6_PORT = 8080;
export const PIXEL6_STREAM_URL = `http://${PIXEL6_HOST}:${PIXEL6_PORT}/video`;
export const PIXEL6_AUDIO_URL = `http://${PIXEL6_HOST}:${PIXEL6_PORT}/audio.wav`;

// Pi 3B (Pi Camera v2.1 via mediamtx RTSP)
export const PI3_RTSP_URL = "rtsp://192.168.1.89:8554/pi3cam";

// Recording
export const RECORDINGS_BASE_DIR = "/mnt/pi4cloud";
export const SEGMENT_DURATION_SECONDS = 1200; // 20 minutes
export const RETENTION_HOURS = 72;
export const RETENTION_CLEANUP_INTERVAL_MS = 3600000; // 1 hour
