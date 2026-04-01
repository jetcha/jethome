<template>
  <div class="page-wrapper">
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">
          {{
            selectedSegment
              ? formatTimestamp(selectedSegment.timestamp)
              : "Recordings"
          }}
        </h1>
        <div class="header-actions">
          <template v-if="!selectedSegment">
            <button
              class="header-btn"
              :class="{ active: activeCam === 'pixel6' }"
              @click="setCam('pixel6')"
            >
              PIXEL6
            </button>
            <button
              class="header-btn"
              :class="{ active: activeCam === 'pi3' }"
              @click="setCam('pi3')"
            >
              PI3
            </button>
          </template>
          <button class="header-btn" @click="handleBack">BACK</button>
        </div>
      </div>
      <div class="content">
        <!-- Video Player -->
        <div v-if="selectedSegment" class="player-section">
          <video
            :src="videoSrc"
            class="video-player"
            controls
            autoplay
            @ended="playNext"
          />
        </div>

        <!-- Recordings List -->
        <template v-else>
          <div v-if="loading" class="recordings-empty">Loading...</div>
          <div v-else-if="segments.length === 0" class="recordings-empty">
            No recordings available
          </div>
          <template v-else>
            <div
              v-for="seg in pagedSegments"
              :key="seg.filename"
              class="segment-row"
              @click="selectSegment(seg)"
            >
              <span class="segment-time">
                {{ formatRow(seg.timestamp) }}
              </span>
              <span class="segment-size">{{ formatSize(seg.size) }}</span>
            </div>
            <div
              v-for="n in PAGE_SIZE - pagedSegments.length"
              :key="'placeholder-' + n"
              class="segment-row placeholder"
            >
              &nbsp;
            </div>
            <div v-if="totalPages > 1" class="pagination">
              <button class="header-btn" :disabled="page === 0" @click="page--">
                PREV
              </button>
              <span class="page-info">{{ page + 1 }} / {{ totalPages }}</span>
              <button
                class="header-btn"
                :disabled="page >= totalPages - 1"
                @click="page++"
              >
                NEXT
              </button>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getRecordings, getRecordingUrl } from "../api.js";

const PAGE_SIZE = 8;

const router = useRouter();
const segments = ref([]);
const selectedSegment = ref(null);
const loading = ref(true);
const page = ref(0);
const activeCam = ref("pixel6");

const totalPages = computed(() =>
  Math.max(1, Math.ceil(segments.value.length / PAGE_SIZE))
);

const pagedSegments = computed(() => {
  const start = page.value * PAGE_SIZE;
  return segments.value.slice(start, start + PAGE_SIZE);
});

const videoSrc = computed(() => {
  if (!selectedSegment.value) return null;
  return getRecordingUrl(activeCam.value, selectedSegment.value.filename);
});

function handleBack() {
  if (selectedSegment.value) {
    selectedSegment.value = null;
  } else {
    router.push("/camera");
  }
}

function setCam(camId) {
  if (activeCam.value === camId) return;
  activeCam.value = camId;
  selectedSegment.value = null;
  page.value = 0;
  fetchRecordings();
}

function selectSegment(seg) {
  selectedSegment.value = seg;
}

function playNext() {
  if (!selectedSegment.value) return;
  const idx = segments.value.findIndex(
    (s) => s.filename === selectedSegment.value.filename
  );
  if (idx > 0) {
    selectedSegment.value = segments.value[idx - 1];
  }
}

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatRow(ts) {
  return new Date(ts).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

async function fetchRecordings() {
  loading.value = true;
  try {
    const data = await getRecordings(activeCam.value);
    segments.value = data.segments;
  } catch (e) {
    console.error("Failed to fetch recordings:", e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchRecordings();
});
</script>

<style scoped>
.player-section {
  margin-bottom: 1.5rem;
}

.video-player {
  width: 100%;
  display: block;
  border-radius: 0.5rem;
  background: #000;
}

.recordings-empty {
  color: #999;
  text-align: center;
  padding: 2rem 0;
}

.segment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background 0.15s;
}

.segment-row:not(.placeholder):hover {
  background: #f0f0f0;
}

.segment-row.placeholder {
  cursor: default;
}

.segment-time {
  font-size: 1rem;
}

.segment-size {
  font-size: 0.9rem;
  color: #999;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.page-info {
  font-size: 0.9rem;
  color: #1c1c1c;
}
</style>
