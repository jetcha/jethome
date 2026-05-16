<template>
  <div class="page-wrapper">
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Camera</h1>
        <div class="header-actions">
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
          <button class="header-btn" @click="goToRecordings">REC</button>
          <button class="header-btn" @click="goBack">BACK</button>
        </div>
      </div>
      <div class="content">
        <div class="camera-feed">
          <div v-if="!loaded" class="loading-spinner"></div>
          <img
            v-show="loaded"
            ref="camImg"
            :src="streamUrl"
            alt="Live Camera Feed"
            class="camera-stream"
          />
        </div>

        <div class="ptz-pad">
          <button
            class="ptz-btn ptz-up"
            @mousedown="start('Up')"
            @mouseup="stop"
            @mouseleave="stop"
            @touchstart.prevent="start('Up')"
            @touchend.prevent="stop"
          >
            ▲
          </button>
          <button
            class="ptz-btn ptz-left"
            @mousedown="start('Left')"
            @mouseup="stop"
            @mouseleave="stop"
            @touchstart.prevent="start('Left')"
            @touchend.prevent="stop"
          >
            ◀
          </button>
          <button
            class="ptz-btn ptz-right"
            @mousedown="start('Right')"
            @mouseup="stop"
            @mouseleave="stop"
            @touchstart.prevent="start('Right')"
            @touchend.prevent="stop"
          >
            ▶
          </button>
          <button
            class="ptz-btn ptz-down"
            @mousedown="start('Down')"
            @mouseup="stop"
            @mouseleave="stop"
            @touchstart.prevent="start('Down')"
            @touchend.prevent="stop"
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { getStreamUrl, ptzControl } from "../api.js";

const router = useRouter();
const activeCam = ref("living_room_cam");
const loaded = ref(false);
const camImg = ref(null);
let loadCheckInterval = null;
let moving = false;

const streamUrl = computed(() => getStreamUrl(activeCam.value));

function goBack() {
  router.push("/dashboard");
}

function goToRecordings() {
  router.push("/recordings");
}

function setCam(camId) {
  if (activeCam.value === camId) return;
  stop();
  activeCam.value = camId;
  loaded.value = false;
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

onMounted(() => {
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
  overflow: hidden;
  margin: 0 auto;
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

.ptz-pad {
  display: grid;
  grid-template-columns: repeat(3, 3.5rem);
  grid-template-rows: repeat(3, 3.5rem);
  gap: 0.4rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.ptz-btn {
  border: 1px solid #1c1c1c;
  background: #fff;
  color: #1c1c1c;
  border-radius: 0.6rem;
  font-size: 1.1rem;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.ptz-btn:active {
  background: #1c1c1c;
  color: #fff;
}

.ptz-up {
  grid-column: 2;
  grid-row: 1;
}
.ptz-left {
  grid-column: 1;
  grid-row: 2;
}
.ptz-right {
  grid-column: 3;
  grid-row: 2;
}
.ptz-down {
  grid-column: 2;
  grid-row: 3;
}
</style>
