<template>
  <div class="page-wrapper">
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Camera</h1>
        <div class="header-actions">
          <button class="header-btn" @click="goToRecordings">REC</button>
          <button class="header-btn" @click="goBack">BACK</button>
        </div>
      </div>
      <div class="content">
        <div class="camera-feed">
          <div v-if="pixel6StreamUrl && !pixel6Loaded" class="loading-spinner"></div>
          <img
            v-if="pixel6StreamUrl"
            v-show="pixel6Loaded"
            ref="pixel6Img"
            :src="pixel6StreamUrl"
            alt="Live Camera Feed"
            class="camera-stream"
          />
          <div v-if="!pixel6StreamUrl" class="camera-offline">Camera Unavailable</div>
        </div>
        <div class="camera-feed">
          <div v-if="pi3StreamUrl && !pi3Loaded" class="loading-spinner"></div>
          <img
            v-if="pi3StreamUrl"
            v-show="pi3Loaded"
            ref="pi3Img"
            :src="pi3StreamUrl"
            alt="Live Camera Feed"
            class="camera-stream"
          />
          <div v-if="!pi3StreamUrl" class="camera-offline">Camera Unavailable</div>
        </div>
        <div class="card-parent">
          <div class="card-header">
            <span>Recording</span>
          </div>
          <div class="toggle-switch">
            <div
              class="toggle-slider"
              :class="{ active: recordingEnabled }"
            ></div>
            <span
              class="toggle-option"
              :class="{ selected: recordingEnabled }"
              @click="setRecordingState(true)"
              >ON</span
            >
            <span
              class="toggle-option"
              :class="{ selected: !recordingEnabled }"
              @click="setRecordingState(false)"
              >OFF</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { getRecording, setRecording, getStreamUrl } from "../api.js";

const router = useRouter();
const pixel6StreamUrl = ref(null);
const pi3StreamUrl = ref(null);
const pixel6Loaded = ref(false);
const pi3Loaded = ref(false);
const pixel6Img = ref(null);
const pi3Img = ref(null);
const recordingEnabled = ref(false);
const recordingLoading = ref(false);
let loadCheckInterval = null;

function goBack() {
  router.push("/dashboard");
}

function goToRecordings() {
  router.push("/recordings");
}

async function fetchRecording() {
  try {
    const [pixel6, pi3] = await Promise.all([
      getRecording("pixel6"),
      getRecording("pi3"),
    ]);
    recordingEnabled.value = pixel6.enabled || pi3.enabled;
  } catch (e) {
    console.error("Failed to fetch recording state:", e);
  }
}

async function setRecordingState(enabled) {
  if (recordingEnabled.value === enabled || recordingLoading.value) return;
  recordingLoading.value = true;
  try {
    await Promise.all([
      setRecording("pixel6", enabled),
      setRecording("pi3", enabled),
    ]);
    recordingEnabled.value = enabled;
  } catch (e) {
    console.error("Failed to set recording:", e);
  } finally {
    recordingLoading.value = false;
  }
}

onMounted(() => {
  pixel6StreamUrl.value = getStreamUrl("pixel6");
  pi3StreamUrl.value = getStreamUrl("pi3");
  fetchRecording();
  loadCheckInterval = setInterval(() => {
    if (!pixel6Loaded.value && pixel6Img.value && pixel6Img.value.naturalWidth > 0) {
      pixel6Loaded.value = true;
    }
    if (!pi3Loaded.value && pi3Img.value && pi3Img.value.naturalWidth > 0) {
      pi3Loaded.value = true;
    }
    if (pixel6Loaded.value && pi3Loaded.value) {
      clearInterval(loadCheckInterval);
    }
  }, 200);
});

onBeforeUnmount(() => {
  clearInterval(loadCheckInterval);
  pixel6StreamUrl.value = null;
  pi3StreamUrl.value = null;
});
</script>

<style scoped>
.camera-feed {
  overflow: hidden;
  margin: 0 auto;
  aspect-ratio: 4 / 3;
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

.camera-offline {
  padding: 3rem;
  text-align: center;
  color: #999;
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
