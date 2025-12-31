import express from "express";
import cors from "cors";
import { PORT, SUN_TIME_UPDATE_INTERVAL_MS } from "./config/constants.js";
import { initMqtt, syncDarknessState } from "./services/mqtt.js";
import authRoutes from "./routes/auth.js";
import alarmRoutes from "./routes/alarm.js";
import sensorsRoutes from "./routes/sensors.js";
import climateRoutes from "./routes/climate.js";

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api", alarmRoutes);
app.use("/api", sensorsRoutes);
app.use("/api", climateRoutes);

// Initialize MQTT
initMqtt();

// Sync darkness state every minute
setInterval(syncDarknessState, SUN_TIME_UPDATE_INTERVAL_MS);

// Start server
app.listen(PORT, () => {
  console.log(`Jet Home backend running on http://localhost:${PORT}`);
});
