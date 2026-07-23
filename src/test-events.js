import { bootstrapSession, notificationsApi } from "./api";

document.addEventListener('DOMContentLoaded', async () => {
  await bootstrapSession();

  await notificationsApi.connect();

  notificationsApi.subscribeAll((event) => {
    console.log("WS Event received:", event);
  });
});
