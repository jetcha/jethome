import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  VALID_CAMS,
  NORMAL_PRESET_ID,
  PRIVACY_PRESET_ID,
} from "../config/constants.js";
import { gotoPreset } from "./ptz.js";
import { startRecording, stopRecording } from "./recorder.js";

const STATE_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../privacy_state.json"
);

let enabled = false;

function persist() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ enabled }));
  } catch (e) {
    console.error("[Privacy] Failed to persist state:", e.message);
  }
}

function load() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      enabled = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")).enabled === true;
    }
  } catch (e) {
    console.error("[Privacy] Failed to load state:", e.message);
  }
}
load();

export function isPrivacyEnabled() {
  return enabled;
}

// Privacy is global: both cameras are always in the same mode.
export async function setPrivacy(on) {
  enabled = on;
  persist();

  if (on) {
    // Stop recording first so the normal-view segment is finalized & saved
    // before the lens swings away; then move both cameras to the privacy pose.
    for (const camId of VALID_CAMS) stopRecording(camId);
    for (const camId of VALID_CAMS) {
      try {
        await gotoPreset(camId, PRIVACY_PRESET_ID);
      } catch (e) {
        console.error(`[Privacy] ${camId} -> privacy pose failed:`, e.message);
      }
    }
  } else {
    // Return to the normal pose first, then resume recording so we don't
    // capture the camera panning back up.
    for (const camId of VALID_CAMS) {
      try {
        await gotoPreset(camId, NORMAL_PRESET_ID);
      } catch (e) {
        console.error(`[Privacy] ${camId} -> normal pose failed:`, e.message);
      }
    }
    for (const camId of VALID_CAMS) startRecording(camId);
  }

  return enabled;
}
