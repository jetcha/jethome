import express from "express";
import cors from "cors";

const app = express();
const PORT = 3001;

// Config - change this password!
const PASSWORD = "900731";

// In-memory state (will be replaced by MQTT later)
let alarmState = false;
let temperature = 22.5;
let humidity = 45;

// Simple token store (in production, use proper sessions)
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

// Generate simple token
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

// Alarm endpoints
app.get("/api/alarm", requireAuth, (req, res) => {
  res.json({ enabled: alarmState });
});

app.post("/api/alarm", requireAuth, (req, res) => {
  const { enabled } = req.body;
  alarmState = Boolean(enabled);
  console.log(`Alarm ${alarmState ? "ON" : "OFF"}`);
  // TODO: Send to ESP32 via MQTT
  res.json({ enabled: alarmState });
});

// Temperature and Humidity endpoint
app.get("/api/climate", requireAuth, (req, res) => {
  const mockTemp = temperature + (Math.random() - 0.5) * 0.5;
  const mockHumidity = 45 + (Math.random() - 0.5) * 10;
  res.json({
    temperature: Math.round(mockTemp * 10) / 10,
    humidity: Math.round(mockHumidity),
  });
});

// Simulate temperature changes (for testing)
setInterval(() => {
  temperature = 20 + Math.random() * 5;
  humidity = 40 + Math.random() * 20; // 40-60%
}, 10000);

app.listen(PORT, () => {
  console.log(`Jet Home backend running on http://localhost:${PORT}`);
});
