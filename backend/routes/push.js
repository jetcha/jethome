import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { VAPID_PUBLIC } from "../config/constants.js";
import { addSubscription } from "../services/push.js";

const router = express.Router();

router.get("/vapidPublicKey", (req, res) => {
  res.json({ key: VAPID_PUBLIC });
});

router.post("/push/subscribe", requireAuth, (req, res) => {
  addSubscription(req.body);
  res.json({ success: true });
});

export default router;
