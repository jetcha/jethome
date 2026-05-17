// One-off diagnostic: dumps what a Reolink camera's CGI API supports so we can
// find the exact Privacy Mode command for this firmware.
//
//   node probe-camera.js [host]      (default: 192.168.1.90 = bedroom)
//
// Safe & read-only: only logs in and runs Get* queries. Delete after use.

import https from "https";
import { REOLINK_USER, REOLINK_PASS } from "./config/constants.js";

const host = process.argv[2] || "192.168.1.90";
const agent = new https.Agent({ keepAlive: true, rejectUnauthorized: false });

function postJson(query, payload) {
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
        timeout: 8000,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Non-JSON response: ${data.slice(0, 200)}`));
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

async function main() {
  console.log(`\n=== Probing camera at ${host} ===\n`);

  const loginResp = await postJson("cmd=Login", [
    {
      cmd: "Login",
      param: { User: { userName: REOLINK_USER, password: REOLINK_PASS } },
    },
  ]);
  const token = loginResp?.[0]?.value?.Token?.name;
  if (!token) {
    console.error("Login failed:", JSON.stringify(loginResp, null, 2));
    process.exit(1);
  }
  console.log("Login OK, token acquired.\n");

  // Each entry: [label, cgi cmd, request payload]. All read-only Get* calls.
  const probes = [
    ["GetDevInfo (model/firmware)", "GetDevInfo", { cmd: "GetDevInfo", param: {} }],
    ["GetAbility (capabilities)", "GetAbility", { cmd: "GetAbility", param: { User: { userName: REOLINK_USER } } }],
    ["GetPtzGuard (privacy/guard pos)", "GetPtzGuard", { cmd: "GetPtzGuard", action: 1, param: { channel: 0 } }],
    ["GetPtzPreset", "GetPtzPreset", { cmd: "GetPtzPreset", action: 1, param: { channel: 0 } }],
    ["GetAutoFocus", "GetAutoFocus", { cmd: "GetAutoFocus", action: 1, param: { channel: 0 } }],
  ];

  for (const [label, cmd, payload] of probes) {
    try {
      const resp = await postJson(`cmd=${cmd}&token=${token}`, [payload]);
      console.log(`----- ${label} -----`);
      console.log(JSON.stringify(resp, null, 2));
      console.log();
    } catch (e) {
      console.log(`----- ${label} -----`);
      console.log(`ERROR: ${e.message}\n`);
    }
  }

  console.log("=== Done. Paste the full output back. ===\n");
}

main().catch((e) => {
  console.error("Probe failed:", e.message);
  process.exit(1);
});
