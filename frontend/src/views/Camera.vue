<template>
  <div class="page-wrapper">
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Camera</h1>
        <div class="header-actions">
          <button class="header-btn" @click="$router.push('/dashboard')">
            Dashboard
          </button>
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
          <div v-else class="camera-offline">Camera unavailable</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Camera",
  data() {
    return {
      streamUrl: null,
    };
  },
  mounted() {
    const token = localStorage.getItem("jet-home-token");
    if (token) {
      this.streamUrl = `/api/cam/video?token=${token}`;
    }
  },
  beforeUnmount() {
    this.streamUrl = null;
  },
};
</script>

<style scoped>
.camera-feed {
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid #1c1c1c;
}

.camera-stream {
  width: 100%;
  display: block;
}

.camera-offline {
  padding: 3rem;
  text-align: center;
  color: #999;
}
</style>
