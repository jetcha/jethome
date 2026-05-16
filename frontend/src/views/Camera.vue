<template>
  <div class="page-wrapper">
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">
          {{ selectedSegment ? formatTimestamp(selectedSegment.timestamp) : "Camera" }}
        </h1>
        <div class="header-actions">
          <template v-if="!selectedSegment">
            <button
              class="header-btn"
              :class="{ active: activeCam === 'living_room_cam' }"
              @click="setCam('living_room_cam')"
            >
              LIV
            </button>
            <button
              class="header-btn"
              :class="{ active: activeCam === 'bedroom_cam' }"
              @click="setCam('bedroom_cam')"
            >
              BED
            </button>
          </template>
          <button class="header-btn" @click="handleBack">BACK</button>
        </div>
      </div>

      <div class="content">
        <!-- Recording playback -->
        <div v-if="selectedSegment" class="player-section">
          <video
            :src="videoSrc"
            class="video-player"
            controls
            autoplay
            @ended="playNext"
          />
        </div>

        <template v-else>
          <!-- Live feed with tap-to-toggle PTZ overlay -->
          <div class="camera-feed" @click="togglePtz">
            <div v-if="!loaded" class="loading-spinner"></div>
            <img
              v-show="loaded"
              ref="camImg"
              :src="streamUrl"
              alt="Live Camera Feed"
              class="camera-stream"
            />

            <template v-if="showPtz">
              <button
                v-for="dir in DIRS"
                :key="dir.op"
                class="ptz-btn"
                :class="dir.cls"
                @click.stop
                @mousedown.stop="start(dir.op)"
                @mouseup="stop"
                @mouseleave="stop"
                @touchstart.stop.prevent="start(dir.op)"
                @touchend.prevent="stop"
              >
                <img src="/chevron-up.svg" class="ptz-icon" :style="dir.style" />
              </button>
            </template>
          </div>

          <!-- Recordings list -->
          <div v-if="loadingList" class="loading-spinner"></div>
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
              <span class="segment-time">{{ formatTimestamp(seg.timestamp) }}</span>
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
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { getStreamUrl, ptzControl, getRecordings, getRecordingUrl } from "../api.js";

const PAGE_SIZE = 7;

const DIRS = [
  { op: "Up", cls: "ptz-up", style: "" },
  { op: "Right", cls: "ptz-right", style: "transform: rotate(90deg)" },
  { op: "Down", cls: "ptz-down", style: "transform: rotate(180deg)" },
  { op: "Left", cls: "ptz-left", style: "transform: rotate(270deg)" },
];

const router = useRouter();
const activeCam = ref("living_room_cam");
const loaded = ref(false);
const camImg = ref(null);
const showPtz = ref(false);
let loadCheckInterval = null;
let moving = false;

const segments = ref([]);
const selectedSegment = ref(null);
const loadingList = ref(true);
const page = ref(0);

const streamUrl = computed(() => getStreamUrl(activeCam.value));

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
    router.push("/dashboard");
  }
}

function setCam(camId) {
  if (activeCam.value === camId) return;
  stop();
  showPtz.value = false;
  activeCam.value = camId;
  loaded.value = false;
  page.value = 0;
  fetchRecordings();
}

function togglePtz() {
  if (showPtz.value) stop();
  showPtz.value = !showPtz.value;
}

async function start(op) {
  moving = true;
  try {
    await ptzControl(activeCam.value, op);
  } catch (e) {
    console.error("PTZ move failed:", e);
  }
}

async function stop() {
  if (!moving) return;
  moving = false;
  try {
    await ptzControl(activeCam.value, "Stop");
  } catch (e) {
    console.error("PTZ stop failed:", e);
  }
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

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

async function fetchRecordings() {
  loadingList.value = true;
  try {
    const data = await getRecordings(activeCam.value);
    segments.value = data.segments;
  } catch (e) {
    console.error("Failed to fetch recordings:", e);
  } finally {
    loadingList.value = false;
  }
}

onMounted(() => {
  fetchRecordings();
  loadCheckInterval = setInterval(() => {
    if (camImg.value && camImg.value.naturalWidth > 0) {
      loaded.value = true;
    }
  }, 200);
});

onBeforeUnmount(() => {
  clearInterval(loadCheckInterval);
  stop();
});
</script>

<style scoped>
.camera-feed {
  position: relative;
  overflow: hidden;
  margin: 0 auto 1rem;
  aspect-ratio: 7 / 4;
  width: 100%;
}

.camera-feed .loading-spinner {
  height: 100%;
  padding: 0;
}

.camera-stream {
  width: 100%;
  display: block;
}

.ptz-btn {
  position: absolute;
  width: 2.8rem;
  height: 2.8rem;
  border: none;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.ptz-btn:active {
  background: #e0e0e0;
}

.ptz-icon {
  width: 1.4rem;
  height: 1.4rem;
  display: block;
}

.ptz-up {
  top: 0.6rem;
  left: 50%;
  transform: translateX(-50%);
}
.ptz-down {
  bottom: 0.6rem;
  left: 50%;
  transform: translateX(-50%);
}
.ptz-left {
  left: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
}
.ptz-right {
  right: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
}

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
