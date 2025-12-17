<template>
  <div class="dashboard">
    <header>
      <h1>Dashboard</h1>
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </header>

    <main>
      <!-- Alarm Card -->
      <div class="card">
        <div class="card-header">
          <span>Alarm System</span>
        </div>
        <div class="card-content">
          <div class="toggle-switch">
            <div class="toggle-slider" :class="{ active: alarmEnabled }"></div>
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
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { logout, getAlarm, setAlarm, getClimate } from "../api.js";

const router = useRouter();

const alarmEnabled = ref(false);
const alarmLoading = ref(false);
const temperature = ref(null);
const humidity = ref(null);

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

async function handleLogout() {
  await logout();
  router.push("/login");
}

onMounted(() => {
  fetchAlarm();
  fetchClimate();
  // Poll climate every 5 seconds (will replace with WebSocket later)
  tempInterval = setInterval(fetchClimate, 5000);
});

onUnmounted(() => {
  if (tempInterval) clearInterval(tempInterval);
});
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
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
  padding: 0.5rem 1rem;
  border-radius: 3rem;
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
  gap: 0.5rem;
}

.card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
}

.card-header {
  font-size: 1rem;
}

.card-content {
}

.toggle-switch {
  display: flex;
  position: relative;
  border: 1px solid #1c1c1c;
  border-radius: 1rem;
  cursor: pointer;
  width: 6.6rem;
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

.temperature {
  font-size: 1rem;
  font-weight: bold;
  color: #1c1c1c;
}

.humidity {
  font-size: 1rem;
  font-weight: bold;
  color: #1c1c1c;
}
</style>
