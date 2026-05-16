import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import {
  LIVING_ROOM_CAM_RTSP_URL_MAIN,
  BEDROOM_CAM_RTSP_URL_MAIN,
  RECORDINGS_BASE_DIR,
  SEGMENT_DURATION_SECONDS,
  RETENTION_HOURS,
  RETENTION_CLEANUP_INTERVAL_MS,
  FILENAME_PATTERN,
} from "../config/constants.js";

// If the socket produces no data for this long, FFmpeg gives up and exits
// (microseconds) — covers a clean disconnect / failed reconnect.
const SOCKET_TIMEOUT_US = "5000000"; // 5s

// If FFmpeg produces no stderr progress for this long while it's supposed to
// be recording, the RTSP stream is frozen (half-open TCP after a camera power
// cycle) — kill it so the exit handler restarts it.
const WATCHDOG_SILENCE_MS = 15000;
const WATCHDOG_CHECK_INTERVAL_MS = 5000;

function buildReolinkArgs(rtspUrl, outputPattern) {
  return [
    "-rtsp_transport", "tcp",
    "-timeout", SOCKET_TIMEOUT_US,
    "-i", rtspUrl,
    "-c:v", "copy",
    "-c:a", "copy",
    "-f", "segment",
    "-segment_time", String(SEGMENT_DURATION_SECONDS),
    "-segment_format", "mp4",
    "-reset_timestamps", "1",
    "-strftime", "1",
    outputPattern,
  ];
}

const cameras = {
  living_room_cam: {
    ffmpegProcess: null,
    cleanupInterval: null,
    restartTimeout: null,
    watchdogInterval: null,
    lastOutputAt: 0,
    recording: false,
    dir: "living_room_cam_recordings",
    getArgs(outputPattern) {
      return buildReolinkArgs(LIVING_ROOM_CAM_RTSP_URL_MAIN, outputPattern);
    },
  },
  bedroom_cam: {
    ffmpegProcess: null,
    cleanupInterval: null,
    restartTimeout: null,
    watchdogInterval: null,
    lastOutputAt: 0,
    recording: false,
    dir: "bedroom_cam_recordings",
    getArgs(outputPattern) {
      return buildReolinkArgs(BEDROOM_CAM_RTSP_URL_MAIN, outputPattern);
    },
  },
};

export function getRecordingsPath(camId) {
  return path.resolve(RECORDINGS_BASE_DIR, cameras[camId].dir);
}

export function startRecording(camId) {
  const cam = cameras[camId];
  if (!cam) return;

  const dir = getRecordingsPath(camId);
  fs.mkdirSync(dir, { recursive: true });

  cam.recording = true;

  if (cam.ffmpegProcess) {
    console.log(`[Recorder:${camId}] Already recording`);
    return;
  }

  const outputPattern = path.join(dir, "rec_%Y-%m-%d_%H-%M-%S.mp4");

  cam.ffmpegProcess = spawn("ffmpeg", cam.getArgs(outputPattern));
  cam.lastOutputAt = Date.now();

  cam.ffmpegProcess.stderr.on("data", (data) => {
    cam.lastOutputAt = Date.now();
    const msg = data.toString();
    if (msg.includes("Error") || msg.includes("error")) {
      console.error(`[Recorder:${camId}]`, msg.trim());
    }
  });

  cam.watchdogInterval = setInterval(() => {
    if (!cam.ffmpegProcess) return;
    if (Date.now() - cam.lastOutputAt > WATCHDOG_SILENCE_MS) {
      console.error(
        `[Recorder:${camId}] No output for ${WATCHDOG_SILENCE_MS}ms — stream frozen, killing FFmpeg`
      );
      cam.ffmpegProcess.kill("SIGKILL");
    }
  }, WATCHDOG_CHECK_INTERVAL_MS);

  cam.ffmpegProcess.on("exit", (code) => {
    console.log(`[Recorder:${camId}] FFmpeg exited with code ${code}`);
    cam.ffmpegProcess = null;

    if (cam.watchdogInterval) {
      clearInterval(cam.watchdogInterval);
      cam.watchdogInterval = null;
    }

    if (cam.recording) {
      cam.restartTimeout = setTimeout(() => {
        console.log(`[Recorder:${camId}] Restarting FFmpeg...`);
        startRecording(camId);
      }, 5000);
    }
  });

  console.log(`[Recorder:${camId}] Started recording`);

  if (!cam.cleanupInterval) {
    cleanupOldSegments(camId);
    cam.cleanupInterval = setInterval(
      () => cleanupOldSegments(camId),
      RETENTION_CLEANUP_INTERVAL_MS
    );
  }
}

export function stopRecording(camId) {
  const cam = cameras[camId];
  if (!cam) return;

  cam.recording = false;

  if (cam.restartTimeout) {
    clearTimeout(cam.restartTimeout);
    cam.restartTimeout = null;
  }

  if (cam.cleanupInterval) {
    clearInterval(cam.cleanupInterval);
    cam.cleanupInterval = null;
  }

  if (cam.watchdogInterval) {
    clearInterval(cam.watchdogInterval);
    cam.watchdogInterval = null;
  }

  if (cam.ffmpegProcess) {
    cam.ffmpegProcess.kill("SIGINT");
    cam.ffmpegProcess = null;
    console.log(`[Recorder:${camId}] Stopped recording`);
  }
}

export function getSegments(camId) {
  const dir = getRecordingsPath(camId);

  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => FILENAME_PATTERN.test(f));

  const now = Date.now();

  const segments = files.map((filename) => {
    const filePath = path.join(dir, filename);
    const stat = fs.statSync(filePath);
    const timestamp = parseTimestamp(filename);
    return { filename, timestamp, size: stat.size, mtime: stat.mtimeMs };
  });

  return segments
    .filter((s) => now - s.mtime > 30000)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function parseTimestamp(filename) {
  const match = filename.match(
    /rec_(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})\.mp4/
  );
  if (!match) return "";
  return `${match[1]}T${match[2]}:${match[3]}:${match[4]}`;
}

function cleanupOldSegments(camId) {
  const dir = getRecordingsPath(camId);
  if (!fs.existsSync(dir)) return;

  const cutoff = Date.now() - RETENTION_HOURS * 60 * 60 * 1000;
  const files = fs.readdirSync(dir).filter((f) => FILENAME_PATTERN.test(f));

  for (const filename of files) {
    const timestamp = parseTimestamp(filename);
    if (timestamp && new Date(timestamp).getTime() < cutoff) {
      fs.unlinkSync(path.join(dir, filename));
      console.log(`[Recorder:${camId}] Deleted old segment: ${filename}`);
    }
  }
}
