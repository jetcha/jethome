# Jet Home

Simple home automation dashboard for ESP32 devices.

## Project Structure

```
jet-home/
├── backend/          # Express API server
│   ├── server.js     # Main server (auth + mock endpoints)
│   └── package.json
├── frontend/         # Vue 3 + Vite
│   ├── src/
│   │   ├── views/
│   │   │   ├── Login.vue
│   │   │   └── Dashboard.vue
│   │   ├── api.js    # API client
│   │   ├── App.vue
│   │   └── main.js
│   └── package.json
└── README.md
```

## Quick Start

### 1. Start Backend

```bash
cd backend
npm install
npm run dev
```

Server runs on http://localhost:3001

### 2. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on http://localhost:5173

### 3. Login

Default password: `jethome123`

(Change this in `backend/server.js`)

## Current Features

- [x] Password authentication
- [x] Alarm ON/OFF toggle (mocked)
- [x] Temperature display (mocked, polls every 5s)

## TODO (when hardware arrives)

- [ ] MQTT broker setup (Mosquitto)
- [ ] ESP32 alarm integration
- [ ] ESP32 DHT22 temperature sensor
- [ ] Real-time updates via WebSocket
- [ ] PWA setup (service worker, manifest)
- [ ] Deploy to jethome.duckdns.org

## API Endpoints

| Method | Endpoint     | Description             |
| ------ | ------------ | ----------------------- |
| POST   | /api/login   | Login with password     |
| POST   | /api/logout  | Logout                  |
| GET    | /api/alarm   | Get alarm state         |
| POST   | /api/alarm   | Set alarm state         |
| GET    | /api/climate | Get current temperature |
