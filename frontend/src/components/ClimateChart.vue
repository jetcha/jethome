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

const chartCanvas = ref(null);
let chart = null;

function createChart() {
  if (!chartCanvas.value || !props.data.length) return;

  const ctx = chartCanvas.value.getContext("2d");

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
            displayFormats: {
              hour: "HH:mm",
            },
          },
          ticks: {
            maxTicksLimit: 6,
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
      onHover: (event, elements) => {
        if (elements.length > 0 && navigator.vibrate) {
          navigator.vibrate(1);
        }
      },
    },
  });
}

function updateChart() {
  if (!chart) {
    createChart();
    return;
  }

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
  height: 15rem;
  width: 100%;
}
</style>
