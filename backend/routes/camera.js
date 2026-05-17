import express from "express";
import { spawn } from "child_process";
import path from "path";
import { stateManager } from "../services/StateManager.js";
import {
  getRecordingsPath,
  getSegments,
} from "../services/recorder.js";
import { ptzControl, setPreset } from "../services/ptz.js";
import { isPrivacyEnabled, setPrivacy } from "../services/privacy.js";
import {
  LIVING_ROOM_CAM_RTSP_URL_SUB,
  BEDROOM_CAM_RTSP_URL_SUB,
  VALID_CAMS,
  FILENAME_PATTERN,
  NORMAL_PRESET_ID,
  PRIVACY_PRESET_ID,
} from "../config/constants.js";

const PRESET_SLOTS = {
  normal: { id: NORMAL_PRESET_ID, name: "Normal" },
  privacy: { id: PRIVACY_PRESET_ID, name: "Privacy" },
};

// Live feed uses the sub-stream (low-res, low-bandwidth). Recordings use main (see recorder.js).
const RTSP_URLS = {
  living_room_cam: LIVING_ROOM_CAM_RTSP_URL_SUB,
  bedroom_cam: BEDROOM_CAM_RTSP_URL_SUB,
};

const router = express.Router();

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

// Live stream proxy (RTSP -> MJPEG via FFmpeg)
// FFmpeg converts the camera's H.264 RTSP stream into JPEG pictures,
// but sends them through the pipe in random-sized chunks.
// We collect chunks into a buffer and look for JPEG start/end markers
// (FFD8 = start, FFD9 = end) to extract complete pictures before sending.
router.get("/cam/:camId/video", (req, res) => {
  if (!authenticateAdmin(req, res)) return;

  const { camId } = req.params;
  const rtspUrl = RTSP_URLS[camId];
  if (!rtspUrl) return res.status(400).json({ error: "Invalid camera" });

  const boundary = "frame";

  const ffmpeg = spawn("ffmpeg", [
    "-fflags", "nobuffer",       // Don't buffer input
    "-flags", "low_delay",       // Low latency decoding
    "-probesize", "32",          // Minimal probing (faster startup)
    "-analyzeduration", "0",     // Skip input analysis delay
    "-rtsp_transport", "tcp",
    "-timeout", "5000000",       // 5s socket timeout: fail fast if RTSP stalls
    "-i", rtspUrl,
    "-vf", "scale=640:-2",
    "-f", "mjpeg",
    "-q:v", "8",                 // Lower quality = smaller JPEGs = faster transfer
    "-r", "10",                  // 10fps is enough for a preview
    "-an",
    "pipe:1",
  ]);

  // Watchdog: if ffmpeg produces no output for 10s (stuck on a dead/maxed-out
  // RTSP connection), kill it and end the response so the camera session is
  // freed and the client can retry instead of spinning forever.
  let lastOutputAt = Date.now();
  const watchdog = setInterval(() => {
    if (Date.now() - lastOutputAt > 10000) {
      console.error(`[${camId} stream] no output for 10s — killing ffmpeg`);
      ffmpeg.kill("SIGKILL");
    }
  }, 3000);

  res.writeHead(200, {
    "Content-Type": `multipart/x-mixed-replace; boundary=${boundary}`,
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Buffer to collect incoming data chunks until we have a full JPEG
  let buffer = Buffer.alloc(0);
  // Only send the latest frame - if a new frame arrives before the
  // previous one finishes sending, skip the old one to prevent backlog
  let sending = false;

  ffmpeg.stdout.on("data", (chunk) => {
    lastOutputAt = Date.now();
    buffer = Buffer.concat([buffer, chunk]);

    // Extract all complete frames, but only keep the latest one
    let latestFrame = null;
    while (true) {
      const soi = buffer.indexOf(Buffer.from([0xff, 0xd8]));
      if (soi === -1) break;

      const eoi = buffer.indexOf(Buffer.from([0xff, 0xd9]), soi + 2);
      if (eoi === -1) break;

      // Keep overwriting - we only want the most recent complete frame
      latestFrame = buffer.subarray(soi, eoi + 2);
      buffer = buffer.subarray(eoi + 2);
    }

    // Send only the latest frame, skip if previous send is still in progress
    if (latestFrame && !sending) {
      sending = true;
      const header = `--${boundary}\r\nContent-Type: image/jpeg\r\nContent-Length: ${latestFrame.length}\r\n\r\n`;
      res.write(header);
      res.write(latestFrame, () => {
        sending = false;
      });
    }
  });

  ffmpeg.stderr.on("data", (data) => {
    lastOutputAt = Date.now();
    const msg = data.toString();
    if (msg.includes("Error") || msg.includes("error")) {
      console.error(`[${camId} stream]`, msg.trim());
    }
  });

  ffmpeg.on("exit", () => {
    clearInterval(watchdog);
    if (!res.writableEnded) res.end();
  });

  req.on("close", () => {
    clearInterval(watchdog);
    ffmpeg.kill("SIGINT");
  });
});

// PTZ control (pan/tilt). op = Up | Down | Left | Right | Stop
const PTZ_OPS = ["Up", "Down", "Left", "Right", "Stop"];
router.post("/cam/:camId/ptz", async (req, res) => {
  if (!authenticateAdmin(req, res)) return;
  const { camId } = req.params;
  if (!VALID_CAMS.includes(camId)) return res.status(400).json({ error: "Invalid camera" });

  const { op } = req.body;
  if (!PTZ_OPS.includes(op)) return res.status(400).json({ error: "Invalid op" });

  try {
    await ptzControl(camId, op);
    res.json({ ok: true });
  } catch (e) {
    console.error(`[PTZ:${camId}]`, e.message);
    res.status(502).json({ error: "PTZ command failed" });
  }
});

// Save the camera's current position into a preset slot. slot = normal | privacy
router.post("/cam/:camId/preset", async (req, res) => {
  if (!authenticateAdmin(req, res)) return;
  const { camId } = req.params;
  if (!VALID_CAMS.includes(camId)) return res.status(400).json({ error: "Invalid camera" });

  const preset = PRESET_SLOTS[req.body.slot];
  if (!preset) return res.status(400).json({ error: "Invalid slot" });

  try {
    await setPreset(camId, preset.id, preset.name);
    res.json({ ok: true });
  } catch (e) {
    console.error(`[Preset:${camId}]`, e.message);
    res.status(502).json({ error: "Save preset failed" });
  }
});

// Privacy mode is global (both cameras together).
router.get("/privacy", (req, res) => {
  if (!authenticateAdmin(req, res)) return;
  res.json({ enabled: isPrivacyEnabled() });
});

router.post("/privacy", async (req, res) => {
  if (!authenticateAdmin(req, res)) return;
  const enabled = req.body.enabled === true;
  try {
    await setPrivacy(enabled);
    res.json({ enabled: isPrivacyEnabled() });
  } catch (e) {
    console.error("[Privacy]", e.message);
    res.status(502).json({ error: "Privacy toggle failed" });
  }
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

  const filePath = path.join(getRecordingsPath(camId), filename);
  res.sendFile(filePath);
});

export default router;
