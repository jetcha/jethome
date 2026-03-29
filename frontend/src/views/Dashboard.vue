<template>
  <div class="page-wrapper">
    <div class="page-container">
      <header class="page-header">
        <h1 class="page-title">Home</h1>
        <div class="header-actions">
          <button class="header-btn refresh-btn" @click="refreshPage">
            <img src="/refresh.svg" alt="Refresh" class="refresh-icon" />
          </button>
          <button v-if="isAdmin" class="header-btn" @click="goToCamera">
            CAM
          </button>
          <button class="header-btn" @click="goToHistory">HIST</button>
          <button class="header-btn" @click="handleLogout">EXIT</button>
        </div>
      </header>

      <main class="content">
        <!-- Alarm Card -->
        <div class="card">
          <div class="card-header">
            <span>Alarm System</span>
          </div>
          <div class="card-content">
            <div class="toggle-switch">
              <div
                class="toggle-slider"
                :class="{ active: alarmEnabled }"
              ></div>
              <span
                class="toggle-option"
                :class="{ selected: alarmEnabled }"
                @click="setAlarmState(true)"
                >ON</span
              >
              <span
                class="toggle-option"
                :class="{ selected: !alarmEnabled }"
                @click="setAlarmState(false)"
                >OFF</span
              >
            </div>
          </div>
        </div>

        <!-- Camera Record Card -->
        <div v-if="isAdmin" class="card">
          <div class="card-header">
            <span>Camera Record</span>
          </div>
          <div class="card-content">
            <div class="toggle-switch">
              <div
                class="toggle-slider"
                :class="{ active: recordingEnabled }"
              ></div>
              <span
                class="toggle-option"
                :class="{ selected: recordingEnabled }"
                @click="setRecordingState(true)"
                >ON</span
              >
              <span
                class="toggle-option"
                :class="{ selected: !recordingEnabled }"
                @click="setRecordingState(false)"
                >OFF</span
              >
            </div>
          </div>
        </div>

        <!-- Indoor Climate Card -->
        <div class="card">
          <div class="card-header">
            <span>Indoor Climate</span>
          </div>
          <div class="card-content">
            <div class="climate-value">
              {{
                temperatureIndoor !== null ? `${temperatureIndoor}°C` : "..."
              }}
              /
              {{ humidityIndoor !== null ? `${humidityIndoor}%` : "..." }}
            </div>
          </div>
        </div>

        <!-- Outdoor Climate Card -->
        <div class="card">
          <div class="card-header">
            <span>Outdoor Climate</span>
          </div>
          <div class="card-content">
            <div class="climate-value">
              {{
                temperatureOutdoor !== null ? `${temperatureOutdoor}°C` : "..."
              }}
              /
              {{ humidityOutdoor !== null ? `${humidityOutdoor}%` : "..." }}
            </div>
          </div>
        </div>

        <!-- Sun Times Card -->
        <div class="card">
          <div class="card-header">
            <span>Sunrise / Sunset</span>
          </div>
          <div class="card-content">
            <div class="sun-time">
              {{ sunrise ?? "..." }} / {{ sunset ?? "..." }}
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import {
  getUserRole,
  logout,
  getAlarm,
  setAlarm,
  getClimateIndoor,
  getClimateOutdoor,
  getVapidPublicKey,
  subscribeToPush,
  getSunTimes,
  getRecording,
  setRecording,
} from "../api.js";
const router = useRouter();

const isAdmin = ref(false);
const alarmEnabled = ref(false);
const alarmLoading = ref(false);
const recordingEnabled = ref(false);
const recordingLoading = ref(false);
const temperatureIndoor = ref(null);
const humidityIndoor = ref(null);
const temperatureOutdoor = ref(null);
const humidityOutdoor = ref(null);
const sunrise = ref(null);
const sunset = ref(null);

let tempInterval = null;

async function fetchAlarm() {
  try {
    const data = await getAlarm();
    alarmEnabled.value = data.enabled;
  } catch (e) {
    console.error("Failed to fetch alarm state:", e);
  }
}

async function setAlarmState(enabled) {
  if (alarmEnabled.value === enabled || alarmLoading.value) return;

  alarmLoading.value = true;
  try {
    const data = await setAlarm(enabled);
    alarmEnabled.value = data.enabled;
  } catch (e) {
    console.error("Failed to set alarm:", e);
  } finally {
    alarmLoading.value = false;
  }
}

async function fetchRecording() {
  try {
    const data = await getRecording();
    recordingEnabled.value = data.enabled;
  } catch (e) {
    console.error("Failed to fetch recording state:", e);
  }
}

async function setRecordingState(enabled) {
  if (recordingEnabled.value === enabled || recordingLoading.value) return;

  recordingLoading.value = true;
  try {
    const data = await setRecording(enabled);
    recordingEnabled.value = data.enabled;
  } catch (e) {
    console.error("Failed to set recording:", e);
  } finally {
    recordingLoading.value = false;
  }
}

async function fetchClimateIndoor() {
  try {
    const data = await getClimateIndoor();
    temperatureIndoor.value = data.temperature;
    humidityIndoor.value = data.humidity;
  } catch (e) {
    console.error("Failed to fetch indoor limate:", e);
  }
}

async function fetchClimateOutdoor() {
  try {
    const data = await getClimateOutdoor();
    temperatureOutdoor.value = data.temperature;
    humidityOutdoor.value = data.humidity;
  } catch (e) {
    console.error("Failed to fetch outdoor climate:", e);
  }
}

async function fetchSunTimes() {
  try {
    const data = await getSunTimes();
    sunrise.value = data.sunrise
      ? new Date(data.sunrise).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : null;
    sunset.value = data.sunset
      ? new Date(data.sunset).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : null;
  } catch (e) {
    console.error("Failed to fetch sun times:", e);
  }
}

async function handleLogout() {
  await logout();
  router.push("/login");
}

async function setupPushNotifications() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("Push not supported");
    return;
  }

  try {
    // Register service worker manually
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("Service worker registered:", registration);

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return;
    }

    const vapidPublicKey = await getVapidPublicKey();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    await subscribeToPush(subscription);
    console.log("Push notifications enabled");
  } catch (err) {
    console.error("Push setup error:", err);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function refreshPage() {
  window.location.reload();
}

function goToCamera() {
  router.push("/camera");
}

function goToHistory() {
  router.push("/history");
}

function handleVisibilityChange() {
  // Refresh data when coming back to the view
  if (document.visibilityState === "visible") {
    fetchAlarm();
    fetchRecording();
    fetchClimateIndoor();
    fetchClimateOutdoor();
    fetchSunTimes();
  }
}

// Update onMounted
onMounted(() => {
  isAdmin.value = getUserRole() === "admin";

  setupPushNotifications();
  fetchAlarm();
  fetchRecording();
  fetchClimateIndoor();
  fetchClimateOutdoor();
  fetchSunTimes();

  tempInterval = setInterval(() => {
    fetchClimateIndoor();
    fetchClimateOutdoor();
    fetchAlarm();
  }, 1000);

  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onUnmounted(() => {
  if (tempInterval) {
    clearInterval(tempInterval);
  }
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<style scoped>
.refresh-icon {
  width: 1rem;
  height: 1rem;
  display: block;
}

.card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0.75rem 0;
}

.card-header {
  font-size: 1rem;
}

.toggle-switch {
  display: flex;
  position: relative;
  border: 1px solid #1c1c1c;
  border-radius: 1rem;
  cursor: pointer;
  width: 6rem;
}

.toggle-slider {
  position: absolute;
  width: 50%;
  height: 100%;
  background: #1c1c1c;
  border-radius: 1rem;
  transition: transform 0.2s ease;
}

.toggle-slider.active {
  transform: translateX(0);
}

.toggle-slider:not(.active) {
  transform: translateX(100%);
}

.toggle-option {
  flex: 1;
  text-align: center;
  padding: 0.4rem 0;
  font-size: 0.9rem;
  z-index: 1;
  color: #1c1c1c;
  transition: color 0.2s;
}

.toggle-option.selected {
  color: #ffffff;
}

.climate-value,
.sun-time {
  font-size: 1rem;
  font-weight: bold;
  color: #1c1c1c;
}
</style>
