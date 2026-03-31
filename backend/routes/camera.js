import express from "express";
import http from "http";
import { spawn } from "child_process";
import path from "path";
import { stateManager } from "../services/StateManager.js";
import {
  getSegments,
  isRecording,
  startRecording,
  stopRecording,
} from "../services/recorder.js";
import {
  PIXEL6_HOST,
  PIXEL6_PORT,
  PI3_RTSP_URL,
  RECORDINGS_BASE_DIR,
} from "../config/constants.js";

const router = express.Router();

const VALID_CAMS = ["pixel6", "pi3"];
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

// Pixel 6 live stream proxy (MJPEG native)
router.get("/cam/pixel6/video", (req, res) => {
  if (!authenticateAdmin(req, res)) return;

  const camReq = http.get(
    `http://${PIXEL6_HOST}:${PIXEL6_PORT}/video`,
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
    console.error("Pixel6 stream error:", err);
    if (!res.headersSent) {
      res.status(502).json({ error: "Camera unavailable" });
    }
  });

  req.on("close", () => {
    camReq.destroy();
  });
});

// Pi3 live stream proxy (RTSP -> MJPEG via FFmpeg)
router.get("/cam/pi3/video", (req, res) => {
  if (!authenticateAdmin(req, res)) return;

  const ffmpeg = spawn("ffmpeg", [
    "-rtsp_transport", "tcp",
    "-i", PI3_RTSP_URL,
    "-f", "mjpeg",
    "-q:v", "5",
    "-r", "15",
    "-an",
    "pipe:1",
  ]);

  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=ffmpeg",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  ffmpeg.stdout.on("data", (chunk) => {
    res.write(
      `--ffmpeg\r\nContent-Type: image/jpeg\r\nContent-Length: ${chunk.length}\r\n\r\n`
    );
    res.write(chunk);
  });

  ffmpeg.stderr.on("data", (data) => {
    const msg = data.toString();
    if (msg.includes("Error") || msg.includes("error")) {
      console.error("[Pi3 stream]", msg.trim());
    }
  });

  ffmpeg.on("exit", () => {
    if (!res.writableEnded) res.end();
  });

  req.on("close", () => {
    ffmpeg.kill("SIGINT");
  });
});

// Get recording state
router.get("/cam/:camId/recording", (req, res) => {
  if (!authenticateAdmin(req, res)) return;
  const { camId } = req.params;
  if (!VALID_CAMS.includes(camId)) return res.status(400).json({ error: "Invalid camera" });
  res.json({ enabled: isRecording(camId) });
});

// Set recording state
router.post("/cam/:camId/recording", (req, res) => {
  if (!authenticateAdmin(req, res)) return;
  const { camId } = req.params;
  if (!VALID_CAMS.includes(camId)) return res.status(400).json({ error: "Invalid camera" });

  const { enabled } = req.body;
  if (enabled) {
    startRecording(camId);
  } else {
    stopRecording(camId);
  }
  res.json({ enabled: isRecording(camId) });
});

// List recordings
router.get("/cam/:camId/recordings", (req, res) => {
  if (!authenticateAdmin(req, res)) return;
  const { camId } = req.params;
  if (!VALID_CAMS.includes(camId)) return res.status(400).json({ error: "Invalid camera" });

  const segments = getSegments(camId);
  res.json({ segments });
});

// Serve a recording file
router.get("/cam/:camId/recordings/:filename", (req, res) => {
  if (!authenticateAdmin(req, res)) return;
  const { camId, filename } = req.params;
  if (!VALID_CAMS.includes(camId)) return res.status(400).json({ error: "Invalid camera" });

  if (!FILENAME_PATTERN.test(filename)) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  const dirName = camId === "pixel6" ? "pixel6_recordings" : "pi3_recordings";
  const filePath = path.resolve(RECORDINGS_BASE_DIR, dirName, filename);
  res.sendFile(filePath);
});

export default router;
