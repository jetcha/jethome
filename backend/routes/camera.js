import express from "express";
import http from "http";
import path from "path";
import { stateManager } from "../services/StateManager.js";
import { getSegments } from "../services/recorder.js";
import {
  CAMERA_HOST,
  CAMERA_PORT,
  RECORDINGS_DIR,
} from "../config/constants.js";

const router = express.Router();

const FILENAME_PATTERN = /^rec_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.mp4$/;

function authenticateAdmin(req, res) {
  const token =
    req.headers.authorization?.replace("Bearer ", "") || req.query.token;

  if (!token || !stateManager.hasToken(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  const role = stateManager.getTokenRole(token);
  if (role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }

  return true;
}

// Live stream proxy
router.get("/cam/video", (req, res) => {
  if (!authenticateAdmin(req, res)) return;

  const camReq = http.get(
    `http://${CAMERA_HOST}:${CAMERA_PORT}/video`,
    (camRes) => {
      res.writeHead(camRes.statusCode, {
        "Content-Type":
          camRes.headers["content-type"] || "multipart/x-mixed-replace",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      camRes.pipe(res);
    }
  );

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

// List recordings
router.get("/cam/recordings", (req, res) => {
  if (!authenticateAdmin(req, res)) return;

  const segments = getSegments();
  res.json({ segments });
});

// Serve a recording file
router.get("/cam/recordings/:filename", (req, res) => {
  if (!authenticateAdmin(req, res)) return;

  const { filename } = req.params;

  if (!FILENAME_PATTERN.test(filename)) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  const filePath = path.resolve(RECORDINGS_DIR, filename);
  res.sendFile(filePath);
});

export default router;
