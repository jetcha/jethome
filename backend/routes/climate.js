import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { stateManager } from "../services/StateManager.js";
import {
  getClimateHistoryAggregated,
  getClimateHistoryByRange,
} from "../services/database.js";
import { fetchSunTimes, isDark, getSunTimes } from "../services/sunTimes.js";

const router = express.Router();

router.get("/frontdoor/climate", requireAuth, (req, res) => {
  res.json(stateManager.indoorClimate);
});

router.get("/balcony/climate", requireAuth, (req, res) => {
  res.json(stateManager.outdoorClimate);
});

router.get("/climate/history", requireAuth, (req, res) => {
  const { location = "indoor", hours = 168, from, to } = req.query;
  if (from && to) {
    const rows = getClimateHistoryByRange(location, from, to);
    res.json(rows);
  } else {
    const rows = getClimateHistoryAggregated(location, hours);
    res.json(rows);
  }
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

export default router;
