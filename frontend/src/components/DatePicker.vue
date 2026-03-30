<template>
  <div class="date-picker">
    <input
      type="text"
      inputmode="numeric"
      maxlength="2"
      placeholder="DD"
      :value="day"
      @input="onDayInput"
      @blur="padAndEmit"
    />
    <span class="date-separator">/</span>
    <input
      ref="monthInput"
      type="text"
      inputmode="numeric"
      maxlength="2"
      placeholder="MM"
      :value="month"
      @input="onMonthInput"
      @blur="padAndEmit"
    />
    <span class="date-separator">/</span>
    <input
      ref="yearInput"
      type="text"
      inputmode="numeric"
      maxlength="4"
      placeholder="YYYY"
      :value="year"
      @input="onYearInput"
      @blur="padAndEmit"
    />
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "" }, // "YYYY-MM-DD"
});

const emit = defineEmits(["update:modelValue"]);

const day = ref("");
const month = ref("");
const year = ref("");

const monthInput = ref(null);
const yearInput = ref(null);

watch(
  () => props.modelValue,
  (val) => {
    if (val && val.includes("-")) {
      const parts = val.split("-");
      year.value = parts[0];
      month.value = parts[1];
      day.value = parts[2];
    }
  },
  { immediate: true }
);

function daysInMonth(m, y) {
  const mi = parseInt(m, 10);
  const yi = parseInt(y, 10) || 2024;
  if ([4, 6, 9, 11].includes(mi)) return 30;
  if (mi === 2) {
    return yi % 4 === 0 && (yi % 100 !== 0 || yi % 400 === 0) ? 29 : 28;
  }
  return 31;
}

function onDayInput(event) {
  const raw = event.target.value.replace(/\D/g, "");
  if (raw.length < 2) {
    event.target.value = raw;
    day.value = raw;
    return;
  }
  const num = parseInt(raw, 10);
  const max = daysInMonth(month.value, year.value);
  if (num < 1 || num > max) {
    event.target.value = "";
    day.value = "";
    return;
  }
  const padded = raw.slice(0, 2).padStart(2, "0");
  event.target.value = padded;
  day.value = padded;
  monthInput.value?.focus();
  emitIfValid();
}

function onMonthInput(event) {
  const raw = event.target.value.replace(/\D/g, "");
  if (raw.length < 2) {
    event.target.value = raw;
    month.value = raw;
    return;
  }
  const num = parseInt(raw, 10);
  if (num < 1 || num > 12) {
    event.target.value = "";
    month.value = "";
    return;
  }
  const padded = raw.slice(0, 2).padStart(2, "0");
  event.target.value = padded;
  month.value = padded;
  // Re-validate day against new month
  if (day.value) {
    const max = daysInMonth(padded, year.value);
    if (parseInt(day.value, 10) > max) {
      day.value = "";
    }
  }
  yearInput.value?.focus();
  emitIfValid();
}

function onYearInput(event) {
  const raw = event.target.value.replace(/\D/g, "");
  event.target.value = raw;
  year.value = raw;
  if (raw.length === 4) {
    const num = parseInt(raw, 10);
    if (num < 2020 || num > 2099) {
      event.target.value = "";
      year.value = "";
      return;
    }
    // Re-validate day against new year (leap year)
    if (day.value && month.value) {
      const max = daysInMonth(month.value, raw);
      if (parseInt(day.value, 10) > max) {
        day.value = "";
      }
    }
    emitIfValid();
  }
}

function padAndEmit() {
  if (day.value.length === 1) day.value = day.value.padStart(2, "0");
  if (month.value.length === 1) month.value = month.value.padStart(2, "0");
  emitIfValid();
}

function emitIfValid() {
  if (
    day.value.length === 2 &&
    month.value.length === 2 &&
    year.value.length === 4
  ) {
    const d = parseInt(day.value, 10);
    const m = parseInt(month.value, 10);
    const y = parseInt(year.value, 10);
    const max = daysInMonth(month.value, year.value);
    if (d >= 1 && d <= max && m >= 1 && m <= 12 && y >= 2020 && y <= 2099) {
      emit("update:modelValue", `${year.value}-${month.value}-${day.value}`);
    }
  }
}
</script>

<style scoped>
.date-picker {
  display: flex;
  align-items: center;
  border: 1px solid #1c1c1c;
  border-radius: 1rem;
  padding: 0.4rem;
}

.date-picker input {
  border: none;
  outline: none;
  background: transparent;
  text-align: center;
  font-size: 0.9rem;
  font-family: inherit;
  color: #1c1c1c;
  padding: 0;
}

.date-picker input:nth-child(1),
.date-picker input:nth-child(3) {
  width: 1.8rem;
}

.date-picker input:nth-child(5) {
  width: 2.8rem;
}

.date-separator {
  font-size: 0.9rem;
  color: #1c1c1c;
}
</style>
