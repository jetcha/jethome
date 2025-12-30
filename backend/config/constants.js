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
export const SUN_TIME_UPDATE_INTERVAL_MS = 300000;
export const CLIMATE_DATA_SAVE_INTERVAL_MS = 300000;

// MQTT
export const MQTT_BROKER_URL = "mqtt://localhost:1883";

// Database
export const DATABASE_PATH = "climate_history.db";
