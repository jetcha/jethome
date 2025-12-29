<template>
  <div class="page-wrapper">
    <div class="page-container">
      <header class="page-header">
        <h1 class="page-title">History</h1>
        <div class="header-actions">
          <button
            class="header-btn"
            :class="{ active: activeLocation === 'indoor' }"
            @click="setLocation('indoor')"
          >
            IN
          </button>
          <button
            class="header-btn"
            :class="{ active: activeLocation === 'outdoor' }"
            @click="setLocation('outdoor')"
          >
            OUT
          </button>
          <button class="header-btn" @click="goBack">BACK</button>
        </div>
      </header>

      <main class="content">
        <section class="chart-section">
          <h2>Temperature (°C)</h2>
          <ClimateChart :data="historyData" dataKey="temperature" />
        </section>

        <section class="chart-section">
          <h2>Humidity (%)</h2>
          <ClimateChart :data="historyData" dataKey="humidity" />
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getClimateHistory } from "../api.js";
import ClimateChart from "../components/ClimateChart.vue";

const router = useRouter();

const activeLocation = ref("indoor");
const indoorHistory = ref([]);
const outdoorHistory = ref([]);
const historyData = ref([]);

async function fetchHistory() {
  try {
    indoorHistory.value = await getClimateHistory("indoor", 48);
    outdoorHistory.value = await getClimateHistory("outdoor", 48);
    updateHistoryData();
  } catch (e) {
    console.error("Failed to fetch climate history:", e);
  }
}

function updateHistoryData() {
  historyData.value =
    activeLocation.value === "indoor"
      ? indoorHistory.value
      : outdoorHistory.value;
}

function setLocation(location) {
  activeLocation.value = location;
  updateHistoryData();
}

function goBack() {
  router.push("/dashboard");
}

onMounted(() => {
  fetchHistory();
});
</script>

<style scoped>
h2 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.chart-section {
  width: 100%;
}
</style>
