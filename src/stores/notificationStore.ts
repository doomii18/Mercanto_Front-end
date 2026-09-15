import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";
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
  const status = ref<"OPEN" | "CONNECTING" | "CLOSED">("CLOSED");
  const recentEvents = ref<NotificationEvent[]>([]);
  const lastRawEvent = shallowRef<NotificationEvent | null>(null);

  let socket: WebSocket | null = null;
  let connectAbortController: AbortController | null = null;

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

    // Cancel any previous in-flight ticket request
    connectAbortController?.abort();
    const controller = new AbortController();
    connectAbortController = controller;

    try {
      const { data, error } = await useApiFetch("/notifications/ticket")
        .post()
        .json<WsTicketResponse>();

      if (controller.signal.aborted) return;
      if (error.value || !data.value) return;

      const { ticket } = WsTicketResponseSchema.parse(data.value);
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const targetUrl = new URL(baseUrl);
      targetUrl.protocol = targetUrl.protocol === "https:" ? "wss:" : "ws:";
      targetUrl.pathname = "/notifications";
      targetUrl.searchParams.set("token", ticket);

      // Close any lingering socket before opening a new one
      socket?.close();

      const ws = new WebSocket(targetUrl.toString());
      socket = ws;
      status.value = "CONNECTING";

      ws.onopen = () => {
        if (socket !== ws) return; // superseded
        status.value = "OPEN";
      };

      ws.onmessage = (event: MessageEvent) => {
        handleIncomingMessage(event.data);
      };

      ws.onerror = () => {
        console.error("[WebSocket] Connection error.");
      };

      ws.onclose = () => {
        if (socket !== ws) return; // superseded
        socket = null;
        status.value = "CLOSED";
      };
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error("[WebSocket] Ticket exchange failed:", err);
      }
    } finally {
      if (connectAbortController === controller) {
        connectAbortController = null;
      }
    }
  }

  function disconnect(): void {
    connectAbortController?.abort();
    connectAbortController = null;
    socket?.close();
    socket = null;
    status.value = "CLOSED";
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
