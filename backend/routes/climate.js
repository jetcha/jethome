import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { stateManager } from "../services/StateManager.js";
import { getClimateHistory } from "../services/database.js";
import { fetchSunTimes, isDark, getSunTimes } from "../services/sunTimes.js";
import { VAPID_PUBLIC } from "../config/constants.js";
import { addSubscription } from "../services/push.js";

const router = express.Router();

router.get("/frontdoor/climate", requireAuth, (req, res) => {
  res.json(stateManager.indoorClimate);
});

router.get("/balcony/climate", requireAuth, (req, res) => {
  res.json(stateManager.outdoorClimate);
});

router.get("/climate/history", requireAuth, (req, res) => {
  const { location = "indoor", hours = 24 } = req.query;
  const rows = getClimateHistory(location, hours);
  res.json(rows);
});

router.get("/isDark", requireAuth, async (req, res) => {
  await fetchSunTimes();
  const { sunrise, sunset } = getSunTimes();
  res.json({
    dark: isDark(),
    sunrise: sunrise?.toISOString(),
    sunset: sunset?.toISOString(),
  });
});

router.get("/vapidPublicKey", (req, res) => {
  res.json({ key: VAPID_PUBLIC });
});

router.post("/push/subscribe", requireAuth, (req, res) => {
  addSubscription(req.body);
  res.json({ success: true });
});

export default router;
