import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import {
  PIXEL6_STREAM_URL,
  PIXEL6_AUDIO_URL,
  PI3_RTSP_URL,
  RECORDINGS_BASE_DIR,
  SEGMENT_DURATION_SECONDS,
  RETENTION_HOURS,
  RETENTION_CLEANUP_INTERVAL_MS,
} from "../config/constants.js";

const FILENAME_PATTERN = /^rec_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.mp4$/;

const cameras = {
  pixel6: {
    ffmpegProcess: null,
    cleanupInterval: null,
    restartTimeout: null,
    recording: false,
    dir: "pixel6_recordings",
    getArgs(outputPattern) {
      return [
        "-i",
        PIXEL6_STREAM_URL,
        "-i",
        PIXEL6_AUDIO_URL,
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "28",
        "-r",
        "24",
        "-c:a",
        "aac",
        "-b:a",
        "96k",
        "-f",
        "segment",
        "-segment_time",
        String(SEGMENT_DURATION_SECONDS),
        "-segment_format",
        "mp4",
        "-reset_timestamps",
        "1",
        "-strftime",
        "1",
        "-movflags",
        "+faststart",
        outputPattern,
      ];
    },
  },
  pi3: {
    ffmpegProcess: null,
    cleanupInterval: null,
    restartTimeout: null,
    recording: false,
    dir: "pi3_recordings",
    getArgs(outputPattern) {
      return [
        "-rtsp_transport",
        "tcp",
        "-i",
        PI3_RTSP_URL,
        "-c:v",
        "copy",
        "-f",
        "segment",
        "-segment_time",
        String(SEGMENT_DURATION_SECONDS),
        "-segment_format",
        "mp4",
        "-reset_timestamps",
        "1",
        "-strftime",
        "1",
        outputPattern,
      ];
    },
  },
};

function getRecordingsPath(camId) {
  return path.resolve(RECORDINGS_BASE_DIR, cameras[camId].dir);
}

export function isRecording(camId) {
  return cameras[camId]?.recording ?? false;
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

  cam.ffmpegProcess.stderr.on("data", (data) => {
    const msg = data.toString();
    if (msg.includes("Error") || msg.includes("error")) {
      console.error(`[Recorder:${camId}]`, msg.trim());
    }
  });

  cam.ffmpegProcess.on("exit", (code) => {
    console.log(`[Recorder:${camId}] FFmpeg exited with code ${code}`);
    cam.ffmpegProcess = null;

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

  const segments = files.map((filename) => {
    const filePath = path.join(dir, filename);
    const stat = fs.statSync(filePath);
    const timestamp = parseTimestamp(filename);
    return { filename, timestamp, size: stat.size };
  });

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
