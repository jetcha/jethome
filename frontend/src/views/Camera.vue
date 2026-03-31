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
          <img
            v-if="streamUrl"
            :src="streamUrl"
            alt="Live Camera Feed"
            class="camera-stream"
          />
          <div v-else class="camera-offline">Camera Unavailable</div>
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
import { getRecording, setRecording } from "../api.js";

const router = useRouter();
const streamUrl = ref(null);
const recordingEnabled = ref(false);
const recordingLoading = ref(false);

function goBack() {
  router.push("/dashboard");
}

function goToRecordings() {
  router.push("/recordings");
}

async function fetchRecording() {
  try {
    const data = await getRecording();
    recordingEnabled.value = data.enabled;
  } catch (e) {
    console.error("Failed to fetch recording state:", e);
  }
}

async function setRecordingState(enabled) {
  if (recordingEnabled.value === enabled || recordingLoading.value) return;
  recordingLoading.value = true;
  try {
    const data = await setRecording(enabled);
    recordingEnabled.value = data.enabled;
  } catch (e) {
    console.error("Failed to set recording:", e);
  } finally {
    recordingLoading.value = false;
  }
}

onMounted(() => {
  const token = localStorage.getItem("jet-home-token");
  if (token) {
    streamUrl.value = `/api/cam/video?token=${token}`;
  }
  fetchRecording();
});

onBeforeUnmount(() => {
  streamUrl.value = null;
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
  aspect-ratio: 4 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
