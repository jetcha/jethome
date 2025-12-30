import mqtt from "mqtt";
import {
  MQTT_BROKER_URL,
  CLIMATE_DATA_SAVE_INTERVAL_MS,
} from "../config/constants.js";
import { stateManager } from "./StateManager.js";
import { saveClimateReading } from "./database.js";
import { sendPushNotification } from "./push.js";
import { fetchSunTimes, isDark } from "./sunTimes.js";

let mqttClient = null;

export function initMqtt() {
  mqttClient = mqtt.connect(MQTT_BROKER_URL);

  mqttClient.on("connect", async () => {
    console.log("Connected to MQTT broker");
    mqttClient.subscribe("jethome/#", (err) => {
      if (err) console.error("MQTT subscribe error:", err);
    });

    // Sync darkness state on connect
    await syncDarknessState();
  });

  mqttClient.on("message", handleMqttMessage);

  mqttClient.on("error", (err) => {
    console.error("MQTT error:", err);
  });

  return mqttClient;
}

async function handleMqttMessage(topic, message) {
  const value = message.toString();

  switch (topic) {
    case "jethome/frontdoor/climate": {
      try {
        const data = JSON.parse(value);
        stateManager.indoorClimate = {
          temperature: data.temperature,
          humidity: data.humidity,
        };

        if (
          Date.now() - stateManager.lastIndoorClimateSaveTimestamp >=
          CLIMATE_DATA_SAVE_INTERVAL_MS
        ) {
          saveClimateReading("indoor", data.temperature, data.humidity);
          stateManager.updateIndoorClimateSaveTimestamp();
        }
      } catch (e) {
        console.error("Failed to parse indoor climate:", e);
      }
      break;
    }
    case "jethome/balcony/climate": {
      try {
        const data = JSON.parse(value);
        stateManager.outdoorClimate = {
          temperature: data.temperature,
          humidity: data.humidity,
        };

        if (
          Date.now() - stateManager.lastOutdoorClimateSaveTimestamp >=
          CLIMATE_DATA_SAVE_INTERVAL_MS
        ) {
          saveClimateReading("outdoor", data.temperature, data.humidity);
          stateManager.updateOutdoorClimateSaveTimestamp();
        }
      } catch (e) {
        console.error("Failed to parse outdoor climate:", e);
      }
      break;
    }
    case "jethome/door/state": {
      const wasDoorOpened = stateManager.isDoorOpened;
      stateManager.isDoorOpened = value === "1";
      if (
        !wasDoorOpened &&
        stateManager.isDoorOpened &&
        stateManager.alarmState
      ) {
        sendPushNotification("Jet Home", "⚠️ Front Door Opened ⚠️");
      }
      break;
    }
    case "jethome/window/state": {
      const wasWindowOpened = stateManager.isWindowOpened;
      stateManager.isWindowOpened = value === "1";
      if (
        !wasWindowOpened &&
        stateManager.isWindowOpened &&
        stateManager.alarmState
      ) {
        sendPushNotification("Jet Home", "⚠️ Window Opened ⚠️");
      }
      break;
    }
    default: {
      break;
    }
  }
}

export async function syncDarknessState() {
  await fetchSunTimes();
  const dark = isDark();
  if (mqttClient && mqttClient.connected) {
    mqttClient.publish("jethome/light/dark", dark ? "1" : "0", {
      retain: true,
    });
  }
}

export function publishMqtt(topic, message, options = {}) {
  if (mqttClient && mqttClient.connected) {
    mqttClient.publish(topic, message, options);
  } else {
    console.error("MQTT client not connected");
  }
}

export function getMqttClient() {
  return mqttClient;
}
