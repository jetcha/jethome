const API_BASE = "http://localhost:3001";

function getToken() {
  return localStorage.getItem("jet-home-token");
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("jet-home-token", token);
  } else {
    localStorage.removeItem("jet-home-token");
  }
}

export async function api(endpoint, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    setToken(null);
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export async function login(password) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");

  setToken(data.token);
  return data;
}

export async function logout() {
  try {
    await api("/api/logout", { method: "POST" });
  } finally {
    setToken(null);
  }
}

export async function getAlarm() {
  return api("/api/alarm");
}

export async function setAlarm(enabled) {
  return api("/api/alarm", {
    method: "POST",
    body: JSON.stringify({ enabled }),
  });
}

export async function getClimate() {
  return api("/api/climate");
}
