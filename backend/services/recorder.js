import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import {
  CAMERA_STREAM_URL,
  RECORDINGS_DIR,
  SEGMENT_DURATION_SECONDS,
  RETENTION_HOURS,
  RETENTION_CLEANUP_INTERVAL_MS,
} from "../config/constants.js";

let ffmpegProcess = null;
let cleanupInterval = null;
let restartTimeout = null;
let recording = false;

const FILENAME_PATTERN = /^rec_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.mp4$/;

function getRecordingsPath() {
  return path.resolve(RECORDINGS_DIR);
}

export function isRecording() {
  return recording;
}

export function startRecording() {
  const dir = getRecordingsPath();
  fs.mkdirSync(dir, { recursive: true });

  recording = true;

  if (ffmpegProcess) {
    console.log("[Recorder] Already recording");
    return;
  }

  const outputPattern = path.join(dir, "rec_%Y-%m-%d_%H-%M-%S.mp4");

  ffmpegProcess = spawn("ffmpeg", [
    "-i", CAMERA_STREAM_URL,
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-crf", "28",
    "-r", "16",
    "-an",
    "-f", "segment",
    "-segment_time", String(SEGMENT_DURATION_SECONDS),
    "-segment_format", "mp4",
    "-reset_timestamps", "1",
    "-strftime", "1",
    "-movflags", "+faststart",
    outputPattern,
  ]);

  ffmpegProcess.stderr.on("data", (data) => {
    // FFmpeg logs to stderr by default, only log errors
    const msg = data.toString();
    if (msg.includes("Error") || msg.includes("error")) {
      console.error("[Recorder]", msg.trim());
    }
  });

  ffmpegProcess.on("exit", (code) => {
    console.log(`[Recorder] FFmpeg exited with code ${code}`);
    ffmpegProcess = null;

    // Only auto-restart if recording is still enabled
    if (recording) {
      restartTimeout = setTimeout(() => {
        console.log("[Recorder] Restarting FFmpeg...");
        startRecording();
      }, 5000);
    }
  });

  console.log("[Recorder] Started recording");

  // Start cleanup interval if not already running
  if (!cleanupInterval) {
    cleanupOldSegments();
    cleanupInterval = setInterval(cleanupOldSegments, RETENTION_CLEANUP_INTERVAL_MS);
  }
}

export function stopRecording() {
  recording = false;

  if (restartTimeout) {
    clearTimeout(restartTimeout);
    restartTimeout = null;
  }

  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }

  if (ffmpegProcess) {
    ffmpegProcess.kill("SIGINT"); // Graceful stop, finalizes current segment
    ffmpegProcess = null;
    console.log("[Recorder] Stopped recording");
  }
}

export function getSegments() {
  const dir = getRecordingsPath();

  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => FILENAME_PATTERN.test(f));

  const segments = files.map((filename) => {
    const filePath = path.join(dir, filename);
    const stat = fs.statSync(filePath);
    const timestamp = parseTimestamp(filename);
    return { filename, timestamp, size: stat.size };
  });

  // Exclude the segment currently being written (modified in the last 30s)
  const now = Date.now();
  return segments
    .filter((s) => {
      const filePath = path.join(dir, s.filename);
      const mtime = fs.statSync(filePath).mtimeMs;
      return now - mtime > 30000;
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function parseTimestamp(filename) {
  // rec_2026-03-28_14-20-00.mp4 -> 2026-03-28T14:20:00
  const match = filename.match(
    /rec_(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})\.mp4/
  );
  if (!match) return "";
  return `${match[1]}T${match[2]}:${match[3]}:${match[4]}`;
}

function cleanupOldSegments() {
  const dir = getRecordingsPath();
  if (!fs.existsSync(dir)) return;

  const cutoff = Date.now() - RETENTION_HOURS * 60 * 60 * 1000;
  const files = fs.readdirSync(dir).filter((f) => FILENAME_PATTERN.test(f));

  for (const filename of files) {
    const timestamp = parseTimestamp(filename);
    if (timestamp && new Date(timestamp).getTime() < cutoff) {
      fs.unlinkSync(path.join(dir, filename));
      console.log(`[Recorder] Deleted old segment: ${filename}`);
    }
  }
}
