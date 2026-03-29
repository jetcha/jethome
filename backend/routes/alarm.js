import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { stateManager } from "../services/StateManager.js";
import { publishMqtt } from "../services/mqtt.js";

const router = express.Router();

// Apply alarm state to the physical device via MQTT.
function applyAlarmState(enabled) {
  stateManager.alarmState = enabled;
  publishMqtt("jethome/alarm/set", enabled ? "1" : "0");
}

// Check if the alarm should be on or off based on current time vs schedule.
// Only runs when mode is "schedule" and both times are set.
// Schedule times are "HH:MM" strings (24h) — onTime must be before offTime
// (no midnight crossover), so simple string comparison works.
function evaluateSchedule() {
  if (stateManager.alarmMode !== "schedule") return;

  const onTime = stateManager.alarmScheduleOn;
  const offTime = stateManager.alarmScheduleOff;
  if (!onTime || !offTime) return;

  const currentTime = new Date().toTimeString().slice(0, 5);
  const shouldBeOn = currentTime >= onTime && currentTime < offTime;

  applyAlarmState(shouldBeOn);
}

// Periodically evaluate schedule to auto-arm/disarm at the right times
setInterval(evaluateSchedule, 30000);

router.get("/alarm", requireAuth, (req, res) => {
  res.json({
    mode: stateManager.alarmMode,
    scheduleOn: stateManager.alarmScheduleOn,
    scheduleOff: stateManager.alarmScheduleOff,
    status: stateManager.alarmState,
  });
});

// Set alarm mode and schedule.
// - mode "on"/"off": arm/disarm immediately
// - mode "schedule": switch to schedule mode. If times are provided,
//   validate and store them, then evaluate immediately so the alarm
//   reflects the correct state right away (e.g. if off-time is already
//   past, the alarm disarms instantly instead of waiting for next cycle).
//   If no times provided (user just clicked SCH toggle), only the mode
//   changes — schedule times remain null until the user picks them.
router.post("/alarm", requireAuth, (req, res) => {
  const { mode, scheduleOn, scheduleOff } = req.body;

  if (!["on", "schedule", "off"].includes(mode)) {
    return res.status(400).json({ error: "Invalid mode" });
  }

  if (mode === "on") {
    stateManager.alarmMode = "on";
    applyAlarmState(true);
  } else if (mode === "off") {
    stateManager.alarmMode = "off";
    applyAlarmState(false);
  } else {
    stateManager.alarmMode = "schedule";

    // Only validate and apply times when both are provided
    if (scheduleOn && scheduleOff) {
      const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!timeRegex.test(scheduleOn) || !timeRegex.test(scheduleOff)) {
        return res.status(400).json({ error: "Invalid time format" });
      }
      if (scheduleOn >= scheduleOff) {
        return res
          .status(400)
          .json({ error: "Schedule ON must be before OFF" });
      }

      stateManager.alarmScheduleOn = scheduleOn;
      stateManager.alarmScheduleOff = scheduleOff;
    }

    // Always evaluate when entering schedule mode — saved times may already apply.
    // Safe when times are null: evaluateSchedule() exits early if times aren't set.
    evaluateSchedule();
  }

  res.json({
    mode: stateManager.alarmMode,
    scheduleOn: stateManager.alarmScheduleOn,
    scheduleOff: stateManager.alarmScheduleOff,
    status: stateManager.alarmState,
  });
});

export default router;
