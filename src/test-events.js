import { authManager } from "./modules/auth";
import { notificationsApi } from "./api";

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await authManager.requireAuth();
  } catch {
    return;
  }

  await notificationsApi.connect();

  notificationsApi.subscribeAll((event) => {
    console.log("WS Event received:", event);
  });
});
