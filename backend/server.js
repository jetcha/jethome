import express from "express";
import cors from "cors";
import mqtt from "mqtt";
import webpush from "web-push";
import Database from "better-sqlite3";

const app = express();
const PORT = 3001;

// Token store: token -> { role: 'admin' | 'user' }
const validTokens = new Map();
const PASSWORD_ROLES = {
  ["5656"]: "admin",
  ["0217"]: "user",
};

// VAPID keys
const VAPID_PUBLIC =
  "BGvl9emPq4-T9ZGV8sO74rhEyGJYE7WjByq1crKKlsgv9cdlTzeWx8a9YMcacXKO0wkaQ4ywJRAVK-JpiC5Gtms";
const VAPID_PRIVATE = "BQVemg5JDjdst7XHWggPV05EhBaoKz0p5jBY9U17kIE";

webpush.setVapidDetails(
  "mailto:jet.chang@mailbox.org",
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

const pushSubscriptions = new Set();

// Real-time state from ESP32
let alarmState = false;
let testMode = false;
let temperatureIndoor = null;
let humidityIndoor = null;
let temperatureOutdoor = null;
let humidityOutdoor = null;
let isDoorOpened = false;
let isWindowOpened = false;

// Sunrise/sunset data (Helmond coordinates)
const LATITUDE = 51.4416;
const LONGITUDE = 5.4697;
let sunriseTime = null;
let sunsetTime = null;
let lastFetchDate = null;

// Database setup
const db = new Database("climate_history.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS climate_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location TEXT NOT NULL,
    temperature REAL,
    humidity REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Save interval: every 5 minutes
const SAVE_INTERVAL_MS = 300000;
let lastIndoorSaveTimestamp = 0;
let lastOutdoorSaveTimestamp = 0;

function saveClimateReading(location, temperature, humidity) {
  if (temperature === null || humidity === null) return;
  
  const stmt = db.prepare(
    "INSERT INTO climate_history (location, temperature, humidity) VALUES (?, ?, ?)"
  );
  stmt.run(location, temperature, humidity);
}

async function fetchSunTimes() {
  try {
    const res = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${LATITUDE}&lng=${LONGITUDE}&formatted=0`
    );
    const data = await res.json();
    sunriseTime = new Date(data.results.sunrise);
    sunsetTime = new Date(data.results.sunset);
    lastFetchDate = new Date().toDateString();
    console.log(
      `Sun times updated: rise=${sunriseTime.toLocaleTimeString()}, set=${sunsetTime.toLocaleTimeString()}`
    );
  } catch (err) {
    console.error("Failed to fetch sun times:", err);
  }
}

async function isDark() {
  const today = new Date().toDateString();
  if (lastFetchDate !== today) {
    await fetchSunTimes();
  }

  if (!sunriseTime || !sunsetTime) {
    return false;
  }
  const now = new Date();
  return now < sunriseTime || now > sunsetTime;
}

// Fetch on startup
fetchSunTimes();

// MQTT connection
const mqttClient = mqtt.connect("mqtt://localhost:1883");

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  mqttClient.subscribe("jethome/#", (err) => {
    if (err) console.error("MQTT subscribe error:", err);
  });
});

mqttClient.on("message", async (topic, message) => {
  const value = message.toString();

  switch (topic) {
    case "jethome/frontdoor/temperature":
      temperatureIndoor = parseFloat(value);
      if (Date.now() - lastIndoorSaveTimestamp >= SAVE_INTERVAL_MS) {
        saveClimateReading("indoor", temperatureIndoor, humidityIndoor);
        lastIndoorSaveTimestamp = Date.now();
        console.log("Saved indoor climate data");
      }
      break;
    case "jethome/frontdoor/humidity":
      humidityIndoor = parseFloat(value);
      break;
    case "jethome/balcony/temperature":
      temperatureOutdoor = parseFloat(value);
      if (Date.now() - lastOutdoorSaveTimestamp >= SAVE_INTERVAL_MS) {
        saveClimateReading("outdoor", temperatureOutdoor, humidityOutdoor);
        lastOutdoorSaveTimestamp = Date.now();
        console.log("Saved outdoor climate data");
      }
      break;
    case "jethome/balcony/humidity":
      humidityOutdoor = parseFloat(value);
      break;
    case "jethome/door/state":
      const wasDoorOpened = isDoorOpened;
      isDoorOpened = value === "1";

      const dark = await isDark();
      mqttClient.publish("jethome/light/dark", dark ? "1" : "0");

      if (!wasDoorOpened && isDoorOpened && alarmState) {
        sendPushNotification("Jet Home", "⚠️ Front Door Opened ⚠️");
      }
      break;
    case "jethome/window/state":
      const wasWindowOpened = isWindowOpened;
      isWindowOpened = value === "1";
      if (!wasWindowOpened && isWindowOpened && alarmState) {
        sendPushNotification("Jet Home", "⚠️ Window Opened ⚠️");
      }
      break;
    default:
      break;
  }
});

mqttClient.on("error", (err) => {
  console.error("MQTT error:", err);
});

// Send push notification to all subscribers
function sendPushNotification(title, body) {
  const payload = JSON.stringify({ title, body });

  pushSubscriptions.forEach((sub) => {
    webpush.sendNotification(JSON.parse(sub), payload).catch((err) => {
      console.error("Push error:", err);
      // Remove invalid subscription
      if (err.statusCode === 410) {
        pushSubscriptions.delete(sub);
      }
    });
  });
}

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Auth middleware
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !validTokens.has(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userRole = validTokens.get(token).role;
  next();
}

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Routes
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  const role = PASSWORD_ROLES[password];
  if (role) {
    const token = generateToken();
    validTokens.set(token, { role });
    res.json({ success: true, token, role });
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

  sendPushNotification(
    "Jet Home",
    alarmState ? "Alarm system turned ON" : "Alarm system turned OFF"
  );

  res.json({ enabled: alarmState });
});

app.get("/api/testmode", requireAuth, (req, res) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.json({ enabled: testMode });
});

app.post("/api/testmode", requireAuth, (req, res) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { enabled } = req.body;
  testMode = Boolean(enabled);
  mqttClient.publish("jethome/testmode/set", testMode ? "1" : "0");
  res.json({ enabled: testMode });
});

app.get("/api/frontdoor/climate", requireAuth, (req, res) => {
  res.json({
    temperature: temperatureIndoor,
    humidity: humidityIndoor,
  });
});

app.get("/api/balcony/climate", requireAuth, (req, res) => {
  res.json({
    temperature: temperatureOutdoor,
    humidity: humidityOutdoor,
  });
});

app.get("/api/doorState", requireAuth, (req, res) => {
  res.json({ opened: isDoorOpened });
});

app.get("/api/windowState", requireAuth, (req, res) => {
  res.json({ opened: isWindowOpened });
});

app.get("/api/isDark", requireAuth, (req, res) => {
  res.json({
    dark: isDark(),
    sunrise: sunriseTime?.toISOString(),
    sunset: sunsetTime?.toISOString(),
  });
});

app.get("/api/vapidPublicKey", (req, res) => {
  res.json({ key: VAPID_PUBLIC });
});

app.post("/api/push/subscribe", requireAuth, (req, res) => {
  const subscription = JSON.stringify(req.body);
  pushSubscriptions.add(subscription);
  console.log("New push subscription");
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Jet Home backend running on http://localhost:${PORT}`);
});
