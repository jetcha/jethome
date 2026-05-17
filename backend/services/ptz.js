import https from "https";
import {
  LIVING_ROOM_CAM_HOST,
  BEDROOM_CAM_HOST,
  REOLINK_USER,
  REOLINK_PASS,
} from "../config/constants.js";

const HOSTS = {
  living_room_cam: LIVING_ROOM_CAM_HOST,
  bedroom_cam: BEDROOM_CAM_HOST,
};

// Keep-alive so the TLS handshake happens once, not per command. Cameras use
// self-signed certs, so cert validation is disabled (LAN-only, WAN-firewalled).
const agent = new https.Agent({ keepAlive: true, rejectUnauthorized: false });

const tokens = {}; // camId -> { value, expiresAt }

function postJson(host, query, payload) {
  const body = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host,
        port: 443,
        method: "POST",
        path: `/cgi-bin/api.cgi?${query}`,
        agent,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
        timeout: 5000,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error("Invalid JSON from camera"));
          }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("Camera timeout")));
    req.write(body);
    req.end();
  });
}

async function login(camId) {
  const resp = await postJson(HOSTS[camId], "cmd=Login", [
    {
      cmd: "Login",
      param: { User: { userName: REOLINK_USER, password: REOLINK_PASS } },
    },
  ]);
  const tok = resp?.[0]?.value?.Token;
  if (!tok?.name) throw new Error("Login failed");
  tokens[camId] = {
    value: tok.name,
    // refresh 60s early to avoid using a token that expires mid-request
    expiresAt: Date.now() + ((tok.leaseTime ?? 3600) - 60) * 1000,
  };
  return tokens[camId].value;
}

async function getToken(camId) {
  const t = tokens[camId];
  if (t && t.expiresAt > Date.now()) return t.value;
  return login(camId);
}

// Runs an authenticated CGI command, retrying once if a cached token went
// stale (camera reboot). Throws if the camera rejects the command.
async function runCmd(camId, cmd, payload) {
  const host = HOSTS[camId];
  if (!host) throw new Error("Invalid camera");

  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getToken(camId);
    const resp = await postJson(host, `cmd=${cmd}&token=${token}`, payload);
    if (resp?.[0]?.code === 0) return resp;
    delete tokens[camId];
  }
  throw new Error(`${cmd} rejected by camera`);
}

export async function ptzControl(camId, op) {
  const param =
    op === "Stop" ? { channel: 0, op: "Stop" } : { channel: 0, op, speed: 32 };
  return runCmd(camId, "PtzCtrl", [{ cmd: "PtzCtrl", action: 0, param }]);
}

// Save the camera's CURRENT physical position into a preset slot.
export async function setPreset(camId, id, name) {
  return runCmd(camId, "SetPtzPreset", [
    {
      cmd: "SetPtzPreset",
      action: 0,
      param: { PtzPreset: { channel: 0, enable: 1, id, name } },
    },
  ]);
}

// Move the camera to a previously-saved preset slot.
export async function gotoPreset(camId, id) {
  return runCmd(camId, "PtzCtrl", [
    { cmd: "PtzCtrl", action: 0, param: { channel: 0, op: "ToPos", id, speed: 32 } },
  ]);
}
