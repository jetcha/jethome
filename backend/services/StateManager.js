/**
 * Centralized state management for Jet Home automation system
 * Uses standard getters/setters for clean, idiomatic JavaScript
 */
class StateManager {
  #state = {
    // Alarm system
    alarmState: false,
    alarmMode: "off", // "on" | "schedule" | "off"
    alarmScheduleOn: null, // "HH:MM" string
    alarmScheduleOff: null, // "HH:MM" string

    // Climate data
    temperatureIndoor: null,
    humidityIndoor: null,
    temperatureOutdoor: null,
    humidityOutdoor: null,

    // Climate save timestamps
    lastIndoorClimateSaveTimestamp: 0,
    lastOutdoorClimateSaveTimestamp: 0,

    // Sun times
    sunriseTime: null,
    sunsetTime: null,
    lastFetchDate: null,
  };

  // Non-primitive state (Maps and Sets)
  #validTokens = new Map();
  #pushSubscriptions = new Set();

  // ============= Alarm System =============

  get alarmState() {
    return this.#state.alarmState;
  }

  set alarmState(value) {
    this.#state.alarmState = Boolean(value);
  }

  get alarmMode() {
    return this.#state.alarmMode;
  }

  set alarmMode(value) {
    const valid = ["on", "schedule", "off"];
    if (!valid.includes(value)) return;
    this.#state.alarmMode = value;
  }

  get alarmScheduleOn() {
    return this.#state.alarmScheduleOn;
  }

  set alarmScheduleOn(value) {
    this.#state.alarmScheduleOn = value;
  }

  get alarmScheduleOff() {
    return this.#state.alarmScheduleOff;
  }

  set alarmScheduleOff(value) {
    this.#state.alarmScheduleOff = value;
  }

  // ============= Climate Data =============

  get temperatureIndoor() {
    return this.#state.temperatureIndoor;
  }

  get humidityIndoor() {
    return this.#state.humidityIndoor;
  }

  get indoorClimate() {
    return {
      temperature: this.#state.temperatureIndoor,
      humidity: this.#state.humidityIndoor,
    };
  }

  set indoorClimate({ temperature, humidity }) {
    this.#state.temperatureIndoor = temperature;
    this.#state.humidityIndoor = humidity;
  }

  get temperatureOutdoor() {
    return this.#state.temperatureOutdoor;
  }

  get humidityOutdoor() {
    return this.#state.humidityOutdoor;
  }

  get outdoorClimate() {
    return {
      temperature: this.#state.temperatureOutdoor,
      humidity: this.#state.humidityOutdoor,
    };
  }

  set outdoorClimate({ temperature, humidity }) {
    this.#state.temperatureOutdoor = temperature;
    this.#state.humidityOutdoor = humidity;
  }

  // ============= Climate Save Timestamps =============

  get lastIndoorClimateSaveTimestamp() {
    return this.#state.lastIndoorClimateSaveTimestamp;
  }

  updateIndoorClimateSaveTimestamp() {
    this.#state.lastIndoorClimateSaveTimestamp = Date.now();
  }

  get lastOutdoorClimateSaveTimestamp() {
    return this.#state.lastOutdoorClimateSaveTimestamp;
  }

  updateOutdoorClimateSaveTimestamp() {
    this.#state.lastOutdoorClimateSaveTimestamp = Date.now();
  }

  // ============= Sun Times =============

  get sunriseTime() {
    return this.#state.sunriseTime;
  }

  get sunsetTime() {
    return this.#state.sunsetTime;
  }

  get lastFetchDate() {
    return this.#state.lastFetchDate;
  }

  setSunTimes(sunrise, sunset, fetchDate) {
    this.#state.sunriseTime = sunrise;
    this.#state.sunsetTime = sunset;
    this.#state.lastFetchDate = fetchDate;
  }

  // ============= Authentication Tokens =============

  get validTokens() {
    return this.#validTokens;
  }

  addToken(token, role) {
    this.#validTokens.set(token, { role });
  }

  removeToken(token) {
    return this.#validTokens.delete(token);
  }

  hasToken(token) {
    return this.#validTokens.has(token);
  }

  getTokenRole(token) {
    return this.#validTokens.get(token)?.role;
  }

  // ============= Push Subscriptions =============

  get pushSubscriptions() {
    return this.#pushSubscriptions;
  }

  addPushSubscription(subscription) {
    this.#pushSubscriptions.add(subscription);
  }

  removePushSubscription(subscription) {
    return this.#pushSubscriptions.delete(subscription);
  }

  // ============= Utilities =============

  getSnapshot() {
    return {
      ...this.#state,
      validTokens: Array.from(this.#validTokens.entries()),
      pushSubscriptions: Array.from(this.#pushSubscriptions),
    };
  }

  reset() {
    // For testing purposes
    this.#state = {
      alarmState: false,
      alarmMode: "off",
      alarmScheduleOn: null,
      alarmScheduleOff: null,

      temperatureIndoor: null,
      humidityIndoor: null,
      temperatureOutdoor: null,
      humidityOutdoor: null,
      lastIndoorClimateSaveTimestamp: 0,
      lastOutdoorClimateSaveTimestamp: 0,
      sunriseTime: null,
      sunsetTime: null,
      lastFetchDate: null,
    };
    this.#validTokens.clear();
    this.#pushSubscriptions.clear();
  }
}

// Export singleton instance
export const stateManager = new StateManager();
