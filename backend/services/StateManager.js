/**
 * Centralized state management for Jet Home automation system
 * Uses standard getters/setters for clean, idiomatic JavaScript
 */
class StateManager {
  #state = {
    // Alarm system
    alarmState: false,
    testMode: false,

    // Sensors
    isDoorOpened: false,
    isWindowOpened: false,

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
  #listeners = new Map();

  // ============= Alarm System =============

  get alarmState() {
    return this.#state.alarmState;
  }

  set alarmState(value) {
    const oldValue = this.#state.alarmState;
    this.#state.alarmState = Boolean(value);
    if (oldValue !== this.#state.alarmState) {
      this.#emit("alarmStateChange", this.#state.alarmState);
    }
  }

  get testMode() {
    return this.#state.testMode;
  }

  set testMode(value) {
    this.#state.testMode = Boolean(value);
  }

  // ============= Sensor States =============

  get isDoorOpened() {
    return this.#state.isDoorOpened;
  }

  set isDoorOpened(value) {
    const wasOpened = this.#state.isDoorOpened;
    this.#state.isDoorOpened = Boolean(value);

    // Emit event when door opens (was closed, now open)
    if (!wasOpened && this.#state.isDoorOpened) {
      this.#emit("doorOpened");
    }
  }

  get isWindowOpened() {
    return this.#state.isWindowOpened;
  }

  set isWindowOpened(value) {
    const wasOpened = this.#state.isWindowOpened;
    this.#state.isWindowOpened = Boolean(value);

    // Emit event when window opens (was closed, now open)
    if (!wasOpened && this.#state.isWindowOpened) {
      this.#emit("windowOpened");
    }
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
    this.#emit("indoorClimateUpdate", { temperature, humidity });
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
    this.#emit("outdoorClimateUpdate", { temperature, humidity });
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

  // ============= Event System =============

  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, []);
    }
    this.#listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.#listeners.has(event)) return;
    const callbacks = this.#listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  #emit(event, data) {
    const callbacks = this.#listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in event listener for ${event}:`, err);
        }
      });
    }
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
      testMode: false,
      isDoorOpened: false,
      isWindowOpened: false,
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
