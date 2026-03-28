<template>
  <div class="page-wrapper">
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Camera</h1>
        <div class="header-actions">
          <button class="header-btn" @click="goBack">BACK</button>
        </div>
      </div>
      <div class="content">
        <!-- Live Feed -->
        <div class="camera-feed">
          <img
            v-if="streamUrl"
            :src="streamUrl"
            alt="Live Camera Feed"
            class="camera-stream"
          />
          <div v-else class="camera-offline">Camera Unavailable</div>
        </div>

        <!-- Video Player -->
        <div v-if="selectedSegment" class="player-section">
          <div class="player-header">
            <span class="player-title">{{ formatTimestamp(selectedSegment.timestamp) }}</span>
            <button class="header-btn" @click="closePlayer">CLOSE</button>
          </div>
          <video
            :src="videoSrc"
            class="video-player"
            controls
            autoplay
            @ended="playNext"
          />
        </div>

        <!-- Recordings -->
        <div class="recordings-section">
          <h2 class="section-title">Recordings</h2>
          <div v-if="loading" class="recordings-empty">Loading...</div>
          <div v-else-if="Object.keys(groupedSegments).length === 0" class="recordings-empty">
            No recordings available
          </div>
          <div v-else>
            <div v-for="(hours, date) in groupedSegments" :key="date" class="date-group">
              <div class="date-header">{{ date }}</div>
              <div v-for="(segs, hour) in hours" :key="hour" class="hour-group">
                <div class="hour-header">{{ hour }}</div>
                <div
                  v-for="seg in segs"
                  :key="seg.filename"
                  class="segment-row"
                  :class="{ active: selectedSegment?.filename === seg.filename }"
                  @click="selectSegment(seg)"
                >
                  <span class="segment-time">{{ formatTime(seg.timestamp) }}</span>
                  <span class="segment-size">{{ formatSize(seg.size) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { getRecordings, getRecordingUrl } from "../api.js";

const router = useRouter();
const streamUrl = ref(null);
const segments = ref([]);
const selectedSegment = ref(null);
const loading = ref(true);

function goBack() {
  router.push("/dashboard");
}

const videoSrc = computed(() => {
  if (!selectedSegment.value) return null;
  return getRecordingUrl(selectedSegment.value.filename);
});

const groupedSegments = computed(() => {
  const groups = {};
  for (const seg of segments.value) {
    const dt = new Date(seg.timestamp);
    const date = dt.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const hour = `${String(dt.getHours()).padStart(2, "0")}:00`;

    if (!groups[date]) groups[date] = {};
    if (!groups[date][hour]) groups[date][hour] = [];
    groups[date][hour].push(seg);
  }
  return groups;
});

function selectSegment(seg) {
  selectedSegment.value = seg;
}

function closePlayer() {
  selectedSegment.value = null;
}

function playNext() {
  if (!selectedSegment.value) return;
  const idx = segments.value.findIndex(
    (s) => s.filename === selectedSegment.value.filename
  );
  // Segments are sorted newest-first, so "next" chronologically is idx + 1 going backwards
  // We want to play the next segment in time (the one before in the array)
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

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("en-GB", {
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
    const data = await getRecordings();
    segments.value = data.segments;
  } catch (e) {
    console.error("Failed to fetch recordings:", e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  const token = localStorage.getItem("jet-home-token");
  if (token) {
    streamUrl.value = `/api/cam/video?token=${token}`;
  }
  fetchRecordings();
});

onBeforeUnmount(() => {
  streamUrl.value = null;
  selectedSegment.value = null;
});
</script>

<style scoped>
.camera-feed {
  overflow: hidden;
  margin: 0 auto;
}

.camera-stream {
  width: 100%;
  display: block;
}

.camera-offline {
  padding: 3rem;
  text-align: center;
  color: #999;
  aspect-ratio: 9 / 16;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-section {
  margin-top: 1rem;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.player-title {
  font-weight: bold;
  font-size: 1rem;
}

.video-player {
  width: 100%;
  display: block;
  border-radius: 0.5rem;
  background: #000;
}

.recordings-section {
  margin-top: 1.5rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 0.75rem;
}

.recordings-empty {
  color: #999;
  text-align: center;
  padding: 2rem 0;
}

.date-group {
  margin-bottom: 1rem;
}

.date-header {
  font-weight: bold;
  font-size: 0.95rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid #1c1c1c;
  margin-bottom: 0.25rem;
}

.hour-header {
  font-size: 0.85rem;
  color: #666;
  padding: 0.3rem 0 0.15rem;
}

.segment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background 0.15s;
}

.segment-row:hover {
  background: #f0f0f0;
}

.segment-row.active {
  background: #1c1c1c;
  color: white;
}

.segment-time {
  font-size: 0.95rem;
}

.segment-size {
  font-size: 0.85rem;
  color: #999;
}

.segment-row.active .segment-size {
  color: #ccc;
}
</style>
