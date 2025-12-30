import webpush from "web-push";
import {
  VAPID_EMAIL,
  VAPID_PUBLIC,
  VAPID_PRIVATE,
} from "../config/constants.js";
import { stateManager } from "./StateManager.js";

// Configure VAPID details
webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

export function sendPushNotification(title, body) {
  const payload = JSON.stringify({ title, body });

  stateManager.pushSubscriptions.forEach((sub) => {
    webpush.sendNotification(JSON.parse(sub), payload).catch((err) => {
      console.error("Push error:", err);
      // Remove invalid subscription
      if (err.statusCode === 410) {
        stateManager.removePushSubscription(sub);
      }
    });
  });
}

export function addSubscription(subscription) {
  const subscriptionString = JSON.stringify(subscription);
  stateManager.addPushSubscription(subscriptionString);
}
