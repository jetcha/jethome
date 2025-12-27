<template>
  <div class="dashboard-wrapper">
    <div class="dashboard">
      <header>
        <h1>Home</h1>
        <div class="header-actions">
          <button
            v-if="isAdmin"
            class="test-mode-btn"
            :class="{ active: testModeEnabled }"
            @click="setTestModeState(!testModeEnabled)"
          >
            TEST
          </button>
          <button class="logout-btn" @click="handleLogout">EXIT</button>
        </div>
      </header>

      <main>
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

        <!-- Temperature Indoor Card -->
        <div class="card">
          <div class="card-header">
            <span>Indoor Temperature</span>
          </div>
          <div class="card-content">
            <div class="temperature">
              {{ temperatureIndoor !== null ? `${temperatureIndoor}°C` : "..." }}
            </div>
          </div>
        </div>

        <!-- Humidity Indoor Card -->
        <div class="card">
          <div class="card-header">
            <span>Indoor Humidity</span>
          </div>
          <div class="card-content">
            <div class="humidity">
              {{ humidityIndoor !== null ? `${humidityIndoor}%` : "..." }}
            </div>
          </div>
        </div>

        <!-- Temperature Outdoor Card -->
        <div class="card">
          <div class="card-header">
            <span>Outdoor Temperature</span>
          </div>
          <div class="card-content">
            <div class="temperature">
              {{ temperatureOutdoor !== null ? `${temperatureOutdoor}°C` : "..." }}
            </div>
          </div>
        </div>

        <!-- Humidity Outdoor Card -->
        <div class="card">
          <div class="card-header">
            <span>Outdoor Humidity</span>
          </div>
          <div class="card-content">
            <div class="humidity">
              {{ humidityOutdoor !== null ? `${humidityOutdoor}%` : "..." }}
            </div>
          </div>
        </div>

        <!-- Door Card -->
        <div class="card">
          <div class="card-header">
            <span>Door Status</span>
          </div>
          <div class="card-content">
            <div class="humidity">
              {{ isDoorOpened ? "OPEN" : "CLOSED" }}
            </div>
          </div>
        </div>

        <!-- Window Card -->
        <div class="card">
          <div class="card-header">
            <span>Window Status</span>
          </div>
          <div class="card-content">
            <div class="humidity">
              {{ isWindowOpened ? "OPEN" : "CLOSED" }}
            </div>
          </div>
        </div>

        <!-- Sunrise Card -->
        <div class="card">
          <div class="card-header">
            <span>Sunrise</span>
          </div>
          <div class="card-content">
            <div class="sun-time">{{ sunrise ?? "..." }}</div>
          </div>
        </div>

        <!-- Sunset Card -->
        <div class="card">
          <div class="card-header">
            <span>Sunset</span>
          </div>
          <div class="card-content">
            <div class="sun-time">{{ sunset ?? "..." }}</div>
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
  getDoorState,
  getWindowState,
  getTestMode,
  setTestMode,
  getVapidPublicKey,
  subscribeToPush,
  getSunTimes,
} from "../api.js";
const router = useRouter();

const isAdmin = ref(false);
const alarmEnabled = ref(false);
const alarmLoading = ref(false);
const temperatureIndoor = ref(null);
const humidityIndoor = ref(null);
const temperatureOutdoor = ref(null);
const humidityOutdoor = ref(null);
const isDoorOpened = ref(false);
const isWindowOpened = ref(false);
const testModeEnabled = ref(false);
const testModeLoading = ref(false);
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
  if (alarmEnabled.value === enabled || alarmLoading.value) return; // already in that state, do nothing

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

async function fetchDoorState() {
  try {
    const data = await getDoorState();
    isDoorOpened.value = data.opened;
  } catch (e) {
    console.error("Failed to fetch door state:", e);
  }
}

async function fetchWindowState() {
  try {
    const data = await getWindowState();
    isWindowOpened.value = data.opened;
  } catch (e) {
    console.error("Failed to fetch window state:", e);
  }
}

async function fetchTestMode() {
  try {
    const data = await getTestMode();
    testModeEnabled.value = data.enabled;
  } catch (e) {
    console.error("Failed to fetch test mode:", e);
  }
}

async function setTestModeState(enabled) {
  if (testModeEnabled.value === enabled || testModeLoading.value) return;

  testModeLoading.value = true;
  try {
    const data = await setTestMode(enabled);
    testModeEnabled.value = data.enabled;
  } catch (e) {
    console.error("Failed to set test mode:", e);
  } finally {
    testModeLoading.value = false;
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

// Update onMounted
onMounted(() => {
  isAdmin.value = getUserRole() === "admin";

  setupPushNotifications();
  fetchAlarm();
  fetchClimateIndoor();
  fetchClimateOutdoor();
  fetchDoorState();
  fetchWindowState();
  fetchSunTimes();

  if (isAdmin.value) {
    fetchTestMode();
  }

  tempInterval = setInterval(() => {
    fetchClimateIndoor();
    fetchClimateOutdoor();
    fetchDoorState();
    fetchWindowState();
    fetchAlarm();
    if (isAdmin.value) {
      fetchTestMode();
    }
  }, 1000);
});

onUnmounted(() => {
  if (tempInterval) clearInterval(tempInterval);
});
</script>

<style scoped>
.dashboard-wrapper {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dashboard {
  max-width: 35rem;
  width: 100%;
  padding: 2.3rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #1c1c1c;
}

h1 {
  font-size: 1.5rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.test-mode-btn {
  background: transparent;
  border: 1px solid #1c1c1c;
  color: #1c1c1c;
  font-size: 0.9rem;
  padding: 0.4rem 0.7rem;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.test-mode-btn.active {
  background: #1c1c1c;
  color: #ffffff;
}

.logout-btn {
  background: transparent;
  border: 1px solid #1c1c1c;
  color: #1c1c1c;
  font-size: 0.9rem;
  padding: 0.4rem 0.7rem;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.temperature,
.humidity,
.sun-time {
  font-size: 1rem;
  font-weight: bold;
  color: #1c1c1c;
}
</style>
