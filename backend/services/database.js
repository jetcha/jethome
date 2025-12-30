import Database from "better-sqlite3";
import { DATABASE_PATH } from "../config/constants.js";

// Database setup
export const db = new Database(DATABASE_PATH);

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS climate_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location TEXT NOT NULL,
    temperature REAL,
    humidity REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export function saveClimateReading(location, temperature, humidity) {
  if (temperature === null || humidity === null) {
    return;
  }
  const stmt = db.prepare(
    "INSERT INTO climate_history (location, temperature, humidity) VALUES (?, ?, ?)"
  );
  stmt.run(location, temperature, humidity);
}

export function getClimateHistory(location, hours) {
  const stmt = db.prepare(`
    SELECT temperature, humidity, timestamp
    FROM climate_history
    WHERE location = ?
      AND timestamp > datetime('now', '-' || ? || ' hours')
    ORDER BY timestamp ASC
  `);
  return stmt.all(location, hours);
}
