import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { stateManager } from "../services/StateManager.js";
import { publishMqtt } from "../services/mqtt.js";
import { sendPushNotification } from "../services/push.js";

const router = express.Router();

router.get("/alarm", requireAuth, (req, res) => {
  res.json({ enabled: stateManager.alarmState });
});

router.post("/alarm", requireAuth, (req, res) => {
  const { enabled } = req.body;
  stateManager.alarmState = enabled;
  publishMqtt("jethome/alarm/set", stateManager.alarmState ? "1" : "0");

  sendPushNotification(
    "Jet Home",
    stateManager.alarmState
      ? "Alarm system turned ON"
      : "Alarm system turned OFF"
  );

  res.json({ enabled: stateManager.alarmState });
});

export default router;
