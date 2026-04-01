<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
} from "chart.js";
import "chartjs-adapter-date-fns";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip
);

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  dataKey: {
    type: String,
    required: true, // "temperature" or "humidity"
  },
});

function getTimeUnit(data) {
  if (data.length < 2) return { unit: "day", format: "EEE d", ticks: 7 };
  const first = new Date(data[0].timestamp + "Z");
  const last = new Date(data[data.length - 1].timestamp + "Z");
  const days = (last - first) / (1000 * 60 * 60 * 24);
  if (days <= 7) return { unit: "day", format: "EEE d", ticks: 7 };
  if (days <= 30) return { unit: "day", format: "d MMM", ticks: 10 };
  if (days <= 90) return { unit: "week", format: "d MMM", ticks: 12 };
  return { unit: "month", format: "MMM yyyy", ticks: 12 };
}

const chartCanvas = ref(null);
let chart = null;

function createChart() {
  if (!chartCanvas.value || !props.data.length) return;

  const ctx = chartCanvas.value.getContext("2d");
  const timeConfig = getTimeUnit(props.data);

  chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          data: props.data.map((d) => ({
            x: new Date(d.timestamp + "Z"),
            y: d[props.dataKey],
          })),
          borderColor: "#1c1c1c",
          backgroundColor: "#1c1c1c",
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      scales: {
        x: {
          type: "time",
          time: {
            unit: timeConfig.unit,
            displayFormats: {
              hour: timeConfig.format,
              day: timeConfig.format,
            },
          },
          ticks: {
            maxTicksLimit: timeConfig.ticks,
            color: "#1c1c1c",
          },
          grid: {
            color: "#e0e0e0",
          },
        },
        y: {
          type: "linear",
          position: "left",
          title: {
            display: false,
          },
          ticks: {
            color: "#1c1c1c",
          },
          grid: {
            color: "#e0e0e0",
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "#1c1c1c",
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
        },
      },
    },
  });
}

function updateChart() {
  if (!chart) {
    createChart();
    return;
  }

  const newTimeConfig = getTimeUnit(props.data);
  const currentUnit = chart.options.scales.x.time.unit;

  // Recreate chart only when time scale changes so axis adapts
  if (newTimeConfig.unit !== currentUnit) {
    chart.destroy();
    chart = null;
    createChart();
    return;
  }

  // Otherwise just update data in-place
  chart.data.datasets[0].data = props.data.map((d) => ({
    x: new Date(d.timestamp + "Z"),
    y: d[props.dataKey],
  }));
  chart.update();
}

watch(() => props.data, updateChart, { deep: true });

onMounted(() => {
  createChart();
});

onUnmounted(() => {
  if (chart) {
    chart.destroy();
  }
});
</script>

<style scoped>
.chart-container {
  height: 14rem;
  width: 100%;
}
</style>
