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

// Reolink E1 Pro cameras
// Sub-stream (896x512, ~1 Mbps): used for live feed (low latency, low bandwidth)
// Main stream (2560x1440, ~3 Mbps): used for recordings (high quality archive)
// Hosts are physically swapped: living room camera is at .91, bedroom at .90
export const REOLINK_USER = "admin";
export const REOLINK_PASS = "900731doraTKC#"; // raw password (CGI API uses this)
const PASS_ENC = encodeURIComponent(REOLINK_PASS); // RTSP URL form (# -> %23)

export const LIVING_ROOM_CAM_HOST = "192.168.1.91";
export const BEDROOM_CAM_HOST = "192.168.1.90";

export const LIVING_ROOM_CAM_RTSP_URL_SUB = `rtsp://${REOLINK_USER}:${PASS_ENC}@${LIVING_ROOM_CAM_HOST}:554/h264Preview_01_sub`;
export const LIVING_ROOM_CAM_RTSP_URL_MAIN = `rtsp://${REOLINK_USER}:${PASS_ENC}@${LIVING_ROOM_CAM_HOST}:554/h264Preview_01_main`;
export const BEDROOM_CAM_RTSP_URL_SUB = `rtsp://${REOLINK_USER}:${PASS_ENC}@${BEDROOM_CAM_HOST}:554/h264Preview_01_sub`;
export const BEDROOM_CAM_RTSP_URL_MAIN = `rtsp://${REOLINK_USER}:${PASS_ENC}@${BEDROOM_CAM_HOST}:554/h264Preview_01_main`;

// Camera
export const VALID_CAMS = ["living_room_cam", "bedroom_cam"];
export const FILENAME_PATTERN = /^rec_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.mp4$/;

// Recording
export const RECORDINGS_BASE_DIR = "/mnt/pi4cloud";
export const SEGMENT_DURATION_SECONDS = 1200; // 20 minutes
export const RETENTION_HOURS = 72;
export const RETENTION_CLEANUP_INTERVAL_MS = 3600000; // 1 hour
