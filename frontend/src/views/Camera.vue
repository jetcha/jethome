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
          <div v-if="livingRoomStreamUrl && !livingRoomLoaded" class="loading-spinner"></div>
          <img
            v-if="livingRoomStreamUrl"
            v-show="livingRoomLoaded"
            ref="livingRoomImg"
            :src="livingRoomStreamUrl"
            alt="Living Room Camera Feed"
            class="camera-stream"
          />
          <div v-if="!livingRoomStreamUrl" class="camera-offline">Camera Unavailable</div>
        </div>
        <div class="camera-feed">
          <div v-if="bedroomStreamUrl && !bedroomLoaded" class="loading-spinner"></div>
          <img
            v-if="bedroomStreamUrl"
            v-show="bedroomLoaded"
            ref="bedroomImg"
            :src="bedroomStreamUrl"
            alt="Bedroom Camera Feed"
            class="camera-stream"
          />
          <div v-if="!bedroomStreamUrl" class="camera-offline">Camera Unavailable</div>
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
const livingRoomStreamUrl = ref(null);
const bedroomStreamUrl = ref(null);
const livingRoomLoaded = ref(false);
const bedroomLoaded = ref(false);
const livingRoomImg = ref(null);
const bedroomImg = ref(null);
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
    const [livingRoom, bedroom] = await Promise.all([
      getRecording("living_room_cam"),
      getRecording("bedroom_cam"),
    ]);
    recordingEnabled.value = livingRoom.enabled || bedroom.enabled;
  } catch (e) {
    console.error("Failed to fetch recording state:", e);
  }
}

async function setRecordingState(enabled) {
  if (recordingEnabled.value === enabled || recordingLoading.value) return;
  recordingLoading.value = true;
  try {
    await Promise.all([
      setRecording("living_room_cam", enabled),
      setRecording("bedroom_cam", enabled),
    ]);
    recordingEnabled.value = enabled;
  } catch (e) {
    console.error("Failed to set recording:", e);
  } finally {
    recordingLoading.value = false;
  }
}

onMounted(() => {
  livingRoomStreamUrl.value = getStreamUrl("living_room_cam");
  bedroomStreamUrl.value = getStreamUrl("bedroom_cam");
  fetchRecording();
  loadCheckInterval = setInterval(() => {
    if (!livingRoomLoaded.value && livingRoomImg.value && livingRoomImg.value.naturalWidth > 0) {
      livingRoomLoaded.value = true;
    }
    if (!bedroomLoaded.value && bedroomImg.value && bedroomImg.value.naturalWidth > 0) {
      bedroomLoaded.value = true;
    }
    if (livingRoomLoaded.value && bedroomLoaded.value) {
      clearInterval(loadCheckInterval);
    }
  }, 200);
});

onBeforeUnmount(() => {
  clearInterval(loadCheckInterval);
  livingRoomStreamUrl.value = null;
  bedroomStreamUrl.value = null;
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

.camera-offline {
  padding: 3rem;
  text-align: center;
  color: #999;
  aspect-ratio: 7 / 4;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
