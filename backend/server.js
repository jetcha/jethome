import express from "express";
import cors from "cors";
import { PORT, SUN_TIME_UPDATE_INTERVAL_MS } from "./config/constants.js";
import { initMqtt, syncDarknessState } from "./services/mqtt.js";
import { startRecording, stopRecording } from "./services/recorder.js";
import { isPrivacyEnabled } from "./services/privacy.js";
import authRoutes from "./routes/auth.js";
import alarmRoutes from "./routes/alarm.js";

import climateRoutes from "./routes/climate.js";
import cameraRoutes from "./routes/camera.js";
import pushRoutes from "./routes/push.js";

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api", alarmRoutes);

app.use("/api", climateRoutes);
app.use("/api", cameraRoutes);
app.use("/api", pushRoutes);

// Initialize MQTT
initMqtt();

// Always-on recording, unless privacy mode was left enabled
if (!isPrivacyEnabled()) {
  startRecording("living_room_cam");
  startRecording("bedroom_cam");
} else {
  console.log("[Privacy] enabled at boot — recording suspended");
}

// Sync darkness state every minute
setInterval(syncDarknessState, SUN_TIME_UPDATE_INTERVAL_MS);

// Graceful shutdown
function shutdown() {
  stopRecording("living_room_cam");
  stopRecording("bedroom_cam");
  process.exit();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Start server
app.listen(PORT, () => {
  console.log(`Jet Home backend running on http://localhost:${PORT}`);
});
