import { LATITUDE, LONGITUDE } from "../config/constants.js";
import { stateManager } from "./StateManager.js";

export async function fetchSunTimes() {
  // Only fetch the data once per day
  const today = new Date().toDateString();
  if (stateManager.lastFetchDate === today) {
    return;
  }

  try {
    const res = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${LATITUDE}&lng=${LONGITUDE}&formatted=0`
    );
    const data = await res.json();
    const sunrise = new Date(data.results.sunrise);
    const sunset = new Date(data.results.sunset);
    stateManager.setSunTimes(sunrise, sunset, today);
  } catch (err) {
    console.error("Failed to fetch sun times from the internet:", err);
  }
}

export function isDark() {
  if (!stateManager.sunriseTime || !stateManager.sunsetTime) {
    // Return true (Dark) as a safe default for security lights
    return true;
  }

  // Compare time-of-day only (ignore date portion)
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const sunriseMinutes =
    stateManager.sunriseTime.getHours() * 60 +
    stateManager.sunriseTime.getMinutes();
  const sunsetMinutes =
    stateManager.sunsetTime.getHours() * 60 +
    stateManager.sunsetTime.getMinutes();

  return nowMinutes <= sunriseMinutes || nowMinutes >= sunsetMinutes;
}

export function getSunTimes() {
  return {
    sunrise: stateManager.sunriseTime,
    sunset: stateManager.sunsetTime,
  };
}
