import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { useAuthStore } from "./authStore";
import { useToastStore } from "./toastStore";
import { notificationBus } from "@/events/notificationEvents";
import { useNotificationEventSource } from "@/api/modules/messaging/notifications/useNotificationsApi";
import type { NotificationEvent } from "@/api";

export const useNotificationStore = defineStore("notification", () => {
  const { status, latestEvent, connect: streamConnect, disconnect: streamDisconnect } =
    useNotificationEventSource();

  const recentEvents = ref<NotificationEvent[]>([]);

  function dispatchToast(event: NotificationEvent) {
    const authStore = useAuthStore();
    const currentUserId = authStore.account?.id;
    const toastStore = useToastStore();

    if (event.type === "NewChatMessage") {
      if (event.sender_id === currentUserId) return;
      toastStore.addToast({
        title: "Nuevo mensaje",
        message: event.content_preview || "Has recibido un nuevo mensaje.",
        icon: "fa-regular fa-comment-dots",
        variant: "info",
        duration: 5000,
      });
    } else if (event.type === "QuoteStatusChanged") {
      toastStore.addToast({
        title: "Pedido actualizado",
        message: `El estado del pedido cambió a "${event.new_status}".`,
        icon: "fa-solid fa-box",
        variant: "success",
        duration: 6000,
      });
    }
  }

  // React to incoming validated events from the SSE stream
  watch(latestEvent, (event) => {
    if (!event) return;

    recentEvents.value.unshift(event);
    if (recentEvents.value.length > 50) {
      recentEvents.value.pop();
    }

    notificationBus.emit(event);
    dispatchToast(event);
  });

  async function connect(): Promise<void> {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return;
    await streamConnect();
  }

  function disconnect(): void {
    streamDisconnect();
    recentEvents.value = [];
  }

  function on(callback: (event: NotificationEvent) => void) {
    return notificationBus.on(callback);
  }

  function onType<T extends NotificationEvent["type"]>(
    type: T,
    callback: (event: Extract<NotificationEvent, { type: T }>) => void,
  ) {
    return notificationBus.on((event) => {
      if (event.type === type) {
        callback(event as Extract<NotificationEvent, { type: T }>);
      }
    });
  }

  return {
    status,
    recentEvents,
    connect,
    disconnect,
    on,
    onType,
  };
});
