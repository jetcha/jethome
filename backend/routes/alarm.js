import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { stateManager } from "../services/StateManager.js";
import { publishMqtt } from "../services/mqtt.js";
import { sendPushNotification } from "../services/push.js";

const router = express.Router();

function applyAlarmState(enabled, message) {
  const changed = stateManager.alarmState !== enabled;
  stateManager.alarmState = enabled;
  publishMqtt("jethome/alarm/set", enabled ? "1" : "0");
  if (changed && message) {
    sendPushNotification("Jet Home", message);
  }
}

function evaluateSchedule() {
  if (stateManager.alarmMode !== "schedule") return;

  const onTime = stateManager.alarmScheduleOn;
  const offTime = stateManager.alarmScheduleOff;
  if (!onTime || !offTime) return;

  const currentTime = new Date().toTimeString().slice(0, 5);
  const shouldBeOn = currentTime >= onTime && currentTime < offTime;

  applyAlarmState(
    shouldBeOn,
    shouldBeOn ? "Alarm turned ON (schedule)" : "Alarm turned OFF (schedule)"
  );
}

// Evaluate schedule every 30 seconds
setInterval(evaluateSchedule, 30000);

router.get("/alarm", requireAuth, (req, res) => {
  res.json({
    mode: stateManager.alarmMode,
    scheduleOn: stateManager.alarmScheduleOn,
    scheduleOff: stateManager.alarmScheduleOff,
    status: stateManager.alarmState,
  });
});

router.post("/alarm", requireAuth, (req, res) => {
  const { mode, scheduleOn, scheduleOff } = req.body;

  if (!["on", "schedule", "off"].includes(mode)) {
    return res.status(400).json({ error: "Invalid mode" });
  }

  if (mode === "on") {
    stateManager.alarmMode = "on";
    applyAlarmState(true, "Alarm system turned ON");
  } else if (mode === "off") {
    stateManager.alarmMode = "off";
    applyAlarmState(false, "Alarm system turned OFF");
  } else {
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(scheduleOn) || !timeRegex.test(scheduleOff)) {
      return res.status(400).json({ error: "Invalid time format" });
    }
    if (scheduleOn >= scheduleOff) {
      return res
        .status(400)
        .json({ error: "Schedule ON must be before OFF" });
    }

    stateManager.alarmMode = "schedule";
    stateManager.alarmScheduleOn = scheduleOn;
    stateManager.alarmScheduleOff = scheduleOff;
    evaluateSchedule();
    sendPushNotification(
      "Jet Home",
      `Alarm scheduled: ON ${scheduleOn}, OFF ${scheduleOff}`
    );
  }

  res.json({
    mode: stateManager.alarmMode,
    scheduleOn: stateManager.alarmScheduleOn,
    scheduleOff: stateManager.alarmScheduleOff,
    status: stateManager.alarmState,
  });
});

export default router;
