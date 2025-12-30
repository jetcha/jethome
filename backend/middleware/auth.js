import { PASSWORD_ROLES } from "../config/constants.js";
import { stateManager } from "../services/StateManager.js";

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !stateManager.hasToken(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userRole = stateManager.getTokenRole(token);
  next();
}

export function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function login(password) {
  const role = PASSWORD_ROLES[password];
  if (!role) {
    return null;
  }
  const token = generateToken();
  stateManager.addToken(token, role);
  return { token, role };
}

export function logout(token) {
  return stateManager.removeToken(token);
}
