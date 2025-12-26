<template>
  <div class="login-container">
    <div class="login-box" :class="{ shake: shaking }">
      <form @submit.prevent="handleLogin">
        <input
          v-model="password"
          type="password"
          placeholder="CODE"
          :disabled="loading"
          autofocus
        />
        <button type="submit" :disabled="loading">
          {{ loading ? "LOGGING IN..." : "ENTER" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { login } from "../api.js";

const router = useRouter();
const password = ref("");
const loading = ref(false);
const shaking = ref(false);

async function handleLogin() {
  if (!password.value) return;

  loading.value = true;

  try {
    await login(password.value);
    router.push("/dashboard");
  } catch (e) {
    shaking.value = true;
    setTimeout(() => (shaking.value = false), 300);
    // clear the input
    password.value = "";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-box {
  text-align: center;
  width: 20rem;
  min-width: 18rem;
  padding: 3rem;
}

.login-box.shake {
  animation: shake 0.3s ease;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-5px);
  }
  40% {
    transform: translateX(5px);
  }
  60% {
    transform: translateX(-5px);
  }
  80% {
    transform: translateX(5px);
  }
}

input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #1c1c1c;
  border-radius: 3rem;
  color: #1c1c1c;
  font-size: 1rem;
  margin-bottom: 1rem;
  text-align: center;
}

input:focus {
  outline: none;
}

button {
  width: 100%;
  padding: 0.6rem;
  border: none;
  border-radius: 3rem;
  color: white;
  background: #1c1c1c;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: #1c1c1cd1;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
