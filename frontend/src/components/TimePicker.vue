<template>
  <div class="time-picker">
    <input
      type="text"
      inputmode="numeric"
      maxlength="2"
      placeholder="HH"
      :value="hour"
      :disabled="disabled"
      @input="onHourInput"
      @blur="emitIfValid"
    />
    <span class="time-separator">:</span>
    <input
      type="text"
      inputmode="numeric"
      maxlength="2"
      placeholder="MM"
      :value="minute"
      :disabled="disabled"
      @input="onMinuteInput"
      @blur="emitIfValid"
    />
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const hour = ref("");
const minute = ref("");

watch(
  () => props.modelValue,
  (val) => {
    if (val && val.includes(":")) {
      hour.value = val.split(":")[0];
      minute.value = val.split(":")[1];
    }
  },
  { immediate: true }
);

function onHourInput(event) {
  const raw = event.target.value.replace(/\D/g, "");
  if (raw.length < 2) {
    event.target.value = raw;
    hour.value = raw;
    return;
  }
  const num = parseInt(raw, 10);
  if (num > 23) {
    event.target.value = "";
    hour.value = "";
    return;
  }
  const padded = raw.slice(0, 2).padStart(2, "0");
  event.target.value = padded;
  hour.value = padded;
  emitIfValid();
}

function onMinuteInput(event) {
  const raw = event.target.value.replace(/\D/g, "");
  if (raw.length < 2) {
    event.target.value = raw;
    minute.value = raw;
    return;
  }
  const num = parseInt(raw, 10);
  if (num > 59) {
    event.target.value = "";
    minute.value = "";
    return;
  }
  const padded = raw.slice(0, 2).padStart(2, "0");
  event.target.value = padded;
  minute.value = padded;
  emitIfValid();
}

function emitIfValid() {
  if (hour.value.length === 2 && minute.value.length === 2) {
    emit("update:modelValue", `${hour.value}:${minute.value}`);
  }
}
</script>

<style scoped>
.time-picker {
  display: flex;
  align-items: center;
  border: 1px solid #1c1c1c;
  border-radius: 1rem;
  padding: 0.3rem 0.5rem;
}

.time-picker input {
  width: 1.8rem;
  border: none;
  outline: none;
  background: transparent;
  text-align: center;
  font-size: 0.9rem;
  font-family: inherit;
  color: #1c1c1c;
  padding: 0;
}

.time-separator {
  font-size: 0.9rem;
  color: #1c1c1c;
}
</style>
