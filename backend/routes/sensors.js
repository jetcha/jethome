import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { stateManager } from "../services/StateManager.js";

const router = express.Router();

router.get("/doorState", requireAuth, (req, res) => {
  res.json({ opened: stateManager.isDoorOpened });
});

router.get("/windowState", requireAuth, (req, res) => {
  res.json({ opened: stateManager.isWindowOpened });
});

export default router;
