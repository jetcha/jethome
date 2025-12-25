import express from "express";
import cors from "cors";
import mqtt from "mqtt";

const app = express();
const PORT = 3001;

// Config
const PASSWORD = "900731";

// Real-time state from ESP32
let alarmState = false;
let testMode = false;
let temperature = null;
let humidity = null;
let isDoorOpened = false;
let isWindowOpened = false;

// MQTT connection
const mqttClient = mqtt.connect("mqtt://localhost:1883");

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  mqttClient.subscribe("jethome/#", (err) => {
    if (err) console.error("MQTT subscribe error:", err);
  });
});

mqttClient.on("message", (topic, message) => {
  const value = message.toString();

  switch (topic) {
    case "jethome/climate/temperature":
      temperature = parseFloat(value);
      break;
    case "jethome/climate/humidity":
      humidity = parseFloat(value);
      break;
    case "jethome/door/state":
      isDoorOpened = value === "1";
      break;
    case "jethome/window/state":
      isWindowOpened = value === "1";
      break;
    default:
      break;
  }
});

mqttClient.on("error", (err) => {
  console.error("MQTT error:", err);
});

// Token store
const validTokens = new Set();

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Auth middleware
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !validTokens.has(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Routes
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    const token = generateToken();
    validTokens.add(token);
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: "Wrong password" });
  }
});

app.post("/api/logout", requireAuth, (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  validTokens.delete(token);
  res.json({ success: true });
});

app.get("/api/alarm", requireAuth, (req, res) => {
  res.json({ enabled: alarmState });
});

app.post("/api/alarm", requireAuth, (req, res) => {
  const { enabled } = req.body;
  alarmState = Boolean(enabled);
  console.log(`Alarm ${alarmState ? "ON" : "OFF"}`);
  mqttClient.publish("jethome/alarm/set", alarmState ? "1" : "0");
  res.json({ enabled: alarmState });
});

app.get("/api/testmode", requireAuth, (req, res) => {
  res.json({ enabled: testMode });
});

app.post("/api/testmode", requireAuth, (req, res) => {
  const { enabled } = req.body;
  testMode = Boolean(enabled);
  mqttClient.publish("jethome/testmode/set", testMode ? "1" : "0");
  res.json({ enabled: testMode });
});

app.get("/api/climate", requireAuth, (req, res) => {
  res.json({
    temperature: temperature,
    humidity: humidity,
  });
});

app.get("/api/doorState", requireAuth, (req, res) => {
  res.json({ opened: isDoorOpened });
});

app.get("/api/windowState", requireAuth, (req, res) => {
  res.json({ opened: isWindowOpened });
});

app.listen(PORT, () => {
  console.log(`Jet Home backend running on http://localhost:${PORT}`);
});
