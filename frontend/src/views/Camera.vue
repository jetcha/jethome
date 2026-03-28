<template>
  <div class="page-wrapper">
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Camera</h1>
        <div class="header-actions">
          <button class="header-btn" @click="goToRecordings">RECORDS</button>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const streamUrl = ref(null);

function goBack() {
  router.push("/dashboard");
}

function goToRecordings() {
  router.push("/recordings");
}

onMounted(() => {
  const token = localStorage.getItem("jet-home-token");
  if (token) {
    streamUrl.value = `/api/cam/video?token=${token}`;
  }
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
  aspect-ratio: 9 / 16;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
