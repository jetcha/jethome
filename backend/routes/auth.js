import express from "express";
import { login, logout, requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", (req, res) => {
  const { password } = req.body;
  const result = login(password);

  if (result) {
    res.json({ success: true, ...result });
  } else {
    res.status(401).json({ error: "Wrong password" });
  }
});

router.post("/logout", requireAuth, (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  logout(token);
  res.json({ success: true });
});

export default router;
