import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";
import { useWebSocket } from "@vueuse/core";
import { useApiFetch } from "@/composables/api/useApiFetch";
import { useAuthStore } from "./authStore";
import { useToastStore } from "./toastStore";
import { notificationBus } from "@/events/notificationEvents";
import {
  NotificationEventSchema,
  WsTicketResponseSchema,
} from "@/api/services/notifications/payloads";
import type {
  NotificationEvent,
  WsTicketResponse,
} from "@/api/services/notifications/types";

export const useNotificationStore = defineStore("notification", () => {
  const wsUrl = ref<string>("");
  const recentEvents = ref<NotificationEvent[]>([]);
  const lastRawEvent = shallowRef<NotificationEvent | null>(null);

  const { status, close, open } = useWebSocket(wsUrl, {
    immediate: false,
    autoReconnect: {
      retries: 5,
      delay: 2500,
    },
    onMessage(_ws, event: MessageEvent) {
      handleIncomingMessage(event.data);
    },
  });

  function handleIncomingMessage(rawData: string) {
    try {
      const parsedJson = JSON.parse(rawData);
      const event = NotificationEventSchema.parse(parsedJson);

      lastRawEvent.value = event;
      recentEvents.value.unshift(event);
      if (recentEvents.value.length > 50) {
        recentEvents.value.pop();
      }

      notificationBus.emit(event);
      dispatchToast(event);
    } catch (err) {
      console.error("[WebSocket] Dropped invalid event frame:", err);
    }
  }

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

  async function connect(): Promise<void> {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return;
    if (status.value === "OPEN" || status.value === "CONNECTING") return;

    try {
      const { data, error } = await useApiFetch("/notifications/ticket")
        .post()
        .json<WsTicketResponse>();

      if (error.value || !data.value) return;

      const { ticket } = WsTicketResponseSchema.parse(data.value);
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const targetUrl = new URL(baseUrl);
      targetUrl.protocol = targetUrl.protocol === "https:" ? "wss:" : "ws:";
      targetUrl.pathname = "/notifications";
      targetUrl.searchParams.set("token", ticket);

      wsUrl.value = targetUrl.toString();
      open();
    } catch (err) {
      console.error("[WebSocket] Ticket exchange failed:", err);
    }
  }

  function disconnect(): void {
    close();
    wsUrl.value = "";
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
