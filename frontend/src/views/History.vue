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

        <div class="spacer" />

        <div class="card-parent">
          <div class="card-header"><span>Start Date</span></div>
          <div class="card-content">
            <DatePicker
              :modelValue="startDate"
              @update:modelValue="onStartDateChange"
            />
          </div>
        </div>

        <div class="card-parent">
          <div class="card-header"><span>End Date</span></div>
          <div class="card-content">
            <DatePicker
              :modelValue="endDate"
              @update:modelValue="onEndDateChange"
            />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getClimateHistoryByRange } from "../api.js";
import ClimateChart from "../components/ClimateChart.vue";
import DatePicker from "../components/DatePicker.vue";

const router = useRouter();

const activeLocation = ref("indoor");
const indoorHistory = ref([]);
const outdoorHistory = ref([]);
const historyData = ref([]);

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const today = new Date();
const weekAgo = new Date(today);
weekAgo.setDate(weekAgo.getDate() - 7);

const startDate = ref(formatDate(weekAgo));
const endDate = ref(formatDate(today));

async function fetchHistory() {
  // End date is inclusive — query up to the next day
  const endPlusOne = new Date(endDate.value + "T00:00:00");
  endPlusOne.setDate(endPlusOne.getDate() + 1);
  const toParam = formatDate(endPlusOne);

  try {
    indoorHistory.value = await getClimateHistoryByRange(
      "indoor",
      startDate.value,
      toParam
    );
    outdoorHistory.value = await getClimateHistoryByRange(
      "outdoor",
      startDate.value,
      toParam
    );
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

function onStartDateChange(val) {
  if (val > endDate.value) return;
  startDate.value = val;
  fetchHistory();
}

function onEndDateChange(val) {
  if (val < startDate.value) return;
  endDate.value = val;
  fetchHistory();
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
  font-weight: 400;
}

.chart-section {
  width: 100%;
}

.spacer {
  height: 0.8rem;
}
</style>
