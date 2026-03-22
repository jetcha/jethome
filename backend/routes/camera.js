import express from "express";
import http from "http";
import { stateManager } from "../services/StateManager.js";

const router = express.Router();

const CAM_HOST = "192.168.1.87";
const CAM_PORT = 8080;

router.get("/cam/video", (req, res) => {
  // Accept token from query param (for <img> tag) or header
  const token =
    req.headers.authorization?.replace("Bearer ", "") || req.query.token;

  if (!token || !stateManager.hasToken(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const role = stateManager.getTokenRole(token);
  if (role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const camReq = http.get(`http://${CAM_HOST}:${CAM_PORT}/video`, (camRes) => {
    res.writeHead(camRes.statusCode, {
      "Content-Type":
        camRes.headers["content-type"] || "multipart/x-mixed-replace",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    camRes.pipe(res);
  });

  camReq.on("error", (err) => {
    console.error("Camera stream error:", err);
    if (!res.headersSent) {
      res.status(502).json({ error: "Camera unavailable" });
    }
  });

  req.on("close", () => {
    camReq.destroy();
  });
});

export default router;
