<template>
  <div class="dashboard-wrapper">
    <div class="dashboard">
      <header>
        <h1>Home</h1>
        <button class="logout-btn" @click="handleLogout">Exit</button>
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

        <!-- Test Mode Card -->
        <div class="card">
          <div class="card-header">
            <span>Test Mode</span>
          </div>
          <div class="card-content">
            <div class="toggle-switch">
              <div
                class="toggle-slider"
                :class="{ active: testModeEnabled }"
              ></div>
              <span
                class="toggle-option"
                :class="{ selected: testModeEnabled }"
                @click="setTestModeState(true)"
                >ON</span
              >
              <span
                class="toggle-option"
                :class="{ selected: !testModeEnabled }"
                @click="setTestModeState(false)"
                >OFF</span
              >
            </div>
          </div>
        </div>

        <!-- Temperature Card -->
        <div class="card">
          <div class="card-header">
            <span>Temperature</span>
          </div>
          <div class="card-content">
            <div class="temperature">
              {{ temperature !== null ? `${temperature}°C` : "..." }}
            </div>
          </div>
        </div>

        <!-- Humidity Card -->
        <div class="card">
          <div class="card-header">
            <span>Humidity</span>
          </div>
          <div class="card-content">
            <div class="humidity">
              {{ humidity !== null ? `${humidity}%` : "..." }}
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
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import {
  logout,
  getAlarm,
  setAlarm,
  getClimate,
  getDoorState,
  getWindowState,
  getTestMode,
  setTestMode,
} from "../api.js";
const router = useRouter();

const alarmEnabled = ref(false);
const alarmLoading = ref(false);
const temperature = ref(null);
const humidity = ref(null);
const isDoorOpened = ref(false);
const isWindowOpened = ref(false);
const testModeEnabled = ref(false);
const testModeLoading = ref(false);

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

async function fetchClimate() {
  try {
    const data = await getClimate();
    temperature.value = data.temperature;
    humidity.value = data.humidity;
  } catch (e) {
    console.error("Failed to fetch climate:", e);
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

async function handleLogout() {
  await logout();
  router.push("/login");
}

// Update onMounted
onMounted(() => {
  fetchAlarm();
  fetchTestMode();
  fetchClimate();
  fetchDoorState();
  fetchWindowState();
  tempInterval = setInterval(() => {
    fetchClimate();
    fetchDoorState();
    fetchWindowState();
  }, 1000);
});

onUnmounted(() => {
  if (tempInterval) clearInterval(tempInterval);
});
</script>

<style scoped>
.dashboard-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dashboard {
  padding: 1rem;
  max-width: 35rem;
  width: 100%;
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

.logout-btn:hover {
  border-color: #1c1c1cd1;
  color: #1c1c1cd1;
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
.humidity {
  font-size: 1rem;
  font-weight: bold;
  color: #1c1c1c;
}
</style>
