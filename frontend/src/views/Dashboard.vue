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
        <!-- Alarm System Card -->
        <div class="card">
          <div class="card-header">
            <span>Alarm System</span>
          </div>
          <div class="card-content">
            <div class="toggle-switch triple">
              <div
                class="toggle-slider"
                :style="{ transform: `translateX(${alarmSliderPosition}%)` }"
              ></div>
              <span
                class="toggle-option"
                :class="{ selected: alarmMode === 'on' }"
                @click="setAlarmModeValue('on')"
                >ON</span
              >
              <span
                class="toggle-option"
                :class="{ selected: alarmMode === 'schedule' }"
                @click="setAlarmModeValue('schedule')"
                >SCH</span
              >
              <span
                class="toggle-option"
                :class="{ selected: alarmMode === 'off' }"
                @click="setAlarmModeValue('off')"
                >OFF</span
              >
            </div>
          </div>
        </div>

        <!-- Schedule On Card -->
        <div class="card" :class="{ disabled: alarmMode !== 'schedule' }">
          <div class="card-header">
            <span>Schedule On</span>
          </div>
          <div class="card-content">
            <input
              type="time"
              v-model="alarmScheduleOn"
              :disabled="alarmMode !== 'schedule'"
              @change="setScheduleTimes"
            />
          </div>
        </div>

        <!-- Schedule Off Card -->
        <div class="card" :class="{ disabled: alarmMode !== 'schedule' }">
          <div class="card-header">
            <span>Schedule Off</span>
          </div>
          <div class="card-content">
            <input
              type="time"
              v-model="alarmScheduleOff"
              :disabled="alarmMode !== 'schedule'"
              @change="setScheduleTimes"
            />
          </div>
        </div>

        <!-- Alarm Status Card -->
        <div class="card">
          <div class="card-header">
            <span>Alarm Status</span>
          </div>
          <div class="card-content">
            <span class="alarm-status">
              {{ alarmStatus ? "ON" : "OFF" }}
            </span>
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
import { ref, computed, onMounted, onUnmounted } from "vue";
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
const alarmMode = ref("off");
const alarmScheduleOn = ref("");
const alarmScheduleOff = ref("");
const alarmStatus = ref(false);
const alarmLoading = ref(false);

const alarmSliderPosition = computed(() => {
  if (alarmMode.value === "on") return 0;
  if (alarmMode.value === "schedule") return 100;
  return 200;
});
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
    alarmMode.value = data.mode;
    alarmScheduleOn.value = data.scheduleOn || "";
    alarmScheduleOff.value = data.scheduleOff || "";
    alarmStatus.value = data.status;
  } catch (e) {
    console.error("Failed to fetch alarm state:", e);
  }
}

async function setAlarmModeValue(mode) {
  if (alarmMode.value === mode || alarmLoading.value) return;
  alarmLoading.value = true;
  try {
    const data = await setAlarm(mode);
    alarmMode.value = data.mode;
    alarmStatus.value = data.status;
  } catch (e) {
    console.error("Failed to set alarm mode:", e);
  } finally {
    alarmLoading.value = false;
  }
}

async function setScheduleTimes() {
  if (!alarmScheduleOn.value || !alarmScheduleOff.value) return;
  if (alarmScheduleOn.value >= alarmScheduleOff.value) return;
  if (alarmLoading.value) return;
  alarmLoading.value = true;
  try {
    const data = await setAlarm(
      "schedule",
      alarmScheduleOn.value,
      alarmScheduleOff.value
    );
    alarmMode.value = data.mode;
    alarmScheduleOn.value = data.scheduleOn || "";
    alarmScheduleOff.value = data.scheduleOff || "";
    alarmStatus.value = data.status;
  } catch (e) {
    console.error("Failed to set schedule:", e);
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

.toggle-switch.triple {
  width: 9rem;
}

.toggle-switch.triple .toggle-slider {
  width: 33.33%;
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

.card.disabled {
  opacity: 0.4;
  pointer-events: none;
}

input[type="time"] {
  background: transparent;
  border: 1px solid #1c1c1c;
  border-radius: 1rem;
  padding: 0.4rem 0.7rem;
  font-size: 0.9rem;
  color: #1c1c1c;
  font-family: inherit;
}

.alarm-status {
  font-size: 1rem;
  font-weight: bold;
  color: #1c1c1c;
}

.climate-value,
.sun-time {
  font-size: 1rem;
  font-weight: bold;
  color: #1c1c1c;
}
</style>
